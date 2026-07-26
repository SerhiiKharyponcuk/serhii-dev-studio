import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { authorize } from "../../middleware/auth.js";
import { AppError, success } from "../../utils/http.js";
import { createInvoicePdf } from "../../services/pdf/invoice-pdf.js";
import { decryptJson, encryptJson } from "../../services/security/encryption.js";
import { nextManualPaymentStatus } from "../payments/payment.rules.js";
import { audit } from "../../services/audit/audit.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { manualBankTransferProvider } from "../../services/payments/payment-provider.js";

const bankSchema = z.object({
  accountHolder: z.string().min(2).max(150),
  bankName: z.string().min(2).max(150),
  iban: z.string().min(8).max(42),
  cardNumber: z.string().max(25).optional(),
  currency: z.string().regex(/^[A-Z]{3}$/i),
  paymentInstructions: z.string().max(2000)
});

export const clientRouter = Router();
clientRouter.get("/overview", async (req, res, next) => {
  try {
    const [activeProjects, unreadMessages, openInvoices, recentFiles, recentUpdates] =
      await Promise.all([
        prisma.project.count({
          where: {
            clientId: req.auth!.userId,
            deletedAt: null,
            status: { notIn: ["COMPLETED", "CANCELLED"] }
          }
        }),
        prisma.message.count({
          where: {
            senderId: { not: req.auth!.userId },
            readAt: null,
            conversation: { participants: { some: { id: req.auth!.userId } } }
          }
        }),
        prisma.invoice.count({
          where: {
            clientId: req.auth!.userId,
            status: { notIn: ["PAID", "CANCELLED"] }
          }
        }),
        prisma.file.count({
          where: {
            deletedAt: null,
            clientVisible: true,
            OR: [{ uploaderId: req.auth!.userId }, { project: { clientId: req.auth!.userId } }]
          }
        }),
        prisma.projectUpdate.findMany({
          where: { project: { clientId: req.auth!.userId, deletedAt: null } },
          include: { project: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
          take: 5
        })
      ]);
    return success(res, "Overview loaded", {
      activeProjects,
      unreadMessages,
      openInvoices,
      recentFiles,
      recentUpdates
    });
  } catch (error) {
    next(error);
  }
});
clientRouter.get("/orders", async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { clientId: req.auth!.userId, deletedAt: null },
      orderBy: { createdAt: "desc" }
    });
    return success(res, "Orders loaded", orders);
  } catch (error) {
    next(error);
  }
});
clientRouter.get("/projects", async (req, res, next) => {
  try {
    const rows = await prisma.project.findMany({
      where:
        req.auth!.role === "ADMIN"
          ? { deletedAt: null }
          : { clientId: req.auth!.userId, deletedAt: null },
      include: {
        stages: { orderBy: { position: "asc" } },
        updates: { orderBy: { createdAt: "desc" }, take: 5 }
      },
      orderBy: { updatedAt: "desc" }
    });
    return success(res, "Projects loaded", rows);
  } catch (e) {
    next(e);
  }
});
clientRouter.get("/projects/:id", async (req, res, next) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        deletedAt: null,
        ...(req.auth!.role === "ADMIN" ? {} : { clientId: req.auth!.userId })
      },
      include: {
        stages: true,
        updates: true,
        files: { where: { clientVisible: true, deletedAt: null } },
        payments: true,
        invoices: true
      }
    });
    if (!project) throw new AppError(404, "Project not found", "NOT_FOUND");
    return success(res, "Project loaded", project);
  } catch (e) {
    next(e);
  }
});
clientRouter.get("/payments", async (req, res, next) => {
  try {
    return success(
      res,
      "Payments loaded",
      await prisma.payment.findMany({
        where: req.auth!.role === "ADMIN" ? {} : { clientId: req.auth!.userId },
        orderBy: { createdAt: "desc" }
      })
    );
  } catch (e) {
    next(e);
  }
});
clientRouter.get("/payment-details", async (_req, res, next) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: "bank_details" } });
    if (
      !setting ||
      typeof setting.value !== "object" ||
      setting.value === null ||
      !("ciphertext" in setting.value) ||
      typeof setting.value.ciphertext !== "string"
    )
      return success(res, "Payment details not configured", null);
    const value = decryptJson<z.infer<typeof bankSchema>>(setting.value.ciphertext);
    return success(res, "Payment details loaded", {
      accountHolder: value.accountHolder,
      bankName: value.bankName,
      iban: value.iban,
      currency: value.currency,
      paymentInstructions: value.paymentInstructions
    });
  } catch (error) {
    next(error);
  }
});
clientRouter.post("/payments/:id/paid", authorize("CLIENT"), async (req, res, next) => {
  try {
    const paymentId = z.string().cuid().parse(req.params.id);
    const input = z.object({ proofFileId: z.string().cuid().optional() }).parse(req.body ?? {});
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        clientId: req.auth!.userId
      }
    });
    if (!payment) throw new AppError(404, "Payment not found");
    if (input.proofFileId) {
      const proof = await prisma.file.findFirst({
        where: {
          id: input.proofFileId,
          uploaderId: req.auth!.userId,
          deletedAt: null,
          OR: [{ projectId: payment.projectId }, { projectId: null }]
        }
      });
      if (!proof) throw new AppError(404, "Payment proof file not found");
    }
    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: nextManualPaymentStatus(payment.status, "CLIENT_SUBMIT"),
        proofFileId: input.proofFileId ?? null
      }
    });
    return success(res, "Payment submitted for confirmation", updated);
  } catch (e) {
    next(e);
  }
});
clientRouter.get("/invoices", async (req, res, next) => {
  try {
    return success(
      res,
      "Invoices loaded",
      await prisma.invoice.findMany({
        where: req.auth!.role === "ADMIN" ? {} : { clientId: req.auth!.userId },
        include: { items: true },
        orderBy: { createdAt: "desc" }
      })
    );
  } catch (e) {
    next(e);
  }
});
clientRouter.get("/invoices/:id/pdf", async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: req.params.id,
        ...(req.auth!.role === "ADMIN" ? {} : { clientId: req.auth!.userId })
      },
      include: { items: true }
    });
    if (!invoice) throw new AppError(404, "Invoice not found");
    const pdf = await createInvoicePdf(invoice);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${invoice.invoiceNumber}.pdf"`);
    res.send(pdf);
  } catch (e) {
    next(e);
  }
});
clientRouter.get("/notifications", async (req, res, next) => {
  try {
    return success(
      res,
      "Notifications loaded",
      await prisma.notification.findMany({
        where: { userId: req.auth!.userId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 50
      })
    );
  } catch (e) {
    next(e);
  }
});
clientRouter.patch("/notifications/:id/read", async (req, res, next) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.auth!.userId },
      data: { readAt: new Date() }
    });
    if (!result.count) throw new AppError(404, "Notification not found");
    return success(res, "Notification marked as read", null);
  } catch (e) {
    next(e);
  }
});
clientRouter.patch("/notifications/read-all", async (req, res, next) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId: req.auth!.userId, readAt: null, deletedAt: null },
      data: { readAt: new Date() }
    });
    return success(res, "Notifications marked as read", { count: result.count });
  } catch (error) {
    next(error);
  }
});
clientRouter.delete("/notifications/:id", async (req, res, next) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.auth!.userId, deletedAt: null },
      data: { deletedAt: new Date() }
    });
    if (!result.count) throw new AppError(404, "Notification not found");
    return success(res, "Notification deleted", null);
  } catch (error) {
    next(error);
  }
});

