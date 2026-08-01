import { randomInt, randomUUID } from "node:crypto";
import { Router } from "express";
import { calculateOrderEstimate, orderSchema } from "@serhii-dev/contracts";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "node:path";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { storeFile } from "../../services/storage/storage.js";
import {
  hasAllowedFileMetadata,
  hasMatchingFileContent
} from "../../services/storage/file-validation.js";
import { AppError, success } from "../../utils/http.js";
import { sendAccountEmail } from "../../services/mail/mailer.js";

const router = Router();
const orderUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 4 },
  fileFilter: (_req, file, callback) => callback(null, hasAllowedFileMetadata(file))
});
router.post("/", async (req, res, next) => {
  try {
    const input = orderSchema.parse(req.body);
    if (input.website) return success(res, "Order created", { received: true }, 201);
    if (input.formStartedAt && Date.now() - input.formStartedAt < 2_000)
      throw new AppError(422, "Please review the project brief before submitting", "FORM_TOO_FAST");
    const estimatedPriceCents =
      calculateOrderEstimate(input.projectType, input.selectedFeatures) * 100;
    const orderNumber = `ORD-${new Date().getUTCFullYear()}-${Date.now().toString().slice(-6)}${randomInt(10, 99)}`;
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          projectType: input.projectType,
          buildApproach: input.buildApproach,
          selectedFeatures: input.selectedFeatures,
          estimatedPriceCents,
          projectName: input.projectName,
          companyName: input.companyName || null,
          description: input.description,
          requiredFeatures: input.requiredFeatures ?? "",
          references: input.references || null,
          budgetRange: input.budgetRange,
          preferredDeadline: input.preferredDeadline ? new Date(input.preferredDeadline) : null,
          deadlineFlexible: input.deadlineFlexible,
          contactName: `${input.firstName} ${input.lastName}`,
          contactFirstName: input.firstName,
          contactLastName: input.lastName,
          contactEmail: input.email.toLowerCase(),
          phone: input.phone || null,
          telegram: input.telegram || null,
          discord: input.discord || null,
          country: input.country,
          billingCompanyName: input.billingCompanyName || null,
          billingAddressLine1: input.billingAddressLine1 || null,
          billingAddressLine2: input.billingAddressLine2 || null,
          billingCity: input.billingCity || null,
          billingRegion: input.billingRegion || null,
          billingPostalCode: input.billingPostalCode || null,
          taxId: input.taxId || null
        }
      });
      const admins = await tx.user.findMany({
        where: { role: "ADMIN", status: "ACTIVE" },
        select: { id: true }
      });
      if (admins.length)
        await tx.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            type: "NEW_ORDER",
            title: "New project request",
            message: `${orderNumber}: ${input.projectName}`
          }))
        });
      return created;
    });
    await sendAccountEmail(
      input.email,
      `Project request ${orderNumber} received`,
      `Thank you, ${input.firstName}. Your project request ${orderNumber} has been received. We will review the scope and contact you with the next steps.`
    ).catch(() => false);
    const uploadToken = jwt.sign(
      { sub: order.id, purpose: "ORDER_UPLOAD", jti: randomUUID() },
      env.JWT_ACCESS_SECRET,
      { expiresIn: "30m", audience: "order-upload", issuer: "serhii-dev-api" }
    );
    return success(res, "Order created", { id: order.id, orderNumber, uploadToken }, 201);
  } catch (e) {
    next(e);
  }
});
router.post("/:id/files", orderUpload.array("files", 4), async (req, res, next) => {
  try {
    const token = req.get("x-upload-token");
    if (!token)
      return res.status(401).json({ success: false, message: "Upload authorization required" });
    const claims = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ["HS256"],
      audience: "order-upload",
      issuer: "serhii-dev-api"
    }) as { sub: string; purpose: string };
    if (claims.sub !== req.params.id || claims.purpose !== "ORDER_UPLOAD") {
      return res.status(403).json({ success: false, message: "Upload authorization denied" });
    }
    const files = req.files;
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(422).json({ success: false, message: "At least one file is required" });
    }
    const existingFileCount = await prisma.file.count({
      where: { orderId: req.params.id, deletedAt: null }
    });
    if (existingFileCount + files.length > 4)
      throw new AppError(422, "An order can contain no more than four files", "FILE_LIMIT");
    for (const file of files) {
      if (!(await hasMatchingFileContent(file))) {
        return res.status(422).json({ success: false, message: "A file type was rejected" });
      }
    }
    const records = [];
    for (const file of files) {
      const storageKey = await storeFile(file);
      records.push(
        await prisma.file.create({
          data: {
            name: path.basename(file.originalname).slice(0, 255),
            storageKey,
            mimeType: file.mimetype,
            size: file.size,
            orderId: req.params.id,
            category: "REQUIREMENTS"
          }
        })
      );
    }
    return success(res, "Order files uploaded", records, 201);
  } catch (error) {
    next(error);
  }
});
export { router as orderRouter };
