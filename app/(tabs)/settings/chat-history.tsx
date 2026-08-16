import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { alert } from '@/utils/customAlert';
import Colors from '@/constants/Colors';

import { SectionBlock, PageHeader } from '@/components/SettingsUI';
import { Ionicons } from '@expo/vector-icons';

const ChatHistoryPage = () => {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <PageHeader title="Chat history" />

        <Text style={{ fontSize: 13, color: '#8696A0', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 }}>
          Export, archive, clear, or delete all chats.
        </Text>

        <SectionBlock marginTop={0}>
          <TouchableOpacity
            activeOpacity={0.5}
            onPress={() =>
              alert('Export chat', 'Export all chats with media or without media.', [
                { text: 'Without media', onPress: () => alert('Started', 'Chat export has started.') },
                { text: 'With media', onPress: () => alert('Started', 'Chat export with media has started.') },
                { text: 'Cancel', style: 'cancel' },
              ])
            }>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: Colors.lightGray }}>
              <Ionicons name="share" size={22} color="#00A884" />
              <Text style={{ fontSize: 16, color: Colors.text, marginLeft: 12 }}>Export chat</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.5}
            onPress={() => alert('Archive all chats', 'Archive all your current chats?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'OK', onPress: () => alert('Done', 'All chats archived.') },
            ])}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: Colors.lightGray }}>
              <Ionicons name="archive" size={22} color="#00A884" />
              <Text style={{ fontSize: 16, color: Colors.text, marginLeft: 12 }}>Archive all chats</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.5}
            onPress={() => alert('Clear all chats', 'This will delete all messages from your chats. Your groups will still be intact.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: () => alert('Done', 'All chats cleared.') },
            ])}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: Colors.lightGray }}>
              <Ionicons name="trash" size={22} color="#E08D00" />
              <Text style={{ fontSize: 16, color: '#E08D00', marginLeft: 12 }}>Clear all chats</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.5}
            onPress={() => alert('Delete all chats', 'Delete all chats from your phone?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => alert('Done', 'All chats deleted.') },
            ])}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, paddingHorizontal: 16, paddingVertical: 14 }}>
              <Ionicons name="trash" size={22} color="#EF0827" />
              <Text style={{ fontSize: 16, color: '#EF0827', marginLeft: 12 }}>Delete all chats</Text>
            </View>
          </TouchableOpacity>
        </SectionBlock>
      </ScrollView>
    </View>
  );
};

export default ChatHistoryPage;

