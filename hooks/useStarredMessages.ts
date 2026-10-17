import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'veill.starred';

/**
 * Starred message ids, and enough of each message to render it in the
 * Starred Messages screen.
 *
 * CometChat's client SDK has no star action in 4.1.0 (`toggleMessageAction` is
 * absent), so this is local to the device the same way Favourites is. Storing
 * the message body alongside the id is what lets the screen render without
 * having to refetch every conversation, which would be wrong anyway since a
 * starred message may live in a conversation that has since been deleted.
 */

export interface StarredEntry {
  id: string;
  conversationId: string;
  body: string;
  senderName: string;
  timestamp: number;
}

let cache: StarredEntry[] | null = null;

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

const isValid = (entry: any): entry is StarredEntry =>
  entry &&
  typeof entry.id === 'string' &&
  typeof entry.conversationId === 'string' &&
  typeof entry.body === 'string' &&
  typeof entry.senderName === 'string' &&
  typeof entry.timestamp === 'number';

const load = async (): Promise<StarredEntry[]> => {
  if (cache) return cache;
  const storage = readStorage();
  if (!storage) return (cache = []);
  try {
    const raw = await storage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    cache = Array.isArray(parsed) ? parsed.filter(isValid) : [];
  } catch {
    cache = [];
  }
  return cache;
};

const persist = async (next: StarredEntry[]) => {
  cache = next;
  const storage = readStorage();
  if (!storage) return;
  try {
    await storage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Staying in-memory for this session is acceptable.
  }
};

export const useStarredMessages = () => {
  const [entries, setEntries] = useState<StarredEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void load().then((stored) => {
      if (cancelled) return;
      setEntries(stored);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = useCallback(async (entry: StarredEntry) => {
    const current = await load();
    const next = current.some((item) => item.id === entry.id)
      ? current.filter((item) => item.id !== entry.id)
      : [entry, ...current];
    await persist(next);
    setEntries(next);
    return next.some((item) => item.id === entry.id);
  }, []);

  const remove = useCallback(async (id: string) => {
    const current = await load();
    const next = current.filter((item) => item.id !== id);
    await persist(next);
    setEntries(next);
  }, []);

  const clear = useCallback(async () => {
    await persist([]);
    setEntries([]);
  }, []);

  return {
    entries,
    ready,
    isStarred: (id: string) => entries.some((item) => item.id === id),
    toggle,
    remove,
    clear,
  };
};
