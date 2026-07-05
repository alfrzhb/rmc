import { spawn } from "node:child_process";
import process from "node:process";

const API_ORIGIN = process.env.PHASE14_API_ORIGIN ?? "http://127.0.0.1:8787";
const API_BASE = `${API_ORIGIN.replace(/\/$/, "")}/api`;
const ACCESS_EMAIL = process.env.PHASE14_ACCESS_EMAIL ?? "owner.local@example.test";
const tag = `phase14-${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}`;
const ids = {};

let apiProcess;
let startedApi = false;

try {
  await runCommand("pnpm", ["db:migrate:local"]);

  if (!(await isHealthy())) {
    apiProcess = spawn("pnpm", ["dev:api"], {
      shell: true,
      stdio: ["ignore", "pipe", "pipe"]
    });
    startedApi = true;
    await waitForHealth();
  }

  await runPhase14Checks();
  console.log(`Phase 14 local smoke test passed (${tag}).`);
} finally {
  await cleanup();
  if (startedApi && apiProcess) {
    await stopProcessTree(apiProcess);
  }
}

async function runPhase14Checks() {
  const health = await api("GET", "/health", null, { auth: false });
  assert(health.status === "ok", "health check failed");
  log("health check ok");

  const me = await api("GET", "/auth/me");
  assert(me.success && me.data.email === ACCESS_EMAIL, "user access failed");
  ids.userId = me.data.id;
  log(`user access ok: ${ids.userId}`);

  const client = await api("POST", "/clients", {
    name: `Client ${tag}`,
    client_type: "Company",
    industry: "Testing",
    email: `${tag}@example.test`,
    phone: "0800000000",
    status: "PROSPECT",
    notes: "Phase 14 local smoke test"
  });
  ids.clientId = client.data.id;
  assert(ids.clientId, "client create failed");
  await assertListed("/clients", `search=${tag}`, ids.clientId, "client");

  const clientDetail = await api("GET", `/clients/${ids.clientId}`);
  assert(clientDetail.data.name === `Client ${tag}`, "client read failed");

  const updatedClient = await api("PUT", `/clients/${ids.clientId}`, {
    status: "ACTIVE",
    notes: "Phase 14 client update"
  });
  assert(updatedClient.data.status === "ACTIVE", "client update failed");
  log("client CRUD ok");

  const opportunity = await api("POST", "/opportunities", {
    client_id: ids.clientId,
    name: `Opportunity ${tag}`,
    service_type: "Consulting",
    estimated_value: 15000000,
    initial_offer_amount: 12000000,
    pic_user_id: ids.userId,
    status: "NEW",
    source: "Phase 14",
    notes: "Phase 14 local smoke test"
  });
  ids.opportunityId = opportunity.data.id;
  await assertListed("/opportunities", `search=${tag}`, ids.opportunityId, "opportunity");

  const updatedOpportunity = await api("PUT", `/opportunities/${ids.opportunityId}`, {
    status: "FOLLOW_UP",
    next_follow_up_date: "2026-07-12"
  });
  assert(updatedOpportunity.data.status === "FOLLOW_UP", "opportunity update failed");
  log("opportunity flow ok");

  const project = await api("POST", "/projects", {
    client_id: ids.clientId,
    opportunity_id: ids.opportunityId,
    name: `Project ${tag}`,
    service_type: "Consulting",
    contract_value: 12000000,
    pic_user_id: ids.userId,
    status: "NOT_STARTED",
    progress_percentage: 0,
    start_date: "2026-07-05",
    deadline: "2026-08-05",
    next_action: "Phase 14 follow up"
  });
  ids.projectId = project.data.id;
  await assertListed("/projects", `search=${tag}`, ids.projectId, "project");

  const updatedProject = await api("PUT", `/projects/${ids.projectId}`, {
    status: "IN_PROGRESS",
    progress_percentage: 25
  });
  assert(updatedProject.data.progress_percentage === 25, "project update failed");
  log("project flow ok");

  const invoice = await api("POST", "/invoices", {
    project_id: ids.projectId,
    invoice_number: `INV-${tag}`,
    invoice_date: "2026-07-05",
    due_date: "2026-07-20",
    termin_number: 1,
    description: "Phase 14 smoke invoice",
    amount: 12000000,
    status: "DRAFT"
  });
  ids.invoiceId = invoice.data.id;
  await assertListed("/invoices", `search=INV-${tag}`, ids.invoiceId, "invoice");

  const payment = await api("POST", "/payments", {
    invoice_id: ids.invoiceId,
    payment_date: "2026-07-06",
    amount: 6000000,
    payment_method: "BANK_TRANSFER",
    reference_number: `PAY-${tag}`,
    notes: "Phase 14 smoke payment",
    status: "VALID"
  });
  ids.paymentId = payment.data.id;
  await assertListed(
    "/payments",
    `invoice_id=${ids.invoiceId}`,
    ids.paymentId,
    "payment"
  );

  const paidInvoice = await api("GET", `/invoices/${ids.invoiceId}`);
  assert(paidInvoice.data.status === "PARTIALLY_PAID", "invoice payment sync failed");
  log("invoice and payment flow ok");

  const payable = await api("POST", "/payables", {
    project_id: ids.projectId,
    vendor_name: `Vendor ${tag}`,
    cost_category: "OPERATIONAL",
    description: "Phase 14 smoke payable",
    bill_date: "2026-07-05",
    due_date: "2026-07-25",
    amount: 2500000,
    status: "UNPAID"
  });
  ids.payableId = payable.data.id;
  await assertListed("/payables", `vendor_name=${tag}`, ids.payableId, "payable");

  const updatedPayable = await api("PUT", `/payables/${ids.payableId}`, {
    status: "WAITING_APPROVAL"
  });
  assert(updatedPayable.data.status === "WAITING_APPROVAL", "payable update failed");
  log("payable flow ok");

  const documentLink = await api("POST", "/document-links", {
    linked_type: "PROJECT",
    linked_id: ids.projectId,
    document_kind: "PROJECT_DOCUMENT",
    title: `Document ${tag}`,
    url: `https://example.com/${tag}`,
    provider: "EXTERNAL_URL",
    notes: "Phase 14 smoke document link"
  });
  ids.documentLinkId = documentLink.data.id;
  await assertListed(
    "/document-links",
    `linked_type=PROJECT&linked_id=${ids.projectId}`,
    ids.documentLinkId,
    "document link"
  );

  const updatedDocumentLink = await api("PUT", `/document-links/${ids.documentLinkId}`, {
    title: `Updated Document ${tag}`
  });
  assert(
    updatedDocumentLink.data.title === `Updated Document ${tag}`,
    "document link update failed"
  );
  log("document link CRUD ok");

  await deleteAndAssert("/document-links", ids.documentLinkId, "document link");
  delete ids.documentLinkId;
  await deleteAndAssert("/payments", ids.paymentId, "payment");
  delete ids.paymentId;
  await deleteAndAssert("/payables", ids.payableId, "payable");
  delete ids.payableId;
  await deleteAndAssert("/invoices", ids.invoiceId, "invoice");
  delete ids.invoiceId;
  await deleteAndAssert("/projects", ids.projectId, "project");
  delete ids.projectId;
  await deleteAndAssert("/opportunities", ids.opportunityId, "opportunity");
  delete ids.opportunityId;
  await deleteAndAssert("/clients", ids.clientId, "client");
  delete ids.clientId;
}

