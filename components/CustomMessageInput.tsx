import { Ionicons } from '@expo/vector-icons';
import { View, TextInput, Alert, Pressable, Text } from 'react-native';
import { OutgoingMedia, useCometChat } from '@/hooks/useCometChat';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import AddMoreSheet from './AddMoreSheet';
import AttachButton from './AttachButton';
import { takePendingCapture } from '@/lib/capture';
import { useTheme } from '@/hooks/useTheme';

/** Typing signals are throttled: one "started" per window, "stopped" on idle. */
const TYPING_THROTTLE_MS = 3_000;

interface ReplyTarget {
  /** CometChat id of the message being replied to. */
  messageId: string;
  sender: string;
  text: string;
}

interface CustomMessageInputProps {
  conversationId?: string;
  /** `user` for a direct message, `group` for a group conversation. */
  chatType?: string;
  onSend?: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Set to show the design's quote bar; cleared once the reply is sent. */
  replyTo?: ReplyTarget | null;
  onClearReply?: () => void;
}

const CustomMessageInput = ({
  conversationId,
  chatType = 'user',
  onSend,
  placeholder = 'Message',
  disabled = false,
  replyTo = null,
  onClearReply,
}: CustomMessageInputProps) => {
  const { colors } = useTheme();
  const router = useRouter();
  const { sendTextMessage, sendMediaMessage, sendTyping } = useCometChat();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
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

  const pickAndSend = async (source: 'library' | 'camera' | 'document') => {
    if (!conversationId || sending || disabled) return;

    setSending(true);
    try {
      if (source === 'library' || source === 'camera') {
        if (source === 'library') {
          const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!granted) {
            Alert.alert(
              'Permission needed',
              'Allow photo library access to share photos and videos.'
            );
            return;
          }
        } else {
          const { granted } = await ImagePicker.requestCameraPermissionsAsync();
          if (!granted) {
            Alert.alert('Permission needed', 'Allow camera access to take a photo.');
            return;
          }
        }
        const result =
          source === 'library'
            ? await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], quality: 1 })
            : await ImagePicker.launchCameraAsync({ mediaTypes: ['images', 'videos'], quality: 1 });
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

  // A capture from the in-app camera arrives in this one-slot store, since the
  // camera is a modal route and cannot hand params back through router.back().
  useEffect(() => {
    const capture = takePendingCapture();
    if (!capture || !conversationId || sending || disabled) return;
    void sendMediaMessage(
      conversationId,
      {
        uri: capture.uri,
        name:
          capture.uri.split('/').pop() ||
          `capture.${capture.kind === 'video' ? 'mp4' : 'jpg'}`,
        kind: capture.kind === 'video' ? 'video' : 'image',
      },
      chatType
    );
  }, [conversationId, chatType, sendMediaMessage, sending, disabled]);

  const promptAttachment = () => {
    if (!conversationId || sending || disabled) return;
    setSheetOpen((open) => !open);
  };

  // Composer from the Figma input bar: a 32pt attach control, a 15pt-radius white
  // input with a 0.33pt #b2b2b2 border, then the send affordance.
  // Opening the attach sheet collapses the input to the design's 43pt.
  return (
    <View>
      {sheetOpen ? (
        <AddMoreSheet
          onPick={(kind) => {
            setSheetOpen(false);
            void pickAndSend(kind);
          }}
          onOpenCamera={() => {
            setSheetOpen(false);
            router.push('/camera');
          }}
          onClose={() => setSheetOpen(false)}
          unavailable={(what) =>
            Alert.alert(what, `${what} is not wired to CometChat yet.`)
          }
        />
      ) : (
        <View className="bg-panel-blur-warm">
          {/* Reply preview from the design: a 4pt quote bar in --quote, the
              sender's name in the same colour, the quoted line beneath, and a
              close control on the trailing edge. */}
          {replyTo ? (
            <View className="flex-row items-stretch">
              <View className="w-1 bg-quote" />
              <View className="flex-1 flex-row items-center gap-4 pl-2 pr-[7.5px] pt-2 pb-[7.5px]">
                <View className="flex-1 min-w-0 gap-[1.5px]">
                  <Text className="text-body-2 font-semibold text-quote" numberOfLines={1}>
                    {replyTo.sender}
                  </Text>
                  <Text className="text-body-3 text-text-strong" numberOfLines={1}>
                    {replyTo.text}
                  </Text>
                </View>
                <Pressable
                  onPress={onClearReply ?? (() => {})}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel reply"
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={24} color={colors['text-muted']} />
                </Pressable>
              </View>
            </View>
          ) : null}

          <View className="flex-row items-center gap-2 pl-[7px] pr-[9px] py-[5.5px]">
            <AttachButton disabled={sending || disabled} onPress={promptAttachment} />
            <View className="flex-1 flex-row items-end gap-4 pl-[10px] pr-[9px] pt-[3px] pb-[2px] rounded-[15px] bg-white border-hair border-input-border">
              <TextInput
                value={text}
                onChangeText={handleChangeText}
                placeholder={placeholder}
                placeholderTextColor={colors['text-muted']}
                className="flex-1 text-[16px] leading-[21px] text-text-strong"
                style={{ letterSpacing: -0.32 }}
                maxLength={1000}
                multiline
                editable={!disabled}
                onSubmitEditing={handleSend}
                blurOnSubmit={false}
              />
              {/* The design parks a 24pt sticker glyph on the input's trailing
                  edge until there is something to send; then a solid brand
                  green circle carrying a white arrow takes its place. */}
              {text.trim() ? (
                <Pressable
                  onPress={handleSend}
                  disabled={disabled || sending}
                  accessibilityRole="button"
                  accessibilityLabel="Send"
                  hitSlop={8}
                  className="h-6 w-6 rounded-full bg-primary items-center justify-center active:opacity-70"
                >
                  <Ionicons name="arrow-up" size={16} color="#ffffff" />
                </Pressable>
              ) : (
                <Pressable
                  onPress={() =>
                    Alert.alert('Stickers', 'Stickers are not connected to CometChat yet.')
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Emoji and stickers"
                  hitSlop={8}
                >
                  <Ionicons name="happy-outline" size={24} color={colors['text-muted']} />
                </Pressable>
              )}
            </View>

            {/* Camera and mic at 32pt on the trailing edge; the mic yields to the
                send button's slot in the input once there is text. */}
            <View className="flex-row items-start pl-1.5">
              <Pressable
                onPress={() => {
                  setSheetOpen(false);
                  void pickAndSend('camera');
                }}
                disabled={sending || disabled}
                accessibilityRole="button"
                accessibilityLabel="Camera"
                hitSlop={6}
              >
                <Ionicons name="camera-outline" size={32} color={colors['text-strong']} />
              </Pressable>
              {!text.trim() ? (
                <Pressable
                  onPress={() => Alert.alert('Voice messages', 'Hold to record is not wired up yet.')}
                  disabled={sending || disabled}
                  accessibilityRole="button"
                  accessibilityLabel="Voice message"
                  hitSlop={6}
                >
                  <Ionicons name="mic-outline" size={32} color={colors['text-strong']} />
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default CustomMessageInput;
