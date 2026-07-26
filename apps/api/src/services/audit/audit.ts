import type { Request } from "express";
import { prisma } from "../../config/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";

export async function audit(
  req: Request,
  action: string,
  entityType: string,
  entityId?: string,
  metadata?: Prisma.InputJsonObject
) {
  await prisma.auditLog.create({
    data: {
      actorId: req.auth?.userId ?? null,
      action,
      entityType,
      entityId: entityId ?? null,
      ipAddress: req.ip ?? null,
      ...(metadata ? { metadata } : {})
    }
  });
}
