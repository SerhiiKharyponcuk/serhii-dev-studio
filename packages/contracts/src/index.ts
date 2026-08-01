import { z } from "zod";

export const projectTypes = [
  "Landing Page",
  "Business Website",
  "Online Shop",
  "Portfolio",
  "Admin Dashboard",
  "Client Dashboard",
  "Minecraft Store",
  "Custom Web App",
  "Website from Scratch",
  "Website Redesign",
  "Website Maintenance",
  "Other"
] as const;

export const buildApproaches = ["NEW_WEBSITE", "REDESIGN", "EXISTING_PROJECT"] as const;

export const websiteAddOns = [
  { id: "cms", label: "Content management", description: "Edit pages without code", price: 320 },
  { id: "ecommerce", label: "Online shop", description: "Products, cart and checkout", price: 880 },
  {
    id: "booking",
    label: "Booking calendar",
    description: "Appointments and availability",
    price: 400
  },
  { id: "accounts", label: "User accounts", description: "Secure sign-up and sign-in", price: 480 },
  {
    id: "dashboard",
    label: "Client dashboard",
    description: "Private workspace and data",
    price: 720
  },
  {
    id: "payments",
    label: "Online payments",
    description: "Payment provider integration",
    price: 560
  },
  { id: "blog", label: "Blog", description: "Articles, categories and SEO", price: 240 },
  {
    id: "multilingual",
    label: "Multiple languages",
    description: "Localized content structure",
    price: 320
  },
  {
    id: "chat",
    label: "Live or internal chat",
    description: "Real-time conversations",
    price: 480
  },
  { id: "analytics", label: "Analytics", description: "Privacy-aware measurement", price: 160 },
  {
    id: "advanced-seo",
    label: "Advanced SEO",
    description: "Structured data and technical audit",
    price: 240
  },
  {
    id: "motion",
    label: "Premium motion design",
    description: "Purposeful custom animations",
    price: 280
  },
  {
    id: "themes",
    label: "Light and dark themes",
    description: "Theme switching and persistence",
    price: 160
  },
  {
    id: "integrations",
    label: "External integration",
    description: "CRM, API or automation",
    price: 400
  }
] as const;

export type WebsiteAddOnId = (typeof websiteAddOns)[number]["id"];
const websiteAddOnIds = websiteAddOns.map((item) => item.id) as [
  WebsiteAddOnId,
  ...WebsiteAddOnId[]
];

export const projectStartingPrices: Record<(typeof projectTypes)[number], number> = {
  "Landing Page": 600,
  "Business Website": 1200,
  "Online Shop": 2240,
  Portfolio: 720,
  "Admin Dashboard": 1760,
  "Client Dashboard": 1920,
  "Minecraft Store": 1440,
  "Custom Web App": 2800,
  "Website from Scratch": 1200,
  "Website Redesign": 960,
  "Website Maintenance": 144,
  Other: 600
};

export function calculateOrderEstimate(
  projectType: (typeof projectTypes)[number],
  selectedFeatures: readonly WebsiteAddOnId[]
) {
  const addOnTotal = websiteAddOns
    .filter((item) => selectedFeatures.includes(item.id))
    .reduce((total, item) => total + item.price, 0);
  return projectStartingPrices[projectType] + addOnTotal;
}

const optionalText = (maximum: number) => z.string().trim().max(maximum).optional();

export const orderSchema = z
  .object({
    projectType: z.enum(projectTypes),
    buildApproach: z.enum(buildApproaches),
    selectedFeatures: z.array(z.enum(websiteAddOnIds)).max(websiteAddOns.length),
    projectName: z.string().trim().min(2).max(120),
    companyName: optionalText(120),
    description: z.string().trim().min(20).max(5000),
    requiredFeatures: optionalText(3000),
    references: optionalText(1500),
    budgetRange: z.string().trim().min(1).max(80),
    preferredDeadline: z.union([z.string().date(), z.literal("")]).optional(),
    deadlineFlexible: z.boolean(),
    firstName: z.string().trim().min(2).max(60),
    lastName: z.string().trim().min(2).max(80),
    name: optionalText(100),
    email: z.string().trim().email().max(254),
    phone: optionalText(30),
    telegram: optionalText(100),
    discord: optionalText(100),
    billingCompanyName: optionalText(120),
    billingAddressLine1: optionalText(160),
    billingAddressLine2: optionalText(160),
    billingCity: optionalText(100),
    billingRegion: optionalText(100),
    billingPostalCode: optionalText(30),
    country: z.string().trim().min(2).max(100),
    taxId: optionalText(60),
    website: z.string().max(100).optional(),
    formStartedAt: z.number().int().positive().optional()
  })
  .strict()
  .superRefine((value, context) => {
    const billingFields = [value.billingAddressLine1, value.billingCity, value.billingPostalCode];
    if (billingFields.some(Boolean) && billingFields.some((field) => !field)) {
      context.addIssue({
        code: "custom",
        path: ["billingAddressLine1"],
        message: "Street, city and postal code are required when adding a billing address"
      });
    }
  });

export const loginSchema = z
  .object({ email: z.string().trim().email().max(254), password: z.string().min(8).max(128) })
  .strict();

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(2).max(60),
    lastName: z.string().trim().min(2).max(80),
    name: z.string().trim().min(2).max(100).optional(),
    email: z.string().trim().email().max(254),
    password: z
      .string()
      .min(12)
      .max(128)
      .regex(/[a-z]/, "Password needs a lowercase letter")
      .regex(/[A-Z]/, "Password needs an uppercase letter")
      .regex(/[0-9]/, "Password needs a number")
  })
  .strict();

export type OrderInput = z.infer<typeof orderSchema>;
