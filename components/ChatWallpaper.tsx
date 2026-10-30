import { View } from 'react-native';
import { useMemo } from 'react';

import { useWallpaper } from '@/hooks/useWallpaper';
import { useTheme } from '@/hooks/useTheme';

/**
 * Chat wallpaper, styled on the WhatsApp idiom: a flat tone carrying a faint
 * line pattern (~6% ink, 4%-ish feel in the dark). The patterns here are
 * original, generated geometry — View primitives, deterministic seeding, no
 * bitmap assets shipped.
 *
 * The scatter is a seeded pseudo-random walk of rings/dots/dashes, identical on
 * every render and device (no shimmer).
 */
const ChatWallpaper = () => {
  const [style] = useWallpaper();
  const { isDark } = useTheme();
  // Faint ink follows the mode: dark strokes on the light wallpaper, light
  // strokes on the dark one — the same ~6% read WhatsApp's pattern carries.
  const ink = isDark ? 'rgba(233,237,239,1)' : 'rgba(17,27,33,1)';

  const marks = useMemo(() => {
    if (style === 'plain') return [];
    let seed = 1337;
    const next = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };

    if (style === 'dots') {
      // An even grid reads calmer than the scatter; deterministic offsets keep
      // it from looking mechanical.
      const out: { key: string; left: number; top: number }[] = [];
      for (let row = 0; row < 14; row++) {
        for (let col = 0; col < 10; col++) {
          out.push({
            key: `d${row}-${col}`,
            left: col * 10.5 + (row % 2) * 5 + next() * 1.5,
            top: row * 7.5 + next() * 1.5,
          });
        }
      }
      return out.map((m) => ({ ...m, kind: 'dot' as const }));
    }

    if (style === 'weave') {
      // Short diagonal dashes in two directions, laid out by a seeded scatter.
      const out: { key: string; left: number; top: number; kind: 'dash' | 'dot' }[] = [];
      for (let i = 0; i < 46; i++) {
        out.push({
          key: `w${i}`,
          left: next() * 100,
          top: next() * 100,
          kind: i % 5 === 0 ? 'dot' : 'dash',
        });
      }
      return out;
    }

    // 'scatter' — the default doodle-idiom mix.
    const out: { key: string; left: number; top: number; kind: 'ring' | 'dot' | 'dash' }[] = [];
    for (let i = 0; i < 34; i++) {
      const kind = i % 3 === 0 ? 'ring' : i % 3 === 1 ? 'dot' : 'dash';
      out.push({
        key: `m${i}`,
        left: next() * 100,
        top: next() * 100,
        kind,
      });
    }
    return out;
  }, [style]);

  return (
    <View className="absolute inset-0 overflow-hidden" pointerEvents="none">
      {marks.map((mark) => (
        <View
          key={mark.key}
          style={{
            position: 'absolute',
            left: `${mark.left}%`,
            top: `${mark.top}%`,
            opacity: mark.kind === 'dot' ? 0.05 : 0.06,
          }}
        >
          {mark.kind === 'ring' ? (
            <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: ink }} />
          ) : mark.kind === 'dot' ? (
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: ink }} />
          ) : (
            <View
              style={{
                width: 22,
                height: 3,
                borderRadius: 1.5,
                backgroundColor: ink,
                transform: [{ rotate: '35deg' }],
              }}
            />
          )}
        </View>
      ))}
    </View>
  );
};

export default ChatWallpaper;
