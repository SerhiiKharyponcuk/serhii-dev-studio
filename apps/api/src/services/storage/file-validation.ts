import path from "node:path";
import { fileTypeFromBuffer } from "file-type";

const allowedTypes = new Map([
  ["application/pdf", new Set([".pdf"])],
  ["image/png", new Set([".png"])],
  ["image/jpeg", new Set([".jpg", ".jpeg"])],
  ["image/webp", new Set([".webp"])],
  ["text/plain", new Set([".txt"])],
  ["application/zip", new Set([".zip"])]
]);

export function hasAllowedFileMetadata(
  file: Pick<Express.Multer.File, "mimetype" | "originalname">
) {
  return (
    allowedTypes.get(file.mimetype)?.has(path.extname(file.originalname).toLowerCase()) === true
  );
}

export async function hasMatchingFileContent(
  file: Pick<Express.Multer.File, "buffer" | "mimetype">
) {
  if (file.mimetype === "text/plain") return true;
  const detected = await fileTypeFromBuffer(file.buffer);
  return detected?.mime === file.mimetype;
}
