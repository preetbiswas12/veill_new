import { Ionicons } from '@expo/vector-icons';
import clsx from 'clsx';
import { Image } from 'expo-image';
import { Animated, Easing, Modal, Pressable, Text, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';

import MessageAvatar from './MessageAvatar';
import { useTheme } from '@/hooks/useTheme';
import type { DemoMsg } from '@/lib/demo-thread';

/**
 * Bubbles for the demo thread: the same frame, radius, padding and
 * time-and-tick treatment as MessageBubble, carrying local-only placeholders —
 * a photo, a video poster with duration metadata, a document and a voice note
 * whose waveform runs a silent sweep — so the media surface can be reviewed
 * without a second signed-in session.
 */

// Hand-picked so the bars read like speech cadence rather than white noise.
const VOICE_BARS = [
  0.34, 0.58, 0.72, 0.5, 0.86, 0.42, 0.64, 0.3, 0.78, 0.56, 0.4, 0.9, 0.52,
  0.68, 0.36, 0.8, 0.46, 0.62, 0.38, 0.74,
];

const MEDIA_SIZE = { width: 216, height: 236 };
/** Fixed wave track, so base bars and playhead bars share one geometry. */
const WAVE_WIDTH = 136;

const formatClock = (at: number) =>
  new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatDuration = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, '0')}`;

const VoiceBars = ({ color }: { color: string }) => (
  <View style={{ width: WAVE_WIDTH, height: 28 }} className="flex-row items-center justify-between">
    {VOICE_BARS.map((spec, index) => (
      <View
        key={index}
        style={{
          height: Math.round(6 + spec * 16),
          width: 2.5,
          borderRadius: 2,
          backgroundColor: color,
        }}
      />
    ))}
  </View>
);

const DemoMessageBubble = ({
  demo,
  isOwn,
  onLongPress,
}: {
  demo: DemoMsg;
  isOwn: boolean;
  onLongPress?: () => void;
}) => {
  const { colors } = useTheme();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const progress = useRef(new Animated.Value(0)).current;
  const voiceAnim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!note) return;
    const clear = setTimeout(() => setNote(null), 2100);
    return () => clearTimeout(clear);
  }, [note]);

  useEffect(
    () => () => {
      voiceAnim.current?.stop();
    },
    []
  );

  const toggleVoice = () => {
    if (voiceAnim.current) {
      voiceAnim.current.stop();
      voiceAnim.current = null;
      setPlaying(false);
      return;
    }
    setPlaying(true);
    const fill = Animated.timing(progress, {
      toValue: 1,
      duration: (demo.seconds ?? 0) * 1000,
      easing: Easing.linear,
      // `width` is a layout prop — the native driver rejects it on Android,
      // so this one rides the JS driver (a tiny subtree, once every 23s).
      useNativeDriver: false,
    });
    voiceAnim.current = fill;
    fill.start(() => {
      voiceAnim.current = null;
      setPlaying(false);
      progress.setValue(0);
    });
  };

  const encryptedChip = (
    <View className="absolute right-1 top-1 flex-row items-center gap-1 rounded-full bg-black/40 px-2 py-0.5">
      <Ionicons name="lock-closed" size={10} color="#ffffff" />
      <Text className="text-[9px] font-medium text-white">Encrypted</Text>
    </View>
  );

  const renderContent = () => {
    switch (demo.kind) {
      case 'text':
        return <Text className="text-body-2 text-text-strong">{demo.text}</Text>;

      case 'photo':
        return (
          <Pressable
            onPress={() => setPreviewOpen(true)}
            className="rounded-bubble overflow-hidden"
          >
            <Image
              source={require('@/assets/images/demo-photo.png')}
              style={MEDIA_SIZE}
              contentFit="cover"
              transition={150}
              accessibilityLabel="Demo photo"
            />
            {encryptedChip}
          </Pressable>
        );

      case 'video':
        return (
          <Pressable
            onPress={() => setPreviewOpen(true)}
            className="rounded-bubble overflow-hidden"
          >
            <Image
              source={require('@/assets/images/demo-video-poster.png')}
              style={MEDIA_SIZE}
              contentFit="cover"
              transition={150}
              accessibilityLabel="Demo video"
            />
            {encryptedChip}
            {/* Duration chip rides the bottom-left edge, as in WhatsApp. */}
            <View className="absolute bottom-2 left-2 flex-row items-center gap-1 rounded-full bg-black/45 px-2 py-[3px]">
              <Ionicons name="play" size={9} color="#ffffff" />
              <Text className="text-[10px] font-medium text-white">
                {formatDuration(demo.seconds ?? 0)}
              </Text>
            </View>
          </Pressable>
        );

      case 'file':
        return (
          <Pressable
            onPress={() =>
              setNote(`"${demo.text}" is demo content — no file is behind it.`)
            }
            // Same 224pt frame as the media bubbles: 204pt content inside the
            // 20pt of px-2.5 bubble padding.
            className="w-[204px] flex-row items-center gap-2 py-1"
          >
            <Ionicons name="document-text-outline" size={22} color={colors['text-strong']} />
            <View className="flex-1 min-w-0">
              <Text className="text-body-2 font-medium text-text-strong" numberOfLines={2}>
                {demo.text}
              </Text>
              <Text className="text-caption text-text-muted">{demo.meta}</Text>
            </View>
          </Pressable>
        );

      case 'voice':
        return (
          // Fixed widths keep the bubble stable while the sweep runs.
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={toggleVoice}
              accessibilityRole="button"
              accessibilityLabel={playing ? 'Pause demo voice note' : 'Play demo voice note'}
              className="w-7 h-7 rounded-full bg-product items-center justify-center active:opacity-70"
            >
              <Ionicons name={playing ? 'pause' : 'play'} size={14} color={colors['text-invert']} />
            </Pressable>
            <View style={{ width: WAVE_WIDTH, height: 28 }}>
              <VoiceBars color={colors['text-muted']} />
              {/* The playhead: a product-coloured copy of the same bars,
                  clipped to the progress width. */}
              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: 0,
                  overflow: 'hidden',
                  width: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, WAVE_WIDTH],
                  }),
                }}
              >
                <VoiceBars color={colors['product']} />
              </Animated.View>
            </View>
            <Text className="text-caption text-text-muted">
              {formatDuration(demo.seconds ?? 0)}
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  const bubblePadding =
    demo.kind === 'text'
      ? 'pt-[13px] pl-[7px] pr-[9px] pb-[3px]'
      : demo.kind === 'file'
        ? 'px-2.5 py-2'
        : demo.kind === 'voice'
          ? 'px-2.5 py-3'
          : 'p-1';

  const time = formatClock(demo.at);

  return (
    <View className={clsx('flex-row items-end gap-2 px-4 mb-3', isOwn && 'justify-end')}>
      {!isOwn ? (
        <View style={{ width: 28, height: 28 }}>
          <MessageAvatar message={{ from: 'Alice' }} />
        </View>
      ) : null}

      <View
        className="items-start max-w-[73%]"
        style={isOwn ? { alignItems: 'flex-end' } : undefined}
      >
        <Pressable
          onLongPress={onLongPress}
          delayLongPress={300}
          className={clsx(
            'rounded-bubble border-bubble',
            isOwn ? 'bg-bubble-out border-bubble-shadow' : 'bg-bubble-in border-bubble-shadow',
            bubblePadding
          )}
        >
          {demo.kind === 'video' || demo.kind === 'photo' ? (
            <View className="relative">{renderContent()}</View>
          ) : demo.kind === 'file' ? (
            <View className="relative">{renderContent()}</View>
          ) : demo.kind === 'voice' ? (
            <View className="relative">{renderContent()}</View>
          ) : (
            renderContent()
          )}

          {/* Time and ticks ride the trailing edge, as in every other bubble. */}
          <View className="flex-row items-center justify-end gap-1 mt-0.5 -mb-0.5">
            <Text className="text-caption text-text-faint">{time}</Text>
            {isOwn ? (
              <Ionicons name="checkmark-done" size={15} color={colors['tick-read']} />
            ) : null}
          </View>
        </Pressable>

        {/* Placeholder tap-responses appear inside the media frame and cannot
            reflow the bubble. */}
        {note ? (
          <View className="absolute inset-0 items-start justify-start px-1 pt-1" pointerEvents="none">
            <DemoNoteChip note={note} />
          </View>
        ) : null}
      </View>

      {/* Full-screen preview for the demo photo and the video poster. */}
      <Modal
        visible={previewOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewOpen(false)}
      >
        <View className="flex-1 bg-black relative">
          {demo.kind === 'video' ? (
            <VideoPreview demo={demo} onClose={() => setPreviewOpen(false)} />
          ) : (
            <PhotoPreview onClose={() => setPreviewOpen(false)} />
          )}
        </View>
      </Modal>
    </View>
  );
};

const DemoNoteChip = ({ note }: { note: string }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const show = Animated.timing(opacity, { toValue: 1, duration: 140, useNativeDriver: true });
    show.start();
    const hide = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }, 1800);
    return () => {
      show.stop();
      clearTimeout(hide);
    };
  }, [note, opacity]);
  return (
    <Animated.View style={{ opacity }} className="rounded-full bg-black/60 px-3 py-1.5">
      <Text className="text-[11px] text-white text-center">{note}</Text>
    </Animated.View>
  );
};

const PhotoPreview = ({ onClose }: { onClose: () => void }) => (
  <>
    <Image
      source={require('@/assets/images/demo-photo.png')}
      style={{ flex: 1 }}
      contentFit="contain"
    />
    <Pressable
      onPress={onClose}
      accessibilityRole="button"
      accessibilityLabel="Close preview"
      hitSlop={8}
      className="absolute top-14 right-4 w-9 h-9 rounded-full bg-white/15 items-center justify-center active:opacity-70"
    >
      <Ionicons name="close" size={22} color="#ffffff" />
    </Pressable>
  </>
);

const VideoPreview = ({ demo, onClose }: { demo: DemoMsg; onClose: () => void }) => {
  const [note, setNote] = useState(false);
  return (
    <>
      <Image
        source={require('@/assets/images/demo-video-poster.png')}
        style={{ flex: 1 }}
        contentFit="contain"
      />
      {/* Pressing play says honestly that playback needs a real send — but the
          surface itself behaves like the real player would. */}
      <Pressable
        onPress={() => setNote(true)}
        accessibilityRole="button"
        accessibilityLabel="Play demo video"
        className="absolute inset-0 items-center justify-center active:opacity-80"
      >
        <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center">
          <Ionicons name="play" size={30} color="#ffffff" />
        </View>
      </Pressable>
      {note ? (
        <VideoPreviewNote />
      ) : null}
      <View className="absolute bottom-5 left-0 right-0 flex-row justify-center">
        <View className="flex-row items-center gap-1 rounded-full bg-black/40 px-2 py-0.5">
          <Ionicons name="play" size={9} color="#ffffff" />
          <Text className="text-[10px] text-white">{formatDuration(demo.seconds ?? 0)}</Text>
        </View>
      </View>
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close preview"
        hitSlop={8}
        className="absolute top-14 right-4 w-9 h-9 rounded-full bg-white/15 items-center justify-center active:opacity-70"
      >
        <Ionicons name="close" size={22} color="#ffffff" />
      </Pressable>
    </>
  );
};

const VideoPreviewNote = () => {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const show = Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true });
    show.start();
    const hide = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    }, 2200);
    return () => {
      show.stop();
      clearTimeout(hide);
    };
  }, [opacity]);
  return (
    <View className="absolute bottom-20 left-0 right-0 flex-row justify-center" pointerEvents="none">
      <Animated.View style={{ opacity }} className="rounded-full bg-black/60 px-3 py-1.5">
        <Text className="text-[11px] text-white text-center">
          Demo clip — sending a real video plays in the full-screen player.
        </Text>
      </Animated.View>
    </View>
  );
};

export default DemoMessageBubble;
