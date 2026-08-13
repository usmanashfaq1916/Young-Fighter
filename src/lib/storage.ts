import "server-only";
import { randomUUID } from "crypto";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

export type StoredFile = {
  url: string;
  path: string;
};

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export function validateFile(file: { type: string; size: number }): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return "Only JPG, PNG, WEBP and PDF files are allowed.";
  }
  if (file.size > MAX_SIZE) {
    return "File size must be 5 MB or less.";
  }
  return null;
}

async function saveLocal(buffer: Buffer, ext: string, folder: string): Promise<StoredFile> {
  const id = randomUUID();
  const relDir = path.join("uploads", folder);
  const dir = path.join(process.cwd(), "public", relDir);
  await mkdir(dir, { recursive: true });
  const rel = path.join(relDir, `${id}${ext}`);
  await writeFile(path.join(process.cwd(), "public", rel), buffer);
  return { url: `/${rel.replace(/\\/g, "/")}`, path: rel };
}

export async function storeFile(
  buffer: Buffer,
  contentType: string,
  folder: string
): Promise<StoredFile> {
  const ext = contentType === "image/jpeg" ? ".jpg" : contentType === "image/png" ? ".png" : contentType === "image/webp" ? ".webp" : ".pdf";
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (blobToken) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`${folder}/${randomUUID()}${ext}`, buffer, {
      contentType,
      access: "public",
    });
    return { url: blob.url, path: blob.pathname };
  }
  return saveLocal(buffer, ext, folder);
}

export async function deleteStoredFile(url: string | null | undefined): Promise<void> {
  if (!url) return;
  if (url.startsWith("http")) {
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (blobToken) {
      const { del } = await import("@vercel/blob");
      try {
        await del(url);
      } catch {
        /* best effort */
      }
    }
    return;
  }
  const filePath = path.join(process.cwd(), "public", url.replace(/^\//, ""));
  try {
    await unlink(filePath);
  } catch {
    /* best effort */
  }
}