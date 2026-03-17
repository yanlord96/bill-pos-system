import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getSessions } from "../api/sessions";
import { useState } from "react";
import { SessionStatus } from "../types";
import SessionTimer from "../components/SessionTimer";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

const tabs: { label: string; value: SessionStatus | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Active", value: "active" },
  { label: "Reserved", value: "reserved" },
  { label: "Completed", value: "completed" },
];

const statusStyles: Record<string, string> = {
  active: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
  reserved: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
  completed: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
  cancelled: "bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400",
};

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

export default function Sessions() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<SessionStatus | undefined>("active");
  const today = toLocalDateStr(new Date());
  const [selectedDate, setSelectedDate] = useState(today);

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["sessions", filter, selectedDate],
    queryFn: () => getSessions(filter, selectedDate),
    refetchInterval: 5000,
  });

  if (isLoading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Sessions</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500">Manage and track billiard sessions</p>
        </div>

        {/* Date Picker */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="relative">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300">
              <CalendarDays size={16} className="text-gray-400 dark:text-gray-500" />
              <span>{formatDisplayDate(selectedDate)}</span>
              {selectedDate === today && (
                <span className="ml-1 text-xs bg-primary-50 dark:bg-primary-900/20 text-primary-500 px-1.5 py-0.5 rounded font-medium">Today</span>
              )}
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          <button
            onClick={() => setSelectedDate(shiftDate(selectedDate, 1))}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <ChevronRight size={16} />
          </button>
          {selectedDate !== today && (
            <button
              onClick={() => setSelectedDate(today)}
              className="px-3 py-2 rounded-lg text-xs font-medium text-primary-500 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setFilter(tab.value)}
            className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              filter === tab.value
                ? "border-primary-500 text-primary-500"
                : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Table</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Client</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Duration</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody>
            {sessions?.map((s) => (
              <tr
                key={s.id}
                onClick={() => navigate(`/sessions/${s.id}`)}
                className="cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/50 border-b border-gray-50 dark:border-gray-800/50 last:border-0 transition-colors"
              >
                <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Table {s.table.number}</td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{s.client.name}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[s.status]}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                  {s.status === "active" && s.start_time ? (
                    <SessionTimer startTime={s.start_time} />
                  ) : s.status === "completed" && s.start_time && s.end_time ? (
                    formatDuration(s.start_time, s.end_time)
                  ) : s.status === "reserved" ? (
                    <span className="text-sm text-gray-400 dark:text-gray-500">
                      {s.reserved_start ? new Date(s.reserved_start).toLocaleString() : "-"}
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                  {s.status === "completed" ? `Rp ${Number(s.total_cost).toLocaleString()}` : "-"}
                </td>
              </tr>
            ))}
            {sessions?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-gray-400 dark:text-gray-500">
                  No sessions found for this date
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDuration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${mins}m`;
}
