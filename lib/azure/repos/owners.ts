import { getTableClient } from "@/lib/azure/tables";
import { newOwnerId } from "@/lib/ids";
import bcrypt from "bcryptjs";

export interface OwnerEntity {
  partitionKey: string;
  rowKey: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  isActive: boolean;
}

export async function createOwner(
  name: string,
  email: string,
  password: string,
): Promise<OwnerEntity> {
  const client = getTableClient("Owners");
  const ownerId = newOwnerId();
  const passwordHash = await bcrypt.hash(password, 12);
  const createdAt = new Date().toISOString();
  const normalizedEmail = email.toLowerCase();

  const entity: OwnerEntity = {
    partitionKey: "OWNER",
    rowKey: ownerId,
    name,
    email: normalizedEmail,
    passwordHash,
    createdAt,
    isActive: true,
  };

  await client.createEntity(entity);

  // Email index for O(1) login lookup
  await client.createEntity({
    partitionKey: "EMAIL",
    rowKey: normalizedEmail,
    ownerId,
  });

  return entity;
}

export async function findOwnerByEmail(
  email: string,
): Promise<OwnerEntity | null> {
  const client = getTableClient("Owners");
  const normalizedEmail = email.toLowerCase();

  try {
    const index = await client.getEntity<{ ownerId: string }>(
      "EMAIL",
      normalizedEmail,
    );
    const owner = await client.getEntity<OwnerEntity>(
      "OWNER",
      index.ownerId as string,
    );
    return owner as OwnerEntity;
  } catch {
    return null;
  }
}

export async function getOwnerById(
  ownerId: string,
): Promise<OwnerEntity | null> {
  const client = getTableClient("Owners");
  try {
    const owner = await client.getEntity<OwnerEntity>("OWNER", ownerId);
    return owner as OwnerEntity;
  } catch {
    return null;
  }
}
