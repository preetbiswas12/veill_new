import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';

type IconName = ComponentProps<typeof Ionicons>['name'];

/**
 * The design's "Add more" sheet (Figma 472:11111): a warm translucent panel with
 * white 60pt circles holding a 40pt glyph, each labelled at 12pt underneath,
 * wrapped at 33px row / 31px column gutters.
 */
const AddMoreSheet = ({
  onPick,
  onClose,
  unavailable,
}: {
  onPick: (kind: 'library' | 'camera' | 'document') => void;
  onClose: () => void;
  unavailable: (what: string) => void;
}) => {
  const tiles: {
    label: string;
    icon: IconName;
    onPress: () => void;
    tint?: string;
  }[] = [
    { label: 'Photo', icon: 'image-outline', onPress: () => onPick('library'), tint: '#1a7ee8' },
    { label: 'Camera', icon: 'camera-outline', onPress: () => onPick('camera') },
    { label: 'Location', icon: 'location-outline', onPress: () => unavailable('Location') },
    { label: 'Contact', icon: 'person-outline', onPress: () => unavailable('Contact sharing') },
    { label: 'Document', icon: 'document-text-outline', onPress: () => onPick('document') },
    { label: 'Poll', icon: 'list-outline', onPress: () => unavailable('Polls') },
    { label: 'Event', icon: 'calendar-outline', onPress: () => unavailable('Events') },
  ];

  return (
    <View className="bg-panel-blur-warm" style={{ height: 339 }}>
      <View className="flex-row flex-wrap px-[30px] pt-[33px]" style={{ rowGap: 33, columnGap: 31 }}>
        {tiles.map((tile) => (
          <Pressable
            key={tile.label}
            onPress={tile.onPress}
            accessibilityRole="button"
            accessibilityLabel={tile.label}
            className="items-center gap-2.5 active:opacity-70"
          >
            <View className="h-[60px] w-[60px] rounded-[40px] bg-cta-options p-2.5 items-center justify-center">
              <Ionicons name={tile.icon} size={40} color={tile.tint ?? '#0a0a0a'} />
            </View>
            <Text className="text-body-3 text-text-strong">{tile.label}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close attach options"
        className="absolute bottom-0 left-0 right-0 h-10 items-center justify-center"
      />
    </View>
  );
};

export default AddMoreSheet;