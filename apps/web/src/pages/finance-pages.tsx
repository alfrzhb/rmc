import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  COST_CATEGORIES,
  INVOICE_STATUSES,
  PAYABLE_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES
} from "@ratama/shared";
import { apiFetch } from "@/lib/api";
import { emptyToUndefined, numberValue, todayString } from "@/lib/form";
import { useInvoices, useProjects } from "@/lib/queries";
import {
  DeleteButton,
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
  amount: number;
  status: string;
};

type PaymentRow = {
  id: string;
  invoice_id: string;
  invoice_number?: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  status: string;
};

type PayableRow = {
  id: string;
  project_id: string | null;
  project_name?: string | null;
  vendor_name: string;
  cost_category: string;
  due_date: string | null;
  amount: number;
  status: string;
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] })
  });

  const deleteInvoice = useMutation({
    mutationFn: (id: string) => apiFetch<{ id: string }>(`/invoices/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] })
  });

  return (
    <ModulePage description="AR tracking for invoice issue, due date, and payment state." title="Invoices">
      <div className="grid gap-6 xl:grid-cols-[25rem_1fr]">
        <Panel title="New Invoice">
          <form
            className="grid gap-4 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              createInvoice.mutate({
                project_id: form.get("project_id"),
                invoice_number: form.get("invoice_number"),
                invoice_date: form.get("invoice_date"),
                due_date: form.get("due_date"),
                termin_number: numberValue(form.get("termin_number")),
                description: emptyToUndefined(form.get("description")),
                amount: numberValue(form.get("amount")),
                status: form.get("status")
              });
              event.currentTarget.reset();
            }}
          >
            <ErrorMessage message={createInvoice.error?.message} />
            <Field label="Project">
              <select className={inputClass} name="project_id" required>
                <option value="">Select project</option>
                {(projects.data ?? []).map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Invoice Number">
              <input className={inputClass} name="invoice_number" required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Invoice Date">
                <input className={inputClass} defaultValue={todayString()} name="invoice_date" required type="date" />
              </Field>
              <Field label="Due Date">
                <input className={inputClass} name="due_date" required type="date" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Amount">
                <input className={inputClass} min="1" name="amount" required type="number" />
              </Field>
              <Field label="Status">
                <select className={inputClass} defaultValue="DRAFT" name="status">
                  {INVOICE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Description">
              <textarea className={textareaClass} name="description" />
            </Field>
            <SubmitButton isLoading={createInvoice.isPending}>Create Invoice</SubmitButton>
          </form>
        </Panel>
        <FinanceTable
          columns={["Invoice", "Project", "Client", "Status", "Amount"]}
          emptyLabel="No invoices yet"
          rows={(invoices.data ?? []).map((invoice) => ({
            id: invoice.id,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    }
  });

  const deletePayment = useMutation({
    mutationFn: (id: string) => apiFetch<{ id: string }>(`/payments/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payments"] })
  });

  return (
    <ModulePage description="Incoming client payments and proof of payment records." title="Payments">
      <div className="grid gap-6 xl:grid-cols-[25rem_1fr]">
        <Panel title="Record Payment">
          <form
            className="grid gap-4 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              createPayment.mutate({
                invoice_id: form.get("invoice_id"),
                payment_date: form.get("payment_date"),
                amount: numberValue(form.get("amount")),
                payment_method: form.get("payment_method"),
                reference_number: emptyToUndefined(form.get("reference_number")),
                notes: emptyToUndefined(form.get("notes")),
                status: form.get("status")
              });
              event.currentTarget.reset();
            }}
          >
            <ErrorMessage message={createPayment.error?.message} />
            <Field label="Invoice">
              <select className={inputClass} name="invoice_id" required>
                <option value="">Select invoice</option>
                {(invoices.data ?? []).map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoice_number}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Payment Date">
                <input className={inputClass} defaultValue={todayString()} name="payment_date" required type="date" />
              </Field>
              <Field label="Amount">
                <input className={inputClass} min="1" name="amount" required type="number" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Method">
                <select className={inputClass} defaultValue="BANK_TRANSFER" name="payment_method">
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Status">
                <select className={inputClass} defaultValue="VALID" name="status">
                  {PAYMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Reference">
              <input className={inputClass} name="reference_number" />
            </Field>
            <Field label="Notes">
              <textarea className={textareaClass} name="notes" />
            </Field>
            <SubmitButton isLoading={createPayment.isPending}>Record Payment</SubmitButton>
          </form>
        </Panel>
        <FinanceTable
          columns={["Invoice", "Date", "Method", "Status", "Amount"]}
          emptyLabel="No payments yet"
          rows={(payments.data ?? []).map((payment) => ({
            id: payment.id,
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payables"] })
  });

  const deletePayable = useMutation({
    mutationFn: (id: string) => apiFetch<{ id: string }>(`/payables/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payables"] })
  });

  return (
    <ModulePage description="AP and project cost tracking for vendor bills and expenses." title="Payables">
      <div className="grid gap-6 xl:grid-cols-[25rem_1fr]">
        <Panel title="New Payable">
          <form
            className="grid gap-4 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              createPayable.mutate({
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
              });
              event.currentTarget.reset();
            }}
          >
            <ErrorMessage message={createPayable.error?.message} />
            <Field label="Project">
              <select className={inputClass} name="project_id">
                <option value="">No project</option>
                {(projects.data ?? []).map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Vendor">
              <input className={inputClass} name="vendor_name" required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category">
                <select className={inputClass} defaultValue="OPERATIONAL" name="cost_category">
                  {COST_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Amount">
                <input className={inputClass} min="1" name="amount" required type="number" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Due Date">
                <input className={inputClass} name="due_date" type="date" />
              </Field>
              <Field label="Status">
                <select className={inputClass} defaultValue="UNPAID" name="status">
                  {PAYABLE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Notes">
              <textarea className={textareaClass} name="notes" />
            </Field>
            <SubmitButton isLoading={createPayable.isPending}>Create Payable</SubmitButton>
          </form>
        </Panel>
        <FinanceTable
          columns={["Vendor", "Project", "Category", "Status", "Amount"]}
          emptyLabel="No payables yet"
          rows={(payables.data ?? []).map((payable) => ({
            id: payable.id,
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

function FinanceTable({
  columns,
  emptyLabel,
  rows,
  title,
  onDelete
}: {
  columns: string[];
  emptyLabel: string;
  rows: Array<{ id: string; cells: string[] }>;
  title: string;
  onDelete: (id: string) => void;
}) {
  return (
    <Panel title={title}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-3">
                  {column}
                </th>
              ))}
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
                  <DeleteButton onClick={() => onDelete(row.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <EmptyState label={emptyLabel} /> : null}
      </div>
    </Panel>
  );
}
