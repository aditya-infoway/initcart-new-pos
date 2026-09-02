import { create } from "zustand";
import Swal from "sweetalert2";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  ownership_type?: 'branch' | 'franchise';
}

interface PrefixMap {
  BP?: string;
  CP?: string;
  CR?: string;
  BR?: string;
  PI?: string;
  SI?: string;
  JE?: string;
  contra?: string;
  gst_toggle?: boolean;
}

interface Branch {
  id: number;
  email: string;
  branch_name: string;
  owner_name: string;
  branch_type: string;
  phone: string;
  status: string;
  ownership_type?: 'branch' | 'franchise';
}

interface Employee {
  id: number;
  full_name: string;
  department: string;
}

interface Permission {
  page_key: string;
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  isRestoring: boolean;
  user: User | null;
  branch: Branch | null;
  accessToken: string | null;
  refreshToken: string | null;
  prefixes: PrefixMap;
  loading: boolean;
  error: string | null;
  inactivityTimer: any;
  
  employee: Employee | null;
  permissions: Permission[];
  hasPermission: (pageKey: string, action?: 'view' | 'add' | 'edit' | 'delete') => boolean;
  
  login: (identifier: string, password: string) => Promise<any>;
  logout: () => void;
  logoutAndRedirect: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setPrefixes: (p: PrefixMap) => void;
  loadSessionFromStorage: () => boolean;
  startTimers: () => void;
  clearTimers: () => void;
  resetInactivityTimer: () => void;
}

const INACTIVITY_TIMEOUT = 60 * 60 * 1000;

const clearStorage = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("branch");
  localStorage.removeItem("prefixes");
  localStorage.removeItem("gst_toggle");
  localStorage.removeItem("employee");
  localStorage.removeItem("permissions");
};

const showSessionAlert = (message: string, onConfirm: () => void) => {
  Swal.fire({
    title: "Session Expired",
    text: message,
    icon: "warning",
    confirmButtonText: "OK",
    allowOutsideClick: false,
  }).then(onConfirm);
};

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  user: null,
  isRestoring: true,
  branch: null,
  accessToken: null,
  refreshToken: null,
  prefixes: {},
  loading: false,
  error: null,
  inactivityTimer: null,
  
  employee: null,
  permissions: [],
  
  hasPermission: (pageKey, action = 'view') => {
    const { user, permissions } = get();
    if (user?.role !== 'employee') return true; // superadmin/branch: full access
    const perm = permissions.find((p) => p.page_key === pageKey);
    if (!perm) return false;
    if (action === 'view') return perm.can_view;
    if (action === 'add') return perm.can_add;
    if (action === 'edit') return perm.can_edit;
    if (action === 'delete') return perm.can_delete;
    return false;
  },

  setPrefixes: (p) => set({ prefixes: p }),

  loadSessionFromStorage: () => {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    const userStr = localStorage.getItem("user");
    const branchStr = localStorage.getItem("branch");
    const prefixesStr = localStorage.getItem("prefixes");

    if (accessToken && userStr) {
      try {
        const branch = branchStr && branchStr !== "null"
          ? JSON.parse(branchStr)
          : null;

        set({
          isAuthenticated: true,
          user: JSON.parse(userStr),
          isRestoring: false,
          branch,
          accessToken,
          refreshToken,
          prefixes: prefixesStr ? JSON.parse(prefixesStr) : {},
          employee: localStorage.getItem("employee") ? JSON.parse(localStorage.getItem("employee")!) : null,
          permissions: localStorage.getItem("permissions") ? JSON.parse(localStorage.getItem("permissions")!) : [],
        });
        get().startTimers();
        return true;
      } catch (e) {
        console.error("Session restore failed:", e);
        set({ isRestoring: false });
        clearStorage();
        return false;
      }
    }
    set({ isRestoring: false });
    return false;
  },

  login: async (identifier: string, password: string) => {
    try {
      set({ loading: true, error: null });

      const response = await fetch("http://localhost:8000/api/pos/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (data.success) {
        set({
          isAuthenticated: true,
          user: data.user,
          branch: data.branch ?? null,
          accessToken: data.access,
          refreshToken: data.refresh,
          loading: false,
          error: null,
          prefixes: data.prefixes || {},
          employee: data.employee ?? null,
          permissions: data.permissions ?? [],
        });

        localStorage.setItem("accessToken", data.access);
        localStorage.setItem("refreshToken", data.refresh);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("branch", JSON.stringify(data.branch ?? null));
        if (data.prefixes) {
          localStorage.setItem("prefixes", JSON.stringify(data.prefixes));
        }
        localStorage.setItem("employee", JSON.stringify(data.employee ?? null));
        localStorage.setItem("permissions", JSON.stringify(data.permissions ?? []));

        get().startTimers();
        return data;
      } else {
        throw new Error(data.message || "Login failed");
      }
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || "An error occurred during login",
        isAuthenticated: false,
      });
      throw error;
    }
  },

  logout: () => {
    get().clearTimers();
    clearStorage();
    set({
      isAuthenticated: false,
      user: null,
      branch: null,
      accessToken: null,
      refreshToken: null,
      prefixes: {},
      loading: false,
      error: null,
    });
  },

  logoutAndRedirect: () => {
    get().clearTimers();
    clearStorage();
    set({
      isAuthenticated: false,
      user: null,
      branch: null,
      accessToken: null,
      refreshToken: null,
      prefixes: {},
    });
    window.location.replace("/pos/login");
  },

  startTimers: () => {
    get().clearTimers();
    const inactivityTimer = setTimeout(() => {
      if (window.location.pathname !== "/pos/login") {
        showSessionAlert(
          "You were inactive for 1 hour. Please login again.",
          () => get().logoutAndRedirect()
        );
      }
    }, INACTIVITY_TIMEOUT);
    set({ inactivityTimer });
  },

  clearTimers: () => {
    const { inactivityTimer } = get();
    if (inactivityTimer) clearTimeout(inactivityTimer);
    set({ inactivityTimer: null });
  },

  resetInactivityTimer: () => {
    if (!get().isAuthenticated) return;
    if (get().inactivityTimer) clearTimeout(get().inactivityTimer);
    const inactivityTimer = setTimeout(() => {
      if (window.location.pathname !== "/pos/login") {
        showSessionAlert(
          "You were inactive for 1 hour. Please login again.",
          () => get().logoutAndRedirect()
        );
      }
    }, INACTIVITY_TIMEOUT);
    set({ inactivityTimer });
  },

  clearError: () => set({ error: null }),
  setLoading: (loading: boolean) => set({ loading }),
}));