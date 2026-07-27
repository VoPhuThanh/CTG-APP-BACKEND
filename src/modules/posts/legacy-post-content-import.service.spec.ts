import type { Repository } from 'typeorm';

import { Post } from './entities/post.entity';
import { LegacyPostContentImportService } from './legacy-post-content-import.service';
import type { LegacyPostContentSourceReader } from './legacy-post-content-source.reader';
import { PostContentSanitizerService } from './post-content-sanitizer.service';

describe('LegacyPostContentImportService', () => {
  it('imports sanitized HTML once and becomes write-free on rerun', async () => {
    const post = {
      id: 'post-1',
      titleEn: 'Guide',
      titleVi: 'Guide VI',
      contentUrlEn: '/content/posts/guide.en.html',
      contentUrlVi: null,
      contentHtmlEn: null,
      contentHtmlVi: null,
    } as unknown as Post;
    const queryBuilder = {
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockImplementation(() => Promise.resolve(post)),
    };
    const transactionRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      save: jest
        .fn()
        .mockImplementation((entity: Post) => Promise.resolve(entity)),
    };
    const manager = {
      getRepository: jest.fn().mockReturnValue(transactionRepository),
    };
    const repository = {
      find: jest.fn().mockImplementation(() => Promise.resolve([post])),
      manager: {
        transaction: jest.fn(
          (
            callback: (transactionManager: typeof manager) => Promise<unknown>,
          ) => callback(manager),
        ),
      },
    };
    const sourceReader = {
      read: jest.fn().mockResolvedValue({
        html: '<h1>Guide</h1><script>alert(1)</script><p>Safe</p>',
        byteLength: 55,
        resolvedPath: 'D:/frontend/public/content/posts/guide.en.html',
      }),
    };
    const importer = new LegacyPostContentImportService(
      repository as unknown as Repository<Post>,
      sourceReader as unknown as LegacyPostContentSourceReader,
      new PostContentSanitizerService(),
    );

    const firstReport = await importer.importLegacyContent({
      dryRun: false,
      sourceRoot: 'D:/frontend/public',
    });
    const secondReport = await importer.importLegacyContent({
      dryRun: false,
      sourceRoot: 'D:/frontend/public',
    });

    expect(post.contentHtmlEn).toBe('<h2>Guide</h2><p>Safe</p>');
    expect(firstReport.summary).toEqual({
      candidates: 1,
      imported: 1,
      planned: 0,
      skipped: 0,
      failed: 0,
      stillUnresolved: 0,
    });
    expect(secondReport.summary).toEqual(
      expect.objectContaining({
        candidates: 1,
        imported: 0,
        skipped: 1,
        stillUnresolved: 0,
      }),
    );
    expect(sourceReader.read).toHaveBeenCalledTimes(1);
    expect(transactionRepository.save).toHaveBeenCalledTimes(1);
  });

  it('preserves nonempty HTML unless overwrite is explicitly enabled', async () => {
    const post = {
      id: 'post-1',
      titleEn: 'Guide',
      titleVi: 'Guide VI',
      contentUrlEn: '/content/posts/guide.en.html',
      contentUrlVi: null,
      contentHtmlEn: '<p>Curated content</p>',
      contentHtmlVi: null,
    } as unknown as Post;
    const queryBuilder = {
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(post),
    };
    const transactionRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      save: jest.fn().mockResolvedValue(post),
    };
    const manager = {
      getRepository: jest.fn().mockReturnValue(transactionRepository),
    };
    const repository = {
      find: jest.fn().mockResolvedValue([post]),
      manager: {
        transaction: jest.fn(
          (
            callback: (transactionManager: typeof manager) => Promise<unknown>,
          ) => callback(manager),
        ),
      },
    };
    const sourceReader = {
      read: jest.fn().mockResolvedValue({
        html: '<p>Imported replacement</p>',
        byteLength: 27,
        resolvedPath: 'D:/frontend/public/content/posts/guide.en.html',
      }),
    };
    const importer = new LegacyPostContentImportService(
      repository as unknown as Repository<Post>,
      sourceReader as unknown as LegacyPostContentSourceReader,
      new PostContentSanitizerService(),
    );

    const preservedReport = await importer.importLegacyContent({
      dryRun: false,
      sourceRoot: 'D:/frontend/public',
    });
    expect(post.contentHtmlEn).toBe('<p>Curated content</p>');
    expect(preservedReport.skipped[0]?.reason).toBe('content_present');
    expect(sourceReader.read).not.toHaveBeenCalled();

    const overwriteReport = await importer.importLegacyContent({
      dryRun: false,
      overwriteExisting: true,
      sourceRoot: 'D:/frontend/public',
    });
    expect(post.contentHtmlEn).toBe('<p>Imported replacement</p>');
    expect(overwriteReport.imported[0]?.action).toBe('overwrite_content');
    expect(transactionRepository.save).toHaveBeenCalledTimes(1);
  });
});
