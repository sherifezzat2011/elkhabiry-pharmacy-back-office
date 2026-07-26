import { useState } from "react";
import { AlertTriangle, Eye, MoreHorizontal, PackageCheck, Pencil, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn, formatNumber } from "@/lib/utils";

type SupplierStatus = "Active" | "Inactive";
type PurchaseOrderStatus = "Draft" | "Pending" | "Approved" | "Partially Received" | "Completed" | "Cancelled";
type ReceivingStatus = "Draft" | "Partially Received" | "Completed";

type Supplier = {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  paymentTerms: string;
  leadTimeDays: number;
  supportedCategories: string[];
  products: number;
  status: SupplierStatus;
  onTimeDelivery: number;
  deliveredOrders: number;
  delayedOrders: number;
};

type PurchaseOrderLine = {
  product: string;
  quantity: number;
  purchasePrice: number;
  receivedQuantity: number;
};

type PurchaseOrder = {
  id: string;
  poNumber: string;
  supplierId: string;
  orderDate: string;
  expectedDelivery: string;
  notes: string;
  status: PurchaseOrderStatus;
  lines: PurchaseOrderLine[];
};

type ReceivingLine = {
  product: string;
  orderedQty: number;
  receivedQty: number;
  rejectedQty: number;
  batchNumber: string;
  expiryDate: string;
};

type GoodsReceiving = {
  id: string;
  receivingNumber: string;
  purchaseOrderId: string;
  supplierId: string;
  receivedDate: string;
  status: ReceivingStatus;
  lines: ReceivingLine[];
};

type InventoryItem = {
  product: string;
  availableQty: number;
  batches: { batchNumber: string; expiryDate: string; quantity: number }[];
};

const categories = ["Medicines", "Antibiotics", "Diabetes", "Vitamins", "Baby Care", "Cosmetics"];
const inputClass = "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";
const textareaClass = "min-h-24 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

const initialSuppliers: Supplier[] = [
  { id: "sup-eva", name: "Eva Pharma", contactPerson: "Ahmed Hassan", phone: "01012345678", email: "orders@evapharma.example", address: "6th of October, Giza", paymentTerms: "30 Days", leadTimeDays: 3, supportedCategories: ["Medicines", "Vitamins"], products: 245, status: "Active", onTimeDelivery: 98, deliveredOrders: 46, delayedOrders: 1 },
  { id: "sup-amoun", name: "Amoun", contactPerson: "Mona Samir", phone: "01098765432", email: "supply@amoun.example", address: "Obour City, Cairo", paymentTerms: "45 Days", leadTimeDays: 2, supportedCategories: ["Antibiotics", "Medicines"], products: 198, status: "Active", onTimeDelivery: 95, deliveredOrders: 38, delayedOrders: 2 },
  { id: "sup-pharco", name: "Pharco", contactPerson: "Karim Adel", phone: "01123456789", email: "distribution@pharco.example", address: "Borg El Arab, Alexandria", paymentTerms: "30 Days", leadTimeDays: 4, supportedCategories: ["Medicines", "Diabetes"], products: 172, status: "Active", onTimeDelivery: 93, deliveredOrders: 29, delayedOrders: 3 },
  { id: "sup-novartis", name: "Novartis", contactPerson: "Sara Ali", phone: "01234567890", email: "eg.orders@novartis.example", address: "New Cairo, Cairo", paymentTerms: "60 Days", leadTimeDays: 5, supportedCategories: ["Diabetes", "Medicines"], products: 86, status: "Active", onTimeDelivery: 91, deliveredOrders: 20, delayedOrders: 2 },
  { id: "sup-sanofi", name: "Sanofi", contactPerson: "Hany Fouad", phone: "01055667788", email: "orders@sanofi.example", address: "Nasr City, Cairo", paymentTerms: "30 Days", leadTimeDays: 3, supportedCategories: ["Diabetes", "Vitamins"], products: 134, status: "Active", onTimeDelivery: 89, deliveredOrders: 25, delayedOrders: 4 },
  { id: "sup-hikma", name: "Hikma", contactPerson: "Youssef Kamal", phone: "01199887766", email: "sales@hikma.example", address: "Heliopolis, Cairo", paymentTerms: "Cash", leadTimeDays: 2, supportedCategories: ["Antibiotics", "Baby Care"], products: 74, status: "Inactive", onTimeDelivery: 86, deliveredOrders: 11, delayedOrders: 2 },
];

const initialPurchaseOrders: PurchaseOrder[] = [
  { id: "po-001", poNumber: "PO-2026-001", supplierId: "sup-eva", orderDate: "2026-07-24", expectedDelivery: "2026-07-27", notes: "Priority replenishment for fast moving pain relief and vitamins.", status: "Pending", lines: [{ product: "Vitamin D Drops", quantity: 120, purchasePrice: 62, receivedQuantity: 0 }, { product: "Eva Collagen Sachets", quantity: 80, purchasePrice: 145, receivedQuantity: 0 }] },
  { id: "po-002", poNumber: "PO-2026-002", supplierId: "sup-amoun", orderDate: "2026-07-20", expectedDelivery: "2026-07-22", notes: "Routine antibiotics replenishment.", status: "Completed", lines: [{ product: "Amoxicillin 500mg", quantity: 180, purchasePrice: 38, receivedQuantity: 180 }, { product: "Cough Syrup", quantity: 70, purchasePrice: 54, receivedQuantity: 70 }] },
  { id: "po-003", poNumber: "PO-2026-003", supplierId: "sup-sanofi", orderDate: "2026-07-22", expectedDelivery: "2026-07-26", notes: "Partial shipment expected because insulin stock is constrained.", status: "Partially Received", lines: [{ product: "Lantus SoloStar", quantity: 60, purchasePrice: 410, receivedQuantity: 30 }, { product: "Essentiale Forte", quantity: 90, purchasePrice: 155, receivedQuantity: 50 }] },
];

