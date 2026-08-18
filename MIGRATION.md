# CAREMetrics front-end migration

## Architecture

The active application now uses Next.js 15, the App Router, React 19, and strict TypeScript. Route groups provide separate manager and employee layouts without changing public URLs. Existing Figma views remain feature components under `src/views`; new routed workflows live under `src/components/workflows`. Leaflet maps are loaded client-side with `next/dynamic`.

## Migrated screens

Manager routes cover dashboard, employees, attendance, leave, rostering, houses/services, clients, care records, care management, reports, notifications, and administration. Employee routes cover dashboard, roster, timesheets, leave, clients, notifications, and profile. Login is a standalone route without application navigation.

## Added workflows

- Employee add, profile detail, tabbed summaries, and edit routes
- Client and house/service add forms
- Read-only care record detail with template-version awareness
- Template-driven support-worker care entry, review, submission, and confirmation flow
- Responsive manager/employee shells and consistent form, status, focus, and feedback patterns

## Mocked boundaries

Authentication, authorization, persistence, scheduling conflicts, attendance/geolocation rules, leave calculations, care validation/version persistence, notifications, and reports remain front-end demonstrations. Route hiding is not a security boundary. No Prisma schema, database, migrations, or production auth provider has been introduced.

## Migration risks and next steps

The retained Figma views still contain local component state and some repeated inline styles. Move their mock datasets into `src/data` as each feature is connected to server data, then design the PostgreSQL/Prisma schema from reviewed domain requirements. Establish production authentication and server-side authorization before exposing real records. Add integration tests around high-impact confirmation flows and validate map tile/network policy for deployment.

## Commands

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm build
pnpm start
```
