import Colors from '@/constants/Colors';
import Fonts from '@/constants/Fonts';
import { Ionicons } from '@expo/vector-icons';
import { View, ScrollView, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AuthService from '@/utils/auth';

const SettingsItem = ({
  icon,
  title,
  value,
  danger,
  onPress,
}: {
  icon: string;
  title: string;
  value?: string;
  danger?: boolean;
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
      <Ionicons name={icon as any} size={22} color={danger ? Colors.red : Colors.gray} />
      <Text
        style={{
          fontSize: 16,
          flex: 1,
          marginLeft: 12,
          color: danger ? Colors.red : '#000',
        }}>
        {title}
      </Text>
      {value ? (
        <Text style={{ fontSize: 14, color: '#8696A0', marginRight: 4 }}>{value}</Text>
      ) : (
        <Ionicons name="chevron-forward" size={18} color="#B0B0B0" />
      )}
    </View>
  </TouchableOpacity>
);

const AccountPage = () => {
  const router = useRouter();

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
          <Text style={{ fontSize: 22, fontWeight: '600', color: Colors.text, fontFamily: Fonts.heading }}>Account</Text>
        </View>

        <View
          style={{
            backgroundColor: Colors.card,
            borderTopWidth: 0.5,
            borderBottomWidth: 0.5,
            borderColor: Colors.lightGray,
          }}>
          <SettingsItem icon="shield-checkmark" title="Security notifications" onPress={() => router.push('/settings/security-notifications' as any)} />
          <SettingsItem icon="trash" title="Delete my account" danger onPress={() => router.push('/settings/delete-account' as any)} />
        </View>

        <View
          style={{
            backgroundColor: Colors.card,
            borderTopWidth: 0.5,
            borderBottomWidth: 0.5,
            borderColor: Colors.lightGray,
            marginTop: 8,
          }}>
          <SettingsItem icon="log-out-outline" title="Sign out" onPress={() => AuthService.signOut().then(() => router.replace('/auth/sign-in'))} />
        </View>
      </ScrollView>
    </View>
  );
};

export default AccountPage;

