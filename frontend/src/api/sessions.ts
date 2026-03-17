import api from "./client";
import { Session, SessionStatus } from "../types";

export const getSessions = (status?: SessionStatus, date?: string) => {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  if (date) params.date = date;
  return api.get<Session[]>("/sessions", { params }).then((r) => r.data);
};
export const getSession = (id: number) => api.get<Session>(`/sessions/${id}`).then((r) => r.data);
export const createSession = (data: {
  table_id: number;
  client_id: number;
  session_type: "active" | "reserved";
  reserved_start?: string;
  reserved_end?: string;
}) => api.post<Session>("/sessions", data).then((r) => r.data);
export const endSession = (id: number, paymentMethod: string) =>
  api.patch<Session>(`/sessions/${id}/end`, { payment_method: paymentMethod }).then((r) => r.data);
export const cancelSession = (id: number) => api.patch<Session>(`/sessions/${id}/cancel`).then((r) => r.data);
export const activateSession = (id: number) => api.patch<Session>(`/sessions/${id}/start`).then((r) => r.data);
