# Display ordering

Ordered collections persist `displayOrder` as contiguous, zero-based integers.
The API, not clients, assigns stored positions. Ordinary create operations
append to the active scope, ordinary updates cannot assign a position, deletes
compact the old scope, and a move between scopes compacts the old scope and
appends to the new one in the same transaction.

## Scopes

| Resource                      | Ordering scope                                                                           |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| Banners                       | Canonical `placement`; legacy rows with `placement = null` are excluded until reassigned |
| Clubs                         | Global                                                                                   |
| Facilities                    | Global                                                                                   |
| Services                      | Global                                                                                   |
| Service variants              | Parent service                                                                           |
| Membership levels             | Global                                                                                   |
| Membership plans              | Parent membership level                                                                  |
| Membership benefits           | Global                                                                                   |
| Post categories               | Global                                                                                   |
| Posts                         | Parent category                                                                          |
| Site settings                 | `group`                                                                                  |
| Media assets                  | Global media-library order                                                               |
| Club gallery media references | Parent club; retained in the existing nested gallery replacement contract                |

Reusable media assets have a global media-library order because both protected
and public media-asset queries consume `media_assets.display_order`. Editorial
placement order remains on the owning asset-reference relation, such as
`club_gallery_media_assets`.

## Reorder contract

Complete reorder lists are exposed with `GET` and saved with `PATCH` on:

- `/clubs/reorder`
- `/facilities/reorder`
- `/services/reorder`
- `/services/:serviceId/variants/reorder`
- `/banners/reorder?placement=...` (`placement` is supplied in the PATCH body)
- `/memberships/levels/reorder`
- `/memberships/benefits/reorder`
- `/memberships/levels/:levelId/plans/reorder`
- `/posts/categories/reorder`
- `/posts/reorder?categoryId=...` (`categoryId` is supplied in the PATCH body)
- `/site-settings/reorder?group=...` (`group` is supplied in the PATCH body)
- `/media-assets/reorder`

The common PATCH payload is:

```json
{
  "orderedIds": ["uuid-a", "uuid-c", "uuid-b"]
}
```

Scoped request DTOs add the scope value. IDs must be unique UUIDs and must
exactly equal the complete active collection for that scope. Unknown,
soft-deleted, omitted, duplicated, or cross-scope IDs are rejected. Module
update permissions protect both the reorder list and write routes.

`OrderingHelper` serializes competing scope writes with PostgreSQL transaction
advisory locks. Reorders use a two-phase transactional rewrite (safe temporary
positions, then final `0..n-1` positions) so partial unique indexes cannot fail
transiently. Audit update metadata is assigned with the module operation.

## Database invariant

Migration `1785301200000-normalize-display-ordering.ts` deterministically
normalizes active rows by existing order, `createdAt`, and ID (or existing order
and ID for the club gallery join), then adds partial unique indexes for active
rows at the scopes above. It was applied and verified with the repository
TypeORM migration show/run/show commands on 2026-07-27.
