import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import type { Express } from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "./generated/prisma/client.js";

const runDatabaseTests = process.env.RUN_DB_TESTS === "1";

describe.runIf(runDatabaseTests).sequential("PostgreSQL business flows", () => {
  let app: Express;
  let prisma: PrismaClient;
  let adminAgent: ReturnType<typeof request.agent>;
  let clientAgent: ReturnType<typeof request.agent>;
  let otherClientAgent: ReturnType<typeof request.agent>;
  let adminId = "";
  let clientId = "";
  let otherClientId = "";
  let projectId = "";
  let paymentId = "";
  let invoiceId = "";
  let orderId = "";
  let registrationId = "";
  let registrationEmail = "";
  let clientRefreshCookie = "";

  const suffix = randomUUID().slice(0, 8);
  const password = "Integration-password-2026!";
  const origin = process.env.WEB_ORIGIN ?? "http://localhost:5173";
  const adminEmail = `admin-${suffix}@example.test`;
  const clientEmail = `client-${suffix}@example.test`;
  const otherClientEmail = `other-${suffix}@example.test`;

  beforeAll(async () => {
    ({ app } = await import("./app.js"));
    ({ prisma } = await import("./config/prisma.js"));
    const passwordHash = await bcrypt.hash(password, 4);
    const [admin, client, otherClient] = await Promise.all([
      prisma.user.create({
        data: {
          name: "Integration Admin",
          email: adminEmail,
          passwordHash,
          role: "ADMIN",
          status: "ACTIVE"
        }
      }),
      prisma.user.create({
        data: { name: "Integration Client", email: clientEmail, passwordHash, status: "ACTIVE" }
      }),
      prisma.user.create({
        data: { name: "Other Client", email: otherClientEmail, passwordHash, status: "ACTIVE" }
      })
    ]);
    adminId = admin.id;
    clientId = client.id;
    otherClientId = otherClient.id;
    const project = await prisma.project.create({
      data: {
        name: "Ownership test project",
        description: "Project fixture for resource ownership integration tests.",
        budget: 50_000,
        currency: "USD",
        clientId
      }
    });
    projectId = project.id;
    adminAgent = request.agent(app);
    clientAgent = request.agent(app);
    otherClientAgent = request.agent(app);
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.auditLog.deleteMany({
      where: { actorId: { in: [adminId, clientId, otherClientId].filter(Boolean) } }
    });
    if (invoiceId) await prisma.invoice.deleteMany({ where: { id: invoiceId } });
    if (paymentId) await prisma.payment.deleteMany({ where: { id: paymentId } });
    if (projectId) await prisma.project.deleteMany({ where: { id: projectId } });
    if (orderId) await prisma.order.deleteMany({ where: { id: orderId } });
    await prisma.user.deleteMany({
      where: { id: { in: [adminId, clientId, otherClientId, registrationId].filter(Boolean) } }
    });
    await prisma.$disconnect();
  });

  it("authenticates each role with secure cookie sessions", async () => {
    for (const [agent, email] of [
      [adminAgent, adminEmail],
      [clientAgent, clientEmail],
      [otherClientAgent, otherClientEmail]
    ] as const) {
      const response = await agent
        .post("/api/auth/login")
        .set("Origin", origin)
        .send({ email, password });
      expect(response.status).toBe(200);
      expect(response.headers["set-cookie"]).toBeDefined();
      if (email === clientEmail) {
        const cookies = response.headers["set-cookie"] as unknown as string[];
        clientRefreshCookie =
          cookies.find((cookie) => cookie.startsWith("refresh_token="))?.split(";")[0] ?? "";
      }
    }
  });

  it("revokes client-area access immediately when an account is suspended", async () => {
    await prisma.user.update({ where: { id: clientId }, data: { status: "BLOCKED" } });
    const response = await clientAgent.get("/api/client/overview");
    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ error: { code: "SESSION_INACTIVE" } });
    await prisma.user.update({ where: { id: clientId }, data: { status: "ACTIVE" } });
  });

  it("allows a refresh token to be rotated only once", async () => {
    expect(clientRefreshCookie).not.toBe("");
    const refresh = () =>
      request(app)
        .post("/api/auth/refresh")
        .set("Origin", origin)
        .set("Cookie", clientRefreshCookie);
    const responses = await Promise.all([refresh(), refresh()]);

    expect(responses.map((response) => response.status).sort()).toEqual([200, 401]);
    await expect(
      prisma.refreshToken.count({ where: { userId: clientId, revokedAt: null } })
    ).resolves.toBe(0);
  });

  it("keeps a new account pending until email verification", async () => {
    const email = `pending-${suffix}@example.test`;
    registrationEmail = email;
    const response = await request(app)
      .post("/api/auth/register")
      .set("Origin", origin)
      .send({ firstName: "Pending", lastName: "Client", email, password });

    expect(response.status).toBe(201);
    expect(response.headers["set-cookie"]).toBeUndefined();
    const registered = await prisma.user.findUniqueOrThrow({ where: { email } });
    registrationId = registered.id;
    expect(registered.status).toBe("PENDING");
    await expect(
      prisma.authToken.count({
        where: { userId: registrationId, type: "EMAIL_VERIFICATION", usedAt: null }
      })
    ).resolves.toBe(1);
  });

  it("replaces an unused email verification token without revealing account state", async () => {
    const response = await request(app)
      .post("/api/auth/resend")
      .set("Origin", origin)
      .send({ email: registrationEmail });

    expect(response.status).toBe(200);
    expect((response.body as { message: string }).message).toBe(
      "If the account is awaiting verification, a new link will be sent"
    );
    await expect(
      prisma.authToken.count({
        where: { userId: registrationId, type: "EMAIL_VERIFICATION", usedAt: null }
      })
    ).resolves.toBe(1);
  });

  it("creates a validated public order", async () => {
    const response = await request(app)
      .post("/api/orders")
      .set("Origin", origin)
      .send({
        projectType: "Business Website",
        buildApproach: "NEW_WEBSITE",
        selectedFeatures: ["cms", "advanced-seo"],
        projectName: "Integration order",
        description: "A sufficiently detailed project request created by the integration suite.",
        requiredFeatures: "Responsive pages, contact workflow and project dashboard.",
        budgetRange: "$2,000–$4,000",
        deadlineFlexible: true,
        firstName: "Prospective",
        lastName: "Client",
        email: `lead-${suffix}@example.test`,
        country: "Netherlands"
      });
    expect(response.status).toBe(201);
    const data = response.body as { data: { id: string; orderNumber: string } };
    orderId = data.data.id;
    expect(data.data.orderNumber).toMatch(/^ORD-/);
    await expect(prisma.order.findUnique({ where: { id: orderId } })).resolves.not.toBeNull();
  });

  it("prevents a client from reading another client's project", async () => {
    const own = await clientAgent.get(`/api/client/projects/${projectId}`);
    expect(own.status).toBe(200);
    const foreign = await otherClientAgent.get(`/api/client/projects/${projectId}`);
    expect(foreign.status).toBe(404);
  });

  it("creates an invoice for a project", async () => {
    const response = await adminAgent
      .post("/api/admin/invoices")
      .set("Origin", origin)
      .send({
        projectId,
        description: "Integration invoice",
        currency: "USD",
        dueDate: new Date(Date.now() + 7 * 86_400_000).toISOString(),
        tax: 200,
        items: [{ description: "Development milestone", quantity: 2, unitPrice: 1000 }]
      });
    expect(response.status).toBe(201);
    const data = response.body as { data: { id: string; total: number } };
    invoiceId = data.data.id;
    expect(data.data.total).toBe(2200);

    const markedPaid = await adminAgent
      .patch(`/api/admin/invoices/${invoiceId}/paid`)
      .set("Origin", origin);
    expect(markedPaid.status).toBe(200);
    const duplicate = await adminAgent
      .patch(`/api/admin/invoices/${invoiceId}/paid`)
      .set("Origin", origin);
    expect(duplicate.status).toBe(409);
  });

  it("confirms a manual payment exactly once", async () => {
    const created = await adminAgent.post("/api/admin/payments").set("Origin", origin).send({
      projectId,
      amount: 10_000,
      currency: "USD",
      purpose: "Initial development deposit"
    });
    expect(created.status).toBe(201);
    paymentId = (created.body as { data: { id: string } }).data.id;

    const submitted = await clientAgent
      .post(`/api/client/payments/${paymentId}/paid`)
      .set("Origin", origin);
    expect(submitted.status).toBe(200);

    const confirmed = await adminAgent
      .patch(`/api/admin/payments/${paymentId}/confirm`)
      .set("Origin", origin)
      .send({ approved: true });
    expect(confirmed.status).toBe(200);
    await expect(
      prisma.project.findUniqueOrThrow({ where: { id: projectId } })
    ).resolves.toMatchObject({ paid: 10_000 });

    const duplicate = await adminAgent
      .patch(`/api/admin/payments/${paymentId}/confirm`)
      .set("Origin", origin)
      .send({ approved: true });
    expect(duplicate.status).toBe(409);
    await expect(
      prisma.project.findUniqueOrThrow({ where: { id: projectId } })
    ).resolves.toMatchObject({ paid: 10_000 });
  });
});
