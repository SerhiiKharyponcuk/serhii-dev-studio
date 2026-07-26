import { Router } from "express";
import { prisma } from "../../config/prisma.js";
import { AppError, success } from "../../utils/http.js";

export const serviceRouter = Router();
serviceRouter.get("/", async (_req, res, next) => {
  try {
    return success(
      res,
      "Services loaded",
      await prisma.service.findMany({
        where: { active: true, deletedAt: null },
        orderBy: [{ position: "asc" }, { name: "asc" }]
      })
    );
  } catch (error) {
    next(error);
  }
});
serviceRouter.get("/:slug", async (req, res, next) => {
  try {
    const service = await prisma.service.findFirst({
      where: { slug: req.params.slug, active: true, deletedAt: null }
    });
    if (!service) throw new AppError(404, "Service not found");
    return success(res, "Service loaded", service);
  } catch (error) {
    next(error);
  }
});

export const portfolioRouter = Router();
portfolioRouter.get("/", async (req, res, next) => {
  try {
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    return success(
      res,
      "Portfolio loaded",
      await prisma.portfolioProject.findMany({
        where: { published: true, deletedAt: null, ...(category ? { category } : {}) },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }]
      })
    );
  } catch (error) {
    next(error);
  }
});
portfolioRouter.get("/:slug", async (req, res, next) => {
  try {
    const project = await prisma.portfolioProject.findFirst({
      where: { slug: req.params.slug, published: true, deletedAt: null }
    });
    if (!project) throw new AppError(404, "Portfolio project not found");
    return success(res, "Portfolio project loaded", project);
  } catch (error) {
    next(error);
  }
});
