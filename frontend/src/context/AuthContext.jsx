import { createContext, useContext, useEffect, useState } from "react";
import { loginUser, registerAccount } from "../api/attendance";

const AuthContext = createContext(null);
const AUTH_STORAGE_KEY = "attendance-admin-auth";

function normalizeStoredUser(storedUser) {
  if (!storedUser) {
    return null;
  }

  if (storedUser.id) {
    return storedUser;
  }

  if (
    storedUser.role === "admin" ||
    storedUser.username === "admin" ||
    storedUser.email === "admin@facetrack.local"
  ) {
    return {
      id: "admin-local",
      username: "admin",
      fullName: storedUser.fullName || "Admin",
      email: "admin@facetrack.local",
      role: "admin",
    };
  }

  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedUser) {
      const normalizedUser = normalizeStoredUser(JSON.parse(storedUser));
      if (normalizedUser) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalizedUser));
        setUser(normalizedUser);
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (credentials) => {
    const data = await loginUser(credentials);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const registerUser = async (payload) => {
    return registerAccount(payload);
  };

  const signOut = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, registerUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
