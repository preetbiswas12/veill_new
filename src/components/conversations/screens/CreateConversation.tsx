// @ts-nocheck
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import {
  CometChatUIEvents,
  CometChatUIEventHandler,
  useTheme,
} from '@cometchat/chat-uikit-react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../navigation/types';
import { useConfig } from '../../../config/store';

type NavigationProp = StackNavigationProp<RootStackParamList, 'CreateConversation'>;

const CreateConversation: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [uid, setUid] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const createGroup = useConfig(
    (state) => state.settings.chatFeatures.groupManagement.createGroup
  );

  useEffect(() => {
    const unsubscribe = CometChatUIEventHandler.addUIListener('create-conversation', {
      toggleBottomSheet: (data: any) => {
        if (data?.isBottomSheetVisible === false) {
          navigation.goBack();
        }
      },
    });

    return () => {
      CometChatUIEventHandler.removeUIListener('create-conversation');
    };
  }, [navigation]);

  const handleCreateUserChat = useCallback(async () => {
    if (!uid.trim()) {
      Alert.alert('Error', 'Please enter a user ID');
      return;
    }

    setLoading(true);
    try {
      const user = await CometChat.getUser(uid.trim());
      if (user) {
        navigation.navigate('Messages', { user });
        CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.ccToggleBottomSheet, {
          isBottomSheetVisible: false,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'User not found. Please check the UID.');
    } finally {
      setLoading(false);
    }
  }, [uid, navigation]);

  const handleCreateGroup = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    setLoading(true);
    try {
      const group = new CometChat.Group(
        `group_${Date.now()}`,
        name.trim(),
        CometChat.GROUP_TYPE.PUBLIC,
        [],
      );
      const createdGroup = await CometChat.createGroup(group);
      if (createdGroup) {
        navigation.navigate('Messages', { group: createdGroup });
        CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.ccToggleBottomSheet, {
          isBottomSheetVisible: false,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create group.');
    } finally {
      setLoading(false);
    }
  }, [name, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: theme.color.background1 }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.color.textPrimary }]}>
          New Conversation
        </Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.color.textSecondary }]}>
            Start a chat with a user
          </Text>
          <TextInput
            style={[styles.input, { borderColor: theme.color.borderLight, color: theme.color.textPrimary }]}
            placeholder="Enter User ID"
            placeholderTextColor={theme.color.textTertiary}
            value={uid}
            onChangeText={setUid}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.color.primary }]}
            onPress={handleCreateUserChat}
            disabled={loading}
          >
            <Text style={[styles.buttonText, { color: theme.color.staticWhite }]}>
              {loading ? 'Loading...' : 'Start Chat'}
            </Text>
          </TouchableOpacity>
        </View>

        {createGroup && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.color.textSecondary }]}>
              Create a new group
            </Text>
            <TextInput
              style={[styles.input, { borderColor: theme.color.borderLight, color: theme.color.textPrimary }]}
              placeholder="Enter Group Name"
              placeholderTextColor={theme.color.textTertiary}
              value={name}
              onChangeText={setName}
            />
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.color.primary }]}
              onPress={handleCreateGroup}
              disabled={loading}
            >
              <Text style={[styles.buttonText, { color: theme.color.staticWhite }]}>
                {loading ? 'Creating...' : 'Create Group'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateConversation;

// @ts-nocheck

