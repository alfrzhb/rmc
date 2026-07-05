import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  COST_CATEGORIES,
  INVOICE_STATUSES,
  PAYABLE_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES
} from "@ratama/shared";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { emptyToUndefined, numberValue, todayString } from "@/lib/form";
import { invalidateMany } from "@/lib/mutations";
import { useInvoices, useProjects } from "@/lib/queries";
import {
  DeleteButton,
  DetailLink,
  EmptyState,
  ErrorMessage,
  Field,
  inputClass,
  ModulePage,
  Panel,
  SubmitButton,
  textareaClass
} from "@/components/module-ui";

type InvoiceRow = {
  id: string;
  project_id: string;
  project_name?: string;
  client_name?: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  termin_number: number | null;
  description: string | null;
  amount: number;
  status: string;
};

type PaymentRow = {
  id: string;
  invoice_id: string;
  invoice_number?: string;
  project_id?: string;
  project_name?: string;
  client_name?: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_number: string | null;
  notes: string | null;
  status: string;
};

type InvoiceDetail = InvoiceRow & {
  payments: PaymentRow[];
};

type PayableRow = {
  id: string;
  project_id: string | null;
  project_name?: string | null;
  vendor_name: string;
  cost_category: string;
  description: string | null;
  due_date: string | null;
  bill_date?: string | null;
  amount: number;
  status: string;
  paid_at?: string | null;
  payment_method?: string | null;
  reference_number?: string | null;
  notes?: string | null;
};

export function InvoicesPage() {
  const queryClient = useQueryClient();
  const projects = useProjects();
  const invoices = useQuery({
    queryKey: ["invoices"],
    queryFn: () => apiFetch<InvoiceRow[]>("/invoices?pageSize=100")
  });

  const createInvoice = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<InvoiceRow>("/invoices", {
        method: "POST",
        body: JSON.stringify(body)
      }),
    onSuccess: () => invalidateMany(queryClient, ["invoices", "dashboard-summary"])
  });

  const deleteInvoice = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ id: string }>(`/invoices/${id}`, { method: "DELETE" }),
    onSuccess: () =>
      invalidateMany(queryClient, ["invoices", "payments", "dashboard-summary"])
  });

  return (
    <ModulePage
      description="AR tracking for invoice issue, due date, and payment state."
      title="Invoices"
    >
      <div className="grid gap-6 xl:grid-cols-[25rem_1fr]">
        <Panel title="New Invoice">
          <form
            className="grid gap-4 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              const formElement = event.currentTarget;
              createInvoice.mutate(invoicePayload(new FormData(event.currentTarget)), {
                onSuccess: () => formElement.reset()
              });
            }}
          >
            <ErrorMessage message={createInvoice.error?.message} />
            <InvoiceFields projects={projects.data} />
            <SubmitButton isLoading={createInvoice.isPending}>
              Create Invoice
            </SubmitButton>
          </form>
        </Panel>
        <FinanceTable
          columns={["Invoice", "Project", "Client", "Status", "Amount"]}
          emptyLabel="No invoices yet"
          rows={(invoices.data ?? []).map((invoice) => ({
            id: invoice.id,
            detailTo: `/invoices/${invoice.id}`,
            confirm: `Delete invoice ${invoice.invoice_number}?`,
            cells: [
              invoice.invoice_number,
              invoice.project_name ?? invoice.project_id,
              invoice.client_name ?? "-",
              invoice.status,
              invoice.amount.toLocaleString("id-ID")
            ]
          }))}
          title="Invoice List"
          onDelete={(id) => deleteInvoice.mutate(id)}
        />
      </div>
    </ModulePage>
  );
}

