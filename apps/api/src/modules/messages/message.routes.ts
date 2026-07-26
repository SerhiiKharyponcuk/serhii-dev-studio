import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { AppError, success } from "../../utils/http.js";
import { messageEvents } from "../../services/realtime/message-events.js";

export const messageRouter = Router();
messageRouter.get("/conversations", async (req, res, next) => {
  try {
    const query = z.object({ search: z.string().trim().max(100).optional() }).parse(req.query);
    const conversations = await prisma.conversation.findMany({
      where: {
        ...(req.auth!.role === "ADMIN" ? {} : { participants: { some: { id: req.auth!.userId } } }),
        ...(query.search
          ? {
              OR: [
                { subject: { contains: query.search, mode: "insensitive" as const } },
                {
                  messages: {
                    some: { content: { contains: query.search, mode: "insensitive" as const } }
                  }
                }
              ]
            }
          : {})
      },
      include: {
        participants: { select: { id: true, name: true, avatarUrl: true, role: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 }
      },
      orderBy: { updatedAt: "desc" }
    });
    return success(res, "Conversations loaded", conversations);
  } catch (e) {
    next(e);
  }
});
messageRouter.post("/conversations", async (req, res, next) => {
  try {
    const input = z
      .object({
        subject: z.string().trim().min(3).max(150),
        projectId: z.string().cuid().optional(),
        participantId: z.string().cuid().optional()
      })
      .parse(req.body);
    if (input.projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: input.projectId,
          ...(req.auth!.role === "ADMIN" ? {} : { clientId: req.auth!.userId })
        }
      });
      if (!project) throw new AppError(404, "Project not found");
    }
    let counterpartId: string | undefined;
    if (req.auth!.role === "CLIENT") {
      counterpartId = (
        await prisma.user.findFirst({
          where: { role: "ADMIN", status: "ACTIVE", deletedAt: null },
          select: { id: true }
        })
      )?.id;
    } else {
      if (!input.participantId)
        throw new AppError(422, "Select a client for the conversation", "CLIENT_REQUIRED");
      counterpartId = (
        await prisma.user.findFirst({
          where: {
            id: input.participantId,
            role: "CLIENT",
            status: "ACTIVE",
            deletedAt: null
          },
          select: { id: true }
        })
      )?.id;
      if (!counterpartId) throw new AppError(404, "Client not found");
    }
    const participantIds = [
      ...new Set([req.auth!.userId, ...(counterpartId ? [counterpartId] : [])])
    ];
    const conversation = await prisma.conversation.create({
      data: {
        subject: input.subject,
        projectId: input.projectId ?? null,
        participants: { connect: participantIds.map((id) => ({ id })) }
      }
    });
    return success(res, "Conversation created", conversation, 201);
  } catch (error) {
    next(error);
  }
});
messageRouter.get("/conversations/:id", async (req, res, next) => {
  try {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: req.params.id,
        ...(req.auth!.role === "ADMIN" ? {} : { participants: { some: { id: req.auth!.userId } } })
      },
      include: {
        messages: {
          include: { sender: { select: { id: true, name: true, role: true } }, attachments: true },
          orderBy: { createdAt: "asc" }
        }
      }
    });
    if (!conversation) throw new AppError(404, "Conversation not found");
    return success(res, "Conversation loaded", conversation);
  } catch (e) {
    next(e);
  }
});
messageRouter.post("/conversations/:id/messages", async (req, res, next) => {
  try {
    const input = z.object({ content: z.string().trim().min(1).max(5000) }).parse(req.body);
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: req.params.id,
        ...(req.auth!.role === "ADMIN" ? {} : { participants: { some: { id: req.auth!.userId } } })
      }
    });
    if (!conversation) throw new AppError(404, "Conversation not found");
    const message = await prisma.message.create({
      data: { conversationId: conversation.id, senderId: req.auth!.userId, content: input.content }
    });
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() }
    });
    await messageEvents.publishMessageCreated({
      conversationId: conversation.id,
      messageId: message.id,
      senderId: message.senderId,
      createdAt: message.createdAt
    });
    return success(res, "Message sent", message, 201);
  } catch (e) {
    next(e);
  }
});
messageRouter.patch("/conversations/:id/read", async (req, res, next) => {
  try {
    const conversationId = z.string().cuid().parse(req.params.id);
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        ...(req.auth!.role === "ADMIN" ? {} : { participants: { some: { id: req.auth!.userId } } })
      }
    });
    if (!conversation) throw new AppError(404, "Conversation not found");
    const result = await prisma.message.updateMany({
      where: { conversationId, senderId: { not: req.auth!.userId }, readAt: null },
      data: { readAt: new Date() }
    });
    return success(res, "Messages marked as read", { count: result.count });
  } catch (error) {
    next(error);
  }
});
