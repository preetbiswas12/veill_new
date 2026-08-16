import Colors from '@/constants/Colors';
import Fonts from '@/constants/Fonts';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { View, ScrollView, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import StorageService from '@/utils/storage';

const SEPARATOR_COLOR = '#E0E0E0';

const SettingsItem = ({
  icon,
  iconFamily = 'Ionicons',
  title,
  route,
  router,
  showChevron = true,
  value,
}: {
  icon: string;
  iconFamily?: string;
  title: string;
  route?: string;
  router: any;
  showChevron?: boolean;
  value?: string;
}) => (
  <TouchableOpacity
    onPress={() => route && router.push(route)}
    activeOpacity={route ? 0.5 : 1}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.card,
      paddingHorizontal: 16,
      paddingVertical: 14,
    }}>
    <View style={{ width: 36, alignItems: 'center' }}>
      {iconFamily === 'Ionicons' && (
        <Ionicons name={icon as any} size={22} color={Colors.text} />
      )}
      {iconFamily === 'MaterialCommunity' && (
        <MaterialCommunityIcons name={icon as any} size={22} color={Colors.text} />
      )}
      {iconFamily === 'Feather' && (
        <Feather name={icon as any} size={22} color={Colors.text} />
      )}
    </View>
    <Text style={{ fontSize: 16, flex: 1, marginLeft: 12, color: Colors.text }}>{title}</Text>
    {value && (
      <Text style={{ fontSize: 14, color: Colors.text, marginRight: 4 }}>{value}</Text>
    )}
    {showChevron && route && (
      <Ionicons name="chevron-forward" size={18} color="#B0B0B0" />
    )}
  </TouchableOpacity>
);

const Section = ({ children }: { children: React.ReactNode }) => (
  <View
    style={{
      backgroundColor: Colors.card,
      borderTopWidth: 0.5,
      borderBottomWidth: 0.5,
      borderColor: SEPARATOR_COLOR,
      marginTop: 8,
    }}>
    {children}
  </View>
);

const Page = () => {
  const router = useRouter();
  const [profileName, setProfileName] = useState('John Doe');
  const [profileAbout, setProfileAbout] = useState('Hey there! I am using Veill.');
  const [profileAvatar, setProfileAvatar] = useState('https://i.pravatar.cc/150?u=settings-user');

  useEffect(() => {
    const loadProfile = async () => {
      const profile = await StorageService.getProfile();
      setProfileName(profile.name);
      setProfileAbout(profile.about);
      setProfileAvatar(profile.avatar);
    };
    loadProfile();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header bar */}
        <View
          style={{
            backgroundColor: Colors.card,
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 12,
          }}>
          <Text style={{ fontSize: 22, fontWeight: '600', color: Colors.text, fontFamily: Fonts.heading }}>Settings</Text>
        </View>

        {/* Profile card - TAP TO EDIT */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() =>
            router.push({
              pathname: '/settings/profile-edit',
              params: {
                name: profileName,
                about: profileAbout,
                avatar: profileAvatar,
              },
            })
          }
          style={{
            backgroundColor: Colors.card,
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: 'row',
            alignItems: 'center',
            borderTopWidth: 0.5,
            borderBottomWidth: 0.5,
            borderColor: SEPARATOR_COLOR,
          }}>
          {/* Avatar */}
          <View
            style={{
              width: 68,
              height: 68,
              borderRadius: 34,
              backgroundColor: '#DADADA',
              overflow: 'hidden',
            }}>
            <Image
              source={{ uri: profileAvatar }}
              style={{ width: 68, height: 68 }}
            />
          </View>
          {/* Name and about */}
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '500', color: Colors.text }}>
              {profileName}
            </Text>
            <Text style={{ fontSize: 14, color: '#667781', marginTop: 2 }} numberOfLines={1}>
              {profileAbout}
            </Text>
          </View>
          {/* Edit pencil icon */}
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: '#E0E0E0',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Feather name="edit-2" size={16} color={Colors.text} />
          </View>
        </TouchableOpacity>

        {/* Main settings items */}
        <Section>
          <SettingsItem
            icon="key"
            title="Account"
            route="/settings/account"
            router={router}
          />
          <SettingsItem
            icon="lock-closed"
            title="Privacy"
            route="/settings/privacy"
            router={router}
          />
          <SettingsItem
            icon="chatbubble"
            title="Chats"
            route="/settings/chats-settings"
            router={router}
          />
          <SettingsItem
            icon="notifications"
            title="Notifications"
            route="/settings/notifications"
            router={router}
          />
          <SettingsItem
            icon="pie-chart"
            iconFamily="Feather"
            title="Storage and Data"
            route="/settings/storage-and-data"
            router={router}
          />
          <SettingsItem
            icon="help-circle"
            title="Help"
            route="/settings/help"
            router={router}
          />
        </Section>

        {/* Bottom section */}
        <Section>
          <SettingsItem
            icon="megaphone"
            title="Invite a Friend"
            router={router}
            showChevron={false}
          />
        </Section>

        {/* Version */}
        <Text
          style={{
            textAlign: 'center',
            color: '#8696A0',
            fontSize: 13,
            marginTop: 20,
            marginBottom: 40,
          }}>
          Veill 2.24.12.76
        </Text>
      </ScrollView>
    </View>
  );
};

export default Page;

