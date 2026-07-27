import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, type Repository } from 'typeorm';

import { Post } from './entities/post.entity';
import {
  LegacyPostContentSourceError,
  LegacyPostContentSourceReader,
} from './legacy-post-content-source.reader';
import { POST_CONTENT_MAX_BYTES } from './post-content.constants';
import { PostContentSanitizerService } from './post-content-sanitizer.service';

export interface LegacyPostContentImportOptions {
  dryRun?: boolean;
  overwriteExisting?: boolean;
  sourceRoot: string;
}

export interface LegacyPostContentImportEntry {
  postId: string;
  postTitle: string;
  language: 'en' | 'vi';
  legacyField: 'contentUrlEn' | 'contentUrlVi';
  targetField: 'contentHtmlEn' | 'contentHtmlVi';
  legacyUrl: string;
  sourceBytes?: number;
  sanitizedBytes?: number;
  action?: 'import_content' | 'overwrite_content';
  reason?: string;
  message?: string;
}

export interface LegacyPostContentImportReport {
  mode: 'dry_run' | 'apply';
  overwriteExisting: boolean;
  startedAt: string;
  completedAt: string;
  imported: LegacyPostContentImportEntry[];
  planned: LegacyPostContentImportEntry[];
  skipped: LegacyPostContentImportEntry[];
  failed: LegacyPostContentImportEntry[];
  stillUnresolved: LegacyPostContentImportEntry[];
  summary: {
    candidates: number;
    imported: number;
    planned: number;
    skipped: number;
    failed: number;
    stillUnresolved: number;
  };
}

interface ImportCandidate {
  postId: string;
  postTitle: string;
  language: 'en' | 'vi';
  legacyField: 'contentUrlEn' | 'contentUrlVi';
  targetField: 'contentHtmlEn' | 'contentHtmlVi';
  legacyUrl: string;
  existingHtml: string | null;
}

type AssignmentResult =
  | 'imported'
  | 'already_current'
  | 'content_present'
  | 'legacy_source_changed'
  | 'post_missing';

