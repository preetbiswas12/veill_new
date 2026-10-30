import { View, type ViewProps } from 'react-native';
import { Platform } from 'react-native';
import { useMemo } from 'react';

import { useTheme } from '@/hooks/useTheme';

/**
 * Glass surface: a real system blur where the runtime provides one, and an
 * honest tinted panel where it cannot.
 *
 * expo-blur is loaded lazily (try/require) for the same reason
 * expo-media-library is: the module must never take a screen down if a dev
 * build ships without it. Inside a React Native Modal the blur has no
 * background window to sample — another window's content is not reachable —
 * so there the component degrades to the palette tint, which matches
 * WhatsApp's translucent menus closely enough to read identically at speed.
 *
 * Real blur applies in the normal view hierarchy: the chat header and the
 * composer bar sit over the wallpaper, and blur them for real on Android 12+
 * (RenderEffect). `tint` follows the mode; intensities are tuned low so type
 * stays legible — the point is depth, not frosted glass effects.
 */

let BlurViewImpl: React.ComponentType<Record<string, unknown>> | null = null;
let blurUnavailable = false;

const loadBlurView = () => {
  if (blurUnavailable) return null;
  if (BlurViewImpl) return BlurViewImpl;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    BlurViewImpl = require('expo-blur').BlurView;
  } catch {
    blurUnavailable = true;
  }
  return BlurViewImpl;
};

interface GlassProps extends ViewProps {
  /** Blur strength where supported; higher is more diffuse. */
  intensity?: number;
  children?: React.ReactNode;
}

const Glass = ({ intensity = 50, style, children, ...rest }: GlassProps) => {
  const { isDark, colors } = useTheme();

  const tintStyle = useMemo(
    () => ({
      backgroundColor: isDark ? 'rgba(24,36,43,0.92)' : 'rgba(255,255,255,0.90)',
      borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(17,27,33,0.06)',
    }),
    [isDark]
  );

  const BlurView = loadBlurView();

  if (BlurView && (Platform.OS !== 'android' || Platform.Version >= 31)) {
    // blurMethod 'dimezisBlurViewSdk31Plus' is expo-blur's Android 12+ real
    // blur; the Platform guard above keeps the choice consistent.
    return (
      <BlurView
        intensity={intensity}
        tint={isDark ? 'dark' : 'light'}
        blurMethod={Platform.OS === 'android' ? 'dimezisBlurViewSdk31Plus' : undefined}
        style={[
          tintStyle,
          { borderWidth: 0.5, overflow: 'hidden' },
          style as Record<string, unknown>,
        ]}
        {...(rest as Record<string, unknown>)}
      >
        {children}
      </BlurView>
    );
  }

  // Fallback: the same translucent panel without the real blur. Deliberately
  // a hair *more* opaque so text keeps the contrast the blur would have
  // carried.
  return (
    <View
      style={[
        tintStyle,
        {
          backgroundColor: isDark ? colors['panel-blur'] : 'rgba(255,255,255,0.96)',
          borderWidth: 0.5,
          overflow: 'hidden',
        },
        style as Record<string, unknown>,
      ]}
      {...(rest as Record<string, unknown>)}
    >
      {children}
    </View>
  );
};

export default Glass;
