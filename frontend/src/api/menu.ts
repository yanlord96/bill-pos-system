import api from "./client";
import { MenuItem, MenuCategory } from "../types";

export const getMenuItems = (category?: MenuCategory) =>
  api.get<MenuItem[]>("/menu/", { params: category ? { category } : {} }).then((r) => r.data);

export const getMenuItem = (id: number) =>
  api.get<MenuItem>(`/menu/${id}`).then((r) => r.data);

export const createMenuItem = (data: {
  name: string;
  category: MenuCategory;
  price: number;
  is_available?: boolean;
}) => api.post<MenuItem>("/menu/", data).then((r) => r.data);

export const updateMenuItem = (id: number, data: Partial<MenuItem>) =>
  api.put<MenuItem>(`/menu/${id}`, data).then((r) => r.data);

export const deleteMenuItem = (id: number) =>
  api.delete(`/menu/${id}`);