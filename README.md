# Tenant Manager

Tenant Manager is a property and tenant record system for rental owners. It tracks owners, properties, rooms, occupants, move-in details, emergency contacts, and private tenant documents.

The current product flow is intentionally simple:

1. Create an owner account.
2. Add properties and rooms.
3. Add a tenant or roommate.
4. Upload the Aadhaar scan supplied by the tenant.
5. Store tenant records in Azure Table Storage and documents in private Azure Blob Storage.

There is no DigiLocker, Sandbox KYC, Aadhaar OTP, or third-party identity verification flow in this version.

## Current App Shape

This repository contains the Next.js application that powers the tenant-management UI and server routes, plus an Electron desktop shell that runs it as a native Windows app. It can run either as a local web app (`npm run dev`) or as a packaged desktop app against Azure Storage or Azurite.

The desktop shell (`electron/`) starts the Next.js standalone server locally and displays it in a native window; Azure connection strings are loaded per-install from `%APPDATA%\Tenant Manager\config.json`, never baked into the bundle. Build it with `npm run dist`. See [docs/desktop-packaging.md](docs/desktop-packaging.md).

## Core Features

- Owner registration and credential login.
- Property and room management.
- Room occupancy status calculation.
- Tenant and roommate records.
- Manual Aadhaar document upload.
- Supplementary document uploads.
- Private document streaming through authenticated routes.
- DPDP-oriented consent/audit log entries.
- Local development with Azurite.

## Architecture

```text
Next.js App
  React UI
  App Router API routes
    |
    |-- Azure Table Storage
    |     Owners, Properties, Rooms, Persons, Documents, ConsentLogs
    |
    |-- Azure Blob Storage
          tenant-documents, property-assets
```

More detail:

- [Architecture](docs/architecture.md)
- [Data and storage model](docs/data-and-storage.md)
- [Local setup](docs/local-setup.md)
- [Desktop packaging](docs/desktop-packaging.md)
- [Deployment guide (build → ship → install → configure)](docs/deployment-guide.md)

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- NextAuth credentials auth
- Azure Table Storage
- Azure Blob Storage
- Tailwind CSS / shadcn-style components

## Run Locally

Install dependencies:

```bash
npm install
```

Set environment variables in `.env.local` or `.env`.

```bash
AUTH_SECRET=replace-with-random-secret
NEXTAUTH_SECRET=replace-with-random-secret
AZURE_TABLE_CONNECTION_STRING=replace-with-azure-or-azurite-table-connection-string
AZURE_STORAGE_CONNECTION_STRING=replace-with-azure-or-azurite-blob-connection-string
AZURE_BLOB_CONTAINER_DOCS=tenant-documents
AZURE_BLOB_CONTAINER_ASSETS=property-assets
```

Start Azurite, then bootstrap storage:

```bash
npm run bootstrap
```

Run the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Verification Commands

```bash
npx tsc --noEmit
npm run lint
npm run build
```

## Security Notes

- Aadhaar files are stored in private blob containers.
- Full Aadhaar numbers are not stored in tenant rows; only an optional masked last-four reference is stored.
- Azure Storage connection strings and auth secrets must stay server-side.
- Do not expose storage account keys to browser code.
