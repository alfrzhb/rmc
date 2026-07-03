import { Hono, type Handler } from "hono";
import type { AppEnv } from "./env";
import { requireActiveUser, requireRoles } from "./lib/access";
import { clientsRoute } from "./routes/clients";
import { documentLinksRoute } from "./routes/document-links";
import { usersRoute } from "./routes/users";

const app = new Hono<AppEnv>();

const currentUserHandler: Handler<AppEnv> = (c) => {
  return c.json({
    success: true,
    data: c.get("currentUser")
  });
};

app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    service: "ratama-tracker-api"
  });
});

app.get("/api/auth/me", requireActiveUser(), currentUserHandler);
app.get("/api/me", requireActiveUser(), currentUserHandler);

app.post("/api/attachments/upload", (c) => {
  return c.json(
    {
      success: false,
      error: {
        code: "FILE_UPLOAD_DISABLED",
        message: "Binary file upload is disabled. Use document links instead."
      }
    },
    410
  );
});

app.use("/api/users", requireActiveUser(), requireRoles(["OWNER", "ADMIN"]));
app.use("/api/users/*", requireActiveUser(), requireRoles(["OWNER", "ADMIN"]));
app.route("/api/users", usersRoute);

app.use("/api/clients", requireActiveUser());
app.use("/api/clients/*", requireActiveUser());
app.route("/api/clients", clientsRoute);

app.use("/api/document-links", requireActiveUser());
app.use("/api/document-links/*", requireActiveUser());
app.route("/api/document-links", documentLinksRoute);

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
