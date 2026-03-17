import { useQuery } from "@tanstack/react-query";
import { getFinancialReport, getEODReport } from "../api/dashboard";
import { useState } from "react";
import { FinancialPeriod } from "../types";
import { paymentMethodLabels } from "../components/modals/PaymentMethodModal";
import { printEODReport } from "../utils/receipt";
import {
  Wallet,
  TableProperties,
  UtensilsCrossed,
  Receipt,
  TrendingUp,
  ShoppingCart,
  Clock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  X,
  Printer,
  Banknote,
} from "lucide-react";

const periodTabs: { label: string; value: FinancialPeriod }[] = [
  { label: "Daily", value: "day" },
  { label: "Weekly", value: "week" },
  { label: "Monthly", value: "month" },
  { label: "Yearly", value: "year" },
  { label: "All Time", value: "all" },
];

const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toLocalDateStr(d);
}

export default function Financial() {
  const [period, setPeriod] = useState<FinancialPeriod>("month");
  const today = toLocalDateStr(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [eodDate, setEodDate] = useState<string>(today);

  const { data: report, isLoading } = useQuery({
    queryKey: ["financial", period, selectedDate],
    queryFn: () => getFinancialReport(period, selectedDate ?? undefined),
  });

  const { data: eodReport } = useQuery({
    queryKey: ["eod", eodDate],
    queryFn: () => getEODReport(eodDate),
  });

  if (isLoading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  const overall = report?.overall;

  const summaryCards = [
    {
      label: "Total Revenue",
      value: fmt(overall?.total_revenue ?? 0),
      icon: Wallet,
      color: "border-primary-500",
      textColor: "text-primary-500",
      bgColor: "bg-primary-50 dark:bg-primary-900/20",
    },
    {
      label: "Table Revenue",
      value: fmt(overall?.table_revenue ?? 0),
      icon: TableProperties,
      color: "border-violet-500",
      textColor: "text-violet-500",
      bgColor: "bg-violet-50 dark:bg-violet-900/20",
    },
    {
      label: "F&B Revenue",
      value: fmt(overall?.fnb_revenue ?? 0),
      icon: UtensilsCrossed,
      color: "border-amber-500",
      textColor: "text-amber-500",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
    },
    {
      label: "PB1 Tax (10%)",
      value: fmt(overall?.pb1_tax ?? 0),
      icon: Receipt,
      color: "border-red-500",
      textColor: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-900/20",
    },
    {
      label: "Net Revenue",
      value: fmt(overall?.net_revenue ?? 0),
      icon: TrendingUp,
      color: "border-emerald-500",
      textColor: "text-emerald-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    },
  ];

  const activeDate = selectedDate ?? today;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Financial</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500">Revenue reports and tax overview</p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          {selectedDate && (
            <button
              onClick={() => setSelectedDate(shiftDate(activeDate, -1))}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          <div className="relative">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium ${
              selectedDate
                ? "border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
            }`}>
              <CalendarDays size={16} className={selectedDate ? "text-primary-400" : "text-gray-400 dark:text-gray-500"} />
              <span>{selectedDate ? formatDisplayDate(selectedDate) : "All dates"}</span>
              {selectedDate && selectedDate === today && (
                <span className="ml-1 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-1.5 py-0.5 rounded font-medium">Today</span>
              )}
            </div>
            <input
              type="date"
              value={selectedDate ?? ""}
              onChange={(e) => setSelectedDate(e.target.value || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          {selectedDate && (
            <>
              <button
                onClick={() => setSelectedDate(shiftDate(activeDate, 1))}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => setSelectedDate(null)}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300"
                title="Clear date filter"
              >
                <X size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Period Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-800">
        {periodTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setPeriod(tab.value)}
            className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              period === tab.value
                ? "border-primary-500 text-primary-500"
                : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className={`bg-white dark:bg-gray-900 rounded-xl border-l-4 ${card.color} p-5 shadow-sm`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">{card.label}</p>
              <div className={`w-8 h-8 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                <card.icon size={16} className={card.textColor} />
              </div>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Counts Row */}
      <div className="flex gap-4 mb-8">
        <div className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 px-5 py-3 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
            <ShoppingCart size={16} className="text-primary-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Total Orders</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{overall?.order_count ?? 0}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 px-5 py-3 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
            <Clock size={16} className="text-violet-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Completed Sessions</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{overall?.session_count ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Tax Summary Card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">PB1 Tax Summary (Pajak Restoran)</h3>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">F&B Tax Base</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{fmt(overall?.fnb_revenue ?? 0)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">PB1 Rate</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">10%</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tax Amount</p>
            <p className="text-xl font-bold text-red-500">{fmt(overall?.pb1_tax ?? 0)}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            PB1 (Pajak Restoran) is a local tax applied at 10% on food & beverage sales per Indonesian tax law.
            Table rental revenue is not subject to PB1.
          </p>
        </div>
      </div>

      {/* Period Breakdown Table */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Period Breakdown</h3>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Period</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Table Rev</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">F&B Rev</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">PB1 Tax</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Net</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Orders</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Sessions</th>
            </tr>
          </thead>
          <tbody>
            {report?.periods.map((p) => (
              <tr key={p.period} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{p.period}</td>
                <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-400">{fmt(p.summary.table_revenue)}</td>
                <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-400">{fmt(p.summary.fnb_revenue)}</td>
                <td className="px-6 py-4 text-right text-red-500 font-medium">{fmt(p.summary.pb1_tax)}</td>
                <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">{fmt(p.summary.total_revenue)}</td>
                <td className="px-6 py-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">{fmt(p.summary.net_revenue)}</td>
                <td className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">{p.summary.order_count}</td>
                <td className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">{p.summary.session_count}</td>
              </tr>
            ))}
            {(!report?.periods || report.periods.length === 0) && (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center text-gray-400 dark:text-gray-500">
                  No financial data for this period
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* EOD Report Section */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">End-of-Day Report</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEodDate(shiftDate(eodDate, -1))}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <ChevronLeft size={14} />
              </button>
              <div className="relative">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 px-2">{formatDisplayDate(eodDate)}</span>
                <input
                  type="date"
                  value={eodDate}
                  onChange={(e) => e.target.value && setEodDate(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <button
                onClick={() => setEodDate(shiftDate(eodDate, 1))}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <ChevronRight size={14} />
              </button>
              {eodDate !== today && (
                <button onClick={() => setEodDate(today)} className="text-xs text-primary-500 font-medium ml-1 hover:underline">
                  Today
                </button>
              )}
            </div>
          </div>
          {eodReport && (
            <button
              onClick={() => printEODReport(eodReport)}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Printer size={14} /> Print EOD
            </button>
          )}
        </div>

        {eodReport ? (
          <div className="space-y-4">
            {/* EOD Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Transactions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{eodReport.total_transactions}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {eodReport.session_count} sessions + {eodReport.standalone_order_count} walk-in
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{fmt(eodReport.total_revenue)}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Table: {fmt(eodReport.table_revenue)} | F&B: {fmt(eodReport.fnb_revenue)}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">PB1 Tax</p>
                <p className="text-2xl font-bold text-red-500">{fmt(eodReport.pb1_tax)}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Net Revenue</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{fmt(eodReport.net_revenue)}</p>
              </div>
            </div>

            {/* Payment Method Breakdown */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <Banknote size={18} className="text-gray-400 dark:text-gray-500" />
                <h4 className="font-semibold text-gray-900 dark:text-white">Payment Method Breakdown</h4>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">Method</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">Count</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">%</th>
                  </tr>
                </thead>
                <tbody>
                  {eodReport.payment_breakdown.map((pb) => (
                    <tr key={pb.method} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                        {paymentMethodLabels[pb.method] || pb.method}
                      </td>
                      <td className="px-6 py-3 text-center text-gray-600 dark:text-gray-400">{pb.count}</td>
                      <td className="px-6 py-3 text-right font-semibold text-gray-900 dark:text-white">{fmt(pb.amount)}</td>
                      <td className="px-6 py-3 text-right text-gray-500 dark:text-gray-400">
                        {eodReport.total_revenue > 0
                          ? `${((pb.amount / eodReport.total_revenue) * 100).toFixed(1)}%`
                          : "0%"}
                      </td>
                    </tr>
                  ))}
                  {eodReport.payment_breakdown.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-400 dark:text-gray-500">
                        No transactions for this date
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-16 text-center shadow-sm">
            <p className="text-gray-400 dark:text-gray-500">Loading EOD report...</p>
          </div>
        )}
      </div>
    </div>
  );
}
