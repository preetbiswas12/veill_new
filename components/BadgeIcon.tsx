import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import Avatar from './Avatar';

/**
 * The coloured rounded-square icon the Settings tab uses for each row, in the
 * iOS Settings idiom: a 30pt square at roughly 0.22 corner radius, the glyph
 * centred in white.
 *
 * The design pins these to fixed brand colours rather than to a theme token,
 * which is why they are passed in rather than derived: blue for Avatar, orange
 * for Lists, and so on. Only the row text and chevron follow the palette.
 */
const BadgeIcon = ({
  icon,
  color,
  size = 30,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  size?: number;
}) => (
  <View
    style={{ width: size, height: size, backgroundColor: color }}
    className="items-center justify-center"
  >
    <Ionicons name={icon} size={Math.round(size * 0.6)} color="#ffffff" />
  </View>
);

/**
 * A Settings row: badge, label, optional value on the right and a chevron.
 *
 * `value` is for the sub-screen rows the design shows with the current setting
 * beside the label ("Last seen", "Who can see my profile photo").
 */
export const SettingsRowItem = ({
  icon,
  badgeColor,
  label,
  value,
  onPress,
  last = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  badgeColor: string;
  label: string;
  value?: string;
  onPress?: () => void;
  last?: boolean;
}) => {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={value ? `Current value: ${value}` : undefined}
      className={`flex-row items-center gap-3 pl-4 pr-4 min-h-[44px] py-2.5 ${
        last ? '' : 'border-b-hair border-separator'
      } ${onPress ? 'active:bg-surface-muted' : ''}`}
    >
      <BadgeIcon icon={icon} color={badgeColor} />
      <Text className="flex-1 min-w-0 text-body-1 text-text-strong" numberOfLines={1}>
        {label}
      </Text>
      {value ? (
        <Text className="text-body-2 text-text-muted" numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {onPress ? <Ionicons name="chevron-forward" size={16} color={colors['text-muted']} /> : null}
    </Pressable>
  );
};

/**
 * The profile card at the top of Settings: 56pt avatar, name, UID and a QR glyph.
 */
export const ProfileCard = ({
  name,
  uid,
  imageUrl,
  onPress,
}: {
  name: string;
  uid: string;
  imageUrl?: string;
  onPress: () => void;
}) => {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Edit profile"
      className="flex-row items-center gap-3 min-h-[76px] pl-4 pr-4 py-3 active:bg-surface-muted"
    >
      <Avatar name={name} imageUrl={imageUrl} size={56} fontSize={22} />
      <View className="flex-1 min-w-0 gap-px">
        <Text className="text-body-1 font-semibold text-text-strong" numberOfLines={1}>
          {name || 'Set a name'}
        </Text>
        <Text className="text-body-2 text-text-muted" numberOfLines={1}>
          {uid}
        </Text>
      </View>
      <Ionicons name="qr-code-outline" size={22} color={colors['text-muted']} />
    </Pressable>
  );
};
