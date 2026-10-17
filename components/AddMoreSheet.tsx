import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

type IconName = ComponentProps<typeof Ionicons>['name'];

/**
 * The design's "Add more" sheet: a warm translucent panel carrying a 3-column
 * grid of 60pt circles with a 40pt glyph, each labelled underneath.
 *
 * Location, Contact, Poll and Event have no CometChat client SDK surface for
 * sending them, so those tiles report that rather than opening a picker that
 * would produce nothing sendable. Everything the SDK can send - photo, camera,
 * document - is wired.
 */
const AddMoreSheet = ({
  onPick,
  onOpenCamera,
  onClose,
  unavailable,
}: {
  onPick: (kind: 'library' | 'document') => void;
  onOpenCamera: () => void;
  onClose: () => void;
  unavailable: (what: string) => void;
}) => {
  const { colors } = useTheme();

  const tiles: {
    label: string;
    icon: IconName;
    onPress: () => void;
    tint?: string;
  }[] = [
    { label: 'Photos', icon: 'images-outline', onPress: () => onPick('library'), tint: '#1a7ee8' },
    { label: 'Camera', icon: 'camera-outline', onPress: onOpenCamera },
    { label: 'Location', icon: 'location-outline', onPress: () => unavailable('Location sharing') },
    { label: 'Contact', icon: 'person-outline', onPress: () => unavailable('Contact sharing') },
    { label: 'Document', icon: 'document-text-outline', onPress: () => onPick('document') },
    { label: 'Poll', icon: 'list-outline', onPress: () => unavailable('Polls') },
    { label: 'Event', icon: 'calendar-outline', onPress: () => unavailable('Events') },
  ];

  // Three per row, whatever the screen width, with the gutters the design uses.
  const TILE = 84;
  const GUTTER = 21;

  return (
    <View
      className="bg-panel-blur-warm pt-2 rounded-t-3xl"
      style={{ paddingBottom: 28 }}
    >
      {/* Grabber, per the iOS sheet convention. */}
      <View className="items-center pb-1">
        <View className="w-10 h-1 rounded-full bg-separator" />
      </View>

      <View
        className="flex-row flex-wrap px-5"
        style={{ rowGap: 22, columnGap: GUTTER }}
      >
        {tiles.map((tile) => (
          <Pressable
            key={tile.label}
            onPress={tile.onPress}
            accessibilityRole="button"
            accessibilityLabel={tile.label}
            // Keeps three tiles per row on a narrow screen instead of letting
            // the label width decide the wrap.
            style={{ width: TILE }}
            className="items-center gap-2 active:opacity-70"
          >
            <View className="h-[60px] w-[60px] rounded-full bg-cta-options items-center justify-center">
              <Ionicons name={tile.icon} size={30} color={tile.tint ?? colors['teal']} />
            </View>
            <Text className="text-caption text-text-strong" numberOfLines={1}>
              {tile.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close attach options"
        className="absolute inset-0"
      />
    </View>
  );
};

export default AddMoreSheet;
