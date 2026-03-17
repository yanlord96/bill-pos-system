import api from "./client";
import { Order } from "../types";

export const getOrdersBySession = (sessionId: number) =>
  api.get<Order[]>("/orders", { params: { session_id: sessionId } }).then((r) => r.data);

export const getAllOrders = (standalone?: boolean) =>
  api.get<Order[]>("/orders", { params: standalone !== undefined ? { standalone } : {} }).then((r) => r.data);

export const getOrder = (id: number) => api.get<Order>(`/orders/${id}`).then((r) => r.data);

export const createOrder = (data: {
  session_id?: number | null;
  customer_name?: string | null;
  payment_method?: string | null;
  items: { menu_item_id: number; quantity: number }[];
}) => api.post<Order>("/orders", data).then((r) => r.data);
