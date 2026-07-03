import { Hono, type Context } from "hono";
import { createUserSchema, updateUserSchema } from "@ratama/validation";
import type { AppEnv } from "../env";
import { getDatabase } from "../lib/database";

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export const usersRoute = new Hono<AppEnv>();

usersRoute.get("/", async (c) => {
  const rows = await getDatabase(c.env)
    .prepare(
      `SELECT id, email, name, role, status, last_login_at, created_at, updated_at, deleted_at
       FROM users
       WHERE deleted_at IS NULL
       ORDER BY name ASC`
    )
    .all<UserRow>();

  return c.json({
    success: true,
    data: rows.results
  });
});

usersRoute.get("/:id", async (c) => {
  const user = await findUser(c, c.req.param("id"));

  if (!user) {
    return userNotFound(c);
  }

  return c.json({
    success: true,
    data: user
  });
});

usersRoute.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const input = createUserSchema.safeParse(body);

  if (!input.success) {
    return validationError(c, input.error.flatten());
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  try {
    await getDatabase(c.env)
      .prepare(
        `INSERT INTO users (
          id,
          email,
          name,
          role,
          status,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        input.data.email,
        input.data.name,
        input.data.role,
        input.data.status,
        now,
        now
      )
      .run();
  } catch {
    return c.json(
      {
        success: false,
        error: {
          code: "USER_EMAIL_EXISTS",
          message: "A user with this email already exists."
        }
      },
      409
    );
  }

  return c.json(
    {
      success: true,
      data: await findUser(c, id)
    },
    201
  );
});

usersRoute.put("/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await findUser(c, id);

  if (!existing) {
    return userNotFound(c);
  }

  const body = await c.req.json().catch(() => null);
  const input = updateUserSchema.safeParse(body);

  if (!input.success) {
    return validationError(c, input.error.flatten());
  }

  try {
    await getDatabase(c.env)
      .prepare(
        `UPDATE users
         SET email = ?,
             name = ?,
             role = ?,
             status = ?,
             updated_at = ?
         WHERE id = ? AND deleted_at IS NULL`
      )
      .bind(
        input.data.email ?? existing.email,
        input.data.name ?? existing.name,
        input.data.role ?? existing.role,
        input.data.status ?? existing.status,
        new Date().toISOString(),
        id
      )
      .run();
  } catch {
    return c.json(
      {
        success: false,
        error: {
          code: "USER_EMAIL_EXISTS",
          message: "A user with this email already exists."
        }
      },
      409
    );
  }

  return c.json({
    success: true,
    data: await findUser(c, id)
  });
});

usersRoute.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await findUser(c, id);

  if (!existing) {
    return userNotFound(c);
  }

  const now = new Date().toISOString();

  await getDatabase(c.env)
    .prepare(
      `UPDATE users
       SET status = 'INACTIVE',
           deleted_at = ?,
           updated_at = ?
       WHERE id = ? AND deleted_at IS NULL`
    )
    .bind(now, now, id)
    .run();

  return c.json({
    success: true,
    data: {
      id
    }
  });
});

async function findUser(c: Context<AppEnv>, id: string) {
  return getDatabase(c.env)
    .prepare(
      `SELECT id, email, name, role, status, last_login_at, created_at, updated_at, deleted_at
       FROM users
       WHERE id = ? AND deleted_at IS NULL`
    )
    .bind(id)
    .first<UserRow>();
}

function validationError(c: Context<AppEnv>, details: unknown) {
  return c.json(
    {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed.",
        details
      }
    },
    400
  );
}

function userNotFound(c: Context<AppEnv>) {
  return c.json(
    {
      success: false,
      error: {
        code: "USER_NOT_FOUND",
        message: "User not found."
      }
    },
    404
  );
}
