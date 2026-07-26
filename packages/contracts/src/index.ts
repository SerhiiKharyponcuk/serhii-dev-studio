import { z } from "zod";

export const projectTypes = [
  "Landing Page",
  "Business Website",
  "Online Shop",
  "Portfolio",
  "Dashboard",
  "Minecraft Store",
  "Custom Web App",
  "Other"
] as const;

export const orderSchema = z.object({
  projectType: z.enum(projectTypes),
  projectName: z.string().trim().min(2).max(120),
  companyName: z.string().trim().max(120).optional(),
  description: z.string().trim().min(20).max(5000),
  requiredFeatures: z.string().trim().max(3000),
  references: z.string().trim().max(1500).optional(),
  budgetRange: z.string().trim().min(1).max(80),
  preferredDeadline: z.string().date().optional(),
  deadlineFlexible: z.boolean(),
  name: z.string().trim().min(2).max(100),
  email: z.string().email().max(254),
  telegram: z.string().trim().max(100).optional(),
  discord: z.string().trim().max(100).optional(),
  country: z.string().trim().min(2).max(100)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

export const registerSchema = loginSchema.extend({
  name: z.string().trim().min(2).max(100)
});

export type OrderInput = z.infer<typeof orderSchema>;
