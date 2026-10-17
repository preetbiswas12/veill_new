import { ActivityIndicator } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

interface SpinnerProps {
  /** Overrides the brand colour, for spinners that sit on a coloured surface. */
  color?: string;
  size?: 'small' | 'large';
}

const Spinner = ({ color, size = 'large' }: SpinnerProps) => {
  const { colors } = useTheme();
  // ActivityIndicator's `color` cannot read a CSS variable, so this one has to
  // come from the palette rather than a token class.
  return <ActivityIndicator size={size} color={color ?? colors['product']} />;
};

export default Spinner;