const initialReceivings: GoodsReceiving[] = [
  { id: "gr-001", receivingNumber: "GR-2026-001", purchaseOrderId: "po-002", supplierId: "sup-amoun", receivedDate: "2026-07-22", status: "Completed", lines: [{ product: "Amoxicillin 500mg", orderedQty: 180, receivedQty: 180, rejectedQty: 0, batchNumber: "AMN-2607-A", expiryDate: "2028-01-31" }, { product: "Cough Syrup", orderedQty: 70, receivedQty: 70, rejectedQty: 0, batchNumber: "AMN-2607-B", expiryDate: "2027-11-30" }] },
  { id: "gr-002", receivingNumber: "GR-2026-002", purchaseOrderId: "po-003", supplierId: "sup-sanofi", receivedDate: "2026-07-26", status: "Partially Received", lines: [{ product: "Lantus SoloStar", orderedQty: 60, receivedQty: 30, rejectedQty: 0, batchNumber: "SAN-LAN-44", expiryDate: "2027-04-30" }, { product: "Essentiale Forte", orderedQty: 90, receivedQty: 50, rejectedQty: 3, batchNumber: "SAN-ESS-22", expiryDate: "2028-03-31" }] },
];

const initialInventory: InventoryItem[] = [
  { product: "Amoxicillin 500mg", availableQty: 180, batches: [{ batchNumber: "AMN-2607-A", expiryDate: "2028-01-31", quantity: 180 }] },
  { product: "Cough Syrup", availableQty: 70, batches: [{ batchNumber: "AMN-2607-B", expiryDate: "2027-11-30", quantity: 70 }] },
  { product: "Lantus SoloStar", availableQty: 30, batches: [{ batchNumber: "SAN-LAN-44", expiryDate: "2027-04-30", quantity: 30 }] },
  { product: "Essentiale Forte", availableQty: 50, batches: [{ batchNumber: "SAN-ESS-22", expiryDate: "2028-03-31", quantity: 50 }] },
];

function supplierName(suppliers: Supplier[], id: string) {
  return suppliers.find((supplier) => supplier.id === id)?.name ?? "Unknown Supplier";
}

function poAmount(order: PurchaseOrder) {
  return order.lines.reduce((sum, line) => sum + line.quantity * line.purchasePrice, 0);
}

function StatusBadge({ value }: { value: string }) {
  const tone = value === "Active" || value === "Approved" || value === "Completed"
    ? "bg-brand-50 text-brand-800 ring-brand-100"
    : value === "Pending" || value === "Partially Received" || value === "Draft"
      ? "bg-amber-50 text-amber-800 ring-amber-100"
      : value === "Inactive" || value === "Cancelled"
        ? "bg-slate-100 text-slate-600 ring-slate-200"
        : "bg-blue-50 text-blue-800 ring-blue-100";
  return <span className={cn("inline-flex min-h-7 items-center justify-center whitespace-nowrap rounded-full px-3 text-xs font-bold ring-1", tone)}>{value}</span>;
}

function Kpi({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <Card className="border-t-4 border-t-brand-500 p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-3 text-3xl font-bold text-slate-950">{value}</p><p className="mt-2 text-sm text-slate-500">{detail}</p></Card>;
}

function Hero({ title, subtitle, action }: { title: string; subtitle: string; action?: JSX.Element }) {
  return <section className="rounded-xl border border-brand-100 bg-white p-5 shadow-soft"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Suppliers</p><h1 className="mt-2 text-3xl font-bold text-slate-950">{title}</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{subtitle}</p></div>{action ? <div className="shrink-0 lg:pb-1">{action}</div> : null}</div></section>;
}

function Drawer({ title, onClose, children, footer }: { title: string; onClose: () => void; children: JSX.Element; footer?: JSX.Element }) {
  return <div className="fixed inset-0 z-50"><button className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm" aria-label="Close drawer" onClick={onClose} /><aside className="absolute right-0 top-0 flex h-full w-full flex-col bg-white shadow-2xl sm:max-w-2xl"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="text-lg font-bold text-slate-950">{title}</h2><Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button></div><div className="flex-1 overflow-y-auto p-5">{children}</div>{footer ? <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">{footer}</div> : null}</aside></div>;
}

function Field({ label, children }: { label: string; children: JSX.Element }) {
  return <label className="grid gap-1.5 text-sm font-semibold text-slate-700">{label}{children}</label>;
}

function ActionMenu({ actions }: { actions: { label: string; onClick: () => void; danger?: boolean }[] }) {
  return <details className="relative"><summary className="mx-auto grid h-10 w-10 cursor-pointer list-none place-items-center rounded-lg text-slate-600 transition hover:bg-brand-50 hover:text-brand-800" aria-label="More Actions" title="More Actions"><MoreHorizontal className="h-4 w-4" /></summary><div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-slate-200 bg-white p-1.5 text-sm shadow-soft">{actions.map((action) => <button key={action.label} className={cn("w-full rounded-md px-3 py-2 text-left hover:bg-brand-50", action.danger && "text-red-700 hover:bg-red-50")} onClick={action.onClick}>{action.label}</button>)}</div></details>;
}