export const adminRouter = Router();
adminRouter.use(authorize("ADMIN", "SUPPORT"));
adminRouter.get("/dashboard", async (_req, res, next) => {
  try {
    const [clients, newOrders, activeProjects, pendingPayments] = await Promise.all([
      prisma.user.count({ where: { role: "CLIENT", deletedAt: null } }),
      prisma.order.count({ where: { status: "NEW" } }),
      prisma.project.count({
        where: { status: { notIn: ["COMPLETED", "CANCELLED"] }, deletedAt: null }
      }),
      prisma.payment.aggregate({
        where: { status: { in: ["PENDING", "WAITING_CONFIRMATION"] } },
        _sum: { amount: true },
        _count: true
      })
    ]);
    return success(res, "Dashboard loaded", {
      clients,
      newOrders,
      activeProjects,
      pendingPayments
    });
  } catch (e) {
    next(e);
  }
});
adminRouter.get("/orders", async (req, res, next) => {
  try {
    const query = z
      .object({
        status: z
          .enum([
            "NEW",
            "CONTACTED",
            "DISCUSSION",
            "ESTIMATION",
            "ACCEPTED",
            "REJECTED",
            "CANCELLED"
          ])
          .optional(),
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20)
      })
      .parse(req.query);
    const where = query.status ? { status: query.status, deletedAt: null } : { deletedAt: null };
    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: "desc" }
      }),
      prisma.order.count({ where })
    ]);
    return success(res, "Orders loaded", {
      items,
      pagination: { page: query.page, limit: query.limit, total }
    });
  } catch (e) {
    next(e);
  }
});
adminRouter.patch("/orders/:id", async (req, res, next) => {
  try {
    const input = z
      .object({
        status: z
          .enum([
            "NEW",
            "CONTACTED",
            "DISCUSSION",
            "ESTIMATION",
            "ACCEPTED",
            "REJECTED",
            "CANCELLED"
          ])
          .optional(),
        notes: z.string().max(5000).optional(),
        assigneeId: z.string().cuid().nullable().optional()
      })
      .refine((value) => Object.keys(value).length > 0)
      .parse(req.body);
    const orderId = z.string().cuid().parse(req.params.id);
    const data: Prisma.OrderUncheckedUpdateInput = {
      ...(input.status ? { status: input.status } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {})
    };
    const order = await prisma.order.update({ where: { id: orderId }, data });
    await audit(req, "ORDER_UPDATED", "Order", order.id, { status: order.status });
    return success(res, "Order updated", order);
  } catch (error) {
    next(error);
  }
});
adminRouter.get("/clients", async (_req, res, next) => {
  try {
    const clients = await prisma.user.findMany({
      where: { role: "CLIENT", deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        country: true,
        status: true,
        createdAt: true,
        _count: { select: { projects: true, payments: true, invoices: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    return success(res, "Clients loaded", clients);
  } catch (error) {
    next(error);
  }
});
adminRouter.get("/audit-logs", authorize("ADMIN"), async (_req, res, next) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: { actor: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    return success(res, "Audit logs loaded", logs);
  } catch (error) {
    next(error);
  }
});
adminRouter.get("/reviews", async (_req, res, next) => {
  try {
    return success(
      res,
      "Reviews loaded",
      await prisma.review.findMany({
        include: { project: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" }
      })
    );
  } catch (error) {
    next(error);
  }
});
adminRouter.get("/services", async (_req, res, next) => {
  try {
    return success(
      res,
      "Services loaded",
      await prisma.service.findMany({ where: { deletedAt: null }, orderBy: { position: "asc" } })
    );
  } catch (error) {
    next(error);
  }
});
adminRouter.get("/portfolio", async (_req, res, next) => {
  try {
    return success(
      res,
      "Portfolio loaded",
      await prisma.portfolioProject.findMany({
        where: { deletedAt: null },
        orderBy: { updatedAt: "desc" }
      })
    );
  } catch (error) {
    next(error);
  }
});
adminRouter.patch("/services/:id", authorize("ADMIN"), async (req, res, next) => {
  try {
    const id = z.string().cuid().parse(req.params.id);
    const input = z
      .object({
        name: z.string().min(2).max(120).optional(),
        description: z.string().min(10).max(3000).optional(),
        deliveryTime: z.string().min(2).max(100).optional(),
        startingPrice: z.number().int().positive().optional(),
        active: z.boolean().optional(),
        position: z.number().int().min(0).optional()
      })
      .refine((value) => Object.keys(value).length > 0)
      .parse(req.body);
    const service = await prisma.service.update({
      where: { id },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.description ? { description: input.description } : {}),
        ...(input.deliveryTime ? { deliveryTime: input.deliveryTime } : {}),
        ...(input.startingPrice !== undefined ? { startingPrice: input.startingPrice } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
        ...(input.position !== undefined ? { position: input.position } : {})
      }
    });
    await audit(req, "SERVICE_UPDATED", "Service", service.id);
    return success(res, "Service updated", service);
  } catch (error) {
    next(error);
  }
});
adminRouter.patch("/portfolio/:id", authorize("ADMIN"), async (req, res, next) => {
  try {
    const id = z.string().cuid().parse(req.params.id);
    const input = z
      .object({
        title: z.string().min(2).max(150).optional(),
        description: z.string().min(10).max(5000).optional(),
        category: z.string().min(2).max(100).optional(),
        demoUrl: z.string().url().nullable().optional(),
        githubUrl: z.string().url().nullable().optional(),
        published: z.boolean().optional(),
        featured: z.boolean().optional()
      })
      .refine((value) => Object.keys(value).length > 0)
      .parse(req.body);
    const project = await prisma.portfolioProject.update({
      where: { id },
      data: {
        ...(input.title ? { title: input.title } : {}),
        ...(input.description ? { description: input.description } : {}),
        ...(input.category ? { category: input.category } : {}),
        ...(input.demoUrl !== undefined ? { demoUrl: input.demoUrl } : {}),
        ...(input.githubUrl !== undefined ? { githubUrl: input.githubUrl } : {}),
        ...(input.published !== undefined ? { published: input.published } : {}),
        ...(input.featured !== undefined ? { featured: input.featured } : {})
      }
    });
    await audit(req, "PORTFOLIO_UPDATED", "PortfolioProject", project.id);
    return success(res, "Portfolio project updated", project);
  } catch (error) {
    next(error);
  }
});
adminRouter.patch("/clients/:id/access", authorize("ADMIN"), async (req, res, next) => {
  try {
    const input = z
      .object({
        role: z.enum(["CLIENT", "SUPPORT", "ADMIN"]).optional(),
        status: z.enum(["ACTIVE", "BLOCKED", "DISABLED"]).optional()
      })
      .refine((value) => Object.keys(value).length > 0)
      .parse(req.body);
    const clientId = z.string().cuid().parse(req.params.id);
    if (clientId === req.auth!.userId && (input.status || input.role !== undefined)) {
      throw new AppError(409, "You cannot change your own administrative access");
    }
    const data: Prisma.UserUncheckedUpdateInput = {
      ...(input.role ? { role: input.role } : {}),
      ...(input.status ? { status: input.status } : {})
    };
    const client = await prisma.user.update({
      where: { id: clientId },
      data,
      select: { id: true, name: true, email: true, role: true, status: true }
    });
    await audit(req, "CLIENT_ACCESS_UPDATED", "User", client.id, {
      role: client.role,
      status: client.status
    });
    return success(res, "Client access updated", client);
  } catch (error) {
    next(error);
  }
});
adminRouter.patch("/projects/:id", async (req, res, next) => {
  try {
    const input = z
      .object({
        status: z
          .enum([
            "NEW",
            "PLANNING",
            "DESIGN",
            "DEVELOPMENT",
            "TESTING",
            "REVIEW",
            "COMPLETED",
            "PAUSED",
            "CANCELLED"
          ])
          .optional(),
        progress: z.number().int().min(0).max(100).optional(),
        deadline: z.string().datetime().nullable().optional()
      })
      .refine((value) => Object.keys(value).length > 0)
      .parse(req.body);
    const projectId = z.string().cuid().parse(req.params.id);
    const data: Prisma.ProjectUncheckedUpdateInput = {
      ...(input.status ? { status: input.status } : {}),
      ...(input.progress !== undefined ? { progress: input.progress } : {}),
      ...(input.deadline !== undefined
        ? { deadline: input.deadline === null ? null : new Date(input.deadline) }
        : {}),
      lastUpdateAt: new Date()
    };
    const project = await prisma.project.update({ where: { id: projectId }, data });
    await prisma.notification.create({
      data: {
        userId: project.clientId,
        type: "PROJECT_UPDATED",
        title: "Project updated",
        message: `${project.name} is now ${project.status.toLowerCase().replaceAll("_", " ")}.`
      }
    });
    await audit(req, "PROJECT_UPDATED", "Project", project.id, {
      status: project.status,
      progress: project.progress
    });
    return success(res, "Project updated", project);
  } catch (error) {
    next(error);
  }
});
adminRouter.post("/orders/:id/convert", authorize("ADMIN"), async (req, res, next) => {
  try {
    const orderId = z.string().cuid().parse(req.params.id);
    const input = z
      .object({
        clientId: z.string().cuid(),
        budget: z.number().int().positive(),
        currency: z.string().length(3).default("USD"),
        deadline: z.string().datetime().optional()
      })
      .parse(req.body);
    const order = await prisma.order.findFirst({
      where: { id: orderId, status: { in: ["ACCEPTED", "ESTIMATION"] }, project: null }
    });
    if (!order) throw new AppError(409, "Order cannot be converted");
    const project = await prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          name: order.projectName,
          description: order.description,
          budget: input.budget,
          currency: input.currency.toUpperCase(),
          deadline: input.deadline ? new Date(input.deadline) : null,
          clientId: input.clientId,
          assigneeId: req.auth!.userId,
          orderId: order.id,
          stages: {
            create: [
              "Requirements",
              "Design",
              "Frontend",
              "Backend",
              "Testing",
              "Client Review",
              "Deployment",
              "Completed"
            ].map((name, position) => ({ name, position, status: "PENDING" }))
          }
        }
      });
      await tx.order.update({
        where: { id: order.id },
        data: { status: "ACCEPTED", clientId: input.clientId, assigneeId: req.auth!.userId }
      });
      return created;
    });
    await audit(req, "ORDER_CONVERTED", "Project", project.id, { orderId: order.id });
    return success(res, "Order converted to project", project, 201);
  } catch (e) {
    next(e);
  }
});
adminRouter.post("/payments", authorize("ADMIN"), async (req, res, next) => {
  try {
    const input = z
      .object({
        projectId: z.string().cuid(),
        amount: z.number().int().positive().max(2_000_000_000),
        currency: z.string().regex(/^[A-Z]{3}$/i),
        purpose: z.string().min(3).max(300),
        dueDate: z.string().datetime().optional(),
        comment: z.string().max(1000).optional()
      })
      .parse(req.body);
    const project = await prisma.project.findFirst({
      where: { id: input.projectId, deletedAt: null }
    });
    if (!project) throw new AppError(404, "Project not found");
    const payment = await prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          paymentNumber: `PAY-${new Date().getUTCFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`,
          projectId: project.id,
          clientId: project.clientId,
          amount: input.amount,
          currency: input.currency.toUpperCase(),
          purpose: input.purpose,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          comment: input.comment ?? null,
          method: manualBankTransferProvider.method
        }
      });
      await tx.notification.create({
        data: {
          userId: project.clientId,
          type: "PAYMENT_CREATED",
          title: "New payment request",
          message: `Payment ${created.paymentNumber} is ready.`
        }
      });
      return created;
    });
    await audit(req, "PAYMENT_CREATED", "Payment", payment.id, {
      amount: payment.amount,
      currency: payment.currency,
      projectId: project.id
    });
    return success(res, "Payment created", payment, 201);
  } catch (e) {
    next(e);
  }
});
adminRouter.post("/invoices", authorize("ADMIN"), async (req, res, next) => {
  try {
    const input = z
      .object({
        projectId: z.string().cuid(),
        description: z.string().min(3).max(500),
        currency: z.string().regex(/^[A-Z]{3}$/i),
        dueDate: z.string().datetime(),
        tax: z.number().int().min(0).max(2_000_000_000).default(0),
        items: z
          .array(
            z.object({
              description: z.string().min(2).max(300),
              quantity: z.number().int().positive().max(1000),
              unitPrice: z.number().int().positive().max(2_000_000_000)
            })
          )
          .min(1)
      })
      .parse(req.body);
    const project = await prisma.project.findFirst({
      where: { id: input.projectId, deletedAt: null },
      include: { client: true }
    });
    if (!project) throw new AppError(404, "Project not found");
    const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    if (!Number.isSafeInteger(subtotal) || subtotal + input.tax > 2_000_000_000)
      throw new AppError(422, "Invoice total exceeds the supported limit", "AMOUNT_TOO_LARGE");
    const invoice = await prisma.$transaction(async (tx) => {
      const created = await tx.invoice.create({
        data: {
          invoiceNumber: `INV-${new Date().getUTCFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`,
          clientName: project.client.name,
          clientEmail: project.client.email,
          description: input.description,
          subtotal,
          tax: input.tax,
          total: subtotal + input.tax,
          currency: input.currency.toUpperCase(),
          dueDate: new Date(input.dueDate),
          clientId: project.clientId,
          projectId: project.id,
          items: {
            create: input.items.map((item) => ({ ...item, total: item.quantity * item.unitPrice }))
          }
        }
      });
      await tx.notification.create({
        data: {
          userId: project.clientId,
          type: "INVOICE_CREATED",
          title: "New invoice",
          message: `Invoice ${created.invoiceNumber} is ready.`
        }
      });
      return created;
    });
    await audit(req, "INVOICE_CREATED", "Invoice", invoice.id, {
      total: invoice.total,
      currency: invoice.currency,
      projectId: project.id
    });
    return success(res, "Invoice created", invoice, 201);
  } catch (e) {
    next(e);
  }
});
adminRouter.patch("/payments/:id/confirm", authorize("ADMIN"), async (req, res, next) => {
  try {
    const paymentId = z.string().cuid().parse(req.params.id);
    const input = z.object({ approved: z.boolean() }).parse(req.body);
    const existing = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!existing) throw new AppError(404, "Payment not found");
    const status = nextManualPaymentStatus(
      existing.status,
      input.approved ? "ADMIN_APPROVE" : "ADMIN_REJECT"
    );
    const payment = await prisma.$transaction(async (tx) => {
      const claimed = await tx.payment.updateMany({
        where: { id: existing.id, status: "WAITING_CONFIRMATION" },
        data: { status, paidAt: input.approved ? new Date() : null }
      });
      if (claimed.count !== 1)
        throw new AppError(409, "Payment was already processed", "PAYMENT_ALREADY_PROCESSED");
      const updated = await tx.payment.findUniqueOrThrow({ where: { id: existing.id } });
      if (input.approved)
        await tx.project.update({
          where: { id: updated.projectId },
          data: { paid: { increment: updated.amount } }
        });
      return updated;
    });
    await prisma.notification.create({
      data: {
        userId: payment.clientId,
        type: "PAYMENT_CONFIRMED",
        title: input.approved ? "Payment confirmed" : "Payment rejected",
        message: `Payment ${payment.paymentNumber} was ${input.approved ? "confirmed" : "rejected"}.`
      }
    });
    await audit(
      req,
      input.approved ? "PAYMENT_CONFIRMED" : "PAYMENT_REJECTED",
      "Payment",
      payment.id,
      { amount: payment.amount, currency: payment.currency }
    );
    return success(res, input.approved ? "Payment confirmed" : "Payment rejected", payment);
  } catch (e) {
    next(e);
  }
});
adminRouter.patch("/invoices/:id/paid", authorize("ADMIN"), async (req, res, next) => {
  try {
    const invoiceId = z.string().cuid().parse(req.params.id);
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new AppError(404, "Invoice not found");
    const updated = await prisma.$transaction(async (tx) => {
      const claimed = await tx.invoice.updateMany({
        where: { id: invoice.id, status: { not: "PAID" } },
        data: { status: "PAID" }
      });
      if (claimed.count !== 1)
        throw new AppError(409, "Invoice is already paid", "INVOICE_ALREADY_PAID");
      const result = await tx.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
      await tx.notification.create({
        data: {
          userId: invoice.clientId,
          type: "INVOICE_PAID",
          title: "Invoice marked as paid",
          message: `Invoice ${invoice.invoiceNumber} has been marked as paid.`
        }
      });
      return result;
    });
    await audit(req, "INVOICE_MARKED_PAID", "Invoice", updated.id, {
      total: updated.total,
      currency: updated.currency
    });
    return success(res, "Invoice marked as paid", updated);
  } catch (error) {
    next(error);
  }
});
adminRouter.put("/settings/bank-details", authorize("ADMIN"), async (req, res, next) => {
  try {
    const value = bankSchema.parse(req.body);
    await prisma.setting.upsert({
      where: { key: "bank_details" },
      update: { value: { ciphertext: encryptJson(value) }, encrypted: true },
      create: {
        key: "bank_details",
        category: "Bank Details",
        value: { ciphertext: encryptJson(value) },
        encrypted: true
      }
    });
    await audit(req, "BANK_DETAILS_UPDATED", "Setting", "bank_details");
    return success(res, "Bank details saved", {
      accountHolder: value.accountHolder,
      bankName: value.bankName,
      iban: `•••• ${value.iban.slice(-4)}`,
      cardNumber: value.cardNumber ? `•••• ${value.cardNumber.slice(-4)}` : null,
      currency: value.currency
    });
  } catch (e) {
    next(e);
  }
});
adminRouter.get("/settings/bank-details", authorize("ADMIN"), async (_req, res, next) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: "bank_details" } });
    if (
      !setting ||
      typeof setting.value !== "object" ||
      setting.value === null ||
      !("ciphertext" in setting.value) ||
      typeof setting.value.ciphertext !== "string"
    )
      return success(res, "Bank details not configured", null);
    const value = decryptJson<z.infer<typeof bankSchema>>(setting.value.ciphertext);
    return success(res, "Bank details loaded", {
      accountHolder: value.accountHolder,
      bankName: value.bankName,
      iban: `•••• ${value.iban.slice(-4)}`,
      cardNumber: value.cardNumber ? `•••• ${value.cardNumber.slice(-4)}` : null,
      currency: value.currency
    });
  } catch (e) {
    next(e);
  }
});
