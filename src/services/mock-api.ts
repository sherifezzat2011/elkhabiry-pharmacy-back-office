import { endOfWeek, format, getDay, parseISO, startOfWeek } from "date-fns";
import { branches, customers, dimensions, doctors, inventoryBatches, monthlyTargets, orders, prescriptions, products, suppliers } from "@/services/mock-data";
import type { ChartDatum, FilterState, ReportResult, TableRow } from "@/types";
import { formatCompactCurrency, formatCurrency, formatNumber, formatPercent, formatSharePercent, formatShortCurrency } from "@/lib/utils";

const productById = new Map(products.map((product) => [product.id, product]));
const branchById = new Map(branches.map((branch) => [branch.id, branch]));
const customerById = new Map(customers.map((customer) => [customer.id, customer]));
const supplierById = new Map(suppliers.map((supplier) => [supplier.id, supplier]));
const doctorById = new Map(doctors.map((doctor) => [doctor.id, doctor]));

export type OrdersByDayMode = "weekday" | "daily" | "today" | "weekly";

function withinDates(date: string, filters: FilterState) {
  return date >= filters.dateFrom && date <= filters.dateTo;
}

function orderMatches(order: (typeof orders)[number], filters: FilterState) {
  const branch = branchById.get(order.branchId);
  const customer = customerById.get(order.customerId);
  const itemProducts = order.items.map((item) => productById.get(item.productId)).filter(Boolean);
  return (
    withinDates(order.date, filters) &&
    (filters.branch === "All" || order.branchId === filters.branch) &&
    (filters.city === "All" || branch?.city === filters.city) &&
    (filters.customerType === "All" || customer?.type === filters.customerType) &&
    (filters.category === "All" || itemProducts.some((product) => product?.category === filters.category)) &&
    (filters.product === "All" || itemProducts.some((product) => product?.id === filters.product)) &&
    (filters.supplier === "All" || itemProducts.some((product) => product?.supplierId === filters.supplier))
  );
}

function prescriptionMatches(rx: (typeof prescriptions)[number], filters: FilterState) {
  const branch = branchById.get(rx.branchId);
  const doctor = doctorById.get(rx.doctorId);
  const customer = customerById.get(rx.customerId);
  const rxProducts = rx.productIds.map((id) => productById.get(id)).filter(Boolean);
  return (
    withinDates(rx.date, filters) &&
    (filters.branch === "All" || rx.branchId === filters.branch) &&
    (filters.city === "All" || branch?.city === filters.city) &&
    (filters.prescriptionStatus === "All" || rx.status === filters.prescriptionStatus) &&
    (filters.doctorSpecialty === "All" || doctor?.specialty === filters.doctorSpecialty) &&
    (filters.customerType === "All" || customer?.type === filters.customerType) &&
    (filters.category === "All" || rxProducts.some((product) => product?.category === filters.category)) &&
    (filters.product === "All" || rx.productIds.includes(filters.product)) &&
    (filters.supplier === "All" || rxProducts.some((product) => product?.supplierId === filters.supplier))
  );
}

function filteredOrders(filters: FilterState) {
  return orders.filter((order) => orderMatches(order, filters));
}

function filteredPrescriptions(filters: FilterState) {
  return prescriptions.filter((rx) => prescriptionMatches(rx, filters));
}

function filteredInventory(filters: FilterState) {
  return inventoryBatches.filter((batch) => {
    const product = productById.get(batch.productId);
    const branch = branchById.get(batch.branchId);
    return (
      (filters.branch === "All" || batch.branchId === filters.branch) &&
      (filters.city === "All" || branch?.city === filters.city) &&
      (filters.category === "All" || product?.category === filters.category) &&
      (filters.product === "All" || product?.id === filters.product) &&
      (filters.supplier === "All" || product?.supplierId === filters.supplier)
    );
  });
}

function totals(sourceOrders: ReturnType<typeof filteredOrders>) {
  return sourceOrders.reduce(
    (acc, order) => {
      order.items.forEach((item) => {
        acc.revenue += item.quantity * item.unitPrice;
        acc.cost += item.quantity * item.unitCost;
        acc.units += item.quantity;
      });
      return acc;
    },
    { revenue: 0, cost: 0, units: 0 },
  );
}

function topGroups(rows: { name: string; value: number; secondary?: number }[], limit = 8): ChartDatum[] {
  const map = new Map<string, { value: number; secondary: number }>();
  rows.forEach((row) => {
    const next = map.get(row.name) ?? { value: 0, secondary: 0 };
    next.value += row.value;
    next.secondary += row.secondary ?? 0;
    map.set(row.name, next);
  });
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

function trend(sourceOrders: ReturnType<typeof filteredOrders>): ChartDatum[] {
  return topGroups(
    sourceOrders.map((order) => {
      const total = order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      return { name: format(parseISO(order.date), "MMM d"), value: total, secondary: order.items.length };
    }),
    14,
  ).sort((a, b) => new Date(`${a.name} 2026`).getTime() - new Date(`${b.name} 2026`).getTime());
}

function tableFromProducts(sourceOrders: ReturnType<typeof filteredOrders>): TableRow[] {
  const rows = sourceOrders.flatMap((order) =>
    order.items.map((item) => {
      const product = productById.get(item.productId)!;
      return {
        name: product.name,
        category: product.category,
        supplier: supplierById.get(product.supplierId)?.name ?? "",
        value: item.quantity * item.unitPrice,
        secondary: item.quantity,
      };
    }),
  );
  return topGroups(rows, 20).map((row, index) => ({
    rank: index + 1,
    product: row.name,
    revenue: Math.round(row.value),
    units: Math.round(row.secondary ?? 0),
    margin: `${(31 + (index % 9) * 2.3).toFixed(1)}%`,
  }));
}

type ProductMetric = {
  id: string;
  name: string;
  category: string;
  revenue: number;
  cost: number;
  units: number;
  orderIds: Set<string>;
};

function productTable(metrics: ProductMetric[]): TableRow[] {
  return metrics.map((metric, index) => {
    const profit = metric.revenue - metric.cost;
    const stock = inventoryBatches.filter((batch) => batch.productId === metric.id).reduce((sum, batch) => sum + batch.quantity, 0);
    const dailyUnits = metric.units / 181;
    const stockDays = Math.round(stock / Math.max(1, dailyUnits));
    const growth = 18 - index * 0.9;
    const status = stockDays < 15 ? "Reorder Needed" : stockDays < 30 ? "Low Stock" : index < 8 ? "Star Product" : growth > 8 ? "Growing" : metric.units < 30 ? "Slow Moving" : "Stable";
    return {
      product: metric.name,
      category: metric.category,
      revenue: Math.round(metric.revenue),
      grossProfit: Math.round(profit),
      "margin %": `${((profit / Math.max(1, metric.revenue)) * 100).toFixed(1)}%`,
      unitsSold: metric.units,
      stockDays,
      status,
    };
  });
}

function salesRows(sourceOrders: ReturnType<typeof filteredOrders>) {
  return sourceOrders.flatMap((order) =>
    order.items.map((item) => {
      const product = productById.get(item.productId)!;
      const revenue = item.quantity * item.unitPrice;
      const cost = item.quantity * item.unitCost;
      return { order, product, revenue, cost, units: item.quantity };
    }),
  );
}

const geoCities = [
  { id: "Cairo", name: "Cairo" },
  { id: "Giza", name: "Giza" },
  { id: "Alexandria", name: "Alexandria" },
  { id: "Tanta", name: "Tanta" },
];

const egyptAreas = [
  { id: "nasr-city", cityId: "Cairo", city: "Cairo", area: "Nasr City" },
  { id: "heliopolis", cityId: "Cairo", city: "Cairo", area: "Heliopolis" },
  { id: "maadi", cityId: "Cairo", city: "Cairo", area: "Maadi" },
  { id: "downtown", cityId: "Cairo", city: "Cairo", area: "Downtown" },
  { id: "new-cairo", cityId: "Cairo", city: "Cairo", area: "New Cairo" },
  { id: "shubra", cityId: "Cairo", city: "Cairo", area: "Shubra" },
  { id: "dokki", cityId: "Giza", city: "Giza", area: "Dokki" },
  { id: "mohandessin", cityId: "Giza", city: "Giza", area: "Mohandessin" },
  { id: "haram", cityId: "Giza", city: "Giza", area: "Haram" },
  { id: "sheikh-zayed", cityId: "Giza", city: "Giza", area: "Sheikh Zayed" },
  { id: "6th-of-october", cityId: "Giza", city: "Giza", area: "6th of October" },
  { id: "smouha", cityId: "Alexandria", city: "Alexandria", area: "Smouha" },
  { id: "sidi-gaber", cityId: "Alexandria", city: "Alexandria", area: "Sidi Gaber" },
  { id: "miami", cityId: "Alexandria", city: "Alexandria", area: "Miami" },
  { id: "louran", cityId: "Alexandria", city: "Alexandria", area: "Louran" },
  { id: "gleem", cityId: "Alexandria", city: "Alexandria", area: "Gleem" },
  { id: "stanley", cityId: "Alexandria", city: "Alexandria", area: "Stanley" },
  { id: "el-galaa", cityId: "Tanta", city: "Tanta", area: "El Galaa" },
  { id: "el-bahr", cityId: "Tanta", city: "Tanta", area: "El Bahr" },
  { id: "stadium-area", cityId: "Tanta", city: "Tanta", area: "Stadium Area" },
];

function areaForOrder(orderId: string) {
  const index = Number(orderId.replace("o", "")) - 1;
  return egyptAreas[index % egyptAreas.length];
}

function cityNameById(cityId: string) {
  return geoCities.find((city) => city.id === cityId)?.name;
}

function areaNameById(areaId: string) {
  return egyptAreas.find((area) => area.id === areaId)?.area;
}

function areaRevenueMultiplier(area: string) {
  const multipliers: Record<string, number> = {
    "Nasr City": 1.62,
    Heliopolis: 1.78,
    Maadi: 1.42,
    "New Cairo": 1.88,
    Downtown: 1.18,
    Shubra: 1.24,
    Dokki: 1.35,
    Mohandessin: 1.48,
    Haram: 1.16,
    "Sheikh Zayed": 1.76,
    "6th of October": 1.55,
    Smouha: 1.52,
    "Sidi Gaber": 1.38,
    Miami: 1.28,
    Louran: 1.32,
    Gleem: 1.44,
    Stanley: 1.7,
    "El Galaa": 1.14,
    "El Bahr": 1.2,
    "Stadium Area": 1.1,
  };
  return multipliers[area] ?? 1.25;
}

function geographyStatus(revenueShare: number) {
  if (revenueShare >= 25) {
    return "Leader";
  }
  if (revenueShare >= 15) {
    return "Strong";
  }
  if (revenueShare >= 10) {
    return "Stable";
  }
  return "Opportunity";
}

function weekdayStatus(orderShare: number) {
  if (orderShare >= 17) {
    return "Peak";
  }
  if (orderShare >= 15) {
    return "Strong";
  }
  if (orderShare >= 12) {
    return "Normal";
  }
  return "Low Demand";
}

function buildStockHealthReport(filters: FilterState): ReportResult {
  const scopedInventory = filteredInventory(filters);
  const referenceDate = parseISO("2026-07-20");
  const nearExpiryCutoff = new Date(referenceDate.getTime() + 30 * 86_400_000);
  const productHealth = products
    .filter((product) => filters.category === "All" || product.category === filters.category)
    .map((product) => {
      const batches = scopedInventory.filter((batch) => batch.productId === product.id);
      const quantity = batches.reduce((sum, batch) => sum + batch.quantity, 0);
      const reorderPoint = batches.reduce((sum, batch) => sum + batch.reorderPoint, 0);
      const nearExpiry = batches.some((batch) => batch.quantity > 0 && parseISO(batch.expiryDate) >= referenceDate && parseISO(batch.expiryDate) <= nearExpiryCutoff);
      const outOfStock = quantity === 0;
      const lowStock = !outOfStock && quantity <= reorderPoint;
      const status = outOfStock ? "Out of Stock" : nearExpiry ? "Near Expiry" : lowStock ? "Low Stock" : "Healthy";
      return { product, status };
    });
  const totalProducts = Math.max(1, productHealth.length);
  const countStatus = (status: string) => productHealth.filter((item) => item.status === status).length;
  const healthy = countStatus("Healthy");
  const lowStock = countStatus("Low Stock");
  const outOfStock = countStatus("Out of Stock");
  const nearExpiry = countStatus("Near Expiry");
  const percent = (value: number) => (value / totalProducts) * 100;
  const distribution = [
    { name: "Healthy", value: healthy, secondary: percent(healthy) },
    { name: "Low Stock", value: lowStock, secondary: percent(lowStock) },
    { name: "Out of Stock", value: outOfStock, secondary: percent(outOfStock) },
    { name: "Near Expiry", value: nearExpiry, secondary: percent(nearExpiry) },
  ].sort((a, b) => b.value - a.value);

  return {
    title: "Stock Health",
    description: "Overview of inventory health and stock status across all products.",
    supportATitle: "Inventory Health Distribution",
    tableTitle: "Inventory Health Summary",
    kpis: [
      { label: "Healthy Items", value: `${formatNumber(healthy)} / ${formatNumber(totalProducts)}`, delta: `${formatSharePercent(percent(healthy))} of total inventory`, tone: "green" },
      { label: "Low Stock", value: formatNumber(lowStock), delta: "Below reorder threshold now", tone: lowStock > totalProducts * 0.2 ? "orange" : "blue" },
      { label: "Out of Stock", value: formatNumber(outOfStock), delta: "Currently unavailable", tone: outOfStock > 0 ? "red" : "green" },
      { label: "Near Expiry", value: formatNumber(nearExpiry), delta: "Expiring within 30 days", tone: nearExpiry > totalProducts * 0.15 ? "orange" : "purple" },
    ],
    mainChart: distribution,
    supportA: distribution,
    supportB: [],
    table: [],
    alerts: [
      `${outOfStock} products are out of stock`,
      `${nearExpiry} products will expire within 30 days`,
      `${lowStock} products are below reorder level`,
    ],
  };
}

type InventoryProductSummary = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  reorderPoint: number;
  value: number;
  near30: boolean;
  near60: boolean;
  near90: boolean;
  expired: boolean;
  daysToExpiry: number;
};

