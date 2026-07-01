import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  name: string;
  picture_url?: string;
}

interface AuthStore {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  loadFromStorage: () => void;
  isAuthenticated: () => boolean;
}

function getStoredAuth(): { token: string | null; user: User | null } {
  const token = localStorage.getItem("auth_token");
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  return token && user ? { token, user } : { token: null, user: null };
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...getStoredAuth(),
      isLoading: false,

      setToken: (token: string) => {
        set({ token });
        localStorage.setItem("auth_token", token);
      },

      setUser: (user: User) => {
        set({ user });
        localStorage.setItem("user", JSON.stringify(user));
      },

      logout: () => {
        set({ token: null, user: null });
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
      },

      loadFromStorage: () => {
        set(getStoredAuth());
      },

      isAuthenticated: () => {
        const state = get();
        return !!state.token && !!state.user;
      },
    }),
    {
      name: "auth-store",
      storage: {
        getItem: (key) => {
          // Don't persist to localStorage here (we do it manually)
          return null;
        },
        setItem: () => {
          // Don't persist to localStorage here (we do it manually)
        },
        removeItem: () => {
          // Don't persist to localStorage here (we do it manually)
        },
      },
    }
  )
);
