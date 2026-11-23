import { useCallback, useState } from 'react';

// Holds the last error from a form submit so it can be shown inline,
// including per-field messages when the server reports validation errors.
export function useFormError() {
  const [error, setErr] = useState(null);
  const setError = useCallback((err) => setErr(err || null), []);
  const clear = useCallback(() => setErr(null), []);
  const field = useCallback((name) => error?.fieldMessage?.(name), [error]);
  return { message: error?.message || null, field, setError, clear };
}
