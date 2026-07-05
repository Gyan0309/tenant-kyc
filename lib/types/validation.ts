import { z } from "zod";
import {
  PERSON_ROLES,
  ROOM_STATUSES,
} from "./enums";
import { isAdultDob } from "@/lib/age";

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

export const createManualTenantSchema = z.object({
  roomId: z.string().startsWith("ROOM-"),
  propertyId: z.string().startsWith("PROP-"),
  phone: z.string().min(10).max(15),
  moveInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  emergencyContact: z.string().optional(),
  role: z.enum(PERSON_ROLES).default("PRIMARY"),
  name: z.string().min(1).max(160),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth is required")
    .refine(isAdultDob, "Occupant must be at least 18 years old"),
  gender: z.string().optional(),
  address: z.string().min(1).max(800),
  aadhaarLast4: z.string().regex(/^\d{4}$/).optional(),
  aadhaarPassword: z.string().max(200).optional(),
  documentConsent: z.literal(true),
});

export const updateTenantSchema = z.object({
  phone: z.string().min(10).max(15).optional(),
  moveInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  emergencyContact: z.string().optional(),
});
