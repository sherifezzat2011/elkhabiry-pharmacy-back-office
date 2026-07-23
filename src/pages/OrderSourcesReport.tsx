import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { endOfWeek, format, isAfter, isBefore, parseISO, startOfWeek, subDays } from "date-fns";
import { Download, Eye, MoreHorizontal, RefreshCcw } from "lucide-react";
import { BarPanel } from "@/components/Charts";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import {
  branchNameForOrder,
  mockSalesCustomers,
  mockSalesOrders,
  orderSourceConfig,
  orderTotal,
  patientNameForOrder,
  type OrderSource,
  type SalesOrder,
} from "@/data/sales";
import { cn, formatCurrency, formatNumber, formatSharePercent } from "@/lib/utils";

type QuickDate = "Today" | "This Week" | "Last 30 Days" | "Last 90 Days" | "This Year" | "Custom";

type SourceFilters = {
  quickDate: QuickDate;
  dateFrom: string;
  dateTo: string;
  source: "All" | OrderSource;
  patient: string;
  city: string;
  status: string;
};

type SourceRow = {
  source: OrderSource;
  label: string;
  orders: number;
  sales: number;
  completed: number;
  cancelled: number;
  completionRate: number;
};

const defaultFilters: SourceFilters = {
  quickDate: "Last 90 Days",
  dateFrom: "",
  dateTo: "",
  source: "All",
  patient: "",
  city: "All",
  status: "All",
};

function customerFor(order: SalesOrder) {
  return mockSalesCustomers.find((customer) => customer.id === order.customerId) ?? mockSalesCustomers[0];
}

function rangeFor(label: QuickDate) {
  const today = new Date("2026-07-21T12:00:00");
  if (label === "Today") return { from: format(today, "yyyy-MM-dd"), to: format(today, "yyyy-MM-dd") };
  if (label === "This Week") return { from: format(startOfWeek(today, { weekStartsOn: 0 }), "yyyy-MM-dd"), to: format(endOfWeek(today, { weekStartsOn: 0 }), "yyyy-MM-dd") };
  if (label === "Last 30 Days") return { from: format(subDays(today, 29), "yyyy-MM-dd"), to: format(today, "yyyy-MM-dd") };
  if (label === "Last 90 Days") return { from: format(subDays(today, 89), "yyyy-MM-dd"), to: format(today, "yyyy-MM-dd") };
  if (label === "This Year") return { from: "2026-01-01", to: format(today, "yyyy-MM-dd") };
  return { from: "", to: "" };
}

function isInRange(orderDate: string, filters: SourceFilters) {
  const range = filters.quickDate === "Custom" ? { from: filters.dateFrom, to: filters.dateTo } : rangeFor(filters.quickDate);
  const date = parseISO(format(parseISO(orderDate), "yyyy-MM-dd"));
  return (!range.from || !isBefore(date, parseISO(range.from))) && (!range.to || !isAfter(date, parseISO(range.to)));
}

function filterOrders(orders: SalesOrder[], filters: SourceFilters) {
  return orders.filter((order) => {
    const patient = patientNameForOrder(order).toLowerCase();
    const customer = customerFor(order);
    return (
      isInRange(order.date, filters) &&
      (filters.source === "All" || order.orderSource === filters.source) &&
      (!filters.patient || patient.includes(filters.patient.toLowerCase()) || customer.phone.includes(filters.patient)) &&
      (filters.city === "All" || order.city === filters.city) &&
      (filters.status === "All" || order.fulfillmentStatus === filters.status)
    );
  });
}

function buildSourceRows(orders: SalesOrder[]): SourceRow[] {
  return (Object.keys(orderSourceConfig) as OrderSource[]).map((source) => {
    const sourceOrders = orders.filter((order) => order.orderSource === source);
    const sales = sourceOrders.reduce((sum, order) => sum + orderTotal(order), 0);
    const completed = sourceOrders.filter((order) => order.fulfillmentStatus === "Completed").length;
    const cancelled = sourceOrders.filter((order) => order.fulfillmentStatus === "Cancelled").length;
    return {
      source,
      label: orderSourceConfig[source].label,
      orders: sourceOrders.length,
      sales,
      completed,
      cancelled,
      completionRate: (completed / Math.max(1, sourceOrders.length)) * 100,
    };
  });
}

