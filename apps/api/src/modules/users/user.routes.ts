import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { success } from "../../utils/http.js";

export const userRouter = Router();
userRouter.patch("/me", async (req, res, next) => {
  try {
    const input = z
      .object({
        name: z.string().trim().min(2).max(100).optional(),
        avatarUrl: z.string().url().max(1000).nullable().optional(),
        telegram: z.string().trim().max(100).nullable().optional(),
        discord: z.string().trim().max(100).nullable().optional(),
        country: z.string().trim().max(100).nullable().optional()
      })
      .refine((value) => Object.keys(value).length > 0)
      .parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.auth!.userId },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
        ...(input.telegram !== undefined ? { telegram: input.telegram } : {}),
        ...(input.discord !== undefined ? { discord: input.discord } : {}),
        ...(input.country !== undefined ? { country: input.country } : {})
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        telegram: true,
        discord: true,
        country: true
      }
    });
    return success(res, "Profile updated", user);
  } catch (error) {
    next(error);
  }
});