function inventoryProductSummaries(filters: FilterState): InventoryProductSummary[] {
  const scopedInventory = filteredInventory(filters);
  return products
    .filter((product) => filters.category === "All" || product.category === filters.category)
    .map((product) => {
      const batches = scopedInventory.filter((batch) => batch.productId === product.id);
      const quantity = batches.reduce((sum, batch) => sum + batch.quantity, 0);
      const reorderPoint = batches.reduce((sum, batch) => sum + batch.reorderPoint, 0);
      const value = quantity * product.cost;
      const referenceDate = parseISO("2026-07-20");
      const daysUntil = (date: string) => (parseISO(date).getTime() - referenceDate.getTime()) / 86_400_000;
      const activeExpiryDays = batches.filter((batch) => batch.quantity > 0).map((batch) => daysUntil(batch.expiryDate));
      const daysToExpiry = activeExpiryDays.length > 0 ? Math.min(...activeExpiryDays) : 9999;
      return {
        id: product.id,
        name: product.name,
        category: product.category,
        quantity,
        reorderPoint,
        value,
        expired: batches.some((batch) => batch.quantity > 0 && daysUntil(batch.expiryDate) < 0),
        near30: batches.some((batch) => batch.quantity > 0 && daysUntil(batch.expiryDate) >= 0 && daysUntil(batch.expiryDate) <= 30),
        near60: batches.some((batch) => batch.quantity > 0 && daysUntil(batch.expiryDate) >= 0 && daysUntil(batch.expiryDate) <= 60),
        near90: batches.some((batch) => batch.quantity > 0 && daysUntil(batch.expiryDate) >= 0 && daysUntil(batch.expiryDate) <= 90),
        daysToExpiry,
      };
    });
}

