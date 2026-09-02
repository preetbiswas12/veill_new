import React from 'react';

export interface ActiveChatState {
  type: 'user' | 'group';
  id: string;
}

interface ActiveChatContextValue {
  activeChat: ActiveChatState | null;
  setActiveChat: (chat: ActiveChatState | null) => void;
}

export const ActiveChatContext = React.createContext<ActiveChatContextValue>({
  activeChat: null,
  setActiveChat: () => {},
});

export const ActiveChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeChat, setActiveChat] = React.useState<ActiveChatState | null>(null);

  return (
    <ActiveChatContext.Provider value={{ activeChat, setActiveChat }}>
      {children}
    </ActiveChatContext.Provider>
  );
};

export const useActiveChat = () => React.useContext(ActiveChatContext);
