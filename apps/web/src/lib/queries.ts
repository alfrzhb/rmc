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
};

export type ProjectOption = {
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

export function useInvoices() {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: () => apiFetch<InvoiceOption[]>("/invoices?pageSize=100")
  });
}
