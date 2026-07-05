# Local development setup

## Prerequisites

- Node.js 20+
- [Azurite](https://learn.microsoft.com/en-us/azure/storage/common/storage-use-azurite) for Azure Table and Blob emulation

## 1. Install Azurite

```bash
npm install -g azurite
```

Start Azurite (tables + blob):

```bash
azurite --silent --location c:\azurite --debug c:\azurite\debug.log
```

Default ports: Blob `10000`, Queue `10001`, Table `10002`.

## 2. Environment

Copy `.env.example` to `.env.local` and set:

| Variable | Notes |
|----------|--------|
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `AZURE_TABLE_CONNECTION_STRING` | Azure Table Storage or Azurite table connection string |
| `AZURE_STORAGE_CONNECTION_STRING` | Azure Blob Storage or Azurite blob connection string |
| `AZURE_BLOB_CONTAINER_DOCS` | Optional, defaults to `tenant-documents` |

## 3. Bootstrap Azure resources

```bash
npm run bootstrap
```

Creates tables: `Owners`, `Properties`, `Rooms`, `Persons`, `Documents`, `ConsentLogs`, and blob containers `tenant-documents`, `property-assets`.

## 4. Run the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), register an owner account, and create a property.

## Production notes (later)

- Move secrets to Azure Key Vault
- Use a real Azure Storage account connection string
- Set `AUTH_URL` to your production domain
- Keep Aadhaar document containers private
