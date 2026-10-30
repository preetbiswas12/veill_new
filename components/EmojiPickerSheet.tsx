import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BackHandler,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';
import { CATEGORIES, EMOJI_DATA, type EmojiEntry } from '@/lib/emojiData';

/**
 * The full reaction keyboard, reached from the "+" cell of the message
 * reactions strip — WhatsApp's flow: the quick six stay one tap away, and
 * anything else in the system emoji font is one search away.
 *
 * The catalogue is our own curation in lib/emojiData.ts, rendered from the
 * system font (no image assets). Recents persist device-side so the person's
 * own reaction vocabulary surfaces on the home tab of this sheet.
 */

const RECENTS_KEY = 'veille.reactionRecents';
const NUM_COLUMNS = 8;

const EmojiPickerSheet = ({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('smileys');
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    void AsyncStorage.getItem(RECENTS_KEY).then((stored) => {
      if (!alive || !stored) return;
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setRecents(parsed.slice(0, 24));
      } catch {
        // Corrupt or foreign value — ignore and start empty.
      }
    });
    return () => {
      alive = false;
    };
  }, [visible]);

  // Back dismisses the picker before the enclosing surfaces — the same
  // belt-and-braces contract the other sheets carry.
  useEffect(() => {
    if (!visible) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [visible, onClose]);

  const results = useMemo<EmojiEntry[]>(() => {
    const q = query.trim().toLowerCase();
    if (q) return EMOJI_DATA.filter((entry) => entry.n.includes(q));
    if (category === 'recent') {
      return recents
        .map((glyph) => EMOJI_DATA.find((entry) => entry.e === glyph))
        .filter((entry): entry is EmojiEntry => Boolean(entry));
    }
    return EMOJI_DATA.filter((entry) => entry.c === category);
  }, [query, category, recents]);

  const pick = useCallback(
    (emoji: string) => {
      void Haptics.selectionAsync();
      void (async () => {
        // Recents lead with the just-picked glyph, capped at 24.
        const next = [emoji, ...recents.filter((item) => item !== emoji)].slice(0, 24);
        setRecents(next);
        try {
          await AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(next));
        } catch {
          // Storage off is not fatal; the reaction itself still goes out.
        }
      })();
      onSelect(emoji);
    },
    [recents, onSelect]
  );

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={{ flex: 1 }} onPress={onClose} />
      <View style={{ paddingHorizontal: 10, paddingBottom: insets.bottom + 12 }}>
        <View
          style={{
            backgroundColor: colors['surface'],
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            overflow: 'hidden',
            borderWidth: 0.5,
            borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(17,27,33,0.07)',
            shadowColor: '#000',
            shadowOpacity: 0.45,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 8 },
            elevation: 18,
          }}
        >
          {/* The sheet's own translucency reads as glass over the dimmed
              thread; a real blur cannot sample another window's content, so
              the tint carries the depth here instead. */}
          <View
            style={{
              paddingHorizontal: 12,
              paddingTop: 10,
              paddingBottom: 6,
              borderBottomWidth: 0.5,
              borderBottomColor: colors['separator'],
            }}
          >
            <View
              style={{
                alignItems: 'center',
                paddingBottom: 8,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors['separator'],
                }}
              />
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                backgroundColor: colors['surface-muted'],
                borderRadius: 12,
                paddingHorizontal: 12,
                height: 40,
              }}
            >
              <Ionicons name="search" size={18} color={colors['text-muted']} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search emoji"
                placeholderTextColor={colors['text-muted']}
                accessibilityLabel="Search emoji"
                returnKeyType="search"
                autoCorrect={false}
                style={{ flex: 1, fontSize: 15, color: colors['text-strong'] }}
              />
              {query.length > 0 && (
                <Pressable
                  onPress={() => setQuery('')}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                >
                  <Ionicons name="close-circle" size={18} color={colors['text-muted']} />
                </Pressable>
              )}
            </View>

            {!query && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 8 }}
                contentContainerStyle={{ gap: 6, paddingRight: 8, alignItems: 'center' }}
              >
                <CategoryChip
                  label="Recent"
                  active={category === 'recent'}
                  onPress={() => setCategory('recent')}
                  count={recents.length}
                />
                {CATEGORIES.map((entry) => (
                  <CategoryChip
                    key={entry.key}
                    label={entry.label}
                    active={category === entry.key}
                    onPress={() => setCategory(entry.key)}
                  />
                ))}
              </ScrollView>
            )}
          </View>

          <FlatList
            data={results}
            keyExtractor={(entry) => `${entry.e}-${entry.n}`}
            numColumns={NUM_COLUMNS}
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: 344 }}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 }}>
                <Ionicons name="sad-outline" size={30} color={colors['text-muted']} />
                <Text
                  style={{
                    marginTop: 8,
                    fontSize: 14,
                    color: colors['text-muted'],
                    textAlign: 'center',
                  }}
                >
                  No emoji matches "{query}".
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => pick(item.e)}
                accessibilityRole="button"
                accessibilityLabel={`React with ${item.e}`}
                android_ripple={{
                  color: 'rgba(134,150,160,0.20)',
                  borderless: true,
                  radius: 22,
                }}
                style={({ pressed }) => ({
                  flex: 1 / NUM_COLUMNS,
                  aspectRatio: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ fontSize: 26 }}>{item.e}</Text>
              </Pressable>
            )}
            contentContainerStyle={{ paddingBottom: 10 }}
          />
        </View>
      </View>
    </Modal>
  );
};

const CategoryChip = ({
  label,
  active,
  count,
  onPress,
}: {
  label: string;
  active: boolean;
  count?: number;
  onPress: () => void;
}) => {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      android_ripple={{ color: 'rgba(134,150,160,0.24)', borderless: true, radius: 18 }}
      style={({ pressed }) => ({
        height: 30,
        paddingHorizontal: 12,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 5,
        backgroundColor: active ? colors['surface-active'] : 'transparent',
        borderWidth: 0.5,
        borderColor: active ? colors['product'] : colors['separator'],
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: '600',
          color: active ? colors['text-strong'] : colors['text-muted'],
        }}
      >
        {count !== undefined && count > 0 ? `${label} ${count}` : label}
      </Text>
    </Pressable>
  );
};

export default EmojiPickerSheet;
