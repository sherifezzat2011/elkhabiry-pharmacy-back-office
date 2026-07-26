import {
  BarChart3,
  BadgeDollarSign,
  Boxes,
  CalendarClock,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  ChartPie,
  ClipboardPlus,
  LineChart,
  MapPinned,
  PackageSearch,
  Repeat2,
  PackageCheck,
  ShoppingBag,
  ShoppingCart,
  Stethoscope,
  TrendingUp,
  TriangleAlert,
  Truck,
  Trophy,
  UserPlus,
  UsersRound,
  Warehouse,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { slugify } from "@/lib/utils";

export type NavigationItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  path?: string;
  defaultPath?: string;
  section?: string;
  reportTitle?: string;
  children?: NavigationItem[];
};

type ModuleConfig = {
  id: string;
  label: string;
  routeSegment: string;
  icon: LucideIcon;
  visibleReports: { label: string; icon: LucideIcon }[];
  allReports: string[];
};

const moduleConfigs: ModuleConfig[] = [
  {
    id: "sales",
    label: "Sales",
    routeSegment: "sales",
    icon: TrendingUp,
    visibleReports: [
      { label: "Product Performance", icon: ChartNoAxesColumnIncreasing },
      { label: "Sales Concentration", icon: ChartPie },
      { label: "Orders By Area", icon: MapPinned },
      { label: "Orders Analysis", icon: CalendarDays },
    ],
    allReports: ["Product Performance", "Sales Concentration", "Orders By Area", "Orders Analysis"],
  },
  {
    id: "inventory",
    label: "Inventory",
    routeSegment: "inventory",
    icon: Warehouse,
    visibleReports: [
      { label: "Stock Health", icon: Boxes },
      { label: "Inventory Value", icon: BadgeDollarSign },
      { label: "Warehouse Distribution", icon: Warehouse },
      { label: "Movement Trends", icon: LineChart },
      { label: "Stock Availability", icon: TriangleAlert },
      { label: "Near Expiry", icon: CalendarClock },
      { label: "Reorder Planning", icon: ClipboardPlus },
    ],
    allReports: [
      "Stock Health",
      "Inventory Value",
      "Warehouse Distribution",
      "Movement Trends",
      "Stock Availability",
      "Near Expiry",
      "Reorder Planning",
    ],
  },
  {
    id: "customers",
    label: "Customers",
    routeSegment: "customers",
    icon: UsersRound,
    visibleReports: [
      { label: "Customer Acquisition", icon: UserPlus },
      { label: "Repeat Behavior", icon: Repeat2 },
      { label: "Inactivity", icon: TriangleAlert },
      { label: "Customer Value", icon: BadgeDollarSign },
      { label: "Customer Segmentation", icon: UsersRound },
      { label: "VIP Customers", icon: Trophy },
      { label: "Purchase Frequency", icon: CalendarDays },
    ],
    allReports: [
      "Customer Acquisition",
      "Repeat Behavior",
      "Inactivity",
      "Customer Value",
      "Customer Segmentation",
      "VIP Customers",
      "Purchase Frequency",
    ],
  },
  {
    id: "prescriptions",
    label: "Prescriptions",
    routeSegment: "prescriptions",
    icon: ClipboardPlus,
    visibleReports: [
      { label: "Prescription Trends", icon: LineChart },
      { label: "Dispensing Performance", icon: ChartNoAxesColumnIncreasing },
      { label: "Completion Rate", icon: ChartPie },
      { label: "Prescription Status", icon: ClipboardPlus },
      { label: "Prescription Fulfillment", icon: Boxes },
      { label: "Doctor Prescription Volume", icon: Stethoscope },
    ],
    allReports: [
      "Prescription Trends",
      "Dispensing Performance",
      "Completion Rate",
      "Prescription Status",
      "Prescription Fulfillment",
      "Doctor Prescription Volume",
    ],
  },
  {
    id: "doctors",
    label: "Doctor Insights",
    routeSegment: "doctors",
    icon: Stethoscope,
    visibleReports: [
      { label: "Doctor Performance", icon: ChartNoAxesColumnIncreasing },
      { label: "Prescription Volume", icon: ClipboardPlus },
      { label: "Revenue Contribution", icon: BadgeDollarSign },
      { label: "Specialty Analysis", icon: ChartPie },
      { label: "Product Preference", icon: PackageSearch },
      { label: "Doctor Ranking", icon: Trophy },
    ],
    allReports: ["Doctor Performance", "Prescription Volume", "Revenue Contribution", "Specialty Analysis", "Product Preference", "Doctor Ranking"],
  },
];