export function PaymentsPage() {
  const queryClient = useQueryClient();
  const invoices = useInvoices();
  const payments = useQuery({
    queryKey: ["payments"],
    queryFn: () => apiFetch<PaymentRow[]>("/payments?pageSize=100")
  });

  const createPayment = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<PaymentRow>("/payments", {
        method: "POST",
        body: JSON.stringify(body)
      }),
    onSuccess: () =>
      invalidateMany(queryClient, ["payments", "invoices", "dashboard-summary"])
  });

  const deletePayment = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ id: string }>(`/payments/${id}`, { method: "DELETE" }),
    onSuccess: () =>
      invalidateMany(queryClient, ["payments", "invoices", "dashboard-summary"])
  });

  return (
    <ModulePage
      description="Incoming client payments and proof of payment records."
      title="Payments"
    >
      <div className="grid gap-6 xl:grid-cols-[25rem_1fr]">
        <Panel title="Record Payment">
          <form
            className="grid gap-4 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              const formElement = event.currentTarget;
              createPayment.mutate(paymentPayload(new FormData(event.currentTarget)), {
                onSuccess: () => formElement.reset()
              });
            }}
          >
            <ErrorMessage message={createPayment.error?.message} />
            <PaymentFields invoices={invoices.data} />
            <SubmitButton isLoading={createPayment.isPending}>
              Record Payment
            </SubmitButton>
          </form>
        </Panel>
        <FinanceTable
          columns={["Invoice", "Date", "Method", "Status", "Amount"]}
          emptyLabel="No payments yet"
          rows={(payments.data ?? []).map((payment) => ({
            id: payment.id,
            detailTo: `/payments/${payment.id}`,
            confirm: "Delete this payment?",
            cells: [
              payment.invoice_number ?? payment.invoice_id,
              payment.payment_date,
              payment.payment_method,
              payment.status,
              payment.amount.toLocaleString("id-ID")
            ]
          }))}
          title="Payment List"
          onDelete={(id) => deletePayment.mutate(id)}
        />
      </div>
    </ModulePage>
  );
}

