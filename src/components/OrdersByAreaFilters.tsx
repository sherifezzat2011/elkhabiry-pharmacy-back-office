import { useEffect, useMemo } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { getAvailableAreasForCity, getAvailableProducts, getFilterOptions } from "@/services/mock-api";
import { useFilterStore } from "@/store/filters";

const options = getFilterOptions();

export function OrdersByAreaFilters() {
  const filters = useFilterStore((state) => state.filters);
  const setFilter = useFilterStore((state) => state.setFilter);
  const resetFilters = useFilterStore((state) => state.resetFilters);
  const availableAreas = useMemo(() => getAvailableAreasForCity(filters.city), [filters.city]);
  const availableProducts = useMemo(() => getAvailableProducts({ category: filters.category, branch: "All" }), [filters.category]);
  const selectedCity = options.cities.find((city) => city === filters.city);
  const citySelected = filters.city !== "All";
  const areaIsValid = filters.area === "All" || availableAreas.some((area) => area.id === filters.area);
  const productIsValid = filters.product === "All" || availableProducts.some((product) => product.id === filters.product);
  const productAllLabel = filters.category === "All" ? "All Products" : `All ${filters.category} Products`;

  useEffect(() => {
    if (!citySelected || !areaIsValid) {
      setFilter("area", "All");
    }
  }, [areaIsValid, citySelected, setFilter]);

  useEffect(() => {
    if (!productIsValid) {
      setFilter("product", "All");
    }
  }, [productIsValid, setFilter]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_1fr_1.4fr_auto]">
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date From</span>
          <input className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" type="date" value={filters.dateFrom} onChange={(event) => setFilter("dateFrom", event.target.value)} />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date To</span>
          <input className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" type="date" value={filters.dateTo} onChange={(event) => setFilter("dateTo", event.target.value)} />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">City</span>
          <Select
            value={filters.city}
            onChange={(event) => {
              setFilter("city", event.target.value);
              setFilter("area", "All");
            }}
          >
            <option value="All">All Cities</option>
            {options.cities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </Select>
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Area</span>
          <Select
            value={citySelected && areaIsValid ? filters.area : "All"}
            onChange={(event) => setFilter("area", event.target.value)}
            disabled={!citySelected}
            aria-describedby={!citySelected ? "area-disabled-help" : undefined}
            className={!citySelected ? "cursor-not-allowed bg-slate-100 text-slate-400" : undefined}
          >
            <option value="All">{citySelected ? `All ${selectedCity ?? ""} Areas` : "Select a city first"}</option>
            {availableAreas.map((area) => (
              <option key={area.id} value={area.id}>{area.area}</option>
            ))}
          </Select>
          {!citySelected ? <p id="area-disabled-help" className="text-xs text-slate-500">Select a city to enable area filtering.</p> : null}
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
          <Button className="w-full" onClick={resetFilters}><RotateCcw className="h-4 w-4" />Reset</Button>
        </div>
      </div>
    </div>
  );
}
