import { apiRequest } from "./client";

export function loginUser(payload) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function registerAccount(payload) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchDashboardStats() {
  return apiRequest("/dashboard/stats");
}

export function createStudent(payload) {
  return apiRequest("/students", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchStudents() {
  return apiRequest("/students");
}

export function fetchAttendance(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.date) {
    searchParams.set("date", params.date);
  }
  if (params.search) {
    searchParams.set("search", params.search);
  }

  const query = searchParams.toString();
  return apiRequest(`/attendance${query ? `?${query}` : ""}`);
}

export function exportAttendance(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.date) {
    searchParams.set("date", params.date);
  }
  if (params.search) {
    searchParams.set("search", params.search);
  }

  const query = searchParams.toString();
  return apiRequest(`/attendance/export${query ? `?${query}` : ""}`);
}
