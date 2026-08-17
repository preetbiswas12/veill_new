import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import contacts from '@/assets/data/contacts.json';
import Colors from '@/constants/Colors';
import Fonts from '@/constants/Fonts';
import { AlphabetList } from 'react-native-section-alphabet-list';
import { defaultStyles } from '@/constants/Styles';
import { useRouter } from 'expo-router';
import StorageService from '@/utils/storage';
import EncryptionService from '@/utils/encryption';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 8);

const Page = () => {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [serverUsers, setServerUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const localContacts = contacts.map((contact, index) => ({
    value: `${contact.first_name} ${contact.last_name}`,
    name: `${contact.first_name} ${contact.last_name}`,
    img: contact.img,
    desc: contact.desc,
    key: `${contact.first_name} ${contact.last_name}-${index}`,
    firstName: contact.first_name,
    lastName: contact.last_name,
  }));

  const displayData = serverUsers.length > 0 ? serverUsers : localContacts;

  const filteredData = displayData.filter((item) =>
    item.name.toLowerCase().includes(searchText.toLowerCase())
  );

  useEffect(() => {
    const searchServerUsers = async () => {
      if (searchText.length < 2) {
        setServerUsers([]);
        return;
      }

      setLoading(true);
      try {
        const serverUrl = 'https://veill.qzz.io';
        const response = await fetch(`${serverUrl}/api/auth/search?q=${encodeURIComponent(searchText)}`);
        if (response.ok) {
          const data = await response.json();
          const mappedUsers = data.users.map((user: any) => ({
            value: user.display_name || user.username,
            name: user.display_name || user.username,
            img: user.avatar_url || 'https://i.pravatar.cc/150',
            desc: `User ID: ${user.id}`,
            key: `server-${user.id}`,
            serverId: user.id,
            userId: user.userId,
          }));
          setServerUsers(mappedUsers);
        }
      } catch (err) {
        console.log('[NewChat] Server search failed, using local contacts');
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(searchServerUsers, 300);
    return () => clearTimeout(timeout);
  }, [searchText]);

  const handleContactPress = async (contact: any) => {
    let chatId: string;
    let peerId: number;

    if (contact.serverId) {
      chatId = `server-${contact.serverId}`;
      peerId = contact.serverId;
    } else {
      chatId = `contact-${contact.firstName}-${contact.lastName}-${generateId()}`;
      peerId = Date.now();
    }

    const existingChats = await StorageService.getChats();
    const existingChat = existingChats.find((c) => c.from === contact.name);

    let finalChatId = chatId;
    if (existingChat) {
      finalChatId = existingChat.id;
      peerId = parseInt(existingChat.id.replace(/\D/g, '').slice(0, 8)) || peerId;
    } else {
      const newChat = {
        id: chatId,
        from: contact.name,
        date: new Date().toISOString(),
        img: contact.img,
        msg: '',
        read: true,
        unreadCount: 0,
      };
      await StorageService.saveChats([newChat, ...existingChats]);
    }

    if (contact.userId || contact.serverId) {
      try {
        const peerPublicKey = await EncryptionService.getPeerKey(String(peerId));
        if (!peerPublicKey) {
          const keyPair = await EncryptionService.generateKeyPair();
          if (contact.userId) {
            await EncryptionService.setPeerKey(String(contact.userId), keyPair.publicKey);
          }
          await EncryptionService.setPeerKey(String(peerId), keyPair.publicKey);
        }
      } catch (err) {
        console.error('[NewChat] Key exchange error:', err);
      }
    }

    router.push(`/chats/${finalChatId}`);
  };

  return (
    <View style={{ flex: 1, paddingTop: 110, backgroundColor: Colors.background }}>
      <View style={styles.searchContainer}>
        <Text style={styles.searchLabel}>New Chat</Text>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search name or number"
            placeholderTextColor={Colors.text}
            value={searchText}
            onChangeText={setSearchText}
          />
          {loading && <ActivityIndicator size="small" color={Colors.primary} />}
        </View>
      </View>
      {filteredData.length === 0 ? (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: Colors.text }}>No contacts found</Text>
        </View>
      ) : (
        <AlphabetList
          data={filteredData}
          indexLetterStyle={{
            color: Colors.text,
            fontSize: 12,
          }}
          indexContainerStyle={{
            width: 24,
            backgroundColor: Colors.background,
          }}
          renderCustomItem={(item: any) => (
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => handleContactPress(item)}>
              <View style={styles.listItemContainer}>
                <Image source={{ uri: item.img }} style={styles.listItemImage} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: Colors.text, fontSize: 14 }}>{item.value}</Text>
                  <Text style={{ color: Colors.text, fontSize: 12 }} numberOfLines={1}>
                    {item.desc && item.desc.length > 40 ? `${item.desc.substring(0, 40)}...` : item.desc}
                  </Text>
                </View>
              </View>
              <View style={[defaultStyles.separator, { marginLeft: 50 }]} />
            </TouchableOpacity>
          )}
          renderCustomSectionHeader={(section) => (
            <View style={styles.sectionHeaderContainer}>
              <Text style={{ color: Colors.text }}>{section.title}</Text>
            </View>
          )}
          style={{
            marginLeft: 14,
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    backgroundColor: Colors.background,
  },
  searchLabel: {
    fontSize: 28,
    fontWeight: '600',
    fontFamily: Fonts.heading,
    marginBottom: 10,
    color: Colors.text,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  listItemContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 50,
    paddingHorizontal: 14,
    backgroundColor: Colors.card,
  },

  listItemImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },

  sectionHeaderContainer: {
    height: 30,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
});

export default Page;