function SupplierForm({ supplier, onCancel, onSave }: { supplier?: Supplier; onCancel: () => void; onSave: (supplier: Supplier) => void }) {
  const [form, setForm] = useState<Supplier>(supplier ?? { id: `sup-${Date.now()}`, name: "", contactPerson: "", phone: "", email: "", address: "", paymentTerms: "30 Days", leadTimeDays: 3, supportedCategories: ["Medicines"], products: 0, status: "Active", onTimeDelivery: 96, deliveredOrders: 0, delayedOrders: 0 });
  const [error, setError] = useState("");
  const toggleCategory = (category: string) => setForm((previous) => ({ ...previous, supportedCategories: previous.supportedCategories.includes(category) ? previous.supportedCategories.filter((item) => item !== category) : [...previous.supportedCategories, category] }));
  const submit = () => {
    if (!form.name.trim() || !form.contactPerson.trim() || !form.phone.trim()) return setError("Supplier name, contact person, and phone are required.");
    onSave({ ...form, name: form.name.trim(), contactPerson: form.contactPerson.trim(), phone: form.phone.trim() });
  };
  return <Drawer title={supplier ? "Edit Supplier" : "Add Supplier"} onClose={onCancel} footer={<div className="flex justify-end gap-2"><Button onClick={onCancel}>Cancel</Button><Button variant="primary" onClick={submit}>Save Supplier</Button></div>}><div className="space-y-4">{error ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}<Field label="Supplier Name"><input className={inputClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Contact Person"><input className={inputClass} value={form.contactPerson} onChange={(event) => setForm({ ...form, contactPerson: event.target.value })} /></Field><Field label="Phone"><input className={inputClass} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field></div><Field label="Email"><input className={inputClass} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field><Field label="Address"><textarea className={textareaClass} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></Field><div className="grid gap-4 sm:grid-cols-3"><Field label="Payment Terms"><select className={inputClass} value={form.paymentTerms} onChange={(event) => setForm({ ...form, paymentTerms: event.target.value })}><option>Cash</option><option>15 Days</option><option>30 Days</option><option>45 Days</option><option>60 Days</option></select></Field><Field label="Lead Time (Days)"><input className={inputClass} type="number" min={1} value={form.leadTimeDays} onChange={(event) => setForm({ ...form, leadTimeDays: Number(event.target.value) })} /></Field><Field label="Status"><select className={inputClass} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as SupplierStatus })}><option>Active</option><option>Inactive</option></select></Field></div><div><p className="text-sm font-semibold text-slate-700">Supported Categories</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{categories.map((category) => <label key={category} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"><input type="checkbox" checked={form.supportedCategories.includes(category)} onChange={() => toggleCategory(category)} />{category}</label>)}</div></div></div></Drawer>;
}

function SupplierDetails({ supplier, orders, onClose }: { supplier: Supplier; orders: PurchaseOrder[]; onClose: () => void }) {
  const recentOrders = orders.filter((order) => order.supplierId === supplier.id).slice(0, 4);
  return <Drawer title={supplier.name} onClose={onClose}><div className="space-y-5"><Card className="p-4"><h3 className="font-bold text-slate-950">Supplier Information</h3><dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">{[["Contact Person", supplier.contactPerson], ["Phone", supplier.phone], ["Email", supplier.email], ["Address", supplier.address], ["Payment Terms", supplier.paymentTerms], ["Lead Time", `${supplier.leadTimeDays} Days`], ["Products Supplied", formatNumber(supplier.products)], ["Status", supplier.status]].map(([label, value]) => <div key={label}><dt className="text-xs font-bold uppercase text-slate-500">{label}</dt><dd className="mt-1 font-semibold text-slate-900">{value}</dd></div>)}</dl></Card><Card className="p-4"><h3 className="font-bold text-slate-950">Delivery Performance</h3><div className="mt-3 grid gap-3 sm:grid-cols-3"><Kpi label="On-time Delivery" value={`${supplier.onTimeDelivery}%`} detail="Recent supplier score" /><Kpi label="Delivered" value={formatNumber(supplier.deliveredOrders)} detail="Completed purchase orders" /><Kpi label="Delayed" value={formatNumber(supplier.delayedOrders)} detail="Late deliveries" /></div></Card><Card className="p-4"><h3 className="font-bold text-slate-950">Recent Purchase Orders</h3><div className="mt-3 space-y-2">{recentOrders.length ? recentOrders.map((order) => <div key={order.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"><span className="font-semibold text-slate-800">{order.poNumber}</span><StatusBadge value={order.status} /></div>) : <p className="text-sm text-slate-500">No purchase orders yet.</p>}</div></Card><Card className="p-4"><h3 className="font-bold text-slate-950">Products Supplied</h3><p className="mt-2 text-sm text-slate-600">{supplier.supportedCategories.join(", ")}</p></Card></div></Drawer>;
}

