import type { Context, MiddlewareHandler } from "hono";
import type { CurrentUser, UserRole, UserStatus } from "@ratama/shared";
import type { AppEnv } from "../env";
import { getDatabase } from "./database";

export type AccessIdentity = {
  email: string | null;
  jwt: string | null;
};

export function getAccessIdentity(request: Request): AccessIdentity {
  const headers = request.headers;

  return {
    email: normalizeEmail(headers.get("cf-access-authenticated-user-email")),
    jwt: headers.get("cf-access-jwt-assertion")
  };
}

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
};

export async function findUserByAccessIdentity(c: Context<AppEnv>) {
  const identity = getAccessIdentity(c.req.raw);

  if (!identity.email) {
    return {
      identity,
      user: null
    };
  }

  const user = await getDatabase(c.env)
    .prepare(
      `SELECT id, email, name, role, status
       FROM users
       WHERE lower(email) = lower(?) AND deleted_at IS NULL`
    )
    .bind(identity.email)
    .first<UserRow>();

  return {
    identity,
    user: user ? toCurrentUser(user) : null
  };
}

export function requireActiveUser(): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const { identity, user } = await findUserByAccessIdentity(c);

    if (!identity.email) {
      return c.json(
        {
          success: false,
          error: {
            code: "ACCESS_IDENTITY_REQUIRED",
            message: "Cloudflare Access identity email is required."
          }
        },
        401
      );
    }

    if (!user) {
      return c.json(
        {
          success: false,
          error: {
            code: "USER_NOT_REGISTERED",
            message: "Access identity is not registered as an app user."
          }
        },
        403
      );
    }

    if (user.status !== "ACTIVE") {
      return c.json(
        {
          success: false,
          error: {
            code: "USER_INACTIVE",
            message: "User is not active."
          }
        },
        403
      );
    }

    c.set("currentUser", user);
    await next();
  };
}

export function requireRoles(roles: readonly UserRole[]): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const user = c.get("currentUser");

    if (!roles.includes(user.role)) {
      return c.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "User role is not allowed to access this resource."
          }
        },
        403
      );
    }

    await next();
  };
}

function normalizeEmail(email: string | null) {
  return email?.trim().toLowerCase() || null;
}

function toCurrentUser(row: UserRow): CurrentUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    status: row.status
  };
}
