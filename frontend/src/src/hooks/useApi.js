import { useCallback, useEffect, useState } from 'react';

// Loads data from an API function. `fetcher` must be a stable reference
// (e.g. bookingsApi.list). Pass { enabled: false } to skip fetching.
// Keeps the last good data on screen if a refresh fails, and exposes `error` for a banner.
export function useApi(fetcher, { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: enabled });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    fetcher()
      .then((data) => { if (!cancelled) setState({ data, error: null, loading: false }); })
      .catch((err) => { if (!cancelled) setState((s) => ({ data: s.data, error: err.message, loading: false })); });
    return () => { cancelled = true; };
  }, [fetcher, enabled, tick]);

  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    setTick((t) => t + 1);
  }, []);

  // Update cached data locally (e.g. after an edit or delete) without refetching.
  const mutate = useCallback((updater) => {
    setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater }));
  }, []);

  return { ...state, reload, mutate };
}