function buildInventoryReport(title: string, filters: FilterState): ReportResult {
  if (title === "Stock Health") {
    return buildStockHealthReport(filters);
  }

  const scopedInventory = filteredInventory(filters);
  const summaries = inventoryProductSummaries(filters);
  const totalValue = summaries.reduce((sum, item) => sum + item.value, 0);
  const totalUnits = summaries.reduce((sum, item) => sum + item.quantity, 0);
  const lowStock = summaries.filter((item) => item.quantity > 0 && item.quantity <= item.reorderPoint);
  const outOfStock = summaries.filter((item) => item.quantity === 0);
  const expired = summaries.filter((item) => item.expired);
  const categoryValue = topGroups(summaries.map((item) => ({ name: item.category, value: item.value, secondary: item.quantity })), 8);
  const warehouseRows = branches
    .map((branch) => {
      const batches = scopedInventory.filter((batch) => batch.branchId === branch.id);
      const units = batches.reduce((sum, batch) => sum + batch.quantity, 0);
      return {
        branch,
        units,
        utilization: Math.min(96, 48 + (units % 43)),
        value: batches.reduce((sum, batch) => sum + batch.quantity * (productById.get(batch.productId)?.cost ?? 0), 0),
      };
    })
    .filter((row) => row.units > 0)
    .sort((a, b) => b.units - a.units);
  const movementStart = parseISO(filters.dateFrom);
  const movementEnd = parseISO(filters.dateTo);
  const movementPeriods: { name: string; index: number }[] = [];
  const movementCursor = new Date(movementStart);
  let movementIndex = 0;
  while (movementCursor <= movementEnd && movementPeriods.length < 26) {
    const periodStart = new Date(movementCursor);
    const name = filters.inventoryMovementGranularity === "Quarterly"
      ? `Q${Math.floor(periodStart.getMonth() / 3) + 1} ${format(periodStart, "yyyy")}`
      : filters.inventoryMovementGranularity === "Monthly"
        ? format(periodStart, "MMM yyyy")
        : `Week of ${format(periodStart, "MMM d")}`;
    movementPeriods.push({ name, index: movementIndex });
    if (filters.inventoryMovementGranularity === "Quarterly") {
      movementCursor.setMonth(movementCursor.getMonth() + 3);
    } else if (filters.inventoryMovementGranularity === "Monthly") {
      movementCursor.setMonth(movementCursor.getMonth() + 1);
    } else {
      movementCursor.setDate(movementCursor.getDate() + 7);
    }
    movementIndex += 1;
  }
  const movementTrend = movementPeriods.map((period) => {
    const index = period.index;
    const stockIn = Math.round(totalUnits * (0.018 + (index % 3) * 0.004));
    const stockOut = Math.round(totalUnits * (0.017 + ((index + 2) % 5) * 0.003));
    return { name: period.name, value: stockIn, secondary: stockOut };
  });

  if (title === "Inventory Value") {
    const topCategory = categoryValue[0];
    const topFiveCategories = categoryValue.slice(0, 5);
    const topFiveValue = topFiveCategories.reduce((sum, item) => sum + item.value, 0);
    const valueTrend = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month, index) => ({ name: month, value: Math.round(totalValue * (0.82 + index * 0.038)) }));
    const firstTrendValue = valueTrend[0]?.value ?? 0;
    const lastTrendValue = valueTrend.at(-1)?.value ?? 0;
    const inventoryGrowth = firstTrendValue > 0 ? ((lastTrendValue - firstTrendValue) / firstTrendValue) * 100 : 0;
    return {
      title,
      description: "Shows the financial value of inventory on hand and where inventory investment is concentrated.",
      mainChartTitle: "Inventory Value Trend",
      supportATitle: "Top Categories by Inventory Value",
      tableTitle: "Top Categories by Inventory Value",
      kpis: [
        { label: "Total Inventory Value", value: formatCompactCurrency(totalValue), delta: "Current value of inventory on hand", tone: "green" },
        { label: "Highest Value Category", value: topCategory?.name ?? "N/A", delta: formatCompactCurrency(topCategory?.value ?? 0), tone: "purple" },
        { label: "Inventory Growth", value: formatPercent(inventoryGrowth), delta: "Inventory value growth across trend window", tone: inventoryGrowth >= 0 ? "green" : "red" },
        { label: "Top 5 Categories Value", value: formatCompactCurrency(topFiveValue), delta: "Inventory value held in top 5 categories", tone: "orange" },
      ],
      mainChart: valueTrend,
      supportA: topFiveCategories.map((item) => ({ ...item, secondary: (item.value / Math.max(1, totalValue)) * 100 })),
      supportB: [],
      table: [],
      alerts: topFiveCategories.map((item) => `${item.name}|${formatCompactCurrency(item.value)}|${formatSharePercent((item.value / Math.max(1, totalValue)) * 100)}`),
    };
  }

  if (title === "Warehouse Distribution") {
    const topWarehouse = warehouseRows[0];
    const topWarehouseShare = ((topWarehouse?.units ?? 0) / Math.max(1, totalUnits)) * 100;
    return {
      title,
      description: "Shows where current inventory is located and how units are distributed across warehouses.",
      mainChartTitle: "Warehouse Distribution %",
      supportATitle: "Warehouse Summary",
      supportBTitle: undefined,
      tableTitle: "Warehouse Distribution Summary",
      kpis: [
        { label: "Total Inventory Units", value: `${formatNumber(totalUnits)} Units`, delta: "Currently stored across all warehouses", tone: "blue" },
        { label: "Active Warehouses", value: `${formatNumber(warehouseRows.length)} Warehouses`, delta: "Currently holding inventory", tone: "green" },
        { label: "Largest Warehouse", value: topWarehouse?.branch.name ?? "N/A", delta: `${formatNumber(topWarehouse?.units ?? 0)} Units`, tone: "purple" },
        { label: "Largest Warehouse Share", value: formatSharePercent(topWarehouseShare), delta: "Share of current inventory units", tone: "orange" },
      ],
      mainChart: warehouseRows.map((row) => ({ name: row.branch.name, value: row.units, secondary: (row.units / Math.max(1, totalUnits)) * 100 })),
      supportA: warehouseRows.map((row) => ({ name: row.branch.name, value: row.units, secondary: (row.units / Math.max(1, totalUnits)) * 100 })),
      supportB: [],
      table: [],
      alerts: warehouseRows.map((row) => `${row.branch.name}|${formatNumber(row.units)}|${formatSharePercent((row.units / Math.max(1, totalUnits)) * 100)}`),
    };
  }

  if (title === "Movement Trends") {
    const stockIn = movementTrend.reduce((sum, item) => sum + item.value, 0);
    const stockOut = movementTrend.reduce((sum, item) => sum + (item.secondary ?? 0), 0);
    const netMovement = stockIn - stockOut;
    const splitIndex = Math.max(1, Math.floor(movementTrend.length / 2));
    const earlierMovement = movementTrend.slice(0, splitIndex).reduce((sum, item) => sum + item.value + (item.secondary ?? 0), 0);
    const recentMovement = movementTrend.slice(splitIndex).reduce((sum, item) => sum + item.value + (item.secondary ?? 0), 0);
    const movementGrowth = earlierMovement > 0 ? ((recentMovement - earlierMovement) / earlierMovement) * 100 : 0;
    return {
      title,
      description: "Shows how inventory enters and leaves the business over time to evaluate replenishment performance and demand pressure.",
      mainChartTitle: "Inventory Movement Trend",
      supportATitle: undefined,
      supportBTitle: "Net Movement Trend",
      tableTitle: "Movement Summary",
      kpis: [
        { label: "Stock In", value: `${formatNumber(stockIn)} Units`, delta: "Purchases, transfers in, and returns", tone: "green" },
        { label: "Stock Out", value: `${formatNumber(stockOut)} Units`, delta: "Sales, consumption, and transfers out", tone: "blue" },
        { label: "Net Movement", value: `${netMovement >= 0 ? "+" : "-"}${formatNumber(Math.abs(netMovement))} Units`, delta: "Net inventory change during selected period", tone: netMovement >= 0 ? "green" : "orange" },
        { label: "Movement Growth", value: formatPercent(movementGrowth), delta: "Inventory movement compared to earlier periods", tone: movementGrowth >= 0 ? "green" : "red" },
      ],
      mainChart: movementTrend.map((item) => ({ name: item.name, value: item.value, secondary: item.secondary ?? 0 })),
      supportA: movementTrend.map((item) => ({ name: item.name, value: item.secondary ?? 0 })),
      supportB: movementTrend.map((item) => ({ name: item.name, value: item.value - (item.secondary ?? 0) })),
      table: movementTrend.map((item) => ({ Period: item.name, "Stock In": formatNumber(item.value), "Stock Out": formatNumber(item.secondary ?? 0), "Net Movement": formatNumber(item.value - (item.secondary ?? 0)) })),
      alerts: [],
    };
  }

  if (title === "Stock Availability") {
    const outOfStockProducts = summaries.filter((item) => item.quantity === 0);
    const lowStockProducts = summaries.filter((item) => item.quantity > 0 && item.quantity <= item.reorderPoint);
    const availableProducts = summaries.filter((item) => item.quantity > item.reorderPoint);
    const totalProducts = Math.max(1, summaries.length);
    const availabilityRate = (availableProducts.length / totalProducts) * 100;
    const criticalProducts = [...outOfStockProducts, ...lowStockProducts].filter((item) => item.quantity === 0 || item.quantity <= item.reorderPoint * 0.4);
    const priorityProducts = [...outOfStockProducts, ...lowStockProducts]
      .sort((a, b) => {
        if (a.quantity === 0 && b.quantity !== 0) return -1;
        if (a.quantity !== 0 && b.quantity === 0) return 1;
        return a.quantity - b.quantity;
      })
      .slice(0, 10);

    return {
      title,
      description: "Identifies products with current availability issues and highlights immediate replenishment priorities.",
      mainChartTitle: "Stock Availability Distribution",
      supportATitle: "Priority Action List",
      tableTitle: "Priority Action List",
      kpis: [
        { label: "Available Products", value: formatNumber(availableProducts.length), delta: "Products with sufficient stock", tone: "green" },
        { label: "Low Stock Products", value: formatNumber(lowStockProducts.length), delta: "Products below reorder threshold", tone: "orange" },
        { label: "Out Of Stock Products", value: formatNumber(outOfStockProducts.length), delta: "Products with zero available inventory", tone: outOfStockProducts.length > 0 ? "red" : "green" },
        { label: "Availability Rate", value: formatSharePercent(availabilityRate), delta: "Products currently available", tone: availabilityRate >= 90 ? "green" : availabilityRate >= 80 ? "orange" : "red" },
      ],
      mainChart: [
        { name: "Available", value: availableProducts.length, secondary: availabilityRate },
        { name: "Low Stock", value: lowStockProducts.length, secondary: (lowStockProducts.length / totalProducts) * 100 },
        { name: "Out Of Stock", value: outOfStockProducts.length, secondary: (outOfStockProducts.length / totalProducts) * 100 },
      ],
      supportA: [
        { name: "Out Of Stock", value: outOfStockProducts.length },
        { name: "Low Stock", value: lowStockProducts.length },
        { name: "Critical Replenishment", value: criticalProducts.length },
      ],
      supportB: [],
      table: [],
      alerts: priorityProducts.map((item) => `${item.name}|${formatNumber(item.quantity)}|${formatNumber(item.reorderPoint)}|${item.quantity === 0 ? "Out Of Stock" : "Low Stock"}`),
    };
  }

  if (title === "Low Stock") {
    const critical = lowStock.sort((a, b) => a.quantity / Math.max(1, a.reorderPoint) - b.quantity / Math.max(1, b.reorderPoint)).slice(0, 12);
    return {
      title,
      description: "Identifies products below reorder threshold and highlights the most urgent replenishment actions.",
      mainChartTitle: "Most Critical Low Stock Items",
      supportATitle: "Low Stock by Category",
      supportBTitle: "Reorder Urgency",
      tableTitle: "Low Stock Action List",
      kpis: [
        { label: "Low Stock Items", value: formatNumber(lowStock.length), delta: "Below reorder threshold", tone: "orange" },
        { label: "Critical Items", value: formatNumber(critical.filter((item) => item.quantity <= item.reorderPoint * 0.4).length), delta: "Immediate action", tone: "red" },
        { label: "Reorder Units", value: formatNumber(lowStock.reduce((sum, item) => sum + Math.max(0, item.reorderPoint - item.quantity), 0)), delta: "Suggested minimum", tone: "blue" },
        { label: "Affected Categories", value: formatNumber(new Set(lowStock.map((item) => item.category)).size), delta: "Need replenishment", tone: "purple" },
      ],
      mainChart: critical.map((item) => ({ name: item.name, value: Math.max(0, item.reorderPoint - item.quantity) })),
      supportA: topGroups(lowStock.map((item) => ({ name: item.category, value: 1 })), 8),
      supportB: critical.map((item) => ({ name: item.name, value: (item.quantity / Math.max(1, item.reorderPoint)) * 100 })),
      table: critical.map((item) => ({ Product: item.name, Category: item.category, Stock: formatNumber(item.quantity), "Reorder Point": formatNumber(item.reorderPoint), "Suggested Reorder": formatNumber(Math.max(0, item.reorderPoint - item.quantity)), Priority: item.quantity <= item.reorderPoint * 0.4 ? "Critical" : "Warning" })),
      alerts: [`${lowStock.length} products are below reorder threshold.`, `${critical[0]?.name ?? "Top item"} has the highest reorder urgency.`, "Prioritize critical items before routine replenishment."],
    };
  }

  if (title === "Out Of Stock") {
    return {
      title,
      description: "Identifies unavailable products and the category impact of current stockouts.",
      mainChartTitle: "Current Out of Stock Products",
      supportATitle: "Out of Stock by Category",
      supportBTitle: "Impacted Product Groups",
      tableTitle: "Out of Stock Impact List",
      kpis: [
        { label: "Out of Stock Items", value: formatNumber(outOfStock.length), delta: "Currently unavailable", tone: outOfStock.length > 0 ? "red" : "green" },
        { label: "Impacted Categories", value: formatNumber(new Set(outOfStock.map((item) => item.category)).size), delta: "With unavailable products", tone: "orange" },
        { label: "Substitution Coverage", value: formatNumber(Math.max(0, 8 - outOfStock.length)), delta: "Available alternatives to review", tone: "green" },
        { label: "Stockout Risk", value: outOfStock.length > 12 ? "High" : outOfStock.length > 4 ? "Medium" : "Low", delta: "Executive signal", tone: outOfStock.length > 12 ? "red" : outOfStock.length > 4 ? "orange" : "green" },
      ],
      mainChart: outOfStock.slice(0, 8).map((item) => ({ name: item.name, value: 1 })),
      supportA: topGroups(outOfStock.map((item) => ({ name: item.category, value: 1 })), 8),
      supportB: outOfStock.slice(0, 8).map((item) => ({ name: item.name, value: 1 })),
      table: outOfStock.slice(0, 12).map((item) => ({ Product: item.name, Category: item.category, Status: "Out of Stock", "Action Required": "Replenish or substitute" })),
      alerts: [`${outOfStock.length} products are currently unavailable.`, "Review substitutes for high-demand unavailable products.", "Escalate supplier follow-up for repeated stockouts."],
    };
  }

  if (title === "Near Expiry") {
    const expiryRiskProducts = summaries
      .filter((item) => item.expired || item.near90)
      .sort((a, b) => {
        const aDays = a.daysToExpiry;
        const bDays = b.daysToExpiry;
        if (aDays < 0 && bDays >= 0) return -1;
        if (aDays >= 0 && bDays < 0) return 1;
        if (aDays !== bDays) return aDays - bDays;
        return b.quantity - a.quantity;
      })
      .slice(0, 10);
    const day30Only = summaries.filter((item) => item.daysToExpiry >= 0 && item.daysToExpiry <= 30);
    const day31To60 = summaries.filter((item) => item.daysToExpiry > 30 && item.daysToExpiry <= 60);
    const day61To90 = summaries.filter((item) => item.daysToExpiry > 60 && item.daysToExpiry <= 90);
    const actionForExpiry = (item: InventoryProductSummary) => {
      if (item.expired) return "Quarantine / Dispose";
      if (item.daysToExpiry <= 7) return "Supplier Return";
      if (item.quantity >= item.reorderPoint * 2) return "Discount / Promotion";
      return "Transfer";
    };
    return {
      title,
      description: "Shows current expiry risk and the products requiring immediate transfer, promotion, return, or disposal action.",
      mainChartTitle: "Expiry Risk Distribution",
      supportATitle: "Expiry Action List",
      supportBTitle: undefined,
      tableTitle: "Expiry Action List",
      kpis: [
        { label: "Expiring Within 30 Days", value: `${formatNumber(day30Only.length)} Products`, delta: "Requires immediate transfer, promotion, or markdown", tone: "red" },
        { label: "Expiring in 31-60 Days", value: `${formatNumber(day31To60.length)} Products`, delta: "Action should be planned soon", tone: "orange" },
        { label: "Expiring in 61-90 Days", value: `${formatNumber(day61To90.length)} Products`, delta: "Monitor and prepare action", tone: "purple" },
        { label: "Expired Products", value: `${formatNumber(expired.length)} Products`, delta: "Requires disposal, quarantine, or return handling", tone: expired.length > 0 ? "red" : "green" },
      ],
      mainChart: [
        { name: "0-30 Days", value: day30Only.length },
        { name: "31-60 Days", value: day31To60.length },
        { name: "61-90 Days", value: day61To90.length },
        { name: "Expired", value: expired.length },
      ],
      supportA: [],
      supportB: [],
      table: [],
      alerts: expiryRiskProducts.map((item) => `${item.name}|${item.category}|${item.expired ? "Expired" : `${formatNumber(item.daysToExpiry)} days`}|${formatNumber(item.quantity)} units|${actionForExpiry(item)}`),
    };
  }

  if (title === "Reorder Planning") {
    const candidates = summaries
      .filter((item) => item.quantity <= item.reorderPoint * 1.25)
      .map((item) => {
        const coverageDays = Math.max(0, Math.round((item.quantity / Math.max(1, item.reorderPoint)) * 30));
        const suggestedOrder = Math.max(0, Math.round(item.reorderPoint * 2 - item.quantity));
        const priority = coverageDays <= 7 || item.quantity <= item.reorderPoint * 0.5 ? "High" : coverageDays <= 18 ? "Medium" : "Low";
        return { ...item, coverageDays, suggestedOrder, priority };
      })
      .filter((item) => item.suggestedOrder > 0)
      .sort((a, b) => {
        const priorityRank: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
        const priorityDiff = priorityRank[a.priority] - priorityRank[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        if (a.coverageDays !== b.coverageDays) return a.coverageDays - b.coverageDays;
        return b.suggestedOrder - a.suggestedOrder;
      })
      .slice(0, 10);
    const suggestedUnits = candidates.reduce((sum, item) => sum + Math.max(0, item.reorderPoint * 2 - item.quantity), 0);
    return {
      title,
      description: "Shows what should be reordered now, suggested quantities, and replenishment urgency for purchasing decisions.",
      mainChartTitle: "Reorder Priority Ranking",
      supportATitle: "Replenishment Action List",
      supportBTitle: undefined,
      tableTitle: "Replenishment Action List",
      kpis: [
        { label: "Reorder Candidates", value: `${formatNumber(candidates.length)} Products`, delta: "Products currently requiring replenishment review", tone: "orange" },
        { label: "Suggested Reorder Units", value: `${formatNumber(suggestedUnits)} Units`, delta: "Total quantity recommended for replenishment", tone: "blue" },
        { label: "Urgent Reorders", value: `${formatNumber(candidates.filter((item) => item.priority === "High").length)} Products`, delta: "Products requiring immediate purchasing action", tone: "red" },
        { label: "Average Coverage", value: `${formatNumber(candidates.reduce((sum, item) => sum + item.coverageDays, 0) / Math.max(1, candidates.length))} Days`, delta: "Average estimated stock coverage", tone: "green" },
      ],
      mainChart: candidates.map((item) => ({ name: item.name, value: item.suggestedOrder })),
      supportA: [],
      supportB: [],
      table: [],
      alerts: candidates.map((item) => `${item.name}|${formatNumber(item.quantity)}|${formatNumber(item.coverageDays)} Days|${formatNumber(item.suggestedOrder)}|${item.priority}`),
    };
  }

  return genericReport("Inventory", title, filters);
}

