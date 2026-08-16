import Colors from '@/constants/Colors';
import Fonts from '@/constants/Fonts';
import { Ionicons } from '@expo/vector-icons';
import { View, ScrollView, Text, Switch, TouchableOpacity, Alert } from 'react-native';
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
}: {
  icon: string;
  title: string;
  value?: string;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (val: boolean) => void;
  onPress?: () => void;
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
        {value ? (
          <Text style={{ fontSize: 13, color: '#8696A0', marginTop: 1 }}>{value}</Text>
        ) : null}
      </View>
      {toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ true: '#00A884', false: '#D1D5DB' }}
        />
      ) : (
        <Ionicons name="chevron-forward" size={18} color="#B0B0B0" />
      )}
    </View>
  </TouchableOpacity>
);

const PrivacyPage = () => {
  const router = useRouter();
  const [readReceipts, setReadReceipts] = useState(true);
  const [groups, setGroups] = useState(true);
  const [lastSeen, setLastSeen] = useState('everyone');
  const [profilePhoto, setProfilePhoto] = useState('everyone');
  const [about, setAbout] = useState('everyone');
  const [statusPrivacy, setStatusPrivacy] = useState('contacts');
  const [fingerprintLock, setFingerprintLock] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await StorageService.getSettings();
      setReadReceipts(settings.readReceipts);
      setGroups(settings.groups);
      setLastSeen(settings.lastSeen);
      setProfilePhoto(settings.profilePhoto);
      setAbout(settings.about);
      setStatusPrivacy(settings.statusPrivacy);
      setFingerprintLock(settings.fingerprintLock);
    };
    loadSettings();
  }, []);

  const handleToggle = async (key: string, value: boolean) => {
    await StorageService.updateSetting(key, value);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View
          style={{
            backgroundColor: Colors.card,
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 12,
          }}>
          <Text style={{ fontSize: 22, fontWeight: '600', color: Colors.text, fontFamily: Fonts.heading }}>Privacy</Text>
        </View>

        <View style={{ backgroundColor: Colors.card, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: Colors.lightGray }}>
          <SettingsItem icon="time" title="Last seen and online" value={lastSeen.charAt(0).toUpperCase() + lastSeen.slice(1)} onPress={() => router.push('/settings/last-seen' as any)} />
          <SettingsItem icon="camera" title="Profile photo" value={profilePhoto.charAt(0).toUpperCase() + profilePhoto.slice(1)} onPress={() => router.push('/settings/profile-photo' as any)} />
          <SettingsItem icon="information-circle" title="About" value={about.charAt(0).toUpperCase() + about.slice(1)} onPress={() => router.push('/settings/about' as any)} />
          <SettingsItem icon="radio-button-on" title="Status" value={statusPrivacy === 'contacts' ? 'My contacts' : statusPrivacy} onPress={() => router.push('/settings/status-privacy' as any)} />
        </View>

        <View style={{ marginTop: 8 }} />
        <View style={{ backgroundColor: Colors.card, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: Colors.lightGray }}>
          <SettingsItem
            icon="checkmark-done"
            title="Read receipts"
            toggle
            toggleValue={readReceipts}
            onToggle={(val) => {
              setReadReceipts(val);
              handleToggle('readReceipts', val);
            }}
          />
        </View>

        <View style={{ marginTop: 8 }} />
        <View style={{ backgroundColor: Colors.card, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: Colors.lightGray }}>
          <SettingsItem
            icon="people"
            title="Groups"
            toggle
            toggleValue={groups}
            onToggle={(val) => {
              setGroups(val);
              handleToggle('groups', val);
            }}
          />
          <SettingsItem icon="location" title="Live location" onPress={() => {}} />
          <SettingsItem icon="ban" title="Blocked contacts" value="0" onPress={() => router.push('/settings/blocked-contacts' as any)} />
        </View>

        <View style={{ marginTop: 8 }} />
        <View style={{ backgroundColor: Colors.card, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: Colors.lightGray }}>
          <SettingsItem
            icon="finger-print"
            title="Fingerprint lock"
            value={fingerprintLock ? 'On' : 'Off'}
            onPress={() => router.push('/settings/fingerprint-lock' as any)}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default PrivacyPage;
