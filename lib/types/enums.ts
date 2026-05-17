export const ROOM_STATUSES = ["VACANT", "OCCUPIED", "PARTIAL"] as const;
export type RoomStatus = (typeof ROOM_STATUSES)[number];

export const PERSON_ROLES = ["PRIMARY", "ROOMMATE", "FAMILY"] as const;
export type PersonRole = (typeof PERSON_ROLES)[number];

export const DOC_TYPES = [
  "AADHAAR",
  "PAN",
  "DRIVING_LICENSE",
  "PHOTO",
  "OTHER",
] as const;
export type DocType = (typeof DOC_TYPES)[number];

export const DOC_SOURCES = ["DIGILOCKER", "MANUAL_UPLOAD"] as const;
export type DocSource = (typeof DOC_SOURCES)[number];

export const CONSENT_ACTIONS = [
  "AADHAAR_CONSENT_GIVEN",
  "DOCUMENT_UPLOADED",
  "PERSON_DELETED",
  "DATA_ERASURE_REQUESTED",
] as const;
export type ConsentAction = (typeof CONSENT_ACTIONS)[number];

export const SESSION_STATUSES = ["PENDING", "COMPLETED", "EXPIRED"] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];
