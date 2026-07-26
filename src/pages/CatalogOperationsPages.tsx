import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronRight, Eye, Folder, Layers3, MoreHorizontal, Pencil, Plus, Search, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn, formatNumber } from "@/lib/utils";

type CatalogStatus = "Active" | "Inactive";
type CategoryLevel = 1 | 2 | 3;
type LevelLabel = "Main Category" | "Subcategory" | "Product Group";

type CatalogCategoryNode = {
  id: string;
  name: string;
  parentId: string | null;
  level: CategoryLevel;
  description: string;
  imageOrIcon: string;
  status: CatalogStatus;
  createdDate: string;
  lastUpdated: string;
};

type CatalogProductItem = {
  id: string;
  product: string;
  sku: string;
  mainCategoryId: string;
  subcategoryId: string;
  productGroupId: string | null;
  brand: string;
  stock: number;
  price: number;
  status: CatalogStatus;
  barcode?: string;
  productImage?: string;
  dosageForm?: string;
  strength?: string;
};

const categoryMeta = { createdDate: "2026-01-15", lastUpdated: "2026-07-26" };

const initialCategories: CatalogCategoryNode[] = [
  { id: "cat-medicines", name: "Medicines", parentId: null, level: 1, description: "Prescription and over-the-counter medicines.", imageOrIcon: "medicines.jpg", status: "Active", ...categoryMeta },
  { id: "cat-pain", name: "Pain Relief", parentId: "cat-medicines", level: 2, description: "Analgesics and pain management.", imageOrIcon: "pain-relief.jpg", status: "Active", ...categoryMeta },
  { id: "cat-pain-tablets", name: "Tablets", parentId: "cat-pain", level: 3, description: "Pain relief tablets.", imageOrIcon: "tablets", status: "Active", ...categoryMeta },
  { id: "cat-pain-capsules", name: "Capsules", parentId: "cat-pain", level: 3, description: "Pain relief capsules.", imageOrIcon: "capsules", status: "Active", ...categoryMeta },
  { id: "cat-pain-syrups", name: "Syrups", parentId: "cat-pain", level: 3, description: "Pain relief syrups.", imageOrIcon: "syrups", status: "Active", ...categoryMeta },
  { id: "cat-antibiotics", name: "Antibiotics", parentId: "cat-medicines", level: 2, description: "Prescription antibiotic category.", imageOrIcon: "antibiotics.jpg", status: "Active", ...categoryMeta },
  { id: "cat-antibiotics-oral", name: "Oral", parentId: "cat-antibiotics", level: 3, description: "Oral antibiotics.", imageOrIcon: "oral", status: "Active", ...categoryMeta },
  { id: "cat-antibiotics-injection", name: "Injection", parentId: "cat-antibiotics", level: 3, description: "Injectable antibiotics.", imageOrIcon: "injection", status: "Active", ...categoryMeta },
  { id: "cat-diabetes", name: "Diabetes", parentId: "cat-medicines", level: 2, description: "Diabetes care medicines and supplies.", imageOrIcon: "diabetes.jpg", status: "Active", ...categoryMeta },
  { id: "cat-diabetes-tablets", name: "Tablets", parentId: "cat-diabetes", level: 3, description: "Diabetes tablets.", imageOrIcon: "tablets", status: "Active", ...categoryMeta },
  { id: "cat-diabetes-insulin", name: "Insulin", parentId: "cat-diabetes", level: 3, description: "Insulin products.", imageOrIcon: "insulin", status: "Active", ...categoryMeta },
  { id: "cat-vitamins", name: "Vitamins & Supplements", parentId: null, level: 1, description: "Daily wellness supplements.", imageOrIcon: "vitamins.jpg", status: "Active", ...categoryMeta },
  { id: "cat-multivitamins", name: "Multivitamins", parentId: "cat-vitamins", level: 2, description: "Adult and family multivitamins.", imageOrIcon: "multivitamins.jpg", status: "Active", ...categoryMeta },
  { id: "cat-multivitamins-tablets", name: "Tablets", parentId: "cat-multivitamins", level: 3, description: "Multivitamin tablets.", imageOrIcon: "tablets", status: "Active", ...categoryMeta },
  { id: "cat-multivitamins-gummies", name: "Gummies", parentId: "cat-multivitamins", level: 3, description: "Multivitamin gummies.", imageOrIcon: "gummies", status: "Active", ...categoryMeta },
  { id: "cat-vitamin-d", name: "Vitamin D", parentId: "cat-vitamins", level: 2, description: "Vitamin D supplements.", imageOrIcon: "vitamin-d.jpg", status: "Active", ...categoryMeta },
  { id: "cat-vitamin-d-drops", name: "Drops", parentId: "cat-vitamin-d", level: 3, description: "Vitamin D drops.", imageOrIcon: "drops", status: "Active", ...categoryMeta },
  { id: "cat-vitamin-d-tablets", name: "Tablets", parentId: "cat-vitamin-d", level: 3, description: "Vitamin D tablets.", imageOrIcon: "tablets", status: "Active", ...categoryMeta },
  { id: "cat-baby", name: "Baby Care", parentId: null, level: 1, description: "Baby care essentials.", imageOrIcon: "baby-care.jpg", status: "Active", ...categoryMeta },
  { id: "cat-feeding", name: "Feeding", parentId: "cat-baby", level: 2, description: "Baby feeding products.", imageOrIcon: "feeding.jpg", status: "Active", ...categoryMeta },
  { id: "cat-baby-bottles", name: "Baby Bottles", parentId: "cat-feeding", level: 3, description: "Baby bottles.", imageOrIcon: "bottles", status: "Active", ...categoryMeta },
  { id: "cat-sterilizers", name: "Sterilizers", parentId: "cat-feeding", level: 3, description: "Bottle sterilizers.", imageOrIcon: "sterilizers", status: "Active", ...categoryMeta },
  { id: "cat-accessories", name: "Accessories", parentId: "cat-feeding", level: 3, description: "Bottle accessories.", imageOrIcon: "accessories", status: "Active", ...categoryMeta },
];

