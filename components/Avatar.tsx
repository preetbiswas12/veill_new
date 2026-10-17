import { Ionicons } from '@expo/vector-icons';
import { Text, TextStyle, View } from 'react-native';
import AppImage from './AppImage';
import { useTheme } from '@/hooks/useTheme';

interface AvatarProps {
  name: string;
  imageUrl?: string;
  size?: number;
  fontSize?: TextStyle['fontSize'];
  fontWeight?: TextStyle['fontWeight'];
  placeholderType?: 'text' | 'icon';
}

const Avatar = ({
  imageUrl,
  size = 40,
  name,
  fontSize = 20,
  fontWeight = '500',
  placeholderType = 'text',
}: AvatarProps) => {
  const { colors } = useTheme();
  if (imageUrl)
    return (
      <View
        className="relative flex shrink-0 overflow-hidden rounded-full"
        style={{ width: size, height: size }}
      >
        <AppImage
          source={{ uri: imageUrl }}
          className="w-full h-full"
          alt="name"
          contentFit="cover"
        />
      </View>
    );

  return (
    <View
      style={{
        width: size,
        height: size,
        backgroundColor: colors['surface-muted'],
      }}
      className="shrink-0 rounded-full aspect-square flex flex-row items-center justify-center overflow-hidden"
    >
      {placeholderType === 'text' && (
        <Text
          style={{
            fontSize,
            fontWeight,
          }}
          className="leading-[2] text-text-muted uppercase"
        >
          {name ? name[0] : ''}
        </Text>
      )}
      {placeholderType === 'icon' && (
        <Ionicons name="people-outline" size={fontSize} color={colors['text-muted']} />
      )}
    </View>
  );
};

export default Avatar;
