---
name: ctg-backend-module-change
description: Implement or refactor a CTG NestJS backend module, entity, DTO, mapper, controller, service, enum, or migration while preserving existing module conventions.
---

# CTG Backend Module Change

1. Inspect the target module and one mature comparable module.
2. Trace consumers and relations before changing the contract.
3. Define:
   - entity/database changes,
   - request validation,
   - response DTO shape,
   - mapper behavior,
   - service queries and transactions,
   - controller routes and permissions,
   - migration requirements.
4. Keep module enums under the target module.
5. Preserve audit, soft-delete, error, pagination, search, and sorting conventions.
6. Do not expose entities directly.
7. For collection endpoints, apply filters and sorting before pagination.
8. Generate or update migrations for schema changes; do not enable synchronization.
9. Run relevant tests, lint, and build.
10. Report contract changes clearly so frontend consumers can be updated.
