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
      "Customer Value",
      "Customer Segmentation",
      "VIP Customers",
      "Purchase Frequency",
    ],
  },
  {
    label: "Suppliers",
    icon: Truck,
    path: "/suppliers",
    children: [
      "Supplier List",
      "Purchase Orders",
      "Goods Receiving",
      "Supplier Performance",
      "Purchase Volume",
      "Delivery Performance",
      "Supplier Ranking",
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
      "Prescription Status",
      "Prescription Fulfillment",
      "Doctor Prescription Volume",
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
