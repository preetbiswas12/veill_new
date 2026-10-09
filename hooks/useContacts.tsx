import { useEffect, useRef, useState } from 'react';

import { useCometChat } from './useCometChat';

interface Contact {
  id: string;
  name?: string;
  image?: string;
  username?: string;
}

const useContacts = (
  setUsers?: (contacts: Contact[]) => void,
  fetchContacts: boolean = true
) => {
  const { searchUsers } = useCometChat();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(fetchContacts);
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelled = useRef(false);

  useEffect(() => {
    if (!fetchContacts) {
      setLoadingContacts(false);
      return;
    }

    let disposed = false;
    const loadUsers = async () => {
      try {
        setLoadingContacts(true);
        const users = await searchUsers('');
        if (disposed) return;
        setContacts(users);
        setUsers?.(users);
      } catch (error) {
        console.error('Error fetching contacts:', error);
      } finally {
        if (!disposed) setLoadingContacts(false);
      }
    };

    void loadUsers();

    return () => {
      disposed = true;
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchContacts]);

  const debounceSearch = (
    text: string,
    reset: () => void,
    filterFn: (query: string) => Promise<void> | void
  ) => {
    const query = text.trimStart();

    if (!query) {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      cancelled.current = true;
      reset();
      return;
    }

    cancelled.current = false;

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(async () => {
      if (cancelled.current) return;
      await filterFn(query);
    }, 200);
  };

  return {
    contacts,
    loadingContacts,
    debounceSearch,
  };
};

export default useContacts;
