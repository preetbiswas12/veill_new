import { useEffect, useRef, useState } from 'react';

interface Contact {
  id: string;
  name?: string;
  image?: string;
  username?: string;
}

const useContacts = (
  client: any,
  setUsers?: (contacts: Contact[]) => void,
  fetchContacts: boolean = true
) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelled = useRef(false);

  useEffect(() => {
    const getAllUsers = async () => {
      if (!client) {
        setLoadingContacts(false);
        return;
      }
      try {
        setLoadingContacts(true);
        const userId = await client.getCurrentUsername?.();
        const conversations = await client.chatManager?.getAllConversations?.();

        const dmConversations = conversations?.filter((conv: any) => conv.convType === 'PeerChat') || [];

        const contactList = dmConversations
          .map((conv: any) => ({
            id: conv.convId || conv.conversationId || '',
            name: conv.convId || conv.conversationId || '',
          }))
          .filter(Boolean) as Contact[];

        if (contactList.length > 0) {
          const userIds = contactList.map((c) => c.id);
          const userInfoMap = await client.userManager?.fetchUserInfoById?.(userIds);
          contactList.forEach((contact) => {
            const userInfo = userInfoMap?.get ? userInfoMap.get(contact.id) : undefined;
            if (userInfo) {
              contact.name = userInfo.nickName || userInfo.name || contact.name;
              contact.image = userInfo.avatarUrl || userInfo.image || contact.image;
              contact.username = userInfo.userId || userInfo.uid || contact.username;
            }
          });
        }

        setContacts(contactList);
        if (setUsers) {
          setUsers(contactList);
        }
      } catch (error: any) {
        console.error('Error fetching contacts:', error);
      } finally {
        setLoadingContacts(false);
      }
    };
    if (fetchContacts) getAllUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, fetchContacts]);

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
