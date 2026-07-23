import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useFilterStore } from "@/store/filters";

export function EmptyState() {
  const resetFilters = useFilterStore((state) => state.resetFilters);
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-brand-200 bg-white p-8 text-center">
      <div className="mb-4 rounded-full bg-brand-50 p-3 text-brand-600">
        <SearchX className="h-7 w-7" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">No matching analytics data</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">The active filter combination does not return reportable activity. Reset filters to restore the executive data view.</p>
      <Button className="mt-5" variant="primary" onClick={resetFilters}>Reset filters</Button>
    </div>
  );
}
