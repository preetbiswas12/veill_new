// @ts-nocheck
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CometChatAvatar, useTheme } from '@cometchat/chat-uikit-react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../../navigation/types';

type Props = StackScreenProps<RootStackParamList, 'TransferOwnershipSection'>;

const TransferOwnership: React.FC<Props> = ({ route }) => {
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

  const handleTransferOwnership = useCallback(async (uid: string) => {
    Alert.alert(
      'Transfer Ownership',
      'Are you sure you want to transfer group ownership?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Transfer',
          onPress: async () => {
            try {
              await CometChat.transferGroupOwnership(group.getGuid(), uid);
            } catch (error) {
              console.error('Error transferring ownership:', error);
            }
          },
        },
      ],
    );
  }, [group]);

  const renderItem = ({ item }: { item: CometChat.GroupMember }) => {
    const user = item as any;
    if (item.getScope?.() === 'owner') return null;
    return (
      <TouchableOpacity
        style={[styles.memberItem, { backgroundColor: theme.color.background1 }]}
        onPress={() => handleTransferOwnership(user.getUid?.())}
      >
        <CometChatAvatar
          name={user.getName?.() || user.getUid?.()}
          image={user.getAvatar?.() ? { uri: user.getAvatar() } : undefined}
        />
        <View style={styles.memberInfo}>
          <Text style={[styles.memberName, { color: theme.color.textPrimary }]}>
            {user.getName?.() || user.getUid?.()}
          </Text>
        </View>
      </TouchableOpacity>
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
  separator: {
    borderBottomWidth: 1,
  },
});

export default TransferOwnership;

// @ts-nocheck

