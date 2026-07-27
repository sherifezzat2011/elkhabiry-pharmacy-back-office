import { useMemo, useState } from "react";
import { Globe, Headphones, Keyboard, Link2, MessageCircle, Pencil, Plus, Search, Smartphone, Store, Eye, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MoreActionsMenu } from "@/components/ui/MoreActionsMenu";
import { cn, formatNumber } from "@/lib/utils";
import { operationalOrderSources, orderSourceBranches, orderSourceTypes, sourceDefaultOrderStatuses, sourceDefaultPaymentMethods, type OperationalOrderSource, type OperationalSourceStatus, type OperationalSourceType } from "@/data/orderSources";

const inputClass = "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

function SourceIcon({ type }: { type: OperationalSourceType }) {
  const className = "h-4 w-4";
  if (type === "Mobile App") return <Smartphone className={className} />;
  if (type === "Website") return <Globe className={className} />;
  if (type === "WhatsApp") return <MessageCircle className={className} />;
  if (type === "Phone / Call Center") return <Headphones className={className} />;
  if (type === "In-Store") return <Store className={className} />;
  if (type === "External Partner") return <Link2 className={className} />;
  return <Keyboard className={className} />;
}

function Kpi({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <Card className="border-t-4 border-t-brand-500 p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-3 text-3xl font-bold text-slate-950">{value}</p><p className="mt-2 text-sm text-slate-500">{detail}</p></Card>;
}

function StatusBadge({ value }: { value: string }) {
  const tone = value === "Active" ? "bg-brand-50 text-brand-800 ring-brand-100" : "bg-slate-100 text-slate-600 ring-slate-200";
  return <span className={cn("inline-flex min-h-7 items-center justify-center rounded-full px-3 text-xs font-bold ring-1", tone)}>{value}</span>;
}

function Hero({ action }: { action: JSX.Element }) {
  return <section className="rounded-xl border border-brand-100 bg-white p-5 shadow-soft"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Order Sources</p><h1 className="mt-2 text-3xl font-bold text-slate-950">Order Sources</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">Manage the channels through which patients place pharmacy orders.</p></div><div className="shrink-0 lg:pb-1">{action}</div></div></section>;
}

function Drawer({ title, onClose, children, footer }: { title: string; onClose: () => void; children: JSX.Element; footer?: JSX.Element }) {
  return <div className="fixed inset-0 z-50"><button className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm" aria-label="Close drawer" onClick={onClose} /><aside className="absolute right-0 top-0 flex h-full w-full flex-col bg-white shadow-2xl sm:max-w-xl"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="text-lg font-bold text-slate-950">{title}</h2><Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button></div><div className="flex-1 overflow-y-auto p-5">{children}</div>{footer ? <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">{footer}</div> : null}</aside></div>;
}

function Field({ label, children, error, helper }: { label: string; children: JSX.Element; error?: string; helper?: string }) {
  return <label className="grid gap-1.5 text-sm font-semibold text-slate-700">{label}{children}{helper ? <span className="text-xs font-medium text-slate-500">{helper}</span> : null}{error ? <span className="text-xs font-semibold text-red-600">{error}</span> : null}</label>;
}

function ActionMenu({ source, onToggle, onDelete }: { source: OperationalOrderSource; onToggle: () => void; onDelete: () => void }) {
  return <MoreActionsMenu actions={[{ label: source.status === "Active" ? "Deactivate" : "Activate", onClick: onToggle }, { label: "Delete", onClick: onDelete, danger: true }]} />;
}

