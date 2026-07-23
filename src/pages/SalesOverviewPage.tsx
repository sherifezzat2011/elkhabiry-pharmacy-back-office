import { useMemo, useState } from "react";
import { format, parseISO, startOfWeek } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { BarPanel, MainChart } from "@/components/Charts";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import {
  branchNameForOrder,
  mockSalesOrders,
  orderSourceConfig,
  orderTotal,
  patientNameForOrder,
  retailCategoryBySku,
  type SalesOrder,
} from "@/data/sales";
import { formatCompactCurrency, formatCurrency, formatNumber } from "@/lib/utils";

type TrendGrouping = "Daily" | "Weekly" | "Monthly";

function netOrderValue(order: SalesOrder) {
  return order.fulfillmentStatus === "Cancelled" ? 0 : orderTotal(order);
}

function aggregateSalesBy<T extends string>(orders: SalesOrder[], getKey: (order: SalesOrder) => T) {
  const map = new Map<T, number>();
  orders.forEach((order) => {
    const key = getKey(order);
    map.set(key, (map.get(key) ?? 0) + netOrderValue(order));
  });
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function salesByCategory(orders: SalesOrder[]) {
  const map = new Map<string, number>();
  orders.filter((order) => order.fulfillmentStatus !== "Cancelled").forEach((order) => {
    order.items.forEach((item) => {
      const category = retailCategoryBySku[item.sku] ?? "Personal Care";
      const lineValue = item.quantity * item.unitPrice - item.discount + item.tax;
      map.set(category, (map.get(category) ?? 0) + lineValue);
    });
  });
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function salesTrend(orders: SalesOrder[], grouping: TrendGrouping) {
  const map = new Map<string, number>();
  orders.forEach((order) => {
    const date = parseISO(order.date);
    const key = grouping === "Daily"
      ? format(date, "MMM d")
      : grouping === "Monthly"
        ? format(date, "MMM yyyy")
        : `Week of ${format(startOfWeek(date, { weekStartsOn: 0 }), "MMM d")}`;
    map.set(key, (map.get(key) ?? 0) + netOrderValue(order));
  });
  return Array.from(map.entries()).map(([name, value], index, rows) => ({
    name,
    value,
    secondary: rows[Math.max(0, index - 1)]?.[1] ?? value * 0.92,
  }));
}

function topPatients(orders: SalesOrder[]) {
  const map = new Map<string, { orders: number; spend: number }>();
  orders.filter((order) => order.fulfillmentStatus !== "Cancelled").forEach((order) => {
    const patient = patientNameForOrder(order);
    const current = map.get(patient) ?? { orders: 0, spend: 0 };
    map.set(patient, { orders: current.orders + 1, spend: current.spend + netOrderValue(order) });
  });
  return Array.from(map.entries())
    .map(([name, values]) => ({ name, ...values }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 8);
}

export function SalesOverviewPage() {
  const [grouping, setGrouping] = useState<TrendGrouping>("Weekly");
  const completedOrders = mockSalesOrders.filter((order) => order.fulfillmentStatus === "Completed");
  const pendingOrders = mockSalesOrders.filter((order) => !["Completed", "Cancelled"].includes(order.fulfillmentStatus));
  const refunds = mockSalesOrders.filter((order) => order.paymentStatus === "Refunded").length;
  const netSales = completedOrders.reduce((sum, order) => sum + netOrderValue(order), 0);
  const averageBasketValue = netSales / Math.max(1, completedOrders.length);
  const categoryRows = salesByCategory(mockSalesOrders);
  const branchRows = aggregateSalesBy(mockSalesOrders, branchNameForOrder);
  const patients = topPatients(mockSalesOrders);
  const sourceRows = aggregateSalesBy(mockSalesOrders, (order) => orderSourceConfig[order.orderSource].label);
  const topProducts = useMemo(() => {
    const map = new Map<string, number>();
    completedOrders.forEach((order) => {
      order.items.forEach((item) => {
        map.set(item.product, (map.get(item.product) ?? 0) + item.quantity * item.unitPrice);
      });
    });
    return Array.from(map.values()).sort((a, b) => b - a).slice(0, 4).reduce((sum, value) => sum + value, 0);
  }, [completedOrders]);

  const alerts = [
    `${pendingOrders.length} orders still pending fulfillment.`,
    `${refunds} refunds processed this week.`,
    `${sourceRows[0]?.name ?? "Mobile App"} is the strongest order source at ${formatCompactCurrency(sourceRows[0]?.value ?? 0)}.`,
    `Top 4 products generated ${((topProducts / Math.max(1, netSales)) * 100).toFixed(1)}% of completed sales.`,
  ].slice(0, 3);

  return (
    <div className="mx-auto max-w-[1680px] space-y-5">
      <section className="rounded-lg bg-brand-950 px-5 py-6 text-white shadow-soft lg:px-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-200">Reports</p>
        <h1 className="mt-3 text-2xl font-semibold md:text-4xl">Sales Overview</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-brand-50 md:text-base">
          Retail pharmacy sales summary for patient purchases, branch performance, and basket value.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Net Sales", formatCurrency(netSales), "Completed sales after refunds and cancellations"],
          ["Completed Orders", formatNumber(completedOrders.length), "Delivered or completed patient purchases"],
          ["Pending Orders", formatNumber(pendingOrders.length), "Purchases still being prepared or delivered"],
          ["Average Basket Value", formatCurrency(averageBasketValue), "Net sales divided by completed orders"],
        ].map(([label, value, description]) => (
          <Card key={label} className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </Card>
        ))}
      </section>

      <div className="flex flex-col gap-3 rounded-lg border border-slate-100 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Sales Trend</h2>
          <p className="mt-1 text-sm text-slate-500">Net sales over time for the selected filters.</p>
        </div>
        <Select className="md:w-40" value={grouping} onChange={(event) => setGrouping(event.target.value as TrendGrouping)}>
          <option>Daily</option>
          <option>Weekly</option>
          <option>Monthly</option>
        </Select>
      </div>
      <MainChart data={salesTrend(mockSalesOrders, grouping)} title={`${grouping} Net Sales`} />

      <section className="grid gap-4 xl:grid-cols-3">
        <BarPanel data={categoryRows} title="Sales by Category" />
        <BarPanel data={branchRows} title="Sales by Branch" />
        <Card className="p-5">
          <h2 className="text-base font-semibold text-slate-950">Top Patients</h2>
          <div className="mt-4 space-y-3">
            {patients.map((patient, index) => (
              <div key={patient.name} className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <span className="font-medium text-slate-800">{index + 1}. {patient.name}</span>
                <span className="shrink-0 text-slate-600">{patient.orders} Orders - {formatCurrency(patient.spend)}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Card className="p-5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <h2 className="text-base font-semibold text-slate-950">Executive Alerts</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {alerts.map((alert) => (
            <div key={alert} className="rounded-lg border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-medium text-orange-800">
              {alert}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
