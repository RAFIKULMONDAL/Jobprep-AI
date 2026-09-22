import api from "./axios";

export const registerUser = (payload) =>
  api.post("/auth/register", payload).then((r) => r.data);

export const verifyEmail = (token) =>
  api.get(`/auth/verify-email/${token}`).then((r) => r.data);

export const resendVerification = (email) =>
  api.post("/auth/resend-verification", { email }).then((r) => r.data);

export const loginUser = (payload) =>
  api.post("/auth/login", payload).then((r) => r.data);

export const forgotPassword = (email) =>
  api.post("/auth/forgot-password", { email }).then((r) => r.data);

export const resetPassword = (token, password) =>
  api.post(`/auth/reset-password/${token}`, { password }).then((r) => r.data);

export const getMe = () => api.get("/auth/me").then((r) => r.data);
