// @ts-nocheck
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CometChatAvatar, useTheme } from '@cometchat/chat-uikit-react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../../navigation/types';
import { useRoute, useNavigation } from '@react-navigation/native';

type Props = StackScreenProps<RootStackParamList, 'AddMember'>;

const AddMember: React.FC<Props> = ({ route, navigation }) => {
  const { group } = route.params;
  const theme = useTheme();
  const [searchText, setSearchText] = useState('');
  const [users, setUsers] = useState<CometChat.User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const request = new CometChat.UsersRequestBuilder()
        .setLimit(50)
        .setRoles([])
        .friendsOnly(false)
        .build();
      const fetchedUsers = await request.fetch();
      setUsers(fetchedUsers || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const toggleUser = useCallback((uid: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(uid)) {
        next.delete(uid);
      } else {
        next.add(uid);
      }
      return next;
    });
  }, []);

  const handleAddMembers = async () => {
    if (selectedUsers.size === 0) return;
    try {
      const members = Array.from(selectedUsers).map(uid => new CometChat.GroupMember(uid, 'member'));
      await CometChat.addMembersToGroup(group.getGuid(), members, CometChat.GROUP_MEMBER_SCOPE.ALL);
      navigation.goBack();
    } catch (error) {
      console.error('Error adding members:', error);
    }
  };

  const filteredUsers = users.filter(u =>
    u.getName()?.toLowerCase().includes(searchText.toLowerCase()) ||
    u.getUid().toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.color.background1 }]}>
      <View style={[styles.searchBar, { borderBottomColor: theme.color.borderLight }]}>
        <TextInput
          style={[styles.searchInput, { color: theme.color.textPrimary }]}
          placeholder="Search users..."
          placeholderTextColor={theme.color.textTertiary}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.getUid()}
        ItemSeparatorComponent={() => <View style={[styles.separator, { borderBottomColor: theme.color.borderLight }]} />}
        renderItem={({ item }) => {
          const isSelected = selectedUsers.has(item.getUid());
          return (
            <TouchableOpacity
              style={[styles.userItem, { backgroundColor: theme.color.background1 }]}
              onPress={() => toggleUser(item.getUid())}
            >
              <CometChatAvatar
                name={item.getName()}
                image={item.getAvatar() ? { uri: item.getAvatar() } : undefined}
              />
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: theme.color.textPrimary }]}>
                  {item.getName() || item.getUid()}
                </Text>
                <Text style={[styles.userUid, { color: theme.color.textSecondary }]}>
                  @{item.getUid()}
                </Text>
              </View>
              {isSelected && (
                <View style={[styles.checkBadge, { backgroundColor: theme.color.primary }]}>
                  <Text style={[styles.checkText, { color: theme.color.staticWhite }]}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
      {selectedUsers.size > 0 && (
        <View style={[styles.footer, { backgroundColor: theme.color.background1, borderTopColor: theme.color.borderLight }]}>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.color.primary }]}
            onPress={handleAddMembers}
          >
            <Text style={[styles.addButtonText, { color: theme.color.staticWhite }]}>
              Add ({selectedUsers.size})
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchInput: {
    fontSize: 16,
    paddingVertical: 8,
  },
  separator: {
    borderBottomWidth: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
  },
  userUid: {
    fontSize: 13,
    marginTop: 2,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  addButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddMember;

// @ts-nocheck

