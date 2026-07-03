import { DOCUMENT_KINDS, DOCUMENT_LINKED_TYPES, DOCUMENT_PROVIDERS } from "@ratama/shared";
import { z } from "zod";

export const documentLinkCreateSchema = z.object({
  linked_type: z.enum(DOCUMENT_LINKED_TYPES),
  linked_id: z.string().min(1),
  document_kind: z.enum(DOCUMENT_KINDS),
  title: z.string().trim().min(1).max(200),
  url: z.string().trim().url().max(2048),
  provider: z.enum(DOCUMENT_PROVIDERS).optional(),
  notes: z.string().trim().max(2000).optional()
});

export const documentLinkUpdateSchema = documentLinkCreateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field must be provided."
);

export const documentLinkListQuerySchema = z.object({
  linked_type: z.enum(DOCUMENT_LINKED_TYPES).optional(),
  linked_id: z.string().min(1).optional()
});

export type DocumentLinkCreateInput = z.infer<typeof documentLinkCreateSchema>;
export type DocumentLinkUpdateInput = z.infer<typeof documentLinkUpdateSchema>;
