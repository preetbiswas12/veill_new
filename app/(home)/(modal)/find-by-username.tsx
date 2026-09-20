import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useCometChat } from '@/hooks/useCometChat';

import Screen from '@/components/Screen';
import Spinner from '@/components/Spinner';
import TextField from '@/components/TextField';
import UserCard from '@/components/UserCard';
import useContacts from '@/hooks/useContacts';

const FindByUsernameScreen = () => {
  const { chatClient, searchUsers, getOrCreateConversation } = useCometChat();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [user, setUser] = useState<{ id: string; name?: string; image?: string; username?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const { debounceSearch } = useContacts(chatClient, undefined, false);

  const resetUser = () => {
    setUser(null);
  };

  const search = async (query: string) => {
    try {
      setLoading(true);
      const users = await searchUsers(query);
      if (users.length > 0) {
        setUser(users[0]);
      }
    } catch (error: any) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSearch = async (text: string) => {
    setUsername(text);
    debounceSearch(text, resetUser, search);
  };

  const onSelectUser = async (userId: string) => {
    const conversation = await getOrCreateConversation(userId, 'user');
    router.dismissTo({
      pathname: '/chat/[id]',
      params: { id: conversation.id },
    });
  };

  return (
    <Screen viewClassName="pt-1 px-4 gap-4">
      <TextField
        id="username"
        placeholder="Username"
        value={username}
        onChangeText={(value) => handleUserSearch(value)}
        autoCapitalize="none"
      />
      {loading && (
        <View className="flex items-center justify-center py-4">
          <Spinner />
        </View>
      )}
      {!loading && user && (
        <UserCard user={user} onPress={() => onSelectUser(user.id)} />
      )}
    </Screen>
  );
};

export default FindByUsernameScreen;
