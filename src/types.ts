export type Branch = {
  id: string;
  name: string;
  city: string;
  area: string;
};

export type Supplier = {
  id: string;
  name: string;
  country: string;
  reliability: number;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  supplierId: string;
  price: number;
  cost: number;
  chronic: boolean;
};

export type Customer = {
  id: string;
  name: string;
  type: "Walk-in" | "Family" | "VIP" | "Chronic Patient" | "Corporate";
  city: string;
  preferredBranchId: string;
};

export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  city: string;
};

export type Order = {
  id: string;
  date: string;
  hour: number;
  branchId: string;
  customerId: string;
  channel: "In Store" | "Delivery" | "Mobile App" | "Insurance";
  paymentMethod: "Cash" | "Card" | "Wallet" | "Insurance";
  items: OrderItem[];
};

export type OrderItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
};

export type InventoryBatch = {
  id: string;
  productId: string;
  branchId: string;
  supplierId: string;
  quantity: number;
  reserved: number;
  reorderPoint: number;
  expiryDate: string;
  receivedDate: string;
};

export type Prescription = {
  id: string;
  date: string;
  doctorId: string;
  customerId: string;
  branchId: string;
  status: "Completed" | "Partial" | "Pending" | "Cancelled";
  productIds: string[];
  value: number;
};

export type MonthlyTarget = {
  month: string;
  branchId: string;
  target: number;
};

export type FilterState = {
  dateFrom: string;
  dateTo: string;
  branch: string;
  city: string;
  area: string;
  category: string;
  product: string;
  supplier: string;
  customerType: string;
  prescriptionStatus: string;
  doctorSpecialty: string;
  inventoryMovementGranularity: "Weekly" | "Monthly" | "Quarterly";
};

export type Kpi = {
  label: string;
  value: string;
  delta: string;
  tone: "green" | "blue" | "purple" | "orange" | "red";
};

export type ChartDatum = {
  name: string;
  value: number;
  secondary?: number;
  tertiary?: number;
};

export type TableRow = Record<string, string | number>;

export type ReportResult = {
  title: string;
  description: string;
  mainChartTitle?: string;
  supportATitle?: string;
  supportBTitle?: string;
  tableTitle?: string;
  nextAction?: string;
  kpis: Kpi[];
  mainChart: ChartDatum[];
  supportA: ChartDatum[];
  supportB: ChartDatum[];
  supportC?: ChartDatum[];
  supportD?: ChartDatum[];
  table: TableRow[];
  alerts: string[];
};
