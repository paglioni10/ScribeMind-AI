import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiJson, apiFetch, tokenStore, setUnauthorizedHandler } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    if (!tokenStore.access) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await apiJson("/auth/me");
      setUser(me);
    } catch {
      tokenStore.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
    });
    loadMe();
  }, [loadMe]);

  async function login(email, password) {
    const tokens = await apiJson("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    tokenStore.set(tokens);
    await loadMe();
  }

  async function register(payload) {
    const result = await apiJson("/auth/register", {
      method: "POST",
      body: payload,
      auth: false,
    });

    // Se o cadastro já retornou sessão (e-mail sem confirmação), entra direto.
    if (result.session?.access_token) {
      tokenStore.set(result.session);
      await loadMe();
      return { needsLogin: false };
    }
    return { needsLogin: true };
  }

  function logout() {
    apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
    tokenStore.clear();
    setUser(null);
  }

  const isAdmin = user?.role === "admin" || user?.role === "owner";
  const isOwner = user?.role === "owner";
  const canViewDashboard = !!user?.can_view_dashboard;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser: loadMe,
        isAdmin,
        isOwner,
        canViewDashboard,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