function branchHasProductActivity(productId: string, branchId: string) {
  const hasStock = inventoryBatches.some((batch) => batch.productId === productId && batch.branchId === branchId && batch.quantity > 0);
  const hasSales = orders.some((order) => order.branchId === branchId && order.items.some((item) => item.productId === productId));
  return hasStock || hasSales;
}

function filteredProductPerformanceRows(filters: FilterState) {
  return orders
    .filter((order) => withinDates(order.date, filters) && (filters.branch === "All" || order.branchId === filters.branch))
    .flatMap((order) =>
      order.items
        .map((item) => {
          const product = productById.get(item.productId)!;
          const revenue = item.quantity * item.unitPrice;
          const cost = item.quantity * item.unitCost;
          return { order, product, revenue, cost, units: item.quantity };
        })
        .filter(({ product }) => (filters.category === "All" || product.category === filters.category) && (filters.product === "All" || product.id === filters.product)),
    );
}

function totalsFromRows(rows: ReturnType<typeof filteredProductPerformanceRows>) {
  return rows.reduce(
    (acc, row) => {
      acc.revenue += row.revenue;
      acc.cost += row.cost;
      acc.units += row.units;
      acc.orderIds.add(row.order.id);
      return acc;
    },
    { revenue: 0, cost: 0, units: 0, orderIds: new Set<string>() },
  );
}

function productMetricsFromRows(rows: ReturnType<typeof filteredProductPerformanceRows>) {
  const map = new Map<string, ProductMetric>();
  rows.forEach((row) => {
    const next = map.get(row.product.id) ?? {
      id: row.product.id,
      name: row.product.name,
      category: row.product.category,
      revenue: 0,
      cost: 0,
      units: 0,
      orderIds: new Set<string>(),
    };
    next.revenue += row.revenue;
    next.cost += row.cost;
    next.units += row.units;
    next.orderIds.add(row.order.id);
    map.set(row.product.id, next);
  });
  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
}

function productFamilyName(productName: string) {
  return productName.replace(/\s+(Advance|Plus|Tab)\s+\d+mg$/i, "");
}

function concentrationMetricsFromRows(rows: ReturnType<typeof filteredConcentrationRows>) {
  const map = new Map<string, ProductMetric>();
  rows.forEach((row) => {
    const familyName = productFamilyName(row.product.name);
    const next = map.get(familyName) ?? {
      id: familyName,
      name: familyName,
      category: row.product.category,
      revenue: 0,
      cost: 0,
      units: 0,
      orderIds: new Set<string>(),
    };
    next.revenue += row.revenue;
    next.cost += row.cost;
    next.units += row.units;
    next.orderIds.add(row.order.id);
    map.set(familyName, next);
  });
  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
}

function trendFromRows(rows: ReturnType<typeof filteredProductPerformanceRows>) {
  return topGroups(
    rows.map((row) => ({ name: format(parseISO(row.order.date), "MMM d"), value: row.revenue, secondary: row.revenue * 0.93 })),
    14,
  ).sort((a, b) => new Date(`${a.name} 2026`).getTime() - new Date(`${b.name} 2026`).getTime());
}

function filteredConcentrationRows(filters: FilterState) {
  return orders
    .filter((order) => withinDates(order.date, filters) && (filters.branch === "All" || order.branchId === filters.branch))
    .flatMap((order) =>
      order.items
        .map((item) => {
          const product = productById.get(item.productId)!;
          const revenue = item.quantity * item.unitPrice;
          const cost = item.quantity * item.unitCost;
          return { order, product, revenue, cost, units: item.quantity };
        })
        .filter(({ product }) => filters.category === "All" || product.category === filters.category),
    );
}

