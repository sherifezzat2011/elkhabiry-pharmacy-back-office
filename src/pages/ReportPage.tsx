import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Bike, CheckCircle2, ChevronDown, ChevronRight, CircleDot, Copy, Eye, FileSpreadsheet, Folder, MapPinned, MoreHorizontal, Pause, Pencil, Play, Plus, Search, Tag, Truck, X } from "lucide-react";
import { format, startOfWeek, subDays } from "date-fns";
import { useSearchParams } from "react-router-dom";
import { BarPanel, CategorySharePanel, DonutPanel, HorizontalBarPanel, InventoryMovementTrendPanel, MainChart, MovementPanel, ParetoPanel } from "@/components/Charts";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { EntityDrawerLauncher } from "@/components/EntityDrawer";
import { GlobalFilters } from "@/components/GlobalFilters";
import { InventoryMovementFilters } from "@/components/InventoryMovementFilters";
import { KpiCard } from "@/components/KpiCard";
import { OrdersByAreaFilters } from "@/components/OrdersByAreaFilters";
import { OrdersByDayFilters } from "@/components/OrdersByDayFilters";
import { ProductPerformanceFilters } from "@/components/ProductPerformanceFilters";
import { ReportSkeleton } from "@/components/Skeleton";
import { Card } from "@/components/ui/Card";
import { getAvailableAreasForCity, getFilterOptions, getOverviewReport, getReport, type OrdersByDayMode } from "@/services/mock-api";
import { useFilterStore } from "@/store/filters";
import type { TableRow } from "@/types";
import { Button } from "@/components/ui/Button";
import { cn, formatCompactCurrency, formatCurrency, formatNumber } from "@/lib/utils";

function ProductDetailDrawer({ row, onClose }: { row: TableRow; onClose: () => void }) {
  const revenue = Number(row.revenue ?? 0);
  const profit = Number(row.grossProfit ?? 0);
  const units = Number(row.unitsSold ?? 0);
  const stockDays = Number(row.stockDays ?? 0);
  const trend = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month, index) => ({ name: month, value: Math.round((revenue / 6) * (0.82 + index * 0.07)) }));
  const branches = ["Nasr City", "Heliopolis", "Mansoura", "Alexandria", "Tanta"].map((branch, index) => ({ name: branch, revenue: Math.round(revenue * (0.28 - index * 0.035)), profit: Math.round(profit * (0.28 - index * 0.035)) }));
  const recommendation = stockDays < 15 ? "Stock coverage below 15 days. Reorder recommended." : profit / Math.max(1, revenue) > 0.3 ? "High revenue and healthy margin." : "Strong growth in Cairo branches.";
  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm" aria-label="Close product detail" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-lg overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Product Detail</p>
            <h2 className="truncate text-lg font-semibold text-slate-950">{String(row.product ?? "Product")}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>
        <div className="space-y-4 p-5">
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-slate-950">Overview</h3>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-slate-500">Revenue</p><p className="font-semibold text-slate-900">{formatCurrency(revenue)}</p></div>
              <div><p className="text-slate-500">Gross Profit</p><p className="font-semibold text-slate-900">{formatCurrency(profit)}</p></div>
              <div><p className="text-slate-500">Margin</p><p className="font-semibold text-slate-900">{String(row["margin %"] ?? "-")}</p></div>
              <div><p className="text-slate-500">Units Sold</p><p className="font-semibold text-slate-900">{units}</p></div>
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-slate-950">Sales Trend</h3>
            <div className="mt-3 space-y-2">
              {trend.map((item) => (
                <div key={item.name} className="grid gap-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{item.name}</span>
                    <span>{formatCurrency(item.value)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-brand-500" style={{ width: `${Math.min(100, (item.value / Math.max(1, revenue / 4)) * 100)}%` }} />
                  </div>
                </div>
              ))}
              <p className="text-xs text-slate-500">Previous period comparison: +7.4%</p>
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-slate-950">Inventory</h3>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-slate-500">Current Stock</p><p className="font-semibold text-slate-900">{Math.round(stockDays * Math.max(1, units / 181))} units</p></div>
              <div><p className="text-slate-500">Days of Stock</p><p className="font-semibold text-slate-900">{stockDays} days</p></div>
              <div><p className="text-slate-500">Expiry Risk</p><p className="font-semibold text-slate-900">{stockDays > 90 ? "Monitor aging" : "Controlled"}</p></div>
              <div><p className="text-slate-500">Status</p><p className="font-semibold text-slate-900">{String(row.status ?? "-")}</p></div>
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-slate-950">Branches</h3>
            <div className="mt-3 space-y-2 text-sm">
              {branches.map((branch) => (
                <div key={branch.name} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                  <span className="font-medium text-slate-700">{branch.name}</span>
                  <span className="text-slate-500">{formatCurrency(branch.revenue)} · {formatCurrency(branch.profit)} profit</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="bg-brand-950 p-4 text-white">
            <h3 className="text-sm font-semibold">Recommendations</h3>
            <p className="mt-2 text-sm leading-6 text-brand-50">{recommendation}</p>
          </Card>
        </div>
      </aside>
    </div>
  );
}

function ProductPerformanceEmptyState() {
  const setFilter = useFilterStore((state) => state.setFilter);
  const resetFilters = useFilterStore((state) => state.resetFilters);
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <h3 className="text-base font-semibold text-slate-900">No product activity found</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">No sales activity was found for the selected product, category, branch, and date range.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Button onClick={() => setFilter("product", "All")}>Reset Product</Button>
        <Button onClick={() => setFilter("category", "All")}>Reset Category</Button>
        <Button variant="primary" onClick={resetFilters}>Reset All Filters</Button>
      </div>
    </div>
  );
}

function OrdersByAreaEmptyState() {
  const setFilter = useFilterStore((state) => state.setFilter);
  const resetFilters = useFilterStore((state) => state.resetFilters);
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <h3 className="text-base font-semibold text-slate-900">No area sales activity found</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">No sales activity was found for the selected city, area, category, and product.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Button onClick={() => setFilter("area", "All")}>Reset Area</Button>
        <Button onClick={() => setFilter("category", "All")}>Reset Category</Button>
        <Button variant="primary" onClick={resetFilters}>Reset All Filters</Button>
      </div>
    </div>
  );
}

function OrdersByDayEmptyState({ mode }: { mode: OrdersByDayMode }) {
  const setFilter = useFilterStore((state) => state.setFilter);
  const resetFilters = useFilterStore((state) => state.resetFilters);
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <h3 className="text-base font-semibold text-slate-900">No weekday order activity found</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {mode === "today" ? "No completed orders have been recorded today." : mode === "daily" ? "No daily order activity was found for the selected period." : "No orders were found for the selected weekday filters."}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Button onClick={() => setFilter("branch", "All")}>Reset Branch</Button>
        <Button onClick={() => setFilter("product", "All")}>Reset Product</Button>
        <Button variant="primary" onClick={resetFilters}>Reset All Filters</Button>
      </div>
    </div>
  );
}

type OfferStatus = "Draft" | "Active" | "Scheduled" | "Paused" | "Completed" | "Cancelled";
type OfferType = "Percentage Discount" | "Fixed Discount" | "Bundle Offer" | "Buy X Get Y" | "Free Delivery";

type OfferProduct = {
  id: string;
  name: string;
  category: string;
  originalPrice: number;
  offerPrice: number;
  availability: "In Stock" | "Low Stock";
};

type OfferPerformance = {
  orders: number;
  revenue: number;
  sessions: number;
  conversions: number;
};

type Offer = {
  id: string;
  name: string;
  type: OfferType;
  rule: string;
  discountValue: number;
  startDate: string;
  endDate: string;
  channels: string[];
  createdBy: string;
  lastUpdated: string;
  status: OfferStatus;
  minimumBasketValue: number;
  usageLimitPerCustomer: number;
  allowPromoCodeCombination: boolean;
  products: OfferProduct[];
  performance: OfferPerformance;
  conditions: string[];
};

const availableOfferProducts: OfferProduct[] = [
  { id: "prod-1", name: "Centrum Advance 30 Tablets", category: "Vitamins", originalPrice: 420, offerPrice: 336, availability: "In Stock" },
  { id: "prod-2", name: "Vitamin C 1000 mg", category: "Supplements", originalPrice: 180, offerPrice: 144, availability: "In Stock" },
  { id: "prod-3", name: "Omega-3 Capsules", category: "Supplements", originalPrice: 310, offerPrice: 248, availability: "In Stock" },
  { id: "prod-4", name: "Panadol Advance", category: "Pain Relief", originalPrice: 65, offerPrice: 58, availability: "In Stock" },
  { id: "prod-5", name: "CeraVe Moisturizing Cream", category: "Dermocosmetics", originalPrice: 520, offerPrice: 468, availability: "Low Stock" },
  { id: "prod-6", name: "Omron Blood Pressure Monitor", category: "Devices", originalPrice: 1950, offerPrice: 1755, availability: "In Stock" },
];

const offerStatuses: OfferStatus[] = ["Active", "Scheduled", "Paused", "Completed", "Cancelled"];
const offerTypes: OfferType[] = ["Percentage Discount", "Fixed Discount", "Bundle Offer", "Buy X Get Y", "Free Delivery"];
const offerChannels = ["Mobile App", "Website", "WhatsApp", "Call Center", "Walk-in", "Talabat"];

const initialPromotionOffers: Offer[] = [
  {
    id: "offer-1",
    name: "Summer Vitamins 20%",
    type: "Percentage Discount",
    rule: "20% off selected vitamins and supplements",
    discountValue: 20,
    startDate: "2026-07-15",
    endDate: "2026-08-15",
    channels: ["Mobile App", "Website"],
    createdBy: "Ahmed El Khabiry",
    lastUpdated: "2026-07-21",
    status: "Active",
    minimumBasketValue: 300,
    usageLimitPerCustomer: 2,
    allowPromoCodeCombination: false,
    products: availableOfferProducts.slice(0, 5),
    performance: { orders: 142, revenue: 18450, sessions: 760, conversions: 142 },
    conditions: ["Minimum basket value EGP 300.", "Available for retail customers.", "Limit 2 uses per customer.", "Cannot be combined with promo codes."],
  },
  {
    id: "offer-2",
    name: "Kids Essentials Pack",
    type: "Bundle Offer",
    rule: "Bundle price on kids vitamins and daily essentials",
    discountValue: 15,
    startDate: "2026-07-10",
    endDate: "2026-08-10",
    channels: ["Website", "Walk-in"],
    createdBy: "Mariam Tarek",
    lastUpdated: "2026-07-20",
    status: "Active",
    minimumBasketValue: 250,
    usageLimitPerCustomer: 1,
    allowPromoCodeCombination: false,
    products: [availableOfferProducts[0], availableOfferProducts[1], availableOfferProducts[3], availableOfferProducts[4]],
    performance: { orders: 87, revenue: 9200, sessions: 520, conversions: 87 },
    conditions: ["Bundle applies when all included products are in basket.", "Available for families and retail customers.", "Limit 1 bundle per customer.", "Cannot be combined with promo codes."],
  },
  {
    id: "offer-3",
    name: "Blood Pressure Awareness",
    type: "Percentage Discount",
    rule: "10% off blood pressure monitors and heart care supplements",
    discountValue: 10,
    startDate: "2026-07-25",
    endDate: "2026-08-25",
    channels: ["Mobile App", "Call Center", "Walk-in"],
    createdBy: "Ahmed El Khabiry",
    lastUpdated: "2026-07-19",
    status: "Scheduled",
    minimumBasketValue: 500,
    usageLimitPerCustomer: 1,
    allowPromoCodeCombination: false,
    products: [availableOfferProducts[2], availableOfferProducts[5], availableOfferProducts[0], availableOfferProducts[1]],
    performance: { orders: 64, revenue: 7100, sessions: 410, conversions: 64 },
    conditions: ["Minimum basket value EGP 500.", "Valid on selected devices and heart-care items.", "Limit 1 use per customer.", "Cannot be combined with promo codes."],
  },
];

const promoCodes = [
  { code: "FREESHIP", discount: "Free Delivery", used: "145", revenue: "12,400 EGP", status: "Active" },
  { code: "SAVE20", discount: "20%", used: "92", revenue: "9,850 EGP", status: "Active" },
  { code: "VITAMIN10", discount: "10%", used: "51", revenue: "4,900 EGP", status: "Active" },
];

const deliveryAreas = [
  { area: "Tanta Center", orders: 124, fee: "25 EGP", revenue: "3,100 EGP" },
  { area: "El Geish", orders: 88, fee: "30 EGP", revenue: "2,640 EGP" },
  { area: "El Bahr", orders: 76, fee: "20 EGP", revenue: "1,520 EGP" },
  { area: "Stadium District", orders: 61, fee: "25 EGP", revenue: "1,525 EGP" },
];

const dailyDeliveries = [
  { day: "Mon", value: 182 },
  { day: "Tue", value: 214 },
  { day: "Wed", value: 196 },
  { day: "Thu", value: 238 },
  { day: "Fri", value: 171 },
  { day: "Sat", value: 248 },
  { day: "Sun", value: 226 },
];

type CatalogStatus = "Active" | "Inactive";
type CatalogCategory = { id: string; name: string; parentId: string | null; products: number; status: CatalogStatus; image: string; description: string; createdDate: string; lastUpdated: string };
type CatalogProduct = { id: string; product: string; category: string; brand: string; stock: number; price: number; status: CatalogStatus };
type CatalogBrand = { id: string; brand: string; products: number; status: CatalogStatus };

