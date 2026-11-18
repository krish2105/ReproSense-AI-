import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, type Call } from "@/api/client";
import { ApiError } from "@/api/errors";
import type { LoginResponse } from "@/api/types";
import { getPref, setPref } from "@/prefs";

interface Session {
  token: string | null;
  ready: boolean;
  /** Opens a fictional woman's record (POST /v1/demo/login) and keeps the token in SecureStore. */
  signInAs(persona: string): Promise<void>;
  /** Keeps a token the API returned (a new record from Join) in SecureStore. */
  signInWithToken(token: string): Promise<void>;
  signOut(): Promise<void>;
  /** An API call with her token. A 401 signs her out, so the app returns to Demo people. */
  call<T>(path: string, call?: Omit<Call, "token">): Promise<T>;
}

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getPref("token").then((t) => {
      setToken(t);
      setReady(true);
    });
  }, []);

  const signOut = useCallback(async () => {
    setToken(null);
    await setPref("token", null);
  }, []);

  const signInWithToken = useCallback(async (next: string) => {
    await setPref("token", next);
    setToken(next);
  }, []);

  const signInAs = useCallback(
    async (persona: string) => {
      const res = await api<LoginResponse>("/demo/login", { body: { persona, role: "patient" } });
      await signInWithToken(res.token);
    },
    [signInWithToken],
  );

  const call = useCallback(
    async <T,>(path: string, c: Omit<Call, "token"> = {}) => {
      try {
        return await api<T>(path, { ...c, token });
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) await signOut();
        throw e;
      }
    },
    [token, signOut],
  );

  const value = useMemo(
    () => ({ token, ready, signInAs, signInWithToken, signOut, call }),
    [token, ready, signInAs, signInWithToken, signOut, call],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const s = useContext(SessionContext);
  if (!s) throw new Error("useSession outside SessionProvider");
  return s;
}