@Injectable()
export class LegacyPostContentImportService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,

    private readonly sourceReader: LegacyPostContentSourceReader,

    private readonly sanitizer: PostContentSanitizerService,
  ) {}

  async importLegacyContent(
    options: LegacyPostContentImportOptions,
  ): Promise<LegacyPostContentImportReport> {
    const startedAt = new Date().toISOString();
    const dryRun = options.dryRun ?? true;
    const overwriteExisting = options.overwriteExisting ?? false;
    const candidates = await this.findCandidates();
    const imported: LegacyPostContentImportEntry[] = [];
    const planned: LegacyPostContentImportEntry[] = [];
    const skipped: LegacyPostContentImportEntry[] = [];
    const failed: LegacyPostContentImportEntry[] = [];
    const stillUnresolved: LegacyPostContentImportEntry[] = [];

    for (const candidate of candidates) {
      const baseEntry = this.toReportEntry(candidate);

      if (this.hasContent(candidate.existingHtml) && !overwriteExisting) {
        skipped.push({
          ...baseEntry,
          reason: 'content_present',
          message:
            'Existing database HTML was preserved. Use --overwrite-existing to replace it.',
        });
        continue;
      }

      try {
        const source = await this.sourceReader.read(candidate.legacyUrl, {
          sourceRoot: options.sourceRoot,
          maxBytes: POST_CONTENT_MAX_BYTES,
        });
        const sanitized = this.sanitizer.sanitizeInput(source.html);

        if (!sanitized) {
          throw new LegacyPostContentSourceError(
            'empty_after_sanitization',
            'The source contained no supported content after sanitization.',
          );
        }

        const action = this.hasContent(candidate.existingHtml)
          ? 'overwrite_content'
          : 'import_content';
        const entry: LegacyPostContentImportEntry = {
          ...baseEntry,
          sourceBytes: source.byteLength,
          sanitizedBytes: Buffer.byteLength(sanitized, 'utf8'),
          action,
        };

        if (candidate.existingHtml === sanitized) {
          skipped.push({
            ...entry,
            reason: 'already_current',
            message: 'Stored HTML already matches the sanitized source.',
          });
          continue;
        }

        if (dryRun) {
          planned.push(entry);
          if (!this.hasContent(candidate.existingHtml)) {
            stillUnresolved.push({
              ...entry,
              reason: 'dry_run',
              message: 'Dry-run mode does not write database HTML.',
            });
          }
          continue;
        }

        const assignment = await this.assignContent(
          candidate,
          sanitized,
          overwriteExisting,
        );
        if (assignment === 'imported') {
          imported.push(entry);
        } else {
          const skippedEntry = {
            ...entry,
            reason: assignment,
            message: this.assignmentMessage(assignment),
          };
          skipped.push(skippedEntry);
          if (
            assignment === 'legacy_source_changed' ||
            assignment === 'post_missing'
          ) {
            stillUnresolved.push(skippedEntry);
          }
        }
      } catch (error) {
        const failure = {
          ...baseEntry,
          reason:
            error instanceof LegacyPostContentSourceError
              ? error.code
              : 'import_failed',
          message: error instanceof Error ? error.message : String(error),
        };
        failed.push(failure);
        if (!this.hasContent(candidate.existingHtml)) {
          stillUnresolved.push(failure);
        }
      }
    }

    return {
      mode: dryRun ? 'dry_run' : 'apply',
      overwriteExisting,
      startedAt,
      completedAt: new Date().toISOString(),
      imported,
      planned,
      skipped,
      failed,
      stillUnresolved,
      summary: {
        candidates: candidates.length,
        imported: imported.length,
        planned: planned.length,
        skipped: skipped.length,
        failed: failed.length,
        stillUnresolved: stillUnresolved.length,
      },
    };
  }

  private async findCandidates(): Promise<ImportCandidate[]> {
    const posts = await this.postRepository.find({
      select: {
        id: true,
        titleEn: true,
        titleVi: true,
        contentUrlEn: true,
        contentUrlVi: true,
        contentHtmlEn: true,
        contentHtmlVi: true,
      },
      where: [{ contentUrlEn: Not(IsNull()) }, { contentUrlVi: Not(IsNull()) }],
      order: { id: 'ASC' },
    });
    const candidates: ImportCandidate[] = [];

    for (const post of posts) {
      if (post.contentUrlEn?.trim()) {
        candidates.push({
          postId: post.id,
          postTitle: post.titleEn || post.titleVi,
          language: 'en',
          legacyField: 'contentUrlEn',
          targetField: 'contentHtmlEn',
          legacyUrl: post.contentUrlEn,
          existingHtml: post.contentHtmlEn ?? null,
        });
      }
      if (post.contentUrlVi?.trim()) {
        candidates.push({
          postId: post.id,
          postTitle: post.titleVi || post.titleEn,
          language: 'vi',
          legacyField: 'contentUrlVi',
          targetField: 'contentHtmlVi',
          legacyUrl: post.contentUrlVi,
          existingHtml: post.contentHtmlVi ?? null,
        });
      }
    }

    return candidates.sort((left, right) =>
      `${left.postId}:${left.language}`.localeCompare(
        `${right.postId}:${right.language}`,
      ),
    );
  }

  private async assignContent(
    candidate: ImportCandidate,
    sanitized: string,
    overwriteExisting: boolean,
  ): Promise<AssignmentResult> {
    return this.postRepository.manager.transaction(async (manager) => {
      const repository = manager.getRepository(Post);
      const post = await repository
        .createQueryBuilder('post')
        .addSelect(['post.contentHtmlEn', 'post.contentHtmlVi'])
        .where('post.id = :id', { id: candidate.postId })
        .setLock('pessimistic_write')
        .getOne();

      if (!post) return 'post_missing';

      const currentUrl = post[candidate.legacyField] ?? null;
      if (currentUrl !== candidate.legacyUrl) return 'legacy_source_changed';

      const currentHtml = post[candidate.targetField] ?? null;
      if (currentHtml === sanitized) return 'already_current';
      if (this.hasContent(currentHtml) && !overwriteExisting) {
        return 'content_present';
      }

      post[candidate.targetField] = sanitized;
      await repository.save(post);
      return 'imported';
    });
  }

  private hasContent(value: string | null | undefined): boolean {
    return Boolean(value?.trim());
  }

  private toReportEntry(
    candidate: ImportCandidate,
  ): LegacyPostContentImportEntry {
    return {
      postId: candidate.postId,
      postTitle: candidate.postTitle,
      language: candidate.language,
      legacyField: candidate.legacyField,
      targetField: candidate.targetField,
      legacyUrl: candidate.legacyUrl,
    };
  }

  private assignmentMessage(result: Exclude<AssignmentResult, 'imported'>) {
    const messages = {
      already_current: 'Stored HTML already matches the sanitized source.',
      content_present:
        'Existing database HTML was preserved because overwrite was not enabled.',
      legacy_source_changed:
        'The legacy content URL changed while the import was running.',
      post_missing: 'The post no longer exists.',
    } satisfies Record<Exclude<AssignmentResult, 'imported'>, string>;

    return messages[result];
  }
}
