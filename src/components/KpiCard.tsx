import { Activity, ArrowDownRight, ArrowUpRight, BadgePercent, CircleDollarSign, PackageCheck, ShoppingCart, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Kpi } from "@/types";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const toneClasses: Record<Kpi["tone"], string> = {
  green: "bg-brand-50 text-brand-700 ring-brand-100",
  blue: "bg-blue-50 text-blue-700 ring-blue-100",
  purple: "bg-purple-50 text-purple-700 ring-purple-100",
  orange: "bg-orange-50 text-orange-700 ring-orange-100",
  red: "bg-red-50 text-red-700 ring-red-100",
};

const icons: LucideIcon[] = [CircleDollarSign, ShoppingCart, Users, PackageCheck, BadgePercent, Activity];

export function KpiCard({ kpi, index }: { kpi: Kpi; index: number }) {
  const Icon = icons[index % icons.length];
  const isComparison = kpi.delta.startsWith("+") || kpi.delta.startsWith("-");
  const positive = !kpi.delta.startsWith("-");
  return (
    <Card className="group relative overflow-hidden border-t-4 border-t-brand-500 p-5 transition duration-300 hover:-translate-y-0.5 hover:border-brand-200">
      <div className="pr-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{kpi.label}</p>
          <p className="mt-3 whitespace-nowrap text-2xl font-semibold text-slate-950">{kpi.value}</p>
        </div>
      </div>
      <div className={cn("absolute right-5 top-5 flex h-12 w-12 items-center justify-center rounded-lg ring-1", toneClasses[kpi.tone])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-5 flex items-center gap-2 text-sm">
        <span className={cn("inline-flex items-center gap-1 font-semibold", isComparison ? (positive ? "text-brand-600" : "text-red-600") : "text-slate-600")}>
          {isComparison ? positive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" /> : null}
          {kpi.delta}
        </span>
        {isComparison ? <span className="text-slate-500">vs previous period</span> : null}
      </div>
    </Card>
  );
}
