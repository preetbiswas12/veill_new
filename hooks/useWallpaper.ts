import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

/**
 * The chat wallpaper choice. Persisted device-side (AsyncStorage), read by the
 * thread's ChatWallpaper and by the picker in Chats settings.
 *
 * The styles are original, generated patterns (View primitives, no bitmap
 * assets); nothing is copied from WhatsApp's artwork.
 */
export type WallpaperStyle = 'scatter' | 'dots' | 'weave' | 'plain';

export const WALLPAPER_STYLES: { key: WallpaperStyle; label: string }[] = [
  { key: 'scatter', label: 'Doodle scatter' },
  { key: 'dots', label: 'Dot grid' },
  { key: 'weave', label: 'Diagonal weave' },
  { key: 'plain', label: 'Plain colour' },
];

const STORAGE_KEY = 'veille.wallpaper';

export const useWallpaper = (): [WallpaperStyle, (next: WallpaperStyle) => void] => {
  const [style, setStyle] = useState<WallpaperStyle>('scatter');

  useEffect(() => {
    let alive = true;
    void AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (!alive || !stored) return;
      if (WALLPAPER_STYLES.some((entry) => entry.key === stored)) {
        setStyle(stored as WallpaperStyle);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const setWallpaper = useCallback((next: WallpaperStyle) => {
    void AsyncStorage.setItem(STORAGE_KEY, next);
    setStyle(next);
  }, []);

  return [style, setWallpaper];
};
