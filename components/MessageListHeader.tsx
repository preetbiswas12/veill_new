import { Feather } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import Avatar from './Avatar';
import { useTheme } from '@/hooks/useTheme';

interface MessageListHeaderProps {
  channel: { id: string; name?: string; image?: string };
  isDMChannel?: boolean;
}

const MessageListHeader = ({ channel, isDMChannel = true }: MessageListHeaderProps) => {
  const { colors } = useTheme();
  const channelName = channel.name || channel.id || 'Unknown';

  const text = isDMChannel
    ? `This is the beginning of your conversation with ${channelName}. Messages are end-to-end encrypted.`
    : 'This is the beginning of this group conversation.';

  return (
    <View className="items-center gap-2 mb-6 mt-2 px-8">
      <Avatar
        name={channelName}
        imageUrl={channel.image}
        size={72}
        fontSize={32}
        placeholderType={isDMChannel ? 'text' : 'icon'}
      />
      <Text className="text-lg font-semibold text-gray-800" numberOfLines={1}>
        {channelName}
      </Text>
      <View className="items-center gap-1.5 mt-1">
        <Feather name="lock" size={13} color={colors['text-muted']} />
        <Text className="text-xs text-text-muted text-center leading-4">{text}</Text>
      </View>
    </View>
  );
};

export default MessageListHeader;
