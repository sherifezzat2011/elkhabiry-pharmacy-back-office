import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { addDays, endOfMonth, endOfWeek, format, isAfter, isBefore, parseISO, startOfMonth, startOfWeek, subMonths, subWeeks } from "date-fns";
import { ArrowLeft, Download, Edit, Eye, MoreHorizontal, Plus, Printer, Search, UserPlus, XCircle } from "lucide-react";
import { branchNameForOrder, mockSalesCustomers, mockSalesOrders, orderSourceConfig, orderTotal, paymentMethods, deliveryMethods, salesProducts, salesRepresentatives, salesWarehouses, type CustomerStatus, type OrderSource, type SalesCustomer, type SalesOrder, type SalesOrderStatus } from "@/data/sales";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";

type OrderFilters = {
  quickDate: string;
  dateFrom: string;
  dateTo: string;
  query: string;
  status: string;
  customer: string;
  paymentStatus: string;
  orderSource: string;
  warehouse: string;
  city: string;
  minValue: string;
  maxValue: string;
  paymentMethod: string;
  deliveryMethod: string;
  salesRep: string;
};

type CustomerFilters = {
  query: string;
  phone: string;
  email: string;
  city: string;
  status: string;
  type: string;
  balance: string;
  salesRep: string;
};

const defaultOrderFilters: OrderFilters = {
  quickDate: "All Time",
  dateFrom: "",
  dateTo: "",
  query: "",
  status: "All",
  customer: "",
  paymentStatus: "All",
  orderSource: "All",
  warehouse: "All",
  city: "All",
  minValue: "",
  maxValue: "",
  paymentMethod: "All",
  deliveryMethod: "All",
  salesRep: "All",
};

const defaultCustomerFilters: CustomerFilters = {
  query: "",
  phone: "",
  email: "",
  city: "All",
  status: "All",
  type: "All",
  balance: "All",
  salesRep: "All",
};

function customerFor(order: SalesOrder) {
  return mockSalesCustomers.find((customer) => customer.id === order.customerId) ?? mockSalesCustomers[0];
}

