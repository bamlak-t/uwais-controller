import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

type Updater<T> = T | ((previous: T) => T);

/**
 * `useState` backed by AsyncStorage.
 *
 * Returns the value, a setter and whether the stored value has been read yet.
 * `revive` turns whatever was stored into a valid value, which is where
 * defaults for fields added in later versions get filled in.
 */
export function usePersistentState<T>(
  key: string,
  fallback: T,
  revive: (stored: unknown) => T = stored => stored as T,
): [T, (updater: Updater<T>) => void, boolean] {
  const [value, setValue] = useState(fallback);
  const [loaded, setLoaded] = useState(false);
  const reviveRef = useRef(revive);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(key)
      .then(raw => {
        if (!cancelled && raw != null) {
          setValue(reviveRef.current(JSON.parse(raw)));
        }
      })
      .catch(() => {
        // Unreadable or corrupt data: keep the fallback.
      })
      .finally(() => {
        if (!cancelled) {
          setLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  const update = useCallback(
    (updater: Updater<T>) => {
      setValue(previous => {
        const next =
          typeof updater === 'function'
            ? (updater as (previous: T) => T)(previous)
            : updater;
        AsyncStorage.setItem(key, JSON.stringify(next)).catch(() => {
          // Storage is best effort; the in-memory value still applies.
        });
        return next;
      });
    },
    [key],
  );

  return [value, update, loaded];
}
