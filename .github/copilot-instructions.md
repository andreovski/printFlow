# Copilot Instructions for Magic System

## Project Overview

Pnpm monorepo for a production management system (printshop/design studio) with Turborepo orchestration. Two main apps (`api`, `web`) + shared packages (`auth`, `schemas`). Portuguese is the primary language for UI, comments, and variable names.

## Architecture

### Apps Structure

- **`apps/api`**: Fastify REST API with Prisma ORM (PostgreSQL), JWT auth via cookies
- **`apps/web`**: Next.js 15 App Router, React 19, Tailwind + shadcn/ui components
- **`packages/auth`**: CASL-based permissions (roles: MASTER, ADMIN, EMPLOYEE)
- **`packages/schemas`**: Zod schemas shared between frontend/backend

### Key Data Models (Prisma)

- **Organization** → Users (multi-tenant SaaS pattern)
- **Budgets** (Orçamentos): Status flow `DRAFT → SENT → ACCEPTED/REJECTED → DONE`
- **Boards** (Quadros): Kanban production tracking with columns, cards, checklists, tags, attachments
- **Clients, Products, Templates, Tags**: Supporting entities with organization scoping

## Development Workflow

### Essential Commands

```bash
# Root (starts all apps concurrently)
pnpm dev                          # Run all apps in dev mode
pnpm build                        # Build all packages
pnpm studio                       # Open Prisma Studio (API database GUI)

# API (apps/api)
cd apps/api
pnpm dev                          # Watch mode with tsx
docker-compose up -d              # Start local PostgreSQL
prisma migrate dev --name <desc>  # Create migration
prisma db seed                    # Seed database
pnpm start                        # Production mode

# Web (apps/web)
cd apps/web
pnpm dev                          # Next.js dev server (port 3000)
pnpm prod                         # Dev with production env vars (.env.prod)
pnpm build                        # Production build
```

### Database Migrations

- **Always** run migrations from `apps/api` directory
- Migration workflow: Edit `schema.prisma` → `prisma migrate dev --name descriptive_name` → commit migration files
- Never edit migrations manually; use `prisma migrate reset` for schema drift

## Critical Patterns

### Authentication Flow

1. **Backend**: JWT signed with `JWT_SECRET`, includes `{sub: userId, role, organizationId}` in payload
2. **Frontend**: Token stored in httpOnly cookie (`token`) + client-accessible cookie (`token-client`) for SSR/CSR split
3. **Middleware**: `apps/web/src/middleware.ts` handles auth redirects, organization setup flow
4. **Protected routes**: Wrap with `verifyJwt` middleware (API) or check cookie in middleware (Web)

### Authorization (CASL)

- Define abilities in `packages/auth/src/permissions.ts` using builder pattern
- Navigation permissions: Separate `NavigationSubject` enum for module access control
- Resource permissions: Check via `ability.can(action, subject, conditions)`
- Backend: Use `verifyUserRole(['ADMIN', 'MASTER'])` or `checkAbility('manage', 'Budget')` middleware

### API Conventions

- **Structure**: `controllers/ → services/ → repositories/` pattern
- **Validation**: Zod schemas from `@magic-system/schemas` package
- **Organization scoping**: Always filter by `user.organizationId` from JWT payload
- **Error handling**: Return `{ message: string }` for all errors; global Zod error formatter
- **Naming**: Portuguese for business logic (e.g., `fetchOrcamentos`), English for tech terms

### Frontend Patterns

- **React Query**: Use custom hooks in `apps/web/src/app/http/hooks/` (e.g., `useBoards`, `useBudgets`)
- **API client**: `ky` wrapper in `apps/web/src/app/http/api.ts` handles auth headers + error toasts
- **Forms**: React Hook Form + Zod resolvers; schemas reused from `@magic-system/schemas`
- **Dialogs**: Prefer shadcn `Dialog` with `onOpenChange` for controlled state; avoid nested dialogs
- **Toasts**: `sonner` library (`toast.success()`, `toast.error()`) for all notifications
- **Modal State**: Use the hook `useDisclosure` from `apps/web/src/hooks/use-disclosure.ts` for managing open/close state

### Kanban System (Production Boards)