function badgeClass(value: string) {
  if (["Completed", "Delivered", "Paid", "Active"].includes(value)) return "bg-brand-50 text-brand-700 ring-brand-100";
  if (["Confirmed", "Ready for Dispatch", "Out for Delivery"].includes(value)) return "bg-blue-50 text-blue-700 ring-blue-100";
  if (["Pending", "Processing", "On Hold"].includes(value)) return "bg-orange-50 text-orange-700 ring-orange-100";
  if (["Cancelled", "Delivery Failed", "Refunded", "Returned", "Inactive"].includes(value)) return "bg-red-50 text-red-700 ring-red-100";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function StatusBadge({ value }: { value: string }) {
  return <span className={cn("inline-flex min-h-7 items-center justify-center whitespace-nowrap rounded-full px-3 text-xs font-semibold ring-1", badgeClass(value))}>{value}</span>;
}

function PatientStatusBadge({ value }: { value: "Active" | "New" | "Follow-up" | "Inactive" }) {
  const tone = {
    Active: "bg-brand-50 text-brand-700 ring-brand-100",
    New: "bg-blue-50 text-blue-700 ring-blue-100",
    "Follow-up": "bg-purple-50 text-purple-700 ring-purple-100",
    Inactive: "bg-slate-100 text-slate-600 ring-slate-200",
  }[value];
  return <span className={cn("inline-flex min-h-7 min-w-20 items-center justify-center whitespace-nowrap rounded-full px-3 text-xs font-semibold ring-1", tone)}>{value}</span>;
}

function BalanceBadge({ value }: { value: number }) {
  if (value <= 0) {
    return <span className="inline-flex min-h-7 min-w-20 items-center justify-center whitespace-nowrap rounded-full bg-brand-50 px-3 text-xs font-semibold text-brand-700 ring-1 ring-brand-100">Paid</span>;
  }
  return <span className="inline-flex min-h-7 min-w-24 items-center justify-center whitespace-nowrap rounded-full bg-orange-50 px-3 text-xs font-semibold text-orange-700 ring-1 ring-orange-100">{formatCurrency(value)}</span>;
}

function patientDisplayStatus(customer: SalesCustomer): "Active" | "New" | "Follow-up" | "Inactive" {
  if (customer.status === "Inactive") return "Inactive";
  if (customer.type === "Follow-up Patient" || customer.outstandingBalance > 0) return "Follow-up";
  if (Number(customer.id.replace(/\D/g, "")) >= 1005) return "New";
  return "Active";
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-slate-950/40" aria-label="Close modal" onClick={onClose} />
      <div className="absolute left-1/2 top-8 max-h-[88vh] w-[min(960px,calc(100vw-32px))] -translate-x-1/2 overflow-y-auto rounded-lg bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close"><XCircle className="h-5 w-5" /></Button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function downloadCsv(rows: Record<string, string | number>[], filename: string) {
  const keys = Object.keys(rows[0] ?? {});
  const csv = [keys.join(","), ...rows.map((row) => keys.map((key) => `"${String(row[key] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function usePagination<T>(rows: T[]) {
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(0);
  const pageRows = rows.slice(page * pageSize, page * pageSize + pageSize);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  return { pageRows, pageSize, setPageSize, page, setPage, pageCount };
}

function dateRangeFor(label: string) {
  const today = new Date("2026-07-21T12:00:00");
  if (label === "Today") return { from: format(today, "yyyy-MM-dd"), to: format(today, "yyyy-MM-dd") };
  if (label === "This Week") return { from: format(startOfWeek(today, { weekStartsOn: 0 }), "yyyy-MM-dd"), to: format(endOfWeek(today, { weekStartsOn: 0 }), "yyyy-MM-dd") };
  if (label === "Last Week") {
    const date = subWeeks(today, 1);
    return { from: format(startOfWeek(date, { weekStartsOn: 0 }), "yyyy-MM-dd"), to: format(endOfWeek(date, { weekStartsOn: 0 }), "yyyy-MM-dd") };
  }
  if (label === "This Month") return { from: format(startOfMonth(today), "yyyy-MM-dd"), to: format(endOfMonth(today), "yyyy-MM-dd") };
  if (label === "Last Month") {
    const date = subMonths(today, 1);
    return { from: format(startOfMonth(date), "yyyy-MM-dd"), to: format(endOfMonth(date), "yyyy-MM-dd") };
  }
  return { from: "", to: "" };
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="space-y-1.5"><span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>{children}</label>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("h-10 w-full rounded-lg border border-slate-200 px-3 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100", props.className)} />;
}

function SalesHeader({ title, subtitle, children }: { title: string; subtitle: string; children?: ReactNode }) {
  return (
    <section className="rounded-lg bg-brand-950 px-5 py-6 text-white shadow-soft lg:px-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-200">Sales</p>
          <h1 className="mt-3 text-2xl font-semibold md:text-4xl">{title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-brand-50 md:text-base">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">{children}</div>
      </div>
    </section>
  );
}

function CreateOrderModal({ onClose, onCreate, customerId }: { onClose: () => void; onCreate: (order: SalesOrder) => void; customerId?: string }) {
  const [selectedCustomer, setSelectedCustomer] = useState(customerId ?? mockSalesCustomers[0].id);
  const [orderSource, setOrderSource] = useState<OrderSource>("walk_in");
  const [rows, setRows] = useState([{ product: salesProducts[0].name, quantity: 1, discount: 0 }]);
  const [error, setError] = useState("");
  const customer = mockSalesCustomers.find((item) => item.id === selectedCustomer) ?? mockSalesCustomers[0];
  const subtotal = rows.reduce((sum, row) => sum + row.quantity * (salesProducts.find((item) => item.name === row.product)?.price ?? 0), 0);
  const discount = rows.reduce((sum, row) => sum + row.discount, 0);
  const tax = Math.round(subtotal * 0.14);
  const deliveryFee = 100;
  const grandTotal = subtotal - discount + tax + deliveryFee;
  const save = () => {
    if (!selectedCustomer || rows.length === 0 || rows.some((row) => row.quantity <= 0)) {
      setError("Patient and at least one valid item are required.");
      return;
    }
    const order: SalesOrder = {
      id: `ord-local-${Date.now()}`,
      orderNumber: `SO-2026-${Math.floor(300 + Math.random() * 80)}`,
      customerId: selectedCustomer,
      date: "2026-07-21T14:20:00",
      city: customer.city,
      channel: orderSourceConfig[orderSource].label,
      orderSource,
      marketplaceSource: null,
      paymentStatus: "Pending",
      paymentMethod: "Card",
      fulfillmentStatus: "Pending",
      deliveryStatus: "Not Scheduled",
      deliveryMethod: "Home Delivery",
      warehouse: customer.defaultWarehouse,
      salesRep: customer.salesRep,
      deliveryFee,
      paidAmount: 0,
      items: rows.map((row, index) => {
        const product = salesProducts.find((item) => item.name === row.product) ?? salesProducts[0];
        return { product: product.name, sku: product.sku, batch: `B-NEW-${index + 1}`, expiry: product.expiry, warehouse: customer.defaultWarehouse, availableStock: product.stock, quantity: row.quantity, unitPrice: product.price, discount: row.discount, tax: Math.round(row.quantity * product.price * 0.14) };
      }),
    };
    onCreate(order);
    onClose();
  };
  return (
    <Modal title="Create Order" onClose={onClose}>
      <div className="space-y-5">
        {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
        <Card className="p-4">
          <h3 className="font-semibold text-slate-950">Patient</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Field label="Select Existing Patient"><Select value={selectedCustomer} onChange={(event) => setSelectedCustomer(event.target.value)}>{mockSalesCustomers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
            <Field label="Patient Name"><Input value={customer.name} readOnly /></Field>
            <Field label="Patient ID"><Input value={customer.contact} readOnly /></Field>
            <Field label="Phone Number"><Input value={customer.phone} readOnly /></Field>
            <Field label="Email"><Input value={customer.email} readOnly /></Field>
            <Field label="Delivery Address"><Input defaultValue={customer.address} /></Field>
            <Field label="City"><Input value={customer.city} readOnly /></Field>
            <Field label="Area"><Input value={customer.area} readOnly /></Field>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-950">Order Items</h3>
            <Button size="sm" onClick={() => setRows((prev) => [...prev, { product: salesProducts[prev.length % salesProducts.length].name, quantity: 1, discount: 0 }])}><Plus className="h-4 w-4" />Add Row</Button>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-[860px] w-full text-sm">
              <thead><tr className="border-b text-left text-xs uppercase text-slate-500"><th className="py-2">Medicine</th><th>SKU</th><th>Batch</th><th>Expiry</th><th>Care Center</th><th>Available</th><th>Qty</th><th>Unit Price</th><th>Discount</th><th>Tax</th><th>Total</th><th /></tr></thead>
              <tbody className="divide-y">
                {rows.map((row, index) => {
                  const product = salesProducts.find((item) => item.name === row.product) ?? salesProducts[0];
                  const lineTotal = row.quantity * product.price - row.discount + Math.round(row.quantity * product.price * 0.14);
                  return (
                    <tr key={`${row.product}-${index}`}>
                      <td className="py-2"><Select value={row.product} onChange={(event) => setRows((prev) => prev.map((item, i) => i === index ? { ...item, product: event.target.value } : item))}>{salesProducts.map((item) => <option key={item.sku} value={item.name}>{item.name}</option>)}</Select>{product.stock < 100 ? <p className="text-xs text-orange-600">Low stock warning</p> : null}</td>
                      <td>{product.sku}</td><td>B-2026{index + 1}</td><td>{product.expiry}</td><td>{customer.defaultWarehouse}</td><td>{product.stock}</td>
                      <td><Input type="number" min={1} max={product.stock} value={row.quantity} onChange={(event) => setRows((prev) => prev.map((item, i) => i === index ? { ...item, quantity: Math.min(product.stock, Number(event.target.value)) } : item))} className="w-20" /></td>
                      <td>{formatCurrency(product.price)}</td>
                      <td><Input type="number" min={0} value={row.discount} onChange={(event) => setRows((prev) => prev.map((item, i) => i === index ? { ...item, discount: Number(event.target.value) } : item))} className="w-20" /></td>
                      <td>{formatCurrency(Math.round(row.quantity * product.price * 0.14))}</td><td>{formatCurrency(lineTotal)}</td>
                      <td><Button size="icon" variant="ghost" onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))} title="Remove"><XCircle className="h-4 w-4" /></Button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold text-slate-950">Payment and Delivery</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <Field label="Payment Method"><Select defaultValue="Card">{paymentMethods.map((item) => <option key={item}>{item}</option>)}</Select></Field>
            <Field label="Order Source"><Select value={orderSource} onChange={(event) => setOrderSource(event.target.value as OrderSource)}>{Object.entries(orderSourceConfig).map(([value, config]) => <option key={value} value={value}>{config.label}</option>)}</Select></Field>
            <Field label="Payment Status"><Select defaultValue="Pending"><option>Paid</option><option>Pending</option><option>Refunded</option></Select></Field>
            <Field label="Delivery Method"><Select defaultValue="Home Delivery">{deliveryMethods.map((item) => <option key={item}>{item}</option>)}</Select></Field>
            <Field label="Care Center"><Select defaultValue={customer.defaultWarehouse}>{salesWarehouses.map((item) => <option key={item}>{item}</option>)}</Select></Field>
            <Field label="Requested Delivery Date"><Input type="date" defaultValue={format(addDays(new Date("2026-07-21"), 1), "yyyy-MM-dd")} /></Field>
            <Field label="Care Coordinator"><Select defaultValue={customer.salesRep}>{salesRepresentatives.map((item) => <option key={item}>{item}</option>)}</Select></Field>
            <Field label="Patient Notes"><Input placeholder="Patient notes" /></Field>
            <Field label="Internal Notes"><Input placeholder="Internal notes" /></Field>
          </div>
          <div className="mt-4 ml-auto max-w-sm space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
            <div className="flex justify-between"><span>Discount</span><strong>{formatCurrency(discount)}</strong></div>
            <div className="flex justify-between"><span>Tax</span><strong>{formatCurrency(tax)}</strong></div>
            <div className="flex justify-between"><span>Delivery</span><strong>{formatCurrency(deliveryFee)}</strong></div>
            <div className="flex justify-between border-t pt-2 text-base"><span>Grand Total</span><strong>{formatCurrency(grandTotal)}</strong></div>
          </div>
        </Card>
        <div className="flex justify-end gap-2"><Button onClick={onClose}>Cancel</Button><Button>Save as Draft</Button><Button variant="primary" onClick={save}>Create Order</Button></div>
      </div>
    </Modal>
  );
}

function ExportModal({ title, rows, onClose }: { title: string; rows: Record<string, string | number>[]; onClose: () => void }) {
  const [scope, setScope] = useState("current");
  const [type, setType] = useState("CSV");
  const [done, setDone] = useState(false);
  return (
    <Modal title="Export Options" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Scope"><Select value={scope} onChange={(event) => setScope(event.target.value)}><option value="current">Export current filtered results</option><option value="all">Export all records</option></Select></Field>
        <Field label="File Type"><Select value={type} onChange={(event) => setType(event.target.value)}><option>CSV</option><option>Excel</option></Select></Field>
        {done ? <div className="rounded-lg bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700">Export generated successfully.</div> : null}
        <div className="flex justify-end gap-2"><Button onClick={onClose}>Cancel</Button><Button variant="primary" onClick={() => { downloadCsv(rows, `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`); setDone(true); }}>Export {type}</Button></div>
      </div>
    </Modal>
  );
}

function OrderStatusModal({ order, onClose, onSave }: { order: SalesOrder; onClose: () => void; onSave: (status: SalesOrderStatus) => void }) {
  const [status, setStatus] = useState<SalesOrderStatus>(order.fulfillmentStatus);
  return (
    <Modal title="Update Order Status" onClose={onClose}>
      <div className="space-y-4">
        <Field label="New Status"><Select value={status} onChange={(event) => setStatus(event.target.value as SalesOrderStatus)}>{["Pending", "Confirmed", "Processing", "Ready for Dispatch", "Completed", "Cancelled"].map((item) => <option key={item}>{item}</option>)}</Select></Field>
        <Field label="Date and Time"><Input type="datetime-local" defaultValue="2026-07-21T14:30" /></Field>
        <Field label="Note"><Input placeholder="Status update note" /></Field>
        <div className="flex justify-end gap-2"><Button onClick={onClose}>Cancel</Button><Button variant="primary" onClick={() => onSave(status)}>Save</Button></div>
      </div>
    </Modal>
  );
}

function CancelOrderModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState("Customer Request");
  return (
    <Modal title="Cancel Order" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Cancellation Reason"><Select value={reason} onChange={(event) => setReason(event.target.value)}>{["Customer Request", "Product Unavailable", "Payment Issue", "Duplicate Order", "Delivery Area Unsupported", "Other"].map((item) => <option key={item}>{item}</option>)}</Select></Field>
        <Field label="Additional Note"><Input placeholder="Add cancellation note" /></Field>
        <div className="flex justify-end gap-2"><Button onClick={onClose}>Back</Button><Button variant="danger" onClick={() => onConfirm(reason)}>Confirm Cancellation</Button></div>
      </div>
    </Modal>
  );
}

export function SalesOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState(mockSalesOrders);
  const [filters, setFilters] = useState(defaultOrderFilters);
  const [sort, setSort] = useState("date-desc");
  const [modal, setModal] = useState<"create" | "export" | "status" | "cancel" | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [toast, setToast] = useState("");
  const filtered = useMemo(() => {
    const range = filters.quickDate === "Custom" ? { from: filters.dateFrom, to: filters.dateTo } : dateRangeFor(filters.quickDate);
    return orders.filter((order) => {
      const customer = customerFor(order);
      const haystack = `${order.orderNumber} ${customer.name} ${customer.contact} ${customer.phone} ${customer.email}`.toLowerCase();
      const orderDate = format(parseISO(order.date), "yyyy-MM-dd");
      return (
        (!range.from || !isBefore(parseISO(orderDate), parseISO(range.from))) &&
        (!range.to || !isAfter(parseISO(orderDate), parseISO(range.to))) &&
        (!filters.query || haystack.includes(filters.query.toLowerCase())) &&
        (filters.status === "All" || order.fulfillmentStatus === filters.status) &&
        (filters.paymentStatus === "All" || order.paymentStatus === filters.paymentStatus) &&
        (filters.city === "All" || order.city === filters.city)
      );
    }).sort((a, b) => {
      if (sort === "total-desc") return orderTotal(b) - orderTotal(a);
      if (sort === "customer") return customerFor(a).name.localeCompare(customerFor(b).name);
      if (sort === "status") return a.fulfillmentStatus.localeCompare(b.fulfillmentStatus);
      return b.date.localeCompare(a.date);
    });
  }, [filters, orders, sort]);
  const pagination = usePagination(filtered);
  const counts = {
    total: filtered.length,
    Pending: filtered.filter((order) => order.fulfillmentStatus === "Pending").length,
    Processing: filtered.filter((order) => order.fulfillmentStatus === "Processing").length,
    "Out for Delivery": filtered.filter((order) => order.deliveryStatus === "Out for Delivery").length,
    Completed: filtered.filter((order) => order.fulfillmentStatus === "Completed").length,
    Cancelled: filtered.filter((order) => order.fulfillmentStatus === "Cancelled").length,
  };
  const visibleValue = filtered.reduce((sum, order) => sum + orderTotal(order), 0);
  const exportRows = filtered.map((order) => ({ Order: order.orderNumber, Patient: customerFor(order).name, Source: orderSourceConfig[order.orderSource].label, City: order.city, Total: formatCurrency(orderTotal(order)), Payment: order.paymentStatus, Status: order.fulfillmentStatus, Delivery: order.deliveryStatus }));
  return (
    <div className="mx-auto max-w-[1680px] space-y-5">
      <SalesHeader title="Patient Orders" subtitle="Monitor patient orders, review care progress, and quickly follow up on delayed or cancelled requests.">
        <Button variant="primary" onClick={() => setModal("create")}><Plus className="h-4 w-4" />Create Order</Button>
        <Button onClick={() => setModal("export")}><Download className="h-4 w-4" />Export</Button>
      </SalesHeader>
      {toast ? <div className="rounded-lg bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700">{toast}</div> : null}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Total Orders", counts.total, "All"],
          ["Pending", counts.Pending, "Pending"],
          ["Processing", counts.Processing, "Processing"],
          ["Out for Delivery", counts["Out for Delivery"], "Out for Delivery"],
          ["Completed", counts.Completed, "Completed"],
        ].map(([label, value, status]) => (
          <button key={String(label)} className={cn("rounded-lg border bg-white p-4 text-left shadow-sm transition hover:border-brand-200", (status === "All" ? filters.status === "All" : filters.status === status) && "border-brand-300 ring-2 ring-brand-100")} onClick={() => setFilters((prev) => ({ ...prev, status: String(status) === "All" ? "All" : String(status) }))}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{formatNumber(Number(value))}</p>
            {label === "Completed" ? <p className="mt-1 text-xs text-red-600">Cancelled: {counts.Cancelled}</p> : null}
          </button>
        ))}
      </section>
      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          {["All Time", "Today", "This Week", "Last Week", "This Month", "Last Month", "Custom"].map((item) => (
            <button key={item} className={cn("rounded-full border px-3 py-1.5 text-sm font-semibold", filters.quickDate === item ? "border-brand-200 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-600")} onClick={() => setFilters((prev) => ({ ...prev, quickDate: item }))}>{item}</button>
          ))}
        </div>
        {filters.quickDate === "Custom" ? <div className="mt-3 grid gap-3 md:grid-cols-2"><Field label="Date From"><Input type="date" value={filters.dateFrom} onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))} /></Field><Field label="Date To"><Input type="date" value={filters.dateTo} onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))} /></Field></div> : <p className="mt-3 text-sm text-slate-500">Selected range: {filters.quickDate}</p>}
      </Card>
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Field label="Search Patient / Order Number"><Input value={filters.query} onChange={(e) => setFilters((p) => ({ ...p, query: e.target.value }))} placeholder="Patient name, ID, phone, or order number" /></Field>
          <Field label="Order Status"><Select value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}><option>All</option>{["Pending", "Confirmed", "Processing", "Ready for Dispatch", "Completed", "Cancelled"].map((s) => <option key={s}>{s}</option>)}</Select></Field>
          <Field label="Payment Status"><Select value={filters.paymentStatus} onChange={(e) => setFilters((p) => ({ ...p, paymentStatus: e.target.value }))}><option>All</option>{["Paid", "Pending", "Refunded"].map((s) => <option key={s}>{s}</option>)}</Select></Field>
          <Field label="City"><Select value={filters.city} onChange={(e) => setFilters((p) => ({ ...p, city: e.target.value }))}><option>All</option>{Array.from(new Set(mockSalesCustomers.map((c) => c.city))).map((s) => <option key={s}>{s}</option>)}</Select></Field>
          <div className="flex items-end"><Button className="w-full" onClick={() => setFilters(defaultOrderFilters)}>Reset Filters</Button></div>
        </div>
      </Card>
      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold text-slate-950">Patient Orders</h2>
            <p className="text-sm text-slate-500">{formatNumber(filtered.length)} orders visible - {formatCurrency(visibleValue)} total value</p>
          </div>
          <div className="flex gap-2">
            <Select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="date-desc">Sort: newest</option>
              <option value="total-desc">Sort: total</option>
              <option value="customer">Sort: patient</option>
              <option value="status">Sort: status</option>
            </Select>
            <Select value={pagination.pageSize} onChange={(e) => { pagination.setPageSize(Number(e.target.value)); pagination.setPage(0); }}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </Select>
          </div>
        </div>
        <div className="scrollbar-soft overflow-x-auto">
          <table className="w-full min-w-[1280px] table-fixed text-sm">
            <colgroup>
              <col className="w-[132px]" />
              <col className="w-[178px]" />
              <col className="w-[160px]" />
              <col className="w-[110px]" />
              <col className="w-[130px]" />
              <col className="w-[80px]" />
              <col className="w-[120px]" />
              <col className="w-[150px]" />
              <col className="w-[170px]" />
              <col className="w-[160px]" />
              <col className="w-[110px]" />
            </colgroup>
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="h-11 px-3 text-center align-middle font-semibold">Order Number</th>
                <th className="h-11 px-3 text-center align-middle font-semibold">Patient</th>
                <th className="h-11 px-3 text-center align-middle font-semibold">Source</th>
                <th className="h-11 px-3 text-center align-middle font-semibold">City</th>
                <th className="h-11 px-3 text-center align-middle font-semibold">Date</th>
                <th className="h-11 px-3 text-center align-middle font-semibold">Items</th>
                <th className="h-11 px-3 text-center align-middle font-semibold">Total</th>
                <th className="h-11 px-3 text-center align-middle font-semibold">Payment</th>
                <th className="h-11 px-3 text-center align-middle font-semibold">Status</th>
                <th className="h-11 px-3 text-center align-middle font-semibold">Delivery</th>
                <th className="sticky right-0 h-11 bg-slate-50 px-3 text-center align-middle font-semibold shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.35)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagination.pageRows.map((order) => {
                const customer = customerFor(order);
                return (
                  <tr key={order.id} className="hover:bg-brand-50/40">
                    <td className="px-3 py-2 align-middle">
                      <div className="table-cell-center font-semibold text-slate-900">{order.orderNumber}</div>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <div className="flex min-h-12 flex-col items-center justify-center text-center">
                        <div className="max-w-full truncate font-semibold text-slate-800" title={customer.name}>{customer.name}</div>
                        <div className="max-w-full truncate text-xs text-slate-500" title={customer.contact || customer.phone}>{customer.contact || customer.phone}</div>
                      </div>
                    </td>
                    <td className="px-3 py-2 align-middle"><div className="table-cell-center"><StatusBadge value={orderSourceConfig[order.orderSource].label} /></div></td>
                    <td className="px-3 py-2 align-middle"><div className="table-cell-center text-center">{order.city}</div></td>
                    <td className="px-3 py-2 align-middle"><div className="table-cell-center whitespace-nowrap text-center">{format(parseISO(order.date), "dd MMM yyyy")}</div></td>
                    <td className="px-3 py-2 align-middle"><div className="table-cell-center text-center">{order.items.length}</div></td>
                    <td className="px-3 py-2 align-middle"><div className="table-cell-center whitespace-nowrap text-center font-semibold">{formatCurrency(orderTotal(order))}</div></td>
                    <td className="px-3 py-2 align-middle"><div className="table-cell-center"><StatusBadge value={order.paymentStatus} /></div></td>
                    <td className="px-3 py-2 align-middle"><div className="table-cell-center"><StatusBadge value={order.fulfillmentStatus} /></div></td>
                    <td className="px-3 py-2 align-middle"><div className="table-cell-center"><StatusBadge value={order.deliveryStatus} /></div></td>
                    <td className="sticky right-0 bg-white px-3 py-2 align-middle shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.35)]">
                      <div className="table-cell-center gap-1.5">
                        <Button size="icon" variant="ghost" className="h-9 w-9" title="View order" aria-label="View order" onClick={() => navigate(`/sales/orders/${order.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <details className="relative">
                          <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-lg border border-transparent bg-transparent text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2" title="More actions" aria-label="More actions">
                            <MoreHorizontal className="h-4 w-4" />
                          </summary>
                          <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-slate-200 bg-white p-2 shadow-soft">
                            <button className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-slate-50" disabled={["Completed", "Cancelled"].includes(order.fulfillmentStatus)}>Edit Order</button>
                            <button className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-slate-50">Print Invoice</button>
                            <button className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-slate-50">Download Invoice</button>
                            <button className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={() => { setOrders((prev) => [{ ...order, id: `copy-${Date.now()}`, orderNumber: `${order.orderNumber}-COPY`, fulfillmentStatus: "Pending" }, ...prev]); setToast("Order duplicated locally."); }}>Duplicate Order</button>
                            <button className="block w-full rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50" disabled={["Completed", "Cancelled"].includes(order.fulfillmentStatus)} onClick={() => { setSelectedOrder(order); setModal("cancel"); }}>Cancel Order</button>
                          </div>
                        </details>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 ? <div className="p-8 text-center text-sm text-slate-500">No orders match the selected filters.</div> : null}
        <div className="flex items-center justify-between gap-4 border-t border-slate-100 p-4">
          <p className="text-sm text-slate-500">Page {pagination.page + 1} of {pagination.pageCount}</p>
          <div className="flex items-center gap-2">
            <Button disabled={pagination.page === 0} onClick={() => pagination.setPage((p) => Math.max(0, p - 1))}>Previous</Button>
            <Button disabled={pagination.page + 1 >= pagination.pageCount} onClick={() => pagination.setPage((p) => Math.min(pagination.pageCount - 1, p + 1))}>Next</Button>
          </div>
        </div>
      </Card>
      {modal === "create" ? <CreateOrderModal onClose={() => setModal(null)} onCreate={(order) => { setOrders((prev) => [order, ...prev]); setToast("Order created locally."); }} /> : null}
      {modal === "export" ? <ExportModal title="orders" rows={exportRows} onClose={() => setModal(null)} /> : null}
      {modal === "status" && selectedOrder ? <OrderStatusModal order={selectedOrder} onClose={() => setModal(null)} onSave={(status) => { setOrders((prev) => prev.map((order) => order.id === selectedOrder.id ? { ...order, fulfillmentStatus: status } : order)); setModal(null); setToast("Order status updated."); }} /> : null}
      {modal === "cancel" && selectedOrder ? <CancelOrderModal onClose={() => setModal(null)} onConfirm={(reason) => { setOrders((prev) => prev.map((order) => order.id === selectedOrder.id ? { ...order, fulfillmentStatus: "Cancelled", deliveryStatus: "Not Scheduled", paymentStatus: "Refunded", cancellationReason: reason } : order)); setModal(null); setToast("Order cancelled locally."); }} /> : null}
    </div>
  );
}

function CustomerFormModal({ customer, onClose, onSave }: { customer?: SalesCustomer; onClose: () => void; onSave: (customer: SalesCustomer) => void }) {
  const [form, setForm] = useState<SalesCustomer>(customer ?? { ...mockSalesCustomers[0], id: `CUS-${Date.now()}`, name: "", contact: "", phone: "", email: "", status: "Active", outstandingBalance: 0 });
  const [error, setError] = useState("");
  const set = <K extends keyof SalesCustomer>(key: K, value: SalesCustomer[K]) => setForm((prev) => ({ ...prev, [key]: value }));
  const save = () => {
    if (!form.name || !form.contact || !form.phone) return setError("Name, contact person, and phone are required.");
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError("Enter a valid email address.");
    if (form.creditLimit < 0) return setError("Credit limit cannot be negative.");
    onSave(form);
    onClose();
  };
  return (
    <Modal title={customer ? "Edit Customer" : "Add Customer"} onClose={onClose}>
      <div className="space-y-5">
        {error ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Pharmacy / Customer Name"><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Customer Type"><Select value={form.type} onChange={(e) => set("type", e.target.value as SalesCustomer["type"])}>{["Independent Pharmacy", "Pharmacy Chain", "Clinic", "Hospital", "Medical Center"].map((item) => <option key={item}>{item}</option>)}</Select></Field>
          <Field label="Contact Person"><Input value={form.contact} onChange={(e) => set("contact", e.target.value)} /></Field>
          <Field label="Phone Number"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label="Alternative Phone"><Input value={form.altPhone} onChange={(e) => set("altPhone", e.target.value)} /></Field>
          <Field label="Email"><Input value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
          <Field label="Tax Number"><Input value={form.taxNumber} onChange={(e) => set("taxNumber", e.target.value)} /></Field>
          <Field label="Commercial Registration Number"><Input value={form.commercialRegistration} onChange={(e) => set("commercialRegistration", e.target.value)} /></Field>
          <Field label="Address Line"><Input value={form.address} onChange={(e) => set("address", e.target.value)} /></Field>
          <Field label="City"><Input value={form.city} onChange={(e) => set("city", e.target.value)} /></Field>
          <Field label="Area"><Input value={form.area} onChange={(e) => set("area", e.target.value)} /></Field>
          <Field label="Postal Code"><Input defaultValue="11511" /></Field>
          <Field label="Account Status"><Select value={form.status} onChange={(e) => set("status", e.target.value as CustomerStatus)}><option>Active</option><option>Inactive</option><option>On Hold</option></Select></Field>
          <Field label="Credit Limit"><Input type="number" value={form.creditLimit} onChange={(e) => set("creditLimit", Number(e.target.value))} /></Field>
          <Field label="Payment Terms"><Input value={form.paymentTerms} onChange={(e) => set("paymentTerms", e.target.value)} /></Field>
          <Field label="Assigned Sales Representative"><Select value={form.salesRep} onChange={(e) => set("salesRep", e.target.value)}>{salesRepresentatives.map((item) => <option key={item}>{item}</option>)}</Select></Field>
          <Field label="Default Warehouse"><Select value={form.defaultWarehouse} onChange={(e) => set("defaultWarehouse", e.target.value)}>{salesWarehouses.map((item) => <option key={item}>{item}</option>)}</Select></Field>
          <Field label="Preferred Delivery Method"><Select value={form.preferredDelivery} onChange={(e) => set("preferredDelivery", e.target.value)}>{deliveryMethods.map((item) => <option key={item}>{item}</option>)}</Select></Field>
          <Field label="Internal Notes"><Input value={form.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
        </div>
        <div className="flex justify-end gap-2"><Button onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save}>Save Customer</Button></div>
      </div>
    </Modal>
  );
}

export type InvoiceTotalsData = {
  itemsSubtotal: number;
  itemDiscount: number;
  orderDiscount: number;
  deliveryFee: number;
  serviceFee: number;
  tax: number;
  grandTotal: number;
  paidAmount: number;
  remainingBalance: number;
};

export function invoiceTotalsFor(order: SalesOrder): InvoiceTotalsData {
  const itemsSubtotal = order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice - item.discount, 0);
  const itemDiscount = order.items.reduce((sum, item) => sum + item.discount, 0);
  const tax = order.items.reduce((sum, item) => sum + item.tax, 0);
  const orderDiscount = 0;
  const serviceFee = 0;
  const grandTotal = itemsSubtotal - orderDiscount + order.deliveryFee + serviceFee + tax;
  const remainingBalance = Math.max(0, grandTotal - order.paidAmount);
  return { itemsSubtotal, itemDiscount, orderDiscount, deliveryFee: order.deliveryFee, serviceFee, tax, grandTotal, paidAmount: order.paidAmount, remainingBalance };
}

function invoicePaymentStatus(order: SalesOrder, totals: InvoiceTotalsData) {
  if (order.paymentStatus === "Refunded") return "Refunded";
  if (totals.remainingBalance <= 0 && totals.paidAmount > 0) return "Paid";
  return "Pending";
}

function invoiceFulfillmentStatus(order: SalesOrder) {
  if (order.fulfillmentStatus === "Cancelled") return "Cancelled";
  if (order.fulfillmentStatus === "Completed") return "Completed";
  if (order.deliveryStatus === "Out for Delivery") return "Out for Delivery";
  if (order.fulfillmentStatus === "Ready for Dispatch") return order.deliveryMethod === "Home Delivery" ? "Preparing" : "Ready for Pickup";
  if (order.fulfillmentStatus === "Processing") return "Preparing";
  if (order.fulfillmentStatus === "Confirmed") return "Prescription Verified";
  return "Confirmed";
}

function fulfillmentMethodFor(order: SalesOrder) {
  return order.deliveryMethod === "Home Delivery" ? "Home Delivery" : "Branch Pickup";
}

function PharmacyIdentity({ branch }: { branch: string }) {
  return (
    <div className="text-sm leading-6 text-slate-600">
      <p className="text-base font-semibold text-slate-950">Elkhabiry Pharmacy</p>
      <p>{branch}</p>
      <p>Tax Registration: 123-456-789</p>
      <p>Support: 19000</p>
    </div>
  );
}

function InvoiceStatusBadge({ value }: { value: string }) {
  return (
    <span className={cn("inline-flex min-h-8 items-center gap-2 whitespace-nowrap rounded-full px-3 text-sm font-semibold ring-1", badgeClass(value))}>
      <span className="h-2 w-2 rounded-full bg-current" />
      {value}
    </span>
  );
}

function PrintInvoiceButton() {
  return <Button onClick={() => window.print()}><Printer className="h-4 w-4" />Print Invoice</Button>;
}

function DownloadInvoiceButton() {
  return <Button onClick={() => window.print()}><Download className="h-4 w-4" />Download PDF</Button>;
}

export function InvoiceHeader({ order, patientName, patientPhone, branch, totals, onStatusClick }: { order: SalesOrder; patientName: string; patientPhone: string; branch: string; totals: InvoiceTotalsData; onStatusClick: () => void }) {
  return (
    <header className="invoice-header border-b border-slate-200 pb-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="grid gap-4 md:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)]">
          <PharmacyIdentity branch={branch} />
          <div>
            <h1 className="text-2xl font-semibold text-slate-950">Order #{order.orderNumber}</h1>
            <p className="mt-1 text-sm text-slate-500">{format(parseISO(order.date), "dd MMM yyyy")} · {format(parseISO(order.date), "hh:mm a")}</p>
            <p className="mt-3 font-semibold text-slate-900">{patientName}</p>
            <p className="text-sm text-slate-500">{patientPhone}</p>
            <p className="mt-2 text-sm text-slate-600"><span className="font-semibold text-slate-800">{orderSourceConfig[order.orderSource].label}</span> · {branch}</p>
          </div>
        </div>
        <div className="invoice-actions flex flex-col items-start gap-3 lg:items-end">
          <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2" onClick={onStatusClick} title="Update status">
            <InvoiceStatusBadge value={invoiceFulfillmentStatus(order)} />
          </button>
          <div className="invoice-buttons flex flex-wrap gap-2">
            <PrintInvoiceButton />
            <DownloadInvoiceButton />
          </div>
          <p className="text-right text-sm font-semibold text-slate-950">Grand Total: {formatCurrency(totals.grandTotal)}</p>
        </div>
      </div>
    </header>
  );
}

function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return <div className="flex justify-between gap-4 py-1.5 text-sm"><dt className="text-slate-500">{label}</dt><dd className="text-right font-semibold text-slate-900">{children}</dd></div>;
}

export function PatientDeliverySummary({ order, patientName, patientPhone, patientAddress, branch }: { order: SalesOrder; patientName: string; patientPhone: string; patientAddress: string; branch: string }) {
  const method = fulfillmentMethodFor(order);
  const expectedDate = format(parseISO(order.date), "dd MMM yyyy");
  return (
    <section className="rounded-lg border border-slate-200 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Patient & Fulfillment</h2>
      <dl className="mt-3">
        <SummaryRow label="Patient Name">{patientName}</SummaryRow>
        <SummaryRow label="Phone Number">{patientPhone}</SummaryRow>
        <SummaryRow label={method === "Home Delivery" ? "Delivery Address" : "Pickup Branch"}>{method === "Home Delivery" ? patientAddress : branch}</SummaryRow>
        {method === "Home Delivery" ? <SummaryRow label="Delivery City">{order.city}</SummaryRow> : null}
        <SummaryRow label="Fulfillment Method">{method}</SummaryRow>
        <SummaryRow label={method === "Home Delivery" ? "Expected Delivery Date" : "Expected Ready Date"}>{expectedDate}</SummaryRow>
      </dl>
    </section>
  );
}

export function PaymentSummary({ order, totals }: { order: SalesOrder; totals: InvoiceTotalsData }) {
  return (
    <section className="rounded-lg border border-slate-200 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment</h2>
      <dl className="mt-3">
        <SummaryRow label="Payment Method">{order.paymentMethod}</SummaryRow>
        <SummaryRow label="Payment Status"><StatusBadge value={invoicePaymentStatus(order, totals)} /></SummaryRow>
      </dl>
    </section>
  );
}

export function InvoiceItemsTable({ order }: { order: SalesOrder }) {
  return (
    <section className="mt-5">
      <h2 className="mb-3 font-semibold text-slate-950">Order Items</h2>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-[720px] w-full text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="h-11 px-4 text-left align-middle">Medicine</th>
              <th className="h-11 px-4 text-center align-middle">Quantity</th>
              <th className="h-11 px-4 text-center align-middle">Unit Price</th>
              <th className="h-11 px-4 text-center align-middle">Discount</th>
              <th className="h-11 px-4 text-center align-middle">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.items.map((item) => {
              const lineTotal = item.quantity * item.unitPrice - item.discount;
              return (
                <tr key={`${item.sku}-${item.batch}`}>
                  <td className="px-4 py-3 align-middle"><div className="font-semibold text-slate-900">{item.product}</div><div className="mt-0.5 text-xs text-slate-500">SKU: {item.sku}</div></td>
                  <td className="whitespace-nowrap px-4 py-3 text-center align-middle">{item.quantity}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-center align-middle">{formatCurrency(item.unitPrice)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-center align-middle">{formatCurrency(item.discount)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-center align-middle font-semibold">{formatCurrency(lineTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function InvoiceTotals({ totals }: { totals: InvoiceTotalsData }) {
  const rows = [
    ["Subtotal", totals.itemsSubtotal, true],
    ["Discount", totals.orderDiscount, false],
    ["Delivery Fee", totals.deliveryFee, false],
    ["Service Fee", totals.serviceFee, false],
    ["Tax", totals.tax, false],
  ] as const;
  return (
    <section className="invoice-totals mt-4 ml-auto w-full max-w-md rounded-lg border border-slate-200 p-4">
      <dl className="space-y-2 text-sm">
        {rows.filter(([, value, always]) => always || value > 0).map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4"><dt className="text-slate-500">{label}</dt><dd className="whitespace-nowrap font-semibold text-slate-900">{formatCurrency(value)}</dd></div>
        ))}
        <div className="mt-3 flex justify-between gap-4 border-t border-slate-200 pt-3 text-base"><dt className="font-semibold text-slate-950">Grand Total</dt><dd className="whitespace-nowrap text-lg font-bold text-slate-950">{formatCurrency(totals.grandTotal)}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-slate-500">Paid Amount</dt><dd className="whitespace-nowrap font-semibold text-slate-900">{formatCurrency(totals.paidAmount)}</dd></div>
        <div className="flex justify-between gap-4"><dt className="font-semibold text-slate-700">Remaining Balance</dt><dd className={cn("whitespace-nowrap font-bold", totals.remainingBalance > 0 ? "text-orange-700" : "text-brand-700")}>{formatCurrency(totals.remainingBalance)}</dd></div>
      </dl>
    </section>
  );
}

export function OrderProgressTimeline({ order }: { order: SalesOrder }) {
  const method = fulfillmentMethodFor(order);
  const steps = method === "Home Delivery"
    ? ["Order Created", "Confirmed", "Prescription Verified", "Medication Prepared", "Out for Delivery", "Completed"]
    : ["Order Created", "Confirmed", "Prescription Verified", "Medication Prepared", "Ready for Pickup", "Completed"];
  const status = invoiceFulfillmentStatus(order);
  const activeStepIndex = status === "Completed" ? steps.length - 1 : status === "Out for Delivery" || status === "Ready for Pickup" ? 4 : status === "Preparing" ? 3 : status === "Prescription Verified" ? 2 : 1;
  return (
    <section className="invoice-progress mt-5 grid gap-2 md:grid-cols-3 xl:grid-cols-6">
      {steps.map((step, index) => (
        <div key={step} className={cn("rounded-lg border px-3 py-2 text-sm", index < activeStepIndex ? "border-brand-200 bg-brand-50 text-brand-800" : index === activeStepIndex ? "border-blue-200 bg-blue-50 font-semibold text-blue-800" : "border-slate-200 bg-white text-slate-500")}>
          {step}
        </div>
      ))}
    </section>
  );
}

export function SalesCustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState(mockSalesCustomers);
  const [filters, setFilters] = useState(defaultCustomerFilters);
  const [modal, setModal] = useState<"add" | "edit" | "export" | "note" | "toggle" | "order" | null>(null);
  const [selected, setSelected] = useState<SalesCustomer | null>(null);
  const [toast, setToast] = useState("");
  const enriched = customers.map((customer) => {
    const customerOrders = mockSalesOrders.filter((order) => order.customerId === customer.id);
    const totalSales = customerOrders.reduce((sum, order) => sum + orderTotal(order), 0);
    return { ...customer, totalOrders: customerOrders.length, totalSales };
  });
  const filtered = enriched.filter((customer) => (
    (!filters.query || customer.name.toLowerCase().includes(filters.query.toLowerCase()) || customer.contact.toLowerCase().includes(filters.query.toLowerCase())) &&
    (!filters.phone || customer.phone.includes(filters.phone)) &&
    (!filters.email || customer.email.toLowerCase().includes(filters.email.toLowerCase())) &&
    (filters.city === "All" || customer.city === filters.city) &&
    (filters.status === "All" || customer.status === filters.status) &&
    (filters.type === "All" || customer.type === filters.type) &&
    (filters.balance === "All" || (filters.balance === "Outstanding" ? customer.outstandingBalance > 0 : customer.outstandingBalance === 0)) &&
    (filters.salesRep === "All" || customer.salesRep === filters.salesRep)
  ));
  const pagination = usePagination(filtered);
  const cards = [
    ["Total Customers", filtered.length, "All"],
    ["Active Customers", filtered.filter((c) => c.status === "Active").length, "Active"],
    ["Inactive Customers", filtered.filter((c) => c.status === "Inactive").length, "Inactive"],
    ["Outstanding Balance", filtered.filter((c) => c.outstandingBalance > 0).length, "Outstanding"],
  ];
  return (
    <div className="mx-auto max-w-[1680px] space-y-5">
      <SalesHeader title="Customers" subtitle="Manage pharmacy accounts, review purchasing activity, and monitor account status.">
        <Button variant="primary" onClick={() => setModal("add")}><UserPlus className="h-4 w-4" />Add Customer</Button>
        <Button onClick={() => setModal("export")}><Download className="h-4 w-4" />Export</Button>
      </SalesHeader>
      {toast ? <div className="rounded-lg bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700">{toast}</div> : null}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, mode]) => <button key={String(label)} className="rounded-lg border bg-white p-4 text-left shadow-sm hover:border-brand-200" onClick={() => setFilters((p) => ({ ...p, status: mode === "Outstanding" ? "All" : String(mode), balance: mode === "Outstanding" ? "Outstanding" : "All" }))}><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold text-slate-950">{formatNumber(Number(value))}</p></button>)}</section>
      <Card className="p-4"><div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
        <Field label="Customer / Pharmacy Name"><Input value={filters.query} onChange={(e) => setFilters((p) => ({ ...p, query: e.target.value }))} /></Field>
        <Field label="Phone Number"><Input value={filters.phone} onChange={(e) => setFilters((p) => ({ ...p, phone: e.target.value }))} /></Field>
        <Field label="Email"><Input value={filters.email} onChange={(e) => setFilters((p) => ({ ...p, email: e.target.value }))} /></Field>
        <Field label="City"><Select value={filters.city} onChange={(e) => setFilters((p) => ({ ...p, city: e.target.value }))}><option>All</option>{Array.from(new Set(customers.map((c) => c.city))).map((item) => <option key={item}>{item}</option>)}</Select></Field>
        <Field label="Account Status"><Select value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}><option>All</option><option>Active</option><option>Inactive</option><option>On Hold</option></Select></Field>
        <Field label="Customer Type"><Select value={filters.type} onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value }))}><option>All</option>{["Independent Pharmacy", "Pharmacy Chain", "Clinic", "Hospital", "Medical Center"].map((item) => <option key={item}>{item}</option>)}</Select></Field>
        <Field label="Outstanding Balance"><Select value={filters.balance} onChange={(e) => setFilters((p) => ({ ...p, balance: e.target.value }))}><option>All</option><option>Outstanding</option><option>No Balance</option></Select></Field>
        <Field label="Assigned Sales Representative"><Select value={filters.salesRep} onChange={(e) => setFilters((p) => ({ ...p, salesRep: e.target.value }))}><option>All</option>{salesRepresentatives.map((item) => <option key={item}>{item}</option>)}</Select></Field>
        <div className="flex items-end gap-2"><Button variant="primary"><Search className="h-4 w-4" />Search</Button><Button onClick={() => setFilters(defaultCustomerFilters)}>Clear</Button></div>
      </div></Card>
      <Card>
        <div className="border-b border-slate-100 p-4">
          <h2 className="font-semibold text-slate-950">Customers Table</h2>
          <p className="text-sm text-slate-500">{formatNumber(filtered.length)} patients visible</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full table-fixed text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-[34%] px-5 py-3 text-left font-semibold">Patient</th>
                <th className="w-[11%] px-4 py-3 text-center font-semibold">City</th>
                <th className="w-[9%] px-4 py-3 text-center font-semibold">Orders</th>
                <th className="w-[14%] px-4 py-3 text-center font-semibold">Sales</th>
                <th className="w-[16%] px-4 py-3 text-center font-semibold">Outstanding Balance</th>
                <th className="w-[10%] px-4 py-3 text-center font-semibold">Status</th>
                <th className="w-[12%] px-4 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagination.pageRows.map((customer) => (
                <tr key={customer.id} className="align-middle transition hover:bg-brand-50/40">
                  <td className="px-5 py-4 align-middle">
                    <div className="truncate font-semibold text-slate-900" title={customer.name}>{customer.name}</div>
                    <div className="mt-0.5 text-xs font-medium text-slate-500">{customer.id}</div>
                    <div className="mt-0.5 whitespace-nowrap text-xs text-slate-400">{customer.phone}</div>
                  </td>
                  <td className="px-4 py-4 text-center align-middle text-slate-700">{customer.city}</td>
                  <td className="px-4 py-4 text-center align-middle font-medium text-slate-800">{customer.totalOrders}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-center align-middle font-semibold text-slate-950">{formatCurrency(customer.totalSales)}</td>
                  <td className="px-4 py-4 text-center align-middle"><BalanceBadge value={customer.outstandingBalance} /></td>
                  <td className="px-4 py-4 text-center align-middle"><PatientStatusBadge value={patientDisplayStatus(customer)} /></td>
                  <td className="px-4 py-4 align-middle">
                    <div className="flex items-center justify-center gap-1">
                      <Button title="View Details" aria-label={`View details for ${customer.name}`} size="icon" variant="ghost" onClick={() => navigate(`/sales/customers/${customer.id}`)}><Eye className="h-4 w-4" /></Button>
                      <Button title="Edit" aria-label={`Edit ${customer.name}`} size="icon" variant="ghost" onClick={() => { setSelected(customer); setModal("edit"); }}><Edit className="h-4 w-4" /></Button>
                      <Button title="More Actions" aria-label={`More actions for ${customer.name}`} size="icon" variant="ghost" onClick={() => { setSelected(customer); setModal("note"); }}><MoreHorizontal className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 ? <div className="p-8 text-center text-sm text-slate-500">No customers match the selected filters.</div> : null}
        <div className="flex items-center justify-between border-t border-slate-100 p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Page size</span>
            <Select value={pagination.pageSize} onChange={(e) => { pagination.setPageSize(Number(e.target.value)); pagination.setPage(0); }}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button disabled={pagination.page === 0} onClick={() => pagination.setPage((p) => Math.max(0, p - 1))}>Previous</Button>
            <Button disabled={pagination.page + 1 >= pagination.pageCount} onClick={() => pagination.setPage((p) => Math.min(pagination.pageCount - 1, p + 1))}>Next</Button>
          </div>
        </div>
      </Card>
      {(modal === "add" || (modal === "edit" && selected)) ? <CustomerFormModal customer={modal === "edit" ? selected ?? undefined : undefined} onClose={() => setModal(null)} onSave={(saved) => { setCustomers((prev) => prev.some((c) => c.id === saved.id) ? prev.map((c) => c.id === saved.id ? saved : c) : [saved, ...prev]); setToast("Customer saved locally."); }} /> : null}
      {modal === "export" ? <ExportModal title="customers" rows={filtered.map((c) => ({ ID: c.id, Name: c.name, City: c.city, Status: c.status, Sales: formatCurrency(c.totalSales) }))} onClose={() => setModal(null)} /> : null}
      {modal === "note" && selected ? <Modal title="Add Customer Note" onClose={() => setModal(null)}><Field label="Note"><Input placeholder={`Add note for ${selected.name}`} /></Field><div className="mt-4 flex justify-end"><Button variant="primary" onClick={() => { setModal(null); setToast("Note added locally."); }}>Save Note</Button></div></Modal> : null}
      {modal === "toggle" && selected ? <Modal title="Activate / Deactivate Customer" onClose={() => setModal(null)}><p className="text-sm text-slate-600">Confirm account status change for {selected.name}?</p><div className="mt-4 flex justify-end gap-2"><Button onClick={() => setModal(null)}>Cancel</Button><Button variant="danger" onClick={() => { setCustomers((prev) => prev.map((c) => c.id === selected.id ? { ...c, status: c.status === "Active" ? "Inactive" : "Active" } : c)); setModal(null); setToast("Customer status updated."); }}>Confirm</Button></div></Modal> : null}
      {modal === "order" && selected ? <CreateOrderModal customerId={selected.id} onClose={() => setModal(null)} onCreate={() => setToast("Order created locally for customer.")} /> : null}
    </div>
  );
}

