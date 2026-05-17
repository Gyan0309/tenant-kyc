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
| `ENCRYPTION_KEY` | 64 hex chars: `openssl rand -hex 32` |
| `AZURE_TABLE_CONNECTION_STRING` | Azurite defaults in `.env.example` |
| `AZURE_STORAGE_CONNECTION_STRING` | Azurite defaults in `.env.example` |
| DigiLocker vars | Optional until partner approval — see [digilocker-integration.md](./digilocker-integration.md) |

## 3. Bootstrap Azure resources

```bash
npm run bootstrap
```

Creates tables: `Owners`, `Properties`, `Rooms`, `Persons`, `Documents`, `ConsentLogs`, `Sessions`, and blob containers `tenant-documents`, `property-assets`.

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
- Register production DigiLocker redirect URI
