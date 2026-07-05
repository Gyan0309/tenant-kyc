# Client setup — the easy way to configure a client's install

Instead of asking the client to edit `%APPDATA%\Tenant Manager\config.json` by
hand, use this folder.

## You (vendor), once per client

1. Open `Configure-TenantManager.ps1`.
2. Paste the client's two Azure connection strings into the two lines near the
   top (`$TableConnectionString`, `$BlobConnectionString`). Save.
3. Send the client **both** files together (a zip is fine):
   - `Configure Tenant Manager.cmd`
   - `Configure-TenantManager.ps1`

For a **shared** account, all clients get the same strings. For **per-client
isolation**, paste that client's own account strings — same procedure.

## The client, once

1. Install the app with `Tenant Manager Setup <version>.exe` (if not already).
2. Double-click **`Configure Tenant Manager.cmd`**.

That's it. The script writes the config to the right place, generates the
security secret automatically, and launches the app. The client never opens a
folder, edits JSON, or sees an Azure key.

> Re-running the script is safe — it keeps the existing login secret and just
> updates the connection strings.
