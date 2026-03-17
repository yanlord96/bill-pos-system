import api from "./client";
import { Client } from "../types";

export const getClients = (q?: string) =>
  api.get<Client[]>("/clients/", { params: q ? { q } : {} }).then((r) => r.data);

export const getClient = (id: number) =>
  api.get<Client>(`/clients/${id}`).then((r) => r.data);

export const createClient = (data: { name: string; phone: string }) =>
  api.post<Client>("/clients/", data).then((r) => r.data);

export const updateClient = (id: number, data: Partial<{ name: string; phone: string }>) =>
  api.put<Client>(`/clients/${id}`, data).then((r) => r.data);

export const deleteClient = (id: number) =>
  api.delete(`/clients/${id}`);