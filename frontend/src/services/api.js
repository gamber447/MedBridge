import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("medbridge_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export async function login(email, password) {
  const response = await api.post("/auth/login", null, {
    params: {
      email,
      password,
    },
  });

  return response.data;
}

export async function getCurrentUser() {
  const response = await api.get("/auth/me");
  return response.data;
}

export async function getDashboardSummary() {
  const response = await api.get("/dashboard/summary");
  return response.data;
}


export async function getMedicalCases() {
  const response = await api.get("/cases");
  return response.data;
}
export async function getPatients() {
  const response = await api.get("/patients");
  return response.data;
}
export async function getPatient(patientReference) {
  const response = await api.get(
    `/patients/${patientReference}/details`
  );

  return response.data;
}
export async function registerPatient(patientData) {
  const response = await api.post(
    "/patients",
    patientData
  );

  return response.data;
}
export async function createMedicalCase(data) {
  const response = await api.post(
    "/cases",
    data
  );

  return response.data;
}
export async function evaluateCaseRisk(caseId) {
  const response = await api.post(
    `/risk/evaluate/${caseId}`
  );

  return response.data;
}
export async function submitPatientVerification(
  patientReference,
  formData
) {
  const response = await api.post(
    `/patients/${patientReference}/verification`,
    formData
  );

  return response.data;
}
export async function getFundingStatus(caseId) {
  const response = await api.get(
    `/funding/status/${caseId}`
  );

  return response.data;
}
export async function createFundingRequest(caseId) {
  const response = await api.post(
    `/funding/request/${caseId}`
  );

  return response.data;
}

export async function getPaymentStatus(caseId) {
  const response = await api.get(
    `/payments/status/${caseId}`
  );

  return response.data;
}
export async function getPayments() {
  const response = await api.get("/payments");
  return response.data;
}
export async function getCaseAuditLogs(caseId) {
  const response = await api.get(
    `/audit/case/${caseId}`
  );

  return response.data;
}
export async function getBankAuditLogs() {
  const response = await fetch(
    "http://127.0.0.1:8001/bank/audit"
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Unable to load bank audit logs."
    );
  }

  return data;
}
export function logout() {
  sessionStorage.removeItem("medbridge_token");
  sessionStorage.removeItem("medbridge_user");
}

export default api;
export async function getAdminFundingDetails(fundingId) {
  const response = await fetch(
    `http://127.0.0.1:8001/bank/admin/funding-requests/${fundingId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail ||
      "Unable to load bank funding details."
    );
  }

  return data;
}
export async function getDonorStatistics() {
  const response = await fetch(
    "http://127.0.0.1:8001/bank/donors/statistics"
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail ||
      "Unable to load donor statistics."
    );
  }

  return data;
}