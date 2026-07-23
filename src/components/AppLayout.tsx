import { Outlet, useLocation } from "react-router-dom";
import { Bell, Building2, ShieldCheck } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/Button";
import { allReportRoutes } from "@/config/reports.config";

function pageTitleForPath(pathname: string) {
  if (pathname.startsWith("/sales/orders/")) return "Order Details";
  if (pathname === "/sales/orders") return "Patient Orders";
  if (pathname.startsWith("/sales/customers/")) return "Customer Details";
  if (pathname === "/sales/customers") return "Customer Care";
  if (pathname === "/reports/order-sources") return "Order Sources";
  if (pathname.startsWith("/reports/order-sources/")) return "Source Details";
  if (pathname === "/reports/executive-brief") return "Operations Command Center";
  return allReportRoutes.find((route) => route.path === pathname)?.title ?? "Sales Overview";
}

export function AppLayout() {
  const location = useLocation();
  const pageTitle = pageTitleForPath(location.pathname);
  const isMainDashboard = location.pathname === "/reports/sales-overview";

  return (
    <div className="min-h-screen bg-[var(--brand-background)]">
      <Sidebar />
      <div className="min-w-0 lg:pl-[332px]">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/92 backdrop-blur">
          <div className="flex h-20 items-center justify-between gap-4 px-4 pl-20 lg:px-8 lg:pl-8">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-slate-950 md:text-xl">{pageTitle}</h1>
              <p className="truncate text-sm text-slate-500">
                {isMainDashboard ? "El Khabiry Pharmacy Network Overview" : "El Khabiry Pharmacy internal operations workspace"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="hidden h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-100 md:inline-flex">
                <Building2 className="h-4 w-4 text-brand-700" />
                <span className="sr-only">Branch selector</span>
                <select className="bg-transparent outline-none">
                  <option>El Khabiry Network</option>
                  <option>Nasr City Branch</option>
                  <option>Zahraa El Maadi Branch</option>
                  <option>Mokattam Branch</option>
                </select>
              </label>
              <Button size="icon" aria-label="Notifications"><Bell className="h-4 w-4" /></Button>
              <div className="hidden items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm sm:flex">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">AE</span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-slate-900">Ahmed El Khabiry</span>
                  <span className="block truncate text-xs text-slate-500">System Administrator</span>
                </span>
              </div>
              <div className="hidden items-center gap-2 rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-800 xl:flex">
                <ShieldCheck className="h-4 w-4" />Private Back Office
              </div>
            </div>
          </div>
        </header>
        <main className="min-h-screen px-4 py-6 lg:px-8">
          <Outlet />
        </main>
        <footer className="flex flex-col gap-2 border-t border-slate-200 px-4 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <span>
            <span className="font-semibold text-slate-700">El Khabiry Pharmacy Back Office</span> · Internal Operations Platform
          </span>
          <span>Version 1.0.0 · Support: 17042</span>
        </footer>
      </div>
    </div>
  );
}
