import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import { LoginCheckPage } from "@/components/login-check-page";
import { PlaceholderPage } from "@/components/placeholder-page";
import { ClientsPage } from "@/pages/clients-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { DocumentLinksPage } from "@/pages/document-links-page";
import { InvoicesPage, PayablesPage, PaymentsPage } from "@/pages/finance-pages";
import { OpportunitiesPage } from "@/pages/opportunities-page";
import { ProjectsPage } from "@/pages/projects-page";
import { appRoutes } from "@/routes";

const pageMap = {
  "/dashboard": <DashboardPage />,
  "/clients": <ClientsPage />,
  "/opportunities": <OpportunitiesPage />,
  "/projects": <ProjectsPage />,
  "/invoices": <InvoicesPage />,
  "/payments": <PaymentsPage />,
  "/payables": <PayablesPage />,
  "/document-links": <DocumentLinksPage />
};

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login-check" element={<LoginCheckPage />} />
        {appRoutes.filter((route) => route.path !== "/login-check").map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={pageMap[route.path as keyof typeof pageMap] ?? (
              <PlaceholderPage
                actionLabel={route.actionLabel}
                title={route.title}
                description={route.description}
                highlights={route.highlights}
              />
            )}
          />
        ))}
      </Routes>
    </AppShell>
  );
}