const initialProducts: CatalogProductItem[] = [
  { id: "prod-panadol", product: "Panadol Extra", sku: "MED-PAI-TAB-001", mainCategoryId: "cat-medicines", subcategoryId: "cat-pain", productGroupId: "cat-pain-tablets", brand: "GSK", stock: 125, price: 48, status: "Active", barcode: "622300111001", dosageForm: "Tablet", strength: "500 mg" },
  { id: "prod-augmentin", product: "Augmentin 1g", sku: "MED-ANT-ORA-002", mainCategoryId: "cat-medicines", subcategoryId: "cat-antibiotics", productGroupId: "cat-antibiotics-oral", brand: "GSK", stock: 42, price: 185, status: "Active", barcode: "622300111002", dosageForm: "Tablet", strength: "1 g" },
  { id: "prod-centrum", product: "Centrum Advance", sku: "VIT-MUL-TAB-003", mainCategoryId: "cat-vitamins", subcategoryId: "cat-multivitamins", productGroupId: "cat-multivitamins-tablets", brand: "Haleon", stock: 87, price: 320, status: "Active", barcode: "622300111003", dosageForm: "Tablet" },
  { id: "prod-vitd", product: "Vitamin D Drops", sku: "VIT-D-DRO-004", mainCategoryId: "cat-vitamins", subcategoryId: "cat-vitamin-d", productGroupId: "cat-vitamin-d-drops", brand: "Eva Pharma", stock: 54, price: 95, status: "Active", dosageForm: "Drops" },
  { id: "prod-bottle", product: "Philips Avent Baby Bottle", sku: "BAB-FEE-BOT-005", mainCategoryId: "cat-baby", subcategoryId: "cat-feeding", productGroupId: "cat-baby-bottles", brand: "Philips Avent", stock: 18, price: 260, status: "Active" },
];

const brands = ["GSK", "Haleon", "Eva Pharma", "Hikma", "Roche", "L'Oreal", "Philips Avent"];
const inputClass = "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

function levelLabel(level: CategoryLevel): LevelLabel {
  return level === 1 ? "Main Category" : level === 2 ? "Subcategory" : "Product Group";
}

function parentOptions(categories: CatalogCategoryNode[], level: CategoryLevel, currentId?: string) {
  const parentLevel = level === 2 ? 1 : level === 3 ? 2 : 0;
  return categories.filter((category) => category.level === parentLevel && category.status === "Active" && category.id !== currentId);
}

function childrenOf(categories: CatalogCategoryNode[], parentId: string) {
  return categories.filter((category) => category.parentId === parentId);
}

function descendantsOf(categories: CatalogCategoryNode[], categoryId: string): CatalogCategoryNode[] {
  const children = childrenOf(categories, categoryId);
  return [...children, ...children.flatMap((child) => descendantsOf(categories, child.id))];
}

