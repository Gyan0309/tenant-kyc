# Data and Storage Model

The app uses Azure Storage only:

- Azure Table Storage for structured records.
- Azure Blob Storage for uploaded files.

## Tables

| Table | Purpose | Partition strategy |
|---|---|---|
| `Owners` | Owner accounts and password hashes | `OWNER` |
| `Properties` | Rental properties | Owner id |
| `Rooms` | Rooms under properties | Property id |
| `Persons` | Tenants, roommates, family members | Room id |
| `Documents` | Metadata for uploaded files | Person id |
| `ConsentLogs` | Audit events | Tenant or owner scoped key |

## Blob Containers

| Container | Purpose |
|---|---|
| `tenant-documents` | Aadhaar scans and supplementary tenant files |
| `property-assets` | Property-level assets for future use |

## Blob Key Conventions

```text
docs/{tenantId}/aadhaar.{ext}
docs/{tenantId}/{docType}.{ext}
persons/{tenantId}/photo.{ext}
```

## Aadhaar Handling

The app does not store full Aadhaar numbers in table rows. During tenant creation, the owner may enter the final four digits only. The persisted value is formatted as:

```text
XXXX XXXX 1234
```

The uploaded Aadhaar scan is stored as a private blob. Viewing a document goes through an authenticated app route; the blob container is not public.

## Consistency Behavior

Tenant creation uploads the Aadhaar blob first, creates the person row, creates the document row, and then recalculates room status. If a later step fails, the app attempts to clean up the uploaded blob and soft-delete partially created table rows.
