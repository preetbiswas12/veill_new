// @ts-nocheck
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CometChatAvatar, useTheme } from '@cometchat/chat-uikit-react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../../navigation/types';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Info from '../../../assets/icons/Info';
import { CommonUtils } from '../../../utils/CommonUtils';

type Props = StackScreenProps<RootStackParamList, 'UserInfo'>;

const UserInfo: React.FC<Props> = ({ route }) => {
  const { user } = route.params;
  const theme = useTheme();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [isBlocked, setIsBlocked] = useState(user.getBlockedByMe?.() || false);
  const [localUser, setLocalUser] = useState(user);

  useEffect(() => {
    setLocalUser(CommonUtils.clone(user));
  }, [user]);

  const handleBlock = useCallback(async () => {
    try {
      if (isBlocked) {
        await CometChat.unblockUsers([localUser.getUid()]);
        setIsBlocked(false);
      } else {
        await CometChat.blockUsers([localUser.getUid()]);
        setIsBlocked(true);
      }
    } catch (error) {
      console.error('Block/unblock failed:', error);
    }
  }, [isBlocked, localUser]);

  const handleClearChat = useCallback(async () => {
    try {
      await CometChat.deleteConversation(
        localUser.getUid(),
        CometChat.RECEIVER_TYPE.USER,
      );
    } catch (error) {
      console.error('Clear chat failed:', error);
    }
  }, [localUser]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.color.background1 }]}>
      <View style={styles.header}>
        <CometChatAvatar
          name={localUser.getName()}
          image={localUser.getAvatar() ? { uri: localUser.getAvatar() } : undefined}
        />
        <Text style={[styles.name, { color: theme.color.textPrimary }]}>
          {localUser.getName() || localUser.getUid()}
        </Text>
        <Text style={[styles.uid, { color: theme.color.textSecondary }]}>
          @{localUser.getUid()}
        </Text>
      </View>

      <View style={[styles.section, { borderTopColor: theme.color.borderLight }]}>
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: theme.color.background1 }]}
          onPress={handleBlock}
        >
          <Text style={[styles.menuText, { color: theme.color.textPrimary }]}>
            {isBlocked ? 'Unblock User' : 'Block User'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: theme.color.background1 }]}
          onPress={handleClearChat}
        >
          <Text style={[styles.menuText, { color: theme.color.textPrimary }]}>
            Clear Chat
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 12,
  },
  uid: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    borderTopWidth: 1,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuText: {
    fontSize: 16,
  },
});

export default UserInfo;

// @ts-nocheck

