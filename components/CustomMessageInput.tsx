import { View, TextInput, Alert, Pressable } from 'react-native';
import { OutgoingMedia, useCometChat } from '@/hooks/useCometChat';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import AttachButton from './AttachButton';

/** Typing signals are throttled: one "started" per window, "stopped" on idle. */
const TYPING_THROTTLE_MS = 3_000;

interface CustomMessageInputProps {
  conversationId?: string;
  /** `user` for a direct message, `group` for a group conversation. */
  chatType?: string;
  onSend?: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const CustomMessageInput = ({
  conversationId,
  chatType = 'user',
  onSend,
  placeholder = 'Message',
  disabled = false,
}: CustomMessageInputProps) => {
  const { sendTextMessage, sendMediaMessage, sendTyping } = useCometChat();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const typingActiveRef = useRef(false);
  const typingStartedAtRef = useRef(0);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopTyping = useCallback(() => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (!typingActiveRef.current) return;
    typingActiveRef.current = false;
    sendTyping(conversationId || '', chatType, false);
  }, [sendTyping, conversationId, chatType]);

  const handleChangeText = (value: string) => {
    setText(value);
    if (!conversationId || disabled) return;

    if (!value.length) {
      stopTyping();
      return;
    }

    if (!typingActiveRef.current) {
      const elapsed = Date.now() - typingStartedAtRef.current;
      if (elapsed > TYPING_THROTTLE_MS) {
        typingActiveRef.current = true;
        typingStartedAtRef.current = Date.now();
        sendTyping(conversationId, chatType, true);
      }
    }

    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    stopTimerRef.current = setTimeout(stopTyping, 2_500);
  };

  useEffect(() => stopTyping, [stopTyping]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !conversationId || sending || disabled) return;

    const messageText = text;
    setText('');
    stopTyping();
    if (onSend) {
      onSend(messageText);
      return;
    }

    setSending(true);
    try {
      await sendTextMessage(conversationId, trimmed, chatType);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Put the draft back so a failed send is not silently dropped.
      setText((current) => current || messageText);
    } finally {
      setSending(false);
    }
  };

  const pickAndSend = async (source: 'library' | 'document') => {
    if (!conversationId || sending || disabled) return;

    setSending(true);
    try {
      if (source === 'library') {
        const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!granted) {
          Alert.alert(
            'Permission needed',
            'Allow photo library access to share photos and videos.'
          );
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images', 'videos'],
          quality: 1,
        });
        if (result.canceled || !result.assets?.[0]) return;
        const asset = result.assets[0];
        const media: OutgoingMedia = {
          uri: asset.uri,
          name: asset.fileName || asset.uri.split('/').pop() || 'media',
          kind: asset.type === 'video' ? 'video' : 'image',
          mimeType: asset.mimeType ?? undefined,
          size: asset.fileSize ?? undefined,
        };
        await sendMediaMessage(conversationId, media, chatType);
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: '*/*',
        multiple: false,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const media: OutgoingMedia = {
        uri: asset.uri,
        name: asset.name,
        kind: 'file',
        mimeType: asset.mimeType ?? undefined,
        size: asset.size ?? undefined,
      };
      await sendMediaMessage(conversationId, media, chatType);
    } catch (caught) {
      Alert.alert(
        'Could not send',
        caught instanceof Error ? caught.message : 'The attachment could not be sent.'
      );
    } finally {
      setSending(false);
    }
  };

  const promptAttachment = () => {
    if (!conversationId || sending || disabled) return;
    Alert.alert('Attach', 'What would you like to send?', [
      { text: 'Photo or video', onPress: () => void pickAndSend('library') },
      { text: 'Document', onPress: () => void pickAndSend('document') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // Composer from the Figma input bar: a 32pt attach control, a 15pt-radius white
  // input with a 0.33pt #b2b2b2 border, then camera and mic at 32pt.
  return (
    <View className="bg-panel-blur-warm">
      <View className="flex-row items-center gap-2 pl-[7px] pr-[9px] py-[5.5px]">
        <AttachButton disabled={sending || disabled} onPress={promptAttachment} />
        <View className="flex-1 flex-row items-end gap-4 pl-[10px] pr-[9px] pt-[3px] pb-[2px] rounded-[15px] bg-white border-hair border-input-border">
          <TextInput
            value={text}
            onChangeText={handleChangeText}
            placeholder={placeholder}
            placeholderTextColor="#767779"
            className="flex-1 text-[16px] leading-[21px] text-text-strong"
            style={{ letterSpacing: -0.32 }}
            maxLength={1000}
            multiline
            editable={!disabled}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <Pressable
            onPress={handleSend}
            disabled={!text.trim() || disabled || sending}
            accessibilityRole="button"
            accessibilityLabel="Send"
            hitSlop={8}
          >
            <Feather
              name="arrow-up"
              size={24}
              color={!text.trim() || disabled || sending ? '#b2b2b2' : '#1dab61'}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default CustomMessageInput;
