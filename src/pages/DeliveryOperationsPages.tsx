import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Eye, Pencil, Plus, Search, X } from "lucide-react";
import { DonutPanel } from "@/components/Charts";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MoreActionsMenu } from "@/components/ui/MoreActionsMenu";
import { cn, formatNumber } from "@/lib/utils";

export type DeliveryStatus = "Active" | "Inactive";
export type DeliveryChannelType = "In-House" | "External Partner" | "Express";
export type CoverageType = "Radius" | "District" | "Postal Area" | "Custom Boundary";

export type DeliveryChannel = {
  id: string;
  name: string;
  type: DeliveryChannelType;
  contactPerson: string;
  contactPhone: string;
  availableDrivers: number;
  assignedZones: string[];
  ordersToday: number;
  averageTime: number;
  successRate: number;
  status: DeliveryStatus;
  activeDeliveries: number;
  createdDate: string;
  lastUpdated: string;
  latestDeliveries: string[];
};

export type DeliveryZone = {
  id: string;
  name: string;
  coverageType: CoverageType;
  branch: string;
  deliveryFee: number;
  minimumOrder: number;
  estimatedTime: number;
  assignedChannels: string[];
  status: DeliveryStatus;
  ordersToday: number;
  customersCovered: number;
  activeOrders: number;
  createdDate: string;
  lastUpdated: string;
  coverageDetails: string;
  radiusKm?: number;
  mapPoints?: { lat: number; lng: number }[];
};

export type DeliveryOrder = {
  id: string;
  patient: string;
  address: string;
  zoneId: string | null;
  channelId: string | null;
  appliedFee: number | null;
  estimatedTime: string;
  pricingRule: string;
  status: string;
};

function Kpi({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <Card className="border-t-4 border-t-brand-500 p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-3 text-3xl font-bold text-slate-950">{value}</p><p className="mt-2 text-sm text-slate-500">{detail}</p></Card>;
}

function Badge({ value }: { value: string }) {
  const tone = value === "Active" || value === "Assigned" || value === "Preparing" || value === "Out for Delivery" ? "bg-brand-50 text-brand-800 ring-brand-100" : value === "Needs Channel Review" ? "bg-amber-50 text-amber-700 ring-amber-100" : "bg-slate-100 text-slate-600 ring-slate-200";
  return <span className={cn("inline-flex min-h-7 items-center justify-center whitespace-nowrap rounded-full px-3 text-xs font-bold ring-1", tone)}>{value}</span>;
}

function Hero({ title, subtitle, action }: { title: string; subtitle: string; action?: JSX.Element }) {
  return <section className="rounded-xl border border-brand-100 bg-white p-5 shadow-soft"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Delivery Operations</p><h1 className="mt-2 text-3xl font-bold text-slate-950">{title}</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{subtitle}</p></div>{action ? <div className="shrink-0 lg:pb-1">{action}</div> : null}</div></section>;
}

function Drawer({ title, onClose, children, footer }: { title: string; onClose: () => void; children: JSX.Element; footer?: JSX.Element }) {
  return <div className="fixed inset-0 z-50"><button className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm" aria-label="Close drawer" onClick={onClose} /><aside className="absolute right-0 top-0 flex h-full w-full flex-col bg-white shadow-2xl sm:max-w-xl"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="text-lg font-bold text-slate-950">{title}</h2><Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button></div><div className="flex-1 overflow-y-auto p-5">{children}</div>{footer ? <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">{footer}</div> : null}</aside></div>;
}

function Field({ label, children }: { label: string; children: JSX.Element }) {
  return <label className="grid gap-1.5 text-sm font-semibold text-slate-700">{label}{children}</label>;
}

const inputClass = "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";
const tileSize = 256;
const defaultMapCenter = { lat: 30.7865, lng: 31.0004 };

function lngToWorldX(lng: number, zoom: number) {
  return ((lng + 180) / 360) * 2 ** zoom * tileSize;
}

