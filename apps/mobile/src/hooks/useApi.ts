import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useSession } from "@/auth/session";

/** Loads a GET endpoint with her token, again each time the screen comes into focus (so Home shows a new log). */
export function useApi<T>(path: string | null) {
  const { call } = useSession();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);

  const load = useCallback(async () => {
    if (!path) return;
    const mine = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const d = await call<T>(path);
      if (mine === seq.current) setData(d);
    } catch (e) {
      if (mine === seq.current) setError(e);
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, [path, call]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return { data, error, loading, reload: load, setData };
}
