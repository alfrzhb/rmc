import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export type ClientOption = {
  id: string;
  name: string;
};

export type UserOption = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  last_login_at?: string | null;
};

export type ProjectOption = {
  id: string;
  name: string;
  client_id: string;
};

export type OpportunityOption = {
  id: string;
  name: string;
  client_id: string;
};

export type InvoiceOption = {
  id: string;
  invoice_number: string;
  project_id: string;
  client_id: string;
  amount: number;
  status: string;
};

export type PaymentOption = {
  id: string;
  invoice_id: string;
  invoice_number?: string;
  amount: number;
  status: string;
};

export type PayableOption = {
  id: string;
  vendor_name: string;
  project_id: string | null;
  amount: number;
  status: string;
};

export function useClients() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: () => apiFetch<ClientOption[]>("/clients?pageSize=100")
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => apiFetch<UserOption[]>("/users")
  });
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: () => apiFetch<ProjectOption[]>("/projects?pageSize=100")
  });
}

export function useOpportunities() {
  return useQuery({
    queryKey: ["opportunities"],
    queryFn: () => apiFetch<OpportunityOption[]>("/opportunities?pageSize=100")
  });
}

export function useInvoices() {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: () => apiFetch<InvoiceOption[]>("/invoices?pageSize=100")
  });
}

export function usePayments() {
  return useQuery({
    queryKey: ["payments"],
    queryFn: () => apiFetch<PaymentOption[]>("/payments?pageSize=100")
  });
}

export function usePayables() {
  return useQuery({
    queryKey: ["payables"],
    queryFn: () => apiFetch<PayableOption[]>("/payables?pageSize=100")
  });
}
