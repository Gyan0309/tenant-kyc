import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  type ContainerClient,
} from "@azure/storage-blob";

const containerClients = new Map<string, ContainerClient>();

function getBlobServiceClient(): BlobServiceClient {
  const cs = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!cs) {
    throw new Error("AZURE_STORAGE_CONNECTION_STRING is not set");
  }
  return BlobServiceClient.fromConnectionString(cs);
}

export function getContainerClient(containerName: string): ContainerClient {
  let client = containerClients.get(containerName);
  if (!client) {
    client = getBlobServiceClient().getContainerClient(containerName);
    containerClients.set(containerName, client);
  }
  return client;
}

export async function ensureContainersExist(): Promise<void> {
  const docs = process.env.AZURE_BLOB_CONTAINER_DOCS ?? "tenant-documents";
  const assets = process.env.AZURE_BLOB_CONTAINER_ASSETS ?? "property-assets";
  for (const name of [docs, assets]) {
    const container = getContainerClient(name);
    await container.createIfNotExists();
  }
}

export async function uploadBuffer(
  containerName: string,
  blobKey: string,
  buffer: Buffer,
  contentType: string,
): Promise<void> {
  const container = getContainerClient(containerName);
  await container.createIfNotExists();
  const blockBlob = container.getBlockBlobClient(blobKey);
  await blockBlob.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: contentType },
  });
}

export async function copyBlob(
  containerName: string,
  sourceKey: string,
  destKey: string,
): Promise<void> {
  const container = getContainerClient(containerName);
  const source = container.getBlockBlobClient(sourceKey);
  const dest = container.getBlockBlobClient(destKey);
  const poller = await dest.beginCopyFromURL(source.url);
  await poller.pollUntilDone();
}

export async function deleteBlob(
  containerName: string,
  blobKey: string,
): Promise<void> {
  const container = getContainerClient(containerName);
  await container.getBlockBlobClient(blobKey).deleteIfExists();
}

export async function downloadBuffer(
  containerName: string,
  blobKey: string,
): Promise<Buffer> {
  const container = getContainerClient(containerName);
  const blob = container.getBlockBlobClient(blobKey);
  const response = await blob.download(0);
  const chunks: Buffer[] = [];
  if (!response.readableStreamBody) {
    throw new Error("Empty blob stream");
  }
  for await (const chunk of response.readableStreamBody) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export function generateReadSasUrl(
  containerName: string,
  blobKey: string,
  expiresInMinutes = 60,
): string {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  if (!accountName || !accountKey) {
    throw new Error("AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY required for SAS");
  }

  const credential = new StorageSharedKeyCredential(accountName, accountKey);
  const expiresOn = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  const sas = generateBlobSASQueryParameters(
    {
      containerName,
      blobName: blobKey,
      permissions: BlobSASPermissions.parse("r"),
      expiresOn,
    },
    credential,
  ).toString();

  const cs = process.env.AZURE_STORAGE_CONNECTION_STRING ?? "";
  if (
    cs === "UseDevelopmentStorage=true" ||
    cs.includes("127.0.0.1") ||
    cs.includes("localhost")
  ) {
    const base =
      cs.match(/BlobEndpoint=([^;]+)/)?.[1] ??
      "http://127.0.0.1:10000/devstoreaccount1";
    return `${base}/${containerName}/${blobKey}?${sas}`;
  }

  const blobUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${blobKey}`;
  return `${blobUrl}?${sas}`;
}

export function getDocsContainer(): string {
  return process.env.AZURE_BLOB_CONTAINER_DOCS ?? "tenant-documents";
}
