import { Injectable } from '@nestjs/common';
import { readFile, realpath, stat } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';

export interface LegacyPostContentSourceReadOptions {
  sourceRoot: string;
  maxBytes: number;
}

export interface LegacyPostContentSourceFile {
  html: string;
  byteLength: number;
  resolvedPath: string;
}

export class LegacyPostContentSourceError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = LegacyPostContentSourceError.name;
  }
}

@Injectable()
export class LegacyPostContentSourceReader {
  async read(
    source: string,
    options: LegacyPostContentSourceReadOptions,
  ): Promise<LegacyPostContentSourceFile> {
    const relativePath = this.normalizeRelativePath(source);
    const realSourceRoot = await realpath(resolve(options.sourceRoot));
    const candidatePath = resolve(realSourceRoot, relativePath);

    if (!this.isBelowRoot(realSourceRoot, candidatePath)) {
      throw new LegacyPostContentSourceError(
        'invalid_relative_path',
        'The legacy content path escapes the configured source root.',
      );
    }

    try {
      const [realCandidate, fileStats] = await Promise.all([
        realpath(candidatePath),
        stat(candidatePath),
      ]);

      if (
        !this.isBelowRoot(realSourceRoot, realCandidate) ||
        !fileStats.isFile()
      ) {
        throw new LegacyPostContentSourceError(
          'invalid_relative_path',
          'The legacy content path does not resolve to a file below the configured source root.',
        );
      }

      if (fileStats.size > options.maxBytes) {
        throw new LegacyPostContentSourceError(
          'source_too_large',
          `The legacy content source exceeds the ${options.maxBytes} byte limit.`,
        );
      }

      const buffer = await readFile(realCandidate);
      if (buffer.length > options.maxBytes) {
        throw new LegacyPostContentSourceError(
          'source_too_large',
          `The legacy content source exceeds the ${options.maxBytes} byte limit.`,
        );
      }

      return {
        html: buffer.toString('utf8').replace(/^\uFEFF/, ''),
        byteLength: buffer.length,
        resolvedPath: realCandidate,
      };
    } catch (error) {
      if (error instanceof LegacyPostContentSourceError) throw error;

      const code = (error as NodeJS.ErrnoException).code;
      throw new LegacyPostContentSourceError(
        code === 'ENOENT' ? 'source_not_found' : 'source_read_failed',
        code === 'ENOENT'
          ? 'The legacy content source file was not found.'
          : error instanceof Error
            ? error.message
            : String(error),
      );
    }
  }

  private normalizeRelativePath(source: string): string {
    const value = source.trim();
    if (!value) {
      throw new LegacyPostContentSourceError(
        'empty_source',
        'The legacy content source is empty.',
      );
    }

    if (/^https?:\/\//i.test(value)) {
      throw new LegacyPostContentSourceError(
        'remote_source_not_supported',
        'Remote legacy HTML import is disabled; configure a known local source root.',
      );
    }

    if (
      /^[a-z][a-z\d+.-]*:/i.test(value) ||
      value.startsWith('//') ||
      value.includes('?') ||
      value.includes('#')
    ) {
      throw new LegacyPostContentSourceError(
        'unsupported_source',
        'Only local root-relative or relative HTML fragment paths are supported.',
      );
    }

    let decoded: string;
    try {
      decoded = decodeURIComponent(value);
    } catch {
      throw new LegacyPostContentSourceError(
        'invalid_relative_path',
        'The legacy content path is not valid percent-encoded text.',
      );
    }

    if (decoded.includes('\\') || !decoded.toLowerCase().endsWith('.html')) {
      throw new LegacyPostContentSourceError(
        'invalid_relative_path',
        'The legacy content path must reference an HTML file.',
      );
    }

    const normalized = decoded.replace(/^\/+/, '');
    const segments = normalized.split('/');
    if (
      !normalized ||
      segments.some(
        (segment) => !segment || segment === '.' || segment === '..',
      )
    ) {
      throw new LegacyPostContentSourceError(
        'invalid_relative_path',
        'The legacy content path contains an invalid path segment.',
      );
    }

    return normalized;
  }

  private isBelowRoot(root: string, candidate: string): boolean {
    const pathFromRoot = relative(root, candidate);
    return (
      pathFromRoot.length > 0 &&
      !pathFromRoot.startsWith('..') &&
      !isAbsolute(pathFromRoot)
    );
  }
}
