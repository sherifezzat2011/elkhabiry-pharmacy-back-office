import { Navigate, useParams } from "react-router-dom";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarPanel, DonutPanel } from "@/components/Charts";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { formatNumber } from "@/lib/utils";
import type { ChartDatum } from "@/types";

type Kpi = { label: string; value: string; detail: string };
type Table = { headers: string[]; rows: (string | number | JSX.Element)[][] };
type AnalyticsReport = {
  title: string;
  question: string;
  filters: string[];
  kpis: Kpi[];
  chartTitle: string;
  chartType: "line" | "bar" | "donut";
  chartData: ChartDatum[];
  secondaryTitle?: string;
  secondaryData?: ChartDatum[];
  table?: Table;
};

const acquisitionBreakdown: ChartDatum[] = [
  { name: "Mobile App", value: 420 },
  { name: "Walk-in", value: 310 },
  { name: "Website", value: 188 },
  { name: "WhatsApp", value: 146 },
  { name: "Call Center", value: 92 },
];

const newPatientTrend: ChartDatum[] = [
  { name: "Jan", value: 710, secondary: 650 },
  { name: "Feb", value: 760, secondary: 710 },
  { name: "Mar", value: 840, secondary: 760 },
  { name: "Apr", value: 910, secondary: 820 },
  { name: "May", value: 980, secondary: 900 },
  { name: "Jun", value: 1050, secondary: 960 },
  { name: "Jul", value: 1156, secondary: 1040 },
];