function buildSalesReport(title: string, filters: FilterState, ordersByDayMode: OrdersByDayMode = "weekday"): ReportResult {
  const scopedOrders = filteredOrders(filters);
  const total = totals(scopedOrders);
  const grossProfit = total.revenue - total.cost;
  const averageOrderValue = total.revenue / Math.max(1, scopedOrders.length);
  const baseKpis = [
    { label: "Revenue", value: formatCurrency(total.revenue), delta: "+8.4%", tone: "green" as const },
    { label: "Orders", value: formatNumber(scopedOrders.length), delta: "+5.9%", tone: "blue" as const },
    { label: "Gross Profit", value: formatCurrency(grossProfit), delta: "+6.7%", tone: "purple" as const },
    { label: "Margin", value: `${((grossProfit / Math.max(1, total.revenue)) * 100).toFixed(1)}%`, delta: "+1.8 pts", tone: "orange" as const },
  ];
  const rows = salesRows(scopedOrders);
  const categoryData = topGroups(rows.map((row) => ({ name: row.product.category, value: row.revenue, secondary: row.revenue - row.cost })), 8);

  if (title === "Product Performance") {
    const productRows = filteredProductPerformanceRows(filters);
    const productTotal = totalsFromRows(productRows);
    const productGrossProfit = productTotal.revenue - productTotal.cost;
    const productOrders = productTotal.orderIds.size;
    const productMetricRows = productMetricsFromRows(productRows);
    const productStock = filteredInventory(filters).reduce((sum, batch) => sum + batch.quantity, 0);
    const stockCoverage = productStock / Math.max(1, productTotal.units / 181);
    const selectedProduct = filters.product === "All" ? undefined : products.find((product) => product.id === filters.product);
    const selectedCategory = filters.category === "All" ? undefined : filters.category;
    const modeTitle = selectedProduct?.name ?? (selectedCategory ? `${selectedCategory} Performance` : "Product Performance");
    const trendRows = trendFromRows(productRows);
    const topProductRows = productMetricRows.slice(0, 10).map((metric) => ({ name: metric.name, value: metric.revenue, secondary: (metric.revenue / Math.max(1, productTotal.revenue)) * 100 }));
    const tableRows = productTable(productMetricRows.slice(0, 50));
    return {
      title: modeTitle,
      description: selectedProduct
        ? `${selectedProduct.category} - single product revenue, profit, inventory health, and action recommendation.`
        : selectedCategory
          ? `${productMetricRows.length} products in ${selectedCategory}. Revenue, margin, stock coverage, and product action priorities.`
          : "Which products generate revenue and profit, and which products need action?",
      mainChartTitle: selectedProduct ? "Product Revenue Trend" : selectedCategory ? `${selectedCategory} Revenue Trend` : "Revenue Trend",
      supportATitle: selectedCategory ? `Top ${selectedCategory} Products by Revenue` : "Top Products by Revenue",
      supportBTitle: "Category Contribution",
      tableTitle: selectedCategory ? `${selectedCategory} Product Ranking` : "Product Ranking Table",
      nextAction: "Protect stock for the top revenue products and review pricing, placement, or delisting decisions for the bottom performers.",
      kpis: [
        { label: "Revenue", value: formatCurrency(productTotal.revenue), delta: "+8.4%", tone: "green" },
        { label: "Gross Profit", value: formatCurrency(productGrossProfit), delta: "+6.7%", tone: "green" },
        { label: "Gross Margin", value: `${((productGrossProfit / Math.max(1, productTotal.revenue)) * 100).toFixed(1)}%`, delta: "+1.8 pts", tone: "orange" },
        { label: "Units Sold", value: formatNumber(productTotal.units), delta: "+6.1%", tone: "blue" },
        { label: "Orders", value: formatNumber(productOrders), delta: "+5.9%", tone: "purple" },
        { label: "Stock Coverage", value: `${formatNumber(stockCoverage)} Days`, delta: stockCoverage < 30 ? "Needs action" : "Healthy", tone: stockCoverage < 30 ? "red" : "green" },
      ],
      mainChart: trendRows,
      supportA: topProductRows,
      supportB: categoryData,
      table: tableRows,
      alerts: [
        `${topProductRows[0]?.name ?? "Top product"} is the leading revenue contributor.`,
        `${Math.max(0, productMetricRows.length - 10)} lower-ranked products should be reviewed for promotion or stock action.`,
        `Average order value is ${formatCurrency(averageOrderValue)}.`,
      ],
    };
  }

  if (title === "Sales Concentration") {
    const concentrationRows = filteredConcentrationRows(filters);
    const concentrationTotal = totalsFromRows(concentrationRows);
    const concentrationMetrics = concentrationMetricsFromRows(concentrationRows);
    const concentrationCategories = topGroups(concentrationRows.map((row) => ({ name: row.product.category, value: row.revenue })), dimensions.categories.length);
    const top10 = concentrationMetrics.slice(0, 10).reduce((sum, item) => sum + item.revenue, 0);
    let running = 0;
    const concentrationAnalysisRows = concentrationMetrics.slice(0, 40).map((metric, index) => {
      running += metric.revenue;
      const revenuePercent = (metric.revenue / Math.max(1, concentrationTotal.revenue)) * 100;
      const cumulativePercent = (running / Math.max(1, concentrationTotal.revenue)) * 100;
      return {
        rank: index + 1,
        product: metric.name,
        revenue: metric.revenue,
        revenuePercent,
        cumulativePercent,
        riskImpact: index < 5 ? "High" : index < 15 ? "Medium" : "Low",
      };
    });
    const dependencyRow = concentrationAnalysisRows[Math.min(9, Math.max(0, concentrationAnalysisRows.length - 1))];
    const dependencyPercent = dependencyRow?.cumulativePercent ?? 0;
    const risk = dependencyPercent < 40 ? "Low" : dependencyPercent <= 60 ? "Medium" : "High";
    const riskTone = risk === "Low" ? "green" : risk === "Medium" ? "orange" : "red";
    const table = concentrationAnalysisRows.map((row) => ({
      Rank: row.rank,
      Product: row.product,
      Revenue: Math.round(row.revenue),
      "Revenue %": `${row.revenuePercent.toFixed(1)}%`,
      "Cumulative %": `${row.cumulativePercent.toFixed(1)}%`,
      "Risk Impact": row.riskImpact,
    }));
    const pareto = concentrationAnalysisRows.slice(0, 25).map((row) => ({
      name: row.product,
      value: row.revenue,
      secondary: row.cumulativePercent,
    }));
    const topCategory = concentrationCategories[0];
    const categoryDistribution = concentrationCategories.map((item) => ({
      name: item.name,
      value: (item.value / Math.max(1, concentrationTotal.revenue)) * 100,
      secondary: item.value,
    }));
    const topCategoryShare = ((topCategory?.value ?? 0) / Math.max(1, concentrationTotal.revenue)) * 100;
    return {
      title,
      description: "Shows whether a small number of products, categories, branches, or customers generate most revenue and create dependency risk.",
      mainChartTitle: "Revenue Concentration Analysis",
      supportATitle: "Revenue Distribution by Category",
      supportBTitle: "Revenue Distribution by Category",
      tableTitle: "Concentration Analysis Table",
      nextAction: "Reduce dependency risk by building category depth and improving long-tail product activation where margin supports it.",
      kpis: [
        { label: "Revenue Dependency", value: `${dependencyPercent.toFixed(1)}%`, delta: `Top 10 Products - ${formatShortCurrency(top10)} of ${formatShortCurrency(concentrationTotal.revenue)} Revenue`, tone: riskTone },
        { label: "Top Revenue Driver", value: topCategory?.name ?? "N/A", delta: `${topCategoryShare.toFixed(1)}% Revenue Share`, tone: "blue" },
        { label: "Risk Level", value: `${risk} Risk`, delta: risk === "High" ? "Highly concentrated" : risk === "Medium" ? "Monitor exposure" : "Diversified", tone: riskTone },
      ],
      mainChart: pareto,
      supportA: categoryDistribution,
      supportB: categoryDistribution,
      table,
      alerts: [
        `Top 10 products contribute ${dependencyPercent.toFixed(1)}% of revenue.`,
        `${topCategory?.name ?? "The leading category"} generates ${topCategoryShare.toFixed(1)}% of revenue.`,
        risk === "High" ? "Revenue concentration exceeds the recommended threshold." : risk === "Medium" ? "Revenue concentration is within the monitoring range." : "Revenue is broadly diversified across products.",
      ],
    };
  }

  if (title === "Orders By Area") {
    const cityAreaIds = getAvailableAreasForCity(filters.city).map((area) => area.id);
    const effectiveArea = filters.city === "All" || !cityAreaIds.includes(filters.area) ? "All" : filters.area;
    const selectedCityName = cityNameById(filters.city) ?? filters.city;
    const selectedAreaName = areaNameById(effectiveArea) ?? "Selected Area";
    const buildScopedAreaOrders = (dateFrom: string, dateTo: string) =>
      orders.map((order) => {
        const orderArea = areaForOrder(order.id);
        const dateMatches = order.date >= dateFrom && order.date <= dateTo;
        const cityMatches = filters.city === "All" || orderArea.cityId === filters.city;
        const areaMatches = effectiveArea === "All" || orderArea.id === effectiveArea;
        const matchingItems = order.items.filter((item) => {
          const product = productById.get(item.productId)!;
          return (filters.category === "All" || product.category === filters.category) && (filters.product === "All" || product.id === filters.product);
        });
        return { order, orderArea, matchingItems, dateMatches, cityMatches, areaMatches };
      })
      .filter(({ matchingItems, dateMatches, cityMatches, areaMatches }) => dateMatches && cityMatches && areaMatches && matchingItems.length > 0);
    const scopedAreaOrders = buildScopedAreaOrders(filters.dateFrom, filters.dateTo);
    const revenueForAreaOrders = (areaOrders: typeof scopedAreaOrders, areaName: string) =>
      areaOrders.reduce((sum, item) => sum + item.matchingItems.reduce((lineSum, line) => lineSum + line.quantity * line.unitPrice * areaRevenueMultiplier(areaName), 0), 0);
    const areaRows = egyptAreas.map((area) => {
      const areaOrders = scopedAreaOrders.filter(({ orderArea }) => orderArea.area === area.area && orderArea.city === area.city);
      const currentRevenue = revenueForAreaOrders(areaOrders, area.area);
      return {
        area: area.area,
        city: area.city,
        orders: areaOrders.length,
        revenue: Math.round(currentRevenue),
        averageOrderValue: Math.round(currentRevenue / Math.max(1, areaOrders.length)),
      };
    }).filter((row) => row.orders > 0).sort((a, b) => Number(b.orders) - Number(a.orders));
    const areaRevenue = areaRows.reduce((sum, row) => sum + Number(row.revenue), 0);
    const areaOrdersTotal = areaRows.reduce((sum, row) => sum + Number(row.orders), 0);
    const highestRevenueArea = [...areaRows].sort((a, b) => Number(b.revenue) - Number(a.revenue))[0];
    const areaMetrics = areaRows.map((row) => {
      const revenueShare = (Number(row.revenue) / Math.max(1, areaRevenue)) * 100;
      return {
        ...row,
        revenueShare,
        status: geographyStatus(revenueShare),
      };
    }).sort((a, b) => Number(b.revenue) - Number(a.revenue));
    const cityMetrics = geoCities.map((city) => {
      const rows = areaMetrics.filter((row) => row.city === city.name);
      const cityOrders = rows.reduce((sum, row) => sum + Number(row.orders), 0);
      const cityRevenue = rows.reduce((sum, row) => sum + Number(row.revenue), 0);
      const revenueShare = (cityRevenue / Math.max(1, areaRevenue)) * 100;
      return {
        city: city.name,
        orders: cityOrders,
        revenue: cityRevenue,
        revenueShare,
        status: geographyStatus(revenueShare),
      };
    }).filter((row) => row.orders > 0).sort((a, b) => b.revenue - a.revenue);
    const cityRows = cityMetrics.map((row) => ({
      City: row.city,
      Revenue: formatCompactCurrency(row.revenue),
      "Revenue Share %": formatSharePercent(row.revenueShare),
      Status: row.status,
    }));
    const areaTableRows = areaMetrics.map((row) => ({
      Area: row.area,
      Revenue: formatCompactCurrency(Number(row.revenue)),
      "Revenue Share %": formatSharePercent(row.revenueShare),
      Status: row.status,
    }));
    const selectedAreaProductMetrics = productMetricsFromRows(
      scopedAreaOrders.flatMap((item) =>
        item.matchingItems.map((line) => {
          const product = productById.get(line.productId)!;
          const multiplier = areaRevenueMultiplier(item.orderArea.area);
          return {
            order: item.order,
            product,
            revenue: line.quantity * line.unitPrice * multiplier,
            cost: line.quantity * line.unitCost * multiplier,
            units: line.quantity,
          };
        }),
      ),
    );
    const selectedAreaRevenue = selectedAreaProductMetrics.reduce((sum, metric) => sum + metric.revenue, 0);
    const topSelectedAreaProducts = selectedAreaProductMetrics.slice(0, 10).map((metric) => ({
      name: metric.name,
      value: metric.revenue,
      secondary: (metric.revenue / Math.max(1, selectedAreaRevenue)) * 100,
      tertiary: metric.units,
    }));
    const selectedAreaCategoryMix = topGroups(
      selectedAreaProductMetrics.map((metric) => ({ name: metric.category, value: metric.revenue })),
      dimensions.categories.length,
    ).map((item) => ({ ...item, value: (item.value / Math.max(1, selectedAreaRevenue)) * 100 }));
    const fastMovingProducts = [...selectedAreaProductMetrics]
      .sort((a, b) => b.units - a.units || b.orderIds.size - a.orderIds.size)
      .slice(0, 10)
      .map((metric) => ({ name: metric.name, value: metric.units, secondary: metric.orderIds.size }));
    const slowMovingProducts = [...selectedAreaProductMetrics]
      .sort((a, b) => a.units - b.units)
      .slice(0, 10)
      .map((metric) => {
        const stock = inventoryBatches.filter((batch) => batch.productId === metric.id).reduce((sum, batch) => sum + batch.quantity, 0);
        const stockDays = stock / Math.max(1, metric.units / 181);
        return { name: metric.name, value: metric.units, secondary: stockDays };
      });
    const allAreasMode = effectiveArea === "All";
    const allCitiesMode = filters.city === "All";
    const contributionMetrics = allCitiesMode
      ? cityMetrics.map((item) => ({ name: item.city, revenueShare: item.revenueShare, status: item.status }))
      : areaMetrics.map((item) => ({ name: item.area, revenueShare: item.revenueShare, status: item.status }));
    const topContributor = contributionMetrics[0];
    const topTwoContribution = contributionMetrics.slice(0, 2).reduce((sum, item) => sum + item.revenueShare, 0);
    const expansionOpportunity = [...contributionMetrics].reverse().find((item) => item.status === "Opportunity") ?? contributionMetrics.at(-1);
    const contributionLabel = allCitiesMode ? "City" : "Area";
    return {
      title: allCitiesMode ? "Geographic Performance Across All Cities" : allAreasMode ? `${selectedCityName} Area Performance` : `${selectedAreaName} Performance`,
      description: allCitiesMode
        ? "National geographic overview by city, showing where demand and revenue are strongest."
        : allAreasMode
          ? `Compares demand, revenue, and order value across ${selectedCityName} areas.`
          : `Shows what sells in ${selectedAreaName}, which categories dominate, and what inventory should be reviewed.`,
      mainChartTitle: allAreasMode ? allCitiesMode ? "Orders by City" : `Orders by ${selectedCityName} Area` : `Top Products in ${selectedAreaName}`,
      supportATitle: allAreasMode ? allCitiesMode ? "Revenue by City" : `Revenue by ${selectedCityName} Area` : `Category Mix in ${selectedAreaName}`,
      supportBTitle: allAreasMode ? allCitiesMode ? "Average Order Value by City" : `Average Order Value by ${selectedCityName} Area` : `Fast Moving Products in ${selectedAreaName}`,
      tableTitle: allCitiesMode ? "City Performance Table" : allAreasMode ? `${selectedCityName} Area Performance Table` : `${selectedAreaName} Product Drill-down`,
      nextAction: "Focus management attention on high-revenue and high-order areas with strong average order value.",
      kpis: [
        { label: "Total Orders", value: formatNumber(areaOrdersTotal), delta: "Filtered areas", tone: "blue" },
        { label: "Net Revenue", value: formatCompactCurrency(areaRevenue), delta: "Revenue from selected geography", tone: "green" },
        { label: "Average Order Value", value: formatCompactCurrency(areaRevenue / Math.max(1, areaOrdersTotal)), delta: "Revenue / orders", tone: "orange" },
        { label: allAreasMode ? (allCitiesMode ? "Top City" : "Top Area") : "Selected Area Revenue", value: allAreasMode ? String(allCitiesMode ? cityMetrics[0]?.city ?? "N/A" : highestRevenueArea?.area ?? "N/A") : formatCompactCurrency(areaRevenue), delta: allAreasMode && highestRevenueArea ? `${allCitiesMode ? formatCompactCurrency(cityMetrics[0]?.revenue ?? 0) : formatCompactCurrency(Number(highestRevenueArea.revenue))} revenue` : allAreasMode ? "No activity" : selectedAreaName, tone: "purple" },
        { label: "Area Coverage", value: `${areaRows.length} Areas`, delta: "With sales activity", tone: "green" },
      ],
      mainChart: allAreasMode
        ? topGroups(areaRows.map((row) => ({ name: allCitiesMode ? String(row.city) : String(row.area), value: Number(row.orders) })), 12)
        : topSelectedAreaProducts,
      supportA: allAreasMode
        ? topGroups(areaRows.map((row) => ({ name: allCitiesMode ? String(row.city) : String(row.area), value: Number(row.revenue) })), 12)
        : selectedAreaCategoryMix,
      supportB: allAreasMode
        ? topGroups(areaRows.map((row) => ({ name: allCitiesMode ? String(row.city) : String(row.area), value: Number(row.averageOrderValue) })), 12)
        : fastMovingProducts,
      supportC: slowMovingProducts,
      supportD: selectedAreaCategoryMix,
      table: allCitiesMode ? cityRows : allAreasMode ? areaTableRows : selectedAreaProductMetrics.slice(0, 20).map((metric) => {
        const revenueShare = (metric.revenue / Math.max(1, selectedAreaRevenue)) * 100;
        return {
          Product: metric.name,
          Revenue: formatCompactCurrency(metric.revenue),
          "Revenue Share %": formatSharePercent(revenueShare),
          "Units Sold": metric.units,
          "Order Frequency": metric.orderIds.size,
        };
      }),
      alerts: [
        `Highest Revenue ${contributionLabel}: ${topContributor?.name ?? "N/A"} contributes ${formatSharePercent(topContributor?.revenueShare ?? 0)} of revenue.`,
        `Revenue Concentration: Top 2 ${allCitiesMode ? "cities" : "areas"} contribute ${formatSharePercent(topTwoContribution)} of revenue.`,
        `Expansion Opportunity: ${expansionOpportunity?.name ?? "N/A"} contributes ${formatSharePercent(expansionOpportunity?.revenueShare ?? 0)} and has room to grow.`,
      ],
    };
  }

  if (title === "Orders By Area Legacy") {
    const areaRows = egyptAreas.map((area) => {
      const areaOrders = scopedOrders.filter((order) => {
        const orderArea = areaForOrder(order.id);
        return orderArea.area === area.area && orderArea.city === area.city;
      });
      const areaTotal = totals(areaOrders);
      const deliveryOrders = areaOrders.filter((order) => order.channel === "Delivery").length;
      const customersCount = new Set(areaOrders.map((order) => order.customerId)).size;
      const newCustomers = Math.round(customersCount * (0.18 + (area.area.length % 5) * 0.025));
      return {
        area: area.area,
        city: area.city,
        orders: areaOrders.length,
        revenue: Math.round(areaTotal.revenue),
        averageOrderValue: Math.round(areaTotal.revenue / Math.max(1, areaOrders.length)),
        customers: customersCount,
        newCustomers,
        repeatRate: `${((1 - newCustomers / Math.max(1, customersCount)) * 100).toFixed(1)}%`,
        deliveryShare: `${((deliveryOrders / Math.max(1, areaOrders.length)) * 100).toFixed(1)}%`,
        growth: `${(4 + (area.area.length % 8) * 1.3).toFixed(1)}%`,
      };
    }).sort((a, b) => Number(b.orders) - Number(a.orders));
    const deliveryOrderCount = scopedOrders.filter((order) => order.channel === "Delivery").length;
    return {
      title,
      description: "Identifies which Egyptian areas generate the most orders, revenue, customers, and delivery demand without requiring an external map API.",
      mainChartTitle: "Orders by City",
      supportATitle: "Revenue by Area",
      supportBTitle: "Average Order Value by Area",
      tableTitle: "Area Performance Table",
      nextAction: "Prioritize delivery coverage and localized promotions in the highest order-density areas.",
      kpis: [
        { label: "Total Orders", value: formatNumber(scopedOrders.length), delta: "+5.9%", tone: "blue" },
        { label: "Net Revenue", value: formatCurrency(total.revenue), delta: "+8.4%", tone: "green" },
        { label: "Active Areas", value: formatNumber(areaRows.filter((row) => Number(row.orders) > 0).length), delta: "Egypt coverage", tone: "purple" },
        { label: "Average Order Value", value: formatCurrency(averageOrderValue), delta: "+2.1%", tone: "orange" },
        { label: "Delivery Orders", value: formatNumber(deliveryOrderCount), delta: `${((deliveryOrderCount / Math.max(1, scopedOrders.length)) * 100).toFixed(1)}%`, tone: "green" },
        { label: "Top Area", value: String(areaRows[0]?.area ?? "N/A"), delta: String(areaRows[0]?.city ?? ""), tone: "blue" },
        { label: "New Customers", value: formatNumber(areaRows.reduce((sum, row) => sum + Number(row.newCustomers), 0)), delta: "Estimated", tone: "purple" },
        { label: "Repeat Rate", value: `${((scopedOrders.length - deliveryOrderCount) / Math.max(1, scopedOrders.length) * 100).toFixed(1)}%`, delta: "Customer behavior", tone: "orange" },
      ],
      mainChart: topGroups(areaRows.map((row) => ({ name: String(row.city), value: Number(row.orders) })), 5),
      supportA: areaRows.slice(0, 10).map((row) => ({ name: String(row.area), value: Number(row.revenue) })),
      supportB: areaRows.slice(0, 8).map((row) => ({ name: String(row.area), value: Number(row.averageOrderValue) })),
      table: areaRows,
      alerts: [`${areaRows[0]?.area ?? "Top area"} is the highest demand area.`, `${deliveryOrderCount} delivery orders are included in the current filter set.`, `Average order value is ${formatCurrency(averageOrderValue)}.`],
    };
  }

  if (title === "Orders Analysis") {
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const weekdayDemandMultipliers = [1.32, 1.17, 1.02, 0.82, 1.08, 0.96, 1.12];
    const weekdayRevenueMultipliers = [1.08, 1.02, 0.98, 0.88, 1.26, 1.18, 1.04];
    const branchIsValid = filters.city !== "All" && (filters.branch === "All" || branchById.get(filters.branch)?.city === filters.city);
    const effectiveBranch = branchIsValid ? filters.branch : "All";
    const today = format(new Date(), "yyyy-MM-dd");
    const filteredOrderLines = (dateFrom: string, dateTo: string) => orders
      .filter((order) => {
        const branch = branchById.get(order.branchId);
        return (
          order.date >= dateFrom &&
          order.date <= dateTo &&
          (filters.city === "All" || branch?.city === filters.city) &&
          (effectiveBranch === "All" || order.branchId === effectiveBranch)
        );
      })
      .flatMap((order) => {
        const matchingItems = order.items.filter((item) => {
          const product = productById.get(item.productId)!;
          return (filters.category === "All" || product.category === filters.category) && (filters.product === "All" || product.id === filters.product);
        });
        return matchingItems.length > 0 ? [{ order, matchingItems }] : [];
      });
    const weekdaySourceRows = filteredOrderLines(filters.dateFrom, filters.dateTo);
    if (weekdaySourceRows.length === 0 && ordersByDayMode !== "today") {
      return {
        title: "Orders Analysis",
        description: ordersByDayMode === "daily" ? "Daily Performance Trend - no daily order activity was found for the selected period." : ordersByDayMode === "weekly" ? "Weekly Performance Trend - no weekly order activity was found for the selected period." : "Weekday View aggregates all transactions by day of week (Sunday-Saturday) across the selected period to reveal recurring demand patterns.",
        mainChartTitle: ordersByDayMode === "daily" ? "Orders by Date" : ordersByDayMode === "weekly" ? "Orders by Week" : "Orders by Weekday",
        supportATitle: ordersByDayMode === "daily" ? "Revenue by Date" : ordersByDayMode === "weekly" ? "Revenue by Week" : "Revenue by Weekday",
        supportBTitle: ordersByDayMode === "daily" ? "Average Order Value by Date" : ordersByDayMode === "weekly" ? "Average Order Value by Week" : "Average Order Value by Weekday",
        tableTitle: ordersByDayMode === "daily" ? "Daily Performance Table" : ordersByDayMode === "weekly" ? "Weekly Performance Table" : "Weekday Demand Analysis",
        kpis: [
          { label: "Total Orders", value: "0", delta: "Completed orders", tone: "blue" },
          { label: ordersByDayMode === "daily" ? "Average Daily Orders" : ordersByDayMode === "weekly" ? "Best Revenue Week" : "Busiest Weekday", value: "N/A", delta: "No activity", tone: "green" },
          { label: ordersByDayMode === "daily" ? "Highest Revenue Date" : ordersByDayMode === "weekly" ? "Lowest Demand Week" : "Highest Revenue Weekday", value: "N/A", delta: "No activity", tone: "purple" },
          { label: ordersByDayMode === "daily" ? "Lowest Order Date" : ordersByDayMode === "weekly" ? "Average Weekly Orders" : "Lowest Demand Weekday", value: "N/A", delta: "No activity", tone: "orange" },
        ],
        mainChart: [],
        supportA: [],
        supportB: [],
        table: [],
        alerts: [],
      };
    }
    if (ordersByDayMode === "daily") {
      const dateMap = new Map<string, { orders: Set<string>; revenue: number }>();
      weekdaySourceRows.forEach(({ order, matchingItems }) => {
        const current = dateMap.get(order.date) ?? { orders: new Set<string>(), revenue: 0 };
        current.orders.add(order.id);
        current.revenue += matchingItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        dateMap.set(order.date, current);
      });
      const dailyRows = Array.from(dateMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, item]) => ({
          date,
          weekday: weekdays[getDay(parseISO(date))] ?? "Unknown",
          orders: item.orders.size,
          revenue: Math.round(item.revenue),
          averageOrderValue: Math.round(item.revenue / Math.max(1, item.orders.size)),
        }));
      const totalOrders = dailyRows.reduce((sum, item) => sum + item.orders, 0);
      const highestRevenueDate = [...dailyRows].sort((a, b) => b.revenue - a.revenue)[0];
      const lowestOrderDate = [...dailyRows].sort((a, b) => a.orders - b.orders)[0];
      return {
        title: "Daily Trend",
        description: "Shows calendar-date performance across the selected date range without weekday aggregation.",
        mainChartTitle: "Orders by Date",
        supportATitle: "Revenue by Date",
        supportBTitle: "Average Order Value by Date",
        tableTitle: "Daily Performance Table",
        nextAction: "Use daily volatility to plan short-term staffing, replenishment, and promotion timing.",
        kpis: [
          { label: "Total Orders", value: formatNumber(totalOrders), delta: "Completed orders", tone: "blue" },
          { label: "Average Daily Orders", value: formatNumber(totalOrders / Math.max(1, dailyRows.length)), delta: `${formatNumber(dailyRows.length)} dates`, tone: "green" },
          { label: "Highest Revenue Date", value: highestRevenueDate?.date ?? "N/A", delta: formatCompactCurrency(highestRevenueDate?.revenue ?? 0), tone: "purple" },
          { label: "Lowest Order Date", value: lowestOrderDate?.date ?? "N/A", delta: `${formatNumber(lowestOrderDate?.orders ?? 0)} Orders`, tone: "orange" },
        ],
        mainChart: dailyRows.map((item) => ({ name: item.date, value: item.orders })),
        supportA: dailyRows.map((item) => ({ name: item.date, value: item.revenue })),
        supportB: dailyRows.map((item) => ({ name: item.date, value: item.averageOrderValue })),
        table: dailyRows.map((item) => ({
          Date: item.date,
          Weekday: item.weekday,
          Orders: formatNumber(item.orders),
          Revenue: formatCompactCurrency(item.revenue),
          "Average Order Value": formatCurrency(item.averageOrderValue),
          Status: item.orders >= totalOrders / Math.max(1, dailyRows.length) * 1.15 ? "Peak" : item.orders < totalOrders / Math.max(1, dailyRows.length) * 0.75 ? "Low Demand" : "Normal",
        })),
        alerts: [
          `${highestRevenueDate?.date ?? "The top date"} generated the highest revenue; review stock availability before comparable peaks.`,
          `${lowestOrderDate?.date ?? "The lowest order date"} had the lowest order volume; use similar days for replenishment.`,
          `Average daily demand is ${formatNumber(totalOrders / Math.max(1, dailyRows.length))} orders in the selected period.`,
        ],
      };
    }
    if (ordersByDayMode === "today") {
      const todayRows = filteredOrderLines(today, today);
      const eligibleBranches = branches.filter((branch) => (filters.city === "All" || branch.city === filters.city) && (effectiveBranch === "All" || branch.id === effectiveBranch));
      const demoBranches = eligibleBranches.length > 0 ? eligibleBranches : branches;
      const eligibleProducts = products.filter((product) => (filters.category === "All" || product.category === filters.category) && (filters.product === "All" || product.id === filters.product) && (filters.supplier === "All" || product.supplierId === filters.supplier));
      const demoProducts = eligibleProducts.length > 0 ? eligibleProducts : products;
      const demoSchedule = [
        { time: "09:15 AM", hour: 9, quantity: 12, branchOffset: 2, productOffset: 0 },
        { time: "10:40 AM", hour: 10, quantity: 8, branchOffset: 0, productOffset: 3 },
        { time: "11:30 AM", hour: 11, quantity: 15, branchOffset: 4, productOffset: 5 },
        { time: "12:20 PM", hour: 12, quantity: 6, branchOffset: 1, productOffset: 8 },
        { time: "01:45 PM", hour: 13, quantity: 18, branchOffset: 3, productOffset: 11 },
        { time: "03:10 PM", hour: 15, quantity: 10, branchOffset: 0, productOffset: 14 },
        { time: "05:35 PM", hour: 17, quantity: 14, branchOffset: 1, productOffset: 17 },
        { time: "07:05 PM", hour: 19, quantity: 9, branchOffset: 2, productOffset: 20 },
      ];
      const demoOrders = demoSchedule.map((seed, index) => {
        const branch = demoBranches[seed.branchOffset % demoBranches.length];
        const product = demoProducts[seed.productOffset % demoProducts.length];
        const value = Math.round(seed.quantity * product.price * (1.05 + (index % 3) * 0.08));
        return {
          time: seed.time,
          hour: seed.hour,
          orderId: `ORD-${1024 + index}`,
          branch,
          product,
          quantity: seed.quantity,
          value,
        };
      });
      const actualOrders = todayRows.flatMap((row, index) =>
        row.matchingItems.map((item) => {
          const product = productById.get(item.productId)!;
          const branch = branchById.get(row.order.branchId)!;
          return {
            time: format(new Date(`${today}T${String(row.order.hour).padStart(2, "0")}:15:00`), "hh:mm a"),
            hour: row.order.hour,
            orderId: row.order.id,
            branch,
            product,
            quantity: item.quantity,
            value: Math.round(item.quantity * item.unitPrice),
            sequence: index,
          };
        }),
      );
      const activityRows = actualOrders.length > 0 ? actualOrders.slice(0, 10) : demoOrders;
      const todayRevenue = activityRows.reduce((sum, row) => sum + row.value, 0);
      const todayOrders = new Set(activityRows.map((row) => row.orderId)).size;
      const todayUnits = activityRows.reduce((sum, row) => sum + row.quantity, 0);
      const activeBranches = new Set(activityRows.map((row) => row.branch.id)).size;
      const hours = Array.from({ length: 15 }, (_, index) => 8 + index);
      const hourlyRows = hours.map((hour) => {
        const rows = activityRows.filter((row) => row.hour === hour);
        return {
          hour: `${hour}:00`,
          orders: new Set(rows.map((row) => row.orderId)).size,
          revenue: rows.reduce((sum, row) => sum + row.value, 0),
        };
      });
      const productMap = new Map<string, { name: string; revenue: number; units: number }>();
      const branchMap = new Map<string, { name: string; orders: Set<string> }>();
      activityRows.forEach((row) => {
        const productCurrent = productMap.get(row.product.id) ?? { name: row.product.name, revenue: 0, units: 0 };
        productCurrent.revenue += row.value;
        productCurrent.units += row.quantity;
        productMap.set(row.product.id, productCurrent);
        const branchCurrent = branchMap.get(row.branch.id) ?? { name: row.branch.name, orders: new Set<string>() };
        branchCurrent.orders.add(row.orderId);
        branchMap.set(row.branch.id, branchCurrent);
      });
      const topProductsToday = Array.from(productMap.values()).sort((a, b) => b.units - a.units || b.revenue - a.revenue).slice(0, 5);
      const branchActivity = Array.from(branchMap.values()).map((item) => ({ name: item.name, value: item.orders.size })).sort((a, b) => b.value - a.value);
      return {
        title: "Today",
        description: `Today, ${format(parseISO(today), "MMMM d, yyyy")}. Operational view for the current trading day.`,
        mainChartTitle: "Orders by Hour",
        supportATitle: "Revenue by Hour",
        supportBTitle: "Today Top Products",
        tableTitle: "Today Activity Table",
        nextAction: "Use current trading pace to protect stock and staffing before closing.",
        kpis: [
          { label: "Orders Today", value: formatNumber(todayOrders), delta: "Current day", tone: "blue" },
          { label: "Revenue Today", value: formatCompactCurrency(todayRevenue), delta: "Current day revenue", tone: "green" },
          { label: "Units Sold Today", value: formatNumber(todayUnits), delta: "Units sold today", tone: "purple" },
          { label: "Active Branches", value: formatNumber(activeBranches), delta: "Branches with completed orders", tone: "orange" },
        ],
        mainChart: hourlyRows.map((row) => ({ name: row.hour, value: row.orders })),
        supportA: hourlyRows.map((row) => ({ name: row.hour, value: row.revenue })),
        supportB: topProductsToday.map((item) => ({ name: item.name, value: item.units, secondary: item.revenue })),
        supportC: branchActivity,
        supportD: topProductsToday.map((item) => ({ name: item.name, value: item.revenue, secondary: item.units })),
        table: activityRows.map((row) => ({
          Time: row.time,
          "Order ID": row.orderId,
          Branch: row.branch.name,
          Product: row.product.name,
          Quantity: formatNumber(row.quantity),
          "Order Value": formatCompactCurrency(row.value),
        })),
        alerts: [
          `${topProductsToday[0]?.name ?? "Top product"} is the highest-volume product today.`,
          `${branchActivity[0]?.name ?? "Top branch"} generated the strongest branch activity.`,
          "Evening activity remains important for staffing and stock protection.",
        ],
      };
    }
    if (ordersByDayMode === "weekly") {
      const weekMap = new Map<string, { weekStart: string; weekEnd: string; orders: Set<string>; revenue: number }>();
      weekdaySourceRows.forEach(({ order, matchingItems }) => {
        const weekStartDate = startOfWeek(parseISO(order.date), { weekStartsOn: 0 });
        const weekEndDate = endOfWeek(parseISO(order.date), { weekStartsOn: 0 });
        const weekStart = format(weekStartDate, "yyyy-MM-dd");
        const weekEnd = format(weekEndDate, "yyyy-MM-dd");
        const current = weekMap.get(weekStart) ?? { weekStart, weekEnd, orders: new Set<string>(), revenue: 0 };
        current.orders.add(order.id);
        current.revenue += matchingItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        weekMap.set(weekStart, current);
      });
      const weeklyRows = Array.from(weekMap.values())
        .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
        .map((item, index) => {
          const variation = 0.94 + ((index * 5) % 9) * 0.018;
          const revenue = Math.round(item.revenue * variation);
          const ordersCount = item.orders.size;
          const isPartial = parseISO(item.weekEnd) > parseISO(today);
          return {
            week: `Week of ${format(parseISO(item.weekStart), "MMM d")}`,
            weekStart: item.weekStart,
            weekEnd: item.weekEnd,
            isPartial,
            orders: ordersCount,
            revenue,
            averageOrderValue: Math.round(revenue / Math.max(1, ordersCount)),
          };
        });
      const totalOrders = weeklyRows.reduce((sum, item) => sum + item.orders, 0);
      const averageWeeklyOrders = totalOrders / Math.max(1, weeklyRows.length);
      const bestRevenueWeek = [...weeklyRows].sort((a, b) => b.revenue - a.revenue)[0];
      const lowestDemandWeek = [...weeklyRows].sort((a, b) => a.orders - b.orders)[0];
      return {
        title: "Orders Analysis",
        description: "Weekly Performance Trend - shows how business is performing week by week using Sunday-to-Saturday weeks.",
        mainChartTitle: "Orders by Week",
        supportATitle: "Revenue by Week",
        supportBTitle: "Average Order Value by Week",
        tableTitle: "Weekly Performance Table",
        nextAction: "Use weekly movement to plan replenishment, promotions, and staffing across complete operating weeks.",
        kpis: [
          { label: "Total Orders", value: formatNumber(totalOrders), delta: "Completed orders", tone: "blue" },
          { label: "Best Revenue Week", value: bestRevenueWeek?.week ?? "N/A", delta: formatCompactCurrency(bestRevenueWeek?.revenue ?? 0), tone: "green" },
          { label: "Lowest Demand Week", value: lowestDemandWeek?.week ?? "N/A", delta: `${formatNumber(lowestDemandWeek?.orders ?? 0)} Orders`, tone: "orange" },
          { label: "Average Weekly Orders", value: formatNumber(averageWeeklyOrders), delta: `${formatNumber(weeklyRows.length)} weeks`, tone: "purple" },
        ],
        mainChart: weeklyRows.map((item) => ({ name: item.week, value: item.orders })),
        supportA: weeklyRows.map((item) => ({ name: item.week, value: item.revenue })),
        supportB: weeklyRows.map((item) => ({ name: item.week, value: item.averageOrderValue })),
        table: weeklyRows.map((item) => ({
          Week: item.week,
          "Week Start": format(parseISO(item.weekStart), "MMM d, yyyy"),
          "Week End": format(parseISO(item.weekEnd), "MMM d, yyyy"),
          Orders: formatNumber(item.orders),
          Revenue: formatCompactCurrency(item.revenue),
          "Average Order Value": formatCurrency(item.averageOrderValue),
          Status: item.isPartial ? "Partial Week" : item.orders >= averageWeeklyOrders * 1.15 ? "Peak Week" : item.orders < averageWeeklyOrders * 0.75 ? "Low Demand" : item.orders >= averageWeeklyOrders ? "Strong" : "Normal",
        })),
        alerts: [
          `${bestRevenueWeek?.week ?? "The best week"} generated the highest revenue; protect inventory before similar periods.`,
          `${lowestDemandWeek?.week ?? "The lowest-demand week"} had the lowest order volume; use comparable weeks for training and replenishment.`,
          `Average weekly demand is ${formatNumber(averageWeeklyOrders)} orders across the selected period.`,
        ],
      };
    }
    const weekdaySummary = weekdays.map((weekday, dayIndex) => {
      const dayRows = weekdaySourceRows.filter(({ order }) => getDay(parseISO(order.date)) === dayIndex);
      const demandMultiplier = weekdayDemandMultipliers[dayIndex] ?? 1;
      const revenueMultiplier = weekdayRevenueMultipliers[dayIndex] ?? 1;
      const orderCount = Math.round(dayRows.length * demandMultiplier);
      const revenue = dayRows.reduce(
        (sum, row) => sum + row.matchingItems.reduce((lineSum, item) => lineSum + item.quantity * item.unitPrice * revenueMultiplier, 0),
        0,
      );
      return {
        weekday,
        orders: orderCount,
        revenue: Math.round(revenue),
        averageOrderValue: Math.round(revenue / Math.max(1, orderCount)),
      };
    });
    const weekdayTotalOrders = weekdaySummary.reduce((sum, item) => sum + item.orders, 0);
    const busiestDay = [...weekdaySummary].sort((a, b) => b.orders - a.orders)[0];
    const highestRevenueDay = [...weekdaySummary].sort((a, b) => b.revenue - a.revenue)[0];
    const lowestDemandDay = [...weekdaySummary].sort((a, b) => a.orders - b.orders)[0];
    const table = weekdaySummary.map((item) => {
      const orderShare = (item.orders / Math.max(1, weekdayTotalOrders)) * 100;
      return {
        Weekday: item.weekday,
        Orders: formatNumber(item.orders),
        Revenue: formatCompactCurrency(item.revenue),
        "Average Order Value": formatCurrency(item.averageOrderValue),
        "Order Share %": formatSharePercent(orderShare),
        Status: weekdayStatus(orderShare),
      };
    });
    return {
      title: "Orders Analysis",
      description: "Weekday View aggregates all transactions by day of week (Sunday-Saturday) across the selected period to reveal recurring demand patterns.",
      mainChartTitle: "Orders by Weekday",
      supportATitle: "Revenue by Weekday",
      supportBTitle: "Average Order Value by Weekday",
      tableTitle: "Weekday Demand Analysis",
      nextAction: "Align pharmacist coverage, delivery capacity, and promotion timing to the strongest weekdays.",
      kpis: [
        { label: "Total Orders", value: formatNumber(weekdayTotalOrders), delta: "Completed orders", tone: "blue" },
        { label: "Busiest Weekday", value: busiestDay?.weekday ?? "N/A", delta: `${formatNumber(busiestDay?.orders ?? 0)} Orders`, tone: "green" },
        { label: "Highest Revenue Weekday", value: highestRevenueDay?.weekday ?? "N/A", delta: formatCompactCurrency(highestRevenueDay?.revenue ?? 0), tone: "purple" },
        { label: "Lowest Demand Weekday", value: lowestDemandDay?.weekday ?? "N/A", delta: "Best for replenishment", tone: "orange" },
      ],
      mainChart: weekdaySummary.map((item) => ({ name: String(item.weekday), value: Number(item.orders) })),
      supportA: weekdaySummary.map((item) => ({ name: String(item.weekday), value: Number(item.revenue) })),
      supportB: weekdaySummary.map((item) => ({ name: String(item.weekday), value: Number(item.averageOrderValue) })),
      table,
      alerts: [
        `${busiestDay?.weekday ?? "Peak day"} has the highest order volume; schedule additional staff.`,
        `${highestRevenueDay?.weekday ?? "Top revenue day"} generates the highest revenue; protect stock availability before peak demand.`,
        `${lowestDemandDay?.weekday ?? "Lowest demand day"} has the lowest demand; use it for replenishment and team training.`,
      ],
    };
  }

  if (title === "Orders By Hour") {
    const table = Array.from({ length: 15 }, (_, index) => {
      const hour = 8 + index;
      const hourOrders = scopedOrders.filter((order) => order.hour === hour);
      const hourTotal = totals(hourOrders);
      return { hour: `${hour}:00`, orders: hourOrders.length, revenue: Math.round(hourTotal.revenue), averageOrderValue: Math.round(hourTotal.revenue / Math.max(1, hourOrders.length)) };
    });
    const peak = [...table].sort((a, b) => Number(b.orders) - Number(a.orders))[0];
    return {
      title,
      description: "Identifies peak operating hours so managers can align staffing, delivery capacity, and checkout coverage.",
      mainChartTitle: "Orders by Hour",
      supportATitle: "Revenue by Hour",
      supportBTitle: "Average Order Value by Hour",
      tableTitle: "Hourly Performance Table",
      nextAction: "Staff the prescription counter and dispatch operation around the peak hour window.",
      kpis: [
        ...baseKpis.slice(0, 3),
        { label: "Peak Hour", value: String(peak?.hour ?? "N/A"), delta: `${peak?.orders ?? 0} orders`, tone: "orange" },
      ],
      mainChart: table.map((item) => ({ name: String(item.hour), value: Number(item.orders) })),
      supportA: table.map((item) => ({ name: String(item.hour), value: Number(item.revenue) })),
      supportB: table.map((item) => ({ name: String(item.hour), value: Number(item.averageOrderValue) })),
      table,
      alerts: [`Peak hour is ${peak?.hour ?? "N/A"}.`, `${peak?.orders ?? 0} orders occurred in the peak hour.`, `Review queue coverage during afternoon and evening peaks.`],
    };
  }

  return genericReport("Sales", title, filters);
}

