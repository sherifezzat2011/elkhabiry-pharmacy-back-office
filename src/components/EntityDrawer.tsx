import { X } from "lucide-react";
import { getEntityDetails, getFilterOptions } from "@/services/mock-api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useState } from "react";

type DrawerKind = "product" | "customer" | "supplier" | "prescription";

export function EntityDrawerLauncher() {
  const options = getFilterOptions();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<DrawerKind>("product");
  const sampleIds: Record<DrawerKind, string> = {
    product: options.products[0].id,
    customer: "c1",
    supplier: options.suppliers[0].id,
    prescription: "rx1",
  };
  const details = getEntityDetails(kind, sampleIds[kind]);
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {(["product", "customer", "supplier", "prescription"] as DrawerKind[]).map((item) => (
          <Button key={item} size="sm" onClick={() => { setKind(item); setOpen(true); }}>
            {item[0].toUpperCase() + item.slice(1)} Drawer
          </Button>
        ))}
      </div>
      {open ? (
        <div className="fixed inset-0 z-50">
          <button className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm" aria-label="Close drawer" onClick={() => setOpen(false)} />
          <aside className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Entity Intelligence</p>
                <h2 className="text-lg font-semibold text-slate-950">{kind[0].toUpperCase() + kind.slice(1)} Profile</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}><X className="h-5 w-5" /></Button>
            </div>
            <div className="space-y-4 p-5">
              {Object.entries(details).map(([key, value]) => (
                <Card key={key} className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{key}</p>
                  <p className="mt-2 text-base font-semibold text-slate-950">{String(value)}</p>
                </Card>
              ))}
              <div className="rounded-lg bg-brand-950 p-5 text-white">
                <p className="text-sm font-semibold">Operations note</p>
                <p className="mt-2 text-sm leading-6 text-brand-50">This drawer supports focused drill-down reviews without leaving the active management page.</p>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
