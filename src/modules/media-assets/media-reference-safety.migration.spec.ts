import type { QueryRunner } from 'typeorm';

import { AddMediaReferenceSafety1784350800000 } from '../../database/migrations/1784350800000-add-media-reference-safety';

describe('AddMediaReferenceSafety1784350800000', () => {
  it('adds and removes the soft-delete cleanup index', async () => {
    const query = jest.fn();
    const queryRunner = { query } as unknown as QueryRunner;
    const migration = new AddMediaReferenceSafety1784350800000();

    await migration.up(queryRunner);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('IDX_media_assets_deleted_at'),
    );

    await migration.down(queryRunner);
    expect(query).toHaveBeenLastCalledWith(
      expect.stringContaining('DROP INDEX'),
    );
  });
});