export function SupplierListPage() {
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [orders] = useState(initialPurchaseOrders);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | SupplierStatus>("All");
  const [editing, setEditing] = useState<Supplier | undefined>();
  const [viewing, setViewing] = useState<Supplier | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const filtered = suppliers.filter((supplier) => (!query.trim() || supplier.name.toLowerCase().includes(query.trim().toLowerCase()) || supplier.contactPerson.toLowerCase().includes(query.trim().toLowerCase())) && (statusFilter === "All" || supplier.status === statusFilter));
  const pendingOrders = orders.filter((order) => ["Draft", "Pending", "Approved", "Partially Received"].includes(order.status)).length;
  const averageLeadTime = suppliers.reduce((sum, supplier) => sum + supplier.leadTimeDays, 0) / Math.max(1, suppliers.length);
  const saveSupplier = (supplier: Supplier) => {
    setSuppliers((previous) => previous.some((item) => item.id === supplier.id) ? previous.map((item) => item.id === supplier.id ? supplier : item) : [...previous, supplier]);
    setEditing(undefined);
    setFormOpen(false);
  };
  const requestDelete = (supplier: Supplier) => {
    if (orders.some((order) => order.supplierId === supplier.id)) return setNotice("This supplier is linked to purchase history. Deactivate instead.");
    setSuppliers((previous) => previous.filter((item) => item.id !== supplier.id));
  };
  return <div className="mx-auto max-w-[1680px] space-y-5"><Hero title="Supplier List" subtitle="Manage pharmaceutical suppliers and distributors." action={<Button variant="primary" onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" />Add Supplier</Button>} /><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Kpi label="Total Suppliers" value={formatNumber(suppliers.length)} detail="Approved pharmaceutical partners" /><Kpi label="Active Suppliers" value={formatNumber(suppliers.filter((item) => item.status === "Active").length)} detail="Available for new purchase orders" /><Kpi label="Pending Purchase Orders" value={formatNumber(pendingOrders)} detail="Awaiting approval or receiving" /><Kpi label="Average Delivery Time" value={`${averageLeadTime.toFixed(1)} Days`} detail="Weighted supplier lead time" /></section><Card className="p-4"><div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_180px_auto]"><label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className={`${inputClass} w-full pl-9`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search supplier or contact person" /></label><select className={inputClass} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}><option>All</option><option>Active</option><option>Inactive</option></select>{query || statusFilter !== "All" ? <Button onClick={() => { setQuery(""); setStatusFilter("All"); }}>Clear Filters</Button> : null}</div></Card><Card className="overflow-hidden"><div className="overflow-x-auto scrollbar-soft"><table className="w-full min-w-[1040px] text-sm"><thead className="bg-brand-50 text-brand-900"><tr>{["Supplier", "Contact Person", "Phone", "Payment Terms", "Products", "Status", "Actions"].map((header) => <th key={header} className={cn("h-12 px-4 text-xs font-bold uppercase tracking-wide", header === "Supplier" ? "text-left" : "text-center")}>{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 bg-white">{filtered.map((supplier) => <tr key={supplier.id} className="hover:bg-brand-50/40"><td className="px-4 py-3 text-left font-bold text-slate-950">{supplier.name}<p className="mt-1 text-xs font-medium text-slate-500">{supplier.supportedCategories.join(", ")}</p></td><td className="px-4 py-3 text-center font-semibold text-slate-700">{supplier.contactPerson}</td><td className="px-4 py-3 text-center font-semibold text-slate-700">{supplier.phone}</td><td className="px-4 py-3 text-center font-semibold text-slate-700">{supplier.paymentTerms}</td><td className="px-4 py-3 text-center font-bold text-slate-900">{formatNumber(supplier.products)}</td><td className="px-4 py-3 text-center"><StatusBadge value={supplier.status} /></td><td className="px-4 py-3"><div className="flex justify-center gap-1.5"><Button size="icon" variant="ghost" title="View" aria-label="View" onClick={() => setViewing(supplier)}><Eye className="h-4 w-4" /></Button><Button size="icon" variant="ghost" title="Edit" aria-label="Edit" onClick={() => setEditing(supplier)}><Pencil className="h-4 w-4" /></Button><ActionMenu actions={[{ label: supplier.status === "Active" ? "Deactivate" : "Activate", onClick: () => setSuppliers((previous) => previous.map((item) => item.id === supplier.id ? { ...item, status: item.status === "Active" ? "Inactive" : "Active" } : item)) }, { label: "Delete", onClick: () => requestDelete(supplier), danger: true }]} /></div></td></tr>)}</tbody></table></div></Card>{formOpen ? <SupplierForm onCancel={() => setFormOpen(false)} onSave={saveSupplier} /> : null}{editing ? <SupplierForm supplier={editing} onCancel={() => setEditing(undefined)} onSave={saveSupplier} /> : null}{viewing ? <SupplierDetails supplier={viewing} orders={orders} onClose={() => setViewing(null)} /> : null}{notice ? <Notice title="Supplier Notice" message={notice} onClose={() => setNotice("")} /> : null}</div>;
}

function PurchaseOrderForm({ suppliers, order, onCancel, onSave }: { suppliers: Supplier[]; order?: PurchaseOrder; onCancel: () => void; onSave: (order: PurchaseOrder) => void }) {
  const [form, setForm] = useState<PurchaseOrder>(order ?? { id: `po-${Date.now()}`, poNumber: `PO-2026-${String(Math.floor(100 + Math.random() * 899))}`, supplierId: suppliers.find((supplier) => supplier.status === "Active")?.id ?? suppliers[0]?.id ?? "", orderDate: "2026-07-26", expectedDelivery: "2026-07-29", notes: "", status: "Draft", lines: [{ product: "", quantity: 1, purchasePrice: 0, receivedQuantity: 0 }] });
  const [error, setError] = useState("");
  const updateLine = (index: number, patch: Partial<PurchaseOrderLine>) => setForm((previous) => ({ ...previous, lines: previous.lines.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line) }));
  const submit = () => {
    if (!form.supplierId) return setError("Supplier is required.");
    if (!form.lines.length || form.lines.some((line) => !line.product.trim() || line.quantity <= 0 || line.purchasePrice <= 0)) return setError("Each purchase order line needs a product, quantity, and purchase price.");
    onSave({ ...form, lines: form.lines.map((line) => ({ ...line, product: line.product.trim() })) });
  };
  return <Drawer title={order ? "Edit Purchase Order" : "New Purchase Order"} onClose={onCancel} footer={<div className="flex justify-end gap-2"><Button onClick={onCancel}>Cancel</Button><Button variant="primary" onClick={submit}>{order ? "Save Purchase Order" : "Create Purchase Order"}</Button></div>}><div className="space-y-4">{error ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}<div className="grid gap-4 sm:grid-cols-2"><Field label="Supplier"><select className={inputClass} value={form.supplierId} onChange={(event) => setForm({ ...form, supplierId: event.target.value })}>{suppliers.filter((supplier) => supplier.status === "Active").map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></Field><Field label="Expected Delivery Date"><input className={inputClass} type="date" value={form.expectedDelivery} onChange={(event) => setForm({ ...form, expectedDelivery: event.target.value })} /></Field></div><div><div className="flex items-center justify-between"><p className="text-sm font-bold text-slate-800">Products</p><Button size="sm" onClick={() => setForm({ ...form, lines: [...form.lines, { product: "", quantity: 1, purchasePrice: 0, receivedQuantity: 0 }] })}><Plus className="h-4 w-4" />Add Product</Button></div><div className="mt-3 space-y-3">{form.lines.map((line, index) => <div key={index} className="grid gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-[1fr_110px_130px_auto]"><input className={inputClass} value={line.product} onChange={(event) => updateLine(index, { product: event.target.value })} placeholder="Product" /><input className={inputClass} type="number" min={1} value={line.quantity} onChange={(event) => updateLine(index, { quantity: Number(event.target.value) })} placeholder="Quantity" /><input className={inputClass} type="number" min={0} value={line.purchasePrice} onChange={(event) => updateLine(index, { purchasePrice: Number(event.target.value) })} placeholder="Purchase Price" /><Button variant="ghost" size="icon" disabled={form.lines.length === 1} onClick={() => setForm({ ...form, lines: form.lines.filter((_, lineIndex) => lineIndex !== index) })}><X className="h-4 w-4" /></Button></div>)}</div></div><Field label="Notes"><textarea className={textareaClass} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></Field><Field label="Status"><select className={inputClass} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as PurchaseOrderStatus })}><option>Draft</option><option>Pending</option><option>Approved</option><option>Partially Received</option><option>Completed</option><option>Cancelled</option></select></Field><Card className="bg-brand-50 p-4"><div className="flex justify-between text-sm"><span className="font-semibold text-slate-700">Order Total</span><span className="font-bold text-brand-800">{formatNumber(poAmount(form))} EGP</span></div></Card></div></Drawer>;
}

