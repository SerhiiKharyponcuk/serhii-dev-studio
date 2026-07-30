import { describe, expect, it } from "vitest";
import { hasAllowedFileMetadata, hasMatchingFileContent } from "./file-validation.js";

describe("file upload validation", () => {
  it("requires an extension that matches the declared MIME type", () => {
    expect(hasAllowedFileMetadata({ mimetype: "image/png", originalname: "preview.png" })).toBe(
      true
    );
    expect(hasAllowedFileMetadata({ mimetype: "image/png", originalname: "preview.exe" })).toBe(
      false
    );
  });

  it("requires binary content to match the declared MIME type", async () => {
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52
    ]);
    await expect(
      hasMatchingFileContent({ mimetype: "image/png", buffer: pngHeader })
    ).resolves.toBe(true);
    await expect(
      hasMatchingFileContent({ mimetype: "application/pdf", buffer: pngHeader })
    ).resolves.toBe(false);
  });
});