export function SalesOrderDetailsPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(mockSalesOrders.find((item) => item.id === orderId) ?? mockSalesOrders[0]);
  const [modal, setModal] = useState<"status" | null>(null);
  const customer = customerFor(order);
  const branch = branchNameForOrder(order);
  const totals = invoiceTotalsFor(order);
  return (
    <div className="invoice-page mx-auto max-w-[1120px] space-y-5 rounded-lg bg-white p-5 shadow-soft">
      <InvoiceHeader order={order} patientName={customer.name} patientPhone={customer.phone} branch={branch} totals={totals} onStatusClick={() => setModal("status")} />
      <OrderProgressTimeline order={order} />
      <div className="grid gap-4 lg:grid-cols-2">
        <PatientDeliverySummary order={order} patientName={customer.name} patientPhone={customer.phone} patientAddress={customer.address} branch={branch} />
        <PaymentSummary order={order} totals={totals} />
      </div>
      <InvoiceItemsTable order={order} />
      <InvoiceTotals totals={totals} />
      <div className="invoice-secondary">
        <ActivityLog entries={["Order Created", "Payment Confirmed", "Prescription Verified", "Medication Prepared", fulfillmentMethodFor(order) === "Home Delivery" ? "Out for Delivery" : "Ready for Pickup", "Order Completed"]} />
      </div>
      {modal === "status" ? <OrderStatusModal order={order} onClose={() => setModal(null)} onSave={(status) => { setOrder((prev) => ({ ...prev, fulfillmentStatus: status })); setModal(null); }} /> : null}
    </div>
  );
}

