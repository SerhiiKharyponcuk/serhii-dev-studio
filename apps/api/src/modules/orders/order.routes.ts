import { randomInt } from "node:crypto";
import { Router } from "express";
import { orderSchema } from "@serhii-dev/contracts";
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
import { success } from "../../utils/http.js";
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
    const orderNumber = `ORD-${new Date().getUTCFullYear()}-${Date.now().toString().slice(-6)}${randomInt(10, 99)}`;
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          projectType: input.projectType,
          projectName: input.projectName,
          companyName: input.companyName ?? null,
          description: input.description,
          requiredFeatures: input.requiredFeatures,
          references: input.references ?? null,
          budgetRange: input.budgetRange,
          preferredDeadline: input.preferredDeadline ? new Date(input.preferredDeadline) : null,
          deadlineFlexible: input.deadlineFlexible,
          contactName: input.name,
          contactEmail: input.email,
          telegram: input.telegram ?? null,
          discord: input.discord ?? null,
          country: input.country
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
      `Thank you, ${input.name}. Your project request ${orderNumber} has been received. We will review the scope and contact you with the next steps.`
    ).catch(() => false);
    const uploadToken = jwt.sign(
      { sub: order.id, purpose: "ORDER_UPLOAD" },
      env.JWT_ACCESS_SECRET,
      { expiresIn: "30m" }
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
    const claims = jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string; purpose: string };
    if (claims.sub !== req.params.id || claims.purpose !== "ORDER_UPLOAD") {
      return res.status(403).json({ success: false, message: "Upload authorization denied" });
    }
    const files = req.files;
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(422).json({ success: false, message: "At least one file is required" });
    }
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
