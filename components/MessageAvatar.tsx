import { View } from 'react-native';
import Avatar from './Avatar';

interface MessageAvatarProps {
  message?: any;
  visible?: boolean;
  alignment?: 'left' | 'right';
}

const MessageAvatar = ({ message, visible = true, alignment = 'left' }: MessageAvatarProps) => {
  if (!visible) return <View style={{ width: 28, height: 28 }} />;

  return (
    <View style={{ width: 28, height: 28 }}>
      <Avatar
        size={28}
        name={message?.from || 'Unknown'}
        fontSize={14}
        imageUrl={undefined}
        placeholderType="text"
      />
    </View>
  );
};

export default MessageAvatar;
