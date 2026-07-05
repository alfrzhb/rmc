import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import { LoginCheckPage } from "@/components/login-check-page";
import { PlaceholderPage } from "@/components/placeholder-page";
import { ClientDetailPage, ClientsPage } from "@/pages/clients-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { DocumentLinkDetailPage, DocumentLinksPage } from "@/pages/document-links-page";
import {
  InvoiceDetailPage,
  InvoicesPage,
  PayableDetailPage,
  PayablesPage,
  PaymentDetailPage,
  PaymentsPage
} from "@/pages/finance-pages";
import { OpportunitiesPage, OpportunityDetailPage } from "@/pages/opportunities-page";
import { ProjectDetailPage, ProjectsPage } from "@/pages/projects-page";
import { SettingsPage } from "@/pages/settings-page";
import { appRoutes } from "@/routes";

const pageMap = {
  "/dashboard": <DashboardPage />,
  "/clients": <ClientsPage />,
  "/opportunities": <OpportunitiesPage />,
  "/projects": <ProjectsPage />,
  "/invoices": <InvoicesPage />,
  "/payments": <PaymentsPage />,
  "/payables": <PayablesPage />,
  "/document-links": <DocumentLinksPage />,
  "/settings": <SettingsPage />
};

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login-check" element={<LoginCheckPage />} />
        <Route path="/clients/:id" element={<ClientDetailPage />} />
        <Route path="/opportunities/:id" element={<OpportunityDetailPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
        <Route path="/payments/:id" element={<PaymentDetailPage />} />
        <Route path="/payables/:id" element={<PayableDetailPage />} />
        <Route path="/document-links/:id" element={<DocumentLinkDetailPage />} />
        {appRoutes
          .filter((route) => route.path !== "/login-check")
          .map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={
                pageMap[route.path as keyof typeof pageMap] ?? (
                  <PlaceholderPage
                    actionLabel={route.actionLabel}
                    title={route.title}
                    description={route.description}
                    highlights={route.highlights}
                  />
                )
              }
            />
          ))}
      </Routes>
    </AppShell>
  );
}
