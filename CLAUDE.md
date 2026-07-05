# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Tenant Manager — a property/tenant record system for rental owners (owners, properties, rooms, tenants/roommates, Aadhaar document uploads). Next.js 16 App Router + React 19 + TypeScript, persisting to Azure Table Storage (records) and Azure Blob Storage (documents). No database, no separate backend.

## Commands

```bash
npm run dev          # dev server at http://localhost:3000
npm run lint         # eslint
npx tsc --noEmit     # typecheck (run this + lint + build to verify changes)
npm run build
npm run bootstrap    # create tables + blob containers (Azurite must be running)

npm run desktop      # run the Electron shell against a local standalone build
npm run dist         # build + package the Windows installer into dist-desktop/
```

There is no test suite.

Local dev requires [Azurite](https://learn.microsoft.com/en-us/azure/storage/common/storage-use-azurite) (`azurite --silent --location c:\azurite`) and a `.env.local` copied from `.env.example`. See `docs/local-setup.md`.

## Modified Next.js conventions confirmed in this repo

- Root `proxy.ts` replaces `middleware.ts` — it wraps NextAuth `auth()` and gates all dashboard pages and non-public API routes.
- Route handler `params` is a `Promise` and must be awaited: `{ params }: { params: Promise<{ roomId: string }> }`.
- When touching framework behavior (routing, caching, navigation), check `node_modules/next/dist/docs/01-app/` first per AGENTS.md.

## Desktop shell

`electron/` packages the app as a Windows desktop app: the main process starts the Next.js **standalone** server (`output: 'standalone'` in `next.config.ts`) on a random `127.0.0.1` port and loads it in a `BrowserWindow`. Azure connection strings + `AUTH_SECRET` are loaded at runtime from a per-install `%APPDATA%\Tenant Manager\config.json` (via `electron/config.js`), never baked into the bundle — this is the seam for "one shared Azure account now, per-client account later." The `electron/*.js` and `scripts/postbuild-standalone.mjs` files are CommonJS Node tooling and are excluded from the app's ESLint. Full details in `docs/desktop-packaging.md`.

## Architecture

Request path: React pages/client components → App Router API routes (`app/api/*`) → repository modules (`lib/azure/repos/*`) → Azure Tables/Blobs. Pages live under `app/auth/*` and `app/dashboard/*`. The empty `app/(auth)`, `app/(dashboard)`, `lib/digilocker`, `lib/sandbox`, and `lib/crypto` directories are leftovers from removed code — not the active routes.

### API route pattern

Every protected route follows the same shape (see `app/api/rooms/[roomId]/route.ts`):

1. `const { error, ownerId } = await requireOwner()` (`lib/auth/session.ts`); return `error` if set.
2. Load the entity and verify `entity.ownerId === ownerId` — every table row carries `ownerId`, and this per-row check is the authorization model (the proxy only checks login).
3. Validate bodies with zod schemas from `lib/types/validation.ts` (enums in `lib/types/enums.ts`).
4. Wrap in try/catch returning `handleApiError(err)` / `jsonError()` from `lib/api/errors.ts`.

### Storage model

Azure Tables are partition-keyed hierarchically — you need the parent id to update a row:

| Table | PartitionKey |
|---|---|
| `Owners` | `OWNER` |
| `Properties` | ownerId |
| `Rooms` | propertyId |
| `Persons` | roomId |
| `Documents` | personId |

Blob keys: `docs/{tenantId}/{docType}.{ext}`, `persons/{tenantId}/photo.{ext}` in the private `tenant-documents` container. Details in `docs/data-and-storage.md`.

### Key flows

- **Tenant creation** (`lib/tenants/create.ts`): uploads Aadhaar blob → creates person row → creates document row → recalculates room status (`lib/rooms/status.ts`), with compensating cleanup (blob delete, soft-deletes) if a later step fails. New multi-step writes should follow this pattern.
- **Consent/audit**: mutations write DPDP audit rows to `ConsentLogs` via `lib/consent/log.ts`.
- **Auth**: NextAuth v5 beta credentials provider (`lib/auth/config.ts`), JWT sessions; `session.user.id` is the ownerId (augmented in `types/next-auth.d.ts`).

## Constraints

- Never store full Aadhaar numbers in table rows — only the masked form `XXXX XXXX 1234` (last four digits, owner-entered). Document scans stay in private blob containers and are served only through authenticated app routes, never public URLs.
- DigiLocker, Sandbox KYC, and Aadhaar OTP integrations were deliberately removed (see `docs/architecture.md`); identity verification is manual document upload only. Do not reintroduce them.
