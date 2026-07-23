import { useEffect, useMemo } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { getAvailableProducts, getFilterOptions } from "@/services/mock-api";
import { useFilterStore } from "@/store/filters";

const options = getFilterOptions();

export function ProductPerformanceFilters() {
  const filters = useFilterStore((state) => state.filters);
  const setFilter = useFilterStore((state) => state.setFilter);
  const resetFilters = useFilterStore((state) => state.resetFilters);
  const availableProducts = useMemo(
    () => getAvailableProducts({ category: filters.category, branch: filters.branch }),
    [filters.category, filters.branch],
  );
  const selectedProductIsValid = filters.product === "All" || availableProducts.some((product) => product.id === filters.product);
  const productAllLabel = filters.category === "All" ? "All Products" : `All ${filters.category} Products`;

  useEffect(() => {
    if (!selectedProductIsValid) {
      setFilter("product", "All");
    }
  }, [selectedProductIsValid, setFilter]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.4fr_auto]">
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date From</span>
          <input className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" type="date" value={filters.dateFrom} onChange={(event) => setFilter("dateFrom", event.target.value)} />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date To</span>
          <input className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" type="date" value={filters.dateTo} onChange={(event) => setFilter("dateTo", event.target.value)} />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Branch</span>
          <Select value={filters.branch} onChange={(event) => setFilter("branch", event.target.value)}>
            <option value="All">All Branches</option>
            {options.branches.map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </Select>
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category</span>
          <Select value={filters.category} onChange={(event) => setFilter("category", event.target.value)}>
            <option value="All">All Categories</option>
            {options.categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </Select>
        </label>
        <label className="space-y-1.5 sm:col-span-2 xl:col-span-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Product</span>
          <Select value={selectedProductIsValid ? filters.product : "All"} onChange={(event) => setFilter("product", event.target.value)}>
            <option value="All">{productAllLabel}</option>
            {availableProducts.map((product) => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </Select>
        </label>
        <div className="flex items-end">
          <Button className="w-full" onClick={resetFilters}><RotateCcw className="h-4 w-4" />Reset</Button>
        </div>
      </div>
      {availableProducts.length === 0 ? (
        <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">
          No products are available for the selected category and branch.
        </div>
      ) : null}
    </div>
  );
}