function latToWorldY(lat: number, zoom: number) {
  const safeLat = Math.max(-85.0511, Math.min(85.0511, lat));
  const rad = (safeLat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** zoom * tileSize;
}

function worldXToLng(x: number, zoom: number) {
  return (x / (2 ** zoom * tileSize)) * 360 - 180;
}

function worldYToLat(y: number, zoom: number) {
  const n = Math.PI - (2 * Math.PI * y) / (2 ** zoom * tileSize);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

function projectMapPoint(point: { lat: number; lng: number }, zoom: number) {
  return { x: lngToWorldX(point.lng, zoom), y: latToWorldY(point.lat, zoom) };
}

function zoneName(zoneId: string, zones: DeliveryZone[]) {
  return zones.find((zone) => zone.id === zoneId)?.name ?? "Unassigned";
}

function channelName(channelId: string, channels: DeliveryChannel[]) {
  return channels.find((channel) => channel.id === channelId)?.name.replace("El Khabiry ", "").replace("Tanta ", "") ?? "Unassigned";
}

function ActionMenu({ status, onToggle, onDelete }: { status: DeliveryStatus; onToggle: () => void; onDelete: () => void }) {
  return <MoreActionsMenu actions={[{ label: status === "Active" ? "Deactivate" : "Activate", onClick: onToggle }, { label: "Delete", onClick: onDelete, danger: true }]} />;
}

function ChannelForm({ channel, zones, onCancel, onSave }: { channel?: DeliveryChannel; zones: DeliveryZone[]; onCancel: () => void; onSave: (channel: DeliveryChannel) => void }) {
  const [form, setForm] = useState<DeliveryChannel>(channel ?? { id: `channel-${Date.now()}`, name: "", type: "In-House", contactPerson: "", contactPhone: "", availableDrivers: 1, assignedZones: zones.slice(0, 1).map((zone) => zone.id), ordersToday: 0, averageTime: 25, successRate: 97, status: "Active", activeDeliveries: 0, createdDate: "2026-07-26", lastUpdated: "2026-07-26", latestDeliveries: [] });
  const [error, setError] = useState("");
  const toggleZone = (zoneId: string) => setForm((previous) => ({ ...previous, assignedZones: previous.assignedZones.includes(zoneId) ? previous.assignedZones.filter((id) => id !== zoneId) : [...previous.assignedZones, zoneId] }));
  const submit = () => {
    if (!form.name.trim() || !form.contactPerson.trim() || !form.contactPhone.trim()) return setError("Channel name and contact details are required.");
    onSave({ ...form, name: form.name.trim(), lastUpdated: "2026-07-26" });
  };
  return <Drawer title={channel ? "Edit Delivery Channel" : "Add Delivery Channel"} onClose={onCancel} footer={<div className="flex justify-end gap-2"><Button onClick={onCancel}>Cancel</Button><Button variant="primary" onClick={submit}>Save Channel</Button></div>}><div className="space-y-4">{error ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}<Field label="Channel Name"><input className={inputClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="El Khabiry In-House Drivers" /></Field><Field label="Channel Type"><select className={inputClass} value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as DeliveryChannelType })}><option>In-House</option><option>External Partner</option><option>Express</option></select></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Contact Person"><input className={inputClass} value={form.contactPerson} onChange={(event) => setForm({ ...form, contactPerson: event.target.value })} /></Field><Field label="Contact Phone"><input className={inputClass} value={form.contactPhone} onChange={(event) => setForm({ ...form, contactPhone: event.target.value })} /></Field></div><Field label="Number of Available Drivers"><input className={inputClass} type="number" min={0} value={form.availableDrivers} onChange={(event) => setForm({ ...form, availableDrivers: Number(event.target.value) })} /></Field><div><p className="text-sm font-semibold text-slate-700">Default Service Areas</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{zones.map((zone) => <label key={zone.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"><input type="checkbox" checked={form.assignedZones.includes(zone.id)} onChange={() => toggleZone(zone.id)} />{zone.name}</label>)}</div></div><Field label="Status"><select className={inputClass} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as DeliveryStatus })}><option>Active</option><option>Inactive</option></select></Field></div></Drawer>;
}

