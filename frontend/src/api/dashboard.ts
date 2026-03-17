import api from "./client";
import { DashboardSummary, FinancialReport, FinancialPeriod, EODReport } from "../types";

export const getDashboardSummary = () =>
  api.get<DashboardSummary>("/dashboard/summary").then((r) => r.data);

export const getFinancialReport = (period: FinancialPeriod, date?: string) => {
  const params: Record<string, string> = { period };
  if (date) params.date = date;
  return api.get<FinancialReport>("/dashboard/financial", { params }).then((r) => r.data);
};

export const getEODReport = (date?: string) => {
  const params: Record<string, string> = {};
  if (date) params.date = date;
  return api.get<EODReport>("/dashboard/eod", { params }).then((r) => r.data);
};
