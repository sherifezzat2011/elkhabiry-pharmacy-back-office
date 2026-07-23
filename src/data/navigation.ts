import {
  BarChart3,
  Boxes,
  BriefcaseMedical,
  ClipboardPlus,
  LayoutDashboard,
  PackageSearch,
  Stethoscope,
  Truck,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { slugify } from "@/lib/utils";

export type NavGroup = {
  label: string;
  icon: LucideIcon;
  path: string;
  children?: string[];
};

export const navigation: NavGroup[] = [
  { label: "Overview", icon: LayoutDashboard, path: "/" },
  {
    label: "Sales",
    icon: BarChart3,
    path: "/sales/product-performance",
    children: [
      "Product Performance",
      "Sales By Branch",
      "Sales By Category",
      "Revenue Trends",
      "Sales vs Target",
      "Orders Analysis",
      "Orders By Hour",
    ],
  },
  {
    label: "Inventory",
    icon: Boxes,
    path: "/inventory/stock-health",
    children: [
      "Stock Health",
      "Warehouse Distribution",
      "Reservation Pressure",
      "Movement Trends",
      "Stock Availability",
      "Near Expiry",
      "Expired Products",
      "Dead Stock",
      "Overstock Analysis",
      "Inventory Value",
      "Reorder Planning",
      "Supplier Stock Dependency",
      "Batch Tracking",
      "Inventory Aging",
      "Inventory Forecast",
    ],
  },
  {
    label: "Products",
    icon: PackageSearch,
    path: "/products/product-performance",
    children: [
      "Product Performance",
      "Product Ranking",
      "Product Growth",
      "Product Decline",
      "Product Margin Analysis",
      "Product Lifecycle",
      "Product Category Analysis",
      "Product Availability",
      "Product Stock Coverage",
      "Product Expiry Risk",
      "Top Revenue Products",
      "Top Quantity Products",
      "Slow Moving Products",
      "Fast Moving Products",
      "Product Opportunity Analysis",
    ],
  },
  {
    label: "Customers",
    icon: UsersRound,
    path: "/customers/customer-acquisition",
    children: [
      "Customer Acquisition",
      "Repeat Behavior",
      "Inactivity",
      "Value Bands",
      "Cohorts",
      "Geography",
      "Store Affinity",
      "Customer Lifetime Value",
      "Customer Segmentation",
      "Retention Analysis",
      "Churn Analysis",
      "Loyalty Performance",
      "VIP Customers",
      "Chronic Patients",
      "Purchase Frequency",
    ],
  },
  {
    label: "Suppliers",
    icon: Truck,
    path: "/suppliers/supplier-performance",
    children: [
      "Supplier Performance",
      "Purchase Volume",
      "Fill Rate Analysis",
      "Delivery Performance",
      "Lead Time Analysis",
      "Supplier Ranking",
      "Supplier Risk Analysis",
      "Supplier Dependence",
      "Supplier Cost Analysis",
      "Purchase Trends",
    ],
  },
  {
    label: "Prescriptions",
    icon: ClipboardPlus,
    path: "/prescriptions/prescription-trends",
    children: [
      "Prescription Trends",
      "Dispensing Performance",
      "Completion Rate",
      "Generic Substitution",
      "Prescription Value",
      "Prescription Categories",
      "Prescription Status",
      "Prescription Fulfillment",
      "Doctor Prescription Volume",
      "Branch Prescription Analysis",
    ],
  },
  {
    label: "Doctor Insights",
    icon: Stethoscope,
    path: "/doctor-insights/doctor-performance",
    children: [
      "Doctor Performance",
      "Prescription Volume",
      "Revenue Contribution",
      "Specialty Analysis",
      "Product Preference",
      "Branch Coverage",
      "Fulfillment Performance",
      "Engagement Analysis",
      "Doctor Growth",
      "Doctor Ranking",
    ],
  },
  { label: "Executive Brief", icon: BriefcaseMedical, path: "/brief" },
];

export const reportRoutes = navigation
  .filter((item) => item.children)
  .flatMap((item) =>
    item.children!.map((child) => ({
      section: item.label,
      title: child,
      path: `/${slugify(item.label)}/${slugify(child)}`,
    })),
  );
