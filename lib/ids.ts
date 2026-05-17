import { createId } from "@paralleldrive/cuid2";

export function newOwnerId() {
  return `OWN-${createId()}`;
}

export function newPropertyId() {
  return `PROP-${createId()}`;
}

export function newRoomId() {
  return `ROOM-${createId()}`;
}

export function newTenantId() {
  return `TNT-${createId()}`;
}

export function newDocumentId() {
  return `DOC-${createId()}`;
}

export function newConsentLogId() {
  return `LOG-${Date.now()}-${createId().slice(0, 8)}`;
}
