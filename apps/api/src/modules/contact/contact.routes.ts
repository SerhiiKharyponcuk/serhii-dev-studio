import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { success } from "../../utils/http.js";

export const contactRouter = Router();
contactRouter.post("/", async (req, res, next) => {
  try {
    const input = z
      .object({
        name: z.string().trim().min(2).max(100),
        email: z.string().email().max(254),
        subject: z.string().trim().min(3).max(150),
        message: z.string().trim().min(20).max(5000),
        website: z.string().max(100).optional(),
        formStartedAt: z.coerce.number().int().positive().optional()
      })
      .strict()
      .parse(req.body);
    if (input.website) return success(res, "Message received", { received: true }, 201);
    if (input.formStartedAt && Date.now() - input.formStartedAt < 1_500)
      return res.status(422).json({
        success: false,
        message: "Please review your message before submitting",
        error: { code: "FORM_TOO_FAST" }
      });
    const record = await prisma.contactRequest.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        subject: input.subject,
        message: input.message
      }
    });
    return success(res, "Message received", { id: record.id }, 201);
  } catch (e) {
    next(e);
  }
});