const categoryMeta = { createdDate: "2026-01-15", lastUpdated: "2026-07-20" };
const initialCatalogCategories: CatalogCategory[] = [
  { id: "cat-medicines", name: "Medicines", parentId: null, products: 1245, status: "Active", image: "medicines.jpg", description: "Prescription and over-the-counter medicines.", ...categoryMeta },
  { id: "cat-pain", name: "Pain Relief", parentId: "cat-medicines", products: 245, status: "Active", image: "pain-relief.jpg", description: "Analgesics and pain management medicines.", ...categoryMeta },
  { id: "cat-antibiotics", name: "Antibiotics", parentId: "cat-medicines", products: 180, status: "Active", image: "antibiotics.jpg", description: "Prescription antibiotic category.", ...categoryMeta },
  { id: "cat-diabetes", name: "Diabetes", parentId: "cat-medicines", products: 120, status: "Active", image: "diabetes.jpg", description: "Diabetes care medicines and supplies.", ...categoryMeta },
  { id: "cat-bp", name: "Blood Pressure", parentId: "cat-medicines", products: 96, status: "Active", image: "blood-pressure.jpg", description: "Hypertension care products.", ...categoryMeta },
  { id: "cat-digestive", name: "Digestive Health", parentId: "cat-medicines", products: 88, status: "Active", image: "digestive.jpg", description: "Digestive support and stomach care.", ...categoryMeta },
  { id: "cat-vitamins", name: "Vitamins & Supplements", parentId: null, products: 486, status: "Active", image: "vitamins.jpg", description: "Daily health and wellness supplements.", ...categoryMeta },
  { id: "cat-multi", name: "Multivitamins", parentId: "cat-vitamins", products: 142, status: "Active", image: "multivitamins.jpg", description: "Adult and family multivitamins.", ...categoryMeta },
  { id: "cat-vit-c", name: "Vitamin C", parentId: "cat-vitamins", products: 84, status: "Active", image: "vitamin-c.jpg", description: "Vitamin C tablets, sachets, and gummies.", ...categoryMeta },
  { id: "cat-vit-d", name: "Vitamin D", parentId: "cat-vitamins", products: 73, status: "Active", image: "vitamin-d.jpg", description: "Vitamin D supplements.", ...categoryMeta },
  { id: "cat-omega", name: "Omega 3", parentId: "cat-vitamins", products: 66, status: "Active", image: "omega-3.jpg", description: "Omega and heart health supplements.", ...categoryMeta },
  { id: "cat-baby", name: "Baby Care", parentId: null, products: 278, status: "Active", image: "baby-care.jpg", description: "Baby care essentials.", ...categoryMeta },
  { id: "cat-formula", name: "Baby Formula", parentId: "cat-baby", products: 96, status: "Active", image: "formula.jpg", description: "Infant formula products.", ...categoryMeta },
  { id: "cat-diapers", name: "Diapers", parentId: "cat-baby", products: 82, status: "Active", image: "diapers.jpg", description: "Baby diapers and pants.", ...categoryMeta },
  { id: "cat-wipes", name: "Baby Wipes", parentId: "cat-baby", products: 38, status: "Inactive", image: "wipes.jpg", description: "Baby wipes and cleansing.", ...categoryMeta },
];

const initialCatalogProducts: CatalogProduct[] = [
  { id: "prod-panadol", product: "Panadol Extra", category: "Pain Relief", brand: "GSK", stock: 125, price: 68, status: "Active" },
  { id: "prod-augmentin", product: "Augmentin 1g", category: "Antibiotics", brand: "GSK", stock: 42, price: 185, status: "Active" },
  { id: "prod-centrum", product: "Centrum", category: "Multivitamins", brand: "Haleon", stock: 87, price: 420, status: "Active" },
  { id: "prod-accu", product: "Accu-Chek Active", category: "Medical Devices", brand: "Roche", stock: 15, price: 890, status: "Active" },
  { id: "prod-cerave", product: "CeraVe Moisturizing Cream", category: "Dermocosmetics", brand: "L'Oreal", stock: 22, price: 520, status: "Inactive" },
];

const initialCatalogBrands: CatalogBrand[] = [
  { id: "brand-eva", brand: "Eva Pharma", products: 145, status: "Active" },
  { id: "brand-hikma", brand: "Hikma", products: 92, status: "Active" },
  { id: "brand-eipico", brand: "EIPICO", products: 75, status: "Active" },
  { id: "brand-gsk", brand: "GSK", products: 68, status: "Active" },
  { id: "brand-haleon", brand: "Haleon", products: 54, status: "Active" },
];

function DemoKpi({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Card className="border-t-4 border-t-brand-500 p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{detail}</p>
    </Card>
  );
}

function DemoBadge({ value }: { value: string }) {
  const tone =
    value === "Active" ? "bg-brand-50 text-brand-800 ring-brand-100"
      : value === "Scheduled" ? "bg-amber-50 text-amber-700 ring-amber-100"
        : value === "Paused" ? "bg-orange-50 text-orange-700 ring-orange-100"
          : value === "Completed" ? "bg-slate-100 text-slate-700 ring-slate-200"
            : value === "Cancelled" ? "bg-red-50 text-red-700 ring-red-100"
              : "bg-slate-50 text-slate-600 ring-slate-200";
  return (
    <span className={cn("inline-flex min-h-7 items-center justify-center whitespace-nowrap rounded-full px-3 text-xs font-bold ring-1", tone)}>
      <CircleDot className="mr-1.5 h-3 w-3" />
      {value}
    </span>
  );
}