export function PayablesPage() {
  const queryClient = useQueryClient();
  const projects = useProjects();
  const payables = useQuery({
    queryKey: ["payables"],
    queryFn: () => apiFetch<PayableRow[]>("/payables?pageSize=100")
  });

  const createPayable = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<PayableRow>("/payables", {
        method: "POST",
        body: JSON.stringify(body)
      }),
    onSuccess: () => invalidateMany(queryClient, ["payables", "dashboard-summary"])
  });

  const deletePayable = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ id: string }>(`/payables/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidateMany(queryClient, ["payables", "dashboard-summary"])
  });

  return (
    <ModulePage
      description="AP and project cost tracking for vendor bills and expenses."
      title="Payables"
    >
      <div className="grid gap-6 xl:grid-cols-[25rem_1fr]">
        <Panel title="New Payable">
          <form
            className="grid gap-4 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              const formElement = event.currentTarget;
              createPayable.mutate(payablePayload(new FormData(event.currentTarget)), {
                onSuccess: () => formElement.reset()
              });
            }}
          >
            <ErrorMessage message={createPayable.error?.message} />
            <PayableFields projects={projects.data} />
            <SubmitButton isLoading={createPayable.isPending}>
              Create Payable
            </SubmitButton>
          </form>
        </Panel>
        <FinanceTable
          columns={["Vendor", "Project", "Category", "Status", "Amount"]}
          emptyLabel="No payables yet"
          rows={(payables.data ?? []).map((payable) => ({
            id: payable.id,
            detailTo: `/payables/${payable.id}`,
            confirm: `Delete payable ${payable.vendor_name}?`,
            cells: [
              payable.vendor_name,
              payable.project_name ?? "-",
              payable.cost_category,
              payable.status,
              payable.amount.toLocaleString("id-ID")
            ]
          }))}
          title="Payable List"
          onDelete={(id) => deletePayable.mutate(id)}
        />
      </div>
    </ModulePage>
  );
}

export function InvoiceDetailPage() {
  const { id } = useParams();
  const invoiceId = id ?? "";
  const queryClient = useQueryClient();
  const projects = useProjects();
  const invoice = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: () => apiFetch<InvoiceDetail>(`/invoices/${invoiceId}`),
    enabled: Boolean(invoiceId)
  });

  const updateInvoice = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<InvoiceDetail>(`/invoices/${invoiceId}`, {
        method: "PUT",
        body: JSON.stringify(body)
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      invalidateMany(queryClient, ["invoices", "dashboard-summary"]);
    }
  });

  const createPayment = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<PaymentRow>("/payments", {
        method: "POST",
        body: JSON.stringify(body)
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      invalidateMany(queryClient, ["payments", "invoices", "dashboard-summary"]);
    }
  });

  const deletePayment = useMutation({
    mutationFn: (paymentId: string) =>
      apiFetch<{ id: string }>(`/payments/${paymentId}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      invalidateMany(queryClient, ["payments", "invoices", "dashboard-summary"]);
    }
  });

  const current = invoice.data;

  return (
    <ModulePage
      actions={
        <Button asChild type="button" variant="outline">
          <Link to="/invoices">Back</Link>
        </Button>
      }
      description="Invoice detail, editable billing data, and related payments."
      title={current?.invoice_number ?? "Invoice Detail"}
    >
      <div className="grid gap-6 xl:grid-cols-[25rem_1fr]">
        <Panel title="Edit Invoice">
          <form
            key={current?.id}
            className="grid gap-4 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              updateInvoice.mutate(invoicePayload(new FormData(event.currentTarget)));
            }}
          >
            <ErrorMessage
              message={invoice.error?.message ?? updateInvoice.error?.message}
            />
            <InvoiceFields invoice={current} projects={projects.data} />
            <SubmitButton isLoading={updateInvoice.isPending}>Save Invoice</SubmitButton>
          </form>
        </Panel>

        <Panel title="Payments">
          <form
            className="grid gap-4 border-b p-4 lg:grid-cols-[10rem_10rem_10rem_1fr_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const formElement = event.currentTarget;
              createPayment.mutate(
                {
                  ...paymentPayload(form),
                  invoice_id: invoiceId
                },
                { onSuccess: () => formElement.reset() }
              );
            }}
          >
            <Field label="Date">
              <input
                className={inputClass}
                defaultValue={todayString()}
                name="payment_date"
                required
                type="date"
              />
            </Field>
            <Field label="Amount">
              <input
                className={inputClass}
                min="1"
                name="amount"
                required
                type="number"
              />
            </Field>
            <Field label="Method">
              <select
                className={inputClass}
                defaultValue="BANK_TRANSFER"
                name="payment_method"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Reference">
              <input className={inputClass} name="reference_number" />
            </Field>
            <div className="flex items-end">
              <SubmitButton isLoading={createPayment.isPending}>Add</SubmitButton>
            </div>
          </form>
          <ErrorMessage
            message={createPayment.error?.message ?? deletePayment.error?.message}
          />
          <FinanceTable
            columns={["Date", "Method", "Status", "Amount"]}
            emptyLabel="No payments yet"
            rows={(current?.payments ?? []).map((payment) => ({
              id: payment.id,
              detailTo: `/payments/${payment.id}`,
              confirm: "Delete this payment?",
              cells: [
                payment.payment_date,
                payment.payment_method,
                payment.status,
                payment.amount.toLocaleString("id-ID")
              ]
            }))}
            title=""
            onDelete={(paymentId) => deletePayment.mutate(paymentId)}
          />
        </Panel>
      </div>
    </ModulePage>
  );
}

export function PaymentDetailPage() {
  const { id } = useParams();
  const paymentId = id ?? "";
  const queryClient = useQueryClient();
  const invoices = useInvoices();
  const payment = useQuery({
    queryKey: ["payment", paymentId],
    queryFn: () => apiFetch<PaymentRow>(`/payments/${paymentId}`),
    enabled: Boolean(paymentId)
  });

  const updatePayment = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<PaymentRow>(`/payments/${paymentId}`, {
        method: "PUT",
        body: JSON.stringify(body)
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["payment", paymentId] });
      invalidateMany(queryClient, ["payments", "invoices", "dashboard-summary"]);
    }
  });

  const current = payment.data;

  return (
    <ModulePage
      actions={
        <Button asChild type="button" variant="outline">
          <Link to="/payments">Back</Link>
        </Button>
      }
      description="Payment detail and reconciliation fields."
      title={current?.invoice_number ?? "Payment Detail"}
    >
      <Panel title="Edit Payment">
        <form
          key={current?.id}
          className="grid gap-4 p-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            updatePayment.mutate(paymentPayload(new FormData(event.currentTarget)));
          }}
        >
          <ErrorMessage
            message={payment.error?.message ?? updatePayment.error?.message}
          />
          <PaymentFields invoices={invoices.data} payment={current} />
          <div className="md:col-span-2">
            <SubmitButton isLoading={updatePayment.isPending}>Save Payment</SubmitButton>
          </div>
        </form>
      </Panel>
    </ModulePage>
  );
}

