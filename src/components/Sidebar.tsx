import { ChevronDown, ChevronsLeft, Menu, ShoppingCart, UsersRound } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { findActiveModule, isNavigationItemActive, sidebarNavigation, type NavigationItem } from "@/config/reports.config";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { BrandLogo } from "@/components/BrandLogo";

type SidebarExpansionState = {
  reports: boolean;
  sales: boolean;
  modules: Record<string, boolean>;
};

function getInitialExpandedState(pathname: string): SidebarExpansionState {
  const activeModule = findActiveModule(pathname);
  return {
    reports: (pathname === "/reports" || pathname.startsWith("/reports/")) && !pathname.startsWith("/reports/promotions/") && !pathname.startsWith("/reports/shipping/"),
    sales: pathname.startsWith("/sales/"),
    modules: activeModule ? { [activeModule]: true } : {},
  };
}

function ReportLink({ item, activeRef, onNavigate }: { item: NavigationItem; activeRef: RefObject<HTMLAnchorElement>; onNavigate: () => void }) {
  const location = useLocation();
  const Icon = item.icon;
  const active = isNavigationItemActive(location.pathname, item);

  return (
    <NavLink
      ref={active ? activeRef : undefined}
      to={item.path ?? "/reports"}
      title={item.label}
      aria-label={item.label}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "relative ml-10 mr-1 flex h-10 min-w-0 items-center gap-3 rounded-lg px-3 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
          isActive ? "bg-brand-50 font-semibold text-brand-800" : "text-slate-600 hover:bg-brand-50/70 hover:text-brand-800",
        )
      }
    >
      {active ? <span className="absolute left-0 top-2 h-6 w-1 rounded-full bg-brand-500" /> : null}
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </NavLink>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<SidebarExpansionState>(() => getInitialExpandedState(location.pathname));
  const activeReportRef = useRef<HTMLAnchorElement>(null);
  const didInitialScroll = useRef(false);
  const reports = sidebarNavigation[0];
  const standaloneSections = sidebarNavigation.slice(1);
  const ReportsIcon = reports.icon;

  useEffect(() => {
    if (!didInitialScroll.current) {
      activeReportRef.current?.scrollIntoView({ block: "nearest" });
      didInitialScroll.current = true;
    }
  }, []);

  const toggleReports = () => {
    setExpanded((previous) => ({ ...previous, reports: !previous.reports }));
  };

  const toggleSales = () => {
    setExpanded((previous) => ({ ...previous, sales: !previous.sales }));
  };

  const toggleModule = (moduleId: string) => {
    setExpanded((previous) => ({
      ...previous,
      modules: {
        ...previous.modules,
        [moduleId]: !previous.modules[moduleId],
      },
    }));
  };

  const closeMobileDrawer = () => setMobileOpen(false);
  const reportsActive = isNavigationItemActive(location.pathname, reports);
  const salesActive = location.pathname.startsWith("/sales/");

  const sidebarContent = (
    <aside className={cn("flex h-screen overflow-hidden border-r border-slate-200 bg-white text-slate-700 shadow-[8px_0_28px_rgba(50,56,61,0.05)] transition-[width] duration-300 ease-out", collapsed ? "w-[84px]" : "w-[332px]")}>
      <div className="flex h-full min-h-0 w-full flex-col">
        <div className={cn("shrink-0 border-b border-brand-100", collapsed ? "px-3 py-4" : "px-5 py-5")}>
          <NavLink to="/reports" className="flex min-w-0 flex-col items-center justify-center text-center" aria-label="El Khabiry Pharmacy Back Office">
            <BrandLogo variant={collapsed ? "mark" : "full"} className={cn("shrink-0 bg-white", collapsed ? "h-14 w-14 rounded-xl" : "h-[86px] w-[132px]")} />
            {!collapsed ? (
              <span className="mt-3 flex min-w-0 flex-col items-center text-center">
                <span className="block whitespace-normal text-center text-[15px] font-extrabold leading-[18px] tracking-wide text-slate-950">EL KHABIRY PHARMACY</span>
                <span className="mt-1.5 block whitespace-normal text-center text-xs font-semibold leading-4 text-brand-700">Operations Back Office</span>
                <span className="mt-2 inline-flex rounded-md border border-brand-100 bg-brand-50 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand-700">Internal Management System</span>
              </span>
            ) : null}
          </NavLink>
        </div>

        <nav className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain pb-3 pt-3 scrollbar-soft", collapsed ? "px-3" : "px-4")} aria-label="El Khabiry management navigation">
          <button
            type="button"
            id="reports-trigger"
            aria-expanded={expanded.reports}
            aria-controls="reports-tree"
            title={reports.label}
            onClick={() => {
              if (collapsed) {
                navigate(reports.defaultPath ?? "/reports");
                closeMobileDrawer();
                return;
              }
              toggleReports();
            }}
            className={cn(
              "relative flex h-14 w-full min-w-0 items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
              reportsActive ? "bg-brand-50 text-brand-800" : expanded.reports ? "bg-slate-50 text-slate-800" : "text-slate-600 hover:bg-brand-50/70 hover:text-brand-800",
              collapsed && "mx-auto h-12 w-12 justify-center px-0",
            )}
          >
            {reportsActive ? <span className={cn("absolute left-0 rounded-full bg-brand-500", collapsed ? "top-2 h-8 w-1" : "top-3 h-8 w-1")} /> : null}
            <ReportsIcon className="h-5 w-5 shrink-0 text-current opacity-95" />
            {!collapsed ? <span className="flex-1 truncate">{reports.label}</span> : null}
            {!collapsed ? <ChevronDown className={cn("h-4 w-4 shrink-0 text-current opacity-80 transition", expanded.reports && "rotate-180")} /> : null}
          </button>

          {!collapsed && expanded.reports ? (
            <div id="reports-tree" role="group" aria-labelledby="reports-trigger" className="mt-2 space-y-1.5 border-l border-brand-100 pl-2">
              {reports.children?.map((module) => {
                const Icon = module.icon;
                const active = isNavigationItemActive(location.pathname, module);
                const isOpen = expanded.modules[module.id] ?? false;
                if (module.path && !module.children?.length) {
                  const directActive = location.pathname === module.path;
                  return (
                    <NavLink
                      key={module.id}
                      to={module.path}
                      title={module.label}
                      onClick={closeMobileDrawer}
                      className={() =>
                        cn(
                          "relative flex h-12 w-full min-w-0 items-center gap-3 rounded-lg px-3 text-left text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                          directActive ? "bg-brand-50 font-semibold text-brand-800" : "font-medium text-slate-600 hover:bg-brand-50/70 hover:text-brand-800",
                        )
                      }
                    >
                      {directActive ? <span className="absolute left-0 top-2 h-8 w-1 rounded-full bg-brand-500" /> : null}
                      <Icon className={cn("h-[18px] w-[18px] shrink-0 text-current", directActive ? "opacity-100" : "opacity-80")} />
                      <span className="flex-1 truncate">{module.label}</span>
                    </NavLink>
                  );
                }
                return (
                  <div key={module.id}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`${module.id}-reports`}
                      title={module.label}
                      onClick={() => toggleModule(module.id)}
                      className={cn(
                        "flex h-12 w-full min-w-0 items-center gap-3 rounded-lg px-3 text-left text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                        active || isOpen ? "bg-brand-50 text-brand-800" : "text-slate-600 hover:bg-brand-50/70 hover:text-brand-800",
                      )}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0 text-current opacity-90" />
                      <span className="flex-1 truncate">{module.label}</span>
                      <ChevronDown className={cn("h-4 w-4 shrink-0 text-current opacity-80 transition", isOpen && "rotate-180")} />
                    </button>
                    {isOpen ? (
                      <div id={`${module.id}-reports`} role="group" className="mt-1 space-y-1 border-l border-brand-100 pl-2">
                        {module.children?.map((child) => (
                          <ReportLink key={child.id} item={child} activeRef={activeReportRef} onNavigate={closeMobileDrawer} />
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}

          {!collapsed ? (
            <div className="mt-3 space-y-2">
              {standaloneSections.map((section) => {
                const Icon = section.icon;
                const isOpen = expanded.modules[section.id] ?? isNavigationItemActive(location.pathname, section);
                const active = isNavigationItemActive(location.pathname, section);
                return (
                  <div key={section.id}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`${section.id}-tree`}
                      title={section.label}
                      onClick={() => toggleModule(section.id)}
                      className={cn(
                        "relative flex h-14 w-full min-w-0 items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                        active || isOpen ? "bg-brand-50 text-brand-800" : "text-slate-600 hover:bg-brand-50/70 hover:text-brand-800",
                      )}
                    >
                      {active ? <span className="absolute left-0 top-3 h-8 w-1 rounded-full bg-brand-500" /> : null}
                      <Icon className="h-5 w-5 shrink-0 text-current opacity-95" />
                      <span className="flex-1 truncate">{section.label}</span>
                      <ChevronDown className={cn("h-4 w-4 shrink-0 text-current opacity-80 transition", isOpen && "rotate-180")} />
                    </button>
                    {isOpen ? (
                      <div id={`${section.id}-tree`} role="group" className="mt-2 space-y-1 border-l border-brand-100 pl-2">
                        {section.children?.map((child) => (
                          <ReportLink key={child.id} item={child} activeRef={activeReportRef} onNavigate={closeMobileDrawer} />
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {standaloneSections.map((section) => {
                const Icon = section.icon;
                const active = isNavigationItemActive(location.pathname, section);
                return (
                  <NavLink
                    key={section.id}
                    to={section.defaultPath ?? section.path ?? "/reports"}
                    title={section.label}
                    aria-label={section.label}
                    onClick={closeMobileDrawer}
                    className={cn(
                      "relative mx-auto flex h-12 w-12 items-center justify-center rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                      active ? "bg-brand-50 text-brand-800" : "text-slate-600 hover:bg-brand-50/70 hover:text-brand-800",
                    )}
                  >
                    {active ? <span className="absolute left-0 top-2 h-8 w-1 rounded-full bg-brand-500" /> : null}
                    <Icon className="h-5 w-5" />
                  </NavLink>
                );
              })}
            </div>
          )}

          <button
            type="button"
            id="sales-trigger"
            aria-expanded={expanded.sales}
            aria-controls="sales-tree"
            title="Sales"
            onClick={() => {
              if (collapsed) {
                navigate("/sales/orders");
                closeMobileDrawer();
                return;
              }
              toggleSales();
            }}
            className={cn(
              "relative mt-3 flex h-14 w-full min-w-0 items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
              salesActive ? "bg-brand-50 text-brand-800" : expanded.sales ? "bg-slate-50 text-slate-800" : "text-slate-600 hover:bg-brand-50/70 hover:text-brand-800",
              collapsed && "mx-auto h-12 w-12 justify-center px-0",
            )}
          >
            {salesActive ? <span className={cn("absolute left-0 rounded-full bg-brand-500", collapsed ? "top-2 h-8 w-1" : "top-3 h-8 w-1")} /> : null}
            <ShoppingCart className="h-5 w-5 shrink-0 text-current opacity-95" />
            {!collapsed ? <span className="flex-1 truncate">Sales</span> : null}
            {!collapsed ? <ChevronDown className={cn("h-4 w-4 shrink-0 text-current opacity-80 transition", expanded.sales && "rotate-180")} /> : null}
          </button>

          {!collapsed && expanded.sales ? (
            <div id="sales-tree" role="group" aria-labelledby="sales-trigger" className="mt-2 space-y-1 border-l border-brand-100 pl-2">
              {[
                { label: "Orders", path: "/sales/orders", icon: ShoppingCart },
                { label: "Customers", path: "/sales/customers", icon: UsersRound },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={item.label}
                    onClick={closeMobileDrawer}
                    className={({ isActive }) =>
                      cn(
                        "relative ml-10 mr-1 flex h-10 min-w-0 items-center gap-3 rounded-lg px-3 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                        isActive ? "bg-brand-50 font-semibold text-brand-800" : "text-slate-600 hover:bg-brand-50/70 hover:text-brand-800",
                      )
                    }
                  >
                    {location.pathname === item.path ? <span className="absolute left-0 top-2 h-6 w-1 rounded-full bg-brand-500" /> : null}
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ) : null}
        </nav>

        <div className={cn("shrink-0 border-t border-slate-200 bg-white", collapsed ? "p-3" : "p-4")}>
          <div className={cn("rounded-xl border border-slate-200 bg-slate-50 shadow-sm", collapsed ? "flex flex-col items-center gap-2 p-2.5" : "flex items-center gap-3 p-3")}>
            <div className={cn("flex min-w-0 items-center", collapsed ? "justify-center" : "min-w-0 flex-1 gap-3")}>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">
                AE
              </span>
              {!collapsed ? (
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-slate-900">Ahmed El Khabiry</span>
                  <span className="block truncate text-xs font-medium text-slate-500">System Administrator</span>
                </span>
              ) : null}
            </div>
            {!collapsed ? (
              <Button className="hidden h-8 w-8 shrink-0 rounded-lg border-brand-200 bg-white text-brand-700 shadow-sm hover:border-brand-300 hover:bg-brand-50 lg:inline-flex" variant="ghost" size="icon" onClick={() => setCollapsed(true)} aria-label="Collapse sidebar" title="Collapse Sidebar">
                <ChevronsLeft className="h-4 w-4" />
              </Button>
            ) : (
              <Button className="hidden h-9 w-9 rounded-lg border-brand-200 bg-white text-brand-700 shadow-sm hover:border-brand-300 hover:bg-brand-50 lg:inline-flex" variant="ghost" size="icon" onClick={() => setCollapsed(false)} aria-label="Expand sidebar" title="Expand Sidebar">
                <ChevronsLeft className="h-4 w-4 rotate-180 transition" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      <Button className="fixed left-4 top-4 z-40 lg:hidden" size="icon" variant="primary" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu className="h-5 w-5" /></Button>
      <div className="fixed inset-y-0 left-0 z-40 hidden h-screen overflow-hidden lg:block">{sidebarContent}</div>
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/40" aria-label="Close navigation" onClick={closeMobileDrawer} />
          <div className="absolute inset-y-0 left-0">{sidebarContent}</div>
        </div>
      ) : null}
    </>
  );
}
