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
        message: z.string().trim().min(20).max(5000)
      })
      .parse(req.body);
    const record = await prisma.contactRequest.create({
      data: { ...input, email: input.email.toLowerCase() }
    });
    return success(res, "Message received", { id: record.id }, 201);
  } catch (e) {
    next(e);
  }
});
