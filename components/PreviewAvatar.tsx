import { View } from 'react-native';
import Avatar from './Avatar';

export interface PreviewAvatarProps {
  channel: { id: string; name?: string; image?: string };
  size?: number;
  fontSize?: number;
}

const PreviewAvatar = ({
  channel,
  size = 44,
  fontSize = 20,
}: PreviewAvatarProps) => {
  const isDMChannel = true;
  const displayName = channel.name || channel.id || 'Unknown';
  const displayImage = channel.image;

  return (
    <Avatar
      size={size}
      name={displayName}
      fontSize={fontSize}
      imageUrl={isDMChannel ? displayImage : undefined}
      placeholderType={isDMChannel ? 'text' : 'icon'}
    />
  );
};

export default PreviewAvatar;
