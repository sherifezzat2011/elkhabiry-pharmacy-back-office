import type { OrderSource } from "@/data/sales";

export type OperationalSourceType = "Mobile App" | "Website" | "WhatsApp" | "Phone / Call Center" | "In-Store" | "External Partner" | "Manual Entry";
export type OperationalSourceStatus = "Active" | "Inactive";
export type SourceDefaultOrderStatus = "New" | "Pending Review" | "Confirmed";
export type SourceDefaultPaymentMethod = "Not Specified" | "Cash" | "Card" | "Online Payment" | "Insurance";

export type OperationalOrderSource = {
  id: string;
  sourceId: OrderSource;
  name: string;
  type: OperationalSourceType;
  code: string;
  assignedBranches: string[];
  defaultOrderStatus: SourceDefaultOrderStatus;
  defaultPaymentMethod: SourceDefaultPaymentMethod;
  requiresDelivery: boolean;
  status: OperationalSourceStatus;
  description: string;
  ordersToday: number;
  ordersThisMonth: number;
  linkedOrders: number;
  hasExternalIntegration: boolean;
  createdDate: string;
  lastUpdated: string;
  recentOrders: string[];
};

export const orderSourceBranches = [
  "All Branches",
  "Tanta Branch",
  "El Geish Branch",
  "Alexandria Branch",
  "Nasr City Branch",
  "Heliopolis Branch",
  "Maadi Branch",
  "Mansoura Branch",
];

export const orderSourceTypes: OperationalSourceType[] = ["Mobile App", "Website", "WhatsApp", "Phone / Call Center", "In-Store", "External Partner", "Manual Entry"];
export const sourceDefaultOrderStatuses: SourceDefaultOrderStatus[] = ["New", "Pending Review", "Confirmed"];
export const sourceDefaultPaymentMethods: SourceDefaultPaymentMethod[] = ["Not Specified", "Cash", "Card", "Online Payment", "Insurance"];

export const operationalOrderSources: OperationalOrderSource[] = [
  {
    id: "source-app",
    sourceId: "mobile_app",
    name: "El Khabiry Mobile App",
    type: "Mobile App",
    code: "APP",
    assignedBranches: ["All Branches"],
    defaultOrderStatus: "New",
    defaultPaymentMethod: "Online Payment",
    requiresDelivery: true,
    status: "Active",
    description: "Patient orders placed through the El Khabiry mobile application.",
    ordersToday: 178,
    ordersThisMonth: 3840,
    linkedOrders: 12400,
    hasExternalIntegration: true,
    createdDate: "2026-01-12",
    lastUpdated: "2026-07-24",
    recentOrders: ["SO-2026-3184 - Ahmed Mohamed", "SO-2026-3179 - Sara Ali", "SO-2026-3172 - Omar Khaled"],
  },
  {
    id: "source-web",
    sourceId: "website",
    name: "El Khabiry Website",
    type: "Website",
    code: "WEB",
    assignedBranches: ["All Branches"],
    defaultOrderStatus: "New",
    defaultPaymentMethod: "Online Payment",
    requiresDelivery: true,
    status: "Active",
    description: "Orders placed through the pharmacy website.",
    ordersToday: 64,
    ordersThisMonth: 1420,
    linkedOrders: 6080,
    hasExternalIntegration: true,
    createdDate: "2026-01-12",
    lastUpdated: "2026-07-22",
    recentOrders: ["SO-2026-3181 - Mona Hassan", "SO-2026-3166 - Laila Amin", "SO-2026-3158 - Hany Fouad"],
  },
  {
    id: "source-whatsapp",
    sourceId: "whatsapp",
    name: "WhatsApp Orders",
    type: "WhatsApp",
    code: "WA",
    assignedBranches: ["Tanta Branch", "El Geish Branch"],
    defaultOrderStatus: "Pending Review",
    defaultPaymentMethod: "Cash",
    requiresDelivery: true,
    status: "Active",
    description: "Orders received by branch staff over WhatsApp.",
    ordersToday: 38,
    ordersThisMonth: 920,
    linkedOrders: 2720,
    hasExternalIntegration: false,
    createdDate: "2026-02-05",
    lastUpdated: "2026-07-21",
    recentOrders: ["SO-2026-3176 - Yasmin Samir", "SO-2026-3161 - Mahmoud Ali", "SO-2026-3144 - Reem Said"],
  },
  {
    id: "source-call",
    sourceId: "call_center",
    name: "Call Center",
    type: "Phone / Call Center",
    code: "CALL",
    assignedBranches: ["All Branches"],
    defaultOrderStatus: "Pending Review",
    defaultPaymentMethod: "Not Specified",
    requiresDelivery: true,
    status: "Active",
    description: "Orders entered by call center operators after patient calls.",
    ordersToday: 22,
    ordersThisMonth: 610,
    linkedOrders: 3580,
    hasExternalIntegration: false,
    createdDate: "2026-01-20",
    lastUpdated: "2026-07-20",
    recentOrders: ["SO-2026-3169 - Youssef Kamal", "SO-2026-3151 - Aya Sherif", "SO-2026-3139 - Sherif Adel"],
  },
  {
    id: "source-store",
    sourceId: "walk_in",
    name: "Walk-In Orders",
    type: "In-Store",
    code: "STORE",
    assignedBranches: ["All Branches"],
    defaultOrderStatus: "Confirmed",
    defaultPaymentMethod: "Cash",
    requiresDelivery: false,
    status: "Active",
    description: "Orders created directly at the pharmacy counter.",
    ordersToday: 10,
    ordersThisMonth: 480,
    linkedOrders: 8900,
    hasExternalIntegration: false,
    createdDate: "2026-01-10",
    lastUpdated: "2026-07-19",
    recentOrders: ["SO-2026-3185 - Branch Counter", "SO-2026-3180 - Branch Counter", "SO-2026-3174 - Branch Counter"],
  },
  {
    id: "source-partner",
    sourceId: "talabat",
    name: "Marketplace Partner",
    type: "External Partner",
    code: "PARTNER",
    assignedBranches: ["Alexandria Branch", "Nasr City Branch"],
    defaultOrderStatus: "Pending Review",
    defaultPaymentMethod: "Online Payment",
    requiresDelivery: true,
    status: "Inactive",
    description: "External marketplace pilot source for selected branches.",
    ordersToday: 0,
    ordersThisMonth: 85,
    linkedOrders: 210,
    hasExternalIntegration: true,
    createdDate: "2026-05-18",
    lastUpdated: "2026-07-18",
    recentOrders: ["SO-2026-2998 - Marketplace", "SO-2026-2984 - Marketplace"],
  },
];

export function sourceAvailableForBranch(source: OperationalOrderSource, branch: string) {
  return source.status === "Active" && (source.assignedBranches.includes("All Branches") || source.assignedBranches.includes(branch));
}