const demoModuleConfigs: ModuleConfig[] = [
  {
    id: "catalog",
    label: "Catalog",
    routeSegment: "catalog",
    icon: PackageSearch,
    visibleReports: [
      { label: "Categories", icon: ChartPie },
      { label: "Products", icon: PackageSearch },
      { label: "Brands", icon: BadgeDollarSign },
    ],
    allReports: ["Categories", "Products", "Brands"],
  },
  {
    id: "promotions",
    label: "Promotions",
    routeSegment: "promotions",
    icon: BadgeDollarSign,
    visibleReports: [
      { label: "Offers", icon: BadgeDollarSign },
      { label: "Promo Codes", icon: BadgeDollarSign },
    ],
    allReports: ["Offers", "Promo Codes"],
  },
  {
    id: "delivery",
    label: "Delivery Operations",
    routeSegment: "delivery",
    icon: Truck,
    visibleReports: [
      { label: "Local Delivery", icon: Truck },
      { label: "Delivery Pricing", icon: BadgeDollarSign },
      { label: "Delivery Channels", icon: ChartPie },
      { label: "Delivery Zones", icon: MapPinned },
    ],
    allReports: ["Local Delivery", "Delivery Pricing", "Delivery Channels", "Delivery Zones"],
  },
  {
    id: "suppliers",
    label: "Suppliers",
    routeSegment: "suppliers",
    icon: Truck,
    visibleReports: [
      { label: "Supplier List", icon: Truck },
      { label: "Purchase Orders", icon: ShoppingCart },
      { label: "Goods Receiving", icon: PackageCheck },
      { label: "Supplier Performance", icon: ChartNoAxesColumnIncreasing },
      { label: "Purchase Volume", icon: Boxes },
      { label: "Delivery Performance", icon: Truck },
      { label: "Supplier Ranking", icon: Trophy },
    ],
    allReports: ["Supplier List", "Purchase Orders", "Goods Receiving", "Supplier Performance", "Purchase Volume", "Delivery Performance", "Supplier Ranking"],
  },
];

function reportPath(module: ModuleConfig, report: string) {
  if (module.id === "catalog") return `/${module.routeSegment}/${slugify(report)}`;
  if (module.id === "suppliers") {
    const supplierSegments: Record<string, string> = {
      "Supplier List": "",
      "Purchase Orders": "purchase-orders",
      "Goods Receiving": "goods-receiving",
    };
    if (report in supplierSegments) return `/suppliers${supplierSegments[report] ? `/${supplierSegments[report]}` : ""}`;
    return `/reports/suppliers/${slugify(report)}`;
  }
  if (module.id === "delivery") {
    const deliverySegments: Record<string, string> = {
      "Local Delivery": "local-delivery",
      "Delivery Pricing": "pricing",
      "Delivery Channels": "channels",
      "Delivery Zones": "zones",
    };
    return `/${module.routeSegment}/${deliverySegments[report] ?? slugify(report)}`;
  }
  return `/reports/${module.routeSegment}/${slugify(report)}`;
}

function moduleNavigation(module: ModuleConfig): NavigationItem {
  return {
    id: module.id,
    label: module.label,
    icon: module.icon,
    defaultPath: reportPath(module, module.visibleReports[0].label),
    children: module.visibleReports.map((report) => ({
      id: `${module.id}-${slugify(report.label)}`,
      label: report.label,
      icon: report.icon,
      path: reportPath(module, report.label),
      section: module.label,
      reportTitle: report.label,
    })),
  };
}

export const reportNavigation: NavigationItem[] = moduleConfigs.map(moduleNavigation);

export const sidebarNavigation: NavigationItem[] = [
  {
    id: "reports",
    label: "Reports",
    icon: BarChart3,
    defaultPath: "/reports/sales-overview",
    children: [
      {
        id: "reports-sales-overview",
        label: "Sales Overview",
        icon: ChartNoAxesColumnIncreasing,
        path: "/reports/sales-overview",
      },
      {
        id: "reports-order-sources",
        label: "Order Sources",
        icon: ChartPie,
        path: "/reports/order-sources",
      },
      ...reportNavigation,
    ],
  },
  {
    id: "order-sources",
    label: "Order Sources",
    icon: ShoppingBag,
    path: "/order-sources",
  },
  ...demoModuleConfigs.map(moduleNavigation),
];

export const visibleReportRoutes = [...moduleConfigs, ...demoModuleConfigs].flatMap((module) =>
  module.visibleReports.map((report) => ({
    section: module.label,
    title: report.label,
    path: reportPath(module, report.label),
  })),
);

export const allReportRoutes = [...moduleConfigs, ...demoModuleConfigs].flatMap((module) =>
  module.allReports.map((report) => ({
    section: module.label,
    title: report,
    path: reportPath(module, report),
  })),
);

export const legacyReportRedirects = [...moduleConfigs, ...demoModuleConfigs].flatMap((module) =>
  module.allReports.map((report) => {
    const legacySegment = module.id === "doctors" ? "doctor-insights" : module.routeSegment;
    return {
      from: `/${legacySegment}/${slugify(report)}`,
      to: reportPath(module, report),
    };
  }),
);

legacyReportRedirects.push({
  from: "/reports/sales/orders-by-day",
  to: "/reports/sales/orders-analysis?view=weekday",
});

