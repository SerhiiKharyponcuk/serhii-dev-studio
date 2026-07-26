import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { FullConfig } from "@playwright/test";

const root = path.resolve("apps/web/dist");
const contentTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".xml": "application/xml"
};

export default async function globalSetup(_config: FullConfig) {
  void _config;
  const server = createServer(async (req, res) => {
    const requestPath = decodeURIComponent(new URL(req.url ?? "/", "http://127.0.0.1").pathname);
    const candidate = path.resolve(root, `.${requestPath}`);
    const safeCandidate = candidate.startsWith(root) ? candidate : path.join(root, "index.html");
    try {
      const file = await readFile(safeCandidate);
      res.setHeader(
        "Content-Type",
        contentTypes[path.extname(safeCandidate)] ?? "application/octet-stream"
      );
      res.end(file);
    } catch {
      const index = await readFile(path.join(root, "index.html"));
      res.setHeader("Content-Type", contentTypes[".html"]!);
      res.end(index);
    }
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(4173, "127.0.0.1", resolve);
  });
  return async () => {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  };
}
