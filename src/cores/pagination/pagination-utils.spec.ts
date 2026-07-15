import type { SelectQueryBuilder } from 'typeorm';

import { PaginationQueryDto } from './pagination-query.dto';
import { getPaginatedIds, orderEntitiesByIds } from './pagination-utils';

describe('pagination utilities', () => {
  describe('getPaginatedIds', () => {
    it('counts root entities and applies pagination only to the ID query', async () => {
      const countBuilder = {
        getCount: jest.fn().mockResolvedValue(4),
      };
      const pageBuilder = {
        select: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest
          .fn()
          .mockResolvedValue([{ id: 'club-3' }, { id: 'club-4' }]),
      };
      const queryBuilder = {
        clone: jest
          .fn()
          .mockReturnValueOnce(countBuilder)
          .mockReturnValueOnce(pageBuilder),
      } as unknown as SelectQueryBuilder<Record<string, unknown>>;
      const query = new PaginationQueryDto();
      query.page = 2;
      query.limit = 2;

      await expect(
        getPaginatedIds(queryBuilder, 'club', query),
      ).resolves.toEqual({
        ids: ['club-3', 'club-4'],
        totalItems: 4,
      });
      expect(pageBuilder.select).toHaveBeenCalledWith('club.id', 'id');
      expect(pageBuilder.offset).toHaveBeenCalledWith(2);
      expect(pageBuilder.limit).toHaveBeenCalledWith(2);
    });
  });

  describe('orderEntitiesByIds', () => {
    it('restores page order after relations are loaded separately', () => {
      const entities = [{ id: 'club-4' }, { id: 'club-3' }];

      expect(orderEntitiesByIds(entities, ['club-3', 'club-4'])).toEqual([
        { id: 'club-3' },
        { id: 'club-4' },
      ]);
    });
  });
});
