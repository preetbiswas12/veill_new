import Colors from '@/constants/Colors';
import Fonts from '@/constants/Fonts';
import { Ionicons } from '@expo/vector-icons';
import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

const SettingsItem = ({
  icon,
  title,
  value,
  description,
  onPress,
}: {
  icon: string;
  title: string;
  value?: string;
  description?: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.5}>
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
      {value ? (
        <Text style={{ fontSize: 14, color: '#8696A0', marginRight: 4 }}>{value}</Text>
      ) : (
        <Ionicons name="chevron-forward" size={18} color="#B0B0B0" />
      )}
    </View>
  </TouchableOpacity>
);

const StorageAndDataPage = () => {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: Colors.card, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
          <Text style={{ fontSize: 22, fontWeight: '600', color: Colors.text, fontFamily: Fonts.heading }}>Storage and data</Text>
        </View>

        <View style={{ backgroundColor: Colors.card, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: Colors.lightGray }}>
          <SettingsItem icon="cloud" title="Manage storage" onPress={() => router.push('/settings/manage-storage' as any)} />
          <SettingsItem icon="analytics" title="Network usage" onPress={() => router.push('/settings/network-usage' as any)} />
        </View>

        <View style={{ marginTop: 8 }} />
        <View style={{ backgroundColor: Colors.card, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: Colors.lightGray }}>
          <SettingsItem icon="cellular" title="When using mobile data" value="Photos" onPress={() => router.push('/settings/mobile-data' as any)} />
          <SettingsItem icon="wifi" title="When connected on Wi-Fi" value="All media" onPress={() => router.push('/settings/wifi-auto-download' as any)} />
          <SettingsItem icon="airplane" title="When roaming" value="No media" onPress={() => router.push('/settings/roaming-auto-download' as any)} />
        </View>

        <View style={{ marginTop: 8 }} />
        <View style={{ backgroundColor: Colors.card, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: Colors.lightGray }}>
          <SettingsItem icon="film" title="Media upload quality" value="Auto" description="Higher quality uses more storage and data." onPress={() => router.push('/settings/media-upload-quality' as any)} />
        </View>
      </ScrollView>
    </View>
  );
};

export default StorageAndDataPage;

