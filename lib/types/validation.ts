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

export const createManualTenantSchema = z
  .object({
    roomId: z.string().startsWith("ROOM-"),
    propertyId: z.string().startsWith("PROP-"),
    phone: z.string().regex(/^[1-9]\d{9}$/, "Enter a valid 10-digit phone number"),
    // Move-in date + address only apply to the primary tenant; roommates and
    // family inherit them from the primary. Optional here, enforced below.
    moveInDate: z.string().optional(),
    emergencyContact: z.string().optional(),
    role: z.enum(PERSON_ROLES).default("PRIMARY"),
    relation: z.string().max(60).optional(),
    name: z.string().min(1).max(160),
    dob: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth is required")
      .refine(isAdultDob, "Occupant must be at least 18 years old"),
    gender: z.string().optional(),
    address: z.string().max(800).optional(),
    aadhaarLast4: z.string().regex(/^\d{4}$/).optional(),
    aadhaarPassword: z.string().max(200).optional(),
    documentConsent: z.literal(true),
  })
  .superRefine((val, ctx) => {
    if (val.role === "PRIMARY") {
      if (!val.moveInDate || !/^\d{4}-\d{2}-\d{2}$/.test(val.moveInDate)) {
        ctx.addIssue({ code: "custom", path: ["moveInDate"], message: "Move-in date is required" });
      }
      if (!val.address || val.address.trim().length === 0) {
        ctx.addIssue({ code: "custom", path: ["address"], message: "Address is required" });
      }
    }
    if (val.role === "FAMILY" && (!val.relation || val.relation.trim().length === 0)) {
      ctx.addIssue({ code: "custom", path: ["relation"], message: "Relation is required for a family member" });
    }
  });

export const updateTenantSchema = z.object({
  phone: z.string().regex(/^[1-9]\d{9}$/).optional(),
  moveInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  emergencyContact: z.string().optional(),
});
