import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ChartDatum } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { formatCompactCurrency, formatCurrency, formatNumber } from "@/lib/utils";

const BRAND_PRIMARY = "#10B7B4";
const BRAND_DEEP = "#086F70";
const BRAND_LIGHT = "#7FDDDA";
const NEUTRAL_DARK = "#32383D";
const NEUTRAL = "#727B80";
const WARNING = "#C98212";
const DANGER = "#C84646";
const INFO = "#277BA8";
const colors = [BRAND_PRIMARY, NEUTRAL_DARK, BRAND_LIGHT, INFO, WARNING, DANGER, NEUTRAL];

type ValueFormatter = (value: number) => string;

function ChartTooltip({ active, payload, label, formatter = formatCurrency }: { active?: boolean; payload?: { value: number }[]; label?: string; formatter?: ValueFormatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-soft">
      <div className="font-semibold text-slate-900">{label}</div>
      <div className="text-slate-600">{formatter(payload[0].value)}</div>
      {payload[1] ? <div className="text-slate-400">Previous: {formatter(payload[1].value)}</div> : null}
    </div>
  );
}

function MovementTrendTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; dataKey: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const stockIn = payload.find((item) => item.dataKey === "value")?.value ?? 0;
  const stockOut = payload.find((item) => item.dataKey === "secondary")?.value ?? 0;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-soft">
      <div className="font-semibold text-slate-900">{label}</div>
      <div className="text-brand-700">Stock In: {formatNumber(stockIn)}</div>
      <div className="text-slate-700">Stock Out: {formatNumber(stockOut)}</div>
    </div>
  );
}

export function MainChart({ data, title, valueFormatter = formatCurrency, axisFormatter }: { data: ChartDatum[]; title: string; valueFormatter?: ValueFormatter; axisFormatter?: ValueFormatter }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-950">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">Filtered trend with commercial value and activity density.</p>
          </div>
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">Live filters</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(value: number) => axisFormatter ? axisFormatter(value) : `${Math.round(value / 1000)}k`} />
              <Tooltip content={<ChartTooltip formatter={valueFormatter} />} />
              <Line type="monotone" dataKey="secondary" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              <Line type="monotone" dataKey="value" stroke={BRAND_PRIMARY} strokeWidth={3} dot={{ r: 3, fill: BRAND_PRIMARY }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function InventoryMovementTrendPanel({ data, title }: { data: ChartDatum[]; title: string }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">Stock received and stock consumed over the selected period.</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(value: number) => formatNumber(value / 1000)} />
              <Tooltip content={<MovementTrendTooltip />} />
              <Line type="monotone" dataKey="value" name="Stock In" stroke={BRAND_PRIMARY} strokeWidth={3} dot={{ r: 3, fill: BRAND_PRIMARY }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="secondary" name="Stock Out" stroke={NEUTRAL_DARK} strokeWidth={3} dot={{ r: 3, fill: NEUTRAL_DARK }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function BarPanel({ data, title, valueFormatter = formatCompactCurrency, axisFormatter }: { data: ChartDatum[]; title: string; valueFormatter?: ValueFormatter; axisFormatter?: ValueFormatter }) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} interval={0} angle={-15} height={52} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(value: number) => axisFormatter ? axisFormatter(value) : formatNumber(value / 1000)} />
              <Tooltip content={<ChartTooltip formatter={valueFormatter} />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function HorizontalBarPanel({ data, title, valueFormatter = formatCurrency }: { data: ChartDatum[]; title: string; valueFormatter?: ValueFormatter }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.slice(0, 10).map((item, index) => {
            const contribution = item.secondary ?? (item.value / Math.max(1, total)) * 100;
            return (
              <div key={item.name} className="grid gap-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate font-medium text-slate-700" title={item.name}>{index + 1}. {item.name}</span>
                  <span className="shrink-0 text-slate-500">{valueFormatter(item.value)} - {contribution.toFixed(1)}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100">
                  <div className="h-2.5 rounded-full bg-brand-500" style={{ width: `${Math.max(4, contribution)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function ParetoTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; dataKey: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const revenue = payload.find((item) => item.dataKey === "value")?.value ?? 0;
  const cumulative = payload.find((item) => item.dataKey === "secondary")?.value ?? 0;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-soft">
      <div className="font-semibold text-slate-900">{label}</div>
      <div className="text-slate-600">Revenue: {formatCurrency(revenue)}</div>
      <div className="text-slate-500">Cumulative: {cumulative.toFixed(1)}%</div>
    </div>
  );
}

export function ParetoPanel({ data, title }: { data: ChartDatum[]; title: string }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">Revenue bars sorted descending with cumulative contribution line.</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 12, right: 18, left: 0, bottom: 58 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} interval={0} angle={-30} textAnchor="end" height={70} />
              <YAxis yAxisId="left" tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(value: number) => `${Math.round(value / 1000)}k`} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(value: number) => `${value}%`} />
              <Tooltip content={<ParetoTooltip />} />
              <Bar yAxisId="left" dataKey="value" fill={BRAND_PRIMARY} radius={[6, 6, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="secondary" stroke={BRAND_DEEP} strokeWidth={3} dot={{ r: 3, fill: BRAND_DEEP }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function CategorySharePanel({ data, title }: { data: ChartDatum[]; title: string }) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={item.name} className="grid gap-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2 font-medium text-slate-700">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                  <span className="truncate" title={item.name}>{item.name}</span>
                </span>
                <span className="shrink-0 text-slate-500">{item.value.toFixed(1)}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100">
                <div className="h-2.5 rounded-full" style={{ width: `${Math.max(4, item.value)}%`, backgroundColor: colors[index % colors.length] }} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function MovementPanel({ data, title, mode }: { data: ChartDatum[]; title: string; mode: "fast" | "slow" }) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <span className="min-w-0 truncate font-medium text-slate-700" title={item.name}>{index + 1}. {item.name}</span>
              <span className="shrink-0 text-slate-500">
                {mode === "fast" ? `${formatNumber(item.value)} units - ${formatNumber(item.secondary ?? 0)} orders` : `${formatNumber(item.value)} units - ${formatNumber(item.secondary ?? 0)} stock days`}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function DonutPanel({ data, title, valueFormatter = formatNumber }: { data: ChartDatum[]; title: string; valueFormatter?: ValueFormatter }) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-[1fr_190px]">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={96} paddingAngle={3}>
                  {data.map((entry, index) => (
                    <Cell key={entry.name} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip formatter={valueFormatter} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col justify-center gap-3">
            {data.slice(0, 6).map((item, index) => (
              <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2 text-slate-600">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                  <span className="truncate">{item.name}</span>
                </span>
                <span className="shrink-0 font-semibold text-slate-900">
                  {formatNumber(item.value)}{typeof item.secondary === "number" ? ` - ${item.secondary.toFixed(1)}%` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
