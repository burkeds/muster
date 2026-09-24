import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';

/**
 * A boolean state persisted to localStorage so a lightweight user preference
 * (e.g. "Hide empty containers") survives page reloads and sessions.
 */
export function usePersistedBoolean(
  key: string,
  defaultValue: boolean,
): [boolean, Dispatch<SetStateAction<boolean>>] {
  const [value, setValue] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored === 'true') return true;
      if (stored === 'false') return false;
    } catch {
      /* ignore */
    }
    return defaultValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, String(value));
    } catch {
      /* ignore */
    }
  }, [key, value]);

  return [value, setValue];
}
