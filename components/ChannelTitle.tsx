import { Text } from 'react-native';

interface ChannelTitleProps {
  channel: { id: string; name?: string };
  className?: string;
}

const ChannelTitle = ({
  channel,
  className = 'text-base font-bold',
}: ChannelTitleProps) => {
  const channelName = channel.name || channel.id || 'Unknown';
  return <Text className={className}>{channelName}</Text>;
};

export default ChannelTitle;
