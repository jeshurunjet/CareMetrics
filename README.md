# CareMetrics

Phase 1A Staff UI migration on the Next.js foundation for a New Zealand disability-support care/workforce application. This is a UI-only development preview, with no real authentication, persistence, GPS verification or file services. Use fictional data only.

## Run locally

Use Node 22 LTS (see `.mise.toml`) and pnpm 10.15.1:

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Open http://localhost:8443/login. If a server already owns that port, use `PORT=8444 pnpm dev`. Use any fictional email and non-empty password in the clearly labelled development mock sign-in to enter My Shifts; continue to the dashboard without attendance. Admin preview requires a desktop viewport. Preview requires `NODE_ENV=development` and `CAREMETRICS_UI_PREVIEW=true`; it is always unavailable in production. Production login and password recovery intentionally report unavailable services. Never enter real credentials.

## Checks

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
pnpm test:production
pnpm format:check
```

Playwright starts its own dev server on port 8555 with isolated output and fictional fixtures. `pnpm start` serves `.next-build` on 8443; all preview URLs should return 404 in production. `pnpm format` formats active source/tests/scripts/config, never the reference copies. Build does not replace lint/typechecking. See implementation status for actual results and limitations.

## Structure and phase boundary

- `reference/src.zip`, `reference/figma-export/`: untouched archive and safe extraction of latest visual source.
- `reference/workspace-before-bootstrap/`: previous migration source/config/README preserved before changes.
- `src/app/`: App Router, server preview gate and explicit placeholders.
- `src/components/`: approved-export icons and shell adaptations.
- `src/modules/`: authentication presentation and the shared typed Staff mock adapter; future feature services/repositories belong here.
- `src/styles/`: unchanged staff/admin CSS plus isolated bootstrap additions; `src/index.css` preserves global tokens/fonts.
- `tests/`: unit boundary/time checks and browser smoke flows.
- `docs/`: [source audit](docs/source-audit.md), [route map](docs/route-map.md), [status](docs/implementation-status.md), [decisions](docs/architecture-decisions.md), complete file/dependency inventory.

Next.js/React/TypeScript are active. Auth.js, Prisma, Neon PostgreSQL, private Vercel Blob and Vercel are approved future integrations, not configured services. No backend feature is production-ready. Login, My Shifts and Dashboard now reuse the approved Staff interface. The next step is Phase 1B Houses and Client/NOK UI migration, followed by the remaining Staff/Admin screens in verified slices. See docs/ui-migration-notes.md for visual comparisons and limitations.

`reference/` is local-only and excluded from Git. Fresh clones run all functional browser checks and migrated-screen captures; original-export comparisons run additionally when the local reference is present. Set `CAREMETRICS_SKIP_REFERENCE=true` to verify the no-reference path explicitly. Historical docs describe the locally retained originals.
