import { BadRequestException } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import {
  compactCollection,
  getNextDisplayOrder,
  OrderingCollections,
  reorderCollection,
} from './ordering.helper';

function createManager(
  results: unknown[] = [],
): EntityManager & { query: jest.Mock } {
  const query = jest.fn();
  for (const result of results) {
    query.mockResolvedValueOnce(result);
  }

  return { query } as unknown as EntityManager & { query: jest.Mock };
}

describe('ordering helper', () => {
  const firstId = '11111111-1111-4111-8111-111111111111';
  const secondId = '22222222-2222-4222-8222-222222222222';
  const thirdId = '33333333-3333-4333-8333-333333333333';
  const updaterId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  it('assigns zero-based positions in the submitted order', async () => {
    const manager = createManager([
      [],
      [
        { id: firstId, displayOrder: 0 },
        { id: secondId, displayOrder: 1 },
        { id: thirdId, displayOrder: 2 },
      ],
      [],
      [],
    ]);
    const orderedIds = [thirdId, firstId, secondId];

    await reorderCollection(
      manager,
      OrderingCollections.clubs,
      orderedIds,
      updaterId,
    );

    expect(manager.query).toHaveBeenCalledTimes(4);
    const calls = manager.query.mock.calls as unknown as Array<
      [string, unknown[]?]
    >;
    expect(calls[2][0]).toContain('"display_order" = "display_order" + $1');
    expect(calls[3][0]).toContain('("ordinality" - 1)::integer');
    expect(calls[3][1]).toEqual([orderedIds, updaterId]);
  });

  it('rejects duplicate ordered IDs before starting a write', async () => {
    const manager = createManager();

    await expect(
      reorderCollection(
        manager,
        OrderingCollections.clubs,
        [firstId, firstId],
        updaterId,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(manager.query).not.toHaveBeenCalled();
  });

  it.each([
    ['an omitted active member', [firstId], [firstId, secondId]],
    ['an unknown ID', [firstId, thirdId], [firstId, secondId]],
    ['an ID from another scope', [firstId, thirdId], [firstId, secondId]],
  ])('rejects %s without rewriting positions', async (_, submitted, active) => {
    const manager = createManager([
      [],
      active.map((id, displayOrder) => ({ id, displayOrder })),
    ]);

    await expect(
      reorderCollection(
        manager,
        OrderingCollections.serviceVariants(firstId),
        submitted,
        updaterId,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(manager.query).toHaveBeenCalledTimes(2);
  });

  it('keeps scoped collections independent in the generated query', async () => {
    const manager = createManager([[], [{ id: secondId, displayOrder: 0 }]]);

    await reorderCollection(
      manager,
      OrderingCollections.serviceVariants(firstId),
      [secondId],
      updaterId,
    );

    const calls = manager.query.mock.calls as unknown as Array<
      [string, unknown[]?]
    >;
    expect(calls[1][0]).toContain('"service_id" = $1');
    expect(calls[1][1]).toEqual([firstId]);
  });

  it('appends after every active row and preserves zero as a valid position', async () => {
    const manager = createManager([
      [],
      [
        { id: firstId, displayOrder: 0 },
        { id: secondId, displayOrder: 1 },
      ],
    ]);

    await expect(
      getNextDisplayOrder(manager, OrderingCollections.facilities),
    ).resolves.toBe(2);
  });

  it('compacts a gapped collection to the deterministic row order', async () => {
    const manager = createManager([
      [],
      [
        { id: firstId, displayOrder: 0 },
        { id: thirdId, displayOrder: 2 },
      ],
      [],
      [],
    ]);

    await compactCollection(
      manager,
      OrderingCollections.posts(secondId),
      updaterId,
    );

    const calls = manager.query.mock.calls as unknown as Array<
      [string, unknown[]?]
    >;
    expect(calls[3][1]).toEqual([[firstId, thirdId], updaterId]);
  });

  it('does not rewrite an already contiguous collection', async () => {
    const manager = createManager([
      [],
      [
        { id: firstId, displayOrder: 0 },
        { id: secondId, displayOrder: 1 },
      ],
    ]);

    await compactCollection(
      manager,
      OrderingCollections.membershipBenefits,
      updaterId,
    );

    expect(manager.query).toHaveBeenCalledTimes(2);
  });

  it('propagates write failures so the caller transaction can roll back', async () => {
    const manager = createManager([
      [],
      [
        { id: firstId, displayOrder: 0 },
        { id: secondId, displayOrder: 1 },
      ],
      [],
    ]);
    manager.query.mockRejectedValueOnce(new Error('database write failed'));

    await expect(
      reorderCollection(
        manager,
        OrderingCollections.clubs,
        [secondId, firstId],
        updaterId,
      ),
    ).rejects.toThrow('database write failed');
  });
});
