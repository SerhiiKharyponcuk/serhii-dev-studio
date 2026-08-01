import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL;
const adminPassword = process.env.SEED_ADMIN_PASSWORD;
const clientPassword = process.env.SEED_CLIENT_PASSWORD;
if (!databaseUrl || !adminPassword || !clientPassword)
  throw new Error(
    "DATABASE_URL, SEED_ADMIN_PASSWORD and SEED_CLIENT_PASSWORD are required for seeding."
  );
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

const serviceSeed = [
  ["landing-page", "Landing Page", 600, "1–2 weeks"],
  ["business-website", "Business Website", 1200, "3–5 weeks"],
  ["portfolio-website", "Portfolio Website", 720, "2–3 weeks"],
  ["online-shop", "Online Shop", 2240, "5–9 weeks"],
  ["admin-dashboard", "Admin Dashboard", 1760, "4–7 weeks"],
  ["client-dashboard", "Client Dashboard", 1920, "4–8 weeks"],
  ["minecraft-store", "Minecraft Store", 1440, "3–6 weeks"],
  ["custom-web-application", "Custom Web Application", 2800, "6–12+ weeks"],
  ["website-redesign", "Website Redesign", 960, "2–5 weeks"],
  ["website-maintenance", "Website Maintenance", 144, "Monthly"]
] as const;
const portfolioSeed = [
  ["waves-arcade", "Waves Arcade", "Web Application"],
  ["metro-shop", "Metro Shop", "E-commerce"],
  ["developer-portfolio", "Developer Portfolio", "Portfolio"],
  ["ip-information-website", "IP Information Website", "Web Tool"]
] as const;

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: process.env.SEED_ADMIN_EMAIL ?? "admin@example.com" },
    update: {},
    create: {
      name: "Studio Administrator",
      email: process.env.SEED_ADMIN_EMAIL ?? "admin@example.com",
      passwordHash: await bcrypt.hash(adminPassword!, 12),
      role: "ADMIN",
      status: "ACTIVE",
      emailVerifiedAt: new Date()
    }
  });
  const client = await prisma.user.upsert({
    where: { email: process.env.SEED_CLIENT_EMAIL ?? "client@example.com" },
    update: {},
    create: {
      name: "Demo Client",
      email: process.env.SEED_CLIENT_EMAIL ?? "client@example.com",
      passwordHash: await bcrypt.hash(clientPassword!, 12),
      role: "CLIENT",
      status: "ACTIVE",
      emailVerifiedAt: new Date()
    }
  });
  for (const [slug, name, price, time] of serviceSeed)
    await prisma.service.upsert({
      where: { slug },
      update: { name, startingPrice: price, deliveryTime: time },
      create: {
        slug,
        name,
        startingPrice: price,
        deliveryTime: time,
        description: `Professional ${name.toLowerCase()} development tailored to the project scope.`,
        features: ["Responsive design", "Typed implementation", "Quality assurance"]
      }
    });
  for (const [slug, title, category] of portfolioSeed)
    await prisma.portfolioProject.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        title,
        category,
        description: `${title} project showcase.`,
        technologies: ["React", "TypeScript"],
        published: true,
        featured: slug === "waves-arcade"
      }
    });
  const order = await prisma.order.upsert({
    where: { orderNumber: "DEMO-ORDER-001" },
    update: {},
    create: {
      orderNumber: "DEMO-ORDER-001",
      projectType: "Business Website",
      projectName: "Demo Business Platform",
      description: "Demonstration order used only in local seed data.",
      requiredFeatures: "Client dashboard and project tracking",
      budgetRange: "$3,500–$7,500",
      deadlineFlexible: true,
      contactName: client.name,
      contactEmail: client.email,
      country: "Netherlands",
      status: "ACCEPTED",
      clientId: client.id,
      assigneeId: admin.id
    }
  });
  const project = await prisma.project.upsert({
    where: { orderId: order.id },
    update: {},
    create: {
      name: "Demo Business Platform",
      description: "Local demonstration project.",
      status: "DEVELOPMENT",
      progress: 55,
      budget: 500000,
      paid: 250000,
      currency: "USD",
      clientId: client.id,
      assigneeId: admin.id,
      orderId: order.id,
      stages: {
        create: [
          ["Requirements", "COMPLETED"],
          ["Design", "COMPLETED"],
          ["Frontend", "IN_PROGRESS"],
          ["Backend", "PENDING"],
          ["Testing", "PENDING"],
          ["Client Review", "PENDING"],
          ["Deployment", "PENDING"],
          ["Completed", "PENDING"]
        ].map(([name, status], position) => ({ name: name!, status: status!, position }))
      }
    }
  });
  const payment = await prisma.payment.upsert({
    where: { paymentNumber: "DEMO-PAY-001" },
    update: {},
    create: {
      paymentNumber: "DEMO-PAY-001",
      amount: 250000,
      currency: "USD",
      purpose: "Initial project payment",
      status: "PAID",
      paidAt: new Date(),
      clientId: client.id,
      projectId: project.id
    }
  });
  await prisma.invoice.upsert({
    where: { invoiceNumber: "DEMO-INV-001" },
    update: {},
    create: {
      invoiceNumber: "DEMO-INV-001",
      clientName: client.name,
      clientEmail: client.email,
      description: "Initial project payment",
      subtotal: 250000,
      total: 250000,
      currency: "USD",
      dueDate: new Date(Date.now() + 7 * 86_400_000),
      status: "PAID",
      clientId: client.id,
      projectId: project.id,
      paymentId: payment.id,
      items: {
        create: {
          description: "Discovery, planning and initial development",
          quantity: 1,
          unitPrice: 250000,
          total: 250000
        }
      }
    }
  });
  await prisma.notification.deleteMany({
    where: { userId: client.id, type: { in: ["DEMO_PROJECT_UPDATED", "DEMO_PAYMENT_CONFIRMED"] } }
  });
  await prisma.notification.createMany({
    data: [
      {
        userId: client.id,
        type: "DEMO_PROJECT_UPDATED",
        title: "Project updated",
        message: "Frontend development has started."
      },
      {
        userId: client.id,
        type: "DEMO_PAYMENT_CONFIRMED",
        title: "Payment confirmed",
        message: "Your initial payment was confirmed."
      }
    ]
  });
}
void main().finally(() => prisma.$disconnect());
