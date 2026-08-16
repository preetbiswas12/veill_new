import Colors from '@/constants/Colors';
import Fonts from '@/constants/Fonts';
import { Ionicons } from '@expo/vector-icons';
import { View, ScrollView, Text, TouchableOpacity, Linking } from 'react-native';
import { alert } from '@/utils/customAlert';

const SettingsItem = ({
  icon,
  title,
  onPress,
}: {
  icon: string;
  title: string;
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
      <Text style={{ fontSize: 16, flex: 1, marginLeft: 12, color: Colors.text }}>{title}</Text>
      <Ionicons name="chevron-forward" size={18} color="#B0B0B0" />
    </View>
  </TouchableOpacity>
);

const HelpPage = () => {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View
          style={{
            backgroundColor: Colors.card,
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 12,
          }}>
          <Text style={{ fontSize: 22, fontWeight: '600', color: Colors.text, fontFamily: Fonts.heading }}>Help</Text>
        </View>

        {/* Help items */}
        <View
          style={{
            backgroundColor: Colors.card,
            borderTopWidth: 0.5,
            borderBottomWidth: 0.5,
            borderColor: Colors.lightGray,
          }}>
          <SettingsItem
            icon="help-circle"
            title="Help Center"
            onPress={() => Linking.openURL('https://faq.veill.app')}
          />
          <SettingsItem
            icon="document-text"
            title="Terms and Privacy Policy"
            onPress={() => Linking.openURL('https://www.veill.app/legal')}
          />
          <SettingsItem
            icon="information-circle"
            title="Channel info"
            onPress={() => alert('Channel info', 'Veill Messenger — a 100% free messaging app.')}
          />
        </View>

        {/* App info */}
        <View
          style={{
            alignItems: 'center',
            paddingTop: 32,
            paddingBottom: 40,
          }}>
          <Ionicons name="chatbubbles" size={40} color="#00A884" />
          <Text style={{ fontSize: 14, color: '#8696A0', marginTop: 8 }}>Veill Messenger</Text>
          <Text style={{ fontSize: 13, color: '#8696A0', marginTop: 2 }}>Version 2.24.12.76</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default HelpPage;


