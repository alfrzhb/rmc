import type { Bindings } from "../env";

export const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

export function getMaxUploadSizeBytes(env: Bindings): number {
  return Number(env.MAX_UPLOAD_SIZE_MB || 5) * 1024 * 1024;
}

export function getStorageBucket(env: Bindings): R2Bucket {
  return env.R2_BUCKET;
}

export function buildObjectKey(params: {
  linkedType: string;
  linkedId: string;
  fileId: string;
  fileName: string;
}) {
  const safeName = params.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${params.linkedType.toLowerCase()}/${params.linkedId}/${params.fileId}-${safeName}`;
}
