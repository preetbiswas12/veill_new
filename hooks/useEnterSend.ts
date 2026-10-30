import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

/**
 * Whether the composer's Return key submits the message (WhatsApp's
 * "Enter is send") or inserts a newline. Device-local preference, read lazily
 * so a missing value simply leaves the default (insert a newline).
 */
const STORAGE_KEY = 'veill.enterSend';

export const useEnterSend = (): [boolean, (next: boolean) => void] => {
  const [value, setValue] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (active && saved === '1') setValue(true);
      } catch {
        // Storage unavailable; the default stands.
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const set = useCallback((next: boolean) => {
    setValue(next);
    void (async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        // The session keeps the choice even if persistence failed.
      }
    })();
  }, []);

  return [value, set];
};
