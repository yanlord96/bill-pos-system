import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getDashboardSummary } from "../api/dashboard";
import { getTables } from "../api/tables";
import { getSessions } from "../api/sessions";
import { BilliardTable } from "../types";
import { useState } from "react";
import StartSessionModal from "../components/modals/StartSessionModal";
import SessionTimer from "../components/SessionTimer";
import RunningCost from "../components/RunningCost";
import {
  LayoutGrid,
  CheckCircle2,
  Activity,
  Wallet,
  ChevronRight,
  Clock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const statusColors: Record<string, string> = {
  available: "bg-emerald-500",
  occupied: "bg-red-500",
  reserved: "bg-amber-500",
};

const statusDot: Record<string, string> = {
  available: "bg-emerald-400",
  occupied: "bg-red-400",
  reserved: "bg-amber-400",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedTable, setSelectedTable] = useState<BilliardTable | null>(null);

  const { data: summary } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboardSummary,
    refetchInterval: 5000,
  });

  const { data: tables } = useQuery({
    queryKey: ["tables"],
    queryFn: getTables,
    refetchInterval: 5000,
  });

  const { data: activeSessions } = useQuery({
    queryKey: ["sessions", "active"],
    queryFn: () => getSessions("active"),
    refetchInterval: 5000,
  });

  const allKpiCards = [
    {
      label: "Total Tables",
      value: summary?.total_tables ?? 0,
      icon: LayoutGrid,
      color: "border-primary-500",
      textColor: "text-primary-500",
      bgColor: "bg-primary-50 dark:bg-primary-900/20",
    },
    {
      label: "Available",
      value: summary?.available_tables ?? 0,
      icon: CheckCircle2,
      color: "border-emerald-500",
      textColor: "text-emerald-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
      label: "Active Sessions",
      value: summary?.active_sessions ?? 0,
      icon: Activity,
      color: "border-amber-500",
      textColor: "text-amber-500",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
    },
    {
      label: "Today's Revenue",
      value: `Rp ${(summary?.today_revenue ?? 0).toLocaleString()}`,
      icon: Wallet,
      color: "border-violet-500",
      textColor: "text-violet-500",
      bgColor: "bg-violet-50 dark:bg-violet-900/20",
      ownerOnly: true,
    },
  ];

  const kpiCards = allKpiCards.filter(
    (card) => !card.ownerOnly || user?.role === "owner"
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Welcome back, here's your overview</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={`grid gap-5 mb-8 ${kpiCards.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className={`bg-white dark:bg-gray-900 rounded-xl border-l-4 ${card.color} p-5 shadow-sm`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.label}</p>
              <div className={`w-9 h-9 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                <card.icon size={18} className={card.textColor} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Active Sessions Strip */}
      {activeSessions && activeSessions.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Sessions</h3>
            <button
              onClick={() => navigate("/sessions")}
              className="text-sm text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1"
            >
              View All <ChevronRight size={16} />
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => navigate(`/sessions/${session.id}`)}
                className="min-w-[280px] bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Table {session.table.number}
                  </span>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                    Active
                  </span>
                </div>
                <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">{session.client.name}</p>
                {session.start_time && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3 text-center">
                    <div className="text-2xl font-bold font-mono text-gray-900 dark:text-white">
                      <SessionTimer startTime={session.start_time} />
                    </div>
                    <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                      <RunningCost startTime={session.start_time} hourlyRate={Number(session.table.hourly_rate)} />
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      Rp {Number(session.table.hourly_rate).toLocaleString()}/hr
                    </div>
                  </div>
                )}
                <div className="flex justify-end">
                  <span className="text-sm font-semibold text-primary-500">
                    View details
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tables Grid */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tables</h3>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {tables?.map((table) => {
          const tableSession = table.status === "occupied"
            ? activeSessions?.find((s) => s.table_id === table.id)
            : null;

          return (
            <div
              key={table.id}
              onClick={() => {
                if (table.status === "available") {
                  setSelectedTable(table);
                } else if (table.status === "occupied" && tableSession) {
                  navigate(`/sessions/${tableSession.id}`);
                } else if (table.status === "occupied") {
                  navigate("/sessions");
                }
              }}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-gray-900 dark:text-white">Table {table.number}</span>
                <span
                  className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                    table.status === "available"
                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                      : table.status === "occupied"
                      ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                      : "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusDot[table.status]}`} />
                  {table.status}
                </span>
              </div>
              {tableSession?.start_time ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Clock size={14} className="text-red-400" />
                    <span className="font-mono font-semibold text-red-600 dark:text-red-400">
                      <SessionTimer startTime={tableSession.start_time} />
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    <RunningCost startTime={tableSession.start_time} hourlyRate={Number(table.hourly_rate)} />
                  </span>
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Rp {Number(table.hourly_rate).toLocaleString()}/hr
                </p>
              )}
            </div>
          );
        })}
      </div>

      {selectedTable && (
        <StartSessionModal
          table={selectedTable}
          onClose={() => setSelectedTable(null)}
        />
      )}
    </div>
  );
}
