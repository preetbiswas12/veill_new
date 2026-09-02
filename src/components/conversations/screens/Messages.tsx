// @ts-nocheck
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Text,
  BackHandler,
  Platform,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import {
  CometChatUIKit,
  CometChatMessageHeader,
  CometChatMessageList,
  CometChatMessageComposer,
  useTheme,
  CometChatUIEventHandler,
  CometChatUIEvents,
  ChatConfigurator,
  useCometChatTranslation,
  Icon,
  CometChatAIAssistantChatHistory,
  CometChatAIAssistantTools,
} from '@cometchat/chat-uikit-react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../../navigation/types';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import Info from '../../../assets/icons/Info';
import { CommonUtils } from '../../../utils/CommonUtils';
import { useActiveChat } from '../../../utils/ActiveChatContext';
import { useConfig } from '../../../config/store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import dailyCallService from '../../../../utils/daily';

const { width } = Dimensions.get('window');

type Props = StackScreenProps<RootStackParamList, 'Messages'>;

const Messages: React.FC<Props> = ({ route, navigation }) => {
  const {
    user,
    group,
    fromMention = false,
    fromMessagePrivately = false,
    parentMessageId: routeParentMessageId,
  } = route.params;
  const typingIndicator = useConfig(
    (state) => state.settings.chatFeatures.coreMessagingExperience.typingIndicator
  );
  const threadConversationAndReplies = useConfig(
    (state) => state.settings.chatFeatures.coreMessagingExperience.threadConversationAndReplies
  );
  const photosSharing = useConfig(
    (state) => state.settings.chatFeatures.coreMessagingExperience.photosSharing
  );
  const videoSharing = useConfig(
    (state) => state.settings.chatFeatures.coreMessagingExperience.videoSharing
  );
  const audioSharing = useConfig(
    (state) => state.settings.chatFeatures.coreMessagingExperience.audioSharing
  );
  const fileSharing = useConfig(
    (state) => state.settings.chatFeatures.coreMessagingExperience.fileSharing
  );
  const editMessage = useConfig(
    (state) => state.settings.chatFeatures.coreMessagingExperience.editMessage
  );
  const deleteMessage = useConfig(
    (state) => state.settings.chatFeatures.coreMessagingExperience.deleteMessage
  );
  const messageDeliveryAndReadReceipts = useConfig(
    (state) => state.settings.chatFeatures.coreMessagingExperience.messageDeliveryAndReadReceipts
  );
  const userAndFriendsPresence = useConfig(
    (state) => state.settings.chatFeatures.coreMessagingExperience.userAndFriendsPresence
  );
  const mentions = useConfig(
    (state) => state.settings.chatFeatures.deeperUserEngagement.mentions
  );
  const reactions = useConfig(
    (state) => state.settings.chatFeatures.deeperUserEngagement.reactions
  );
  const messageTranslation = useConfig(
    (state) => state.settings.chatFeatures.deeperUserEngagement.messageTranslation
  );
  const polls = useConfig(
    (state) => state.settings.chatFeatures.deeperUserEngagement.polls
  );
  const collaborativeWhiteboard = useConfig(
    (state) => state.settings.chatFeatures.deeperUserEngagement.collaborativeWhiteboard
  );
  const collaborativeDocument = useConfig(
    (state) => state.settings.chatFeatures.deeperUserEngagement.collaborativeDocument
  );
  const voiceNotes = useConfig(
    (state) => state.settings.chatFeatures.deeperUserEngagement.voiceNotes
  );
  const stickers = useConfig(
    (state) => state.settings.chatFeatures.deeperUserEngagement.stickers
  );
  const userInfo = useConfig(
    (state) => state.settings.chatFeatures.deeperUserEngagement.userInfo
  );
  const groupInfo = useConfig(
    (state) => state.settings.chatFeatures.deeperUserEngagement.groupInfo
  );
  const sendPrivateMessageToGroupMembers = useConfig(
    (state) => state.settings.chatFeatures.privateMessagingWithinGroups.sendPrivateMessageToGroupMembers
  );
  const oneOnOneVoiceCalling = useConfig(
    (state) => state.settings.callFeatures.voiceAndVideoCalling.oneOnOneVoiceCalling
  );
  const oneOnOneVideoCalling = useConfig(
    (state) => state.settings.callFeatures.voiceAndVideoCalling.oneOnOneVideoCalling
  );
  const groupVideoConference = useConfig(
    (state) => state.settings.callFeatures.voiceAndVideoCalling.groupVideoConference
  );
  const groupVoiceConference = useConfig(
    (state) => state.settings.callFeatures.voiceAndVideoCalling.groupVoiceConference
  );
  const loggedInUser = useRef<CometChat.User>(
    CometChatUIKit.loggedInUser!,
  ).current;
  const theme = useTheme();
  const { t } = useCometChatTranslation();
  const themeRef = useRef(theme);
  const navigationRef = useRef(navigation);
  const routeRef = useRef(route);
  const userListenerId = 'app_messages' + new Date().getTime();
  const openmessageListenerIdRef = useRef('message_' + new Date().getTime());
  const lastOpenChatRef = useRef<{ uid: string; time: number } | null>(null);
  const [localUser, setLocalUser] = useState<CometChat.User | undefined>(user);
  const [messageListKey, setMessageListKey] = useState(0);
  const [messageComposerKey, setMessageComposerKey] = useState(0);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [parentMessageId, setParentMessageId] = useState<string | undefined>(routeParentMessageId);

  const { setActiveChat } = useActiveChat();
  const insets = useSafeAreaInsets();

  const messageComposerRef = useRef<any>(null);

  const slideAnim = useRef(new Animated.Value(width)).current;

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

  const isAgenticUser = useCallback((): boolean => {
    if (localUser) {
      return localUser.getRole?.() === '@agentic';
    }
    return false;
  }, [localUser]);
  const agentic = isAgenticUser();

  useEffect(() => {
    if (user) {
      setActiveChat({ type: 'user', id: user.getUid() });
    } else if (group) {
      setActiveChat({ type: 'group', id: group.getGuid() });
    }

    return () => {
      setActiveChat(null);
      if (messageComposerRef.current?.resetStreaming) {
        messageComposerRef.current.resetStreaming();
      }
    };
  }, [user, group, setActiveChat]);

  useEffect(() => {
    const backAction = () => {
      if (fromMention || fromMessagePrivately) {
        navigation.goBack();
      } else {
        navigation.popToTop();
      }
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );
    return () => backHandler.remove();
  }, [navigation, fromMention, fromMessagePrivately]);

  useEffect(() => {
    CometChatUIEventHandler.addUserListener(userListenerId, {
      ccUserBlocked: (item: { user: CometChat.User }) =>
        handleccUserBlocked(item),
      ccUserUnBlocked: (item: { user: CometChat.User }) =>
        handleccUserUnBlocked(item),
    });

    const currentListenerId = openmessageListenerIdRef.current;
    if (group) {
      CometChatUIEventHandler.addUIListener(currentListenerId, {
        openChat: ({ user: chatUser }) => {
          if (!chatUser) return;

          try {
            const uid = chatUser.getUid();

            const now = Date.now();
            if (
              lastOpenChatRef.current &&
              lastOpenChatRef.current.uid === uid &&
              now - lastOpenChatRef.current.time < 800
            ) {
              return;
            }

            const state = navigation.getState();
            const routes = state?.routes || [];
            const topRoute = routes[routes.length - 1];

            if (
              topRoute?.name === 'Messages' &&
              (topRoute as any)?.params?.user?.getUid &&
              (topRoute as any).params.user.getUid() === uid
            ) {
              return;
            }

            const existingIndex = routes.findIndex(
              r =>
                r.name === 'Messages' &&
                (r as any)?.params?.user?.getUid &&
                (r as any).params.user.getUid() === uid,
            );
            if (existingIndex !== -1) {
              const popCount = routes.length - existingIndex - 1;
              if (popCount > 0) {
                navigation.pop(popCount);
              }
              return;
            }

            lastOpenChatRef.current = { uid, time: now };
            navigation.push('Messages', { user: chatUser, fromMessagePrivately: true });
          } catch (e) {
            console.warn('openChat navigation prevented due to error', e);
          }
        },
      });
    }

    const blurSub = navigation.addListener('blur', () => {
      CometChatUIEventHandler.emitUIEvent?.(CometChatUIEvents.hidePanel, {
        alignment: 'composerBottom',
        child: () => null,
        panelId: 'sticker',
      });
    });
    const focusSub = navigation.addListener('focus', () => {
      setMessageComposerKey(prev => prev + 1);
    });

    return () => {
      CometChatUIEventHandler.removeUserListener(userListenerId);
      if (group) {
        CometChatUIEventHandler.removeUIListener(currentListenerId);
      }
      blurSub();
      focusSub();
    };
  }, [navigation, group, userListenerId]);

  const handleccUserBlocked = ({ user: blockedUser }: { user: CometChat.User }) => {
    setLocalUser(CommonUtils.clone(blockedUser));
  };

  const handleccUserUnBlocked = ({ user: unblockedUser }: { user: CometChat.User }) => {
    setLocalUser(CommonUtils.clone(unblockedUser));
  };

  const handleNewChatClick = useCallback(() => {
    if (messageComposerRef.current?.resetStreaming) {
      messageComposerRef.current.resetStreaming();
    }
    setParentMessageId(undefined);
    setMessageListKey(prev => prev + 1);
    setMessageComposerKey(prev => prev + 1);
    setShowHistoryModal(false);
    navigation.replace('Messages', {
      user,
      group,
    });
  }, [navigation, user, group]);

  const handleChatHistoryClick = useCallback(() => {
    setShowHistoryModal(true);
  }, []);

  const handleHistoryMessageClick = useCallback(
    (message: CometChat.BaseMessage) => {
      if (messageComposerRef.current && messageComposerRef.current.stopStreaming) {
        messageComposerRef.current.stopStreaming();
      }
      setShowHistoryModal(false);
      setParentMessageId(message.getId().toString());
      setMessageListKey(prev => prev + 1);
      setMessageComposerKey(prev => prev + 1);
    },
    [],
  );

  const handleChatHistoryError = useCallback(
    (_error: CometChat.CometChatException) => {},
    [],
  );

  const unblock = async (userToUnblock: CometChat.User) => {
    const uid = userToUnblock.getUid();
    try {
      await CometChat.unblockUsers([uid]);
      const unBlockedUser = await CometChat.getUser(uid);
      if (unBlockedUser) {
        setLocalUser(unBlockedUser);
        CometChatUIEventHandler.emitUserEvent(
          CometChatUIEvents.ccUserUnBlocked,
          { user: unBlockedUser },
        );
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
    }
  };

  const getTrailingView = ({
    user: currentUser,
    group: currentGroup,
  }: {
    user?: CometChat.User;
    group?: CometChat.Group;
  }) => {
    if (currentGroup) {
      if (!loggedInUser) {
        return <></>;
      }
      return (
        <View style={styles.appBarContainer}>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('GroupInfo', { group: currentGroup });
            }}
          >
            <Icon
              icon={
                <Info color={theme.color.iconPrimary} height={24} width={24} />
              }
            />
          </TouchableOpacity>
        </View>
      );
    }

    if (currentUser && !currentUser.getBlockedByMe()) {
      return (
        <View style={styles.appBarContainer}>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('UserInfo', { user: currentUser });
            }}
          >
            <Icon
              icon={
                <Info color={theme.color.iconPrimary} height={24} width={24} />
              }
            />
          </TouchableOpacity>
        </View>
      );
    } else {
      return <></>;
    }
  };

  const getMentionsTap = useCallback(() => {
    const mentionsFormatter =
      ChatConfigurator.getDataSource().getMentionsFormatter(
        loggedInUser,
        theme,
      );
    if (user) mentionsFormatter.setUser(user);
    if (group) mentionsFormatter.setGroup(group);

    mentionsFormatter.setOnMentionClick(
      (_message: CometChat.BaseMessage, uid: string) => {
        if (uid !== loggedInUser.getUid()) {
          CometChat.getUser(uid)
            .then((mentionedUser: CometChat.User) => {
              navigation.push('Messages', {
                user: mentionedUser,
                fromMention: true,
              });
            })
            .catch((error: any) => {
              console.error('Error fetching mentioned user:', error);
            });
        }
      },
    );
    return mentionsFormatter;
  }, [user, group, loggedInUser, navigation, theme]);

  const providerTheme = useMemo(() => {
    // WhatsApp-inspired dark bubble colors
    const outgoingBg = '#005c4b';
    const incomingBg = '#1f2c33';
    const textOnBubble = '#E9EDEF';
    const composerBg = '#202c33';
    const listBg = '#0a0a0a';

    // Light mode WhatsApp colors
    const lightOutgoingBg = '#d9fdd3';
    const lightIncomingBg = '#fff';
    const lightTextOnBubble = '#111b21';
    const lightComposerBg = '#f0f2f5';

    const darkStyles = {
      mode: 'dark' as const,
      color: { ...theme?.color, background: listBg },
      messageListStyles: {
        backgroundStyle: { backgroundColor: listBg },
        outgoingMessageBubbleStyles: {
          containerStyle: { backgroundColor: outgoingBg },
          textBubbleStyles: { textStyle: { color: textOnBubble } },
          dateStyles: { textStyle: { color: 'rgba(233,237,239,0.7)' } },
        },
        incomingMessageBubbleStyles: {
          containerStyle: { backgroundColor: incomingBg },
          textBubbleStyles: { textStyle: { color: textOnBubble } },
          dateStyles: { textStyle: { color: 'rgba(233,237,239,0.7)' } },
        },
      },
      messageComposerStyles: {
        containerStyle: { backgroundColor: composerBg },
        textContainerStyle: { backgroundColor: '#2a3942', borderColor: '#3b4a54' },
      },
    };

    const lightStyles = {
      mode: 'light' as const,
      color: { ...theme?.color, background: '#fff' },
      messageListStyles: {
        backgroundStyle: { backgroundColor: '#fff' },
        outgoingMessageBubbleStyles: {
          containerStyle: { backgroundColor: lightOutgoingBg },
          textBubbleStyles: { textStyle: { color: lightTextOnBubble } },
          dateStyles: { textStyle: { color: '#667781' } },
      },
        incomingMessageBubbleStyles: {
          containerStyle: { backgroundColor: lightIncomingBg },
          textBubbleStyles: { textStyle: { color: lightTextOnBubble } },
          dateStyles: { textStyle: { color: '#667781' } },
        },
      },
      messageComposerStyles: {
        containerStyle: { backgroundColor: lightComposerBg },
        textContainerStyle: { backgroundColor: '#fff' },
      },
    };

    return {
      mode: theme?.mode || 'dark',
      dark: darkStyles,
      light: lightStyles,
    };
  }, [theme]);

  return (
    <CometChatThemeProvider theme={providerTheme}>
      <View style={styles.flexOne}>
        <CometChatMessageHeader
          user={localUser}
          group={group}
          onBack={() => {
            if (fromMention || fromMessagePrivately) {
              navigation.goBack();
            } else {
              navigation.popToTop();
            }
          }}
          TrailingView={getTrailingView}
          showBackButton={true}
          usersStatusVisibility={userAndFriendsPresence}
          hideVoiceCallButton={
            (user && !oneOnOneVoiceCalling) || (group && !groupVoiceConference)
          }
          hideVideoCallButton={
            (user && !oneOnOneVideoCalling) || (group && !groupVideoConference)
          }
          hideChatHistoryButton={false}
          hideNewChatButton={false}
          onChatHistoryButtonClick={handleChatHistoryClick}
          onNewChatButtonClick={handleNewChatClick}
          onVoiceCall={async () => {
            if (!user) return;
            const peer = {
              id: user.getUid(),
              name: user.getName(),
              image: user.getAvatar(),
            };
            try {
              await dailyCallService.startOutgoingCall(peer, false);
            } catch (err) {
              console.warn('[Messages] Voice call failed:', err);
            }
            const currentCall = dailyCallService.getState().call;
            navigation.navigate('CallScreen', { incoming: currentCall });
          }}
          onVideoCall={async () => {
            if (!user) return;
            const peer = {
              id: user.getUid(),
              name: user.getName(),
              image: user.getAvatar(),
            };
            try {
              await dailyCallService.startOutgoingCall(peer, true);
            } catch (err) {
              console.warn('[Messages] Video call failed:', err);
            }
            const currentCall = dailyCallService.getState().call;
            navigation.navigate('CallScreen', { incoming: currentCall });
          }}
        />
        <View style={styles.flexOne}>
          <CometChatMessageList
            key={messageListKey}
            textFormatters={[getMentionsTap()]}
            user={user}
            group={group}
            parentMessageId={parentMessageId}
            onThreadRepliesPress={(messageObject, _messageBubbleView) => {
              CometChatUIEventHandler.emitUIEvent?.(
                CometChatUIEvents.hidePanel,
                {
                  alignment: 'composerBottom',
                  child: () => null,
                },
              );
              navigation.navigate('ThreadView', { message: messageObject, user, group });
            }}
            hideReplyInThreadOption={!threadConversationAndReplies}
            hideEditMessageOption={!editMessage}
            hideDeleteMessageOption={!deleteMessage}
            receiptsVisibility={messageDeliveryAndReadReceipts}
            hideTranslateMessageOption={!messageTranslation}
            hideReactionOption={!reactions}
            hideMessagePrivatelyOption={!sendPrivateMessageToGroupMembers}
            aiAssistantTools={new CometChatAIAssistantTools({
              getCurrentWeather: (args: any) => console.log('Weather args', args),
            })}
            streamingSpeed={10}
          />
        </View>

        {agentic && (
          <Modal visible={showHistoryModal} transparent animationType="none" onRequestClose={() => setShowHistoryModal(false)}>
            <View style={drawerStyles.backdrop}>
              <Animated.View
                style={[
                  drawerStyles.drawer,
                  {
                    backgroundColor: theme.color.background1,
                    paddingTop: Platform.OS === 'ios' ? insets.top : 0,
                  },
                  { transform: [{ translateX: slideAnim }] },
                ]}
              >
                <CometChatAIAssistantChatHistory
                  user={localUser}
                  group={group}
                  onClose={() => setShowHistoryModal(false)}
                  onMessageClicked={handleHistoryMessageClick}
                  onError={handleChatHistoryError}
                  onNewChatButtonClick={handleNewChatClick}
                />
              </Animated.View>
            </View>
          </Modal>
        )}

        {localUser?.getBlockedByMe() ? (
          <View
            style={[
              styles.blockedContainer,
              { backgroundColor: theme.color.background3 },
            ]}
          >
            <Text
              style={[
                theme.typography.button.regular,
                {
                  color: theme.color.textSecondary,
                  textAlign: 'center',
                  paddingBottom: 10,
                },
              ]}
            >
              {t('BLOCKED_USER_DESC')}
            </Text>
            <TouchableOpacity
              onPress={() => unblock(localUser)}
              style={[styles.button, { borderColor: theme.color.borderDefault }]}
            >
              <Text
                style={[
                  theme.typography.button.medium,
                  styles.buttontext,
                  { color: theme.color.textPrimary },
                ]}
              >
                {t('UNBLOCK')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <CometChatMessageComposer
            key={messageComposerKey}
            ref={messageComposerRef}
            parentMessageId={parentMessageId}
            user={localUser}
            group={group}
            keyboardAvoidingViewProps={{
              ...(Platform.OS === 'android'
                ? {}
                : { behavior: 'padding' }),
            }}
            disableTypingEvents={!typingIndicator}
            hideImageAttachmentOption={!photosSharing}
            hideVideoAttachmentOption={!videoSharing}
            hideAudioAttachmentOption={!audioSharing}
            hideFileAttachmentOption={!fileSharing}
            hideCameraOption={!photosSharing}
            disableMentions={!mentions}
            hideStickersButton={!stickers}
            hideCollaborativeDocumentOption={!collaborativeDocument}
            hideCollaborativeWhiteboardOption={!collaborativeWhiteboard}
            hidePollsAttachmentOption={!polls}
            hideVoiceRecordingButton={!voiceNotes}
          />
        )}
      </View>
    </CometChatThemeProvider>
  );
};

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  blockedContainer: {
    alignItems: 'center',
    height: 90,
    paddingVertical: 10,
  },
  button: {
    flex: 1,
    justifyContent: 'center',
    borderWidth: 2,
    width: '90%',
    borderRadius: 8,
  },
  buttontext: {
    paddingVertical: 5,
    textAlign: 'center',
    alignContent: 'center',
  },
  appBarContainer: {
    flexDirection: 'row',
    marginLeft: 16,
  },
});

const drawerStyles = StyleSheet.create({
  backdrop: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  drawer: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
});

export default Messages;
