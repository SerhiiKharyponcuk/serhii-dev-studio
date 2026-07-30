import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { loadFile, storeFile } from "../../services/storage/storage.js";
import {
  hasAllowedFileMetadata,
  hasMatchingFileContent
} from "../../services/storage/file-validation.js";
import { AppError, success } from "../../utils/http.js";
import { authorize } from "../../middleware/auth.js";
import { audit } from "../../services/audit/audit.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => cb(null, hasAllowedFileMetadata(file))
});
export const fileRouter = Router();
fileRouter.get("/", async (req, res, next) => {
  try {
    const files = await prisma.file.findMany({
      where: {
        deletedAt: null,
        ...(req.auth!.role === "ADMIN"
          ? {}
          : {
              clientVisible: true,
              OR: [{ uploaderId: req.auth!.userId }, { project: { clientId: req.auth!.userId } }]
            })
      },
      select: {
        id: true,
        name: true,
        mimeType: true,
        size: true,
        category: true,
        clientVisible: true,
        projectId: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    });
    return success(res, "Files loaded", files);
  } catch (e) {
    next(e);
  }
});
fileRouter.post("/", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) throw new AppError(422, "A supported file is required");
    if (!(await hasMatchingFileContent(req.file)))
      throw new AppError(
        422,
        "File content does not match its declared type",
        "FILE_TYPE_MISMATCH"
      );
    const body = z.object({ projectId: z.string().cuid().optional() }).parse(req.body as unknown);
    if (body.projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: body.projectId,
          ...(req.auth!.role === "ADMIN" ? {} : { clientId: req.auth!.userId })
        }
      });
      if (!project) throw new AppError(404, "Project not found");
    }
    const storageKey = await storeFile(req.file);
    const record = await prisma.file.create({
      data: {
        name: path.basename(req.file.originalname).slice(0, 255),
        storageKey,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploaderId: req.auth!.userId,
        projectId: body.projectId ?? null
      }
    });
    return success(res, "File uploaded", record, 201);
  } catch (e) {
    next(e);
  }
});
fileRouter.patch("/:id/access", authorize("ADMIN"), async (req, res, next) => {
  try {
    const fileId = z.string().cuid().parse(req.params.id);
    const input = z.object({ clientVisible: z.boolean() }).parse(req.body);
    const file = await prisma.file.update({
      where: { id: fileId },
      data: { clientVisible: input.clientVisible }
    });
    await audit(req, "FILE_ACCESS_UPDATED", "File", file.id, {
      clientVisible: file.clientVisible
    });
    return success(res, "File access updated", file);
  } catch (error) {
    next(error);
  }
});
fileRouter.get("/:id/download", async (req, res, next) => {
  try {
    const record = await prisma.file.findFirst({
      where: {
        id: req.params.id,
        deletedAt: null,
        ...(req.auth!.role === "ADMIN"
          ? {}
          : {
              clientVisible: true,
              OR: [{ uploaderId: req.auth!.userId }, { project: { clientId: req.auth!.userId } }]
            })
      }
    });
    if (!record) throw new AppError(404, "File not found");
    const content = await loadFile(record.storageKey);
    res.setHeader("Content-Type", record.mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(record.name)}`
    );
    res.send(content);
  } catch (e) {
    next(e);
  }
});
