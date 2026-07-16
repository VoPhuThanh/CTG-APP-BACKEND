import { AppModule } from '@/app.module';
import { LegacyServiceMediaImportService } from '@/modules/services/legacy-service-media-import.service';
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

function parseArguments(argumentsToParse: string[]): ImportArguments {
  const parsed: ImportArguments = { apply: false };

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
  const args = parseArguments(process.argv.slice(2));
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const importer = app.get(LegacyServiceMediaImportService);
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

    if (args.apply && report.summary.stillUnresolved > 0) {
      process.exitCode = 1;
    }
  } finally {
    await app.close();
  }
}

void run().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.stack : String(error)}\n`,
  );
  process.exitCode = 1;
});
