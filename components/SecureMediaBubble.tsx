import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Linking, Pressable, Text, View } from 'react-native';

import { useSecureMedia, secureMediaIdOf } from '@/lib/secure-media';
import { useTheme } from '@/hooks/useTheme';

import VideoAttachment from './VideoAttachment';

/**
 * What a secured transfer looks like before it is ready.
 *
 * A locked chip with the honest count: how many of the sender's chunks have
 * landed and are waiting for the rest. That count is also the proof the privacy
 * pipeline gives the user that something actually arrived, rather than nothing
 * happening.
 */
const SecureMediaBubble = ({ message, isOwn }: { message: any; isOwn: boolean }) => {
  const { colors } = useTheme();
  const mediaId = secureMediaIdOf(message) || 'unknown';
  const { uri, meta, received, total, error, kind } = useSecureMedia(mediaId);

  // Only the announce carries the metadata; chunks render nothing of their own
  // and are filtered by the thread before it reaches a bubble.
  const label =
    kind === 'image' ? 'Photo' : kind === 'video' ? 'Video' : meta?.name || 'File';

  if (uri) {
    if (kind === 'file') {
      return (
        <Pressable
          onPress={() => void Linking.openURL(uri)}
          accessibilityRole="button"
          accessibilityLabel={`Open decrypted file ${meta?.name || 'file'}`}
          className="flex-1 min-w-0 flex-row items-center gap-2 py-1"
        >
          <Ionicons name="document-text-outline" size={22} color={colors['text-strong']} />
          <View className="flex-1 min-w-0">
            <Text className="text-body-2 font-medium text-text-strong" numberOfLines={2}>
              {meta?.name || 'File'}
            </Text>
            <Text className="text-caption text-text-muted">Decrypted · tap to open</Text>
          </View>
        </Pressable>
      );
    }

    if (kind === 'video') {
      return (
        <View className="rounded-[12px] overflow-hidden">
          <VideoAttachment uri={uri} style={{ width: 216, height: 236 }} />
          <View className="absolute right-1 top-1 flex-row items-center gap-1 rounded-full bg-black/40 px-2 py-0.5">
            <Ionicons name="lock-closed" size={10} color="#ffffff" />
            <Text className="text-[9px] font-medium text-white">Encrypted</Text>
          </View>
        </View>
      );
    }

    return (
      <View className="rounded-[12px] overflow-hidden">
        <Image
          source={{ uri }}
          style={{ width: 216, height: 236 }}
          contentFit="cover"
          transition={150}
          accessibilityLabel="Photo, decrypted"
        />
        {/* The lock is part of the deliverable: a resolved photo still names
            how it got here. */}
        <View className="absolute right-1 top-1 flex-row items-center gap-1 rounded-full bg-black/40 px-2 py-0.5">
          <Ionicons name="lock-closed" size={10} color="#ffffff" />
          <Text className="text-[9px] font-medium text-white">Encrypted</Text>
        </View>
      </View>
    );
  }

  return (
    <View
      className="w-52 rounded-[12px] border-bubble bg-cta-options p-3"
      accessibilityLabel={`Encrypted ${label} transfer`}
    >
      <View className="flex-row items-center gap-2">
        <Ionicons
          name={error ? 'alert-circle-outline' : 'lock-closed'}
          size={18}
          color={error ? colors['text-error'] : colors['text-muted']}
        />
        <View className="flex-1 min-w-0">
          <Text className="text-body-2 font-semibold text-text-strong" numberOfLines={1}>
            {error ? 'Not delivered' : `Encrypted ${label}`}
          </Text>
          <Text className="text-caption text-text-muted">
            {error
              ? error
              : isOwn && !meta
                ? 'Sealing…'
                : `${Math.min(received, total)} of ${total || '?'} parts received`}
          </Text>
        </View>
      </View>

      {!error && total > 0 ? (
        <View className="mt-2 h-1 rounded-full bg-surface-muted overflow-hidden">
          <View
            style={{
              width: `${Math.round((received / Math.max(1, total)) * 100)}%`,
              backgroundColor: colors['product'],
            }}
            className="h-full rounded-full"
          />
        </View>
      ) : null}
    </View>
  );
};

export default SecureMediaBubble;
