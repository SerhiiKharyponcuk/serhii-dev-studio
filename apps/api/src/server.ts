import "dotenv/config";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";

const server = app.listen(env.PORT, () => {
  process.stdout.write(`API listening on http://localhost:${env.PORT}\n`);
});
server.requestTimeout = 30_000;
server.headersTimeout = 15_000;
server.keepAliveTimeout = 5_000;
server.maxHeadersCount = 100;
const shutdown = () => {
  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0));
  });
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
