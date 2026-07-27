# CTG-APP Backend Instructions

## Repository purpose

NestJS API and authoritative contract layer for the CTG-APP CMS and public frontend.

## Stack

- NestJS
- TypeScript
- TypeORM
- PostgreSQL
- class-validator and class-transformer
- Swagger/OpenAPI
- JWT and permission guards

## Commands

Inspect `package.json` before running commands. Expected commands include:

```text
npm run dev
npm run build
npm run lint
npm run test
npm run check
npm run migration:generate
npm run migration:run
```

Do not run formatting across the entire repository merely to validate a small change if it would create unrelated diffs.

## Architecture

Modules live under:

```text
src/modules/<module>/
```

Typical responsibilities:

- entities: database schema and relations
- dtos: validated request and explicit response contracts
- mapper: entity-to-response conversion
- service: business/query behavior
- controller: routing, authorization, and orchestration
- enums: module-specific enum definitions

Module-specific enums belong under:

```text
src/modules/<module>/enums/
```

Shared cross-cutting behavior lives under `src/cores/`.

## Contract rules

- DTOs and actual serialized JSON are the frontend source of truth.
- Do not return raw entities.
- Never expose password hashes or internal-only fields.
- Use lightweight summaries for nested resources to avoid recursive response graphs.
- Request DTO properties need validation decorators; Swagger decorators alone do not preserve fields under whitelist validation.
- Return stable `null` values where the contract expects nullable data rather than accidental `undefined`.

## TypeORM and database

- Keep `synchronize: false`.
- Use migrations for schema changes.
- Preserve soft-delete and audit behavior.
- Be explicit when updating booleans; `false` is a valid value.
- Convert relation IDs from DTOs into actual related entities in services.
- For paginated endpoints: filter/search, sort, paginate, then map.
- Whitelist sortable fields instead of interpolating arbitrary column names.

## Authorization

- Backend guards are authoritative.
- `system:admin` grants global access.
- `module:*` grants module-wide access.
- Exact permissions grant individual actions.
- Routes should declare their real granular permission; the guard handles wildcard and admin overrides.

## Error behavior

Use the existing application error codes, messages, and structured error helpers. Preserve status-code semantics:

- `401`: unauthenticated or invalid token
- `403`: authenticated but not authorized
- `404`: missing resource
- `409`: conflict such as duplicate unique data

## Working rules

- Follow a mature existing module before introducing a new pattern.
- Avoid generic CRUD base services.
- Do not modify public route contracts casually; check both consumers.
- When changing a contract, inspect `ctg-app-cms` and `ctg-app-frontend` if the parent workspace is available.
- Do not add dependencies without approval.

## Validation

At minimum for code changes:

```text
npm run lint
npm run build
```

Run relevant tests. For schema changes, inspect and run the migration workflow appropriate to the task.
