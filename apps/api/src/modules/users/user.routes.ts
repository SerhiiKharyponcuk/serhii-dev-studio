import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { success } from "../../utils/http.js";

export const userRouter = Router();
const nullableText = (maximum: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().max(maximum).nullable().optional()
  );
userRouter.patch("/me", async (req, res, next) => {
  try {
    const input = z
      .object({
        firstName: z.string().trim().min(2).max(60).optional(),
        lastName: z.string().trim().min(2).max(80).optional(),
        avatarUrl: z.string().url().max(1000).nullable().optional(),
        telegram: nullableText(100),
        discord: nullableText(100),
        country: nullableText(100),
        phone: nullableText(30),
        companyName: nullableText(120),
        billingAddressLine1: nullableText(160),
        billingAddressLine2: nullableText(160),
        billingCity: nullableText(100),
        billingRegion: nullableText(100),
        billingPostalCode: nullableText(30),
        billingCountry: nullableText(100),
        taxId: nullableText(60)
      })
      .strict()
      .refine(
        (value) =>
          (value.firstName === undefined && value.lastName === undefined) ||
          (value.firstName !== undefined && value.lastName !== undefined),
        { message: "First and last name must be updated together", path: ["firstName"] }
      )
      .refine((value) => Object.keys(value).length > 0)
      .parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.auth!.userId },
      data: {
        ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
        ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
        ...(input.firstName && input.lastName
          ? { name: `${input.firstName} ${input.lastName}` }
          : {}),
        ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
        ...(input.telegram !== undefined ? { telegram: input.telegram } : {}),
        ...(input.discord !== undefined ? { discord: input.discord } : {}),
        ...(input.country !== undefined ? { country: input.country } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.companyName !== undefined ? { companyName: input.companyName } : {}),
        ...(input.billingAddressLine1 !== undefined
          ? { billingAddressLine1: input.billingAddressLine1 }
          : {}),
        ...(input.billingAddressLine2 !== undefined
          ? { billingAddressLine2: input.billingAddressLine2 }
          : {}),
        ...(input.billingCity !== undefined ? { billingCity: input.billingCity } : {}),
        ...(input.billingRegion !== undefined ? { billingRegion: input.billingRegion } : {}),
        ...(input.billingPostalCode !== undefined
          ? { billingPostalCode: input.billingPostalCode }
          : {}),
        ...(input.billingCountry !== undefined ? { billingCountry: input.billingCountry } : {}),
        ...(input.taxId !== undefined ? { taxId: input.taxId } : {})
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        avatarUrl: true,
        telegram: true,
        discord: true,
        country: true,
        phone: true,
        companyName: true,
        billingAddressLine1: true,
        billingAddressLine2: true,
        billingCity: true,
        billingRegion: true,
        billingPostalCode: true,
        billingCountry: true,
        taxId: true
      }
    });
    return success(res, "Profile updated", user);
  } catch (error) {
    next(error);
  }
});
