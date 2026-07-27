# Pagination with TypeORM relations

Paginated CMS list endpoints must paginate root entities before loading any
to-many relations.

## Why

A SQL join to a one-to-many or many-to-many relation produces one row for each
root/relation combination. Applying `LIMIT` and `OFFSET` to those joined rows can
return fewer root entities than requested. Ordering by relation columns makes
this especially likely because TypeORM includes those columns in its pagination
`DISTINCT` query.

For example, a club with six facilities and two services can produce twelve SQL
rows. A limit of ten may therefore select only that club even when more clubs
exist.

## Required query sequence

1. Build the root query with root filters and stable root ordering.
2. Join only to-one relations required for filtering or root sorting.
3. Use `getPaginatedIds()` to count roots and select the current page of IDs.
4. In a separate, unpaginated query, load the selected entities and their
   to-many relations.
5. Use `orderEntitiesByIds()` to restore the page order because an `IN` query
   does not preserve ID order.
6. Map the loaded entities to explicit response DTOs.

Do not pass a query builder containing to-many joins to `getPaginatedIds()`.

## Modules using this pattern

- Clubs: facilities and services
- Services: variants
- Membership levels: plans and benefits
- Roles: permissions
- Users: role data; the ID page is kept separate from response hydration

Paginated queries that load only root columns or to-one relations can continue
using the standard `getManyAndCount()` flow.
