import { AppModule } from '@/app.module';
import { LegacyPostContentImportService } from '@/modules/posts/legacy-post-content-import.service';
import { NestFactory } from '@nestjs/core';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

interface ImportArguments {
  apply: boolean;
  overwriteExisting: boolean;
  sourceRoot?: string;
  reportPath?: string;
}

function parseArguments(argumentsToParse: string[]): ImportArguments {
  const parsed: ImportArguments = {
    apply: false,
    overwriteExisting: false,
  };

  for (const argument of argumentsToParse) {
    if (argument === '--apply') {
      parsed.apply = true;
    } else if (argument === '--overwrite-existing') {
      parsed.overwriteExisting = true;
    } else if (argument.startsWith('--source-root=')) {
      parsed.sourceRoot = resolve(argument.slice('--source-root='.length));
    } else if (argument.startsWith('--report=')) {
      parsed.reportPath = resolve(argument.slice('--report='.length));
    } else {
      throw new Error(`Unknown import argument: ${argument}`);
    }
  }

  if (!parsed.sourceRoot) {
    throw new Error('--source-root=<path> is required.');
  }
  if (parsed.overwriteExisting && !parsed.apply) {
    throw new Error('--overwrite-existing requires --apply.');
  }

  return parsed;
}

async function run(): Promise<void> {
  const args = parseArguments(process.argv.slice(2));
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const importer = app.get(LegacyPostContentImportService);
    const report = await importer.importLegacyContent({
      dryRun: !args.apply,
      overwriteExisting: args.overwriteExisting,
      sourceRoot: args.sourceRoot!,
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
