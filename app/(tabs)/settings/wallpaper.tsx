import { useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { alert } from '@/utils/customAlert';
import { SectionBlock, PageHeader } from '@/components/SettingsUI';
import { Ionicons } from '@expo/vector-icons';
import StorageService from '@/utils/storage';
import Colors from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';

const wallpapers = [
  { id: 'default', color: '#E8F5E9', name: 'Default' },
  { id: 'blue', color: '#E3F2FD', name: 'Blue' },
  { id: 'orange', color: '#FFF3E0', name: 'Orange' },
  { id: 'purple', color: '#F3E5F5', name: 'Purple' },
  { id: 'red', color: '#FFEBEE', name: 'Red' },
  { id: 'teal', color: '#E0F2F1', name: 'Teal' },
  { id: 'yellow', color: '#FFFDE7', name: 'Yellow' },
  { id: 'grey', color: '#F5F5F5', name: 'Grey' },
];

const WallpaperPage = () => {
  const { wallpaper, setWallpaper } = useTheme();
  const [selectedWallpaper, setSelectedWallpaper] = useState(wallpaper);

  useEffect(() => {
    const loadWallpaper = async () => {
      const settings = await StorageService.getSettings();
      setSelectedWallpaper(settings.wallpaper || 'default');
    };
    loadWallpaper();
  }, []);

  const handleWallpaperSelect = async (wallpaperId: string) => {
    setSelectedWallpaper(wallpaperId);
    await setWallpaper(wallpaperId);
    const selected = wallpapers.find(w => w.id === wallpaperId);
    alert('Wallpaper set', `Your chat wallpaper has been changed to ${selected?.name}.`);
  };

  const handleReset = async () => {
    setSelectedWallpaper('default');
    await setWallpaper('default');
    alert('Reset', 'Wallpaper reset to default.');
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <PageHeader title="Wallpaper" />

        <Text style={{ fontSize: 13, color: '#8696A0', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 }}>
          Choose a wallpaper for your chats.
        </Text>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            padding: 12,
            gap: 12,
          }}>
          {wallpapers.map((wp) => (
            <TouchableOpacity
              key={wp.id}
              activeOpacity={0.7}
              onPress={() => handleWallpaperSelect(wp.id)}>
              <View style={{ alignItems: 'center' }}>
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 12,
                    backgroundColor: wp.color,
                    borderWidth: selectedWallpaper === wp.id ? 3 : 2,
                    borderColor: selectedWallpaper === wp.id ? '#00A884' : '#E0E0E0',
                  }}
                />
                <Text style={{ fontSize: 12, color: '#8696A0', marginTop: 4 }}>{wp.name}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          activeOpacity={0.5}
          onPress={() => alert('Gallery', 'Choose a photo from your gallery.')}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: Colors.card,
              paddingHorizontal: 16,
              paddingVertical: 14,
              marginTop: 8,
              borderTopWidth: 0.5,
              borderBottomWidth: 0.5,
              borderColor: Colors.lightGray,
            }}>
            <Ionicons name="images" size={22} color="#00A884" />
            <Text style={{ fontSize: 16, color: '#00A884', marginLeft: 12 }}>Choose from gallery</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.5}
          onPress={handleReset}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: Colors.card,
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: 0.5,
              borderColor: Colors.lightGray,
            }}>
            <Ionicons name="refresh" size={22} color="#00A884" />
            <Text style={{ fontSize: 16, color: '#00A884', marginLeft: 12 }}>Reset wallpaper</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default WallpaperPage;
