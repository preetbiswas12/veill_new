// @ts-nocheck
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CometChatAvatar, useTheme } from '@cometchat/chat-uikit-react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../../navigation/types';
import { useRoute } from '@react-navigation/native';

type Props = StackScreenProps<RootStackParamList, 'BannedMember'>;

const BannedMember: React.FC<Props> = ({ route }) => {
  const { group } = route.params;
  const theme = useTheme();
  const [bannedMembers, setBannedMembers] = useState<CometChat.GroupMember[]>([]);

  useEffect(() => {
    loadBannedMembers();
  }, [group]);

  const loadBannedMembers = async () => {
    try {
      const request = new CometChat.BannedMembersRequestBuilder(group)
        .setLimit(50)
        .build();
      const members = await request.fetch();
      setBannedMembers(members || []);
    } catch (error) {
      console.error('Error loading banned members:', error);
    }
  };

  const handleUnban = useCallback(async (uid: string) => {
    try {
      await CometChat.unbanGroupMember(group.getGuid(), uid);
      loadBannedMembers();
    } catch (error) {
      console.error('Error unbanning member:', error);
    }
  }, [group]);

  const renderItem = ({ item }: { item: CometChat.GroupMember }) => {
    const user = item as any;
    return (
      <View style={[styles.memberItem, { backgroundColor: theme.color.background1 }]}>
        <CometChatAvatar
          name={user.getName?.() || user.getUid?.()}
          image={user.getAvatar?.() ? { uri: user.getAvatar() } : undefined}
        />
        <View style={styles.memberInfo}>
          <Text style={[styles.memberName, { color: theme.color.textPrimary }]}>
            {user.getName?.() || user.getUid?.()}
          </Text>
          <Text style={[styles.memberUid, { color: theme.color.textSecondary }]}>
            @{user.getUid?.()}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.unbanButton, { borderColor: theme.color.primary }]}
          onPress={() => handleUnban(user.getUid?.())}
        >
          <Text style={[styles.unbanText, { color: theme.color.primary }]}>
            Unban
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.color.background1 }]}>
      {bannedMembers.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.color.textSecondary }]}>
            No banned members
          </Text>
        </View>
      ) : (
        <FlatList
          data={bannedMembers}
          keyExtractor={(item, index) => `${item.getUid?.() || index}`}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={[styles.separator, { borderBottomColor: theme.color.borderLight }]} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
  },
  memberUid: {
    fontSize: 13,
    marginTop: 2,
  },
  unbanButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  unbanText: {
    fontSize: 14,
    fontWeight: '600',
  },
  separator: {
    borderBottomWidth: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});

export default BannedMember;

// @ts-nocheck

