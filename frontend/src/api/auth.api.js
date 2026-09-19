import api from "./axios";

export const registerUser = (payload) =>
  api.post("/auth/register", payload).then((r) => r.data);

export const loginUser = (payload) =>
  api.post("/auth/login", payload).then((r) => r.data);

export const getMe = () => api.get("/auth/me").then((r) => r.data);