const customerReports: Record<string, AnalyticsReport> = {
  "customer-acquisition": {
    title: "Customer Acquisition",
    question: "Where are new patients coming from?",
    filters: ["Date", "Branch", "Customer Type", "Acquisition Channel"],
    kpis: [
      { label: "New Patients", value: "1,156", detail: "Created in selected period" },
      { label: "New This Month", value: "284", detail: "July patient registrations" },
      { label: "Top Acquisition Channel", value: "Mobile App", detail: "36% of new patients" },
      { label: "Conversion Rate", value: "18.4%", detail: "Visitors or leads to patients" },
    ],
    chartTitle: "New Patient Trend",
    chartType: "line",
    chartData: newPatientTrend,
    secondaryTitle: "Acquisition Breakdown",
    secondaryData: acquisitionBreakdown,
  },
  "repeat-behavior": {
    title: "Repeat Behavior",
    question: "How consistently are patients returning to buy again?",
    filters: ["Date", "Branch", "Customer Type", "Acquisition Channel"],
    kpis: [
      { label: "Returning Patients", value: "3,842", detail: "Patients with more than one order" },
      { label: "Repeat Order Rate", value: "64%", detail: "Returning patients over active patients" },
      { label: "Average Reorder Time", value: "24 Days", detail: "Median interval between orders" },
      { label: "Orders Per Patient", value: "2.7", detail: "Average in selected period" },
    ],
    chartTitle: "Repeat Orders Trend",
    chartType: "line",
    chartData: [
      { name: "Jan", value: 1220, secondary: 1080 },
      { name: "Feb", value: 1310, secondary: 1210 },
      { name: "Mar", value: 1390, secondary: 1300 },
      { name: "Apr", value: 1465, secondary: 1360 },
      { name: "May", value: 1580, secondary: 1450 },
      { name: "Jun", value: 1640, secondary: 1530 },
      { name: "Jul", value: 1735, secondary: 1605 },
    ],
    table: {
      headers: ["Patient", "Orders", "Last Order", "Average Interval"],
      rows: [["Ahmed Mohamed", 9, "2026-07-24", "18 Days"], ["Mona Hassan", 7, "2026-07-23", "21 Days"], ["Sara Ali", 6, "2026-07-21", "26 Days"], ["Omar Khaled", 5, "2026-07-19", "31 Days"]],
    },
  },
  "customer-segmentation": {
    title: "Customer Segmentation",
    question: "Which patient segments make up the active customer base?",
    filters: ["Date", "Branch", "Customer Type", "Acquisition Channel"],
    kpis: [
      { label: "VIP", value: "620", detail: "High-value active patients" },
      { label: "Regular", value: "2,840", detail: "Recurring monthly patients" },
      { label: "Occasional", value: "1,960", detail: "Low-frequency patients" },
      { label: "Inactive", value: "740", detail: "No order in 90 days" },
    ],
    chartTitle: "Patient Distribution",
    chartType: "donut",
    chartData: [{ name: "VIP", value: 620 }, { name: "Regular", value: 2840 }, { name: "Occasional", value: 1960 }, { name: "New", value: 1156 }, { name: "Inactive", value: 740 }],
    table: { headers: ["Segment", "Patients", "Average Spend"], rows: [["VIP", 620, "4,850 EGP"], ["Regular", 2840, "1,420 EGP"], ["Occasional", 1960, "640 EGP"], ["New", 1156, "380 EGP"], ["Inactive", 740, "520 EGP"]] },
  },
  "customer-value": {
    title: "Customer Value",
    question: "How is lifetime patient value distributed?",
    filters: ["Date", "Branch", "Customer Type", "Acquisition Channel"],
    kpis: [
      { label: "High Value", value: "620", detail: "Patients above 4,000 EGP" },
      { label: "Medium Value", value: "2,340", detail: "Patients from 1,000 to 4,000 EGP" },
      { label: "Low Value", value: "3,105", detail: "Patients below 1,000 EGP" },
    ],
    chartTitle: "Lifetime Spend Distribution",
    chartType: "bar",
    chartData: [{ name: "<500", value: 980 }, { name: "500-1k", value: 2125 }, { name: "1k-2k", value: 1420 }, { name: "2k-4k", value: 920 }, { name: "4k-8k", value: 410 }, { name: "8k+", value: 210 }],
  },
  "purchase-frequency": {
    title: "Purchase Frequency",
    question: "How often are patients buying from El Khabiry?",
    filters: ["Date", "Branch", "Customer Type", "Acquisition Channel"],
    kpis: [
      { label: "Average Purchase Interval", value: "27 Days", detail: "Across active patients" },
      { label: "Monthly Purchases", value: "8,420", detail: "Patient purchase events" },
      { label: "Weekly Purchases", value: "1,965", detail: "Current weekly pace" },
      { label: "Most Frequent Buyers", value: "314", detail: "Patients buying weekly" },
    ],
    chartTitle: "Purchase Frequency Trend",
    chartType: "line",
    chartData: [{ name: "Jan", value: 6500 }, { name: "Feb", value: 6900 }, { name: "Mar", value: 7200 }, { name: "Apr", value: 7550 }, { name: "May", value: 7900 }, { name: "Jun", value: 8120 }, { name: "Jul", value: 8420 }],
  },
  "vip-customers": {
    title: "VIP Customers",
    question: "Who are the highest-value patients to protect?",
    filters: ["Date", "Branch", "Customer Type", "Acquisition Channel"],
    kpis: [
      { label: "VIP Patients", value: "620", detail: "Currently tagged VIP" },
      { label: "Active VIPs", value: "548", detail: "Visited in last 60 days" },
      { label: "Average Basket", value: "1,240 EGP", detail: "VIP average basket" },
      { label: "Care Follow-ups", value: "86", detail: "Due for pharmacist call" },
    ],
    chartTitle: "VIP Activity Trend",
    chartType: "line",
    chartData: [{ name: "Jan", value: 480 }, { name: "Feb", value: 505 }, { name: "Mar", value: 520 }, { name: "Apr", value: 536 }, { name: "May", value: 552 }, { name: "Jun", value: 585 }, { name: "Jul", value: 620 }],
    table: { headers: ["Patient", "Lifetime Spend", "Orders", "Last Visit", "Average Basket"], rows: [["Ahmed Mohamed", "38,400 EGP", 28, "2026-07-24", "1,371 EGP"], ["Mona Hassan", "31,850 EGP", 24, "2026-07-22", "1,327 EGP"], ["Yasmin Samir", "28,100 EGP", 22, "2026-07-20", "1,277 EGP"], ["Omar Khaled", "24,600 EGP", 19, "2026-07-18", "1,295 EGP"]] },
  },
  inactivity: {
    title: "Inactivity",
    question: "Which patients need reactivation action?",
    filters: ["Date", "Branch", "Customer Type", "Acquisition Channel"],
    kpis: [
      { label: "Inactive 30 Days", value: "1,120", detail: "No purchase in 30 days" },
      { label: "Inactive 60 Days", value: "820", detail: "No purchase in 60 days" },
      { label: "Inactive 90 Days", value: "740", detail: "No purchase in 90 days" },
      { label: "Recovered Patients", value: "186", detail: "Returned after an offer" },
    ],
    chartTitle: "Inactivity Recovery Trend",
    chartType: "line",
    chartData: [{ name: "Jan", value: 98 }, { name: "Feb", value: 112 }, { name: "Mar", value: 124 }, { name: "Apr", value: 136 }, { name: "May", value: 151 }, { name: "Jun", value: 172 }, { name: "Jul", value: 186 }],
    table: { headers: ["Patient", "Last Purchase", "Days Inactive", "Suggested Action"], rows: [["Heba Mostafa", "2026-04-18", 99, <Button key="1" size="sm">Send Offer</Button>], ["Mahmoud Ali", "2026-05-02", 85, <Button key="2" size="sm">Send Offer</Button>], ["Rania Samy", "2026-05-19", 68, <Button key="3" size="sm">Send Offer</Button>]] },
  },
};