function categoryPath(categories: CatalogCategoryNode[], product: Pick<CatalogProductItem, "mainCategoryId" | "subcategoryId" | "productGroupId">) {
  return [product.mainCategoryId, product.subcategoryId, product.productGroupId].filter(Boolean).map((id) => categories.find((category) => category.id === id)?.name).filter(Boolean).join(" > ");
}

function productCountFor(category: CatalogCategoryNode, categories: CatalogCategoryNode[], products: CatalogProductItem[]) {
  const ids = [category.id, ...descendantsOf(categories, category.id).map((item) => item.id)];
  return products.filter((product) => ids.includes(product.mainCategoryId) || ids.includes(product.subcategoryId) || (product.productGroupId ? ids.includes(product.productGroupId) : false)).length;
}

function StatusBadge({ value }: { value: string }) {
  const tone = value === "Active" ? "bg-brand-50 text-brand-800 ring-brand-100" : "bg-slate-100 text-slate-600 ring-slate-200";
  return <span className={cn("inline-flex min-h-7 items-center justify-center rounded-full px-3 text-xs font-bold ring-1", tone)}>{value}</span>;
}

function Kpi({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <Card className="border-t-4 border-t-brand-500 p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-3 text-3xl font-bold text-slate-950">{value}</p><p className="mt-2 text-sm text-slate-500">{detail}</p></Card>;
}

function Hero({ title, subtitle, action }: { title: string; subtitle: string; action?: JSX.Element }) {
  return <section className="rounded-xl border border-brand-100 bg-white p-5 shadow-soft"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Catalog</p><h1 className="mt-2 text-3xl font-bold text-slate-950">{title}</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{subtitle}</p></div>{action ? <div className="shrink-0 lg:pb-1">{action}</div> : null}</div></section>;
}

function Drawer({ title, onClose, children, footer }: { title: string; onClose: () => void; children: JSX.Element; footer?: JSX.Element }) {
  return <div className="fixed inset-0 z-50"><button className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm" aria-label="Close drawer" onClick={onClose} /><aside className="absolute right-0 top-0 flex h-full w-full flex-col bg-white shadow-2xl sm:max-w-xl"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="text-lg font-bold text-slate-950">{title}</h2><Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button></div><div className="flex-1 overflow-y-auto p-5">{children}</div>{footer ? <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">{footer}</div> : null}</aside></div>;
}

function ActionMenu({ actions }: { actions: { label: string; onClick: () => void; danger?: boolean }[] }) {
  return <details className="relative"><summary className="mx-auto grid h-9 w-9 cursor-pointer list-none place-items-center rounded-lg text-slate-600 transition hover:bg-brand-50 hover:text-brand-800" aria-label="More Actions" title="More Actions"><MoreHorizontal className="h-4 w-4" /></summary><div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-slate-200 bg-white p-1.5 text-sm shadow-soft">{actions.map((action) => <button key={action.label} className={cn("w-full rounded-md px-3 py-2 text-left hover:bg-brand-50", action.danger && "text-red-700 hover:bg-red-50")} onClick={action.onClick}>{action.label}</button>)}</div></details>;
}

function CategoryIcon({ level }: { level: CategoryLevel }) {
  if (level === 1) return <Folder className="h-4 w-4 text-brand-700" />;
  if (level === 2) return <Tag className="h-4 w-4 text-brand-600" />;
  return <Layers3 className="h-4 w-4 text-brand-600" />;
}