function ChannelDetails({ channel, zones, onClose }: { channel: DeliveryChannel; zones: DeliveryZone[]; onClose: () => void }) {
  const details = [["Type", channel.type], ["Contact Details", `${channel.contactPerson} / ${channel.contactPhone}`], ["Available Drivers", String(channel.availableDrivers)], ["Assigned Zones", channel.assignedZones.map((id) => zoneName(id, zones)).join(", ")], ["Orders Today", String(channel.ordersToday)], ["Average Delivery Time", `${channel.averageTime} min`], ["Success Rate", `${channel.successRate}%`], ["Status", channel.status], ["Created Date", channel.createdDate], ["Last Updated", channel.lastUpdated]];
  return <Drawer title={channel.name} onClose={onClose}><div className="space-y-5"><Card className="p-4"><div className="grid gap-3 sm:grid-cols-2">{details.map(([label, value]) => <div key={label}><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold text-slate-900">{value}</p></div>)}</div></Card><Card className="p-4"><h3 className="font-bold text-slate-950">Latest Deliveries</h3><div className="mt-3 space-y-2">{channel.latestDeliveries.map((delivery) => <div key={delivery} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{delivery}</div>)}</div></Card></div></Drawer>;
}

export function DeliveryChannelsPage({ initialChannels, initialZones }: { initialChannels: DeliveryChannel[]; initialZones: DeliveryZone[] }) {
  const [channels, setChannels] = useState(initialChannels);
  const [zones] = useState(initialZones);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [editing, setEditing] = useState<DeliveryChannel | undefined>();
  const [viewing, setViewing] = useState<DeliveryChannel | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const filtered = channels.filter((channel) => channel.name.toLowerCase().includes(query.toLowerCase()) && (typeFilter === "All" || channel.type === typeFilter) && (statusFilter === "All" || channel.status === statusFilter));
  const ordersToday = channels.reduce((sum, channel) => sum + channel.ordersToday, 0);
  const weightedAverage = Math.round(channels.reduce((sum, channel) => sum + channel.averageTime * channel.ordersToday, 0) / Math.max(1, ordersToday));
  const successRate = Math.round(channels.reduce((sum, channel) => sum + channel.successRate * channel.ordersToday, 0) / Math.max(1, ordersToday));
  let usedShare = 0;
  const distribution = channels.map((channel, index) => { const value = index === channels.length - 1 ? 100 - usedShare : Math.round((channel.ordersToday / Math.max(1, ordersToday)) * 100); usedShare += value; return { name: channel.name.replace("El Khabiry ", ""), value }; });
  const filtersActive = Boolean(query || typeFilter !== "All" || statusFilter !== "All");
  const saveChannel = (channel: DeliveryChannel) => { setChannels((previous) => previous.some((item) => item.id === channel.id) ? previous.map((item) => item.id === channel.id ? channel : item) : [...previous, channel]); setFormOpen(false); setEditing(undefined); setNotice("Delivery channel saved."); };
  const deleteChannel = (channel: DeliveryChannel) => { if (channel.activeDeliveries > 0) return setNotice("This delivery channel has active orders and cannot be deleted until the orders are completed or reassigned."); setChannels((previous) => previous.filter((item) => item.id !== channel.id)); setNotice("Delivery channel deleted."); };
  return <div className="mx-auto max-w-[1680px] space-y-5"><Hero title="Delivery Channels" subtitle="Manage the resources and partners used to deliver pharmacy orders." action={<Button variant="primary" onClick={() => { setEditing(undefined); setFormOpen(true); }}><Plus className="h-4 w-4" />Add Delivery Channel</Button>} />{notice ? <div className="rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800">{notice}</div> : null}<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Kpi label="Active Channels" value={String(channels.filter((channel) => channel.status === "Active").length)} detail="Available for new orders" /><Kpi label="Orders Today" value={String(ordersToday)} detail="Handled by all channels" /><Kpi label="Average Delivery Time" value={`${weightedAverage} min`} detail="Weighted by today's orders" /><Kpi label="Overall Success Rate" value={`${successRate}%`} detail="Completed without failed attempts" /></section><Card className="p-4"><div className="grid gap-3 lg:grid-cols-[1fr_220px_180px_auto]"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className={`${inputClass} w-full pl-9`} placeholder="Search by channel name" value={query} onChange={(event) => setQuery(event.target.value)} /></div><select className={inputClass} value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option>All</option><option>In-House</option><option>External Partner</option><option>Express</option></select><select className={inputClass} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All</option><option>Active</option><option>Inactive</option></select>{filtersActive ? <Button onClick={() => { setQuery(""); setTypeFilter("All"); setStatusFilter("All"); }}>Clear Filters</Button> : null}</div></Card><Card className="overflow-hidden"><div className="overflow-x-auto scrollbar-soft"><table className="w-full min-w-[1080px] text-sm"><thead className="bg-brand-50 text-brand-900"><tr>{["Channel", "Type", "Orders Today", "Average Time", "Success Rate", "Status", "Actions"].map((header) => <th key={header} className={cn("h-12 px-4 text-center align-middle text-xs font-bold uppercase tracking-wide", header === "Channel" && "text-left")}>{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 bg-white">{filtered.map((channel) => <tr key={channel.id} className="transition hover:bg-brand-50/40"><td className="px-4 py-4 text-left font-bold text-slate-900">{channel.name}</td><td className="px-4 py-4 text-center font-medium text-slate-700">{channel.type}</td><td className="px-4 py-4 text-center font-medium text-slate-700">{channel.ordersToday}</td><td className="px-4 py-4 text-center font-medium text-slate-700">{channel.averageTime} min</td><td className="px-4 py-4 text-center font-medium text-slate-700">{channel.successRate}%</td><td className="px-4 py-4 text-center"><Badge value={channel.status} /></td><td className="px-4 py-4"><div className="flex items-center justify-center gap-1.5"><Button size="icon" variant="ghost" title="View Details" aria-label="View Details" onClick={() => setViewing(channel)}><Eye className="h-4 w-4" /></Button><Button size="icon" variant="ghost" title="Edit" aria-label="Edit" onClick={() => { setEditing(channel); setFormOpen(true); }}><Pencil className="h-4 w-4" /></Button><ActionMenu status={channel.status} onToggle={() => setChannels((previous) => previous.map((item) => item.id === channel.id ? { ...item, status: item.status === "Active" ? "Inactive" : "Active", lastUpdated: "2026-07-26" } : item))} onDelete={() => deleteChannel(channel)} /></div></td></tr>)}</tbody></table></div></Card><DonutPanel data={distribution} title="Channel Distribution" valueFormatter={(value) => `${value}%`} />{viewing ? <ChannelDetails channel={viewing} zones={zones} onClose={() => setViewing(null)} /> : null}{formOpen ? <ChannelForm channel={editing} zones={zones} onCancel={() => { setFormOpen(false); setEditing(undefined); }} onSave={saveChannel} /> : null}</div>;
}

function CoveragePreview({ zone, channels }: { zone: DeliveryZone; channels: DeliveryChannel[] }) {
  const points = zone.mapPoints ?? [];
  return <div className="relative h-64 overflow-hidden rounded-lg border border-brand-100 bg-slate-50"><RealMapSurface points={points} readonly heightClass="h-64" />{!points.length ? <div className={cn("pointer-events-none absolute grid place-items-center border-2 border-brand-400 bg-brand-100/70 text-center text-xs font-bold text-brand-900", zone.coverageType === "Radius" ? "left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full" : "left-12 top-10 h-32 w-48 rounded-lg")}>{zone.name}</div> : null}<div className="pointer-events-none absolute bottom-4 left-4 right-4 rounded-lg bg-white/95 p-3 text-xs text-slate-600 shadow-sm"><p className="font-bold text-slate-900">{zone.coverageDetails}</p><p className="mt-1">Assigned channels: {zone.assignedChannels.map((id) => channelName(id, channels)).join(", ")}</p></div></div>;
}

function ZoneForm({ zone, channels, onCancel, onSave }: { zone?: DeliveryZone; channels: DeliveryChannel[]; onCancel: () => void; onSave: (zone: DeliveryZone) => void }) {
  const initialRadius = zone?.radiusKm ?? Number(zone?.coverageDetails.match(/radius\s+(\d+(?:\.\d+)?)/i)?.[1] ?? 3);
  const [form, setForm] = useState<DeliveryZone>(zone ?? { id: `zone-${Date.now()}`, name: "", coverageType: "Radius", branch: "El Khabiry Main Branch", deliveryFee: 25, minimumOrder: 150, estimatedTime: 25, assignedChannels: channels.slice(0, 1).map((channel) => channel.id), status: "Active", ordersToday: 0, customersCovered: 0, activeOrders: 0, createdDate: "2026-07-26", lastUpdated: "2026-07-26", coverageDetails: "Center: El Khabiry Main Branch, radius 3 KM", radiusKm: 3, mapPoints: [] });
  const [radiusKm, setRadiusKm] = useState(initialRadius);
  const [mapPoints, setMapPoints] = useState<{ lat: number; lng: number }[]>(zone?.mapPoints ?? []);
  const [error, setError] = useState("");
  const toggleChannel = (channelId: string) => setForm((previous) => ({ ...previous, assignedChannels: previous.assignedChannels.includes(channelId) ? previous.assignedChannels.filter((id) => id !== channelId) : [...previous.assignedChannels, channelId] }));
  const radiusDetails = `Center: ${form.branch}, radius ${radiusKm || 0} KM`;
  const mapDetails = mapPoints.length >= 3 ? `Map polygon: ${mapPoints.length} points selected` : "";
  const coverageDetails = form.coverageType === "Radius" ? radiusDetails : mapDetails || form.coverageDetails;
  const submit = () => {
    if (!form.name.trim()) return setError("Zone name is required.");
    if (form.coverageType === "Radius" && (!Number.isFinite(radiusKm) || radiusKm <= 0)) return setError("Radius must be greater than 0 KM.");
    if (form.coverageType !== "Radius" && !coverageDetails.trim()) return setError("Coverage details or map points are required.");
    onSave({ ...form, name: form.name.trim(), coverageDetails, radiusKm: form.coverageType === "Radius" ? radiusKm : undefined, mapPoints: mapPoints.length >= 3 ? mapPoints : undefined, lastUpdated: "2026-07-26" });
  };
  return <Drawer title={zone ? "Edit Delivery Zone" : "Add Delivery Zone"} onClose={onCancel} footer={<div className="flex justify-end gap-2"><Button onClick={onCancel}>Cancel</Button><Button variant="primary" onClick={submit}>Save Zone</Button></div>}><div className="space-y-4">{error ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}<Field label="Zone Name"><input className={inputClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Tanta Center" /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Coverage Type"><select className={inputClass} value={form.coverageType} onChange={(event) => setForm({ ...form, coverageType: event.target.value as CoverageType })}><option>Radius</option><option>District</option><option>Postal Area</option><option>Custom Boundary</option></select></Field><Field label="Branch"><input className={inputClass} value={form.branch} onChange={(event) => setForm({ ...form, branch: event.target.value })} /></Field><Field label="Delivery Fee"><input className={inputClass} type="number" min={0} value={form.deliveryFee} onChange={(event) => setForm({ ...form, deliveryFee: Number(event.target.value) })} /></Field><Field label="Minimum Order Value"><input className={inputClass} type="number" min={0} value={form.minimumOrder} onChange={(event) => setForm({ ...form, minimumOrder: Number(event.target.value) })} /></Field><Field label="Estimated Delivery Time"><input className={inputClass} type="number" min={1} value={form.estimatedTime} onChange={(event) => setForm({ ...form, estimatedTime: Number(event.target.value) })} /></Field><Field label="Status"><select className={inputClass} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as DeliveryStatus })}><option>Active</option><option>Inactive</option></select></Field></div>{form.coverageType === "Radius" ? <Field label="Radius (KM)"><input className={inputClass} type="number" min={0.5} step={0.5} value={radiusKm} onChange={(event) => setRadiusKm(Number(event.target.value))} /></Field> : <Field label={form.coverageType === "District" ? "District / Area Name" : form.coverageType === "Postal Area" ? "Postal Code or Postal Area" : "Boundary Coordinates or Map Polygon"}><textarea className="min-h-24 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" value={form.coverageDetails} onChange={(event) => setForm({ ...form, coverageDetails: event.target.value })} /></Field>}<MapPointSelector points={mapPoints} onChange={setMapPoints} /><div><p className="text-sm font-semibold text-slate-700">Assigned Delivery Channels</p><div className="mt-2 grid gap-2">{channels.map((channel) => <label key={channel.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"><input type="checkbox" checked={form.assignedChannels.includes(channel.id)} onChange={() => toggleChannel(channel.id)} />{channel.name}</label>)}</div></div></div></Drawer>;
}

function MapPointSelector({ points, onChange }: { points: { lat: number; lng: number }[]; onChange: (points: { lat: number; lng: number }[]) => void }) {
  return <div className="rounded-lg border border-brand-100 bg-brand-50/40 p-3"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold text-slate-800">Optional Map Points</p><p className="mt-1 text-xs text-slate-500">Zoom or drag the real map, then click at least 3 points to draw a custom zone boundary.</p></div>{points.length ? <Button size="sm" onClick={() => onChange([])}>Clear Points</Button> : null}</div><RealMapSurface points={points} onAddPoint={(point) => onChange([...points, point])} /></div>;
}

function RealMapSurface({ points, onAddPoint, readonly = false, heightClass = "h-80" }: { points: { lat: number; lng: number }[]; onAddPoint?: (point: { lat: number; lng: number }) => void; readonly?: boolean; heightClass?: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; lat: number; lng: number } | null>(null);
  const [zoom, setZoom] = useState(points[0] ? 13 : 12);
  const [center, setCenter] = useState(points[0] ?? defaultMapCenter);
  const [size, setSize] = useState({ width: 640, height: 320 });

  useEffect(() => {
    const element = mapRef.current;
    if (!element) return;
    const updateSize = () => setSize({ width: element.clientWidth || 640, height: element.clientHeight || 320 });
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const centerPixel = projectMapPoint(center, zoom);
  const topLeft = { x: centerPixel.x - size.width / 2, y: centerPixel.y - size.height / 2 };
  const scale = 2 ** zoom;
  const minTileX = Math.floor(topLeft.x / tileSize);
  const maxTileX = Math.floor((topLeft.x + size.width) / tileSize);
  const minTileY = Math.floor(topLeft.y / tileSize);
  const maxTileY = Math.floor((topLeft.y + size.height) / tileSize);
  const tiles: { x: number; y: number; wrappedX: number; left: number; top: number }[] = [];
  for (let x = minTileX; x <= maxTileX; x += 1) {
    for (let y = minTileY; y <= maxTileY; y += 1) {
      if (y < 0 || y >= scale) continue;
      tiles.push({ x, y, wrappedX: ((x % scale) + scale) % scale, left: x * tileSize - topLeft.x, top: y * tileSize - topLeft.y });
    }
  }
  const screenPoints = points.map((point) => {
    const projected = projectMapPoint(point, zoom);
    return { ...point, x: projected.x - topLeft.x, y: projected.y - topLeft.y };
  });

  const zoomBy = (delta: number) => setZoom((value) => Math.max(2, Math.min(18, value + delta)));
  const addPoint = (event: MouseEvent<HTMLDivElement>) => {
    if (readonly || !onAddPoint || dragRef.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const worldX = topLeft.x + event.clientX - rect.left;
    const worldY = topLeft.y + event.clientY - rect.top;
    onAddPoint({ lat: worldYToLat(worldY, zoom), lng: worldXToLng(worldX, zoom) });
  };
  const startDrag = (event: MouseEvent<HTMLDivElement>) => {
    if (readonly) return;
    dragRef.current = { x: event.clientX, y: event.clientY, lat: center.lat, lng: center.lng };
  };
  const drag = (event: MouseEvent<HTMLDivElement>) => {
    const start = dragRef.current;
    if (!start) return;
    const startPixel = projectMapPoint({ lat: start.lat, lng: start.lng }, zoom);
    setCenter({ lat: worldYToLat(startPixel.y - (event.clientY - start.y), zoom), lng: worldXToLng(startPixel.x - (event.clientX - start.x), zoom) });
  };

  return <div ref={mapRef} className={cn("relative mt-3 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-200 shadow-inner", heightClass)} onClick={addPoint} onMouseDown={startDrag} onMouseMove={drag} onMouseLeave={() => { dragRef.current = null; }} onMouseUp={() => { window.setTimeout(() => { dragRef.current = null; }, 0); }}>{tiles.map((tile) => <img key={`${tile.x}-${tile.y}-${zoom}`} className="absolute select-none" alt="" draggable={false} src={`https://tile.openstreetmap.org/${zoom}/${tile.wrappedX}/${tile.y}.png`} style={{ left: tile.left, top: tile.top, width: tileSize, height: tileSize }} />)}<svg className="pointer-events-none absolute inset-0 z-10 h-full w-full">{screenPoints.length >= 3 ? <polygon points={screenPoints.map((point) => `${point.x},${point.y}`).join(" ")} className="fill-brand-100/60 stroke-brand-500" strokeWidth="3" /> : null}</svg>{screenPoints.map((point, index) => <span key={`${point.lat}-${point.lng}-${index}`} className="pointer-events-none absolute z-20 grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white shadow-soft ring-2 ring-white" style={{ left: point.x, top: point.y }}>{index + 1}</span>)}<div className="absolute left-3 top-3 z-20 flex h-10 w-[min(270px,calc(100%-6rem))] items-center gap-2 rounded-md bg-white px-3 text-sm text-slate-500 shadow-sm"><Search className="h-4 w-4 shrink-0" /><span>Search map</span></div><div className="absolute right-3 top-3 z-20 overflow-hidden rounded-md bg-white text-slate-700 shadow-sm"><button type="button" className="grid h-9 w-9 place-items-center border-b border-slate-200 text-2xl font-bold" onClick={(event) => { event.stopPropagation(); zoomBy(1); }}>+</button><button type="button" className="grid h-9 w-9 place-items-center border-b border-slate-200 text-2xl font-bold" onClick={(event) => { event.stopPropagation(); zoomBy(-1); }}>-</button><span className="grid h-9 w-9 place-items-center text-xs font-bold">{zoom}</span></div><button type="button" className="absolute right-3 top-[122px] z-20 grid h-9 w-9 place-items-center rounded-md bg-white text-lg font-bold text-slate-700 shadow-sm" onClick={(event) => { event.stopPropagation(); setCenter(defaultMapCenter); setZoom(12); }}>⛶</button><span className="absolute bottom-3 left-3 z-20 rounded-md bg-white/95 px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm">{points.length ? `${points.length} point${points.length === 1 ? "" : "s"} selected` : readonly ? "No custom boundary points" : "Click on the map to add points"}</span><span className="absolute bottom-3 right-3 z-20 rounded bg-white/85 px-2 py-1 text-[10px] font-semibold text-brand-700">© OpenStreetMap contributors</span></div>;
}

function ZoneDetails({ zone, channels, onClose }: { zone: DeliveryZone; channels: DeliveryChannel[]; onClose: () => void }) {
  const details = [["Coverage Type", zone.coverageType], ["Branch", zone.branch], ["Coverage Details", zone.coverageDetails], ["Delivery Fee", `${zone.deliveryFee} EGP`], ["Minimum Order", `${zone.minimumOrder} EGP`], ["Estimated Delivery Time", `${zone.estimatedTime} min`], ["Assigned Channels", zone.assignedChannels.map((id) => channelName(id, channels)).join(", ")], ["Orders Today", String(zone.ordersToday)], ["Customers Covered", formatNumber(zone.customersCovered)], ["Status", zone.status], ["Created Date", zone.createdDate], ["Last Updated", zone.lastUpdated]];
  return <Drawer title={zone.name} onClose={onClose}><div className="space-y-5"><CoveragePreview zone={zone} channels={channels} /><Card className="p-4"><div className="grid gap-3 sm:grid-cols-2">{details.map(([label, value]) => <div key={label}><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold text-slate-900">{value}</p></div>)}</div></Card></div></Drawer>;
}

export function DeliveryZonesPage({ initialZones, initialChannels }: { initialZones: DeliveryZone[]; initialChannels: DeliveryChannel[] }) {
  const [zones, setZones] = useState(initialZones);
  const [channels] = useState(initialChannels);
  const [query, setQuery] = useState("");
  const [coverageFilter, setCoverageFilter] = useState("All");
  const [channelFilter, setChannelFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [editing, setEditing] = useState<DeliveryZone | undefined>();
  const [viewing, setViewing] = useState<DeliveryZone | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const filtered = zones.filter((zone) => zone.name.toLowerCase().includes(query.toLowerCase()) && (coverageFilter === "All" || zone.coverageType === coverageFilter) && (channelFilter === "All" || zone.assignedChannels.includes(channelFilter)) && (statusFilter === "All" || zone.status === statusFilter));
  const ordersToday = zones.reduce((sum, zone) => sum + zone.ordersToday, 0);
  const averageFee = Math.round(zones.reduce((sum, zone) => sum + zone.deliveryFee, 0) / Math.max(1, zones.length));
  const filtersActive = Boolean(query || coverageFilter !== "All" || channelFilter !== "All" || statusFilter !== "All");
  const saveZone = (zone: DeliveryZone) => { setZones((previous) => previous.some((item) => item.id === zone.id) ? previous.map((item) => item.id === zone.id ? zone : item) : [...previous, zone]); setFormOpen(false); setEditing(undefined); setNotice("Delivery zone saved. New orders will use the updated rule."); };
  const deleteZone = (zone: DeliveryZone) => { if (zone.activeOrders > 0) return setNotice("This zone has active delivery orders and cannot be deleted. Deactivate it or reassign the orders first."); if (!window.confirm(`Delete ${zone.name}?`)) return; setZones((previous) => previous.filter((item) => item.id !== zone.id)); setNotice("Delivery zone deleted."); };
  return <div className="mx-auto max-w-[1680px] space-y-5"><Hero title="Delivery Zones" subtitle="Manage the geographic areas covered by El Khabiry Pharmacy delivery services." action={<Button variant="primary" onClick={() => { setEditing(undefined); setFormOpen(true); }}><Plus className="h-4 w-4" />Add Delivery Zone</Button>} />{notice ? <div className="rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800">{notice}</div> : null}<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Kpi label="Active Zones" value={String(zones.filter((zone) => zone.status === "Active").length)} detail="Available for new delivery orders" /><Kpi label="Orders Today" value={String(ordersToday)} detail="Across managed delivery zones" /><Kpi label="Customers Covered" value={formatNumber(zones.reduce((sum, zone) => sum + zone.customersCovered, 0))} detail="Estimated active service reach" /><Kpi label="Average Delivery Fee" value={`${averageFee} EGP`} detail="Across active zone rules" /></section><Card className="p-4"><div className="grid gap-3 xl:grid-cols-[1fr_190px_240px_180px_auto]"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className={`${inputClass} w-full pl-9`} placeholder="Search by zone name" value={query} onChange={(event) => setQuery(event.target.value)} /></div><select className={inputClass} value={coverageFilter} onChange={(event) => setCoverageFilter(event.target.value)}><option>All</option><option>Radius</option><option>District</option><option>Postal Area</option><option>Custom Boundary</option></select><select className={inputClass} value={channelFilter} onChange={(event) => setChannelFilter(event.target.value)}><option value="All">All Channels</option>{channels.map((channel) => <option key={channel.id} value={channel.id}>{channel.name}</option>)}</select><select className={inputClass} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All</option><option>Active</option><option>Inactive</option></select>{filtersActive ? <Button onClick={() => { setQuery(""); setCoverageFilter("All"); setChannelFilter("All"); setStatusFilter("All"); }}>Clear Filters</Button> : null}</div></Card><Card className="overflow-hidden"><div className="overflow-x-auto scrollbar-soft"><table className="w-full min-w-[1200px] text-sm"><thead className="bg-brand-50 text-brand-900"><tr>{["Zone", "Coverage Type", "Orders Today", "Average Time", "Delivery Fee", "Assigned Channels", "Status", "Actions"].map((header) => <th key={header} className={cn("h-12 px-4 text-center align-middle text-xs font-bold uppercase tracking-wide", header === "Zone" && "text-left")}>{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 bg-white">{filtered.map((zone) => <tr key={zone.id} className="transition hover:bg-brand-50/40"><td className="px-4 py-4 text-left font-bold text-slate-900">{zone.name}</td><td className="px-4 py-4 text-center font-medium text-slate-700">{zone.coverageType}</td><td className="px-4 py-4 text-center font-medium text-slate-700">{zone.ordersToday}</td><td className="px-4 py-4 text-center font-medium text-slate-700">{zone.estimatedTime} min</td><td className="px-4 py-4 text-center font-medium text-slate-700">{zone.deliveryFee} EGP</td><td className="px-4 py-4 text-center font-medium text-slate-700">{zone.assignedChannels.map((id) => channelName(id, channels)).join(", ")}</td><td className="px-4 py-4 text-center"><Badge value={zone.status} /></td><td className="px-4 py-4"><div className="flex items-center justify-center gap-1.5"><Button size="icon" variant="ghost" title="View Details" aria-label="View Details" onClick={() => setViewing(zone)}><Eye className="h-4 w-4" /></Button><Button size="icon" variant="ghost" title="Edit" aria-label="Edit" onClick={() => { setEditing(zone); setFormOpen(true); }}><Pencil className="h-4 w-4" /></Button><ActionMenu status={zone.status} onToggle={() => setZones((previous) => previous.map((item) => item.id === zone.id ? { ...item, status: item.status === "Active" ? "Inactive" : "Active", lastUpdated: "2026-07-26" } : item))} onDelete={() => deleteZone(zone)} /></div></td></tr>)}</tbody></table></div></Card><Card className="p-5"><h2 className="text-base font-bold text-slate-950">Coverage Preview</h2><div className="mt-4 grid gap-4 lg:grid-cols-2">{filtered.slice(0, 2).map((zone) => <CoveragePreview key={zone.id} zone={zone} channels={channels} />)}</div></Card>{viewing ? <ZoneDetails zone={viewing} channels={channels} onClose={() => setViewing(null)} /> : null}{formOpen ? <ZoneForm zone={editing} channels={channels} onCancel={() => { setFormOpen(false); setEditing(undefined); }} onSave={saveZone} /> : null}</div>;
}

export function DeliveryPricingPage({ initialZones }: { initialZones: DeliveryZone[] }) {
  const rules = [["Zone-specific delivery fee", "20-30 EGP", "Used first when the address matches an active delivery zone"], ["Distance-based pricing rule", "0-3 KM: 20 EGP / 3-5 KM: 30 EGP / 5-10 KM: 40 EGP", "Fallback when no zone fee is configured"], ["Default delivery fee", "30 EGP", "Fallback for eligible local delivery orders"]];
  return <div className="mx-auto max-w-[1680px] space-y-5"><Hero title="Delivery Pricing" subtitle="Manage delivery fee priority using zone fees, distance rules, and the default fee." /><section className="grid gap-4 md:grid-cols-3">{rules.map(([name, fee, detail]) => <Card key={name} className="p-5"><p className="text-sm font-bold text-slate-500">{name}</p><p className="mt-3 text-2xl font-bold text-brand-700">{fee}</p><p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p></Card>)}</section><Card className="overflow-hidden"><div className="overflow-x-auto scrollbar-soft"><table className="w-full min-w-[760px] text-sm"><thead className="bg-brand-50 text-brand-900"><tr>{["Zone", "Applied Fee", "Priority", "Status"].map((header) => <th key={header} className="h-12 px-4 text-center align-middle text-xs font-bold uppercase tracking-wide">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 bg-white">{initialZones.map((zone) => <tr key={zone.id} className="transition hover:bg-brand-50/40"><td className="px-4 py-4 text-center font-bold text-slate-900">{zone.name}</td><td className="px-4 py-4 text-center font-medium text-slate-700">{zone.deliveryFee} EGP</td><td className="px-4 py-4 text-center font-medium text-slate-700">1. Zone-specific delivery fee</td><td className="px-4 py-4 text-center"><Badge value={zone.status} /></td></tr>)}</tbody></table></div></Card></div>;
}

function findZoneForAddress(address: string, zones: DeliveryZone[]) {
  const normalized = address.toLowerCase();
  return zones.find((zone) => zone.status === "Active" && normalized.includes(zone.name.toLowerCase().replace(" district", ""))) ?? null;
}

export function LocalDeliveryOperationsPage({ initialZones, initialChannels, initialOrders, dailyDeliveries }: { initialZones: DeliveryZone[]; initialChannels: DeliveryChannel[]; initialOrders: DeliveryOrder[]; dailyDeliveries: { day: string; value: number }[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [address, setAddress] = useState("El Geish Street, near pharmacy branch");
  const [message, setMessage] = useState("");
  const createOrder = () => {
    const zone = findZoneForAddress(address, initialZones);
    if (!zone) return setMessage("This address is currently outside El Khabiry Pharmacy delivery coverage.");
    const channel = initialChannels.find((item) => item.status === "Active" && zone.assignedChannels.includes(item.id)) ?? null;
    const nextOrder: DeliveryOrder = { id: `EKD-${2404 + orders.length}`, patient: "Demo Patient", address, zoneId: zone.id, channelId: channel?.id ?? null, appliedFee: zone.deliveryFee, estimatedTime: `${zone.estimatedTime} min`, pricingRule: "Zone-specific delivery fee", status: channel ? "Assigned" : "Needs Channel Review" };
    setOrders((previous) => [nextOrder, ...previous]);
    setMessage(`Matched ${zone.name}. Applied ${zone.deliveryFee} EGP and assigned ${channel ? channelName(channel.id, initialChannels) : "no active channel"}.`);
  };
  return <div className="mx-auto max-w-[1680px] space-y-5"><Hero title="Local Delivery" subtitle="Track delivery orders with assigned zones, channels, fees, estimated times, and delivery status." /><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Kpi label="Deliveries Today" value="312" detail="Across active delivery zones" /><Kpi label="Avg Delivery Time" value="26 min" detail="From dispatch to handoff" /><Kpi label="Delivery Revenue" value="7,800 EGP" detail="Zone fees applied today" /><Kpi label="Success Rate" value="97%" detail="Completed without failed attempts" /></section><Card className="p-5"><h2 className="text-base font-bold text-slate-950">Create Delivery Order</h2><div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]"><input className={`${inputClass} w-full`} value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Customer delivery address" /><Button variant="primary" onClick={createOrder}>Check Address</Button></div>{message ? <p className={cn("mt-3 rounded-lg px-3 py-2 text-sm font-semibold", message.startsWith("This address") ? "bg-red-50 text-red-700" : "bg-brand-50 text-brand-800")}>{message}</p> : null}</Card><Card className="overflow-hidden"><div className="overflow-x-auto scrollbar-soft"><table className="w-full min-w-[1100px] text-sm"><thead className="bg-brand-50 text-brand-900"><tr>{["Order", "Customer", "Delivery Zone", "Delivery Channel", "Applied Delivery Fee", "Estimated Delivery Time", "Delivery Status", "Pricing Rule"].map((header) => <th key={header} className="h-12 px-4 text-center align-middle text-xs font-bold uppercase tracking-wide">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 bg-white">{orders.map((order) => <tr key={order.id} className="transition hover:bg-brand-50/40"><td className="px-4 py-4 text-center font-bold text-slate-900">{order.id}</td><td className="px-4 py-4 text-center font-medium text-slate-700">{order.patient}</td><td className="px-4 py-4 text-center font-medium text-slate-700">{order.zoneId ? zoneName(order.zoneId, initialZones) : "Outside coverage"}</td><td className="px-4 py-4 text-center font-medium text-slate-700">{order.channelId ? channelName(order.channelId, initialChannels) : "Unassigned"}</td><td className="px-4 py-4 text-center font-medium text-slate-700">{order.appliedFee ? `${order.appliedFee} EGP` : "-"}</td><td className="px-4 py-4 text-center font-medium text-slate-700">{order.estimatedTime}</td><td className="px-4 py-4 text-center"><Badge value={order.status} /></td><td className="px-4 py-4 text-center font-medium text-slate-700">{order.pricingRule}</td></tr>)}</tbody></table></div></Card><section className="grid gap-4 xl:grid-cols-[1fr_1.2fr]"><Card className="p-5"><h2 className="text-base font-bold text-slate-950">Orders By Delivery Zone</h2><div className="mt-5 space-y-4">{initialZones.map((zone) => <div key={zone.id} className="grid gap-2"><div className="flex items-center justify-between text-sm"><span className="font-semibold text-slate-700">{zone.name}</span><span className="text-slate-500">{zone.ordersToday} orders</span></div><div className="h-3 rounded-full bg-brand-50"><div className="h-3 rounded-full bg-brand-500" style={{ width: `${(zone.ordersToday / 124) * 100}%` }} /></div></div>)}</div></Card><Card className="p-5"><h2 className="text-base font-bold text-slate-950">Daily Deliveries</h2><div className="mt-5 flex h-56 items-end justify-between gap-3">{dailyDeliveries.map((item) => <div key={item.day} className="flex flex-1 flex-col items-center gap-2"><div className="flex w-full items-end rounded-t-lg bg-brand-50" style={{ height: 190 }}><div className="w-full rounded-t-lg bg-brand-500" style={{ height: `${(item.value / Math.max(...dailyDeliveries.map((day) => day.value))) * 100}%` }} /></div><span className="text-xs font-semibold text-slate-500">{item.day}</span></div>)}</div></Card></section></div>;
}
