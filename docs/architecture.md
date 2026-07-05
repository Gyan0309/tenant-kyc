# Architecture

Tenant Manager is currently implemented as a Next.js app with server-side routes for persistence and document handling.

## Runtime Components

```text
Browser
  React pages and client components
    |
Next.js server routes
  Auth, validation, tenancy rules
    |
Azure Storage
  Table Storage for records
  Blob Storage for documents
```

## Application Areas

- `app/dashboard` contains owner-facing property, room, and tenant screens.
- `app/api` contains authenticated server routes for CRUD and document streaming.
- `components` contains UI components and form clients.
- `lib/azure` contains Azure Table and Blob helpers plus repository modules.
- `lib/tenants` contains tenant creation orchestration.
- `lib/types` contains shared enums and zod schemas.

## Tenant Onboarding Flow

1. Owner opens a room and chooses **Add Tenant**.
2. Owner enters tenant details.
3. Owner uploads the Aadhaar scan supplied by the tenant.
4. `POST /api/tenants` validates the multipart form.
5. The Aadhaar file is uploaded to the private document blob container.
6. The tenant row is created in the `Persons` table.
7. A document row is created in the `Documents` table with source `MANUAL_UPLOAD`.
8. Room occupancy status is recalculated.
9. A consent/audit log row is written to `ConsentLogs`.

## Removed Integrations

The app does not use:

- DigiLocker OAuth
- Sandbox KYC
- Aadhaar OTP verification
- Aadhaar XML fetch/decryption
- OAuth verification sessions

Those code paths and docs have been removed to keep the implementation aligned with the manual document-upload product scope.
