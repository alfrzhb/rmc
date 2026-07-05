import type { Context } from "hono";
import type { AppEnv } from "../env";
import { getDatabase } from "./database";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "TRANSITION" | "FINANCE";

export type AuditEntityType =
  | "USER"
  | "CLIENT"
  | "CLIENT_CONTACT"
  | "OPPORTUNITY"
  | "OPPORTUNITY_LOG"
  | "PROJECT"
  | "PROJECT_MEMBER"
  | "PROJECT_ACTIVITY"
  | "INVOICE"
  | "PAYMENT"
  | "PAYABLE"
  | "DOCUMENT_LINK";

type AuditInput = {
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  oldValue?: unknown;
  newValue?: unknown;
};

export async function writeAuditLog(c: Context<AppEnv>, input: AuditInput) {
  const currentUser = c.get("currentUser");
  const ipAddress = c.req.header("cf-connecting-ip") ?? c.req.header("x-forwarded-for") ?? null;
  const userAgent = c.req.header("user-agent") ?? null;

  await getDatabase(c.env)
    .prepare(
      `INSERT INTO audit_logs (
        id,
        actor_user_id,
        entity_type,
        entity_id,
        action,
        old_value,
        new_value,
        ip_address,
        user_agent,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      crypto.randomUUID(),
      currentUser.id,
      input.entityType,
      input.entityId,
      input.action,
      serializeAuditValue(input.oldValue),
      serializeAuditValue(input.newValue),
      ipAddress,
      userAgent,
      new Date().toISOString()
    )
    .run();
}

function serializeAuditValue(value: unknown) {
  if (value === undefined) {
    return null;
  }

  return JSON.stringify(value);
}
