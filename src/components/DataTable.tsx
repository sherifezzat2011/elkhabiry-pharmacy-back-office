import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Columns3, Download, Search } from "lucide-react";
import type { TableRow } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

function downloadCsv(rows: TableRow[], filename: string) {
  const keys = Object.keys(rows[0] ?? {});
  const csv = [keys.join(","), ...rows.map((row) => keys.map((key) => `"${String(row[key] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function sortableNumber(value: unknown) {
  if (typeof value === "number") {
    return value;
  }
  const text = String(value ?? "");
  if (text === "New") {
    return Number.POSITIVE_INFINITY;
  }
  if (text === "No Activity") {
    return Number.NEGATIVE_INFINITY;
  }
  const multiplier = text.includes("M") ? 1_000_000 : text.includes("K") ? 1_000 : 1;
  const numeric = Number(text.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric * multiplier : 0;
}

const statusRank: Record<string, number> = {
  Leader: 5,
  Peak: 5,
  "Peak Week": 5,
  Growing: 4,
  Strong: 4,
  Stable: 3,
  Normal: 3,
  "Partial Week": 3,
  Opportunity: 2,
  "Low Demand": 2,
  Declining: 1,
};

export function DataTable({ rows, title, subtitle = "Sortable, searchable, paginated analytics data with controlled column visibility.", note, onRowClick }: { rows: TableRow[]; title: string; subtitle?: string; note?: string; onRowClick?: (row: TableRow) => void }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [exported, setExported] = useState(false);
  const columns = useMemo<ColumnDef<TableRow>[]>(() => {
    const keys = Object.keys(rows[0] ?? { metric: "" });
    return keys.map((key) => ({
      accessorKey: key,
      header: key.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase()),
      sortingFn: (rowA, rowB, columnId) => {
        const a = rowA.getValue(columnId);
        const b = rowB.getValue(columnId);
        if (columnId === "Status") {
          return (statusRank[String(a)] ?? 0) - (statusRank[String(b)] ?? 0);
        }
        if (columnId.includes("Revenue") || columnId.includes("%") || columnId.includes("Growth") || columnId.includes("Orders") || columnId.includes("Average Order Value")) {
          return sortableNumber(a) - sortableNumber(b);
        }
        return String(a ?? "").localeCompare(String(b ?? ""));
      },
      cell: ({ getValue }) => {
        const value = String(getValue<string | number>());
        if (key === "status" || key === "Status" || key === "Risk Impact") {
          const statusTone =
            value === "Leader" ? "bg-brand-50 text-brand-700"
              : value === "Peak" ? "bg-brand-50 text-brand-700"
              : value === "Peak Week" ? "bg-brand-50 text-brand-700"
              : value === "Growing" ? "bg-blue-50 text-blue-700"
                : value === "Strong" ? "bg-blue-50 text-blue-700"
                : value === "Opportunity" ? "bg-orange-50 text-orange-700"
                  : value === "Low Demand" ? "bg-orange-50 text-orange-700"
                    : value === "Partial Week" ? "bg-purple-50 text-purple-700"
                      : value === "Declining" ? "bg-red-50 text-red-700"
                        : "bg-slate-100 text-slate-700";
          const tone = value.includes("Reorder") || value.includes("Low") ? "bg-orange-50 text-orange-700" : value.includes("Star") ? "bg-brand-50 text-brand-700" : value.includes("Slow") ? "bg-red-50 text-red-700" : statusTone;
          const riskTone = value === "High" ? "bg-red-50 text-red-700" : value === "Medium" ? "bg-orange-50 text-orange-700" : value === "Low" ? "bg-brand-50 text-brand-700" : tone;
          return <span aria-label={`Status: ${value}`} className={cn("whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", riskTone)}>{value}</span>;
        }
        return <span className="whitespace-nowrap">{value}</span>;
      },
    }));
  }, [rows]);
  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, globalFilter, columnVisibility },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } },
  });
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            {note ? <p className="mt-2 text-xs leading-5 text-slate-400">{note}</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input className="h-10 w-56 rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" placeholder="Search table" value={globalFilter} onChange={(event) => setGlobalFilter(event.target.value)} />
            </div>
            <details className="relative">
              <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm">
                <Columns3 className="h-4 w-4" /> Columns
              </summary>
              <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-3 shadow-soft">
                {table.getAllLeafColumns().map((column) => (
                  <label key={column.id} className="flex items-center gap-2 py-1.5 text-sm text-slate-700">
                    <input type="checkbox" checked={column.getIsVisible()} onChange={column.getToggleVisibilityHandler()} />
                    {column.id}
                  </label>
                ))}
              </div>
            </details>
            <Button
              variant="primary"
              onClick={() => {
                downloadCsv(rows, `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`);
                setExported(true);
                window.setTimeout(() => setExported(false), 1800);
              }}
            >
              <Download className="h-4 w-4" />{exported ? "Exported" : "Export CSV"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto scrollbar-soft">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-brand-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="h-12 px-4 py-3 text-center align-middle text-xs font-bold uppercase tracking-wide text-brand-900">
                      <button className="mx-auto flex items-center justify-center gap-1" onClick={header.column.getToggleSortingHandler()}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <span className="text-brand-500">{header.column.getIsSorted() === "asc" ? "Asc" : header.column.getIsSorted() === "desc" ? "Desc" : ""}</span>
                      </button>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn("transition hover:bg-brand-50/50", onRowClick && "cursor-pointer")}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-center align-middle text-slate-700">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}><ChevronLeft className="h-4 w-4" />Previous</Button>
            <Button size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next<ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
