import { Hono } from "hono";
import type { Bindings } from "./env";

const app = new Hono<{ Bindings: Bindings }>();

app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    service: "ratama-tracker-api"
  });
});

app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Route not found."
      }
    },
    404
  );
});

export default app;
