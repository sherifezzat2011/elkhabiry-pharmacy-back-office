import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { allReportRoutes, legacyReportRedirects } from "@/config/reports.config";
import { ExecutiveBrief } from "@/pages/ExecutiveBrief";
import { OrderSourceDetailsPage, OrderSourcesReportPage } from "@/pages/OrderSourcesReport";
import { ReportPage } from "@/pages/ReportPage";
import { SalesOverviewPage } from "@/pages/SalesOverviewPage";
import { SalesCustomerDetailsPage, SalesCustomersPage, SalesOrderDetailsPage, SalesOrdersPage } from "@/pages/sales/SalesModule";

export const router = createBrowserRouter(
  [
    {
      element: <AppLayout />,
      children: [
        { path: "/", element: <Navigate to="/reports/sales-overview" replace /> },
        { path: "/reports", element: <Navigate to="/reports/sales-overview" replace /> },
        { path: "/reports/sales-overview", element: <SalesOverviewPage /> },
        { path: "/reports/order-sources", element: <OrderSourcesReportPage /> },
        { path: "/reports/order-sources/:source", element: <OrderSourceDetailsPage /> },
        { path: "/reports/sales", element: <Navigate to="/reports/sales/product-performance" replace /> },
        { path: "/sales", element: <Navigate to="/sales/orders" replace /> },
        { path: "/sales/orders", element: <SalesOrdersPage /> },
        { path: "/sales/orders/:orderId", element: <SalesOrderDetailsPage /> },
        { path: "/sales/customers", element: <SalesCustomersPage /> },
        { path: "/sales/customers/:customerId", element: <SalesCustomerDetailsPage /> },
        { path: "/brief", element: <Navigate to="/reports/executive-brief" replace /> },
        { path: "/reports/executive-brief", element: <ExecutiveBrief /> },
        ...allReportRoutes.map((route) => ({
          path: route.path,
          element: <ReportPage section={route.section} title={route.title} />,
        })),
        ...legacyReportRedirects.map((route) => ({
          path: route.from,
          element: <Navigate to={route.to} replace />,
        })),
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL },
);
