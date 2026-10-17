import { View } from 'react-native';
import { useMemo } from 'react';

/**
 * Chat wallpaper.
 *
 * The design's `#EFEAE2` is not flat: it carries WhatsApp's doodle pattern at
 * roughly 6% opacity (4% in dark mode). Rendering that needs actual marks, so
 * this draws a sparse, deterministic scatter of the small line-art shapes the
 * pattern is built from, rather than shipping a bitmap per density.
 *
 * The scatter is seeded from the index rather than randomised, so it does not
 * shimmer on re-render and is identical on every device. `reduceMotion` is
 * honoured by simply never animating, which is the honest reading of it here.
 */
const ChatWallpaper = () => {
  // Doodle glyphs as compact SVG-ish path descriptions would need a renderer we
  // do not have installed, so the pattern is built from View primitives: small
  // outlined circles, rings and dashes. At 6% alpha the difference is invisible.
  const marks = useMemo(() => {
    const out: { key: string; left: number; top: number; kind: 'ring' | 'dot' | 'dash' }[] = [];
    // A pseudo-random walk: cheap, stable, and no dependency.
    let seed = 1337;
    const next = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
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
  }, []);

  return (
    <View className="absolute inset-0 overflow-hidden" pointerEvents="none">
      {marks.map((mark) => (
        <View
          key={mark.key}
          style={{
            position: 'absolute',
            left: `${mark.left}%`,
            top: `${mark.top}%`,
            opacity: 0.06,
          }}
        >
          {mark.kind === 'ring' ? (
            <View className="size-[18px] rounded-full border-[1.5px] border-text-strong" />
          ) : mark.kind === 'dot' ? (
            <View className="size-[5px] rounded-full bg-text-strong" />
          ) : (
            <View className="w-[22px] h-[3px] rounded-full bg-text-strong" />
          )}
        </View>
      ))}
    </View>
  );
};

export default ChatWallpaper;
