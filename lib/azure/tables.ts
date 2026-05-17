import { TableClient } from "@azure/data-tables";

export const TABLE_NAMES = [
  "Owners",
  "Properties",
  "Rooms",
  "Persons",
  "Documents",
  "ConsentLogs",
  "Sessions",
] as const;

export type TableName = (typeof TABLE_NAMES)[number];

function getConnectionString(): string {
  const cs = process.env.AZURE_TABLE_CONNECTION_STRING;
  if (!cs) {
    throw new Error("AZURE_TABLE_CONNECTION_STRING is not set");
  }
  return cs;
}

const clients = new Map<TableName, TableClient>();

export function getTableClient(tableName: TableName): TableClient {
  let client = clients.get(tableName);
  if (!client) {
    client = TableClient.fromConnectionString(
      getConnectionString(),
      tableName,
    );
    clients.set(tableName, client);
  }
  return client;
}

export async function ensureTablesExist(): Promise<void> {
  const cs = getConnectionString();
  for (const name of TABLE_NAMES) {
    const client = TableClient.fromConnectionString(cs, name);
    try {
      await client.createTable();
    } catch (err: unknown) {
      const code =
        err && typeof err === "object" && "statusCode" in err
          ? (err as { statusCode: number }).statusCode
          : 0;
      if (code !== 409) throw err;
    }
  }
}
