const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const AUTH_STORAGE_KEY = "attendance-admin-auth";

function normalizeSessionUser(user) {
  if (!user) {
    return null;
  }

  if (user.id) {
    return user;
  }

  if (user.role === "admin" || user.username === "admin" || user.email === "admin@facetrack.local") {
    return {
      id: "admin-local",
      username: "admin",
      fullName: user.fullName || "Admin",
      email: "admin@facetrack.local",
      role: "admin",
    };
  }

  return null;
}

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

export async function apiRequest(path, options = {}) {
  const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
  const rawSessionUser = storedUser ? JSON.parse(storedUser) : null;
  const sessionUser = normalizeSessionUser(rawSessionUser);

  if (rawSessionUser && !sessionUser) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } else if (sessionUser && JSON.stringify(rawSessionUser) !== JSON.stringify(sessionUser)) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(sessionUser?.id ? { "X-User-Id": sessionUser.id } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  return parseResponse(response);
}

export { API_BASE_URL };
