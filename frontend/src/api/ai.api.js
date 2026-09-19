import api from "./axios";

export const analyzeResume = (formData) =>
  api
    .post("/ai/analyze", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);

export const generateInterviewQuestions = (reportId) =>
  api.post(`/ai/${reportId}/interview-questions`).then((r) => r.data);

export const generateAtsResume = (reportId) =>
  api.post(`/ai/${reportId}/ats-resume`).then((r) => r.data);

// Plain <a href> links can't send an Authorization header, and our backend
// requires JWT auth on every AI route - so we fetch the PDF as a blob
// (with the header attached, same as every other request) and trigger the
// browser's save dialog manually.
export const downloadAtsResumePdf = async (reportId) => {
  const response = await api.get(`/ai/${reportId}/ats-resume/download`, {
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `ats-resume-${reportId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
};
