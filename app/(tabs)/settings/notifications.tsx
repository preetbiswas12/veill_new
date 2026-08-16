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

const NotificationsPage = () => {
  const router = useRouter();
  const [conversationTones, setConversationTones] = useState(true);
  const [highPriority, setHighPriority] = useState(true);
  const [groupNotifications, setGroupNotifications] = useState(true);
  const [reactionNotif, setReactionNotif] = useState(true);
  const [notificationTone, setNotificationTone] = useState('default');
  const [vibrate, setVibrate] = useState('default');
  const [groupNotificationTone, setGroupNotificationTone] = useState('default');
  const [groupVibrate, setGroupVibrate] = useState('default');
  const [popupNotification, setPopupNotification] = useState('none');
  const [inAppNotifications, setInAppNotifications] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await StorageService.getSettings();
      setConversationTones(settings.conversationTones);
      setHighPriority(settings.highPriorityNotifications);
      setGroupNotifications(settings.groupNotifications);
      setReactionNotif(settings.reactionNotifications);
      setNotificationTone(settings.notificationTone);
      setVibrate(settings.vibrate);
      setGroupNotificationTone(settings.groupNotificationTone);
      setGroupVibrate(settings.groupVibrate);
      setPopupNotification(settings.popupNotification);
      setInAppNotifications(settings.inAppNotifications);
    };
    loadSettings();
  }, []);

  const handleToggle = async (key: string, value: boolean) => {
    await StorageService.updateSetting(key, value);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: Colors.card, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
          <Text style={{ fontSize: 22, fontWeight: '600', color: Colors.text, fontFamily: Fonts.heading }}>Notifications</Text>
        </View>

        <View style={{ backgroundColor: Colors.card, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: Colors.lightGray }}>
          <SettingsItem
            icon="musical-notes"
            title="Conversation tones"
            toggle
            toggleValue={conversationTones}
            onToggle={(val) => {
              setConversationTones(val);
              handleToggle('conversationTones', val);
            }}
            description="Play sounds for incoming messages"
          />
          <SettingsItem icon="volume-high" title="Notification tone" value={notificationTone} onPress={() => router.push('/settings/notification-tone' as any)} />
          <SettingsItem icon="phone-portrait" title="Vibrate" value={vibrate} onPress={() => router.push('/settings/vibrate' as any)} />
          <SettingsItem
            icon="alert-circle"
            title="Use high priority notifications"
            toggle
            toggleValue={highPriority}
            onToggle={(val) => {
              setHighPriority(val);
              handleToggle('highPriorityNotifications', val);
            }}
            description="Show notifications at the top"
          />
          <SettingsItem icon="chatbubble-ellipses" title="Popup notification" value={popupNotification} onPress={() => router.push('/settings/popup-notification' as any)} />
        </View>

        <View style={{ marginTop: 8 }} />
        <View style={{ backgroundColor: Colors.card, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: Colors.lightGray }}>
          <SettingsItem
            icon="chatbubbles"
            title="Message notifications"
            toggle
            toggleValue={groupNotifications}
            onToggle={(val) => {
              setGroupNotifications(val);
              handleToggle('groupNotifications', val);
            }}
          />
          <SettingsItem icon="volume-high" title="Group notifications tone" value={groupNotificationTone} onPress={() => router.push('/settings/group-notification-tone' as any)} />
          <SettingsItem icon="phone-portrait" title="Vibrate" value={groupVibrate} onPress={() => router.push('/settings/group-vibrate' as any)} />
        </View>

        <View style={{ marginTop: 8 }} />
        <View style={{ backgroundColor: Colors.card, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: Colors.lightGray }}>
          <SettingsItem
            icon="happy"
            title="Reaction notifications"
            toggle
            toggleValue={reactionNotif}
            onToggle={(val) => {
              setReactionNotif(val);
              handleToggle('reactionNotifications', val);
            }}
          />
          <SettingsItem
            icon="notifications"
            title="In-app notifications"
            toggle
            toggleValue={inAppNotifications}
            onToggle={(val) => {
              setInAppNotifications(val);
              handleToggle('inAppNotifications', val);
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default NotificationsPage;
