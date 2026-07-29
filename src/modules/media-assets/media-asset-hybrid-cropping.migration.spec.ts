import { AddMediaAssetHybridCropping1785474000000 } from '../../database/migrations/1785474000000-add-media-asset-hybrid-cropping';

describe('AddMediaAssetHybridCropping1785474000000', () => {
  it('adds only nullable original and crop fields plus a non-destructive check', async () => {
    const query = jest.fn().mockResolvedValue(undefined);

    await new AddMediaAssetHybridCropping1785474000000().up({
      query,
    } as never);

    const statements = query.mock.calls.map(([sql]) => sql as string);
    expect(statements).toHaveLength(8);
    expect(statements.join('\n')).toContain('"original_storage_key"');
    expect(statements.join('\n')).toContain('"crop_metadata" jsonb');
    expect(statements.join('\n')).toContain(
      '"CK_media_assets_crop_has_original"',
    );
    expect(statements.join('\n')).not.toMatch(/\bDROP COLUMN\b/i);
    expect(statements.join('\n')).not.toContain('contacts');
  });

  it('drops only fields owned by the migration when reverted', async () => {
    const query = jest.fn().mockResolvedValue(undefined);

    await new AddMediaAssetHybridCropping1785474000000().down({
      query,
    } as never);

    const statements = query.mock.calls.map(([sql]) => sql as string);
    expect(statements).toHaveLength(8);
    expect(statements.every((sql) => sql.includes('media_assets'))).toBe(true);
  });
});
