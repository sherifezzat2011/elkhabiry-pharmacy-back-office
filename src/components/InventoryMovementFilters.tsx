import { subDays } from "date-fns";
import { RotateCcw } from "lucide-react";
import { getFilterOptions } from "@/services/mock-api";
import { useFilterStore } from "@/store/filters";
import type { FilterState } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

const options = getFilterOptions();

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function FilterSelect<K extends keyof FilterState>({ label, field, values }: { label: string; field: K; values: { label: string; value: string }[] }) {
  const value = useFilterStore((state) => state.filters[field]);
  const setFilter = useFilterStore((state) => state.setFilter);
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <Select value={value} onChange={(event) => setFilter(field, event.target.value as FilterState[K])}>
        <option value="All">All</option>
        {values.map((item) => (
          <option key={item.value} value={item.value}>{item.label}</option>
        ))}
      </Select>
    </label>
  );
}

export function InventoryMovementFilters() {
  const filters = useFilterStore((state) => state.filters);
  const setFilter = useFilterStore((state) => state.setFilter);
  const resetFilters = useFilterStore((state) => state.resetFilters);

  const applyLastWeeks = (weeks: number) => {
    const dateTo = new Date();
    const dateFrom = subDays(dateTo, weeks * 7 - 1);
    setFilter("dateFrom", formatDateInput(dateFrom));
    setFilter("dateTo", formatDateInput(dateTo));
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
        {(["Weekly", "Monthly", "Quarterly"] as const).map((granularity) => (
          <button
            key={granularity}
            type="button"
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
              filters.inventoryMovementGranularity === granularity ? "border-brand-200 bg-brand-50 text-brand-700 shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:text-brand-700",
            )}
            onClick={() => setFilter("inventoryMovementGranularity", granularity)}
          >
            {granularity}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden="true" />
        <button type="button" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-brand-200 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" onClick={() => applyLastWeeks(4)}>
          Last 4 Weeks
        </button>
        <button type="button" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-brand-200 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" onClick={() => applyLastWeeks(12)}>
          Last 12 Weeks
        </button>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6">
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date From</span>
          <input className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" type="date" value={filters.dateFrom} onChange={(event) => setFilter("dateFrom", event.target.value)} />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date To</span>
          <input className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" type="date" value={filters.dateTo} onChange={(event) => setFilter("dateTo", event.target.value)} />
        </label>
        <FilterSelect label="City" field="city" values={options.cities.map((city) => ({ label: city, value: city }))} />
        <FilterSelect label="Branch" field="branch" values={options.branches.map((branch) => ({ label: branch.name, value: branch.id }))} />
        <FilterSelect label="Category" field="category" values={options.categories.map((category) => ({ label: category, value: category }))} />
        <FilterSelect label="Product" field="product" values={options.products.slice(0, 40).map((product) => ({ label: product.name, value: product.id }))} />
        <FilterSelect label="Supplier" field="supplier" values={options.suppliers.map((supplier) => ({ label: supplier.name, value: supplier.id }))} />
        <div className="flex items-end">
          <Button className="w-full" onClick={resetFilters}><RotateCcw className="h-4 w-4" />Reset</Button>
        </div>
      </div>
    </div>
  );
}
