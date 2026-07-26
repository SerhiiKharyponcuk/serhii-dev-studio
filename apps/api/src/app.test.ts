import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { randomBytes } from "node:crypto";

beforeAll(() => {
  process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/test";
  process.env.JWT_ACCESS_SECRET = randomBytes(32).toString("hex");
  process.env.JWT_REFRESH_SECRET = randomBytes(32).toString("hex");
});

describe("API shell", () => {
  it("returns a consistent health response", async () => {
    const { app } = await import("./app.js");
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ success: true, data: { status: "ok" } });
  });

  it("rejects unknown routes safely", async () => {
    const { app } = await import("./app.js");
    const response = await request(app).get("/api/does-not-exist");
    expect(response.status).toBe(404);
    expect(response.body).not.toHaveProperty("stack");
  });

  it("rejects unauthenticated private access", async () => {
    const { app } = await import("./app.js");
    const response = await request(app).get("/api/client/projects");
    expect(response.status).toBe(401);
  });

  it("rejects unsafe cookie-based requests without an allowed origin", async () => {
    const { app } = await import("./app.js");
    const response = await request(app).patch("/api/users/me").send({ name: "Updated Name" });
    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({ error: { code: "CSRF_CHECK_FAILED" } });
  });

  it("rejects a client role on admin routes", async () => {
    const { app } = await import("./app.js");
    const token = jwt.sign({ sub: "test-client", role: "CLIENT" }, process.env.JWT_ACCESS_SECRET!, {
      expiresIn: "5m"
    });
    const response = await request(app)
      .get("/api/admin/dashboard")
      .set("Cookie", `access_token=${token}`);
    expect(response.status).toBe(403);
  });

  it("prevents support staff from confirming payments", async () => {
    const { app } = await import("./app.js");
    const token = jwt.sign(
      { sub: "test-support", role: "SUPPORT" },
      process.env.JWT_ACCESS_SECRET!,
      {
        expiresIn: "5m"
      }
    );
    const response = await request(app)
      .patch("/api/admin/payments/cm00000000000000000000000/confirm")
      .set("Origin", "http://localhost:5173")
      .set("Cookie", `access_token=${token}`)
      .send({ status: "PAID" });
    expect(response.status).toBe(403);
  });

  it("prevents support staff from changing file access", async () => {
    const { app } = await import("./app.js");
    const token = jwt.sign(
      { sub: "test-support", role: "SUPPORT" },
      process.env.JWT_ACCESS_SECRET!,
      {
        expiresIn: "5m"
      }
    );
    const response = await request(app)
      .patch("/api/files/cm00000000000000000000000/access")
      .set("Origin", "http://localhost:5173")
      .set("Cookie", `access_token=${token}`)
      .send({ clientVisible: false });
    expect(response.status).toBe(403);
  });
});
