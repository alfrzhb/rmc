import {
  COST_CATEGORIES,
  INVOICE_STATUSES,
  PAYABLE_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES
} from "@ratama/shared";
import { z } from "zod";

const optionalText = z.string().trim().max(500).optional();
const optionalLongText = z.string().trim().max(2000).optional();
const positiveMoney = z.number().int().positive();

export const invoiceCreateSchema = z.object({
  project_id: z.string().trim().min(1),
  invoice_number: z.string().trim().min(1).max(100),
  invoice_date: z.string().trim().min(1),
  due_date: z.string().trim().min(1),
  termin_number: z.number().int().positive().optional(),
  description: optionalLongText,
  amount: positiveMoney,
  status: z.enum(INVOICE_STATUSES).default("DRAFT"),
  sent_at: z.string().trim().min(1).optional(),
  cancelled_at: z.string().trim().min(1).optional(),
  cancel_reason: optionalLongText
});

export const invoiceUpdateSchema = invoiceCreateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "At least one field must be provided.");

export const invoiceListQuerySchema = z.object({
  search: z.string().trim().optional(),
  project_id: z.string().trim().optional(),
  client_id: z.string().trim().optional(),
  status: z.enum(INVOICE_STATUSES).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
});

export const paymentCreateSchema = z.object({
  invoice_id: z.string().trim().min(1),
  payment_date: z.string().trim().min(1),
  amount: positiveMoney,
  payment_method: z.enum(PAYMENT_METHODS),
  reference_number: optionalText,
  notes: optionalLongText,
  status: z.enum(PAYMENT_STATUSES).default("VALID"),
  cancelled_at: z.string().trim().min(1).optional(),
  cancel_reason: optionalLongText
});

export const paymentUpdateSchema = paymentCreateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "At least one field must be provided.");

export const paymentListQuerySchema = z.object({
  invoice_id: z.string().trim().optional(),
  project_id: z.string().trim().optional(),
  client_id: z.string().trim().optional(),
  status: z.enum(PAYMENT_STATUSES).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
});

export const payableCreateSchema = z.object({
  project_id: z.string().trim().min(1).optional(),
  vendor_name: z.string().trim().min(1).max(200),
  cost_category: z.enum(COST_CATEGORIES),
  description: optionalLongText,
  bill_date: z.string().trim().min(1).optional(),
  due_date: z.string().trim().min(1).optional(),
  amount: positiveMoney,
  status: z.enum(PAYABLE_STATUSES).default("UNPAID"),
  paid_at: z.string().trim().min(1).optional(),
  payment_method: z.enum(PAYMENT_METHODS).optional(),
  reference_number: optionalText,
  notes: optionalLongText,
  cancelled_at: z.string().trim().min(1).optional(),
  cancel_reason: optionalLongText
});

export const payableUpdateSchema = payableCreateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "At least one field must be provided.");

export const payableListQuerySchema = z.object({
  project_id: z.string().trim().optional(),
  status: z.enum(PAYABLE_STATUSES).optional(),
  cost_category: z.enum(COST_CATEGORIES).optional(),
  vendor_name: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
});

export type InvoiceCreateInput = z.infer<typeof invoiceCreateSchema>;
export type InvoiceUpdateInput = z.infer<typeof invoiceUpdateSchema>;
export type PaymentCreateInput = z.infer<typeof paymentCreateSchema>;
export type PaymentUpdateInput = z.infer<typeof paymentUpdateSchema>;
export type PayableCreateInput = z.infer<typeof payableCreateSchema>;
export type PayableUpdateInput = z.infer<typeof payableUpdateSchema>;
