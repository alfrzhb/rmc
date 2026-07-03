import {
  Banknote,
  BarChart3,
  BriefcaseBusiness,
  ClipboardList,
  FileText,
  HandCoins,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users
} from "lucide-react";
import type { ComponentType } from "react";

export type AppRoute = {
  path: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  highlights: string[];
};

export const appRoutes: AppRoute[] = [
  {
    path: "/login-check",
    title: "Login Check",
    description: "Verify Cloudflare Access identity and internal user role.",
    icon: ShieldCheck,
    highlights: ["Access identity", "Internal RBAC", "Active user status"]
  },
  {
    path: "/dashboard",
    title: "Owner Dashboard",
    description: "Operational and finance visibility for active business flow.",
    icon: LayoutDashboard,
    highlights: ["Action items", "Outstanding AR", "Projects needing attention"]
  },
  {
    path: "/clients",
    title: "Clients",
    description: "Client companies, contacts, and relationship history.",
    icon: Users,
    highlights: ["Client list", "Primary contacts", "Client status"]
  },
  {
    path: "/opportunities",
    title: "Opportunities",
    description: "Penawaran pipeline from lead to negotiation and deal.",
    icon: ClipboardList,
    highlights: ["Follow-up date", "PIC assignment", "Won/Lost status"]
  },
  {
    path: "/projects",
    title: "Projects",
    description: "Project execution, progress, blockers, and activity timeline.",
    icon: BriefcaseBusiness,
    highlights: ["Project status", "Members", "Next action"]
  },
  {
    path: "/invoices",
    title: "Invoices",
    description: "AR tracking for invoice issue, due date, and payment state.",
    icon: FileText,
    highlights: ["Invoice status", "Due dates", "Remaining amount"]
  },
  {
    path: "/payments",
    title: "Payments",
    description: "Incoming client payments and proof of payment records.",
    icon: Banknote,
    highlights: ["Partial payments", "Payment method", "Payment proof"]
  },
  {
    path: "/payables",
    title: "Payables",
    description: "AP and project cost tracking for vendor bills and expenses.",
    icon: HandCoins,
    highlights: ["Unpaid AP", "Due soon", "Cost categories"]
  },
  {
    path: "/reports",
    title: "Reports",
    description: "Exportable operational and finance reports.",
    icon: BarChart3,
    highlights: ["Opportunities", "Projects", "AR/AP export"]
  },
  {
    path: "/settings",
    title: "Settings",
    description: "Users, roles, and system preferences for internal operations.",
    icon: Settings,
    highlights: ["Users", "Roles", "Master data"]
  }
];