function ExecutiveHero({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle: string; action?: JSX.Element }) {
  return (
    <section className="rounded-xl border border-brand-100 bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">{title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{subtitle}</p>
        </div>
        {action ? <div className="shrink-0 lg:pb-1">{action}</div> : null}
      </div>
    </section>
  );
}

function SimpleExecutiveTable({ headers, rows }: { headers: string[]; rows: (string | JSX.Element)[][] }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto scrollbar-soft">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-brand-50 text-brand-900">
            <tr>
              {headers.map((header) => (
                <th key={header} className="h-12 px-4 text-center align-middle text-xs font-bold uppercase tracking-wide">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="transition hover:bg-brand-50/40">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-4 text-center align-middle font-medium text-slate-700">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function formatOfferCurrency(value: number) {
  return `${formatNumber(Math.round(value))} EGP`;
}

function formatOfferPeriod(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const sameYear = start.getFullYear() === end.getFullYear();
  return `${format(start, "MMM d")} - ${format(end, sameYear ? "MMM d, yyyy" : "MMM d, yyyy")}`;
}

function conversionRate(offer: Offer) {
  return offer.performance.sessions ? (offer.performance.conversions / offer.performance.sessions) * 100 : 0;
}

function previousOfferExists(offers: Offer[], offerId: string) {
  return offers.some((offer) => offer.id === offerId);
}

type OfferFormState = {
  name: string;
  type: OfferType;
  rule: string;
  discountValue: string;
  startDate: string;
  endDate: string;
  productIds: string[];
  minimumBasketValue: string;
  usageLimitPerCustomer: string;
  channels: string[];
  allowPromoCodeCombination: boolean;
  statusMode: "Draft" | "Scheduled" | "Active";
};

function formStateFromOffer(offer?: Offer): OfferFormState {
  return {
    name: offer?.name ?? "",
    type: offer?.type ?? "Percentage Discount",
    rule: offer?.rule ?? "",
    discountValue: String(offer?.discountValue ?? 20),
    startDate: offer?.startDate ?? "2026-07-22",
    endDate: offer?.endDate ?? "2026-08-22",
    productIds: offer?.products.map((product) => product.id) ?? [availableOfferProducts[0].id],
    minimumBasketValue: String(offer?.minimumBasketValue ?? 250),
    usageLimitPerCustomer: String(offer?.usageLimitPerCustomer ?? 1),
    channels: offer?.channels ?? ["Mobile App", "Website"],
    allowPromoCodeCombination: offer?.allowPromoCodeCombination ?? false,
    statusMode: offer?.status === "Active" ? "Active" : offer?.status === "Scheduled" ? "Scheduled" : "Draft",
  };
}

function OfferFormDrawer({ offer, onClose, onSave }: { offer?: Offer; onClose: () => void; onSave: (offer: Offer) => void }) {
  const [form, setForm] = useState<OfferFormState>(() => formStateFromOffer(offer));
  const [errors, setErrors] = useState<string[]>([]);
  const editing = Boolean(offer);
  const showDiscount = form.type === "Percentage Discount" || form.type === "Fixed Discount";

  const setField = <K extends keyof OfferFormState>(key: K, value: OfferFormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const toggleProduct = (productId: string) => {
    setForm((previous) => ({
      ...previous,
      productIds: previous.productIds.includes(productId) ? previous.productIds.filter((id) => id !== productId) : [...previous.productIds, productId],
    }));
  };

  const toggleChannel = (channel: string) => {
    setForm((previous) => ({
      ...previous,
      channels: previous.channels.includes(channel) ? previous.channels.filter((item) => item !== channel) : [...previous.channels, channel],
    }));
  };

  const submit = () => {
    const nextErrors: string[] = [];
    const discount = Number(form.discountValue);
    if (!form.name.trim()) nextErrors.push("Offer name is required.");
    if (!form.type) nextErrors.push("Offer type is required.");
    if (!form.productIds.length) nextErrors.push("Select at least one product.");
    if (new Date(form.endDate) <= new Date(form.startDate)) nextErrors.push("End date must be after start date.");
    if (form.type === "Percentage Discount" && (!Number.isFinite(discount) || discount < 1 || discount > 100)) nextErrors.push("Discount percentage must be between 1 and 100.");
    if (nextErrors.length) {
      setErrors(nextErrors);
      return;
    }
    const selectedProducts = availableOfferProducts.filter((product) => form.productIds.includes(product.id));
    const status: OfferStatus = form.statusMode === "Active" ? "Active" : form.statusMode === "Scheduled" ? "Scheduled" : "Draft";
    const nextOffer: Offer = {
      id: offer?.id ?? `offer-${Date.now()}`,
      name: form.name.trim(),
      type: form.type,
      rule: form.rule.trim() || (showDiscount ? `${form.discountValue}${form.type === "Percentage Discount" ? "%" : " EGP"} off selected products` : form.type),
      discountValue: Number(form.discountValue) || 0,
      startDate: form.startDate,
      endDate: form.endDate,
      channels: form.channels.length ? form.channels : ["Mobile App"],
      createdBy: offer?.createdBy ?? "Ahmed El Khabiry",
      lastUpdated: "2026-07-22",
      status,
      minimumBasketValue: Number(form.minimumBasketValue) || 0,
      usageLimitPerCustomer: Number(form.usageLimitPerCustomer) || 1,
      allowPromoCodeCombination: form.allowPromoCodeCombination,
      products: selectedProducts,
      performance: offer?.performance ?? { orders: 0, revenue: 0, sessions: 0, conversions: 0 },
      conditions: [
        `Minimum basket value EGP ${Number(form.minimumBasketValue) || 0}.`,
        "Available for retail pharmacy customers.",
        `Limit ${Number(form.usageLimitPerCustomer) || 1} use per customer.`,
        form.allowPromoCodeCombination ? "Can be combined with promo codes." : "Cannot be combined with promo codes.",
      ],
    };
    onSave(nextOffer);
  };

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm" aria-label="Close offer form" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl sm:max-w-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-700">{editing ? "Edit Offer" : "Create Offer"}</p>
            <h2 className="mt-1 text-lg font-bold text-slate-950">{editing ? offer?.name : "New pharmacy offer"}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close form"><X className="h-5 w-5" /></Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {errors.length ? <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{errors.map((error) => <p key={error}>{error}</p>)}</div> : null}
          <div className="grid gap-4">
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">Offer Name<input className="h-10 rounded-lg border border-slate-200 px-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" value={form.name} onChange={(event) => setField("name", event.target.value)} /></label>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">Offer Type<select className="h-10 rounded-lg border border-slate-200 px-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" value={form.type} onChange={(event) => setField("type", event.target.value as OfferType)}>{offerTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">{showDiscount ? "Discount Value" : "Bundle Rule"}<input className="h-10 rounded-lg border border-slate-200 px-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" type={showDiscount ? "number" : "text"} value={showDiscount ? form.discountValue : form.rule} onChange={(event) => showDiscount ? setField("discountValue", event.target.value) : setField("rule", event.target.value)} /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-semibold text-slate-700">Start Date<input className="h-10 rounded-lg border border-slate-200 px-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" type="date" value={form.startDate} onChange={(event) => setField("startDate", event.target.value)} /></label>
              <label className="grid gap-1.5 text-sm font-semibold text-slate-700">End Date<input className="h-10 rounded-lg border border-slate-200 px-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" type="date" value={form.endDate} onChange={(event) => setField("endDate", event.target.value)} /></label>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Included Products</p>
              <div className="mt-2 grid gap-2">
                {availableOfferProducts.map((product) => (
                  <label key={product.id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                    <input type="checkbox" checked={form.productIds.includes(product.id)} onChange={() => toggleProduct(product.id)} />
                    <span className="min-w-0 flex-1 truncate">{product.name}</span>
                    <span className="text-xs text-slate-500">{product.category}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-semibold text-slate-700">Minimum Basket Value<input className="h-10 rounded-lg border border-slate-200 px-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" type="number" value={form.minimumBasketValue} onChange={(event) => setField("minimumBasketValue", event.target.value)} /></label>
              <label className="grid gap-1.5 text-sm font-semibold text-slate-700">Usage Limit Per Customer<input className="h-10 rounded-lg border border-slate-200 px-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" type="number" value={form.usageLimitPerCustomer} onChange={(event) => setField("usageLimitPerCustomer", event.target.value)} /></label>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Applicable Channels</p>
              <div className="mt-2 flex flex-wrap gap-2">{offerChannels.map((channel) => <button key={channel} type="button" className={cn("rounded-lg border px-3 py-2 text-sm font-semibold", form.channels.includes(channel) ? "border-brand-200 bg-brand-50 text-brand-800" : "border-slate-200 bg-white text-slate-600")} onClick={() => toggleChannel(channel)}>{channel}</button>)}</div>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={form.allowPromoCodeCombination} onChange={(event) => setField("allowPromoCodeCombination", event.target.checked)} />Allow Promo Code Combination</label>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">Status<select className="h-10 rounded-lg border border-slate-200 px-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" value={form.statusMode} onChange={(event) => setField("statusMode", event.target.value as OfferFormState["statusMode"])}><option value="Draft">Save as Draft</option><option value="Scheduled">Schedule</option><option value="Active">Activate Now</option></select></label>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 p-4">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>Save Offer</Button>
        </div>
      </aside>
    </div>
  );
}

function OfferDetailsDrawer({ offer, onClose, onEdit, onStatusChange, onDuplicate }: { offer: Offer; onClose: () => void; onEdit: (offer: Offer) => void; onStatusChange: (offerId: string, status: OfferStatus) => void; onDuplicate: (offer: Offer) => void }) {
  const [showAllProducts, setShowAllProducts] = useState(false);
  const visibleProducts = showAllProducts ? offer.products : offer.products.slice(0, 5);
  const averageOrderValue = offer.performance.orders ? offer.performance.revenue / offer.performance.orders : 0;
  const readOnly = offer.status === "Completed" || offer.status === "Cancelled";
  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm" aria-label="Close offer details" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl sm:max-w-[520px]">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-slate-950">{offer.name}</h2>
            <div className="mt-2"><DemoBadge value={offer.status} /></div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close offer details"><X className="h-5 w-5" /></Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="space-y-5">
            <Card className="p-4"><h3 className="font-bold text-slate-950">Offer Summary</h3><dl className="mt-3 grid gap-2 text-sm">{[["Offer Type", offer.type], ["Discount Value or Offer Rule", offer.rule], ["Start Date", format(new Date(`${offer.startDate}T00:00:00`), "dd MMM yyyy")], ["End Date", format(new Date(`${offer.endDate}T00:00:00`), "dd MMM yyyy")], ["Applicable Channel", offer.channels.join(", ")], ["Created By", offer.createdBy], ["Last Updated", format(new Date(`${offer.lastUpdated}T00:00:00`), "dd MMM yyyy")]].map(([label, value]) => <div key={label} className="flex justify-between gap-4"><dt className="text-slate-500">{label}</dt><dd className="text-right font-semibold text-slate-800">{value}</dd></div>)}</dl></Card>
            <Card className="p-4"><h3 className="font-bold text-slate-950">Performance</h3><dl className="mt-3 grid gap-2 text-sm">{[["Orders Generated", `${offer.performance.orders} Orders`], ["Revenue Generated", formatOfferCurrency(offer.performance.revenue)], ["Conversion Rate", `${conversionRate(offer).toFixed(1)}%`], ["Average Order Value", formatOfferCurrency(averageOrderValue)]].map(([label, value]) => <div key={label} className="flex justify-between gap-4"><dt className="text-slate-500">{label}</dt><dd className="font-semibold text-slate-800">{value}</dd></div>)}</dl></Card>
            <Card className="p-4"><div className="flex items-center justify-between"><h3 className="font-bold text-slate-950">Included Products</h3>{offer.products.length > 5 ? <button className="text-sm font-bold text-brand-700" onClick={() => setShowAllProducts((value) => !value)}>{showAllProducts ? "Show fewer products" : "View all products"}</button> : null}</div><div className="mt-3 divide-y divide-slate-100">{visibleProducts.map((product) => <div key={product.id} className="grid gap-1 py-3 text-sm"><div className="flex justify-between gap-3"><span className="font-semibold text-slate-800">{product.name}</span><span className="whitespace-nowrap text-brand-700">{formatOfferCurrency(product.offerPrice)}</span></div><div className="flex justify-between gap-3 text-xs text-slate-500"><span>{product.category} · Was {formatOfferCurrency(product.originalPrice)}</span><span>{product.availability}</span></div></div>)}</div></Card>
            <Card className="p-4"><h3 className="font-bold text-slate-950">Offer Conditions</h3><ul className="mt-3 space-y-2 text-sm text-slate-600">{offer.conditions.map((condition) => <li key={condition} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />{condition}</li>)}</ul></Card>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 p-4">
          {readOnly ? <Button onClick={() => onDuplicate(offer)}><Copy className="h-4 w-4" />Duplicate Offer</Button> : <Button onClick={() => onEdit(offer)}><Pencil className="h-4 w-4" />Edit Offer</Button>}
          {offer.status === "Active" ? <Button variant="primary" onClick={() => onStatusChange(offer.id, "Paused")}><Pause className="h-4 w-4" />Pause Offer</Button> : null}
          {offer.status === "Paused" ? <Button variant="primary" onClick={() => onStatusChange(offer.id, "Active")}><Play className="h-4 w-4" />Activate Offer</Button> : null}
          {offer.status === "Scheduled" ? <Button variant="primary" onClick={() => onStatusChange(offer.id, "Active")}><Play className="h-4 w-4" />Activate Now</Button> : null}
          {offer.status === "Scheduled" ? (
            <details className="relative">
              <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-brand-50" aria-label="More actions" title="More actions"><MoreHorizontal className="h-4 w-4" />More</summary>
              <div className="absolute bottom-12 right-0 z-20 w-44 rounded-lg border border-slate-200 bg-white p-1.5 text-sm shadow-soft">
                <button className="w-full rounded-md px-3 py-2 text-left text-red-700 hover:bg-red-50" onClick={() => onStatusChange(offer.id, "Cancelled")}>Cancel Offer</button>
              </div>
            </details>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function OffersDemoPage() {
  const [offers, setOffers] = useState<Offer[]>(initialPromotionOffers);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All Statuses" | OfferStatus>("All Statuses");
  const [typeFilter, setTypeFilter] = useState<"All Types" | OfferType>("All Types");
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [editingOffer, setEditingOffer] = useState<Offer | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [toast, setToast] = useState("");
  const selectedOffer = offers.find((offer) => offer.id === selectedOfferId) ?? null;
  const completedOrActive = offers.filter((offer) => offer.status === "Active" || offer.status === "Completed");
  const activeCount = offers.filter((offer) => offer.status === "Active").length;
  const scheduledCount = offers.filter((offer) => offer.status === "Scheduled").length;
  const ordersGenerated = completedOrActive.reduce((sum, offer) => sum + offer.performance.orders, 0);
  const revenueGenerated = offers.reduce((sum, offer) => sum + offer.performance.revenue, 0);
  const conversions = offers.reduce((sum, offer) => sum + offer.performance.conversions, 0);
  const sessions = offers.reduce((sum, offer) => sum + offer.performance.sessions, 0);
  const filteredOffers = offers.filter((offer) => {
    const matchesSearch = [offer.name, offer.type, offer.channels.join(" ")].join(" ").toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === "All Statuses" || offer.status === statusFilter;
    const matchesType = typeFilter === "All Types" || offer.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };

  const saveOffer = (offer: Offer) => {
    setOffers((previous) => previous.some((item) => item.id === offer.id) ? previous.map((item) => item.id === offer.id ? offer : item) : [offer, ...previous]);
    setSelectedOfferId(offer.id);
    setFormOpen(false);
    setEditingOffer(undefined);
    showToast(previousOfferExists(offers, offer.id) ? "Offer updated successfully." : "Offer created successfully.");
  };

  const updateStatus = (offerId: string, status: OfferStatus) => {
    setOffers((previous) => previous.map((offer) => offer.id === offerId ? { ...offer, status, lastUpdated: "2026-07-22" } : offer));
    showToast(`Offer status changed to ${status}.`);
  };

  const duplicateOffer = (offer: Offer) => {
    const copy = { ...offer, id: `offer-${Date.now()}`, name: `${offer.name} Copy`, status: "Draft" as OfferStatus, performance: { orders: 0, revenue: 0, sessions: 0, conversions: 0 }, lastUpdated: "2026-07-22" };
    setOffers((previous) => [copy, ...previous]);
    setSelectedOfferId(copy.id);
    showToast("Offer duplicated as draft.");
  };

  return (
    <div className="mx-auto max-w-[1680px] space-y-5">
      <ExecutiveHero eyebrow="Promotions" title="Offers" subtitle="Executive snapshot of active pharmacy offers, product participation, generated orders, and revenue contribution across El Khabiry Pharmacy." action={<Button className="w-full lg:w-auto" variant="primary" onClick={() => { setEditingOffer(undefined); setFormOpen(true); }}><Plus className="h-4 w-4" />Create Offer</Button>} />
      {toast ? <div className="rounded-lg bg-brand-50 px-4 py-3 text-sm font-bold text-brand-800">{toast}</div> : null}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DemoKpi label="Active Offers" value={String(activeCount)} detail={`${activeCount} active, ${scheduledCount} scheduled`} />
        <DemoKpi label="Orders Generated" value={formatNumber(ordersGenerated)} detail="From active and completed campaigns" />
        <DemoKpi label="Revenue Generated" value={formatOfferCurrency(revenueGenerated)} detail="Promotion-attributed revenue" />
        <DemoKpi label="Conversion Rate" value={`${(sessions ? (conversions / sessions) * 100 : 0).toFixed(1)}%`} detail="Eligible baskets converted" />
      </section>
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative lg:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" placeholder="Search offers..." value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
              <option>All Statuses</option>{offerStatuses.map((status) => <option key={status}>{status}</option>)}
            </select>
            <select className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}>
              <option>All Types</option>{offerTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
          </div>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto scrollbar-soft">
          <table className="w-full min-w-[1080px] text-sm">
            <thead className="bg-brand-50 text-brand-900"><tr>{["Offer Name", "Type", "Products", "Orders", "Revenue", "Status", "Period", "Actions"].map((header) => <th key={header} className={cn("h-12 px-4 align-middle text-xs font-bold uppercase tracking-wide", header === "Offer Name" ? "text-left" : "text-center")}>{header}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100 bg-white">{filteredOffers.map((offer) => (
              <tr key={offer.id} className="transition hover:bg-brand-50/40">
                <td className="px-4 py-4 text-left font-bold text-slate-900">{offer.name}</td>
                <td className="px-4 py-4 text-center font-medium text-slate-700">{offer.type}</td>
                <td className="px-4 py-4 text-center font-medium text-slate-700">{offer.products.length} Products</td>
                <td className="px-4 py-4 text-center font-medium text-slate-700">{offer.performance.orders} Orders</td>
                <td className="px-4 py-4 text-center font-medium text-slate-700">{formatOfferCurrency(offer.performance.revenue)}</td>
                <td className="px-4 py-4 text-center"><DemoBadge value={offer.status} /></td>
                <td className="px-4 py-4 text-center font-medium text-slate-700">{formatOfferPeriod(offer.startDate, offer.endDate)}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-center gap-1.5">
                    <Button size="icon" variant="ghost" aria-label="View offer" title="View offer" onClick={() => setSelectedOfferId(offer.id)}><Eye className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label="Edit offer" title="Edit offer" onClick={() => { setEditingOffer(offer); setFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <details className="relative">
                      <summary className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-lg border border-transparent text-slate-600 transition hover:bg-brand-50 hover:text-brand-800" aria-label="More actions" title="More actions"><MoreHorizontal className="h-4 w-4" /></summary>
                      <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-slate-200 bg-white p-1.5 text-sm shadow-soft">
                        <button className="w-full rounded-md px-3 py-2 text-left hover:bg-brand-50" onClick={() => setSelectedOfferId(offer.id)}>View Details</button>
                        <button className="w-full rounded-md px-3 py-2 text-left hover:bg-brand-50" onClick={() => { setEditingOffer(offer); setFormOpen(true); }}>Edit Offer</button>
                        {offer.status === "Active" ? <button className="w-full rounded-md px-3 py-2 text-left hover:bg-brand-50" onClick={() => updateStatus(offer.id, "Paused")}>Pause Offer</button> : null}
                        {offer.status === "Paused" || offer.status === "Scheduled" ? <button className="w-full rounded-md px-3 py-2 text-left hover:bg-brand-50" onClick={() => updateStatus(offer.id, "Active")}>Activate Offer</button> : null}
                        <button className="w-full rounded-md px-3 py-2 text-left hover:bg-brand-50" onClick={() => duplicateOffer(offer)}>Duplicate Offer</button>
                        {offer.status === "Scheduled" || offer.status === "Active" || offer.status === "Paused" ? <button className="w-full rounded-md px-3 py-2 text-left text-red-700 hover:bg-red-50" onClick={() => updateStatus(offer.id, "Cancelled")}>Cancel Offer</button> : null}
                      </div>
                    </details>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Card>
      {selectedOffer ? <OfferDetailsDrawer offer={selectedOffer} onClose={() => setSelectedOfferId(null)} onEdit={(offer) => { setEditingOffer(offer); setFormOpen(true); }} onStatusChange={updateStatus} onDuplicate={duplicateOffer} /> : null}
      {formOpen ? <OfferFormDrawer offer={editingOffer} onClose={() => { setFormOpen(false); setEditingOffer(undefined); }} onSave={saveOffer} /> : null}
    </div>
  );
}

function PromoCodesDemoPage() {
  return (
    <div className="mx-auto max-w-[1680px] space-y-5">
      <ExecutiveHero eyebrow="Promotions" title="Promo Codes" subtitle="Clean view of pharmacy promo-code usage, revenue impact, and average customer incentive across digital channels." />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DemoKpi label="Active Promo Codes" value="3" detail="Live customer incentives" />
        <DemoKpi label="Redemptions" value="288" detail="Successful code usage" />
        <DemoKpi label="Revenue Impact" value="27,150 EGP" detail="Attributed order revenue" />
        <DemoKpi label="Average Discount" value="14.8%" detail="Across active codes" />
      </section>
      <SimpleExecutiveTable
        headers={["Code", "Discount", "Used", "Revenue", "Status"]}
        rows={promoCodes.map((code) => [code.code, code.discount, code.used, code.revenue, <DemoBadge value={code.status} />])}
      />
    </div>
  );
}

function MiniBarChart({ data }: { data: { day: string; value: number }[] }) {
  const max = Math.max(...data.map((item) => item.value));
  return (
    <Card className="p-5">
      <h2 className="text-base font-bold text-slate-950">Daily Deliveries</h2>
      <div className="mt-5 flex h-56 items-end justify-between gap-3">
        {data.map((item) => (
          <div key={item.day} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full items-end rounded-t-lg bg-brand-50" style={{ height: 190 }}>
              <div className="w-full rounded-t-lg bg-brand-500" style={{ height: `${(item.value / max) * 100}%` }} />
            </div>
            <span className="text-xs font-semibold text-slate-500">{item.day}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function LocalDeliveryDemoPage() {
  const rows = deliveryAreas.map((row) => [row.area, String(row.orders), row.fee, row.revenue]);
  return (
    <div className="mx-auto max-w-[1680px] space-y-5">
      <ExecutiveHero eyebrow="Delivery Operations" title="Local Delivery" subtitle="Flagship delivery performance view for Elkhabiry Pharmacy, focused on area demand, delivery revenue, and service reliability." />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DemoKpi label="Deliveries Today" value="312" detail="Across active service areas" />
        <DemoKpi label="Avg Delivery Time" value="38 min" detail="From dispatch to handoff" />
        <DemoKpi label="Delivery Revenue" value="8,785 EGP" detail="Today’s delivery fees" />
        <DemoKpi label="Success Rate" value="97.4%" detail="Completed without failed attempts" />
      </section>
      <section className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <Card className="p-5">
          <h2 className="text-base font-bold text-slate-950">Orders By Area</h2>
          <div className="mt-5 space-y-4">
            {deliveryAreas.map((item) => (
              <div key={item.area} className="grid gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">{item.area}</span>
                  <span className="text-slate-500">{item.orders} orders</span>
                </div>
                <div className="h-3 rounded-full bg-brand-50">
                  <div className="h-3 rounded-full bg-brand-500" style={{ width: `${(item.orders / 124) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <MiniBarChart data={dailyDeliveries} />
      </section>
      <SimpleExecutiveTable headers={["Area", "Orders", "Delivery Fee", "Revenue"]} rows={rows} />
    </div>
  );
}

function PricingDemoPage() {
  const rules = [
    ["0-3 KM", "20 EGP"],
    ["3-5 KM", "30 EGP"],
    ["5-10 KM", "40 EGP"],
    ["10+ KM", "50 EGP"],
  ];
  return (
    <div className="mx-auto max-w-[1680px] space-y-5">
      <ExecutiveHero eyebrow="Delivery Operations" title="Delivery Fee Rules" subtitle="Simple distance-based fee ladder for pharmacy deliveries, designed for clear management review." />
      <section className="grid gap-4 md:grid-cols-4">
        {rules.map(([range, fee]) => (
          <Card key={range} className="p-5 text-center">
            <p className="text-sm font-bold text-slate-500">{range}</p>
            <p className="mt-3 text-3xl font-bold text-brand-700">{fee}</p>
          </Card>
        ))}
      </section>
      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-4">
          {rules.map(([range, fee], index) => (
            <div key={range} className="relative rounded-xl border border-brand-100 bg-brand-50 p-4 text-center">
              <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">{index + 1}</span>
              <p className="mt-3 font-bold text-slate-900">{range}</p>
              <p className="mt-1 text-sm font-semibold text-brand-800">{fee}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function MethodsDemoPage() {
  const channels = [
    { label: "In-House Drivers", value: 65, icon: Truck },
    { label: "Motorbike Fleet", value: 25, icon: Bike },
    { label: "Express Delivery", value: 10, icon: CheckCircle2 },
  ];
  return (
    <div className="mx-auto max-w-[1680px] space-y-5">
      <ExecutiveHero eyebrow="Delivery Operations" title="Delivery Channels" subtitle="Distribution of pharmacy delivery volume by operational channel, simplified for executive review." />
      <section className="grid gap-4 md:grid-cols-3">
        {channels.map((channel) => (
          <Card key={channel.label} className="p-5">
            <div className="flex items-center justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-brand-50 text-brand-700"><channel.icon className="h-5 w-5" /></span>
              <span className="text-3xl font-bold text-slate-950">{channel.value}%</span>
            </div>
            <p className="mt-4 font-bold text-slate-800">{channel.label}</p>
            <div className="mt-4 h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-brand-500" style={{ width: `${channel.value}%` }} /></div>
          </Card>
        ))}
      </section>
      <DonutPanel data={channels.map((channel) => ({ name: channel.label, value: channel.value }))} title="Delivery Distribution" valueFormatter={(value) => `${value}%`} />
    </div>
  );
}

function CoverageDemoPage() {
  return (
    <div className="mx-auto max-w-[1680px] space-y-5">
      <ExecutiveHero eyebrow="Delivery Operations" title="Delivery Coverage" subtitle="Simplified coverage overview for pharmacy delivery service areas and customer reach." />
      <section className="grid gap-4 sm:grid-cols-3">
        <DemoKpi label="Covered Areas" value="18" detail="Active delivery districts" />
        <DemoKpi label="Coverage Radius" value="10 KM" detail="From main Tanta branch" />
        <DemoKpi label="Estimated Customers Served" value="42,000" detail="Within active coverage" />
      </section>
      <Card className="overflow-hidden p-6">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="relative h-80 overflow-hidden rounded-xl border border-brand-100 bg-brand-50">
            <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand-300 bg-white/60" />
            <div className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand-500 bg-white/70" />
            <div className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand-600 text-white shadow-glow">
              <MapPinned className="h-7 w-7" />
            </div>
            {["Tanta Center", "El Geish", "El Bahr", "Stadium District"].map((area, index) => (
              <span key={area} className={cn("absolute rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-800 shadow-sm", index === 0 && "left-10 top-12", index === 1 && "right-12 top-20", index === 2 && "bottom-16 left-16", index === 3 && "bottom-12 right-16")}>{area}</span>
            ))}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-950">City Map Illustration</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">Executive coverage visualization for active Elkhabiry delivery zones. Technical geofencing controls are intentionally removed for a cleaner demo experience.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function CatalogStatusBadge({ value }: { value: string }) {
  const tone = value === "Active" || value === "Healthy" ? "bg-brand-50 text-brand-800 ring-brand-100" : value === "Inactive" ? "bg-slate-100 text-slate-600 ring-slate-200" : value === "Low Stock" ? "bg-orange-50 text-orange-700 ring-orange-100" : "bg-amber-50 text-amber-700 ring-amber-100";
  return <span className={cn("inline-flex min-h-7 items-center justify-center rounded-full px-3 text-xs font-bold ring-1", tone)}>{value}</span>;
}

function CatalogActionMenu({ actions }: { actions: { label: string; onClick: () => void; danger?: boolean }[] }) {
  return (
    <details className="relative">
      <summary className="mx-auto grid h-9 w-9 cursor-pointer list-none place-items-center rounded-lg border border-transparent text-slate-600 transition hover:bg-brand-50 hover:text-brand-800" aria-label="More Actions" title="More Actions">
        <MoreHorizontal className="h-4 w-4" />
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-44 rounded-lg border border-slate-200 bg-white p-1.5 text-sm shadow-soft">
        {actions.map((action) => (
          <button key={action.label} className={cn("w-full rounded-md px-3 py-2 text-left hover:bg-brand-50", action.danger && "text-red-700 hover:bg-red-50")} onClick={action.onClick}>{action.label}</button>
        ))}
      </div>
    </details>
  );
}

function CategoryForm({ category, parents, parentId, onCancel, onSave }: { category?: CatalogCategory; parents: CatalogCategory[]; parentId?: string | null; onCancel: () => void; onSave: (category: CatalogCategory) => void }) {
  const isSubcategory = Boolean(category?.parentId || parentId);
  const editing = Boolean(category);
  const [name, setName] = useState(category?.name ?? "");
  const [selectedParentId, setSelectedParentId] = useState<string>(category?.parentId ?? parentId ?? "none");
  const [image, setImage] = useState(category?.image ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [status, setStatus] = useState<CatalogStatus>(category?.status ?? "Active");
  const [error, setError] = useState("");
  const submit = () => {
    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }
    onSave({
      id: category?.id ?? `cat-${Date.now()}`,
      name: name.trim(),
      parentId: isSubcategory ? selectedParentId : null,
      products: category?.products ?? 0,
      image,
      description,
      status,
      createdDate: category?.createdDate ?? "2026-07-22",
      lastUpdated: "2026-07-22",
    });
  };
  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm" aria-label="Close category form" onClick={onCancel} />
      <aside className="absolute right-0 top-0 flex h-full w-full flex-col bg-white shadow-2xl sm:max-w-md">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="text-lg font-bold text-slate-950">{editing ? isSubcategory ? "Edit Subcategory" : "Edit Main Category" : isSubcategory ? "Add Subcategory" : "Add Main Category"}</h2><Button variant="ghost" size="icon" onClick={onCancel}><X className="h-5 w-5" /></Button></div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {error ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
          {isSubcategory && !editing ? <div className="rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-sm"><span className="font-semibold text-slate-700">Parent Category:</span> <span className="font-bold text-brand-800">{parents.find((parent) => parent.id === parentId)?.name}</span></div> : null}
          <label className="grid gap-1.5 text-sm font-semibold text-slate-700">{isSubcategory ? "Subcategory Name" : "Category Name"}<input className="h-10 rounded-lg border border-slate-200 px-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" value={name} onChange={(event) => setName(event.target.value)} /></label>
          {isSubcategory && editing ? <label className="grid gap-1.5 text-sm font-semibold text-slate-700">Parent Category<select className="h-10 rounded-lg border border-slate-200 px-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" value={selectedParentId} onChange={(event) => setSelectedParentId(event.target.value)}>{parents.filter((parent) => parent.id !== category?.id).map((parent) => <option key={parent.id} value={parent.id}>{parent.name}</option>)}</select></label> : null}
          <label className="grid gap-1.5 text-sm font-semibold text-slate-700">{isSubcategory ? "Image / Icon" : "Category Image / Icon"}<input className="h-10 rounded-lg border border-slate-200 px-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" value={image} onChange={(event) => setImage(event.target.value)} placeholder="category-image.jpg" /></label>
          <label className="grid gap-1.5 text-sm font-semibold text-slate-700">Description<textarea className="min-h-24 rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" value={description} onChange={(event) => setDescription(event.target.value)} /></label>
          <label className="grid gap-1.5 text-sm font-semibold text-slate-700">Status<select className="h-10 rounded-lg border border-slate-200 px-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" value={status} onChange={(event) => setStatus(event.target.value as CatalogStatus)}><option>Active</option><option>Inactive</option></select></label>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 p-4"><Button onClick={onCancel}>Cancel</Button><Button variant="primary" onClick={submit}>{isSubcategory ? "Save Subcategory" : "Save Main Category"}</Button></div>
      </aside>
    </div>
  );
}

function CategoryDetailsDrawer({ category, categories, onClose }: { category: CatalogCategory; categories: CatalogCategory[]; onClose: () => void }) {
  const parent = categories.find((item) => item.id === category.parentId);
  const children = categories.filter((item) => item.parentId === category.id);
  const isMain = !category.parentId;
  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm" aria-label="Close category details" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full flex-col bg-white shadow-2xl sm:max-w-lg">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4"><div><p className="text-xs font-bold uppercase tracking-wide text-brand-700">Category Details</p><h2 className="mt-1 text-lg font-bold text-slate-950">{category.name}</h2></div><Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button></div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <Card className="p-4"><dl className="grid gap-3 text-sm">{(isMain ? [["Category Name", category.name], ["Type", "Main Category"], ["Number of Subcategories", formatNumber(children.length)], ["Number of Products", formatNumber(category.products)], ["Status", category.status], ["Description", category.description], ["Created Date", format(new Date(`${category.createdDate}T00:00:00`), "dd MMM yyyy")], ["Last Updated", format(new Date(`${category.lastUpdated}T00:00:00`), "dd MMM yyyy")]] : [["Subcategory Name", category.name], ["Parent Category", parent?.name ?? "-"], ["Number of Products", formatNumber(category.products)], ["Status", category.status], ["Description", category.description], ["Created Date", format(new Date(`${category.createdDate}T00:00:00`), "dd MMM yyyy")], ["Last Updated", format(new Date(`${category.lastUpdated}T00:00:00`), "dd MMM yyyy")]]).map(([label, value]) => <div key={label} className="flex justify-between gap-4 border-b border-slate-100 pb-2 last:border-0"><dt className="text-slate-500">{label}</dt><dd className="text-right font-semibold text-slate-900">{value}</dd></div>)}</dl></Card>
          {isMain ? <Card className="mt-4 p-4"><h3 className="font-bold text-slate-950">Child Subcategories</h3><div className="mt-3 space-y-2">{children.map((child) => <div key={child.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"><span className="font-semibold text-slate-700">{child.name}</span><CatalogStatusBadge value={child.status} /></div>)}</div></Card> : null}
        </div>
      </aside>
    </div>
  );
}

function CategoriesDemoPage() {
  const [categories, setCategories] = useState<CatalogCategory[]>(initialCatalogCategories);
  const [editing, setEditing] = useState<CatalogCategory | undefined>();
  const [viewing, setViewing] = useState<CatalogCategory | undefined>();
  const [formParentId, setFormParentId] = useState<string | null | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<string[]>(() => initialCatalogCategories.filter((category) => !category.parentId).map((category) => category.id));
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | "Main Category" | "Subcategory">("All");
  const [statusFilter, setStatusFilter] = useState<"All" | CatalogStatus>("All");
  const [blockedDeleteMessage, setBlockedDeleteMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<CatalogCategory | undefined>();
  const parents = categories.filter((category) => !category.parentId);
  const childrenFor = (parentId: string) => categories.filter((category) => category.parentId === parentId);
  const matchesFilters = (category: CatalogCategory) => {
    const type = category.parentId ? "Subcategory" : "Main Category";
    const normalizedQuery = query.trim().toLowerCase();
    const matchesQuery = !normalizedQuery || category.name.toLowerCase().includes(normalizedQuery);
    const matchesType = typeFilter === "All" || typeFilter === type;
    const matchesStatus = statusFilter === "All" || statusFilter === category.status;
    return matchesQuery && matchesType && matchesStatus;
  };
  const visibleParents = parents.filter((parent) => matchesFilters(parent) || childrenFor(parent.id).some(matchesFilters));
  const totalSubCategories = categories.filter((category) => category.parentId).length;
  const totalProducts = categories.reduce((sum, category) => sum + category.products, 0);
  const inactiveCategories = categories.filter((category) => category.status === "Inactive").length;
  const filtersActive = Boolean(query.trim() || typeFilter !== "All" || statusFilter !== "All");
  const saveCategory = (category: CatalogCategory) => {
    setCategories((previous) => previous.some((item) => item.id === category.id) ? previous.map((item) => item.id === category.id ? category : item) : [...previous, category]);
    if (category.parentId) setExpandedCategoryIds((previous) => previous.includes(category.parentId!) ? previous : [...previous, category.parentId!]);
    setFormOpen(false);
    setEditing(undefined);
    setFormParentId(undefined);
  };
  const updateStatus = (category: CatalogCategory) => setCategories((previous) => previous.map((item) => item.id === category.id ? { ...item, status: item.status === "Active" ? "Inactive" : "Active", lastUpdated: "2026-07-22" } : item));
  const requestDelete = (category: CatalogCategory) => {
    const hasLinkedData = category.products > 0 || categories.some((item) => item.parentId === category.id);
    if (hasLinkedData) {
      setBlockedDeleteMessage("This category contains subcategories or linked products and cannot be deleted until they are reassigned.");
      return;
    }
    setConfirmDelete(category);
  };
  const deleteCategory = () => {
    if (!confirmDelete) return;
    setCategories((previous) => previous.filter((item) => item.id !== confirmDelete.id));
    setConfirmDelete(undefined);
  };
  const toggleExpanded = (categoryId: string) => setExpandedCategoryIds((previous) => previous.includes(categoryId) ? previous.filter((id) => id !== categoryId) : [...previous, categoryId]);
  return (
    <div className="mx-auto max-w-[1680px] space-y-5">
      <ExecutiveHero eyebrow="Catalog" title="Categories" subtitle="Organize pharmacy products using main categories and subcategories." action={<Button variant="primary" onClick={() => { setEditing(undefined); setFormParentId(null); setFormOpen(true); }}><Plus className="h-4 w-4" />Add Main Category</Button>} />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DemoKpi label="Main Categories" value={String(parents.length)} detail="Parent pharmacy departments" />
        <DemoKpi label="Subcategories" value={String(totalSubCategories)} detail="Second-level product groups" />
        <DemoKpi label="Total Products" value={formatNumber(totalProducts)} detail="Catalog SKUs organized" />
        <DemoKpi label="Inactive Categories" value={String(inactiveCategories)} detail="Hidden from catalog operations" />
      </section>
      <Card className="p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_180px_160px_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by category name" />
          </label>
          <select className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}>
            <option>All</option>
            <option>Main Category</option>
            <option>Subcategory</option>
          </select>
          <select className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
            <option>All</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
          {filtersActive ? <Button onClick={() => { setQuery(""); setTypeFilter("All"); setStatusFilter("All"); }}>Clear Filters</Button> : null}
        </div>
      </Card>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto scrollbar-soft">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-brand-50 text-brand-900"><tr>{["Category", "Type", "Products", "Status", "Actions"].map((header) => <th key={header} className={cn("h-12 px-4 align-middle text-xs font-bold uppercase tracking-wide", header === "Category" ? "text-left" : "text-center")}>{header}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {visibleParents.map((parent) => {
                const children = childrenFor(parent.id).filter(matchesFilters);
                const expanded = expandedCategoryIds.includes(parent.id);
                return (
                  <Fragment key={parent.id}>
                    <tr className="bg-slate-50/80 hover:bg-brand-50/50">
                      <td className="px-4 py-3 text-left font-bold text-slate-950">
                        <button className="inline-flex items-center gap-2 rounded-md text-left transition hover:text-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400" onClick={() => toggleExpanded(parent.id)} aria-expanded={expanded}>
                          {expanded ? <ChevronDown className="h-4 w-4 text-brand-700" /> : <ChevronRight className="h-4 w-4 text-brand-700" />}
                          <Folder className="h-4 w-4 text-brand-700" />
                          {parent.name}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-700">Main Category</td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-900">{formatNumber(parent.products)}</td>
                      <td className="px-4 py-3 text-center"><CatalogStatusBadge value={parent.status} /></td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          <Button variant="ghost" size="icon" title="View Details" aria-label="View Details" onClick={() => setViewing(parent)}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" title="Edit" aria-label="Edit" onClick={() => { setEditing(parent); setFormParentId(null); setFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                          <CatalogActionMenu actions={[{ label: "Add Subcategory", onClick: () => { setEditing(undefined); setFormParentId(parent.id); setFormOpen(true); } }, { label: parent.status === "Active" ? "Deactivate" : "Activate", onClick: () => updateStatus(parent) }, { label: "Delete", onClick: () => requestDelete(parent), danger: true }]} />
                        </div>
                      </td>
                    </tr>
                    {expanded ? children.map((child, index) => (
                    <tr key={child.id} className="hover:bg-brand-50/40">
                      <td className="px-4 py-3 text-left font-semibold text-slate-700">
                        <span className="ml-8 inline-flex items-center gap-2">
                          <span className={cn("h-px w-6 bg-brand-200", index !== children.length - 1 && "relative after:absolute after:left-0 after:top-0 after:h-8 after:w-px after:bg-brand-100")} />
                          <Tag className="h-3.5 w-3.5 text-brand-600" />
                          {child.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-700">Subcategory</td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-900">{formatNumber(child.products)}</td>
                      <td className="px-4 py-3 text-center"><CatalogStatusBadge value={child.status} /></td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          <Button variant="ghost" size="icon" title="View Details" aria-label="View Details" onClick={() => setViewing(child)}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" title="Edit" aria-label="Edit" onClick={() => { setEditing(child); setFormParentId(child.parentId); setFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                          <CatalogActionMenu actions={[{ label: child.status === "Active" ? "Deactivate" : "Activate", onClick: () => updateStatus(child) }, { label: "Delete", onClick: () => requestDelete(child), danger: true }]} />
                        </div>
                      </td>
                    </tr>
                    )) : null}
                  </Fragment>
                );
              })}
              {!visibleParents.length ? <tr><td colSpan={5} className="px-4 py-10 text-center text-sm font-semibold text-slate-500">No categories match the current filters.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </Card>
      {formOpen ? <CategoryForm category={editing} parents={parents} parentId={formParentId} onCancel={() => { setFormOpen(false); setEditing(undefined); setFormParentId(undefined); }} onSave={saveCategory} /> : null}
      {viewing ? <CategoryDetailsDrawer category={viewing} categories={categories} onClose={() => setViewing(undefined)} /> : null}
      {blockedDeleteMessage ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-5">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
              <div>
                <h2 className="font-bold text-slate-950">Category Cannot Be Deleted</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{blockedDeleteMessage}</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end"><Button variant="primary" onClick={() => setBlockedDeleteMessage("")}>Close</Button></div>
          </Card>
        </div>
      ) : null}
      {confirmDelete ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-5">
            <h2 className="font-bold text-slate-950">Delete Category</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Delete {confirmDelete.name}? This action removes the category from the local demo catalog.</p>
            <div className="mt-5 flex justify-end gap-2"><Button onClick={() => setConfirmDelete(undefined)}>Cancel</Button><Button variant="danger" onClick={deleteCategory}>Delete</Button></div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function CatalogProductsDemoPage() {
  const [products, setProducts] = useState<CatalogProduct[]>(initialCatalogProducts);
  const [editing, setEditing] = useState<CatalogProduct | undefined>();
  const [viewing, setViewing] = useState<CatalogProduct | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<CatalogProduct>(initialCatalogProducts[0]);
  const openForm = (product?: CatalogProduct) => {
    const next = product ?? { id: `prod-${Date.now()}`, product: "", category: "Pain Relief", brand: "GSK", stock: 0, price: 0, status: "Active" as CatalogStatus };
    setEditing(product);
    setForm(next);
    setFormOpen(true);
  };
  const saveProduct = () => {
    if (!form.product.trim()) return;
    setProducts((previous) => previous.some((item) => item.id === form.id) ? previous.map((item) => item.id === form.id ? form : item) : [form, ...previous]);
    setFormOpen(false);
    setEditing(undefined);
  };
  const toggleProductStatus = (product: CatalogProduct) => setProducts((previous) => previous.map((item) => item.id === product.id ? { ...item, status: item.status === "Active" ? "Inactive" : "Active" } : item));
  const activeProducts = products.filter((product) => product.status === "Active").length;
  const lowStock = products.filter((product) => product.stock <= 20).length;
  return (
    <div className="mx-auto max-w-[1680px] space-y-5">
      <ExecutiveHero eyebrow="Catalog" title="Products" subtitle="Pharmacy Product Catalog organized by category, brand, availability, and stock health for branch-level operations." action={<Button variant="primary" onClick={() => openForm()}><Plus className="h-4 w-4" />Add Product</Button>} />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DemoKpi label="Total Products" value={formatNumber(products.length)} detail="Visible demo products" />
        <DemoKpi label="Active Products" value={formatNumber(activeProducts)} detail="Available for sale" />
        <DemoKpi label="Low Stock Products" value={formatNumber(lowStock)} detail="Need replenishment review" />
        <DemoKpi label="Near Expiry Products" value="37" detail="Require margin or transfer action" />
      </section>
      <Card className="overflow-hidden"><div className="overflow-x-auto scrollbar-soft"><table className="w-full min-w-[920px] text-sm"><thead className="bg-brand-50 text-brand-900"><tr>{["Product", "Category", "Brand", "Stock", "Price", "Status", "Actions"].map((header) => <th key={header} className={cn("h-12 px-4 text-center align-middle text-xs font-bold uppercase tracking-wide", header === "Product" && "text-left")}>{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 bg-white">{products.map((product) => <tr key={product.id} className="hover:bg-brand-50/40"><td className="px-4 py-4 text-left font-bold text-slate-900">{product.product}</td><td className="px-4 py-4 text-center">{product.category}</td><td className="px-4 py-4 text-center">{product.brand}</td><td className="px-4 py-4 text-center">{formatNumber(product.stock)}</td><td className="px-4 py-4 text-center">{formatOfferCurrency(product.price)}</td><td className="px-4 py-4 text-center"><CatalogStatusBadge value={product.status} /></td><td className="px-4 py-4"><div className="flex justify-center gap-1.5"><Button size="icon" variant="ghost" aria-label="View Product" title="View Product" onClick={() => setViewing(product)}><Eye className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label="Edit Product" title="Edit Product" onClick={() => openForm(product)}><Pencil className="h-4 w-4" /></Button><Button size="sm" variant="ghost" onClick={() => toggleProductStatus(product)}>{product.status === "Active" ? "Deactivate" : "Activate"}</Button></div></td></tr>)}</tbody></table></div></Card>
      {viewing ? <div className="fixed inset-0 z-50"><button className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm" aria-label="Close product details" onClick={() => setViewing(undefined)} /><aside className="absolute right-0 top-0 h-full w-full bg-white p-5 shadow-2xl sm:max-w-md"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase text-brand-700">Product Details</p><h2 className="mt-1 text-lg font-bold text-slate-950">{viewing.product}</h2></div><Button variant="ghost" size="icon" onClick={() => setViewing(undefined)}><X className="h-5 w-5" /></Button></div><dl className="mt-5 grid gap-3 text-sm">{[["Category", viewing.category], ["Brand", viewing.brand], ["Stock", formatNumber(viewing.stock)], ["Price", formatOfferCurrency(viewing.price)], ["Status", viewing.status]].map(([label, value]) => <div key={label} className="flex justify-between gap-4 border-b border-slate-100 pb-2"><dt className="text-slate-500">{label}</dt><dd className="font-semibold text-slate-900">{value}</dd></div>)}</dl></aside></div> : null}
      {formOpen ? <div className="fixed inset-0 z-50"><button className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm" aria-label="Close product form" onClick={() => setFormOpen(false)} /><aside className="absolute right-0 top-0 flex h-full w-full flex-col bg-white shadow-2xl sm:max-w-md"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="text-lg font-bold text-slate-950">{editing ? "Edit Product" : "Add Product"}</h2><Button variant="ghost" size="icon" onClick={() => setFormOpen(false)}><X className="h-5 w-5" /></Button></div><div className="flex-1 space-y-4 overflow-y-auto p-5"><label className="grid gap-1.5 text-sm font-semibold text-slate-700">Product<input className="h-10 rounded-lg border border-slate-200 px-3" value={form.product} onChange={(event) => setForm({ ...form, product: event.target.value })} /></label><label className="grid gap-1.5 text-sm font-semibold text-slate-700">Assign Category<select className="h-10 rounded-lg border border-slate-200 px-3" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{["Pain Relief", "Antibiotics", "Multivitamins", "Medical Devices", "Dermocosmetics"].map((item) => <option key={item}>{item}</option>)}</select></label><label className="grid gap-1.5 text-sm font-semibold text-slate-700">Assign Brand<select className="h-10 rounded-lg border border-slate-200 px-3" value={form.brand} onChange={(event) => setForm({ ...form, brand: event.target.value })}>{["GSK", "Haleon", "Roche", "L'Oreal", "Eva Pharma", "Hikma"].map((item) => <option key={item}>{item}</option>)}</select></label><label className="grid gap-1.5 text-sm font-semibold text-slate-700">Stock<input className="h-10 rounded-lg border border-slate-200 px-3" type="number" value={form.stock} onChange={(event) => setForm({ ...form, stock: Number(event.target.value) })} /></label><label className="grid gap-1.5 text-sm font-semibold text-slate-700">Price<input className="h-10 rounded-lg border border-slate-200 px-3" type="number" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} /></label><label className="grid gap-1.5 text-sm font-semibold text-slate-700">Status<select className="h-10 rounded-lg border border-slate-200 px-3" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as CatalogStatus })}><option>Active</option><option>Inactive</option></select></label></div><div className="flex justify-end gap-2 border-t border-slate-100 p-4"><Button onClick={() => setFormOpen(false)}>Cancel</Button><Button variant="primary" onClick={saveProduct}>Save Product</Button></div></aside></div> : null}
    </div>
  );
}

function BrandsDemoPage() {
  const [brands, setBrands] = useState<CatalogBrand[]>(initialCatalogBrands);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogBrand | undefined>();
  const [form, setForm] = useState<CatalogBrand>(initialCatalogBrands[0]);
  const linkedProducts = brands.reduce((sum, brand) => sum + brand.products, 0);
  const activeBrands = brands.filter((brand) => brand.status === "Active").length;
  const openBrandForm = (brand?: CatalogBrand) => {
    setEditing(brand);
    setForm(brand ?? { id: `brand-${Date.now()}`, brand: "", products: 0, status: "Active" });
    setFormOpen(true);
  };
  const saveBrand = () => {
    if (!form.brand.trim()) return;
    setBrands((previous) => previous.some((item) => item.id === form.id) ? previous.map((item) => item.id === form.id ? form : item) : [form, ...previous]);
    setFormOpen(false);
  };
  const toggleBrandStatus = (brand: CatalogBrand) => setBrands((previous) => previous.map((item) => item.id === brand.id ? { ...item, status: item.status === "Active" ? "Inactive" : "Active" } : item));
  const deleteBrand = (brand: CatalogBrand) => setBrands((previous) => previous.filter((item) => item.id !== brand.id));
  return (
    <div className="mx-auto max-w-[1680px] space-y-5">
      <ExecutiveHero eyebrow="Catalog" title="Brands" subtitle="Manage pharmacy suppliers and brands with a simple operational view of product coverage and availability." action={<Button variant="primary" onClick={() => openBrandForm()}><Plus className="h-4 w-4" />Add Brand</Button>} />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DemoKpi label="Total Brands" value={String(brands.length)} detail="Strategic pharmacy suppliers" />
        <DemoKpi label="Active Brands" value={String(activeBrands)} detail="Currently listed brands" />
        <DemoKpi label="Products Linked" value={formatNumber(linkedProducts)} detail="Products mapped to brands" />
        <DemoKpi label="Inactive Brands" value={String(brands.length - activeBrands)} detail="Hidden from catalog selection" />
      </section>
      <Card className="overflow-hidden"><div className="overflow-x-auto scrollbar-soft"><table className="w-full min-w-[760px] text-sm"><thead className="bg-brand-50 text-brand-900"><tr>{["Brand", "Products", "Status", "Actions"].map((header) => <th key={header} className="h-12 px-4 text-center align-middle text-xs font-bold uppercase tracking-wide">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 bg-white">{brands.map((brand) => <tr key={brand.id} className="hover:bg-brand-50/40"><td className="px-4 py-4 text-center font-bold text-slate-900">{brand.brand}</td><td className="px-4 py-4 text-center">{formatNumber(brand.products)}</td><td className="px-4 py-4 text-center"><CatalogStatusBadge value={brand.status} /></td><td className="px-4 py-4"><CatalogActionMenu actions={[{ label: "Edit", onClick: () => openBrandForm(brand) }, { label: brand.status === "Active" ? "Deactivate" : "Activate", onClick: () => toggleBrandStatus(brand) }, { label: "Delete", onClick: () => deleteBrand(brand), danger: true }]} /></td></tr>)}</tbody></table></div></Card>
      {formOpen ? <div className="fixed inset-0 z-50"><button className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm" aria-label="Close brand form" onClick={() => setFormOpen(false)} /><aside className="absolute right-0 top-0 flex h-full w-full flex-col bg-white shadow-2xl sm:max-w-md"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="text-lg font-bold text-slate-950">{editing ? "Edit Brand" : "Add Brand"}</h2><Button variant="ghost" size="icon" onClick={() => setFormOpen(false)}><X className="h-5 w-5" /></Button></div><div className="flex-1 space-y-4 overflow-y-auto p-5"><label className="grid gap-1.5 text-sm font-semibold text-slate-700">Brand<input className="h-10 rounded-lg border border-slate-200 px-3" value={form.brand} onChange={(event) => setForm({ ...form, brand: event.target.value })} /></label><label className="grid gap-1.5 text-sm font-semibold text-slate-700">Products<input className="h-10 rounded-lg border border-slate-200 px-3" type="number" value={form.products} onChange={(event) => setForm({ ...form, products: Number(event.target.value) })} /></label><label className="grid gap-1.5 text-sm font-semibold text-slate-700">Status<select className="h-10 rounded-lg border border-slate-200 px-3" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as CatalogStatus })}><option>Active</option><option>Inactive</option></select></label></div><div className="flex justify-end gap-2 border-t border-slate-100 p-4"><Button onClick={() => setFormOpen(false)}>Cancel</Button><Button variant="primary" onClick={saveBrand}>Save Brand</Button></div></aside></div> : null}
    </div>
  );
}

function PharmacyDemoPage({ section, title }: { section: string; title: string }) {
  if (section === "Catalog" && title === "Categories") return <CategoriesDemoPage />;
  if (section === "Catalog" && title === "Products") return <CatalogProductsDemoPage />;
  if (section === "Catalog" && title === "Brands") return <BrandsDemoPage />;
  if (section === "Promotions" && title === "Offers") return <OffersDemoPage />;
  if (section === "Promotions" && title === "Promo Codes") return <PromoCodesDemoPage />;
  if (section === "Delivery Operations" && title === "Local Delivery") return <LocalDeliveryDemoPage />;
  if (section === "Delivery Operations" && title === "Pricing") return <PricingDemoPage />;
  if (section === "Delivery Operations" && title === "Methods") return <MethodsDemoPage />;
  if (section === "Delivery Operations" && title === "Geo Fencing") return <CoverageDemoPage />;
  return null;
}

export function ReportPage({ section, title, overview = false }: { section: string; title: string; overview?: boolean }) {
  const pharmacyDemoPage = PharmacyDemoPage({ section, title });
  if (pharmacyDemoPage) return pharmacyDemoPage;

  const filters = useFilterStore((state) => state.filters);
  const setFilter = useFilterStore((state) => state.setFilter);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<TableRow | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const queryView = searchParams.get("view");
  const queryMode: OrdersByDayMode = queryView === "daily" || queryView === "today" || queryView === "weekly" || queryView === "weekday" ? queryView : "weekday";
  const [ordersByDayMode, setOrdersByDayModeState] = useState<OrdersByDayMode>(queryMode);
  const [periodPresetByMode, setPeriodPresetByMode] = useState<Record<Exclude<OrdersByDayMode, "today">, string>>({
    weekday: "12",
    daily: "30",
    weekly: "12",
  });
  const savedDateRanges = useRef<Record<Exclude<OrdersByDayMode, "today">, { dateFrom: string; dateTo: string; custom: boolean }>>({
    weekday: { dateFrom: "", dateTo: "", custom: false },
    daily: { dateFrom: "", dateTo: "", custom: false },
    weekly: { dateFrom: "", dateTo: "", custom: false },
  });
  const report = useMemo(() => (overview ? getOverviewReport(filters) : getReport(section, title, filters, ordersByDayMode)), [filters, ordersByDayMode, overview, section, title]);
  const filterOptions = useMemo(() => getFilterOptions(), []);
  const isProductPerformance = section === "Sales" && title === "Product Performance";
  const isSalesConcentration = section === "Sales" && title === "Sales Concentration";
  const isOrdersByArea = section === "Sales" && title === "Orders By Area";
  const isOrdersByDay = section === "Sales" && title === "Orders Analysis";
  const isStockHealth = section === "Inventory" && title === "Stock Health";
  const isInventoryValue = section === "Inventory" && title === "Inventory Value";
  const isWarehouseDistribution = section === "Inventory" && title === "Warehouse Distribution";
  const isMovementTrends = section === "Inventory" && title === "Movement Trends";
  const isStockAvailability = section === "Inventory" && title === "Stock Availability";
  const isNearExpiry = section === "Inventory" && title === "Near Expiry";
  const isReorderPlanning = section === "Inventory" && title === "Reorder Planning";
  const isInventoryReport = section === "Inventory" && !isStockHealth;

  useEffect(() => {
    setLoading(true);
    const timer = window.setTimeout(() => setLoading(false), 280);
    return () => window.clearTimeout(timer);
  }, [filters, ordersByDayMode, section, title]);

  const applyDateRange = useCallback((dateFrom: string, dateTo: string) => {
    setFilter("dateFrom", dateFrom);
    setFilter("dateTo", dateTo);
  }, [setFilter]);

  const presetRange = useCallback((mode: Exclude<OrdersByDayMode, "today">, amount: number) => {
    if (mode === "weekly" || mode === "weekday") {
      const completedWeekEnd = subDays(startOfWeek(new Date(), { weekStartsOn: 0 }), 1);
      const completedWeekStart = startOfWeek(completedWeekEnd, { weekStartsOn: 0 });
      return {
        dateFrom: format(subDays(completedWeekStart, (amount - 1) * 7), "yyyy-MM-dd"),
        dateTo: format(completedWeekEnd, "yyyy-MM-dd"),
      };
    }
    const dateTo = format(new Date(), "yyyy-MM-dd");
    const days = mode === "daily" ? amount : amount * 7;
    return { dateFrom: format(subDays(new Date(), days - 1), "yyyy-MM-dd"), dateTo };
  }, []);

  const setOrdersByDayMode = useCallback((nextMode: OrdersByDayMode) => {
    if (!isOrdersByDay) return;
    if (ordersByDayMode !== "today") {
      savedDateRanges.current[ordersByDayMode] = { dateFrom: filters.dateFrom, dateTo: filters.dateTo, custom: savedDateRanges.current[ordersByDayMode].custom };
    }
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("view", nextMode);
    setSearchParams(nextParams, { replace: true });
    setOrdersByDayModeState(nextMode);
    if (nextMode === "today") {
      return;
    }
    const savedRange = savedDateRanges.current[nextMode];
    const selectedPreset = periodPresetByMode[nextMode];
    const fallbackAmount = nextMode === "daily" ? 30 : 12;
    const fallback = presetRange(nextMode, Number(selectedPreset === "custom" ? fallbackAmount : selectedPreset));
    const range = selectedPreset === "custom" && savedRange.custom ? savedRange : { ...fallback, custom: false };
    applyDateRange(range.dateFrom, range.dateTo);
  }, [applyDateRange, filters.dateFrom, filters.dateTo, isOrdersByDay, ordersByDayMode, periodPresetByMode, presetRange, searchParams, setSearchParams]);

  useEffect(() => {
    if (!isOrdersByDay) return;
    setOrdersByDayModeState(queryMode);
  }, [isOrdersByDay, queryMode]);

  useEffect(() => {
    if (!isOrdersByDay || searchParams.get("view")) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("view", "weekday");
    setSearchParams(nextParams, { replace: true });
  }, [isOrdersByDay, searchParams, setSearchParams]);

  useEffect(() => {
    if (!isOrdersByDay || !queryView || queryView === queryMode) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("view", "weekday");
    setSearchParams(nextParams, { replace: true });
  }, [isOrdersByDay, queryMode, queryView, searchParams, setSearchParams]);

  useEffect(() => {
    if (!isOrdersByDay) return;
    if (ordersByDayMode === "today") return;
    const current = savedDateRanges.current[ordersByDayMode];
    if (current.dateFrom || current.custom) return;
    const selectedPreset = periodPresetByMode[ordersByDayMode];
    const defaultRange = presetRange(ordersByDayMode, Number(selectedPreset === "custom" ? ordersByDayMode === "daily" ? 30 : 12 : selectedPreset));
    savedDateRanges.current[ordersByDayMode] = { ...defaultRange, custom: false };
    applyDateRange(defaultRange.dateFrom, defaultRange.dateTo);
  }, [applyDateRange, isOrdersByDay, ordersByDayMode, periodPresetByMode, presetRange]);

  const datePresets = useMemo(() => {
    if (ordersByDayMode === "today") return [];
    if (ordersByDayMode === "daily") {
      return [
        { label: "Last 7 Days", value: "7", amount: 7 },
        { label: "Last 30 Days", value: "30", amount: 30 },
        { label: "Last 90 Days", value: "90", amount: 90 },
        { label: "Custom", value: "custom", amount: 0 },
      ];
    }
    if (ordersByDayMode === "weekly") {
      return [
        { label: "Last 8 Weeks", value: "8", amount: 8 },
        { label: "Last 12 Weeks", value: "12", amount: 12 },
        { label: "Last 26 Weeks", value: "26", amount: 26 },
        { label: "Custom", value: "custom", amount: 0 },
      ];
    }
    return [
      { label: "Last 4 Weeks", value: "4", amount: 4 },
      { label: "Last 12 Weeks", value: "12", amount: 12 },
      { label: "Custom", value: "custom", amount: 0 },
    ];
  }, [ordersByDayMode]);

  const applyPreset = useCallback((preset: { value: string; amount: number }) => {
    if (ordersByDayMode === "today") return;
    setPeriodPresetByMode((previous) => ({ ...previous, [ordersByDayMode]: preset.value }));
    if (preset.value === "custom") {
      const savedRange = savedDateRanges.current[ordersByDayMode];
      const fallback = presetRange(ordersByDayMode, ordersByDayMode === "daily" ? 30 : 12);
      const range = savedRange.custom ? savedRange : { ...fallback, custom: true };
      savedDateRanges.current[ordersByDayMode] = range;
      applyDateRange(range.dateFrom, range.dateTo);
      return;
    }
    const range = presetRange(ordersByDayMode, preset.amount);
    savedDateRanges.current[ordersByDayMode] = { ...range, custom: false };
    applyDateRange(range.dateFrom, range.dateTo);
  }, [applyDateRange, ordersByDayMode, presetRange]);

  const markCustomDateRange = useCallback(() => {
    if (ordersByDayMode === "today") return;
    setPeriodPresetByMode((previous) => ({ ...previous, [ordersByDayMode]: "custom" }));
    savedDateRanges.current[ordersByDayMode] = { dateFrom: filters.dateFrom, dateTo: filters.dateTo, custom: true };
  }, [filters.dateFrom, filters.dateTo, ordersByDayMode]);

  useEffect(() => {
    if (!isOrdersByDay || ordersByDayMode === "today" || periodPresetByMode[ordersByDayMode] !== "custom") return;
    savedDateRanges.current[ordersByDayMode] = { dateFrom: filters.dateFrom, dateTo: filters.dateTo, custom: true };
  }, [filters.dateFrom, filters.dateTo, isOrdersByDay, ordersByDayMode, periodPresetByMode]);

  const empty = (!isStockHealth && !isInventoryValue && !isWarehouseDistribution && !isStockAvailability && !isNearExpiry && !isReorderPlanning && report.table.length === 0) || report.mainChart.length === 0;
  const selectedAreaValid = isOrdersByArea && filters.city !== "All" && getAvailableAreasForCity(filters.city).some((area) => area.id === filters.area);
  const singleAreaMode = selectedAreaValid && filters.area !== "All";
  const selectedProductOption = filterOptions.products.find((product) => product.id === filters.product);
  const selectedBranchOption = filterOptions.branches.find((branch) => branch.id === filters.branch);
  const productMode = isProductPerformance && filters.product !== "All";
  const categoryMode = isProductPerformance && filters.category !== "All" && filters.product === "All";
  const contextTitle = productMode ? selectedProductOption?.name : categoryMode ? `${filters.category} Performance` : report.title;
  const contextSubtitle = productMode
    ? `${selectedProductOption?.category ?? "Selected category"} - ${selectedBranchOption?.name ?? "All branches"}`
    : categoryMode
      ? `${report.table.length} products in ${selectedBranchOption?.name ?? "all branches"}`
      : selectedBranchOption
        ? `All products across ${selectedBranchOption.name}`
        : "All products across all branches";
  const productRow = productMode ? report.table[0] : undefined;

  return (
    <div className="mx-auto max-w-[1680px] space-y-5">
      <section className="rounded-lg bg-brand-950 px-5 py-6 text-white shadow-soft lg:px-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-200">{section}</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-normal md:text-4xl">{isProductPerformance ? contextTitle : report.title}</h1>
            <p className="mt-3 text-sm leading-6 text-brand-50 md:text-base">{isProductPerformance ? contextSubtitle : report.description}</p>
          </div>
          {!isProductPerformance && !isSalesConcentration && !isOrdersByArea && !isOrdersByDay && !isStockHealth && !isInventoryReport ? <EntityDrawerLauncher /> : null}
        </div>
      </section>

      {isOrdersByDay ? (
        <Card className="p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-slate-700">View By</p>
            <div className="inline-flex rounded-lg bg-slate-100 p-1">
              {[
                { id: "weekday", label: "Weekday" },
                { id: "daily", label: "Daily Trend" },
                { id: "today", label: "Today" },
                { id: "weekly", label: "Weekly Trend" },
              ].map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                    ordersByDayMode === mode.id ? "border-white bg-white text-emerald-800 shadow-sm" : "border-transparent bg-transparent text-slate-600 shadow-none hover:bg-white/50 hover:text-slate-950",
                  )}
                  onClick={() => setOrdersByDayMode(mode.id as OrdersByDayMode)}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            {ordersByDayMode === "today" ? (
              <span className="rounded-full bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700">Today, {format(new Date(), "MMMM d, yyyy")}</span>
            ) : (
              <>
                {datePresets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                      periodPresetByMode[ordersByDayMode] === preset.value ? "border-brand-200 bg-brand-50 text-brand-700 shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:text-brand-700",
                    )}
                    onClick={() => applyPreset(preset)}
                  >
                    {preset.label}
                  </button>
                ))}
              </>
            )}
          </div>
        </Card>
      ) : null}

      {isProductPerformance ? (
        <ProductPerformanceFilters />
      ) : isOrdersByArea ? (
        <OrdersByAreaFilters />
      ) : isOrdersByDay ? (
        <OrdersByDayFilters showDateFields={ordersByDayMode !== "today" && periodPresetByMode[ordersByDayMode] === "custom"} todayMode={ordersByDayMode === "today"} onCustomDateChange={markCustomDateRange} />
      ) : isMovementTrends ? (
        <InventoryMovementFilters />
      ) : section === "Inventory" ? (
        <GlobalFilters fields={["city", "branch", "category", "product", "supplier"]} showDateRange={false} />
      ) : (
        <GlobalFilters fields={isSalesConcentration ? ["branch", "category"] : undefined} />
      )}

      {loading ? <ReportSkeleton /> : (empty && !isStockHealth) ? (isProductPerformance ? <ProductPerformanceEmptyState /> : isOrdersByArea ? <OrdersByAreaEmptyState /> : isOrdersByDay ? <OrdersByDayEmptyState mode={ordersByDayMode} /> : <EmptyState />) : (
        <>
          <section className={cn("grid gap-4 sm:grid-cols-2", isSalesConcentration ? "xl:grid-cols-3" : isOrdersByArea ? "xl:grid-cols-5" : isOrdersByDay || isStockHealth || isInventoryReport ? "xl:grid-cols-4" : "xl:grid-cols-3 2xl:grid-cols-6")}>
            {report.kpis.map((kpi, index) => (
              <KpiCard key={kpi.label} kpi={kpi} index={index} />
            ))}
          </section>

          {isStockHealth ? (
            <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
              <DonutPanel data={report.supportA} title={report.supportATitle ?? "Inventory Health Distribution"} valueFormatter={formatNumber} />
              <Card className="p-5">
                <h2 className="text-base font-semibold text-slate-950">Key Alerts</h2>
                <div className="mt-4 space-y-3">
                  {report.alerts.map((alert, index) => {
                    const severity = index === 0 ? "Critical" : index === 1 ? "Warning" : "Attention";
                    const tone = severity === "Critical" ? "border-red-200 bg-red-50 text-red-700" : severity === "Warning" ? "border-orange-200 bg-orange-50 text-orange-700" : "border-yellow-200 bg-yellow-50 text-yellow-700";
                    return (
                      <div key={alert} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <span className={cn("shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold", tone)}>{severity}</span>
                        <p className="text-sm leading-6 text-slate-700">{alert}</p>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </section>
          ) : isInventoryValue ? (
            <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
              <MainChart data={report.mainChart} title={report.mainChartTitle ?? "Inventory Value Trend"} valueFormatter={formatCompactCurrency} />
              <Card className="p-5">
                <div>
                  <h2 className="text-base font-semibold text-slate-950">Top Categories by Inventory Value</h2>
                  <p className="mt-1 text-sm text-slate-500">Top 5 categories holding the largest inventory investment.</p>
                </div>
                <div className="mt-5 divide-y divide-slate-100">
                  {report.alerts.slice(0, 5).map((item) => {
                    const [category, value, share] = item.split("|");
                    return (
                      <div key={category} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 py-3 text-sm">
                        <span className="min-w-0 truncate font-semibold text-slate-800" title={category}>{category}</span>
                        <span className="font-semibold text-slate-950">{value}</span>
                        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">{share}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </section>
          ) : isWarehouseDistribution ? (
            <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
              <DonutPanel data={report.mainChart} title={report.mainChartTitle ?? "Warehouse Distribution %"} valueFormatter={formatNumber} />
              <Card className="p-5">
                <div>
                  <h2 className="text-base font-semibold text-slate-950">Warehouse Summary</h2>
                  <p className="mt-1 text-sm text-slate-500">Current inventory units and distribution share by warehouse.</p>
                </div>
                <div className="mt-5 divide-y divide-slate-100">
                  {report.alerts.map((item) => {
                    const [warehouse, units, share] = item.split("|");
                    return (
                      <div key={warehouse} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 py-3 text-sm">
                        <span className="min-w-0 truncate font-semibold text-slate-800" title={warehouse}>{warehouse}</span>
                        <span className="font-semibold text-slate-950">{units}</span>
                        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">{share}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </section>
          ) : isStockAvailability ? (
            <section className="grid gap-4 xl:grid-cols-[1fr_520px]">
              <DonutPanel data={report.mainChart} title={report.mainChartTitle ?? "Stock Availability Distribution"} valueFormatter={formatNumber} />
              <div className="space-y-4">
                <Card className="p-5">
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">Priority Products</h2>
                    <p className="mt-1 text-sm text-slate-500">Top 10 products requiring immediate replenishment review.</p>
                  </div>
                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full min-w-[520px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                          <th className="py-3 font-semibold">Product</th>
                          <th className="py-3 text-right font-semibold">Current Stock</th>
                          <th className="py-3 text-right font-semibold">Reorder Level</th>
                          <th className="py-3 text-right font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {report.alerts.map((item) => {
                          const [product, currentStock, reorderLevel, status] = item.split("|");
                          const statusClass = status === "Out Of Stock" ? "bg-red-50 text-red-700 ring-red-100" : "bg-orange-50 text-orange-700 ring-orange-100";
                          return (
                            <tr key={product} className="text-slate-700">
                              <td className="max-w-[210px] truncate py-3 font-semibold text-slate-900" title={product}>{product}</td>
                              <td className="py-3 text-right">{currentStock}</td>
                              <td className="py-3 text-right">{reorderLevel}</td>
                              <td className="py-3 text-right">
                                <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1", statusClass)}>{status}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
                <Card className="p-5">
                  <h2 className="text-base font-semibold text-slate-950">Action Summary</h2>
                  <div className="mt-4 space-y-3">
                    {report.supportA.map((item) => {
                      const tone = item.name === "Out Of Stock" ? "border-red-200 bg-red-50 text-red-700" : item.name === "Low Stock" ? "border-orange-200 bg-orange-50 text-orange-700" : "border-yellow-200 bg-yellow-50 text-yellow-700";
                      const message = item.name === "Out Of Stock"
                        ? `${formatNumber(item.value)} products are completely out of stock.`
                        : item.name === "Low Stock"
                          ? `${formatNumber(item.value)} products are below reorder level.`
                          : `${formatNumber(item.value)} critical products require immediate replenishment.`;
                      return (
                        <div key={item.name} className={cn("rounded-lg border px-3 py-2 text-sm font-semibold", tone)}>{message}</div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            </section>
          ) : isNearExpiry ? (
            <section className="grid gap-4 xl:grid-cols-[1fr_560px]">
              <BarPanel data={report.mainChart} title={report.mainChartTitle ?? "Expiry Risk Distribution"} valueFormatter={formatNumber} axisFormatter={formatNumber} />
              <Card className="p-5">
                <div>
                  <h2 className="text-base font-semibold text-slate-950">Expiry Action List</h2>
                  <p className="mt-1 text-sm text-slate-500">Top 10 highest-priority products requiring expiry management action.</p>
                </div>
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[620px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                        <th className="py-3 font-semibold">Product</th>
                        <th className="py-3 font-semibold">Category</th>
                        <th className="py-3 text-right font-semibold">Days Remaining</th>
                        <th className="py-3 text-right font-semibold">Stock Quantity</th>
                        <th className="py-3 text-right font-semibold">Recommended Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {report.alerts.map((item) => {
                        const [product, category, daysRemaining, stockQuantity, action] = item.split("|");
                        const actionClass = action === "Quarantine / Dispose"
                          ? "bg-red-50 text-red-700 ring-red-100"
                          : action === "Supplier Return"
                            ? "bg-purple-50 text-purple-700 ring-purple-100"
                            : action === "Discount / Promotion"
                              ? "bg-orange-50 text-orange-700 ring-orange-100"
                              : "bg-blue-50 text-blue-700 ring-blue-100";
                        return (
                          <tr key={`${product}-${daysRemaining}`} className="text-slate-700">
                            <td className="max-w-[190px] truncate py-3 font-semibold text-slate-900" title={product}>{product}</td>
                            <td className="py-3 text-slate-600">{category}</td>
                            <td className="py-3 text-right">{daysRemaining}</td>
                            <td className="py-3 text-right">{stockQuantity}</td>
                            <td className="py-3 text-right">
                              <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1", actionClass)}>{action}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>
          ) : isReorderPlanning ? (
            <section className="grid gap-4 xl:grid-cols-[1fr_560px]">
              <HorizontalBarPanel data={report.mainChart} title={report.mainChartTitle ?? "Reorder Priority Ranking"} valueFormatter={formatNumber} />
              <Card className="p-5">
                <div>
                  <h2 className="text-base font-semibold text-slate-950">Replenishment Action List</h2>
                  <p className="mt-1 text-sm text-slate-500">Top 10 products sorted by purchasing urgency, low coverage, and suggested order quantity.</p>
                </div>
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[620px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                        <th className="py-3 font-semibold">Product</th>
                        <th className="py-3 text-right font-semibold">Current Stock</th>
                        <th className="py-3 text-right font-semibold">Coverage Days</th>
                        <th className="py-3 text-right font-semibold">Suggested Order Quantity</th>
                        <th className="py-3 text-right font-semibold">Priority</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {report.alerts.map((item) => {
                        const [product, currentStock, coverageDays, suggestedOrder, priority] = item.split("|");
                        const priorityClass = priority === "High"
                          ? "bg-red-50 text-red-700 ring-red-100"
                          : priority === "Medium"
                            ? "bg-orange-50 text-orange-700 ring-orange-100"
                            : "bg-slate-100 text-slate-700 ring-slate-200";
                        return (
                          <tr key={product} className="text-slate-700">
                            <td className="max-w-[210px] truncate py-3 font-semibold text-slate-900" title={product}>{product}</td>
                            <td className="py-3 text-right">{currentStock}</td>
                            <td className="py-3 text-right">{coverageDays}</td>
                            <td className="py-3 text-right font-semibold text-slate-900">{suggestedOrder}</td>
                            <td className="py-3 text-right">
                              <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1", priorityClass)}>{priority}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>
          ) : isMovementTrends ? (
            <>
              <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
                <InventoryMovementTrendPanel data={report.mainChart} title={report.mainChartTitle ?? "Inventory Movement Trend"} />
                <BarPanel data={report.supportB} title={report.supportBTitle ?? "Net Movement Trend"} valueFormatter={formatNumber} axisFormatter={formatNumber} />
              </section>
              <Card className="p-5">
                <div>
                  <h2 className="text-base font-semibold text-slate-950">Movement Summary</h2>
                  <p className="mt-1 text-sm text-slate-500">Top 10 periods showing stock received, stock consumed, and net inventory change.</p>
                </div>
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                        <th className="py-3 font-semibold">Period</th>
                        <th className="py-3 text-right font-semibold">Stock In</th>
                        <th className="py-3 text-right font-semibold">Stock Out</th>
                        <th className="py-3 text-right font-semibold">Net Movement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {report.table.slice(0, 10).map((row) => (
                        <tr key={String(row.Period)} className="text-slate-700">
                          <td className="py-3 font-semibold text-slate-900">{String(row.Period)}</td>
                          <td className="py-3 text-right">{String(row["Stock In"])}</td>
                          <td className="py-3 text-right">{String(row["Stock Out"])}</td>
                          <td className="py-3 text-right font-semibold">{String(row["Net Movement"])}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          ) : isInventoryReport ? (
            <>
              <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
                {title === "Inventory Value" || title === "Movement Trends" ? (
                  <MainChart data={report.mainChart} title={report.mainChartTitle ?? `${title} Trend`} valueFormatter={title === "Inventory Value" ? formatCompactCurrency : formatNumber} />
                ) : (
                  <BarPanel data={report.mainChart} title={report.mainChartTitle ?? title} valueFormatter={formatNumber} axisFormatter={formatNumber} />
                )}
                <Card className="p-5">
                  <h2 className="text-base font-semibold text-slate-950">Key Insights</h2>
                  <div className="mt-4 space-y-3">
                    {report.alerts.slice(0, 3).map((alert) => (
                      <div key={alert} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">{alert}</div>
                    ))}
                  </div>
                </Card>
              </section>
              <section className="grid gap-4 xl:grid-cols-2">
                <BarPanel data={report.supportA} title={report.supportATitle ?? "Supporting Analysis"} valueFormatter={title === "Inventory Value" ? formatCompactCurrency : formatNumber} />
                <BarPanel data={report.supportB} title={report.supportBTitle ?? "Priority Breakdown"} valueFormatter={title === "Inventory Value" ? formatCompactCurrency : formatNumber} />
              </section>
            </>
          ) : isProductPerformance ? (
            <>
              <section className={cn("grid gap-4", productMode ? "xl:grid-cols-1" : "xl:grid-cols-2")}>
                <MainChart data={report.mainChart} title={report.mainChartTitle ?? "Revenue Trend"} />
                {!productMode ? <HorizontalBarPanel data={report.supportA} title={report.supportATitle ?? "Top Products by Revenue"} /> : null}
              </section>
              {categoryMode ? (
                <Card className="p-5">
                  <h2 className="text-base font-semibold text-slate-950">Category Summary</h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div><p className="text-sm text-slate-500">Category Name</p><p className="font-semibold text-slate-900">{filters.category}</p></div>
                    <div><p className="text-sm text-slate-500">Category Revenue</p><p className="font-semibold text-slate-900">{report.kpis[0]?.value}</p></div>
                    <div><p className="text-sm text-slate-500">Category Gross Profit</p><p className="font-semibold text-slate-900">{report.kpis[1]?.value}</p></div>
                    <div><p className="text-sm text-slate-500">Category Margin</p><p className="font-semibold text-slate-900">{report.kpis[2]?.value}</p></div>
                    <div><p className="text-sm text-slate-500">Units Sold</p><p className="font-semibold text-slate-900">{report.kpis[3]?.value}</p></div>
                    <div><p className="text-sm text-slate-500">Orders</p><p className="font-semibold text-slate-900">{report.kpis[4]?.value}</p></div>
                    <div><p className="text-sm text-slate-500">Active Products</p><p className="font-semibold text-slate-900">{report.table.length}</p></div>
                    <div><p className="text-sm text-slate-500">Average Stock Coverage</p><p className="font-semibold text-slate-900">{report.kpis[5]?.value}</p></div>
                    <div><p className="text-sm text-slate-500">Best Product</p><p className="font-semibold text-slate-900">{String(report.table[0]?.product ?? "-")}</p></div>
                    <div><p className="text-sm text-slate-500">Lowest-Performing Product</p><p className="font-semibold text-slate-900">{String(report.table.at(-1)?.product ?? "-")}</p></div>
                  </div>
                  <p className="mt-4 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">Category recommendation: protect high-margin winners and review low-coverage products before the next replenishment cycle.</p>
                </Card>
              ) : null}
              {productMode && productRow ? (
                <section className="grid gap-4 xl:grid-cols-3">
                  <Card className="p-5 xl:col-span-2">
                    <h2 className="text-base font-semibold text-slate-950">Product Summary</h2>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      <div><p className="text-sm text-slate-500">Product Name</p><p className="font-semibold text-slate-900">{String(productRow.product)}</p></div>
                      <div><p className="text-sm text-slate-500">Category</p><p className="font-semibold text-slate-900">{String(productRow.category)}</p></div>
                      <div><p className="text-sm text-slate-500">Revenue</p><p className="font-semibold text-slate-900">{formatCurrency(Number(productRow.revenue ?? 0))}</p></div>
                      <div><p className="text-sm text-slate-500">Gross Profit</p><p className="font-semibold text-slate-900">{formatCurrency(Number(productRow.grossProfit ?? 0))}</p></div>
                      <div><p className="text-sm text-slate-500">Margin</p><p className="font-semibold text-slate-900">{String(productRow["margin %"] ?? "-")}</p></div>
                      <div><p className="text-sm text-slate-500">Units Sold</p><p className="font-semibold text-slate-900">{String(productRow.unitsSold ?? 0)}</p></div>
                      <div><p className="text-sm text-slate-500">Revenue Contribution</p><p className="font-semibold text-slate-900">100% of selected view</p></div>
                      <div><p className="text-sm text-slate-500">Rank in Category</p><p className="font-semibold text-slate-900">#1 of {Math.max(1, report.table.length)}</p></div>
                      <div><p className="text-sm text-slate-500">Overall Rank</p><p className="font-semibold text-slate-900">#1 of 150</p></div>
                    </div>
                  </Card>
                  <Card className="p-5">
                    <h2 className="text-base font-semibold text-slate-950">Inventory Health</h2>
                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex justify-between gap-3"><span className="text-slate-500">Current Stock</span><span className="font-semibold text-slate-900">{Math.round(Number(productRow.stockDays ?? 0) * Math.max(1, Number(productRow.unitsSold ?? 0) / 181))} Units</span></div>
                      <div className="flex justify-between gap-3"><span className="text-slate-500">Days of Stock</span><span className="font-semibold text-slate-900">{String(productRow.stockDays ?? 0)} Days</span></div>
                      <div className="flex justify-between gap-3"><span className="text-slate-500">Status</span><span className="font-semibold text-slate-900">{String(productRow.status ?? "-")}</span></div>
                    </div>
                    <p className="mt-4 rounded-lg bg-brand-950 px-3 py-2 text-sm leading-6 text-white">{Number(productRow.stockDays ?? 0) < 15 ? "Stock coverage below 15 days. Reorder recommended." : "High revenue and healthy margin."}</p>
                  </Card>
                </section>
              ) : null}
            </>
          ) : isSalesConcentration ? (
            <>
              <ParetoPanel data={report.mainChart} title={report.mainChartTitle ?? "Revenue Concentration Analysis"} />
              <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
                <CategorySharePanel data={report.supportA} title={report.supportATitle ?? "Revenue Distribution by Category"} />
                <Card className="p-5">
                  <h2 className="text-base font-semibold text-slate-950">Executive Insights</h2>
                  <div className="mt-4 space-y-3">
                    {report.alerts.slice(0, 3).map((alert) => (
                      <div key={alert} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">{alert}</div>
                    ))}
                  </div>
                </Card>
              </section>
            </>
          ) : isOrdersByArea ? (
            <>
              {singleAreaMode ? (
                <section className="grid gap-4 xl:grid-cols-2">
                  <HorizontalBarPanel data={report.mainChart} title={report.mainChartTitle ?? "Top Products in Selected Area"} />
                  <CategorySharePanel data={report.supportA} title={report.supportATitle ?? "Category Mix"} />
                  <MovementPanel data={report.supportB} title={report.supportBTitle ?? "Fast Moving Products"} mode="fast" />
                  <MovementPanel data={report.supportC ?? []} title="Slow Moving Products" mode="slow" />
                </section>
              ) : (
                <section className="grid gap-4 xl:grid-cols-3">
                  <BarPanel data={report.mainChart} title={report.mainChartTitle ?? "Orders by Area"} />
                  <BarPanel data={report.supportA} title={report.supportATitle ?? "Revenue by Area"} />
                  <BarPanel data={report.supportB} title={report.supportBTitle ?? "Average Order Value by Area"} />
                </section>
              )}
              <Card className="p-5">
                <h2 className="text-base font-semibold text-slate-950">Executive Insights</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {report.alerts.slice(0, 4).map((alert) => (
                    <div key={alert} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">{alert}</div>
                  ))}
                </div>
              </Card>
            </>
          ) : isOrdersByDay ? (
            <>
              {ordersByDayMode === "today" ? (
                <>
                  <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
                    <MainChart data={report.mainChart} title={report.mainChartTitle ?? "Orders by Hour"} valueFormatter={formatNumber} axisFormatter={formatNumber} />
                    <HorizontalBarPanel data={report.supportB} title={report.supportBTitle ?? "Today Top Products"} valueFormatter={formatNumber} />
                  </section>
                  <section className="grid gap-4 xl:grid-cols-[360px_1fr]">
                    <Card className="p-5">
                      <h2 className="text-base font-semibold text-slate-950">Today Branch Activity</h2>
                      <div className="mt-4 space-y-3">
                        {(report.supportC ?? []).slice(0, 5).map((branch, index) => (
                          <div key={branch.name} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                            <span className="min-w-0 truncate font-semibold text-slate-800" title={branch.name}>{index + 1}. {branch.name}</span>
                            <span className="shrink-0 text-slate-500">{formatNumber(branch.value)} Orders</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                    <Card className="p-5">
                      <div>
                        <h2 className="text-base font-semibold text-slate-950">Today Activity Table</h2>
                        <p className="mt-1 text-sm text-slate-500">Recent completed demo orders for the current trading day.</p>
                      </div>
                      <div className="mt-5 overflow-x-auto">
                        <table className="w-full min-w-[720px] text-left text-sm">
                          <thead>
                            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                              <th className="py-3 font-semibold">Time</th>
                              <th className="py-3 font-semibold">Order ID</th>
                              <th className="py-3 font-semibold">Branch</th>
                              <th className="py-3 font-semibold">Product</th>
                              <th className="py-3 text-right font-semibold">Quantity</th>
                              <th className="py-3 text-right font-semibold">Order Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {report.table.slice(0, 10).map((row) => (
                              <tr key={String(row["Order ID"])} className="text-slate-700">
                                <td className="py-3 font-semibold text-slate-900">{String(row.Time)}</td>
                                <td className="py-3">{String(row["Order ID"])}</td>
                                <td className="max-w-[170px] truncate py-3" title={String(row.Branch)}>{String(row.Branch)}</td>
                                <td className="max-w-[220px] truncate py-3" title={String(row.Product)}>{String(row.Product)}</td>
                                <td className="py-3 text-right">{String(row.Quantity)}</td>
                                <td className="py-3 text-right font-semibold text-slate-900">{String(row["Order Value"])}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </section>
                </>
              ) : ordersByDayMode === "daily" ? (
                <section className="grid gap-4 xl:grid-cols-3">
                  <MainChart data={report.mainChart} title={report.mainChartTitle ?? "Orders by Date"} valueFormatter={formatNumber} axisFormatter={formatNumber} />
                  <MainChart data={report.supportA} title={report.supportATitle ?? "Revenue by Date"} valueFormatter={formatCompactCurrency} />
                  <MainChart data={report.supportB} title={report.supportBTitle ?? "Average Order Value by Date"} valueFormatter={formatCurrency} axisFormatter={(value) => formatNumber(value / 1000)} />
                </section>
              ) : (
                <section className="grid gap-4 xl:grid-cols-3">
                  <BarPanel data={report.mainChart} title={report.mainChartTitle ?? (ordersByDayMode === "weekly" ? "Orders by Week" : "Orders by Weekday")} valueFormatter={formatNumber} axisFormatter={formatNumber} />
                  <BarPanel data={report.supportA} title={report.supportATitle ?? (ordersByDayMode === "weekly" ? "Revenue by Week" : "Revenue by Weekday")} valueFormatter={formatCompactCurrency} />
                  <BarPanel data={report.supportB} title={report.supportBTitle ?? (ordersByDayMode === "weekly" ? "Average Order Value by Week" : "Average Order Value by Weekday")} valueFormatter={formatCurrency} axisFormatter={(value) => formatNumber(value / 1000)} />
                </section>
              )}
              <Card className="p-5">
                <h2 className="text-base font-semibold text-slate-950">Operational Recommendations</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {report.alerts.slice(0, 3).map((alert) => (
                    <div key={alert} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">{alert}</div>
                  ))}
                </div>
              </Card>
            </>
          ) : (
            <>
              <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
                <MainChart data={report.mainChart} title={report.mainChartTitle ?? (overview ? "Sales Trend" : `${title} Trend`)} />
                <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-50 p-2.5 text-orange-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-950">Executive Alerts</h2>
                  <p className="text-sm text-slate-500">Priority items from active filters.</p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {report.alerts.map((alert) => (
                  <div key={alert} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">{alert}</div>
                ))}
              </div>
                </Card>
              </section>

              <section className="grid gap-4 xl:grid-cols-2">
                <BarPanel data={report.supportA} title={report.supportATitle ?? (overview ? "Sales By Category" : "Supporting Breakdown")} />
                <DonutPanel data={report.supportB} title={report.supportBTitle ?? (overview ? "Sales By Channel" : "Channel Mix")} />
              </section>
            </>
          )}

          {!productMode && !isStockHealth && !isInventoryValue && !isWarehouseDistribution && !isStockAvailability && !isNearExpiry && !isReorderPlanning && !isMovementTrends && !(isOrdersByDay && ordersByDayMode === "today") ? (
            <DataTable
              rows={report.table}
              title={report.tableTitle ?? (overview ? "Recent Orders" : `${title} Data`)}
              subtitle={isOrdersByDay && ordersByDayMode === "weekday" ? "Compares weekday performance across the selected period to identify peak demand days, low activity periods, and operational planning opportunities." : undefined}
              note={isOrdersByDay && ordersByDayMode === "weekday" ? "Each row represents the combined performance of that weekday across the entire selected date range. Sunday = all Sundays within the selected period; Monday = all Mondays within the selected period." : undefined}
              onRowClick={section === "Sales" && title === "Product Performance" ? setSelectedProduct : undefined}
            />
          ) : null}

          {!isProductPerformance && !isSalesConcentration && !isOrdersByArea && !isOrdersByDay && !isStockHealth && !isInventoryReport ? <section className="grid gap-4 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-2">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-950">Operations Notes</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">Use this view to explain operational drivers, risk pockets, category shifts, and branch-level execution opportunities.</p>
                </div>
              </div>
            </Card>
            <Card className="border-brand-200 bg-brand-700 p-5 text-white">
              <p className="text-sm font-semibold">Next best action</p>
              <p className="mt-2 text-sm leading-6 text-white/90">{report.nextAction ?? "Focus replenishment and sales effort on high-margin chronic products with branch-level stock coverage under 21 days."}</p>
            </Card>
          </section> : null}
        </>
      )}
      {selectedProduct ? <ProductDetailDrawer row={selectedProduct} onClose={() => setSelectedProduct(null)} /> : null}
    </div>
  );
}