function genericReport(section: string, title: string, filters: FilterState): ReportResult {
  const scopedOrders = filteredOrders(filters);
  const scopedRx = filteredPrescriptions(filters);
  const scopedInventory = filteredInventory(filters);
  const total = totals(scopedOrders);
  const inventoryValue = scopedInventory.reduce((sum, batch) => sum + batch.quantity * (productById.get(batch.productId)?.cost ?? 0), 0);
  const lowStock = scopedInventory.filter((batch) => batch.quantity <= batch.reorderPoint).length;
  const grossProfit = total.revenue - total.cost;
  const focus = `${section} ${title}`.toLowerCase();
  const main =
    focus.includes("branch")
      ? topGroups(scopedOrders.map((order) => ({ name: branchById.get(order.branchId)?.name ?? "Unknown", value: order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) })))
      : focus.includes("category")
        ? topGroups(scopedOrders.flatMap((order) => order.items.map((item) => ({ name: productById.get(item.productId)?.category ?? "Unknown", value: item.quantity * item.unitPrice }))))
        : focus.includes("hour")
          ? topGroups(scopedOrders.map((order) => ({ name: `${order.hour}:00`, value: order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) })), 12)
          : focus.includes("doctor")
            ? topGroups(scopedRx.map((rx) => ({ name: doctorById.get(rx.doctorId)?.name ?? "Unknown", value: rx.value })))
            : trend(scopedOrders);
  const supportA = topGroups(scopedOrders.flatMap((order) => order.items.map((item) => ({ name: productById.get(item.productId)?.category ?? "Unknown", value: item.quantity * item.unitPrice }))), 6);
  const supportB = topGroups(scopedOrders.map((order) => ({ name: order.channel, value: order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) })), 4);
  const table = focus.includes("supplier")
    ? suppliers.map((supplier) => ({ supplier: supplier.name, fillRate: `${supplier.reliability}%`, purchaseVolume: Math.round(inventoryValue / suppliers.length), risk: supplier.reliability < 84 ? "Elevated" : "Stable" }))
    : focus.includes("prescription") || focus.includes("doctor")
      ? scopedRx.slice(0, 20).map((rx) => ({ prescription: rx.id.toUpperCase(), doctor: doctorById.get(rx.doctorId)?.name ?? "", status: rx.status, branch: branchById.get(rx.branchId)?.name ?? "", value: Math.round(rx.value) }))
      : tableFromProducts(scopedOrders);
  return {
    title,
    description: `${title} monitors operational performance, commercial momentum, and risk signals for pharmaceutical decision makers.`,
    kpis: [
      { label: "Revenue", value: formatCurrency(total.revenue), delta: formatPercent(8.4), tone: "green" },
      { label: "Orders", value: formatNumber(scopedOrders.length), delta: formatPercent(5.9), tone: "blue" },
      { label: "Gross Profit", value: formatCurrency(grossProfit), delta: formatPercent(6.7), tone: "purple" },
      { label: section === "Inventory" ? "Low Stock SKUs" : "Inventory Value", value: section === "Inventory" ? formatNumber(lowStock) : formatCurrency(inventoryValue), delta: section === "Inventory" ? "-3.2%" : "+4.1%", tone: lowStock > 120 ? "red" : "orange" },
    ],
    mainChart: main,
    supportA,
    supportB,
    table,
    alerts: [
      `${lowStock} batches are at or below reorder point.`,
      `${scopedRx.filter((rx) => rx.status !== "Completed").length} prescriptions need follow-up.`,
      `Target achievement is ${formatPercent((total.revenue / Math.max(1, monthlyTargets.reduce((sum, target) => sum + target.target, 0))) * 100 - 100)}.`,
    ],
  };
}

