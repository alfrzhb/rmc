import { Hono, type Handler } from "hono";
import type { AppEnv } from "./env";
import { requireActiveUser, requireRoles } from "./lib/access";
import { auditLogsRoute } from "./routes/audit-logs";
import { clientsRoute } from "./routes/clients";
import { dashboardRoute } from "./routes/dashboard";
import { documentLinksRoute } from "./routes/document-links";
import { invoicesRoute, payablesRoute, paymentsRoute } from "./routes/finance";
import { opportunitiesRoute } from "./routes/opportunities";
import { projectsRoute } from "./routes/projects";
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

app.use("/api/opportunities", requireActiveUser());
app.use("/api/opportunities/*", requireActiveUser());
app.route("/api/opportunities", opportunitiesRoute);

app.use("/api/projects", requireActiveUser());
app.use("/api/projects/*", requireActiveUser());
app.route("/api/projects", projectsRoute);

app.use("/api/invoices", requireActiveUser());
app.use("/api/invoices/*", requireActiveUser());
app.route("/api/invoices", invoicesRoute);

app.use("/api/payments", requireActiveUser());
app.use("/api/payments/*", requireActiveUser());
app.route("/api/payments", paymentsRoute);

app.use("/api/payables", requireActiveUser());
app.use("/api/payables/*", requireActiveUser());
app.route("/api/payables", payablesRoute);

app.use("/api/dashboard", requireActiveUser());
app.use("/api/dashboard/*", requireActiveUser());
app.route("/api/dashboard", dashboardRoute);

app.use("/api/document-links", requireActiveUser());
app.use("/api/document-links/*", requireActiveUser());
app.route("/api/document-links", documentLinksRoute);

app.use("/api/audit-logs", requireActiveUser(), requireRoles(["OWNER", "ADMIN"]));
app.use("/api/audit-logs/*", requireActiveUser(), requireRoles(["OWNER", "ADMIN"]));
app.route("/api/audit-logs", auditLogsRoute);

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