export function PayableDetailPage() {
  const { id } = useParams();
  const payableId = id ?? "";
  const queryClient = useQueryClient();
  const projects = useProjects();
  const payable = useQuery({
    queryKey: ["payable", payableId],
    queryFn: () => apiFetch<PayableRow>(`/payables/${payableId}`),
    enabled: Boolean(payableId)
  });

  const updatePayable = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<PayableRow>(`/payables/${payableId}`, {
        method: "PUT",
        body: JSON.stringify(body)
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["payable", payableId] });
      invalidateMany(queryClient, ["payables", "dashboard-summary"]);
    }
  });

  const current = payable.data;

  return (
    <ModulePage
      actions={
        <Button asChild type="button" variant="outline">
          <Link to="/payables">Back</Link>
        </Button>
      }
      description="Payable detail and AP status update."
      title={current?.vendor_name ?? "Payable Detail"}
    >
      <Panel title="Edit Payable">
        <form
          key={current?.id}
          className="grid gap-4 p-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            updatePayable.mutate(payablePayload(new FormData(event.currentTarget)));
          }}
        >
          <ErrorMessage
            message={payable.error?.message ?? updatePayable.error?.message}
          />
          <PayableFields payable={current} projects={projects.data} />
          <div className="md:col-span-2">
            <SubmitButton isLoading={updatePayable.isPending}>Save Payable</SubmitButton>
          </div>
        </form>
      </Panel>
    </ModulePage>
  );
}

