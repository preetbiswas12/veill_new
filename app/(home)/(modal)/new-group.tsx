import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useCometChat } from '@/hooks/useCometChat';

import Button from '@/components/Button';
import Screen from '@/components/Screen';
import Spinner from '@/components/Spinner';
import TextField from '@/components/TextField';
import UserCheckbox from '@/components/UserCheckbox';
import useContacts from '@/hooks/useContacts';

const NewGroupScreen = () => {
  const { chatClient, createGroup } = useCometChat();
  const router = useRouter();
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [query, setQuery] = useState('');
  const [groupName, setGroupName] = useState('');
  const [users, setUsers] = useState<Array<{ id: string; name?: string; image?: string; username?: string }>>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const { contacts, loadingContacts, debounceSearch } = useContacts(
    chatClient,
    setUsers
  );

  const resetUsers = () => {
    setUsers(contacts);
  };

  const search = (query: string) => {
    const filteredUsers = contacts.filter((user) => {
      const name = user.name || user.username || '';
      return (
        user.username?.toLowerCase().includes(query.toLowerCase()) ||
        name.toLowerCase().includes(query.toLowerCase())
      );
    });
    setUsers(filteredUsers);
  };

  const handleUserSearch = (text: string) => {
    setQuery(text);
    debounceSearch(text, resetUsers, search);
  };

  const leave = () => {
    setCreatingGroup(false);
    setGroupName('');
    setQuery('');
    setSelectedUsers([]);
    router.dismissTo('/chats');
  };

  const createNewGroup = async () => {
    if (!groupName) {
      alert('Please enter a group name.');
      return;
    }
    if (selectedUsers.length === 0) {
      alert('Please select at least one user.');
      return;
    }

    setCreatingGroup(true);

    try {
      const groupId = await createGroup(groupName, selectedUsers);
      leave();
    } catch (error) {
      console.error(error);
      alert('Error creating group');
    } finally {
      setCreatingGroup(false);
    }
  };

  const onSelectUser = (userId: string, value: boolean) => {
    setSelectedUsers((prevSelectedUsers) => {
      if (value) {
        return [...prevSelectedUsers, userId];
      } else {
        return prevSelectedUsers.filter((id) => id !== userId);
      }
    });
  };

  const sortedUsers = useMemo(
    () =>
      users.sort((a, b) => {
        const nameA = a.name || a.username || '';
        const nameB = b.name || b.username || '';
        return nameA.localeCompare(nameB);
      }),
    [users]
  );

  return (
    <Screen viewClassName="pt-1 px-4 gap-4">
      <TextField
        id="groupName"
        label="Group Name"
        placeholder="Group Name"
        value={groupName}
        onChangeText={(value) => setGroupName(value)}
      />
      <TextField
        id="users"
        label="Add Members"
        placeholder="Who would you like to add?"
        value={query}
        onChangeText={(value) => handleUserSearch(value)}
        autoCapitalize="none"
      />
      {loadingContacts && (
        <View className="flex items-center justify-center py-4">
          <Spinner />
        </View>
      )}
      {!loadingContacts && users.length > 0 && (
        <View className="flex flex-col gap-2 mt-2">
          {sortedUsers.map((user) => (
            <UserCheckbox
              key={user.id}
              user={user}
              checked={selectedUsers.includes(user.id)}
              onValueChange={(value) => onSelectUser(user.id, value)}
            />
          ))}
        </View>
      )}
      <Button
        className="mt-auto"
        onPress={createNewGroup}
        disabled={creatingGroup}
      >
        {!creatingGroup && 'Create group'}
        {creatingGroup && <ActivityIndicator />}
      </Button>
    </Screen>
  );
};

export default NewGroupScreen;