legacyReportRedirects.push({
  from: "/reports/sales/orders-by-weekday",
  to: "/reports/sales/orders-analysis?view=weekday",
});

legacyReportRedirects.push({
  from: "/reports/inventory/low-stock",
  to: "/reports/inventory/stock-availability",
});

legacyReportRedirects.push({
  from: "/reports/inventory/out-of-stock",
  to: "/reports/inventory/stock-availability",
});

legacyReportRedirects.push({
  from: "/inventory/low-stock",
  to: "/reports/inventory/stock-availability",
});

legacyReportRedirects.push({
  from: "/inventory/out-of-stock",
  to: "/reports/inventory/stock-availability",
});

[
  ["value-bands", "/reports/customers/customer-value"],
  ["cohorts", "/reports/customers/customer-segmentation"],
  ["geography", "/reports/customers/customer-acquisition"],
  ["store-affinity", "/reports/customers/customer-acquisition"],
  ["customer-lifetime-value", "/reports/customers/customer-value"],
  ["retention-analysis", "/reports/customers/repeat-behavior"],
  ["churn-analysis", "/reports/customers/inactivity"],
  ["loyalty-performance", "/reports/customers/vip-customers"],
  ["chronic-patients", "/reports/customers/customer-segmentation"],
].forEach(([segment, to]) => legacyReportRedirects.push({ from: `/reports/customers/${segment}`, to }));

[
  ["generic-substitution", "/reports/prescriptions/prescription-fulfillment"],
  ["prescription-value", "/reports/prescriptions/prescription-trends"],
  ["prescription-categories", "/reports/prescriptions/prescription-trends"],
  ["branch-prescription-analysis", "/reports/prescriptions/prescription-trends"],
].forEach(([segment, to]) => legacyReportRedirects.push({ from: `/reports/prescriptions/${segment}`, to }));

[
  ["branch-coverage", "/reports/doctors/doctor-performance"],
  ["fulfillment-performance", "/reports/doctors/doctor-performance"],
  ["engagement-analysis", "/reports/doctors/doctor-ranking"],
  ["doctor-growth", "/reports/doctors/prescription-volume"],
].forEach(([segment, to]) => legacyReportRedirects.push({ from: `/reports/doctors/${segment}`, to }));

[
  "product-performance",
  "product-ranking",
  "product-growth",
  "product-decline",
  "product-margin-analysis",
  "product-lifecycle",
  "product-category-analysis",
  "product-availability",
  "product-stock-coverage",
  "product-expiry-risk",
  "top-revenue-products",
  "top-quantity-products",
  "slow-moving-products",
  "fast-moving-products",
  "product-opportunity-analysis",
].forEach((segment) => {
  legacyReportRedirects.push({
    from: `/reports/products/${segment}`,
    to: "/catalog/products",
  });
});

["categories", "products", "brands"].forEach((segment) => {
  legacyReportRedirects.push({
    from: `/reports/catalog/${segment}`,
    to: `/catalog/${segment}`,
  });
});

[
  ["local-delivery", "/delivery/local-delivery"],
  ["pricing", "/delivery/pricing"],
  ["delivery-pricing", "/delivery/pricing"],
  ["methods", "/delivery/channels"],
  ["delivery-channels", "/delivery/channels"],
  ["geo-fencing", "/delivery/zones"],
  ["delivery-zones", "/delivery/zones"],
].forEach(([segment, to]) => {
  legacyReportRedirects.push({ from: `/reports/shipping/${segment}`, to });
  legacyReportRedirects.push({ from: `/shipping/${segment}`, to });
});

[
  ["fill-rate-analysis", "/reports/suppliers/supplier-performance"],
  ["lead-time-analysis", "/reports/suppliers/delivery-performance"],
  ["supplier-risk-analysis", "/reports/suppliers/supplier-performance"],
  ["supplier-dependence", "/reports/suppliers/supplier-performance"],
  ["supplier-cost-analysis", "/reports/suppliers/purchase-volume"],
  ["purchase-trends", "/reports/suppliers/purchase-volume"],
].forEach(([segment, to]) => {
  legacyReportRedirects.push({ from: `/reports/suppliers/${segment}`, to });
  legacyReportRedirects.push({ from: `/suppliers/${segment}`, to });
});

export function findActiveModule(pathname: string) {
  return [...moduleConfigs, ...demoModuleConfigs].find((module) => {
    if (module.id === "catalog" || module.id === "delivery") return pathname.startsWith(`/${module.routeSegment}/`);
    if (module.id === "suppliers") return pathname === "/suppliers" || pathname.startsWith("/suppliers/") || pathname.startsWith("/reports/suppliers/");
    return pathname.startsWith(`/reports/${module.routeSegment}/`);
  })?.id;
}

export function isNavigationItemActive(pathname: string, item: NavigationItem): boolean {
  if (item.path === pathname) return true;
  return item.children?.some((child) => isNavigationItemActive(pathname, child)) ?? false;
}
