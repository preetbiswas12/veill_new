import Colors from '@/constants/Colors';
import Fonts from '@/constants/Fonts';
import { Ionicons } from '@expo/vector-icons';
import { View, ScrollView, Text, Switch, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import StorageService from '@/utils/storage';

const SettingsItem = ({
  icon,
  title,
  value,
  toggle,
  toggleValue,
  onToggle,
  onPress,
  description,
}: {
  icon: string;
  title: string;
  value?: string;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (val: boolean) => void;
  onPress?: () => void;
  description?: string;
}) => (
  <TouchableOpacity onPress={onPress} activeOpacity={toggle ? 1 : 0.5} disabled={toggle}>
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.card,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.lightGray,
      }}>
    <Ionicons name={icon as any} size={22} color={Colors.text} />
    <View style={{ flex: 1, marginLeft: 12 }}>
      <Text style={{ fontSize: 16, color: Colors.text }}>{title}</Text>
      {description ? (
        <Text style={{ fontSize: 12, color: '#8696A0', marginTop: 2 }}>{description}</Text>
      ) : null}
    </View>
    {toggle ? (
      <Switch
        value={toggleValue}
        onValueChange={onToggle}
        trackColor={{ true: '#00A884', false: '#D1D5DB' }}
      />
    ) : value ? (
      <Text style={{ fontSize: 14, color: '#8696A0', marginRight: 4 }}>{value}</Text>
    ) : (
      <Ionicons name="chevron-forward" size={18} color="#B0B0B0" />
    )}
    </View>
  </TouchableOpacity>
);

const ChatsSettingsPage = () => {
  const router = useRouter();
  const [enterIsSend, setEnterIsSend] = useState(false);
  const [mediaVisibility, setMediaVisibility] = useState(true);
  const [theme, setTheme] = useState('light');
  const [fontSize, setFontSize] = useState('medium');

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await StorageService.getSettings();
      setEnterIsSend(settings.enterIsSend);
      setMediaVisibility(settings.mediaVisibility);
      setTheme(settings.theme);
      setFontSize(settings.fontSize);
    };
    loadSettings();
  }, []);

  const handleToggle = async (key: string, value: boolean) => {
    await StorageService.updateSetting(key, value);
  };

  const handleValueChange = async (key: string, value: string) => {
    await StorageService.updateSetting(key, value);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: Colors.card, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
          <Text style={{ fontSize: 22, fontWeight: '600', color: Colors.text, fontFamily: Fonts.heading }}>Chats</Text>
        </View>

        <View style={{ backgroundColor: Colors.card, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: Colors.lightGray }}>
          <SettingsItem icon="color-palette" title="Theme" value={theme.charAt(0).toUpperCase() + theme.slice(1)} onPress={() => router.push('/settings/theme' as any)} />
          <SettingsItem icon="image" title="Wallpaper" onPress={() => router.push('/settings/wallpaper' as any)} />
        </View>

        <View style={{ marginTop: 8 }} />
        <View style={{ backgroundColor: Colors.card, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: Colors.lightGray }}>
          <SettingsItem
            icon="enter"
            title="Enter is send"
            toggle
            toggleValue={enterIsSend}
            onToggle={(val) => {
              setEnterIsSend(val);
              handleToggle('enterIsSend', val);
            }}
            description="Enter key will send a message"
          />
          <SettingsItem
            icon="images"
            title="Media visibility"
            toggle
            toggleValue={mediaVisibility}
            onToggle={(val) => {
              setMediaVisibility(val);
              handleToggle('mediaVisibility', val);
            }}
            description="Show newly downloaded media from chats in your device gallery"
          />
          <SettingsItem icon="text" title="Font size" value={fontSize.charAt(0).toUpperCase() + fontSize.slice(1)} onPress={() => router.push('/settings/font-size' as any)} />
        </View>

        <View style={{ marginTop: 8 }} />
        <View style={{ backgroundColor: Colors.card, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: Colors.lightGray }}>
          <SettingsItem icon="archive" title="Archived chats" onPress={() => router.push('/settings/archived-chats' as any)} />
        </View>

        <View style={{ marginTop: 8 }} />
        <View style={{ backgroundColor: Colors.card, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: Colors.lightGray }}>
          <SettingsItem icon="cloud-upload" title="Chat backup" onPress={() => router.push('/settings/chat-backup' as any)} />
          <SettingsItem icon="chatbubbles" title="Chat history" onPress={() => router.push('/settings/chat-history' as any)} />
        </View>
      </ScrollView>
    </View>
  );
};

export default ChatsSettingsPage;
