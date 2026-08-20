# CareMetrics

CareMetrics is a front-end prototype for managing care services, support workers, clients, houses, attendance, leave, rostering, care records, and operational reporting.

The application includes separate manager and employee experiences, responsive layouts, workflow forms, care-record views, and map-based location views. Data and authentication are currently mocked for demonstration purposes.

## Tech Stack

- Next.js 15 with the App Router
- React 19
- TypeScript with strict checking
- Tailwind CSS 4
- Leaflet and React Leaflet for maps
- pnpm for package management

## Getting Started

### Prerequisites

- Node.js compatible with the version in `.mise.toml`
- pnpm

### Install dependencies

```bash
pnpm install
```

### Start the development server

```bash
pnpm dev
```

The app runs on port `8443` by default. Set `PORT` to use another port:

```bash
PORT=3000 pnpm dev
```

## Available Commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Create a production build |
| `pnpm start` | Start the production server |
| `pnpm typecheck` | Run TypeScript checks without emitting files |
| `pnpm format` | Format the project with Oxfmt |

## Demo Access

The login screen provides two demo roles:

- **Manager**: access to workforce, operations, clients and care, reports, notifications, and administration views.
- **Employee**: access to the employee dashboard, roster, timesheets, leave, clients, notifications, and profile views.

No production credentials are required. Authentication is simulated in the browser.

## Main Features

### Manager workspace

- Company dashboard
- Employee management and employee profiles
- Attendance and leave management
- Rostering
- Houses and services
- Client management
- Care records and care management templates
- Reports
- Notifications
- Administration

### Employee workspace

- Employee dashboard
- Personal roster
- Timesheets and attendance
- Leave requests and history
- Assigned clients
- Notifications
- Personal profile

### Care workflows

The routed workflows also include employee and client creation, house/service creation, care-record detail views, and template-driven support-worker care entry and review flows.

## Project Structure

```text
src/
  app/              Next.js routes and role-specific layouts
  components/       Shared layout, map, and workflow components
  data/             Mock application data
  types/            Shared domain types
  views/             Feature-level dashboard and management views
  App.tsx           Legacy single-shell application component
  index.css         Global styles and design tokens
```

Routes are organized under `src/app`, with separate `(manager)` and `(employee)` route groups. Existing feature views remain in `src/views` and are composed by the routed pages.

## Current Scope

This repository is a front-end demonstration. Authentication, authorization, persistence, scheduling conflict checks, attendance and geolocation rules, leave calculations, care validation, notifications, and reports are mocked. Hiding a route or navigation item is not a security boundary.

There is currently no production database, Prisma schema, migration system, or authentication provider.

## Next Steps for Production

1. Define and review the domain model, then add a PostgreSQL/Prisma data layer.
2. Add production authentication and server-side authorization.
3. Replace mock datasets with server-backed data and mutations.
4. Add integration tests for high-impact forms and confirmation flows.
5. Confirm map tile licensing, network access, and privacy requirements before deployment.
