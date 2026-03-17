import api from "./client";
import { BilliardTable } from "../types";

export const getTables = () => api.get<BilliardTable[]>("/tables").then((r) => r.data);
export const getTable = (id: number) => api.get<BilliardTable>(`/tables/${id}`).then((r) => r.data);
export const createTable = (data: { number: number; hourly_rate: number }) =>
  api.post<BilliardTable>("/tables", data).then((r) => r.data);
export const updateTable = (id: number, data: Partial<{ number: number; hourly_rate: number; status: string }>) =>
  api.put<BilliardTable>(`/tables/${id}`, data).then((r) => r.data);
export const deleteTable = (id: number) => api.delete(`/tables/${id}`);
export const updateTableStatus = (id: number, status: string) =>
  api.patch<BilliardTable>(`/tables/${id}/status`, { status }).then((r) => r.data);
