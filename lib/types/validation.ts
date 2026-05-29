import { z } from "zod";
import {
  DOC_TYPES,
  PERSON_ROLES,
  ROOM_STATUSES,
} from "./enums";

const maskedAadhaarSchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      if (/^\d{12}$/.test(val.replace(/\s/g, ""))) return false;
      return true;
    },
    { message: "Full 12-digit Aadhaar numbers are not allowed" },
  );

export const registerOwnerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createPropertySchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  totalRooms: z.number().int().min(0).optional(),
});

export const updatePropertySchema = createPropertySchema.partial();

export const createRoomSchema = z.object({
  propertyId: z.string().startsWith("PROP-"),
  roomNumber: z.string().min(1).max(50),
  capacity: z.number().int().min(1).max(20),
  monthlyRent: z.number().int().min(0),
  floor: z.number().int().optional(),
});

export const updateRoomSchema = z.object({
  roomNumber: z.string().min(1).max(50).optional(),
  capacity: z.number().int().min(1).max(20).optional(),
  monthlyRent: z.number().int().min(0).optional(),
  status: z.enum(ROOM_STATUSES).optional(),
  floor: z.number().int().optional(),
});

export const digilockerInitiateSchema = z.object({
  roomId: z.string().startsWith("ROOM-"),
  propertyId: z.string().startsWith("PROP-"),
  role: z.enum(PERSON_ROLES).default("PRIMARY"),
  verifiedMobile: z.string().regex(/^\d{10}$/).optional(),
  contactPhone: z.string().regex(/^\d{10}$/).optional(),
});

export const aadhaarOtpInitiateSchema = z.object({
  roomId: z.string().startsWith("ROOM-"),
  propertyId: z.string().startsWith("PROP-"),
  role: z.enum(PERSON_ROLES).default("PRIMARY"),
  aadhaarNumber: z.string().regex(/^\d{12}$/),
  contactPhone: z.string().regex(/^\d{10}$/).optional(),
  consent: z.literal(true),
});

export const aadhaarOtpVerifySchema = z.object({
  state: z.string().min(1),
  otp: z.string().regex(/^\d{6}$/),
});

export const createTenantSchema = z.object({
  roomId: z.string().startsWith("ROOM-"),
  propertyId: z.string().startsWith("PROP-"),
  sessionState: z.string().min(1),
  phone: z.string().min(10).max(15).optional(),
  moveInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  emergencyContact: z.string().optional(),
  role: z.enum(PERSON_ROLES).default("PRIMARY"),
  name: z.string().min(1).optional(),
  dob: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  maskedAadhaar: maskedAadhaarSchema,
});

export const updateTenantSchema = z.object({
  phone: z.string().min(10).max(15).optional(),
  moveInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  emergencyContact: z.string().optional(),
});