const prescriptionReports: Record<string, AnalyticsReport> = {
  "prescription-trends": {
    title: "Prescription Trends",
    question: "How is prescription demand moving across the pharmacy?",
    filters: ["Date", "Branch", "Doctor", "Prescription Status", "Supplier"],
    kpis: [{ label: "Prescriptions Today", value: "184", detail: "Submitted today" }, { label: "Monthly Prescriptions", value: "4,920", detail: "July prescription volume" }, { label: "Digital RX", value: "62%", detail: "App and uploaded prescriptions" }, { label: "Paper RX", value: "38%", detail: "Branch-entered prescriptions" }],
    chartTitle: "Prescription Trend",
    chartType: "line",
    chartData: [{ name: "Jan", value: 3820 }, { name: "Feb", value: 4010 }, { name: "Mar", value: 4240 }, { name: "Apr", value: 4480 }, { name: "May", value: 4620 }, { name: "Jun", value: 4810 }, { name: "Jul", value: 4920 }],
  },
  "dispensing-performance": {
    title: "Dispensing Performance",
    question: "How quickly are prescriptions being dispensed?",
    filters: ["Date", "Branch", "Doctor", "Prescription Status", "Supplier"],
    kpis: [{ label: "Average Dispensing Time", value: "11.8 Min", detail: "From approval to ready" }, { label: "Completed", value: "3,980", detail: "Fully dispensed" }, { label: "Delayed", value: "312", detail: "Exceeded target time" }, { label: "Pending", value: "184", detail: "Waiting pharmacist action" }],
    chartTitle: "Dispensing Time Trend",
    chartType: "line",
    chartData: [{ name: "Jan", value: 14.8 }, { name: "Feb", value: 13.9 }, { name: "Mar", value: 13.2 }, { name: "Apr", value: 12.6 }, { name: "May", value: 12.1 }, { name: "Jun", value: 11.9 }, { name: "Jul", value: 11.8 }],
  },
  "completion-rate": {
    title: "Completion Rate",
    question: "Are prescriptions completed without rejection or expiry?",
    filters: ["Date", "Branch", "Doctor", "Prescription Status", "Supplier"],
    kpis: [{ label: "Completion Rate", value: "88.4%", detail: "Fully completed prescriptions" }, { label: "Partial Completion", value: "7.8%", detail: "Missing one or more items" }, { label: "Rejected", value: "2.1%", detail: "Rejected by pharmacist" }, { label: "Expired", value: "1.7%", detail: "Not completed before expiry" }],
    chartTitle: "Completion %",
    chartType: "line",
    chartData: [{ name: "Jan", value: 83 }, { name: "Feb", value: 84 }, { name: "Mar", value: 85 }, { name: "Apr", value: 86 }, { name: "May", value: 87 }, { name: "Jun", value: 88 }, { name: "Jul", value: 88.4 }],
  },
  "prescription-status": {
    title: "Prescription Status",
    question: "What is the current prescription work queue?",
    filters: ["Date", "Branch", "Doctor", "Prescription Status", "Supplier"],
    kpis: [{ label: "Pending", value: "184", detail: "Awaiting review" }, { label: "Approved", value: "326", detail: "Ready to dispense" }, { label: "Completed", value: "3,980", detail: "Closed this month" }, { label: "Cancelled", value: "128", detail: "Cancelled by patient or pharmacist" }],
    chartTitle: "Status Distribution",
    chartType: "donut",
    chartData: [{ name: "Pending", value: 184 }, { name: "Approved", value: 326 }, { name: "Completed", value: 3980 }, { name: "Cancelled", value: 128 }],
  },
  "prescription-fulfillment": {
    title: "Prescription Fulfillment",
    question: "What prevents prescriptions from being fully dispensed?",
    filters: ["Date", "Branch", "Doctor", "Prescription Status", "Supplier"],
    kpis: [{ label: "Fully Dispensed", value: "3,980", detail: "All items supplied" }, { label: "Partial", value: "352", detail: "Some items missing" }, { label: "Out of Stock", value: "146", detail: "Blocked by inventory" }, { label: "Transferred", value: "92", detail: "Sent to another branch" }],
    chartTitle: "Fulfillment Trend",
    chartType: "line",
    chartData: [{ name: "Jan", value: 76 }, { name: "Feb", value: 79 }, { name: "Mar", value: 81 }, { name: "Apr", value: 83 }, { name: "May", value: 84 }, { name: "Jun", value: 86 }, { name: "Jul", value: 88 }],
  },
  "doctor-prescription-volume": {
    title: "Doctor Prescription Volume",
    question: "Which doctors are driving prescription workload?",
    filters: ["Date", "Branch", "Doctor", "Prescription Status", "Supplier"],
    kpis: [{ label: "Top Prescribing Doctor", value: "Dr. Mona Hassan", detail: "428 RX this month" }, { label: "Average RX per Doctor", value: "123", detail: "Monthly average" }, { label: "Monthly RX", value: "4,920", detail: "All doctor-linked RX" }, { label: "Growth", value: "+9.4%", detail: "Compared with June" }],
    chartTitle: "Doctor RX Distribution",
    chartType: "bar",
    chartData: [{ name: "Mona", value: 428 }, { name: "Ahmed", value: 390 }, { name: "Karim", value: 356 }, { name: "Laila", value: 312 }, { name: "Omar", value: 284 }],
    table: { headers: ["Doctor", "RX Count", "Patients", "Completion %"], rows: [["Dr. Mona Hassan", 428, 318, "91%"], ["Dr. Ahmed Fahmy", 390, 286, "89%"], ["Dr. Karim Saleh", 356, 261, "87%"], ["Dr. Laila Nabil", 312, 244, "92%"]] },
  },
};

