import type {
  ACTIVITY_TYPES,
  ATTACHMENT_KINDS,
  ATTACHMENT_LINKED_TYPES,
  CLIENT_STATUSES,
  COST_CATEGORIES,
  INVOICE_STATUSES,
  OPPORTUNITY_STATUSES,
  PAYABLE_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  PROJECT_MEMBER_ROLES,
  PROJECT_STATUSES,
  USER_ROLES,
  USER_STATUSES
} from "./constants";

export type UserRole = (typeof USER_ROLES)[number];
export type UserStatus = (typeof USER_STATUSES)[number];
export type ClientStatus = (typeof CLIENT_STATUSES)[number];
export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type PayableStatus = (typeof PAYABLE_STATUSES)[number];
export type ActivityType = (typeof ACTIVITY_TYPES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type ProjectMemberRole = (typeof PROJECT_MEMBER_ROLES)[number];
export type CostCategory = (typeof COST_CATEGORIES)[number];
export type AttachmentLinkedType = (typeof ATTACHMENT_LINKED_TYPES)[number];
export type AttachmentKind = (typeof ATTACHMENT_KINDS)[number];

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
};