function InvoiceFields({
  invoice,
  projects
}: {
  invoice?: InvoiceRow;
  projects?: Array<{ id: string; name: string }>;
}) {
  return (
    <>
      <Field label="Project">
        <select
          className={inputClass}
          defaultValue={invoice?.project_id ?? ""}
          name="project_id"
          required
        >
          <option value="">Select project</option>
          {(projects ?? []).map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Invoice Number">
        <input
          className={inputClass}
          defaultValue={invoice?.invoice_number ?? ""}
          name="invoice_number"
          required
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Invoice Date">
          <input
            className={inputClass}
            defaultValue={invoice?.invoice_date ?? todayString()}
            name="invoice_date"
            required
            type="date"
          />
        </Field>
        <Field label="Due Date">
          <input
            className={inputClass}
            defaultValue={invoice?.due_date ?? ""}
            name="due_date"
            required
            type="date"
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Amount">
          <input
            className={inputClass}
            defaultValue={invoice?.amount ?? ""}
            min="1"
            name="amount"
            required
            type="number"
          />
        </Field>
        <Field label="Status">
          <select
            className={inputClass}
            defaultValue={invoice?.status ?? "DRAFT"}
            name="status"
          >
            {INVOICE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Description">
        <textarea
          className={textareaClass}
          defaultValue={invoice?.description ?? ""}
          name="description"
        />
      </Field>
    </>
  );
}

function PaymentFields({
  invoices,
  payment
}: {
  invoices?: Array<{ id: string; invoice_number: string }>;
  payment?: PaymentRow;
}) {
  return (
    <>
      <Field label="Invoice">
        <select
          className={inputClass}
          defaultValue={payment?.invoice_id ?? ""}
          name="invoice_id"
          required
        >
          <option value="">Select invoice</option>
          {(invoices ?? []).map((invoice) => (
            <option key={invoice.id} value={invoice.id}>
              {invoice.invoice_number}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Payment Date">
          <input
            className={inputClass}
            defaultValue={payment?.payment_date ?? todayString()}
            name="payment_date"
            required
            type="date"
          />
        </Field>
        <Field label="Amount">
          <input
            className={inputClass}
            defaultValue={payment?.amount ?? ""}
            min="1"
            name="amount"
            required
            type="number"
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Method">
          <select
            className={inputClass}
            defaultValue={payment?.payment_method ?? "BANK_TRANSFER"}
            name="payment_method"
          >
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select
            className={inputClass}
            defaultValue={payment?.status ?? "VALID"}
            name="status"
          >
            {PAYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Reference">
        <input
          className={inputClass}
          defaultValue={payment?.reference_number ?? ""}
          name="reference_number"
        />
      </Field>
      <Field label="Notes">
        <textarea
          className={textareaClass}
          defaultValue={payment?.notes ?? ""}
          name="notes"
        />
      </Field>
    </>
  );
}

function PayableFields({
  payable,
  projects
}: {
  payable?: PayableRow;
  projects?: Array<{ id: string; name: string }>;
}) {
  return (
    <>
      <Field label="Project">
        <select
          className={inputClass}
          defaultValue={payable?.project_id ?? ""}
          name="project_id"
        >
          <option value="">No project</option>
          {(projects ?? []).map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Vendor">
        <input
          className={inputClass}
          defaultValue={payable?.vendor_name ?? ""}
          name="vendor_name"
          required
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category">
          <select
            className={inputClass}
            defaultValue={payable?.cost_category ?? "OPERATIONAL"}
            name="cost_category"
          >
            {COST_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Amount">
          <input
            className={inputClass}
            defaultValue={payable?.amount ?? ""}
            min="1"
            name="amount"
            required
            type="number"
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Due Date">
          <input
            className={inputClass}
            defaultValue={payable?.due_date ?? ""}
            name="due_date"
            type="date"
          />
        </Field>
        <Field label="Status">
          <select
            className={inputClass}
            defaultValue={payable?.status ?? "UNPAID"}
            name="status"
          >
            {PAYABLE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Notes">
        <textarea
          className={textareaClass}
          defaultValue={payable?.notes ?? ""}
          name="notes"
        />
      </Field>
    </>
  );
}

function FinanceTable({
  columns,
  emptyLabel,
  rows,
  title,
  onDelete
}: {
  columns: string[];
  emptyLabel: string;
  rows: Array<{ id: string; cells: string[]; detailTo?: string; confirm?: string }>;
  title: string;
  onDelete: (id: string) => void;
}) {
  const table = (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-4 py-3">
                {column}
              </th>
            ))}
            <th className="w-20 px-4 py-3" />
            <th className="w-12 px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => (
            <tr key={row.id}>
              {row.cells.map((cell, index) => (
                <td key={`${row.id}-${index}`} className="px-4 py-3 first:font-medium">
                  {cell}
                </td>
              ))}
              <td className="px-4 py-3">
                {row.detailTo ? <DetailLink to={row.detailTo} /> : null}
              </td>
              <td className="px-4 py-3">
                <DeleteButton
                  confirmLabel={row.confirm}
                  onClick={() => onDelete(row.id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? <EmptyState label={emptyLabel} /> : null}
    </div>
  );

  if (!title) {
    return table;
  }

  return <Panel title={title}>{table}</Panel>;
}

function invoicePayload(form: FormData) {
  return {
    project_id: form.get("project_id"),
    invoice_number: form.get("invoice_number"),
    invoice_date: form.get("invoice_date"),
    due_date: form.get("due_date"),
    termin_number: numberValue(form.get("termin_number")),
    description: emptyToUndefined(form.get("description")),
    amount: numberValue(form.get("amount")),
    status: form.get("status")
  };
}

function paymentPayload(form: FormData) {
  return {
    invoice_id: form.get("invoice_id"),
    payment_date: form.get("payment_date"),
    amount: numberValue(form.get("amount")),
    payment_method: form.get("payment_method"),
    reference_number: emptyToUndefined(form.get("reference_number")),
    notes: emptyToUndefined(form.get("notes")),
    status: form.get("status") ?? "VALID"
  };
}

function payablePayload(form: FormData) {
  return {
    project_id: emptyToUndefined(form.get("project_id")),
    vendor_name: form.get("vendor_name"),
    cost_category: form.get("cost_category"),
    description: emptyToUndefined(form.get("description")),
    bill_date: emptyToUndefined(form.get("bill_date")),
    due_date: emptyToUndefined(form.get("due_date")),
    amount: numberValue(form.get("amount")),
    status: form.get("status"),
    paid_at: emptyToUndefined(form.get("paid_at")),
    payment_method: emptyToUndefined(form.get("payment_method")),
    reference_number: emptyToUndefined(form.get("reference_number")),
    notes: emptyToUndefined(form.get("notes"))
  };
}