- **Virtualization**: Columns with 20+ cards use `@tanstack/react-virtual` (see `use-conditional-virtualizer.ts`)
- **Drag & Drop**: `@dnd-kit/core` + `@dnd-kit/sortable` with two modes:
  - Normal: Drag cards between columns
  - Reorder mode: Drag columns to reposition (toggle via `isReorderMode` context)
- **Critical**: Call `virtualizer.measure()` when data changes to recalculate positions
- **ScrollArea fix**: Attach refs to Radix viewport element (`[data-radix-scroll-area-viewport]`), not wrapper div

### File Uploads (UploadThing)

- **Router**: `apps/web/src/lib/uploadthing.ts` defines routes (`budgetAttachment`, `cardAttachment`, `organizationLogo`)
- **Auth**: Decode JWT in middleware to attach `userId` and `organizationId` to upload metadata
- **Deletion**: POST to `/api/uploadthing/delete` with `{ fileKey }` to clean up files
- **Image patterns**: UploadThing domains whitelisted in `next.config.js` (`utfs.io`, `*.ufs.sh`)

## Module-Specific Guidance

### Budgets (Finance Module)

- **Status transitions**: Only MASTER/ADMIN can change status; use `updateBudgetStatus` service method
- **Public approval**: Token-based links (`/approval/:token`) for client accept/reject without login
- **Short URLs**: `/a/:code` redirects created via `ShortUrlService` for WhatsApp sharing
- **Items calculation**: Backend computes `subtotal`, `total` considering `discountType/Value`

### Boards (Production Module)

- **Card positioning**: `position` field is integer index within column; backend reorders on move
- **Tags & Templates**: Scoped by `TagScope` enum (GLOBAL, BUDGET, BOARD) for filtering
- **Budget linking**: Cards can reference budget via `budgetId`; used to track budget execution
- **Archiving**: Soft delete via `archivedAt` timestamp; archived cards excluded from default queries

## Code Review Standards

- **React anti-patterns**: Never call `setState` during render; use `useEffect` with proper deps
- **Memoization**: Only use `useMemo`/`useCallback` for expensive computations or preventing child re-renders
- **Array comparisons**: Compare by content (IDs), not length, in `React.memo` second arg
- **Import order**: Groups: 1) external packages, 2) `@/` aliases, 3) relative imports (enforced by eslint-plugin-import-helpers)

## Environment Variables

### API (apps/api)

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/magic_system
JWT_SECRET=<32+ char random string>
FRONTEND_URL=http://localhost:3000  # Comma-separated for multiple origins
NODE_ENV=development|production
PORT=3333  # Railway auto-assigns in prod
```

### Web (apps/web)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3333  # API base URL
UPLOADTHING_TOKEN=<from uploadthing.com dashboard>
```

## Deployment

- **API**: Railway with Nixpacks builder (auto-detects Prisma, runs migrations on deploy)
- **Web**: Vercel with monorepo detection (see `vercel.json` for build config)
- **Database**: Railway PostgreSQL or external provider (connection pooling recommended)

## Common Gotchas

- **Workspace packages**: Always rebuild (`pnpm build`) `auth`/`schemas` after changes before testing in apps
- **Prisma client**: Regenerate (`prisma generate`) after schema changes; restart dev server
- **Cookie access**: Server components read `token`, client components read `token-client` (split for httpOnly security)
- **Turborepo cache**: Clear `.turbo` folder if builds are stale
- **Module resolution**: Use `@/` alias (Next.js) or absolute from `src/` (API with ts-alias) — no relative `../../` hell

## Key Files to Reference

- Auth flow: `apps/api/src/http/middlewares/verify-jwt.ts`, `apps/web/src/middleware.ts`
- Permissions: `packages/auth/src/permissions.ts`, `packages/auth/src/subjects.ts`
- API routes: `apps/api/src/http/routes.ts` (single consolidated router)
- Kanban implementation: `apps/web/src/components/ui/shadcn-io/kanban/index.tsx`
- Database schema: `apps/api/prisma/schema.prisma`

## Observations

Always `use context7` when I need code generation, setup or configuration steps, or
library/API documentation. This means you should automatically use the `Context7 MCP`
tools to resolve library id and get library docs without me having to explicitly ask.