const doctorReports: Record<string, AnalyticsReport> = {
  "doctor-performance": {
    title: "Doctor Performance",
    question: "Which doctors are generating completed patient care activity?",
    filters: ["Date", "Branch", "Doctor", "Specialty"],
    kpis: [{ label: "Active Doctors", value: "40", detail: "Doctors with RX this month" }, { label: "Average RX", value: "123", detail: "Per active doctor" }, { label: "Patients Served", value: "3,280", detail: "Unique patients" }, { label: "Completion %", value: "88.4%", detail: "RX completed" }],
    chartTitle: "Top Doctors",
    chartType: "bar",
    chartData: [{ name: "Mona", value: 428 }, { name: "Ahmed", value: 390 }, { name: "Karim", value: 356 }, { name: "Laila", value: 312 }, { name: "Omar", value: 284 }],
  },
  "prescription-volume": {
    title: "Prescription Volume",
    question: "How is doctor-linked prescription volume changing?",
    filters: ["Date", "Branch", "Doctor", "Specialty"],
    kpis: [{ label: "Monthly RX", value: "4,920", detail: "Doctor-linked prescriptions" }, { label: "Daily RX", value: "184", detail: "Today" }, { label: "Growth", value: "+9.4%", detail: "Month over month" }, { label: "Average Per Doctor", value: "123", detail: "Monthly doctor average" }],
    chartTitle: "Prescription Volume Trend",
    chartType: "line",
    chartData: [{ name: "Jan", value: 3820 }, { name: "Feb", value: 4010 }, { name: "Mar", value: 4240 }, { name: "Apr", value: 4480 }, { name: "May", value: 4620 }, { name: "Jun", value: 4810 }, { name: "Jul", value: 4920 }],
  },
  "revenue-contribution": {
    title: "Revenue Contribution",
    question: "Which doctors contribute the most prescription sales?",
    filters: ["Date", "Branch", "Doctor", "Specialty"],
    kpis: [{ label: "Revenue by Doctors", value: "2.84M EGP", detail: "Doctor-linked prescription revenue" }, { label: "Average Basket", value: "577 EGP", detail: "Average RX basket" }, { label: "Top Revenue Doctor", value: "Dr. Mona Hassan", detail: "312K EGP" }, { label: "Growth", value: "+7.8%", detail: "Month over month" }],
    chartTitle: "Top Doctors by Revenue",
    chartType: "bar",
    chartData: [{ name: "Mona", value: 312000 }, { name: "Ahmed", value: 286000 }, { name: "Karim", value: 241000 }, { name: "Laila", value: 218000 }, { name: "Omar", value: 196000 }],
  },
  "specialty-analysis": {
    title: "Specialty Analysis",
    question: "Which medical specialties shape prescription demand?",
    filters: ["Date", "Branch", "Doctor", "Specialty"],
    kpis: [{ label: "Top Specialty", value: "Diabetes", detail: "Highest RX count" }, { label: "Doctors", value: "40", detail: "Active doctor network" }, { label: "RX Count", value: "4,920", detail: "Monthly prescriptions" }, { label: "Patients", value: "3,280", detail: "Patients served" }],
    chartTitle: "Specialty Distribution",
    chartType: "donut",
    chartData: [{ name: "Diabetes", value: 980 }, { name: "Cardiology", value: 820 }, { name: "Pediatrics", value: 740 }, { name: "Dermatology", value: 610 }, { name: "ENT", value: 520 }],
  },
  "product-preference": {
    title: "Product Preference",
    question: "Which products and categories do doctors prescribe most?",
    filters: ["Date", "Branch", "Doctor", "Specialty"],
    kpis: [{ label: "Most Prescribed Product", value: "Glucophage", detail: "Diabetes category" }, { label: "Top Category", value: "Diabetes", detail: "24% of doctor RX" }, { label: "Brand Preference", value: "Eva Pharma", detail: "Most selected brand" }, { label: "Monthly Change", value: "+6.2%", detail: "Top product growth" }],
    chartTitle: "Top Prescribed Products",
    chartType: "bar",
    chartData: [{ name: "Glucophage", value: 620 }, { name: "Concor", value: 540 }, { name: "Augmentin", value: 488 }, { name: "Nexium", value: 430 }, { name: "Crestor", value: 390 }],
  },
  "doctor-ranking": {
    title: "Doctor Ranking",
    question: "Which doctors rank highest by prescriptions, revenue, patients, and rating?",
    filters: ["Date", "Branch", "Doctor", "Specialty"],
    kpis: [{ label: "Ranked Doctors", value: "40", detail: "Doctors in scorecard" }, { label: "Top Doctor", value: "Dr. Mona Hassan", detail: "Best combined score" }, { label: "Average Rating", value: "4.7", detail: "Patient service feedback" }, { label: "Completion %", value: "88.4%", detail: "Network average" }],
    chartTitle: "Doctor Ranking Score",
    chartType: "bar",
    chartData: [{ name: "Mona", value: 98 }, { name: "Ahmed", value: 95 }, { name: "Karim", value: 92 }, { name: "Laila", value: 91 }, { name: "Omar", value: 88 }],
    table: { headers: ["Doctor", "Specialty", "RX Count", "Revenue", "Patients", "Average Rating"], rows: [["Dr. Mona Hassan", "Diabetes", 428, "312K EGP", 318, "4.9"], ["Dr. Ahmed Fahmy", "Cardiology", 390, "286K EGP", 286, "4.8"], ["Dr. Karim Saleh", "Pediatrics", 356, "241K EGP", 261, "4.7"], ["Dr. Laila Nabil", "Dermatology", 312, "218K EGP", 244, "4.7"]] },
  },
};

