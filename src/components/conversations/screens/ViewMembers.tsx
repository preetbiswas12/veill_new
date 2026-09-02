// @ts-nocheck
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CometChatAvatar, useTheme } from '@cometchat/chat-uikit-react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../../navigation/types';

type Props = StackScreenProps<RootStackParamList, 'ViewMembers'>;

const ViewMembers: React.FC<Props> = ({ route }) => {
  const { group } = route.params;
  const theme = useTheme();
  const [members, setMembers] = useState<CometChat.GroupMember[]>([]);

  useEffect(() => {
    loadMembers();
  }, [group]);

  const loadMembers = async () => {
    try {
      const request = new CometChat.GroupMembersRequestBuilder(group)
        .setLimit(50)
        .build();
      const fetchedMembers = await request.fetch();
      setMembers(fetchedMembers || []);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const getRoleLabel = (scope: string) => {
    switch (scope) {
      case 'owner': return 'Owner';
      case 'admin': return 'Admin';
      case 'moderator': return 'Moderator';
      default: return 'Member';
    }
  };

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
          <Text style={[styles.memberRole, { color: theme.color.textSecondary }]}>
            {getRoleLabel(item.getScope?.() || 'member')}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.color.background1 }]}>
      <FlatList
        data={members}
        keyExtractor={(item, index) => `${item.getUid?.() || index}`}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={[styles.separator, { borderBottomColor: theme.color.borderLight }]} />}
      />
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
  memberRole: {
    fontSize: 13,
    marginTop: 2,
  },
  separator: {
    borderBottomWidth: 1,
  },
});

export default ViewMembers;

// @ts-nocheck