export function getOverviewReport(filters: FilterState): ReportResult {
  const report = genericReport("Overview", "Executive Dashboard", filters);
  const scopedOrders = filteredOrders(filters);
  const scopedInventory = filteredInventory(filters);
  const scopedRx = filteredPrescriptions(filters);
  const total = totals(scopedOrders);
  return {
    ...report,
    description: "A board-level view of revenue, customers, inventory risk, prescription fulfillment, and branch performance.",
    kpis: [
      { label: "Revenue", value: formatCurrency(total.revenue), delta: "+8.4%", tone: "green" },
      { label: "Orders", value: formatNumber(scopedOrders.length), delta: "+5.9%", tone: "blue" },
      { label: "Customers", value: formatNumber(new Set(scopedOrders.map((order) => order.customerId)).size), delta: "+6.2%", tone: "purple" },
      { label: "Inventory Value", value: formatCurrency(scopedInventory.reduce((sum, batch) => sum + batch.quantity * (productById.get(batch.productId)?.cost ?? 0), 0)), delta: "+4.1%", tone: "orange" },
      { label: "Gross Profit", value: formatCurrency(total.revenue - total.cost), delta: "+6.7%", tone: "green" },
      { label: "Growth", value: "+8.4%", delta: `${scopedRx.length} Rx`, tone: "blue" },
    ],
    table: scopedOrders.slice(0, 12).map((order) => ({
      order: order.id.toUpperCase(),
      date: order.date,
      branch: branchById.get(order.branchId)?.name ?? "",
      customer: customerById.get(order.customerId)?.name ?? "",
      channel: order.channel,
      value: Math.round(order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)),
    })),
  };
}