function FocusedAnalyticsPage({ moduleLabel, reports }: { moduleLabel: string; reports: Record<string, AnalyticsReport> }) {
  const { reportId = "" } = useParams();
  const report = reports[reportId];
  if (!report) return <Navigate to="/reports/sales-overview" replace />;
  return <ReportLayout moduleLabel={moduleLabel} report={report} />;
}

export function CustomerAnalyticsPage() {
  return <FocusedAnalyticsPage moduleLabel="Customers" reports={customerReports} />;
}

export function PrescriptionAnalyticsPage() {
  return <FocusedAnalyticsPage moduleLabel="Prescriptions" reports={prescriptionReports} />;
}

export function DoctorInsightsAnalyticsPage() {
  return <FocusedAnalyticsPage moduleLabel="Doctor Insights" reports={doctorReports} />;
}

function ReportLayout({ moduleLabel, report }: { moduleLabel: string; report: AnalyticsReport }) {
  return (
    <div className="mx-auto max-w-[1680px] space-y-5">
      <section className="rounded-xl border border-brand-100 bg-white p-5 shadow-soft">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">{moduleLabel}</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">{report.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{report.question}</p>
      </section>
      <FilterStrip filters={report.filters} />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{report.kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}</section>
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <PrimaryChart report={report} />
        {report.secondaryData ? <BarPanel data={report.secondaryData} title={report.secondaryTitle ?? "Breakdown"} valueFormatter={formatNumber} axisFormatter={formatNumber} /> : report.table ? <TableCard table={report.table} /> : <ExecutiveNote title="Business Question" text={report.question} />}
      </section>
      {report.table && report.secondaryData ? <TableCard table={report.table} /> : null}
    </div>
  );
}

function KpiCard({ label, value, detail }: Kpi) {
  return <Card className="border-t-4 border-t-brand-500 p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-3 text-3xl font-bold text-slate-950">{value}</p><p className="mt-2 text-sm text-slate-500">{detail}</p></Card>;
}

function FilterStrip({ filters }: { filters: string[] }) {
  const options: Record<string, string[]> = {
    Branch: ["All Branches", "Nasr City", "Heliopolis", "Tanta", "Alexandria"],
    "Customer Type": ["All Types", "VIP", "Regular", "Occasional", "New", "Inactive"],
    "Acquisition Channel": ["All Channels", "Mobile App", "Walk-in", "Website", "WhatsApp", "Call Center"],
    Doctor: ["All Doctors", "Dr. Mona Hassan", "Dr. Ahmed Fahmy", "Dr. Karim Saleh"],
    "Prescription Status": ["All Statuses", "Pending", "Approved", "Completed", "Cancelled"],
    Supplier: ["All Suppliers", "Eva Pharma", "Amoun", "Sanofi", "Pharco"],
    Specialty: ["All Specialties", "Diabetes", "Cardiology", "Pediatrics", "Dermatology"],
  };
  return (
    <Card className="p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {filters.includes("Date") ? <label className="space-y-1.5"><span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date</span><input className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" type="month" defaultValue="2026-07" /></label> : null}
        {filters.filter((filter) => filter !== "Date").map((filter) => <label key={filter} className="space-y-1.5"><span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{filter}</span><select className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100">{(options[filter] ?? ["All"]).map((option) => <option key={option}>{option}</option>)}</select></label>)}
      </div>
    </Card>
  );
}

function PrimaryChart({ report }: { report: AnalyticsReport }) {
  if (report.chartType === "donut") return <DonutPanel data={report.chartData} title={report.chartTitle} valueFormatter={formatNumber} />;
  if (report.chartType === "bar") return <BarPanel data={report.chartData} title={report.chartTitle} valueFormatter={formatNumber} axisFormatter={formatNumber} />;
  return <LinePanel data={report.chartData} title={report.chartTitle} />;
}

function LinePanel({ data, title }: { data: ChartDatum[]; title: string }) {
  return (
    <Card>
      <CardHeader><h2 className="text-base font-semibold text-slate-950">{title}</h2></CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(value: number) => formatNumber(value)} />
              <Tooltip content={<SimpleTooltip />} />
              <Line type="monotone" dataKey="secondary" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              <Line type="monotone" dataKey="value" stroke="#10B7B4" strokeWidth={3} dot={{ r: 3, fill: "#10B7B4" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function SimpleTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-soft"><div className="font-semibold text-slate-900">{label}</div><div className="text-slate-600">{formatNumber(payload[0].value)}</div></div>;
}

function TableCard({ table }: { table: Table }) {
  return <Card className="overflow-hidden"><div className="overflow-x-auto scrollbar-soft"><table className="w-full min-w-[720px] text-sm"><thead className="bg-brand-50 text-brand-900"><tr>{table.headers.map((header) => <th key={header} className="h-12 px-4 text-center text-xs font-bold uppercase tracking-wide first:text-left">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 bg-white">{table.rows.map((row, rowIndex) => <tr key={rowIndex} className="hover:bg-brand-50/40">{row.map((cell, index) => <td key={index} className="px-4 py-3 text-center font-semibold text-slate-700 first:text-left first:text-slate-950">{cell}</td>)}</tr>)}</tbody></table></div></Card>;
}

function ExecutiveNote({ title, text }: { title: string; text: string }) {
  return <Card className="p-5"><h2 className="text-base font-semibold text-slate-950">{title}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{text}</p><div className="mt-5 rounded-lg bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800">This page uses only KPIs and visualizations tied to its pharmacy question.</div></Card>;
}
