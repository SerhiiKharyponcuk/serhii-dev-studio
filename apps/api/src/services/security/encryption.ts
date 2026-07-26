import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/http.js";

function key() {
  if (!env.SETTINGS_ENCRYPTION_KEY)
    throw new AppError(503, "Sensitive settings are not configured", "SETTINGS_KEY_MISSING");
  const decoded = Buffer.from(env.SETTINGS_ENCRYPTION_KEY, "base64");
  if (decoded.length !== 32)
    throw new AppError(503, "Sensitive settings are not configured", "SETTINGS_KEY_INVALID");
  return decoded;
}
export function encryptJson(value: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return `${iv.toString("base64")}.${cipher.getAuthTag().toString("base64")}.${encrypted.toString("base64")}`;
}
export function decryptJson<T>(value: string): T {
  const [iv, tag, data] = value.split(".");
  if (!iv || !tag || !data) throw new AppError(500, "Sensitive setting is corrupted");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return JSON.parse(
    Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8")
  ) as T;
}
