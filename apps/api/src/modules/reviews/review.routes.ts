import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { authenticate, authorize } from "../../middleware/auth.js";
import { AppError, success } from "../../utils/http.js";

export const reviewRouter = Router();

reviewRouter.get("/", async (_req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { status: "APPROVED" },
      select: {
        id: true,
        rating: true,
        title: true,
        message: true,
        clientName: true,
        clientAvatarUrl: true,
        createdAt: true,
        project: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    return success(res, "Reviews loaded", reviews);
  } catch (error) {
    next(error);
  }
});

reviewRouter.post("/", authenticate, async (req, res, next) => {
  try {
    const input = z
      .object({
        projectId: z.string().cuid(),
        rating: z.number().int().min(1).max(5),
        title: z.string().trim().min(3).max(100),
        message: z.string().trim().min(20).max(2000)
      })
      .parse(req.body);
    const project = await prisma.project.findFirst({
      where: { id: input.projectId, clientId: req.auth!.userId, status: "COMPLETED" },
      include: { client: true }
    });
    if (!project) throw new AppError(404, "Completed project not found");
    const review = await prisma.review.create({
      data: {
        ...input,
        clientId: project.clientId,
        clientName: project.client.name,
        clientAvatarUrl: project.client.avatarUrl
      }
    });
    return success(res, "Review submitted for moderation", review, 201);
  } catch (error) {
    next(error);
  }
});

reviewRouter.patch("/:id/status", authenticate, authorize("ADMIN"), async (req, res, next) => {
  try {
    const input = z.object({ status: z.enum(["APPROVED", "REJECTED"]) }).parse(req.body);
    const reviewId = z.string().cuid().parse(req.params.id);
    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { status: input.status }
    });
    return success(res, "Review status updated", review);
  } catch (error) {
    next(error);
  }
});