function PurchaseOrderDetails({ order, suppliers, onClose }: { order: PurchaseOrder; suppliers: Supplier[]; onClose: () => void }) {
  return <Drawer title={order.poNumber} onClose={onClose}><div className="space-y-5"><Card className="p-4"><dl className="grid gap-3 text-sm sm:grid-cols-2">{[["Supplier", supplierName(suppliers, order.supplierId)], ["Expected Delivery", order.expectedDelivery], ["Current Status", order.status], ["Order Total", `${formatNumber(poAmount(order))} EGP`]].map(([label, value]) => <div key={label}><dt className="text-xs font-bold uppercase text-slate-500">{label}</dt><dd className="mt-1 font-semibold text-slate-900">{value}</dd></div>)}</dl></Card><Card className="overflow-hidden"><table className="w-full text-sm"><thead className="bg-brand-50 text-brand-900"><tr>{["Product", "Quantity", "Price", "Line Total"].map((header) => <th key={header} className={cn("h-11 px-3 text-xs font-bold uppercase", header === "Product" ? "text-left" : "text-center")}>{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{order.lines.map((line) => <tr key={line.product}><td className="px-3 py-3 font-semibold text-slate-900">{line.product}</td><td className="px-3 py-3 text-center">{formatNumber(line.quantity)}</td><td className="px-3 py-3 text-center">{formatNumber(line.purchasePrice)} EGP</td><td className="px-3 py-3 text-center font-bold">{formatNumber(line.quantity * line.purchasePrice)} EGP</td></tr>)}</tbody></table></Card>{order.notes ? <Card className="p-4"><h3 className="font-bold text-slate-950">Notes</h3><p className="mt-2 text-sm leading-6 text-slate-600">{order.notes}</p></Card> : null}</div></Drawer>;
}

export function PurchaseOrdersPage() {
  const [suppliers] = useState(initialSuppliers);
  const [orders, setOrders] = useState(initialPurchaseOrders);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | PurchaseOrderStatus>("All");
  const [formOrder, setFormOrder] = useState<PurchaseOrder | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState<PurchaseOrder | null>(null);
  const filtered = orders.filter((order) => (!query.trim() || order.poNumber.toLowerCase().includes(query.trim().toLowerCase()) || supplierName(suppliers, order.supplierId).toLowerCase().includes(query.trim().toLowerCase())) && (statusFilter === "All" || order.status === statusFilter));
  const saveOrder = (order: PurchaseOrder) => {
    setOrders((previous) => previous.some((item) => item.id === order.id) ? previous.map((item) => item.id === order.id ? order : item) : [order, ...previous]);
    setFormOpen(false);
    setFormOrder(undefined);
  };
  return <div className="mx-auto max-w-[1680px] space-y-5"><Hero title="Purchase Orders" subtitle="Create and manage supplier purchase orders." action={<Button variant="primary" onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" />New Purchase Order</Button>} /><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Kpi label="Pending Orders" value={formatNumber(orders.filter((order) => order.status === "Pending").length)} detail="Awaiting approval" /><Kpi label="Approved Orders" value={formatNumber(orders.filter((order) => order.status === "Approved").length)} detail="Ready for supplier delivery" /><Kpi label="Received Orders" value={formatNumber(orders.filter((order) => order.status === "Completed").length)} detail="Fully received" /><Kpi label="Total Purchase Value" value={`${formatNumber(orders.reduce((sum, order) => sum + poAmount(order), 0))} EGP`} detail="Open and completed orders" /></section><Workflow /><Card className="p-4"><div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_200px_auto]"><label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className={`${inputClass} w-full pl-9`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search PO number or supplier" /></label><select className={inputClass} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}><option>All</option><option>Draft</option><option>Pending</option><option>Approved</option><option>Partially Received</option><option>Completed</option><option>Cancelled</option></select>{query || statusFilter !== "All" ? <Button onClick={() => { setQuery(""); setStatusFilter("All"); }}>Clear Filters</Button> : null}</div></Card><Card className="overflow-hidden"><div className="overflow-x-auto scrollbar-soft"><table className="w-full min-w-[1100px] text-sm"><thead className="bg-brand-50 text-brand-900"><tr>{["PO Number", "Supplier", "Order Date", "Expected Delivery", "Items", "Amount", "Status", "Actions"].map((header) => <th key={header} className={cn("h-12 px-4 text-xs font-bold uppercase tracking-wide", header === "PO Number" ? "text-left" : "text-center")}>{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 bg-white">{filtered.map((order) => <tr key={order.id} className="hover:bg-brand-50/40"><td className="px-4 py-3 text-left font-bold text-slate-950">{order.poNumber}</td><td className="px-4 py-3 text-center font-semibold text-slate-700">{supplierName(suppliers, order.supplierId)}</td><td className="px-4 py-3 text-center">{order.orderDate}</td><td className="px-4 py-3 text-center">{order.expectedDelivery}</td><td className="px-4 py-3 text-center font-semibold">{formatNumber(order.lines.length)}</td><td className="px-4 py-3 text-center font-bold">{formatNumber(poAmount(order))} EGP</td><td className="px-4 py-3 text-center"><StatusBadge value={order.status} /></td><td className="px-4 py-3"><div className="flex justify-center gap-1.5"><Button size="icon" variant="ghost" title="View" aria-label="View" onClick={() => setViewing(order)}><Eye className="h-4 w-4" /></Button><Button size="icon" variant="ghost" title="Edit" aria-label="Edit" disabled={order.status === "Completed"} onClick={() => setFormOrder(order)}><Pencil className="h-4 w-4" /></Button><ActionMenu actions={[{ label: "Approve Purchase Order", onClick: () => setOrders((previous) => previous.map((item) => item.id === order.id ? { ...item, status: "Approved" } : item)) }, { label: "Cancel", onClick: () => setOrders((previous) => previous.map((item) => item.id === order.id ? { ...item, status: "Cancelled" } : item)), danger: true }]} /></div></td></tr>)}</tbody></table></div></Card>{formOpen ? <PurchaseOrderForm suppliers={suppliers} onCancel={() => setFormOpen(false)} onSave={saveOrder} /> : null}{formOrder ? <PurchaseOrderForm suppliers={suppliers} order={formOrder} onCancel={() => setFormOrder(undefined)} onSave={saveOrder} /> : null}{viewing ? <PurchaseOrderDetails order={viewing} suppliers={suppliers} onClose={() => setViewing(null)} /> : null}</div>;
}

function ReceiveGoodsDrawer({ order, supplier, onCancel, onSave }: { order: PurchaseOrder; supplier: Supplier; onCancel: () => void; onSave: (lines: ReceivingLine[]) => void }) {
  const [lines, setLines] = useState<ReceivingLine[]>(() => order.lines.map((line) => ({ product: line.product, orderedQty: line.quantity, receivedQty: Math.max(0, line.quantity - line.receivedQuantity), rejectedQty: 0, batchNumber: `${supplier.name.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`, expiryDate: "2028-07-31" })));
  const receiveAll = () => setLines((previous) => previous.map((line) => ({ ...line, receivedQty: line.orderedQty, rejectedQty: 0 })));
  const receivePartial = () => setLines((previous) => previous.map((line) => ({ ...line, receivedQty: Math.ceil(line.orderedQty / 2), rejectedQty: 0 })));
  const updateLine = (index: number, patch: Partial<ReceivingLine>) => setLines((previous) => previous.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line));
  return <Drawer title={`Receive Goods - ${order.poNumber}`} onClose={onCancel} footer={<div className="flex justify-between gap-2"><div className="flex gap-2"><Button onClick={receiveAll}>Receive All</Button><Button onClick={receivePartial}>Receive Partial</Button></div><div className="flex gap-2"><Button onClick={onCancel}>Cancel</Button><Button variant="primary" onClick={() => onSave(lines)}>Save Receiving</Button></div></div>}><div className="space-y-4"><Card className="bg-brand-50 p-4"><div className="grid gap-2 text-sm sm:grid-cols-3"><div><p className="text-xs font-bold uppercase text-slate-500">Supplier</p><p className="font-bold text-slate-950">{supplier.name}</p></div><div><p className="text-xs font-bold uppercase text-slate-500">Expected Delivery</p><p className="font-bold text-slate-950">{order.expectedDelivery}</p></div><div><p className="text-xs font-bold uppercase text-slate-500">Current Status</p><StatusBadge value={order.status} /></div></div></Card><div className="space-y-3">{lines.map((line, index) => <Card key={line.product} className="p-3"><div className="grid gap-3 lg:grid-cols-[1.4fr_110px_120px_120px_150px_150px]"><Field label="Product"><input className={inputClass} value={line.product} readOnly /></Field><Field label="Ordered Qty"><input className={inputClass} value={line.orderedQty} readOnly /></Field><Field label="Received Qty"><input className={inputClass} type="number" min={0} max={line.orderedQty} value={line.receivedQty} onChange={(event) => updateLine(index, { receivedQty: Number(event.target.value) })} /></Field><Field label="Rejected Qty"><input className={inputClass} type="number" min={0} max={line.orderedQty} value={line.rejectedQty} onChange={(event) => updateLine(index, { rejectedQty: Number(event.target.value) })} /></Field><Field label="Batch Number"><input className={inputClass} value={line.batchNumber} onChange={(event) => updateLine(index, { batchNumber: event.target.value })} /></Field><Field label="Expiry Date"><input className={inputClass} type="date" value={line.expiryDate} onChange={(event) => updateLine(index, { expiryDate: event.target.value })} /></Field></div></Card>)}</div></div></Drawer>;
}

export function GoodsReceivingPage() {
  const [suppliers] = useState(initialSuppliers);
  const [orders, setOrders] = useState(initialPurchaseOrders);
  const [receivings, setReceivings] = useState(initialReceivings);
  const [inventory, setInventory] = useState(initialInventory);
  const [receivingOrder, setReceivingOrder] = useState<PurchaseOrder | null>(null);
  const [notice, setNotice] = useState("");
  const receivableOrders = orders.filter((order) => ["Approved", "Pending", "Partially Received"].includes(order.status));
  const saveReceiving = (lines: ReceivingLine[]) => {
    if (!receivingOrder) return;
    const receivedByProduct = new Map(lines.map((line) => [line.product, line.receivedQty]));
    const nextOrderLines = receivingOrder.lines.map((line) => ({ ...line, receivedQuantity: Math.min(line.quantity, line.receivedQuantity + (receivedByProduct.get(line.product) ?? 0)) }));
    const completed = nextOrderLines.every((line) => line.receivedQuantity >= line.quantity);
    const status: PurchaseOrderStatus = completed ? "Completed" : "Partially Received";
    const receiving: GoodsReceiving = { id: `gr-${Date.now()}`, receivingNumber: `GR-2026-${String(receivings.length + 1).padStart(3, "0")}`, purchaseOrderId: receivingOrder.id, supplierId: receivingOrder.supplierId, receivedDate: "2026-07-26", status: completed ? "Completed" : "Partially Received", lines };
    setReceivings((previous) => [receiving, ...previous]);
    setOrders((previous) => previous.map((order) => order.id === receivingOrder.id ? { ...order, status, lines: nextOrderLines } : order));
    setInventory((previous) => {
      const next = [...previous];
      lines.forEach((line) => {
        if (line.receivedQty <= 0) return;
        const existing = next.find((item) => item.product === line.product);
        if (existing) {
          existing.availableQty += line.receivedQty;
          existing.batches = [...existing.batches, { batchNumber: line.batchNumber, expiryDate: line.expiryDate, quantity: line.receivedQty }];
        } else {
          next.push({ product: line.product, availableQty: line.receivedQty, batches: [{ batchNumber: line.batchNumber, expiryDate: line.expiryDate, quantity: line.receivedQty }] });
        }
      });
      return next;
    });
    setReceivingOrder(null);
    setNotice("Inventory, stock availability, product quantities, near-expiry data, and batch information were updated.");
  };
  return <div className="mx-auto max-w-[1680px] space-y-5"><Hero title="Goods Receiving" subtitle="Receive products from supplier purchase orders." /><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Kpi label="Receivable Orders" value={formatNumber(receivableOrders.length)} detail="Pending supplier delivery" /><Kpi label="Received Today" value={formatNumber(receivings.filter((item) => item.receivedDate === "2026-07-26").length)} detail="Saved receiving records" /><Kpi label="Inventory Items" value={formatNumber(inventory.length)} detail="Products with tracked batches" /><Kpi label="Stock Available" value={formatNumber(inventory.reduce((sum, item) => sum + item.availableQty, 0))} detail="Units available for sale" /></section><Workflow /><Card className="overflow-hidden"><div className="overflow-x-auto scrollbar-soft"><table className="w-full min-w-[980px] text-sm"><thead className="bg-brand-50 text-brand-900"><tr>{["Receiving Number", "Purchase Order", "Supplier", "Received Date", "Items", "Status", "Actions"].map((header) => <th key={header} className={cn("h-12 px-4 text-xs font-bold uppercase tracking-wide", header === "Receiving Number" ? "text-left" : "text-center")}>{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 bg-white">{receivings.map((receiving) => <tr key={receiving.id} className="hover:bg-brand-50/40"><td className="px-4 py-3 text-left font-bold text-slate-950">{receiving.receivingNumber}</td><td className="px-4 py-3 text-center font-semibold">{orders.find((order) => order.id === receiving.purchaseOrderId)?.poNumber}</td><td className="px-4 py-3 text-center font-semibold">{supplierName(suppliers, receiving.supplierId)}</td><td className="px-4 py-3 text-center">{receiving.receivedDate}</td><td className="px-4 py-3 text-center">{receiving.lines.length}</td><td className="px-4 py-3 text-center"><StatusBadge value={receiving.status} /></td><td className="px-4 py-3 text-center"><Button size="icon" variant="ghost" title="View" aria-label="View"><Eye className="h-4 w-4" /></Button></td></tr>)}</tbody></table></div></Card><Card className="p-4"><div className="flex items-center gap-2"><PackageCheck className="h-5 w-5 text-brand-700" /><h2 className="text-lg font-bold text-slate-950">Open Purchase Orders</h2></div><div className="mt-4 grid gap-3 lg:grid-cols-3">{receivableOrders.map((order) => <button key={order.id} className="rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:border-brand-200 hover:bg-brand-50" onClick={() => setReceivingOrder(order)}><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-slate-950">{order.poNumber}</p><p className="mt-1 text-sm text-slate-500">{supplierName(suppliers, order.supplierId)}</p></div><StatusBadge value={order.status} /></div><p className="mt-3 text-sm font-semibold text-slate-700">{formatNumber(order.lines.length)} items due by {order.expectedDelivery}</p></button>)}</div></Card><Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><h2 className="font-bold text-slate-950">Inventory Batch Snapshot</h2><span className="text-xs font-bold uppercase text-brand-700">Automatically updated after receiving</span></div><div className="overflow-x-auto scrollbar-soft"><table className="w-full min-w-[760px] text-sm"><thead className="bg-slate-50 text-slate-600"><tr>{["Product", "Available Qty", "Batches", "Nearest Expiry"].map((header) => <th key={header} className={cn("h-11 px-4 text-xs font-bold uppercase", header === "Product" ? "text-left" : "text-center")}>{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{inventory.map((item) => <tr key={item.product}><td className="px-4 py-3 text-left font-bold text-slate-950">{item.product}</td><td className="px-4 py-3 text-center font-bold text-brand-800">{formatNumber(item.availableQty)}</td><td className="px-4 py-3 text-center">{item.batches.length}</td><td className="px-4 py-3 text-center">{item.batches.map((batch) => batch.expiryDate).sort()[0]}</td></tr>)}</tbody></table></div></Card>{receivingOrder ? <ReceiveGoodsDrawer order={receivingOrder} supplier={suppliers.find((supplier) => supplier.id === receivingOrder.supplierId) ?? suppliers[0]} onCancel={() => setReceivingOrder(null)} onSave={saveReceiving} /> : null}{notice ? <Notice title="Inventory Updated" message={notice} onClose={() => setNotice("")} /> : null}</div>;
}

function Workflow() {
  const steps = ["Supplier", "Create Purchase Order", "Approve Purchase Order", "Supplier Delivers", "Goods Receiving", "Inventory Updated", "Products Available For Sale"];
  return <Card className="p-4"><div className="flex flex-wrap items-center gap-2">{steps.map((step, index) => <div key={step} className="flex items-center gap-2"><span className="inline-flex min-h-8 items-center rounded-lg bg-brand-50 px-3 text-xs font-bold text-brand-800 ring-1 ring-brand-100">{step}</span>{index < steps.length - 1 ? <span className="text-slate-300">/</span> : null}</div>)}</div></Card>;
}

function Notice({ title, message, onClose }: { title: string; message: string; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm"><Card className="w-full max-w-md p-5"><div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" /><div><h2 className="font-bold text-slate-950">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{message}</p></div></div><div className="mt-5 flex justify-end"><Button variant="primary" onClick={onClose}>Close</Button></div></Card></div>;
}

export function SupplierPerformanceReportPage() {
  const totals = initialSuppliers.reduce((sum, supplier) => ({ delivered: sum.delivered + supplier.deliveredOrders, delayed: sum.delayed + supplier.delayedOrders }), { delivered: 0, delayed: 0 });
  const orders = totals.delivered + totals.delayed;
  return <div className="mx-auto max-w-[1680px] space-y-5"><Hero title="Supplier Performance" subtitle="Monitor supplier reliability, delays, fill-rate signals, and operational delivery trends." /><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><Kpi label="Orders" value={formatNumber(orders)} detail="Recent purchase orders" /><Kpi label="Delivered" value={formatNumber(totals.delivered)} detail="Completed deliveries" /><Kpi label="Delayed" value={formatNumber(totals.delayed)} detail="Late supplier deliveries" /><Kpi label="Average Delivery Time" value="2.8 Days" detail="Lead-time signal merged from old analysis" /><Kpi label="On-time Delivery" value={`${Math.round((totals.delivered / Math.max(1, orders)) * 100)}%`} detail="Supplier service level" /></section><ReportTable rows={initialSuppliers.map((supplier) => [supplier.name, `${supplier.onTimeDelivery}%`, `${supplier.leadTimeDays} Days`, `${supplier.deliveredOrders}`, `${supplier.delayedOrders}`, supplier.delayedOrders > 3 ? "Review" : "Stable"])} headers={["Supplier", "On-time %", "Avg Delivery Time", "Delivered", "Delayed", "Fill / Risk Signal"]} /></div>;
}

export function PurchaseVolumeReportPage() {
  const supplierSpend = initialSuppliers.map((supplier) => ({ supplier, spend: initialPurchaseOrders.filter((order) => order.supplierId === supplier.id).reduce((sum, order) => sum + poAmount(order), 0) }));
  return <div className="mx-auto max-w-[1680px] space-y-5"><Hero title="Purchase Volume" subtitle="Track monthly purchases, supplier spend, purchase trends, and top purchased suppliers." /><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Kpi label="Monthly Purchases" value="318,400 EGP" detail="July 2026 purchase run-rate" /><Kpi label="Supplier Spend" value={`${formatNumber(supplierSpend.reduce((sum, row) => sum + row.spend, 0))} EGP`} detail="Sample PO spend" /><Kpi label="Purchase Trend" value="+12%" detail="Compared with previous month" /><Kpi label="Top Supplier" value="Eva Pharma" detail="Highest current purchase volume" /></section><ReportTable rows={supplierSpend.map(({ supplier, spend }) => [supplier.name, `${formatNumber(spend)} EGP`, supplier.supportedCategories.join(", "), `${supplier.products}`, supplier.status])} headers={["Supplier", "Spend", "Categories", "Products", "Status"]} /></div>;
}

export function DeliveryPerformanceReportPage() {
  return <div className="mx-auto max-w-[1680px] space-y-5"><Hero title="Delivery Performance" subtitle="Review supplier delivery timing with lead-time analysis merged into this report." /><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Kpi label="Average Lead Time" value="2.8 Days" detail="Merged Lead Time Analysis" /><Kpi label="On-time Deliveries" value="169" detail="Recent purchase cycle" /><Kpi label="Delayed Deliveries" value="14" detail="Needs supplier follow-up" /><Kpi label="Late %" value="8%" detail="Improved by 3 points" /></section><ReportTable rows={initialSuppliers.map((supplier) => [supplier.name, `${supplier.leadTimeDays} Days`, `${supplier.onTimeDelivery}%`, supplier.delayedOrders > 2 ? "Late risk" : "On track", supplier.delayedOrders > 2 ? "Tighten follow-up" : "Maintain cadence"])} headers={["Supplier", "Lead Time", "On-time Deliveries", "Trend", "Action"]} /></div>;
}

export function SupplierRankingReportPage() {
  const rows = initialSuppliers.map((supplier) => {
    const delivery = Math.max(70, 102 - supplier.leadTimeDays * 2);
    const price = supplier.paymentTerms === "Cash" ? 84 : supplier.paymentTerms === "60 Days" ? 96 : 92;
    const completion = supplier.onTimeDelivery;
    const quality = 90 + Math.min(8, Math.round(supplier.products / 50));
    const overall = Math.round((delivery + price + completion + quality) / 4);
    return [supplier.name, String(delivery), String(price), String(completion), String(quality), String(overall)];
  }).sort((a, b) => Number(b[5]) - Number(a[5]));
  return <div className="mx-auto max-w-[1680px] space-y-5"><Hero title="Supplier Ranking" subtitle="Rank suppliers using delivery time, price, order completion, quality, and overall score." /><section className="grid gap-4 sm:grid-cols-3"><Kpi label="Eva Pharma" value="98" detail="Top supplier score" /><Kpi label="Amoun" value="95" detail="Strong order completion" /><Kpi label="Pharco" value="93" detail="Reliable pharmaceutical partner" /></section><ReportTable rows={rows} headers={["Supplier", "Delivery Time", "Price", "Order Completion", "Quality", "Overall Score"]} /></div>;
}

function ReportTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return <Card className="overflow-hidden"><div className="overflow-x-auto scrollbar-soft"><table className="w-full min-w-[880px] text-sm"><thead className="bg-brand-50 text-brand-900"><tr>{headers.map((header) => <th key={header} className={cn("h-12 px-4 text-xs font-bold uppercase tracking-wide", header === "Supplier" ? "text-left" : "text-center")}>{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 bg-white">{rows.map((row) => <tr key={row.join("-")} className="hover:bg-brand-50/40">{row.map((cell, index) => <td key={`${cell}-${index}`} className={cn("px-4 py-3 font-semibold text-slate-700", index === 0 ? "text-left text-slate-950" : "text-center")}>{cell}</td>)}</tr>)}</tbody></table></div></Card>;
}
