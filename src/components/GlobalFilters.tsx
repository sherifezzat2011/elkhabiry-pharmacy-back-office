import { RotateCcw } from "lucide-react";
import { getFilterOptions } from "@/services/mock-api";
import { useFilterStore } from "@/store/filters";
import type { FilterState } from "@/types";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

const options = getFilterOptions();

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

type FilterField = "branch" | "city" | "category" | "product" | "supplier" | "customerType" | "prescriptionStatus" | "doctorSpecialty";

export function GlobalFilters({ fields, showDateRange = true }: { fields?: FilterField[]; showDateRange?: boolean }) {
  const filters = useFilterStore((state) => state.filters);
  const setFilter = useFilterStore((state) => state.setFilter);
  const resetFilters = useFilterStore((state) => state.resetFilters);
  const visibleFields = new Set<FilterField>(fields ?? ["branch", "city", "category", "product", "supplier", "customerType", "prescriptionStatus", "doctorSpecialty"]);
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6">
        {showDateRange ? (
          <>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date From</span>
              <input className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" type="date" value={filters.dateFrom} onChange={(event) => setFilter("dateFrom", event.target.value)} />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date To</span>
              <input className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" type="date" value={filters.dateTo} onChange={(event) => setFilter("dateTo", event.target.value)} />
            </label>
          </>
        ) : null}
        {visibleFields.has("branch") ? <FilterSelect label="Branch" field="branch" values={options.branches.map((branch) => ({ label: branch.name, value: branch.id }))} /> : null}
        {visibleFields.has("city") ? <FilterSelect label="City" field="city" values={options.cities.map((city) => ({ label: city, value: city }))} /> : null}
        {visibleFields.has("category") ? <FilterSelect label="Category" field="category" values={options.categories.map((category) => ({ label: category, value: category }))} /> : null}
        {visibleFields.has("product") ? <FilterSelect label="Product" field="product" values={options.products.slice(0, 40).map((product) => ({ label: product.name, value: product.id }))} /> : null}
        {visibleFields.has("supplier") ? <FilterSelect label="Supplier" field="supplier" values={options.suppliers.map((supplier) => ({ label: supplier.name, value: supplier.id }))} /> : null}
        {visibleFields.has("customerType") ? <FilterSelect label="Customer Type" field="customerType" values={options.customerTypes.map((type) => ({ label: type, value: type }))} /> : null}
        {visibleFields.has("prescriptionStatus") ? <FilterSelect label="Rx Status" field="prescriptionStatus" values={options.prescriptionStatuses.map((status) => ({ label: status, value: status }))} /> : null}
        {visibleFields.has("doctorSpecialty") ? <FilterSelect label="Doctor Specialty" field="doctorSpecialty" values={options.specialties.map((specialty) => ({ label: specialty, value: specialty }))} /> : null}
        <div className="flex items-end">
          <Button className="w-full" onClick={resetFilters}><RotateCcw className="h-4 w-4" />Reset</Button>
        </div>
      </div>
    </div>
  );
}
