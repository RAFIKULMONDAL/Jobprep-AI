import api from "./axios";

export const getReports = () => api.get("/reports").then((r) => r.data);
export const getReportById = (id) => api.get(`/reports/${id}`).then((r) => r.data);
export const deleteReport = (id) => api.delete(`/reports/${id}`).then((r) => r.data);