export function getReport(section: string, title: string, filters: FilterState, ordersByDayMode: OrdersByDayMode = "weekday"): ReportResult {
  if (section === "Sales") {
    return buildSalesReport(title, filters, ordersByDayMode);
  }
  if (section === "Inventory") {
    return buildInventoryReport(title, filters);
  }
  return genericReport(section, title, filters);
}

export function getFilterOptions() {
  return {
    branches,
    products,
    suppliers,
    doctors,
    categories: dimensions.categories,
    cities: geoCities.map((city) => city.name),
    customerTypes: dimensions.customerTypes,
    prescriptionStatuses: dimensions.prescriptionStatuses,
    specialties: dimensions.specialties,
  };
}

export function getAvailableProducts(filters: Pick<FilterState, "category" | "branch">) {
  return products
    .filter((product) => filters.category === "All" || product.category === filters.category)
    .filter((product) => filters.branch === "All" || branchHasProductActivity(product.id, filters.branch))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getAvailableBranchesForCity(city: string) {
  return branches.filter((branch) => city === "All" || branch.city === city);
}

export function getAvailableAreasForCity(city: string) {
  return egyptAreas.filter((area) => city !== "All" && area.cityId === city);
}

export function getEntityDetails(kind: "product" | "customer" | "supplier" | "prescription", id: string): TableRow {
  if (kind === "product") {
    const product = productById.get(id) ?? products[0];
    return { Name: product.name, Category: product.category, Supplier: supplierById.get(product.supplierId)?.name ?? "", Price: product.price, Cost: Math.round(product.cost) };
  }
  if (kind === "customer") {
    const customer = customerById.get(id) ?? customers[0];
    return { Name: customer.name, Type: customer.type, City: customer.city, "Preferred Branch": branchById.get(customer.preferredBranchId)?.name ?? "" };
  }
  if (kind === "supplier") {
    const supplier = supplierById.get(id) ?? suppliers[0];
    return { Name: supplier.name, Country: supplier.country, Reliability: `${supplier.reliability}%` };
  }
  const rx = prescriptions.find((item) => item.id === id) ?? prescriptions[0];
  return { Prescription: rx.id.toUpperCase(), Doctor: doctorById.get(rx.doctorId)?.name ?? "", Status: rx.status, Value: Math.round(rx.value) };
}
