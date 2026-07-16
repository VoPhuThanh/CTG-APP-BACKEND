import { Injectable } from '@nestjs/common';
import { lookup } from 'node:dns/promises';
import { readFile, realpath, stat } from 'node:fs/promises';
import { type IncomingMessage, request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { isIP } from 'node:net';
import { basename, isAbsolute, relative, resolve } from 'node:path';

export interface LegacyServiceMediaSourceReadOptions {
  sourceDirectory?: string;
  timeoutMs: number;
  maxBytes: number;
  maxRedirects: number;
}

export interface LegacyServiceMediaSourceFile {
  buffer: Buffer;
  originalFilename: string;
  declaredMimeType: string | null;
  sourceKind: 'remote' | 'source_directory';
}

export class LegacyServiceMediaSourceError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = LegacyServiceMediaSourceError.name;
  }
}

interface DownloadedResponse {
  statusCode: number;
  location: string | null;
  contentType: string | null;
  body: Buffer;
}

@Injectable()
export class LegacyServiceMediaSourceReader {
  async read(
    source: string,
    options: LegacyServiceMediaSourceReadOptions,
  ): Promise<LegacyServiceMediaSourceFile> {
    const normalized = source.trim();
    if (!normalized) {
      throw new LegacyServiceMediaSourceError(
        'empty_source',
        'The legacy media source is empty.',
      );
    }

    if (/^https?:\/\//i.test(normalized)) {
      return this.readRemote(new URL(normalized), options);
    }

    if (/^[a-z][a-z\d+.-]*:/i.test(normalized) || normalized.startsWith('//')) {
      throw new LegacyServiceMediaSourceError(
        'unsupported_source_scheme',
        'Only HTTP(S) URLs and frontend-relative paths are supported.',
      );
    }

    return this.readFromSourceDirectory(normalized, options);
  }

