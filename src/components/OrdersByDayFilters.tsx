import { useEffect, useMemo } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { getAvailableBranchesForCity, getAvailableProducts, getFilterOptions } from "@/services/mock-api";
import { useFilterStore } from "@/store/filters";

const options = getFilterOptions();

export function OrdersByDayFilters({ showDateFields = false, todayMode = false, onCustomDateChange }: { showDateFields?: boolean; todayMode?: boolean; onCustomDateChange?: () => void }) {
  const filters = useFilterStore((state) => state.filters);
  const setFilter = useFilterStore((state) => state.setFilter);
  const resetFilters = useFilterStore((state) => state.resetFilters);
  const citySelected = filters.city !== "All";
  const availableBranches = useMemo(() => getAvailableBranchesForCity(filters.city), [filters.city]);
  const availableProducts = useMemo(() => getAvailableProducts({ category: filters.category, branch: "All" }), [filters.category]);
  const branchIsValid = filters.branch === "All" || availableBranches.some((branch) => branch.id === filters.branch);
  const productIsValid = filters.product === "All" || availableProducts.some((product) => product.id === filters.product);
  const branchAllLabel = citySelected ? `All ${filters.city} Branches` : "Select a city first";
  const productAllLabel = filters.category === "All" ? "All Products" : `All ${filters.category} Products`;

  useEffect(() => {
    if (!citySelected || !branchIsValid) {
      setFilter("branch", "All");
    }
  }, [branchIsValid, citySelected, setFilter]);

  useEffect(() => {
    if (!productIsValid) {
      setFilter("product", "All");
    }
  }, [productIsValid, setFilter]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      {showDateFields ? (
        <div className="mb-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr]">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date From</span>
            <input className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400" type="date" value={filters.dateFrom} onChange={(event) => {
              onCustomDateChange?.();
              setFilter("dateFrom", event.target.value);
            }} disabled={todayMode} />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date To</span>
            <input className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400" type="date" value={filters.dateTo} onChange={(event) => {
              onCustomDateChange?.();
              setFilter("dateTo", event.target.value);
            }} disabled={todayMode} />
          </label>
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1.15fr_1.35fr_auto]">
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">City</span>
          <Select
            value={filters.city}
            onChange={(event) => {
              setFilter("city", event.target.value);
              setFilter("branch", "All");
            }}
          >
            <option value="All">All Cities</option>
            {options.cities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </Select>
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Branch</span>
          <Select
            value={citySelected && branchIsValid ? filters.branch : "All"}
            onChange={(event) => setFilter("branch", event.target.value)}
            disabled={!citySelected}
            aria-describedby={!citySelected ? "orders-day-branch-help" : undefined}
            className={!citySelected ? "cursor-not-allowed bg-slate-100 text-slate-400" : undefined}
          >
            <option value="All">{branchAllLabel}</option>
            {availableBranches.map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </Select>
          {!citySelected ? <p id="orders-day-branch-help" className="text-xs text-slate-500">Select a city to enable branch filtering.</p> : null}
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category</span>
          <Select
            value={filters.category}
            onChange={(event) => {
              setFilter("category", event.target.value);
              setFilter("product", "All");
            }}
          >
            <option value="All">All Categories</option>
            {options.categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </Select>
        </label>
        <label className="space-y-1.5 sm:col-span-2 xl:col-span-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Product</span>
          <Select value={productIsValid ? filters.product : "All"} onChange={(event) => setFilter("product", event.target.value)}>
            <option value="All">{productAllLabel}</option>
            {availableProducts.map((product) => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </Select>
        </label>
        <div className="flex items-end">
          <Button aria-label="Reset filters" className="h-10 w-10 px-0" onClick={resetFilters} title="Reset filters"><RotateCcw className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}
