import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { AppError } from "../../utils/http.js";

const root = path.resolve(process.cwd(), "uploads");
export async function storeFile(file: Express.Multer.File) {
  await mkdir(root, { recursive: true });
  const key = randomUUID();
  await writeFile(path.join(root, key), file.buffer, { flag: "wx" });
  return key;
}
export async function loadFile(key: string) {
  if (!/^[0-9a-f-]{36}$/i.test(key)) throw new AppError(400, "Invalid file key");
  const resolved = path.resolve(root, key);
  if (path.dirname(resolved) !== root) throw new AppError(400, "Invalid file key");
  try {
    return await readFile(resolved);
  } catch {
    throw new AppError(404, "File not found", "NOT_FOUND");
  }
}