  private async readFromSourceDirectory(
    source: string,
    options: LegacyServiceMediaSourceReadOptions,
  ): Promise<LegacyServiceMediaSourceFile> {
    if (!options.sourceDirectory) {
      throw new LegacyServiceMediaSourceError(
        'source_directory_required',
        'A source directory is required for frontend-relative paths.',
      );
    }

    let decodedPath: string;
    try {
      decodedPath = decodeURIComponent(source.split(/[?#]/, 1)[0]);
    } catch {
      throw new LegacyServiceMediaSourceError(
        'invalid_relative_path',
        'The frontend-relative path contains invalid percent encoding.',
      );
    }

    const relativePath = decodedPath.replace(/^\/+/, '');
    const segments = relativePath.split('/');
    if (
      !relativePath ||
      decodedPath.includes('\\') ||
      decodedPath.includes('\0') ||
      segments.some(
        (segment) => !segment || segment === '.' || segment === '..',
      )
    ) {
      throw new LegacyServiceMediaSourceError(
        'invalid_relative_path',
        'The frontend-relative path is unsafe.',
      );
    }

    const sourceRoot = await realpath(resolve(options.sourceDirectory));
    const requestedPath = resolve(sourceRoot, ...segments);
    const resolvedPath = await realpath(requestedPath).catch(() => null);
    if (!resolvedPath) {
      throw new LegacyServiceMediaSourceError(
        'source_file_not_found',
        'The source file does not exist in the supplied source directory.',
      );
    }

    const relativeResolvedPath = relative(sourceRoot, resolvedPath);
    if (
      relativeResolvedPath.startsWith('..') ||
      isAbsolute(relativeResolvedPath) ||
      relativeResolvedPath === ''
    ) {
      throw new LegacyServiceMediaSourceError(
        'source_path_escape',
        'The source file resolves outside the supplied source directory.',
      );
    }

    const fileStat = await stat(resolvedPath);
    if (!fileStat.isFile()) {
      throw new LegacyServiceMediaSourceError(
        'source_not_file',
        'The resolved source path is not a regular file.',
      );
    }
    if (fileStat.size > options.maxBytes) {
      throw new LegacyServiceMediaSourceError(
        'source_too_large',
        `The source file exceeds the ${options.maxBytes} byte limit.`,
      );
    }

    return {
      buffer: await readFile(resolvedPath),
      originalFilename: basename(resolvedPath),
      declaredMimeType: null,
      sourceKind: 'source_directory',
    };
  }

  private async readRemote(
    initialUrl: URL,
    options: LegacyServiceMediaSourceReadOptions,
  ): Promise<LegacyServiceMediaSourceFile> {
    let currentUrl = initialUrl;

    for (let redirects = 0; ; redirects += 1) {
      this.assertSafeRemoteUrl(currentUrl);
      const addresses = await lookup(currentUrl.hostname, {
        all: true,
        verbatim: true,
      });

      if (
        addresses.length === 0 ||
        addresses.some(({ address }) => !isPublicNetworkAddress(address))
      ) {
        throw new LegacyServiceMediaSourceError(
          'ssrf_address_rejected',
          'The remote host resolves to a non-public or unsupported address.',
        );
      }

      const response = await this.requestPinned(
        currentUrl,
        addresses[0],
        options,
      );

      if (
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.location
      ) {
        if (redirects >= options.maxRedirects) {
          throw new LegacyServiceMediaSourceError(
            'too_many_redirects',
            `The remote source exceeded ${options.maxRedirects} redirects.`,
          );
        }
        currentUrl = new URL(response.location, currentUrl);
        continue;
      }

      if (response.statusCode !== 200) {
        throw new LegacyServiceMediaSourceError(
          'remote_http_error',
          `The remote source returned HTTP ${response.statusCode}.`,
        );
      }

      if (!response.contentType?.startsWith('image/')) {
        throw new LegacyServiceMediaSourceError(
          'remote_content_type_rejected',
          'The remote source did not return an image Content-Type.',
        );
      }

      return {
        buffer: response.body,
        originalFilename:
          basename(decodeURIComponent(currentUrl.pathname)) || 'remote-image',
        declaredMimeType: response.contentType,
        sourceKind: 'remote',
      };
    }
  }

  private assertSafeRemoteUrl(url: URL): void {
    const expectedPort = url.protocol === 'https:' ? '443' : '80';
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      (url.port && url.port !== expectedPort)
    ) {
      throw new LegacyServiceMediaSourceError(
        'remote_url_rejected',
        'Remote imports require credential-free HTTP(S) URLs on standard ports.',
      );
    }
  }

  private requestPinned(
    url: URL,
    address: { address: string; family: number },
    options: LegacyServiceMediaSourceReadOptions,
  ): Promise<DownloadedResponse> {
    return new Promise((resolveResponse, rejectResponse) => {
      const transport = url.protocol === 'https:' ? httpsRequest : httpRequest;
      const request = transport(
        {
          protocol: url.protocol,
          hostname: address.address,
          family: address.family,
          port: url.port || (url.protocol === 'https:' ? 443 : 80),
          path: `${url.pathname}${url.search}`,
          method: 'GET',
          servername: url.hostname,
          headers: {
            Accept: 'image/jpeg,image/png,image/gif,image/webp',
            Host: url.host,
            'User-Agent': 'ctg-service-media-import/1.0',
          },
        },
        (response: IncomingMessage) => {
          const statusCode = response.statusCode ?? 0;
          const headers = response.headers as unknown as Record<
            string,
            unknown
          >;
          const location = readHeaderValue(headers.location);
          const rawContentType = readHeaderValue(headers['content-type']);
          const contentType = rawContentType
            ? rawContentType.split(';', 1)[0].trim().toLowerCase()
            : null;
          const declaredLength = Number(
            readHeaderValue(headers['content-length']),
          );

          if (
            Number.isFinite(declaredLength) &&
            declaredLength > options.maxBytes
          ) {
            response.destroy();
            rejectResponse(
              new LegacyServiceMediaSourceError(
                'source_too_large',
                `The remote source exceeds the ${options.maxBytes} byte limit.`,
              ),
            );
            return;
          }

          if (statusCode >= 300 && statusCode < 400) {
            response.resume();
            response.on('end', () =>
              resolveResponse({
                statusCode,
                location,
                contentType,
                body: Buffer.alloc(0),
              }),
            );
            return;
          }

          const chunks: Buffer[] = [];
          let totalBytes = 0;
          response.on('data', (chunk: Buffer) => {
            totalBytes += chunk.length;
            if (totalBytes > options.maxBytes) {
              response.destroy(
                new LegacyServiceMediaSourceError(
                  'source_too_large',
                  `The remote source exceeds the ${options.maxBytes} byte limit.`,
                ),
              );
              return;
            }
            chunks.push(chunk);
          });
          response.on('end', () =>
            resolveResponse({
              statusCode,
              location,
              contentType,
              body: Buffer.concat(chunks),
            }),
          );
          response.on('error', rejectResponse);
        },
      );

      request.setTimeout(options.timeoutMs, () => {
        request.destroy(
          new LegacyServiceMediaSourceError(
            'remote_timeout',
            `The remote source exceeded the ${options.timeoutMs}ms timeout.`,
          ),
        );
      });
      request.on('error', rejectResponse);
      request.end();
    });
  }
}

export function isPublicNetworkAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) {
    const octets = address.split('.').map(Number);
    const [a, b, c] = octets;

    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 0 && (c === 0 || c === 2)) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51 && c === 100) ||
      (a === 203 && b === 0 && c === 113) ||
      a >= 224
    );
  }

  if (family === 6) {
    const normalized = address.toLowerCase();
    const mappedIpv4 = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
    if (mappedIpv4) return isPublicNetworkAddress(mappedIpv4);

    const firstGroup = Number.parseInt(normalized.split(':', 1)[0] || '0', 16);
    return (
      firstGroup >= 0x2000 &&
      firstGroup <= 0x3fff &&
      !normalized.startsWith('2001:db8:') &&
      !normalized.startsWith('2001:0:')
    );
  }

  return false;
}

function readHeaderValue(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    const firstValue: unknown = value[0];
    return typeof firstValue === 'string' ? firstValue : null;
  }
  return null;
}
