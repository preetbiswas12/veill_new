import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'veill.favourites';

/**
 * Favourited conversation ids.
 *
 * CometChat has no favourite concept in the SDK, so this is local to the
 * device - enough to back the design's "Favourites" filter chip and the
 * "Add to favourites" row on the contact info screen.
 *
 * AsyncStorage is a native module, so it is required lazily and the store
 * degrades to in-memory only if it is unavailable.
 */

let cache: string[] | null = null;

const readStorage = (): { getItem: Function; setItem: Function } | null => {
  try {
    const mod = require('@react-native-async-storage/async-storage');
    const storage = mod.default ?? mod;
    if (storage && typeof storage.getItem === 'function') return storage;
    return null;
  } catch {
    return null;
  }
};

const load = async (): Promise<string[]> => {
  if (cache) return cache;
  const storage = readStorage();
  if (!storage) return (cache = []);
  try {
    const raw = await storage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    cache = Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    cache = [];
  }
  return cache;
};

const persist = async (next: string[]) => {
  cache = next;
  const storage = readStorage();
  if (!storage) return;
  try {
    await storage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Staying in-memory for this session is acceptable.
  }
};

export const useFavourites = () => {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void load().then((stored) => {
      if (cancelled) return;
      setIds(stored);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = useCallback(async (id: string) => {
    const current = await load();
    const next = current.includes(id)
      ? current.filter((value) => value !== id)
      : [...current, id];
    await persist(next);
    setIds(next);
    return next.includes(id);
  }, []);

  return { ids, ready, isFavourite: (id: string) => ids.includes(id), toggle };
};