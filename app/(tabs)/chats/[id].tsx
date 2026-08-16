import ChatMessageBox from '@/components/ChatMessageBox';
import ReplyMessageBar from '@/components/ReplyMessageBar';
import Colors from '@/constants/Colors';
import Fonts from '@/constants/Fonts';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  ImageBackground,
  StyleSheet,
  Text,
  View,
  ActionSheetIOS,
  Platform,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { alert } from '@/utils/customAlert';
import { Swipeable } from 'react-native-gesture-handler';
import {
  GiftedChat,
  Bubble,
  InputToolbar,
  Send,
  SystemMessage,
  IMessage,
  BubbleProps,
} from 'react-native-gifted-chat';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import chats from '@/assets/data/chats.json';
import ChatService, { ChatMessage as ServiceChatMessage } from '@/utils/chat';
import EncryptionService from '@/utils/encryption';
import AuthService from '@/utils/auth';

const Page = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<ServiceChatMessage[]>([]);
  const [text, setText] = useState('');
  const insets = useSafeAreaInsets();
  const [replyMessage, setReplyMessage] = useState<ServiceChatMessage | null>(null);
  const swipeableRowRef = useRef<Swipeable | null>(null);
  const [chatContact, setChatContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [peerId, setPeerId] = useState<number | null>(null);

  useEffect(() => {
    const initChat = async () => {
      const contact = chats.find((c) => c.id === id);
      setChatContact(contact);

      const numericPeerId = parseInt(id.replace(/\D/g, '').slice(0, 8)) || Date.now();
      setPeerId(numericPeerId);

      const storedMessages = await ChatService.loadMessages(numericPeerId);
      if (storedMessages.length > 0) {
        setMessages(storedMessages);
      } else {
        setMessages([]);
      }

      const peerKey = await EncryptionService.getPeerKey(String(numericPeerId));
      if (!peerKey && contact) {
        const demoPublicKey = await generateDemoPublicKey();
        await EncryptionService.setPeerKey(String(numericPeerId), demoPublicKey);
      }

      setLoading(false);
    };
    initChat();
  }, [id]);

  useEffect(() => {
    if (!peerId) return;

    const unsubscribeMessage = ChatService.onMessage((newMessages) => {
      setMessages((prev) => {
        const updated = [...prev, ...newMessages];
        return updated.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      });
    });

    return () => {
      unsubscribeMessage();
    };
  }, [peerId]);

  const generateDemoPublicKey = async (): Promise<string> => {
    const keyPair = await EncryptionService.generateKeyPair();
    return keyPair.publicKey;
  };

  const onSend = useCallback(
    async (newMessages: IMessage[] = []) => {
      if (!peerId) return;

      for (const msg of newMessages) {
        const result = await ChatService.sendMessage(peerId, msg.text);
        if (!result.success) {
          alert('Error', result.error || 'Failed to send message');
        }
      }

      setReplyMessage(null);
      Keyboard.dismiss();
    },
    [peerId]
  );

  const showActionsheet = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Camera', 'Photo Library', 'Document', 'Location', 'Contact'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          handleActionPress(buttonIndex);
        }
      );
    } else {
      alert('Send Attachments', 'Choose an option', [
        { text: 'Camera', onPress: () => handleActionPress(1) },
        { text: 'Photo Library', onPress: () => handleActionPress(2) },
        { text: 'Document', onPress: () => handleActionPress(3) },
        { text: 'Location', onPress: () => handleActionPress(4) },
        { text: 'Contact', onPress: () => handleActionPress(5) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handleActionPress = async (index: number) => {
    if (!peerId) return;
    switch (index) {
      case 1:
        const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraPerm.granted) {
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.7,
          });
          if (!result.canceled && result.assets[0]) {
            await ChatService.sendImage(peerId, result.assets[0].uri);
          }
        } else {
          alert('Permission Required', 'Camera access is needed to take photos.');
        }
        break;
      case 2:
        const libraryPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (libraryPerm.granted) {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.7,
            allowsMultipleSelection: true,
          });
          if (!result.canceled && result.assets[0]) {
            await ChatService.sendImage(peerId, result.assets[0].uri);
          }
        } else {
          alert('Permission Required', 'Photo library access is needed to send images.');
        }
        break;
      case 3:
        alert('Document', 'Document picker coming soon.');
        break;
      case 4:
        alert('Location', 'Location sharing coming soon.');
        break;
      case 5:
        alert('Contact', 'Contact sharing coming soon.');
        break;
    }
  };

  const handleCameraPress = () => {
    handleActionPress(1);
  };

  const handleMicPress = () => {
    alert('Voice Message', 'Hold to record a voice message.');
  };

  const updateRowRef = useCallback(
    (ref: any) => {
      if (
        ref &&
        replyMessage &&
        ref.props.children.props.currentMessage?._id === replyMessage._id
      ) {
        swipeableRowRef.current = ref;
      }
    },
    [replyMessage]
  );

  useEffect(() => {
    if (replyMessage && swipeableRowRef.current) {
      swipeableRowRef.current.close();
      swipeableRowRef.current = null;
    }
  }, [replyMessage]);

  const renderInputToolbar = (props: any) => {
    return (
      <InputToolbar
        {...props}
        containerStyle={{ backgroundColor: Colors.background }}
        renderActions={() => (
          <View style={{ height: 44, justifyContent: 'center', alignItems: 'center', left: 5 }}>
            <Ionicons
              name="add-circle"
              color={Colors.text}
              size={30}
              onPress={showActionsheet}
            />
          </View>
        )}
      />
    );
  };

  const renderBubble = (props: BubbleProps<IMessage>) => {
    const currentMessage = props.currentMessage as any;
    return (
      <View>
        <Bubble
          {...props}
          textStyle={{
            right: { color: Colors.text, fontFamily: Fonts.body },
            left: { color: Colors.text, fontFamily: Fonts.body },
          }}
          wrapperStyle={{
            left: { backgroundColor: Colors.card },
            right: { backgroundColor: Colors.lightGreen },
          }}
        />
        {currentMessage?.replyTo && (
          <View
            style={{
              backgroundColor:
                props.position === 'right' ? '#C7F4BA' : '#F0F0F0',
              paddingHorizontal: 10,
              paddingVertical: 6,
              marginHorizontal: 12,
              marginTop: -2,
              marginBottom: 2,
              borderRadius: 6,
              borderLeftWidth: 3,
              borderLeftColor:
                props.position === 'right' ? '#4CAF50' : Colors.primary,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons
                name="return-down-back-outline"
                size={12}
                color={Colors.text}
              />
              <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.text }}>
                {currentMessage.replyTo.user?.name || 'Unknown'}
              </Text>
            </View>
            <Text
              numberOfLines={2}
              style={{ fontSize: 12, color: Colors.text, marginTop: 2 }}>
              {currentMessage.replyTo.text}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const giftedChatMessages = messages.map((msg) => ({
    _id: msg._id,
    text: msg.text,
    createdAt: new Date(msg.createdAt),
    user: msg.user,
  }));

  if (loading) {
    return (
      <ImageBackground
        source={require('@/assets/images/chat-bg.png')}
        style={{
          flex: 1,
          backgroundColor: Colors.background,
          marginBottom: insets.bottom,
        }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ color: Colors.text, marginTop: 12 }}>Loading encrypted messages...</Text>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require('@/assets/images/chat-bg.png')}
      style={{
        flex: 1,
        backgroundColor: Colors.background,
        marginBottom: insets.bottom,
      }}>
      <GiftedChat
        messages={giftedChatMessages}
        onSend={(messages: any) => onSend(messages)}
        onInputTextChanged={setText}
        user={{ _id: 1 }}
        renderSystemMessage={(props) => (
          <SystemMessage {...props} textStyle={{ color: Colors.text }} />
        )}
        bottomOffset={insets.bottom}
        renderAvatar={null}
        maxComposerHeight={100}
        textInputProps={styles.composer}
        renderBubble={renderBubble}
        renderSend={(props) => (
          <View
            style={{
              height: 44,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              paddingHorizontal: 14,
            }}>
            {text === '' && (
              <>
                <Ionicons
                  name="camera-outline"
                  color={Colors.text}
                  size={28}
                  onPress={handleCameraPress}
                />
                <Ionicons
                  name="mic-outline"
                  color={Colors.text}
                  size={28}
                  onPress={handleMicPress}
                />
              </>
            )}
            {text !== '' && (
              <Send
                {...props}
                containerStyle={{ justifyContent: 'center' }}>
                <Ionicons name="send" color={Colors.text} size={28} />
              </Send>
            )}
          </View>
        )}
        renderInputToolbar={renderInputToolbar}
        renderChatFooter={() => (
          <ReplyMessageBar clearReply={() => setReplyMessage(null)} message={replyMessage} />
        )}
        onLongPress={(context, message) => setReplyMessage(message as ServiceChatMessage)}
        renderMessage={(props) => (
          <ChatMessageBox
            {...props}
            setReplyOnSwipeOpen={(message) => setReplyMessage(message as ServiceChatMessage)}
            updateRowRef={updateRowRef}
          />
        )}
      />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  composer: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    paddingHorizontal: 10,
    paddingTop: 8,
    fontSize: 16,
    marginVertical: 4,
  },
});

export default Page;