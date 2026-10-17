import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

interface AttachButtonProps {
  disabled?: boolean;
  onPress?: () => void;
}

/** The design's `ico-32-plus` on the composer's leading edge. */
const AttachButton = ({ disabled = false, onPress }: AttachButtonProps) => (
  <Pressable
    disabled={disabled}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel="Attach"
    hitSlop={6}
    className="active:opacity-60"
  >
    <Ionicons name="add" size={32} color={disabled ? '#b2b2b2' : '#0a0a0a'} />
  </Pressable>
);

export default AttachButton;