function SourceForm({ source, sources, onCancel, onSave }: { source?: OperationalOrderSource; sources: OperationalOrderSource[]; onCancel: () => void; onSave: (source: OperationalOrderSource) => void }) {
  const [form, setForm] = useState<OperationalOrderSource>(source ?? { id: `source-${Date.now()}`, sourceId: "yodawy", name: "", type: "Manual Entry", code: "", assignedBranches: ["All Branches"], defaultOrderStatus: "New", defaultPaymentMethod: "Not Specified", requiresDelivery: false, status: "Active", description: "", ordersToday: 0, ordersThisMonth: 0, linkedOrders: 0, hasExternalIntegration: false, createdDate: "2026-07-26", lastUpdated: "2026-07-26", recentOrders: [] });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const codeLocked = Boolean(source && source.linkedOrders > 0);
  const toggleBranch = (branch: string) => {
    setForm((previous) => {
      if (branch === "All Branches") return { ...previous, assignedBranches: ["All Branches"] };
      const withoutAll = previous.assignedBranches.filter((item) => item !== "All Branches");
      const next = withoutAll.includes(branch) ? withoutAll.filter((item) => item !== branch) : [...withoutAll, branch];
      return { ...previous, assignedBranches: next };
    });
  };
  const submit = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = "Source Name is required.";
    if (!form.type) nextErrors.type = "Source Type is required.";
    if (!form.code.trim()) nextErrors.code = "Source Code is required.";
    if (form.code && !/^[A-Z0-9_]+$/.test(form.code)) nextErrors.code = "Use uppercase letters, numbers, or underscores only.";
    if (sources.some((item) => item.id !== form.id && item.code === form.code.trim())) nextErrors.code = "Source Code must be unique.";
    if (sources.some((item) => item.id !== form.id && item.name.toLowerCase() === form.name.trim().toLowerCase())) nextErrors.name = "A source with this name already exists.";
    if (!form.assignedBranches.length) nextErrors.branches = "At least one branch must be assigned.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSave({ ...form, name: form.name.trim(), code: form.code.trim(), lastUpdated: "2026-07-26" });
  };
  return <Drawer title={source ? "Edit Order Source" : "Add Order Source"} onClose={onCancel} footer={<div className="flex justify-end gap-2"><Button onClick={onCancel}>Cancel</Button><Button variant="primary" onClick={submit}>Save Order Source</Button></div>}><div className="space-y-4"><Field label="Source Name" error={errors.name}><input className={inputClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Source Type" error={errors.type}><select className={inputClass} value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as OperationalSourceType })}>{orderSourceTypes.map((type) => <option key={type}>{type}</option>)}</select></Field><Field label="Source Code" error={errors.code} helper={codeLocked ? "Source Code cannot be changed after the source is used by existing orders." : undefined}><input className={inputClass} value={form.code} disabled={codeLocked} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} placeholder="APP" /></Field></div><div><p className="text-sm font-semibold text-slate-700">Assigned Branches</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{orderSourceBranches.map((branch) => <label key={branch} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"><input type="checkbox" checked={form.assignedBranches.includes(branch)} onChange={() => toggleBranch(branch)} />{branch}</label>)}</div>{errors.branches ? <p className="mt-1 text-xs font-semibold text-red-600">{errors.branches}</p> : null}</div><div className="grid gap-4 sm:grid-cols-2"><Field label="Default Order Status"><select className={inputClass} value={form.defaultOrderStatus} onChange={(event) => setForm({ ...form, defaultOrderStatus: event.target.value as OperationalOrderSource["defaultOrderStatus"] })}>{sourceDefaultOrderStatuses.map((status) => <option key={status}>{status}</option>)}</select></Field><Field label="Default Payment Method"><select className={inputClass} value={form.defaultPaymentMethod} onChange={(event) => setForm({ ...form, defaultPaymentMethod: event.target.value as OperationalOrderSource["defaultPaymentMethod"] })}>{sourceDefaultPaymentMethods.map((method) => <option key={method}>{method}</option>)}</select></Field><Field label="Requires Delivery"><select className={inputClass} value={form.requiresDelivery ? "Yes" : "No"} onChange={(event) => setForm({ ...form, requiresDelivery: event.target.value === "Yes" })}><option>Yes</option><option>No</option></select></Field><Field label="Status"><select className={inputClass} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as OperationalSourceStatus })}><option>Active</option><option>Inactive</option></select></Field></div><Field label="Description"><textarea className="min-h-24 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field></div></Drawer>;
}

