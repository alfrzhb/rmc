export const DOCUMENT_STORAGE_MODE = "external_link" as const;

export function normalizeDocumentUrl(url: string): string {
  return url.trim();
}
