# Amara Hospital — Digital Document Management System (DDMS)

A secure, role-based document management system built with **Next.js 15** (App Router), **Drizzle ORM**, and **MySQL** — no Supabase, no Prisma. Polished UI with **Tailwind CSS** and **Framer Motion** throughout.

There is intentionally no public landing page or self-signup: the app opens straight to login, and only a Super Admin can create accounts.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, Server Actions, Server Components) |
| Database | **MySQL** (or MariaDB 10.5+) via **Drizzle ORM**, using the pure-JS `mysql2` driver — no native binaries to compile |
| Auth | NextAuth (Credentials provider), JWT sessions, bcrypt password hashing |
| Styling | Tailwind CSS, custom design tokens |
| Animation | Framer Motion |
| Icons | lucide-react |

> **Why Drizzle instead of Prisma?** Prisma needs to download a native query-engine binary at install time, which isn't always possible in locked-down environments (corporate proxies, offline CI, restricted containers). Drizzle + `mysql2` is pure JavaScript end to end — `npm install` is all it takes, anywhere.

## Getting started

1. **Create a database** on any MySQL/MariaDB server (local, Docker, or hosted — PlanetScale, RDS, Cloud SQL, etc.):

   ```sql
   CREATE DATABASE ddms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'ddms_user'@'%' IDENTIFIED BY 'ddms_password';
   GRANT ALL PRIVILEGES ON ddms.* TO 'ddms_user'@'%';
   FLUSH PRIVILEGES;
   ```

2. **Configure and run the app:**

   ```bash
   npm install
   cp .env.example .env          # then edit DATABASE_URL to match your server
   npm run db:push               # creates all tables (idempotent - safe to re-run)
   npm run db:seed               # creates the Super Admin + sample departments
   npm run dev                   # http://localhost:3000
   ```

`DATABASE_URL` takes a standard MySQL connection string: `mysql://user:password@host:port/database`.

### Default sign-ins (seeded)

| Role | Email | Password |
|---|---|---|
| Super Admin | `admin@amarahospital.org` | `ChangeMe@123` |
| Staff (demo) | `staff@amarahospital.org` | `Staff@1234` |

Change these immediately in a real deployment — set `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `.env` before seeding, or use the in-app "Reset password" flow afterwards. Every account other than the seeded ones must be created by a Super Admin from **Users & Access** — there's no public sign-up screen.

## What's implemented

**Roles**
- **Super Admin** — full access: manage departments, folders, documents, users, permissions; views every audit log.
- **Staff User** — sees only the departments/folders they've been granted, with per-action permissions (View / Upload / Edit / Delete / Download).

**Modules** — HR, Quality, Library, and Training are seeded by default; Super Admins can add more departments at any time, plus nested subfolders inside each.

**Documents** — upload, edit details, replace (old file kept as version history), delete, preview (PDF/JPG/PNG render inline; Office files show a download prompt), download. Supported types: PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, JPG/JPEG, PNG.

**Access control** — permissions can be set at the **department level** (applies to everything inside) and overridden at the **folder level** (cascades to subfolders unless overridden again deeper down). See `lib/permissions.ts`.

**Search** — global, debounced, live-results search bar in the top bar, plus a dedicated `/search` page with file-type and department filters. Always scoped to what the signed-in user can actually see.

**Dashboards** — Super Admin sees department/user/document counts, recent uploads, and a live activity feed. Staff users see their accessible departments and recently added documents.

**Audit log** — every login (success/failure), document action, user-management action, and permission change is recorded with actor, target, timestamp, and IP, filterable by action/user/date in **Admin → Audit Logs**.

**Security** — bcrypt-hashed passwords, forced password change on first login (and after an admin-triggered reset), a rolling 30-minute inactivity timeout with an in-app warning dialog before sign-out, and middleware-enforced route protection (including admin-only routes).

## Project structure

```
app/
  login/                       public login page
  change-password/             forced/voluntary password change
  (app)/                       authenticated shell (sidebar + topbar)
    dashboard/
    departments/[departmentId]/
    folders/[folderId]/
    search/
    admin/departments|users|audit-logs/
  api/
    auth/[...nextauth]/        NextAuth route handler
    documents/[id]/preview|download/   permission-gated file streaming
components/                     UI kit, layout, domain components (folders, documents, admin…)
lib/
  actions/                     Server Actions (departments, folders, documents, users, permissions, search)
  permissions.ts                core RBAC + inheritance engine
  auth.ts / session.ts          NextAuth config + session helpers
  files.ts                      on-disk file storage (storage/uploads/, outside of /public)
db/
  schema.ts                     Drizzle table definitions (MySQL)
  init.sql                      matching raw DDL (applied by db:push)
  helpers.ts                    insertReturning() - MySQL has no RETURNING clause, so we
                                 generate the UUID client-side, insert, then select it back
  index.ts                      mysql2 connection pool + Drizzle instance
  seed.ts                       Super Admin + default departments/folders
```

## Notes on file storage

Uploaded files are stored on disk under `storage/uploads/` (outside `public/`, so they're never served directly by the web server) with randomized filenames. All reads go through `/api/documents/[id]/preview` or `/api/documents/[id]/download`, which check the requester's permission on that document's folder before streaming anything back and log the access in the audit trail.

If you deploy somewhere that can't write to local disk (most serverless platforms), swap `lib/files.ts` to write to an S3-compatible bucket instead of `node:fs` — the rest of the app (permissions, Server Actions, UI) doesn't need to change.

## Database notes

- Every primary key is a client-generated UUID (`varchar(36)`), not an auto-increment integer — this is what lets `db/helpers.ts` build a result object right after `INSERT` without needing MySQL's `RETURNING` (which doesn't exist) or a second round trip through `LAST_INSERT_ID()`.
- `db/init.sql` is applied with `CREATE TABLE IF NOT EXISTS`, so `npm run db:push` is safe to run repeatedly (e.g. on every deploy) without wiping data. There's no migration history table — for schema *changes* after the initial deploy, add `ALTER TABLE` statements by hand (this project intentionally has no migration-generator dependency).
- The `users.email` column relies on the table's `utf8mb4_unicode_ci` collation for case-insensitive uniqueness/lookups, so `JOHN@x.com` and `john@x.com` correctly collide — no separate functional index needed.