function downloadCsv(rows: Record<string, string | number>[], filename: string) {
  const keys = Object.keys(rows[0] ?? {});
  const csv = [keys.join(","), ...rows.map((row) => keys.map((key) => `"${String(row[key] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function SourceBadge({ source }: { source: OrderSource }) {
  const tones: Record<OrderSource, string> = {
    mobile_app: "bg-teal-50 text-teal-700 ring-teal-100",
    website: "bg-blue-50 text-blue-700 ring-blue-100",
    whatsapp: "bg-green-50 text-green-700 ring-green-100",
    call_center: "bg-orange-50 text-orange-700 ring-orange-100",
    walk_in: "bg-slate-100 text-slate-700 ring-slate-200",
    talabat: "bg-red-50 text-red-700 ring-red-100",
    chefaa: "bg-purple-50 text-purple-700 ring-purple-100",
    vezeeta: "bg-cyan-50 text-cyan-700 ring-cyan-100",
    yodawy: "bg-amber-50 text-amber-700 ring-amber-100",
  };
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1", tones[source])}>{orderSourceConfig[source].label}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const tone = status === "Completed" ? "bg-brand-50 text-brand-700 ring-brand-100" : status === "Cancelled" ? "bg-red-50 text-red-700 ring-red-100" : "bg-orange-50 text-orange-700 ring-orange-100";
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1", tone)}>{status}</span>;
}

function KpiCard({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </Card>
  );
}

export function OrderSourcesReportPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<SourceFilters>(defaultFilters);
  const [toast, setToast] = useState("");

  const filteredOrders = useMemo(() => filterOrders(mockSalesOrders, filters), [filters]);
  const sourceRows = useMemo(() => buildSourceRows(filteredOrders), [filteredOrders]);
  const totalOrders = filteredOrders.length;
  const totalSales = filteredOrders.reduce((sum, order) => sum + orderTotal(order), 0);
  const cancelledOrders = filteredOrders.filter((order) => order.fulfillmentStatus === "Cancelled").length;
  const topSource = sourceRows.filter((row) => row.orders > 0).sort((a, b) => b.sales - a.sales)[0];
  const cityOptions = Array.from(new Set(mockSalesOrders.map((order) => order.city))).sort();

  const exportFilteredOrders = () => {
    downloadCsv(
      filteredOrders.map((order) => ({
        "Order Number": order.orderNumber,
        "Patient Name": patientNameForOrder(order),
        Branch: branchNameForOrder(order),
        Source: orderSourceConfig[order.orderSource].label,
        Date: format(parseISO(order.date), "dd MMM yyyy"),
        City: order.city,
        Total: formatCurrency(orderTotal(order)),
        Status: order.fulfillmentStatus,
      })),
      "filtered-order-sources.csv",
    );
    setToast("Filtered orders exported locally.");
  };

  return (
    <div className="mx-auto max-w-[1680px] space-y-5">
      <section className="rounded-lg bg-brand-950 px-5 py-6 text-white shadow-soft lg:px-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-200">Reports</p>
            <h1 className="mt-3 text-2xl font-semibold md:text-4xl">Order Sources</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-brand-50 md:text-base">Analyze how patients place pharmacy orders and which channels generate the most sales.</p>
            <p className="mt-2 text-xs text-brand-100">Last updated: July 21, 2026, 12:00 PM</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={exportFilteredOrders}><Download className="h-4 w-4" />Export Report</Button>
            <Button onClick={() => setToast("Report refreshed locally.")}><RefreshCcw className="h-4 w-4" />Refresh</Button>
          </div>
        </div>
      </section>

      {toast ? <div className="rounded-lg bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700">{toast}</div> : null}

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase text-slate-500">Date Range</span>
            <Select value={filters.quickDate} onChange={(event) => setFilters((previous) => ({ ...previous, quickDate: event.target.value as QuickDate }))}>
              {["Today", "This Week", "Last 30 Days", "Last 90 Days", "This Year", "Custom"].map((item) => <option key={item}>{item}</option>)}
            </Select>
          </label>
          {filters.quickDate === "Custom" ? (
            <>
              <label className="space-y-1.5"><span className="text-xs font-semibold uppercase text-slate-500">Date From</span><input className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" type="date" value={filters.dateFrom} onChange={(event) => setFilters((previous) => ({ ...previous, dateFrom: event.target.value }))} /></label>
              <label className="space-y-1.5"><span className="text-xs font-semibold uppercase text-slate-500">Date To</span><input className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" type="date" value={filters.dateTo} onChange={(event) => setFilters((previous) => ({ ...previous, dateTo: event.target.value }))} /></label>
            </>
          ) : null}
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase text-slate-500">Order Source</span>
            <Select value={filters.source} onChange={(event) => setFilters((previous) => ({ ...previous, source: event.target.value as SourceFilters["source"] }))}>
              <option>All</option>
              {(Object.keys(orderSourceConfig) as OrderSource[]).map((source) => <option key={source} value={source}>{orderSourceConfig[source].label}</option>)}
            </Select>
          </label>
          <label className="space-y-1.5"><span className="text-xs font-semibold uppercase text-slate-500">Patient</span><input className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={filters.patient} onChange={(event) => setFilters((previous) => ({ ...previous, patient: event.target.value }))} /></label>
          <label className="space-y-1.5"><span className="text-xs font-semibold uppercase text-slate-500">City</span><Select value={filters.city} onChange={(event) => setFilters((previous) => ({ ...previous, city: event.target.value }))}><option>All</option>{cityOptions.map((city) => <option key={city}>{city}</option>)}</Select></label>
          <label className="space-y-1.5"><span className="text-xs font-semibold uppercase text-slate-500">Order Status</span><Select value={filters.status} onChange={(event) => setFilters((previous) => ({ ...previous, status: event.target.value }))}><option>All</option><option>Pending</option><option>Confirmed</option><option>Processing</option><option>Ready for Dispatch</option><option>Completed</option><option>Cancelled</option></Select></label>
          <div className="flex items-end"><Button onClick={() => setFilters(defaultFilters)}>Clear Filters</Button></div>
        </div>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Orders" value={formatNumber(totalOrders)} description="Patient purchases in scope" />
        <KpiCard label="Total Sales" value={formatCurrency(totalSales)} description="Sales from filtered orders" />
        <KpiCard label="Top Source" value={topSource?.label ?? "No orders"} description={topSource ? `${formatCurrency(topSource.sales)} sales` : "No source activity"} />
        <KpiCard label="Overall Cancellation Rate" value={formatSharePercent((cancelledOrders / Math.max(1, totalOrders)) * 100)} description={`${formatNumber(cancelledOrders)} cancelled orders`} />
      </section>

      <BarPanel data={sourceRows.map((row) => ({ name: row.label, value: row.sales }))} title="Sales by Source" valueFormatter={formatCurrency} />

      <Card>
        <div className="border-b border-slate-100 p-4">
          <h2 className="font-semibold text-slate-950">Source Performance Table</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[820px] w-full text-center text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr><th className="px-4 py-3 text-center">Source</th><th className="text-center">Orders</th><th className="text-center">Total Sales</th><th className="text-center">Completed</th><th className="text-center">Cancelled</th><th className="text-center">Completion Rate</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sourceRows.map((row) => (
                <tr key={row.source} className="cursor-pointer hover:bg-brand-50/40" onClick={() => setFilters((previous) => ({ ...previous, source: row.source }))}>
                  <td className="px-4 py-3"><span className="inline-flex justify-center"><SourceBadge source={row.source} /></span></td>
                  <td>{row.orders}</td>
                  <td className="whitespace-nowrap font-semibold">{formatCurrency(row.sales)}</td>
                  <td>{row.completed}</td>
                  <td>{row.cancelled}</td>
                  <td>{formatSharePercent(row.completionRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="border-b border-slate-100 p-4">
          <h2 className="font-semibold text-slate-950">Filtered Orders</h2>
          <p className="text-sm text-slate-500">Orders matching the active source and report filters.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-center text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr><th className="px-4 py-3 text-center">Order Number</th><th className="text-center">Patient Name</th><th className="text-center">Branch</th><th className="text-center">Source</th><th className="text-center">Date</th><th className="text-center">Total</th><th className="text-center">Status</th><th className="text-center">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.slice(0, 12).map((order) => (
                <tr key={order.id} className="hover:bg-brand-50/40">
                  <td className="px-4 py-3 font-semibold text-slate-900">{order.orderNumber}</td>
                  <td className="font-medium text-slate-800">{patientNameForOrder(order)}</td>
                  <td>{branchNameForOrder(order)}</td>
                  <td><span className="inline-flex justify-center"><SourceBadge source={order.orderSource} /></span></td>
                  <td className="whitespace-nowrap">{format(parseISO(order.date), "dd MMM yyyy")}</td>
                  <td className="whitespace-nowrap font-semibold">{formatCurrency(orderTotal(order))}</td>
                  <td><span className="inline-flex justify-center"><StatusBadge status={order.fulfillmentStatus} /></span></td>
                  <td>
                    <div className="flex items-center justify-center gap-1">
                      <Button size="icon" variant="ghost" aria-label={`View ${order.orderNumber}`} title="View" onClick={() => navigate(`/sales/orders/${order.id}`)}><Eye className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label={`More actions for ${order.orderNumber}`} title="More actions"><MoreHorizontal className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredOrders.length === 0 ? <div className="p-8 text-center text-sm text-slate-500">No orders match the active source filters.</div> : null}
      </Card>
    </div>
  );
}

export function OrderSourceDetailsPage() {
  const { source } = useParams();
  const navigate = useNavigate();
  const sourceId = (source && source in orderSourceConfig ? source : "mobile_app") as OrderSource;
  const orders = mockSalesOrders.filter((order) => order.orderSource === sourceId);
  const row = buildSourceRows(orders).find((item) => item.source === sourceId) ?? buildSourceRows(mockSalesOrders)[0];
  const topPatients = Array.from(
    orders.reduce((map, order) => {
      const patient = patientNameForOrder(order);
      const current = map.get(patient) ?? { orders: 0, sales: 0 };
      map.set(patient, { orders: current.orders + 1, sales: current.sales + orderTotal(order) });
      return map;
    }, new Map<string, { orders: number; sales: number }>()),
  )
    .map(([name, values]) => ({ name, ...values }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-[1680px] space-y-5">
      <section className="rounded-lg bg-brand-950 px-5 py-6 text-white shadow-soft lg:px-7">
        <Button onClick={() => navigate("/reports/order-sources")}><RefreshCcw className="h-4 w-4" />Back to Order Sources</Button>
        <h1 className="mt-4 text-3xl font-semibold">{orderSourceConfig[sourceId].label}</h1>
        <p className="mt-2 text-brand-50">Source drill-down for patients, pharmacy branches, products, and recent orders.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Orders" value={formatNumber(row.orders)} description="Orders from this source" />
        <KpiCard label="Total Sales" value={formatCurrency(row.sales)} description="Revenue from this source" />
        <KpiCard label="Completed" value={formatNumber(row.completed)} description="Completed patient purchases" />
        <KpiCard label="Completion Rate" value={formatSharePercent(row.completionRate)} description="Completed order share" />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="p-5"><h2 className="font-semibold text-slate-950">Top Patients</h2>{topPatients.map((item, index) => <div key={item.name} className="mt-3 flex justify-between gap-4 text-sm"><span>{index + 1}. {item.name}</span><strong>{formatCurrency(item.sales)}</strong></div>)}</Card>
        <Card className="p-5"><h2 className="font-semibold text-slate-950">Top Cities</h2>{Array.from(new Set(orders.map((order) => order.city))).map((city) => <div key={city} className="mt-3 flex justify-between text-sm"><span>{city}</span><strong>{orders.filter((order) => order.city === city).length} orders</strong></div>)}</Card>
        <Card className="p-5"><h2 className="font-semibold text-slate-950">Top Products</h2>{orders.flatMap((order) => order.items).slice(0, 5).map((item) => <div key={`${item.sku}-${item.batch}`} className="mt-3 flex justify-between gap-4 text-sm"><span>{item.product}</span><strong>{item.quantity} units</strong></div>)}</Card>
      </section>

      <Card>
        <div className="border-b p-4"><h2 className="font-semibold text-slate-950">Recent Orders</h2></div>
        <div className="overflow-x-auto">
          <table className="min-w-[920px] w-full text-center text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3 text-center">Order Number</th><th className="text-center">Patient Name</th><th className="text-center">Branch</th><th className="text-center">Source</th><th className="text-center">Date</th><th className="text-center">Total</th><th className="text-center">Status</th><th className="text-center">View</th></tr></thead>
            <tbody>{orders.slice(0, 10).map((order) => <tr key={order.id} className="border-b"><td className="px-4 py-3 font-semibold">{order.orderNumber}</td><td>{patientNameForOrder(order)}</td><td>{branchNameForOrder(order)}</td><td>{orderSourceConfig[order.orderSource].label}</td><td>{format(parseISO(order.date), "dd MMM yyyy")}</td><td>{formatCurrency(orderTotal(order))}</td><td>{order.fulfillmentStatus}</td><td><Link className="font-semibold text-brand-700" to={`/sales/orders/${order.id}`}>View</Link></td></tr>)}</tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
