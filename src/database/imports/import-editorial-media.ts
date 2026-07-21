import { AppModule } from '@/app.module';
import { LegacyEditorialMediaImportService } from '@/modules/media-assets/legacy-editorial-media-import.service';
import { NestFactory } from '@nestjs/core';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

interface ImportArguments {
  apply: boolean;
  sourceDirectory?: string;
  reportPath?: string;
  timeoutMs?: number;
  maxRedirects?: number;
}

export function parseEditorialMediaImportArguments(
  argumentsToParse: string[],
  environment: NodeJS.ProcessEnv = process.env,
): ImportArguments {
  const parsed: ImportArguments = {
    apply: environment.npm_config_apply === 'true',
  };

  if (environment.npm_config_source_dir) {
    parsed.sourceDirectory = resolve(environment.npm_config_source_dir);
  }
  if (environment.npm_config_report) {
    parsed.reportPath = resolve(environment.npm_config_report);
  }
  if (environment.npm_config_timeout_ms) {
    parsed.timeoutMs = Number(environment.npm_config_timeout_ms);
  }
  if (environment.npm_config_max_redirects) {
    parsed.maxRedirects = Number(environment.npm_config_max_redirects);
  }

  for (const argument of argumentsToParse) {
    if (argument === '--apply') {
      parsed.apply = true;
    } else if (argument.startsWith('--source-dir=')) {
      parsed.sourceDirectory = resolve(argument.slice('--source-dir='.length));
    } else if (argument.startsWith('--report=')) {
      parsed.reportPath = resolve(argument.slice('--report='.length));
    } else if (argument.startsWith('--timeout-ms=')) {
      parsed.timeoutMs = Number(argument.slice('--timeout-ms='.length));
    } else if (argument.startsWith('--max-redirects=')) {
      parsed.maxRedirects = Number(argument.slice('--max-redirects='.length));
    } else {
      throw new Error(`Unknown import argument: ${argument}`);
    }
  }

  return parsed;
}

async function run(): Promise<void> {
  const args = parseEditorialMediaImportArguments(process.argv.slice(2));
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const importer = app.get(LegacyEditorialMediaImportService);
    const report = await importer.importLegacyMedia({
      dryRun: !args.apply,
      sourceDirectory: args.sourceDirectory,
      timeoutMs: args.timeoutMs,
      maxRedirects: args.maxRedirects,
    });
    const serializedReport = `${JSON.stringify(report, null, 2)}\n`;

    process.stdout.write(serializedReport);
    if (args.reportPath) {
      await writeFile(args.reportPath, serializedReport, { flag: 'w' });
    }

    if (args.apply && report.unresolved.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    await app.close();
  }
}

if (require.main === module) {
  void run().catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.stack : String(error)}\n`,
    );
    process.exitCode = 1;
  });
}
