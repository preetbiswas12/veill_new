import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface AttachButtonProps {
  disabled?: boolean;
  onPress?: () => void;
}

/** The design's `ico-32-plus` on the composer's leading edge. */
const AttachButton = ({ disabled = false, onPress }: AttachButtonProps) => {
  const { colors } = useTheme();
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Attach"
      hitSlop={6}
      className="active:opacity-70"
    >
      <Ionicons
        name="add"
        size={32}
        color={disabled ? colors['input-border'] : colors['text-strong']}
      />
    </Pressable>
  );
};

export default AttachButton;