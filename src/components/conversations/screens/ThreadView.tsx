// @ts-nocheck
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, BackHandler, Platform, Modal, Animated, Dimensions } from 'react-native';
import {
  CometChatUIKit,
  CometChatMessageHeader,
  CometChatMessageList,
  CometChatMessageComposer,
  useTheme,
  CometChatUIEventHandler,
  CometChatUIEvents,
  ChatConfigurator,
} from '@cometchat/chat-uikit-react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../../navigation/types';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { useConfig } from '../../../config/store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

type Props = StackScreenProps<RootStackParamList, 'ThreadView'>;

const ThreadView: React.FC<Props> = ({ route, navigation }) => {
  const { message, user, group } = route.params;
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const typingIndicator = useConfig(
    (state) => state.settings.chatFeatures.coreMessagingExperience.typingIndicator
  );
  const threadConversationAndReplies = useConfig(
    (state) => state.settings.chatFeatures.coreMessagingExperience.threadConversationAndReplies
  );
  const editMessage = useConfig(
    (state) => state.settings.chatFeatures.coreMessagingExperience.editMessage
  );
  const deleteMessage = useConfig(
    (state) => state.settings.chatFeatures.coreMessagingExperience.deleteMessage
  );
  const reactions = useConfig(
    (state) => state.settings.chatFeatures.deeperUserEngagement.reactions
  );

  const [messageListKey, setMessageListKey] = useState(0);
  const messageComposerRef = useRef<any>(null);
  const slideAnim = useRef(new Animated.Value(width)).current;
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    const backAction = () => {
      navigation.goBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );
    return () => backHandler.remove();
  }, [navigation]);

  useEffect(() => {
    if (showHistoryModal) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showHistoryModal, slideAnim]);

  const getMentionsTap = useCallback(() => {
    const loggedInUser = CometChatUIKit.loggedInUser!;
    const mentionsFormatter =
      ChatConfigurator.getDataSource().getMentionsFormatter(
        loggedInUser,
        theme,
      );
    if (user) mentionsFormatter.setUser(user);
    if (group) mentionsFormatter.setGroup(group);
    return mentionsFormatter;
  }, [user, group, theme]);

  return (
    <View style={[styles.container, { backgroundColor: theme.color.background1 }]}>
      <CometChatMessageHeader
        user={user}
        group={group}
        onBack={() => navigation.goBack()}
        showBackButton={true}
        usersStatusVisibility={true}
        hideVoiceCallButton={true}
        hideVideoCallButton={true}
        hideChatHistoryButton={true}
        hideNewChatButton={true}
      />
      <View style={styles.flexOne}>
        <CometChatMessageList
          key={messageListKey}
          textFormatters={[getMentionsTap()]}
          user={user}
          group={group}
          parentMessageId={message?.getId()?.toString()}
          hideReplyInThreadOption={!threadConversationAndReplies}
          hideEditMessageOption={!editMessage}
          hideDeleteMessageOption={!deleteMessage}
          receiptsVisibility={true}
          hideReactionOption={!reactions}
        />
      </View>
      <CometChatMessageComposer
        ref={messageComposerRef}
        parentMessageId={message?.getId()?.toString()}
        user={user}
        group={group}
        keyboardAvoidingViewProps={{
          ...(Platform.OS === 'android' ? {} : { behavior: 'padding' }),
        }}
        disableTypingEvents={!typingIndicator}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flexOne: {
    flex: 1,
  },
});

export default ThreadView;

// @ts-nocheck

