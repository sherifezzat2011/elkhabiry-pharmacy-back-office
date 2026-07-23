import { ArrowUpRight, Building2, PackagePlus, Target } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BrandLogo } from "@/components/BrandLogo";

const points = [
  { icon: Target, title: "Commercial command center", text: "Revenue, margin, target achievement, and category concentration are presented in a board-ready structure." },
  { icon: PackagePlus, title: "Inventory risk control", text: "Low stock, expiry, batch coverage, and supplier dependency signals are visible from every filtered report." },
  { icon: Building2, title: "Branch performance", text: "Managers can compare branches, cities, customers, order channels, and customer care priorities." },
];

export function ExecutiveBrief() {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <section className="relative overflow-hidden rounded-xl border border-brand-100 bg-white px-5 py-5 shadow-soft md:px-6">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(16,183,180,0.14),transparent_60%)] md:block" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">El Khabiry Pharmacy</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-950 md:text-3xl">Operations Command Center</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Monitor sales, inventory, orders, branches, and operational performance across the pharmacy network.
            </p>
            <p className="mt-3 text-sm font-semibold text-brand-700" lang="ar">خبراء الدواء</p>
            <div className="mt-4 rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-900">
              <span className="font-semibold">Welcome back, Ahmed.</span> Here is what is happening across El Khabiry Pharmacy today.
            </div>
          </div>
          <BrandLogo variant="full" className="h-28 w-44 shrink-0 self-start rounded-lg bg-white/80 md:self-center" />
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {points.map((point) => (
          <Card key={point.title} className="p-5">
            <div className="mb-4 inline-flex rounded-lg bg-brand-50 p-3 text-brand-600">
              <point.icon className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-slate-950">{point.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">{point.text}</p>
          </Card>
        ))}
      </section>
      <Card className="p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Platform scope</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Sales, inventory, products, customers, suppliers, prescriptions, and branch insights share one global filtering model and reusable enterprise reporting surface.</p>
          </div>
          <Button variant="primary"><ArrowUpRight className="h-4 w-4" />Open dashboard</Button>
        </div>
      </Card>
    </div>
  );
}