function SourceDetails({ source, onClose }: { source: OperationalOrderSource; onClose: () => void }) {
  const rows = [["Source Name", source.name], ["Source Type", source.type], ["Source Code", source.code], ["Assigned Branches", source.assignedBranches.join(", ")], ["Default Order Status", source.defaultOrderStatus], ["Default Payment Method", source.defaultPaymentMethod], ["Requires Delivery", source.requiresDelivery ? "Yes" : "No"], ["Orders Today", formatNumber(source.ordersToday)], ["Orders This Month", formatNumber(source.ordersThisMonth)], ["Status", source.status], ["Description", source.description], ["Created Date", source.createdDate], ["Last Updated", source.lastUpdated]];
  return <Drawer title={source.name} onClose={onClose}><div className="space-y-4"><Card className="p-4"><dl className="grid gap-3 text-sm">{rows.map(([label, value]) => <div key={label} className="flex justify-between gap-4 border-b border-slate-100 pb-2 last:border-0"><dt className="text-slate-500">{label}</dt><dd className="text-right font-semibold text-slate-900">{value}</dd></div>)}</dl></Card><Card className="p-4"><h3 className="font-bold text-slate-950">Recent Orders</h3><div className="mt-3 space-y-2">{source.recentOrders.length ? source.recentOrders.map((order) => <div key={order} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{order}</div>) : <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">No recent orders yet.</div>}</div></Card></div></Drawer>;
}

export function OrderSourcesOperationsPage() {
  const [sources, setSources] = useState(operationalOrderSources);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [branchFilter, setBranchFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [formSource, setFormSource] = useState<OperationalOrderSource | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState<OperationalOrderSource | null>(null);
  const [notice, setNotice] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<OperationalOrderSource | null>(null);
  const filtered = useMemo(() => sources.filter((source) => source.name.toLowerCase().includes(query.toLowerCase()) && (typeFilter === "All" || source.type === typeFilter) && (branchFilter === "All" || source.assignedBranches.includes("All Branches") || source.assignedBranches.includes(branchFilter)) && (statusFilter === "All" || source.status === statusFilter)), [sources, query, typeFilter, branchFilter, statusFilter]);
  const filtersActive = Boolean(query || typeFilter !== "All" || branchFilter !== "All" || statusFilter !== "All");
  const saveSource = (source: OperationalOrderSource) => {
    setSources((previous) => previous.some((item) => item.id === source.id) ? previous.map((item) => item.id === source.id ? source : item) : [source, ...previous]);
    setFormOpen(false);
    setFormSource(undefined);
  };
  const requestDelete = (source: OperationalOrderSource) => {
    if (source.linkedOrders > 0) return setNotice("This order source cannot be deleted because it is linked to existing orders. Deactivate it instead.");
    if (source.hasExternalIntegration || source.status === "Active") return setNotice("Delete is allowed only when the source has no external integration and is inactive.");
    setConfirmDelete(source);
  };
  return <div className="mx-auto max-w-[1680px] space-y-5"><Hero action={<Button variant="primary" onClick={() => { setFormSource(undefined); setFormOpen(true); }}><Plus className="h-4 w-4" />Add Order Source</Button>} />{notice ? <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">{notice}</div> : null}<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Kpi label="Total Sources" value={String(sources.length)} detail="Configured order channels" /><Kpi label="Active Sources" value={String(sources.filter((source) => source.status === "Active").length)} detail="Available for new orders" /><Kpi label="Orders Today" value={formatNumber(sources.reduce((sum, source) => sum + source.ordersToday, 0))} detail="Across active channels" /><Kpi label="Disabled Sources" value={String(sources.filter((source) => source.status === "Inactive").length)} detail="Not available for new orders" /></section><Card className="p-4"><div className="grid gap-3 xl:grid-cols-[1fr_220px_220px_160px_auto]"><label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className={`${inputClass} w-full pl-9`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by source name" /></label><select className={inputClass} value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option>All</option>{orderSourceTypes.map((type) => <option key={type}>{type}</option>)}</select><select className={inputClass} value={branchFilter} onChange={(event) => setBranchFilter(event.target.value)}><option>All</option>{orderSourceBranches.filter((branch) => branch !== "All Branches").map((branch) => <option key={branch}>{branch}</option>)}</select><select className={inputClass} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All</option><option>Active</option><option>Inactive</option></select>{filtersActive ? <Button onClick={() => { setQuery(""); setTypeFilter("All"); setBranchFilter("All"); setStatusFilter("All"); }}>Clear Filters</Button> : null}</div></Card><Card className="overflow-hidden"><div className="overflow-x-auto scrollbar-soft"><table className="w-full min-w-[1040px] text-sm"><thead className="bg-brand-50 text-brand-900"><tr>{["Source", "Type", "Assigned Branches", "Orders Today", "Status", "Actions"].map((header) => <th key={header} className={cn("h-12 px-4 align-middle text-xs font-bold uppercase tracking-wide", header === "Source" ? "text-left" : "text-center")}>{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 bg-white">{filtered.map((source) => <tr key={source.id} className="hover:bg-brand-50/40"><td className="px-4 py-4 text-left font-bold text-slate-900"><span className="inline-flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-700"><SourceIcon type={source.type} /></span>{source.name}</span></td><td className="px-4 py-4 text-center font-medium text-slate-700">{source.type}</td><td className="px-4 py-4 text-center font-medium text-slate-700">{source.assignedBranches.includes("All Branches") ? "All Branches" : source.assignedBranches.join(", ")}</td><td className="px-4 py-4 text-center font-medium text-slate-700">{formatNumber(source.ordersToday)}</td><td className="px-4 py-4 text-center"><StatusBadge value={source.status} /></td><td className="px-4 py-4"><div className="flex justify-center gap-1.5"><Button size="icon" variant="ghost" title="View Details" aria-label="View Details" onClick={() => setViewing(source)}><Eye className="h-4 w-4" /></Button><Button size="icon" variant="ghost" title="Edit" aria-label="Edit" onClick={() => { setFormSource(source); setFormOpen(true); }}><Pencil className="h-4 w-4" /></Button><ActionMenu source={source} onToggle={() => { if (source.status === "Active") setNotice("Deactivating this source will prevent it from being used for new orders. Existing orders and historical reports will not be affected."); setSources((previous) => previous.map((item) => item.id === source.id ? { ...item, status: item.status === "Active" ? "Inactive" : "Active", lastUpdated: "2026-07-26" } : item)); }} onDelete={() => requestDelete(source)} /></div></td></tr>)}</tbody></table></div></Card>{formOpen ? <SourceForm source={formSource} sources={sources} onCancel={() => { setFormOpen(false); setFormSource(undefined); }} onSave={saveSource} /> : null}{viewing ? <SourceDetails source={viewing} onClose={() => setViewing(null)} /> : null}{confirmDelete ? <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm"><Card className="w-full max-w-md p-5"><div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" /><div><h2 className="font-bold text-slate-950">Delete Order Source</h2><p className="mt-2 text-sm leading-6 text-slate-600">Delete {confirmDelete.name}? This source has no linked orders and is inactive.</p></div></div><div className="mt-5 flex justify-end gap-2"><Button onClick={() => setConfirmDelete(null)}>Cancel</Button><Button variant="danger" onClick={() => { setSources((previous) => previous.filter((item) => item.id !== confirmDelete.id)); setConfirmDelete(null); }}>Delete</Button></div></Card></div> : null}</div>;
}