async function api(method, path, body, options = {}) {
  const auth = options.auth ?? true;
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(auth ? { "cf-access-authenticated-user-email": ACCESS_EMAIL } : {}),
      ...(body ? { "content-type": "application/json" } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `${method} ${path} failed with ${response.status}: ${JSON.stringify(payload)}`
    );
  }

  return payload;
}

async function assertListed(path, query, id, label) {
  const list = await api("GET", `${path}?${query}`);
  assert(Array.isArray(list.data), `${label} list did not return an array`);
  assert(
    list.data.some((item) => item.id === id),
    `${label} list did not include ${id}`
  );
}

async function deleteAndAssert(path, id, label) {
  await api("DELETE", `${path}/${id}`);
  const response = await fetch(`${API_BASE}${path}/${id}`, {
    headers: { "cf-access-authenticated-user-email": ACCESS_EMAIL }
  });
  assert(
    response.status === 404,
    `${label} delete verification expected 404, got ${response.status}`
  );
  log(`${label} delete ok`);
}

async function cleanup() {
  const cleanupTargets = [
    ["/document-links", "documentLinkId"],
    ["/payments", "paymentId"],
    ["/payables", "payableId"],
    ["/invoices", "invoiceId"],
    ["/projects", "projectId"],
    ["/opportunities", "opportunityId"],
    ["/clients", "clientId"]
  ];

  for (const [path, key] of cleanupTargets) {
    if (!ids[key]) {
      continue;
    }

    await fetch(`${API_BASE}${path}/${ids[key]}`, {
      method: "DELETE",
      headers: { "cf-access-authenticated-user-email": ACCESS_EMAIL }
    }).catch(() => null);
  }
}

async function runCommand(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { shell: true, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
      }
    });
  });
}

async function waitForHealth() {
  const started = Date.now();
  while (Date.now() - started < 30000) {
    if (await isHealthy()) {
      return;
    }
    await delay(500);
  }
  throw new Error(`Timed out waiting for ${API_ORIGIN}/api/health`);
}

async function isHealthy() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    if (!response.ok) {
      return false;
    }
    const payload = await response.json();
    return payload.status === "ok";
  } catch {
    return false;
  }
}

async function stopProcessTree(child) {
  if (!child.pid) {
    return;
  }

  if (process.platform === "win32") {
    await new Promise((resolve) => {
      spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
        stdio: "ignore"
      }).on("exit", resolve);
    });
    return;
  }

  child.kill("SIGTERM");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function log(message) {
  console.log(`- ${message}`);
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
