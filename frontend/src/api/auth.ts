import api from "./client";
import { LoginResponse, User } from "../types";

export const login = (username: string, password: string) =>
  api.post<LoginResponse>("/auth/login", { username, password }).then((r) => r.data);

export const getMe = () =>
  api.get<User>("/auth/me").then((r) => r.data);