function CategoryForm({ categories, category, defaultLevel, defaultParentId, onCancel, onSave }: { categories: CatalogCategoryNode[]; category?: CatalogCategoryNode; defaultLevel?: CategoryLevel; defaultParentId?: string | null; onCancel: () => void; onSave: (category: CatalogCategoryNode, parentChanged: boolean) => void }) {
  const [level, setLevel] = useState<CategoryLevel>(category?.level ?? defaultLevel ?? 1);
  const [parentId, setParentId] = useState<string>(category?.parentId ?? defaultParentId ?? "");
  const [name, setName] = useState(category?.name ?? "");
  const [imageOrIcon, setImageOrIcon] = useState(category?.imageOrIcon ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [status, setStatus] = useState<CatalogStatus>(category?.status ?? "Active");
  const [error, setError] = useState("");
  const options = parentOptions(categories, level, category?.id);
  const changeLevel = (next: CategoryLevel) => {
    setLevel(next);
    setParentId("");
  };
  const submit = () => {
    if (!name.trim()) return setError("Category name is required.");
    if (level > 1 && !parentId) return setError("Select a valid parent category.");
    if (category && parentId && descendantsOf(categories, category.id).some((item) => item.id === parentId)) return setError("A category cannot be moved under one of its child categories.");
    onSave({ id: category?.id ?? `cat-${Date.now()}`, name: name.trim(), parentId: level === 1 ? null : parentId, level, description, imageOrIcon, status, createdDate: category?.createdDate ?? "2026-07-26", lastUpdated: "2026-07-26" }, Boolean(category && category.parentId !== (level === 1 ? null : parentId)));
  };
  return <Drawer title={category ? `Edit ${levelLabel(category.level)}` : "Add Category"} onClose={onCancel} footer={<div className="flex justify-end gap-2"><Button onClick={onCancel}>Cancel</Button><Button variant="primary" onClick={submit}>Save Category</Button></div>}><div className="space-y-4">{error ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}<label className="grid gap-1.5 text-sm font-semibold text-slate-700">Category Level<select className={inputClass} value={level} disabled={Boolean(category)} onChange={(event) => changeLevel(Number(event.target.value) as CategoryLevel)}><option value={1}>Main Category</option><option value={2}>Subcategory</option><option value={3}>Product Group</option></select></label>{level > 1 ? <label className="grid gap-1.5 text-sm font-semibold text-slate-700">Parent Category<select className={inputClass} value={parentId} onChange={(event) => setParentId(event.target.value)}><option value="">Select parent</option>{options.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label> : null}<label className="grid gap-1.5 text-sm font-semibold text-slate-700">Category Name<input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} /></label><label className="grid gap-1.5 text-sm font-semibold text-slate-700">Category Image / Icon<input className={inputClass} value={imageOrIcon} onChange={(event) => setImageOrIcon(event.target.value)} placeholder="tablets, vitamins.jpg" /></label><label className="grid gap-1.5 text-sm font-semibold text-slate-700">Description<textarea className="min-h-24 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" value={description} onChange={(event) => setDescription(event.target.value)} /></label><label className="grid gap-1.5 text-sm font-semibold text-slate-700">Status<select className={inputClass} value={status} onChange={(event) => setStatus(event.target.value as CatalogStatus)}><option>Active</option><option>Inactive</option></select></label>{category?.parentId && parentId !== category.parentId ? <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Changing the parent updates this category path for future catalog operations.</div> : null}</div></Drawer>;
}

function CategoryDetails({ category, categories, products, onClose }: { category: CatalogCategoryNode; categories: CatalogCategoryNode[]; products: CatalogProductItem[]; onClose: () => void }) {
  const parent = category.parentId ? categories.find((item) => item.id === category.parentId) : undefined;
  const children = childrenOf(categories, category.id);
  const count = productCountFor(category, categories, products);
  return <Drawer title={category.name} onClose={onClose}><div className="space-y-4"><Card className="p-4"><dl className="grid gap-3 text-sm">{[["Level", levelLabel(category.level)], ["Parent Category", parent?.name ?? "-"], ["Products", formatNumber(count)], ["Status", category.status], ["Image / Icon", category.imageOrIcon || "-"], ["Description", category.description], ["Created Date", category.createdDate], ["Last Updated", category.lastUpdated]].map(([label, value]) => <div key={label} className="flex justify-between gap-4 border-b border-slate-100 pb-2 last:border-0"><dt className="text-slate-500">{label}</dt><dd className="text-right font-semibold text-slate-900">{value}</dd></div>)}</dl></Card>{children.length ? <Card className="p-4"><h3 className="font-bold text-slate-950">Child Categories</h3><div className="mt-3 space-y-2">{children.map((child) => <div key={child.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"><span className="font-semibold text-slate-700">{child.name}</span><StatusBadge value={child.status} /></div>)}</div></Card> : null}</div></Drawer>;
}

function flattenTree(categories: CatalogCategoryNode[], expanded: string[], parentId: string | null = null, depth = 0): { category: CatalogCategoryNode; depth: number }[] {
  return categories.filter((category) => category.parentId === parentId).flatMap((category) => {
    const row = { category, depth };
    return expanded.includes(category.id) ? [row, ...flattenTree(categories, expanded, category.id, depth + 1)] : [row];
  });
}

export function CatalogCategoriesOperationsPage() {
  const [categories, setCategories] = useState(initialCategories);
  const [products] = useState(initialProducts);
  const [expanded, setExpanded] = useState<string[]>(() => initialCategories.filter((category) => category.level < 3).map((category) => category.id));
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<"All" | LevelLabel>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | CatalogStatus>("All");
  const [formConfig, setFormConfig] = useState<{ category?: CatalogCategoryNode; level?: CategoryLevel; parentId?: string | null } | null>(null);
  const [viewing, setViewing] = useState<CatalogCategoryNode | null>(null);
  const [blockedMessage, setBlockedMessage] = useState("");
  const filtersActive = Boolean(query.trim() || levelFilter !== "All" || statusFilter !== "All");
  const treeRows = flattenTree(categories, expanded).filter(({ category }) => {
    const matchesQuery = !query.trim() || category.name.toLowerCase().includes(query.trim().toLowerCase());
    const matchesLevel = levelFilter === "All" || levelLabel(category.level) === levelFilter;
    const matchesStatus = statusFilter === "All" || category.status === statusFilter;
    return matchesQuery && matchesLevel && matchesStatus;
  });
  const saveCategory = (category: CatalogCategoryNode, parentChanged: boolean) => {
    if (parentChanged && (childrenOf(categories, category.id).length || productCountFor(category, categories, products))) {
      setBlockedMessage("Parent changed. Linked child categories and products will use the updated hierarchy path in this demo.");
    }
    setCategories((previous) => previous.some((item) => item.id === category.id) ? previous.map((item) => item.id === category.id ? category : item) : [...previous, category]);
    if (category.parentId) setExpanded((previous) => previous.includes(category.parentId!) ? previous : [...previous, category.parentId!]);
    setFormConfig(null);
  };
  const requestDelete = (category: CatalogCategoryNode) => {
    if (childrenOf(categories, category.id).length || productCountFor(category, categories, products) > 0) return setBlockedMessage("This category cannot be deleted because it contains child categories or linked products. Reassign or remove them first.");
    setCategories((previous) => previous.filter((item) => item.id !== category.id));
  };
  return <div className="mx-auto max-w-[1680px] space-y-5"><Hero title="Categories" subtitle="Organize pharmacy categories across main categories, subcategories, and product groups." action={<Button variant="primary" onClick={() => setFormConfig({ level: 1, parentId: null })}><Plus className="h-4 w-4" />Add Category</Button>} /><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Kpi label="Main Categories" value={String(categories.filter((item) => item.level === 1).length)} detail="Top-level pharmacy departments" /><Kpi label="Subcategories" value={String(categories.filter((item) => item.level === 2).length)} detail="Second-level category groups" /><Kpi label="Product Groups" value={String(categories.filter((item) => item.level === 3).length)} detail="Deepest assignable groups" /><Kpi label="Catalog Products" value={formatNumber(products.length)} detail="Products linked to hierarchy" /></section><Card className="p-4"><div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_190px_160px_auto]"><label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className={`${inputClass} w-full pl-9`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by category name" /></label><select className={inputClass} value={levelFilter} onChange={(event) => setLevelFilter(event.target.value as typeof levelFilter)}><option>All</option><option>Main Category</option><option>Subcategory</option><option>Product Group</option></select><select className={inputClass} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}><option>All</option><option>Active</option><option>Inactive</option></select>{filtersActive ? <Button onClick={() => { setQuery(""); setLevelFilter("All"); setStatusFilter("All"); }}>Clear Filters</Button> : null}</div></Card><Card className="overflow-hidden"><div className="overflow-x-auto scrollbar-soft"><table className="w-full min-w-[980px] text-sm"><thead className="bg-brand-50 text-brand-900"><tr>{["Category", "Level", "Products", "Status", "Actions"].map((header) => <th key={header} className={cn("h-12 px-4 align-middle text-xs font-bold uppercase tracking-wide", header === "Category" ? "text-left" : "text-center")}>{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 bg-white">{treeRows.map(({ category, depth }) => { const childCount = childrenOf(categories, category.id).length; const rowExpanded = expanded.includes(category.id); return <tr key={category.id} className="hover:bg-brand-50/40"><td className="px-4 py-3 text-left font-bold text-slate-900"><div className="flex items-center gap-2" style={{ paddingLeft: depth * 28 }}>{childCount ? <button className="grid h-7 w-7 place-items-center rounded-md hover:bg-brand-50" onClick={() => setExpanded((previous) => previous.includes(category.id) ? previous.filter((id) => id !== category.id) : [...previous, category.id])}>{rowExpanded ? <ChevronDown className="h-4 w-4 text-brand-700" /> : <ChevronRight className="h-4 w-4 text-brand-700" />}</button> : <span className="h-7 w-7" />}{depth > 0 ? <span className="h-px w-5 bg-brand-200" /> : null}<CategoryIcon level={category.level} />{category.name}</div></td><td className="px-4 py-3 text-center font-semibold text-slate-700">{levelLabel(category.level)}</td><td className="px-4 py-3 text-center font-semibold text-slate-900">{formatNumber(productCountFor(category, categories, products))}</td><td className="px-4 py-3 text-center"><StatusBadge value={category.status} /></td><td className="px-4 py-3"><div className="flex justify-center gap-1.5"><Button size="icon" variant="ghost" title="View Details" aria-label="View Details" onClick={() => setViewing(category)}><Eye className="h-4 w-4" /></Button><Button size="icon" variant="ghost" title="Edit" aria-label="Edit" onClick={() => setFormConfig({ category })}><Pencil className="h-4 w-4" /></Button><ActionMenu actions={[...(category.level === 1 ? [{ label: "Add Subcategory", onClick: () => setFormConfig({ level: 2, parentId: category.id }) }] : []), ...(category.level === 2 ? [{ label: "Add Product Group", onClick: () => setFormConfig({ level: 3, parentId: category.id }) }] : []), { label: category.status === "Active" ? "Deactivate" : "Activate", onClick: () => setCategories((previous) => previous.map((item) => item.id === category.id ? { ...item, status: item.status === "Active" ? "Inactive" : "Active", lastUpdated: "2026-07-26" } : item)) }, { label: "Delete", onClick: () => requestDelete(category), danger: true }]} /></div></td></tr>; })}</tbody></table></div></Card>{formConfig ? <CategoryForm categories={categories} category={formConfig.category} defaultLevel={formConfig.level} defaultParentId={formConfig.parentId} onCancel={() => setFormConfig(null)} onSave={saveCategory} /> : null}{viewing ? <CategoryDetails category={viewing} categories={categories} products={products} onClose={() => setViewing(null)} /> : null}{blockedMessage ? <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm"><Card className="w-full max-w-md p-5"><div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" /><div><h2 className="font-bold text-slate-950">Category Notice</h2><p className="mt-2 text-sm leading-6 text-slate-600">{blockedMessage}</p></div></div><div className="mt-5 flex justify-end"><Button variant="primary" onClick={() => setBlockedMessage("")}>Close</Button></div></Card></div> : null}</div>;
}

function ProductForm({ product, categories, onCancel, onSave }: { product?: CatalogProductItem; categories: CatalogCategoryNode[]; onCancel: () => void; onSave: (product: CatalogProductItem) => void }) {
  const activeMain = categories.filter((item) => item.level === 1 && item.status === "Active");
  const [form, setForm] = useState<CatalogProductItem>(product ?? { id: `prod-${Date.now()}`, product: "", sku: "", mainCategoryId: activeMain[0]?.id ?? "", subcategoryId: "", productGroupId: null, brand: "GSK", stock: 0, price: 0, status: "Active" });
  const subcategories = categories.filter((item) => item.parentId === form.mainCategoryId && item.level === 2 && item.status === "Active");
  const groups = categories.filter((item) => item.parentId === form.subcategoryId && item.level === 3 && item.status === "Active");
  const [error, setError] = useState("");
  const setMain = (value: string) => setForm((previous) => ({ ...previous, mainCategoryId: value, subcategoryId: "", productGroupId: null }));
  const setSubcategory = (value: string) => setForm((previous) => ({ ...previous, subcategoryId: value, productGroupId: null }));
  const submit = () => {
    if (!form.product.trim()) return setError("Product name is required.");
    if (!form.sku.trim()) return setError("SKU is required.");
    if (!form.mainCategoryId) return setError("Main Category is required.");
    if (!form.subcategoryId) return setError("Subcategory is required.");
    if (groups.length && !form.productGroupId) return setError("Product Group is required for this subcategory.");
    onSave({ ...form, product: form.product.trim(), sku: form.sku.trim(), productGroupId: groups.length ? form.productGroupId : null });
  };
  return <Drawer title={product ? "Edit Product" : "Add Product"} onClose={onCancel} footer={<div className="flex justify-end gap-2"><Button onClick={onCancel}>Cancel</Button><Button variant="primary" onClick={submit}>Save Product</Button></div>}><div className="space-y-4">{error ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}<div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-semibold text-slate-700">Product Name<input className={inputClass} value={form.product} onChange={(event) => setForm({ ...form, product: event.target.value })} /></label><label className="grid gap-1.5 text-sm font-semibold text-slate-700">SKU<input className={inputClass} value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} /></label></div><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-semibold text-slate-700">Main Category<select className={inputClass} value={form.mainCategoryId} onChange={(event) => setMain(event.target.value)}><option value="">Select main category</option>{activeMain.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="grid gap-1.5 text-sm font-semibold text-slate-700">Subcategory<select className={inputClass} value={form.subcategoryId} disabled={!form.mainCategoryId} onChange={(event) => setSubcategory(event.target.value)}><option value="">Select subcategory</option>{subcategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="grid gap-1.5 text-sm font-semibold text-slate-700">Product Group<select className={inputClass} value={form.productGroupId ?? ""} disabled={!form.subcategoryId || !groups.length} onChange={(event) => setForm({ ...form, productGroupId: event.target.value || null })}><option value="">{groups.length ? "Select product group" : "No product group required"}</option>{groups.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="grid gap-1.5 text-sm font-semibold text-slate-700">Brand<select className={inputClass} value={form.brand} onChange={(event) => setForm({ ...form, brand: event.target.value })}>{brands.map((brand) => <option key={brand}>{brand}</option>)}</select></label><label className="grid gap-1.5 text-sm font-semibold text-slate-700">Stock<input className={inputClass} type="number" value={form.stock} onChange={(event) => setForm({ ...form, stock: Number(event.target.value) })} /></label><label className="grid gap-1.5 text-sm font-semibold text-slate-700">Price<input className={inputClass} type="number" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} /></label><label className="grid gap-1.5 text-sm font-semibold text-slate-700">Status<select className={inputClass} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as CatalogStatus })}><option>Active</option><option>Inactive</option></select></label><label className="grid gap-1.5 text-sm font-semibold text-slate-700">Barcode<input className={inputClass} value={form.barcode ?? ""} onChange={(event) => setForm({ ...form, barcode: event.target.value })} /></label><label className="grid gap-1.5 text-sm font-semibold text-slate-700">Product Image<input className={inputClass} value={form.productImage ?? ""} onChange={(event) => setForm({ ...form, productImage: event.target.value })} /></label><label className="grid gap-1.5 text-sm font-semibold text-slate-700">Dosage Form<input className={inputClass} value={form.dosageForm ?? ""} onChange={(event) => setForm({ ...form, dosageForm: event.target.value })} /></label><label className="grid gap-1.5 text-sm font-semibold text-slate-700">Strength<input className={inputClass} value={form.strength ?? ""} onChange={(event) => setForm({ ...form, strength: event.target.value })} /></label></div><div className="rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-sm"><span className="font-semibold text-slate-700">Category Path:</span> <span className="font-bold text-brand-800">{categoryPath(categories, form) || "Select category path"}</span></div></div></Drawer>;
}

export function CatalogProductsOperationsPage() {
  const [categories] = useState(initialCategories);
  const [products, setProducts] = useState(initialProducts);
  const [formProduct, setFormProduct] = useState<CatalogProductItem | undefined>();
  const [viewing, setViewing] = useState<CatalogProductItem | undefined>();
  const [query, setQuery] = useState("");
  const [mainFilter, setMainFilter] = useState("All");
  const [subcategoryFilter, setSubcategoryFilter] = useState("All");
  const [groupFilter, setGroupFilter] = useState("All");
  const [brandFilter, setBrandFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"All" | CatalogStatus>("All");
  const subcategoryOptions = categories.filter((item) => item.level === 2 && (mainFilter === "All" || item.parentId === mainFilter));
  const groupOptions = categories.filter((item) => item.level === 3 && (subcategoryFilter === "All" || item.parentId === subcategoryFilter));
  const filtered = products.filter((product) => (!query.trim() || product.product.toLowerCase().includes(query.trim().toLowerCase()) || product.sku.toLowerCase().includes(query.trim().toLowerCase())) && (mainFilter === "All" || product.mainCategoryId === mainFilter) && (subcategoryFilter === "All" || product.subcategoryId === subcategoryFilter) && (groupFilter === "All" || product.productGroupId === groupFilter) && (brandFilter === "All" || product.brand === brandFilter) && (statusFilter === "All" || product.status === statusFilter));
  const filtersActive = Boolean(query.trim() || mainFilter !== "All" || subcategoryFilter !== "All" || groupFilter !== "All" || brandFilter !== "All" || statusFilter !== "All");
  const saveProduct = (product: CatalogProductItem) => { setProducts((previous) => previous.some((item) => item.id === product.id) ? previous.map((item) => item.id === product.id ? product : item) : [product, ...previous]); setFormProduct(undefined); };
  const activeProducts = products.filter((product) => product.status === "Active").length;
  const lowStock = products.filter((product) => product.stock <= 20).length;
  return <div className="mx-auto max-w-[1680px] space-y-5"><Hero title="Products" subtitle="Assign products through the full category hierarchy using cascading category selectors." action={<Button variant="primary" onClick={() => setFormProduct({ id: "", product: "", sku: "", mainCategoryId: "", subcategoryId: "", productGroupId: null, brand: "GSK", stock: 0, price: 0, status: "Active" })}><Plus className="h-4 w-4" />Add Product</Button>} /><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Kpi label="Total Products" value={formatNumber(products.length)} detail="Visible demo products" /><Kpi label="Active Products" value={formatNumber(activeProducts)} detail="Available for sale" /><Kpi label="Low Stock Products" value={formatNumber(lowStock)} detail="Need replenishment review" /><Kpi label="Assigned Groups" value={formatNumber(new Set(products.map((product) => product.productGroupId ?? product.subcategoryId)).size)} detail="Deepest catalog assignments" /></section><Card className="p-4"><div className="grid gap-3 xl:grid-cols-[1fr_180px_180px_180px_160px_150px_auto]"><label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className={`${inputClass} w-full pl-9`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Product Search" /></label><select className={inputClass} value={mainFilter} onChange={(event) => { setMainFilter(event.target.value); setSubcategoryFilter("All"); setGroupFilter("All"); }}><option value="All">All Main</option>{categories.filter((item) => item.level === 1).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select className={inputClass} value={subcategoryFilter} onChange={(event) => { setSubcategoryFilter(event.target.value); setGroupFilter("All"); }} disabled={mainFilter === "All"}><option value="All">All Subcategories</option>{subcategoryOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select className={inputClass} value={groupFilter} disabled={subcategoryFilter === "All"} onChange={(event) => setGroupFilter(event.target.value)}><option value="All">All Groups</option>{groupOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select className={inputClass} value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)}><option>All</option>{brands.map((brand) => <option key={brand}>{brand}</option>)}</select><select className={inputClass} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}><option>All</option><option>Active</option><option>Inactive</option></select>{filtersActive ? <Button onClick={() => { setQuery(""); setMainFilter("All"); setSubcategoryFilter("All"); setGroupFilter("All"); setBrandFilter("All"); setStatusFilter("All"); }}>Clear Filters</Button> : null}</div></Card><Card className="overflow-hidden"><div className="overflow-x-auto scrollbar-soft"><table className="w-full min-w-[1040px] text-sm"><thead className="bg-brand-50 text-brand-900"><tr>{["Product", "Category Path", "Brand", "Stock", "Price", "Status", "Actions"].map((header) => <th key={header} className={cn("h-12 px-4 text-center align-middle text-xs font-bold uppercase tracking-wide", header === "Product" && "text-left")}>{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 bg-white">{filtered.map((product) => <tr key={product.id} className="hover:bg-brand-50/40"><td className="px-4 py-4 text-left font-bold text-slate-900">{product.product}</td><td className="px-4 py-4 text-center font-medium text-slate-700">{categoryPath(categories, product)}</td><td className="px-4 py-4 text-center">{product.brand}</td><td className="px-4 py-4 text-center">{formatNumber(product.stock)}</td><td className="px-4 py-4 text-center">{product.price} EGP</td><td className="px-4 py-4 text-center"><StatusBadge value={product.status} /></td><td className="px-4 py-4"><div className="flex justify-center gap-1.5"><Button size="icon" variant="ghost" aria-label="View Product" title="View Product" onClick={() => setViewing(product)}><Eye className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label="Edit Product" title="Edit Product" onClick={() => setFormProduct(product)}><Pencil className="h-4 w-4" /></Button></div></td></tr>)}</tbody></table></div></Card>{formProduct ? <ProductForm product={formProduct.id ? formProduct : undefined} categories={categories} onCancel={() => setFormProduct(undefined)} onSave={saveProduct} /> : null}{viewing ? <Drawer title={viewing.product} onClose={() => setViewing(undefined)}><Card className="p-4"><dl className="grid gap-3 text-sm">{[["SKU", viewing.sku], ["Category Path", categoryPath(categories, viewing)], ["Brand", viewing.brand], ["Stock", formatNumber(viewing.stock)], ["Price", `${viewing.price} EGP`], ["Status", viewing.status], ["Barcode", viewing.barcode ?? "-"], ["Dosage Form", viewing.dosageForm ?? "-"], ["Strength", viewing.strength ?? "-"]].map(([label, value]) => <div key={label} className="flex justify-between gap-4 border-b border-slate-100 pb-2 last:border-0"><dt className="text-slate-500">{label}</dt><dd className="text-right font-semibold text-slate-900">{value}</dd></div>)}</dl></Card></Drawer> : null}</div>;
}