function ActivityLog({ entries }: { entries: string[] }) {
  return <Card className="p-5"><h2 className="font-semibold text-slate-950">Activity Log</h2><div className="mt-4 space-y-3">{entries.map((entry, index) => <div key={entry} className="flex gap-3 text-sm"><span className="mt-1 h-2 w-2 rounded-full bg-brand-500" /><div><p className="font-semibold text-slate-800">{entry}</p><p className="text-slate-500">{format(new Date(`2026-07-2${index % 2}T${10 + index}:15:00`), "dd MMM yyyy, hh:mm a")} · Care team update</p></div></div>)}</div></Card>;
}

export function SalesCustomerDetailsPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const customer = mockSalesCustomers.find((item) => item.id === customerId) ?? mockSalesCustomers[0];
  const orders = mockSalesOrders.filter((order) => order.customerId === customer.id);
  const completedOrders = orders.filter((order) => order.fulfillmentStatus === "Completed").length;
  const totalSales = orders.reduce((sum, order) => sum + orderTotal(order), 0);
  const lastOrder = [...orders].sort((a, b) => b.date.localeCompare(a.date))[0];
  return <div className="mx-auto max-w-[1680px] space-y-5"><SalesHeader title={customer.name} subtitle={`${customer.id} · ${customer.type}`}><Button onClick={() => navigate("/sales/customers")}><ArrowLeft className="h-4 w-4" />Back</Button><Button variant="primary"><Plus className="h-4 w-4" />Create Order</Button><Button><Edit className="h-4 w-4" />Edit Customer</Button></SalesHeader><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">{[["Total Orders", orders.length], ["Completed Orders", completedOrders], ["Total Sales", formatCurrency(totalSales)], ["Outstanding Balance", formatCurrency(customer.outstandingBalance)], ["Average Order Value", formatCurrency(totalSales / Math.max(1, orders.length))], ["Last Order Date", lastOrder ? format(parseISO(lastOrder.date), "dd MMM yyyy") : "N/A"]].map(([label, value]) => <Card key={String(label)} className="p-4"><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><p className="mt-2 text-xl font-semibold text-slate-950">{value}</p></Card>)}</section><section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[["Contact Information", `${customer.contact}\n${customer.phone}\n${customer.email}`], ["Address", `${customer.address}\n${customer.city}, ${customer.area}`], ["Business Information", `${customer.taxNumber}\n${customer.commercialRegistration}\n${customer.type}`], ["Credit and Payment Terms", `${formatCurrency(customer.creditLimit)} credit limit\n${customer.paymentTerms}`], ["Assigned Sales Representative", `${customer.salesRep}\n${customer.defaultWarehouse}\n${customer.preferredDelivery}`], ["Internal Notes", customer.notes]].map(([title, text]) => <Card key={title} className="p-4"><h2 className="font-semibold text-slate-950">{title}</h2><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{text}</p></Card>)}</section><Card><div className="border-b p-4"><h2 className="font-semibold">Customer Orders</h2></div><div className="overflow-x-auto"><table className="min-w-[980px] w-full text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3 text-left">Order Number</th><th>Date</th><th>Source</th><th>Items</th><th>Total</th><th>Payment</th><th>Fulfillment</th><th>Delivery</th><th>Actions</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id} className="border-b"><td className="px-4 py-3 font-semibold">{order.orderNumber}</td><td>{format(parseISO(order.date), "dd MMM yyyy")}</td><td><StatusBadge value={orderSourceConfig[order.orderSource].label} /></td><td>{order.items.length}</td><td>{formatCurrency(orderTotal(order))}</td><td><StatusBadge value={order.paymentStatus} /></td><td><StatusBadge value={order.fulfillmentStatus} /></td><td><StatusBadge value={order.deliveryStatus} /></td><td><Button size="sm" onClick={() => navigate(`/sales/orders/${order.id}`)}>View order</Button></td></tr>)}</tbody></table></div></Card><ActivityLog entries={["Customer created", "Customer details updated", "Order created", "Payment received", "Account put on hold", "Account activated", "Note added"]} /></div>;
}


