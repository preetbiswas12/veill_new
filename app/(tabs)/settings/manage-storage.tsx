import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { alert } from '@/utils/customAlert';
import { SectionBlock, PageHeader } from '@/components/SettingsUI';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';

const ManageStoragePage = () => {
  const categories = [
    { name: 'Forwarded many times', size: '245 MB', icon: 'repeat', color: Colors.text },
    { name: 'Larger than 5 MB', size: '128 MB', icon: 'document', color: Colors.text },
    { name: 'Photos', size: '1.2 GB', icon: 'image', color: '#00A884' },
    { name: 'Videos', size: '3.4 GB', icon: 'videocam', color: '#00A884' },
    { name: 'Audio', size: '456 MB', icon: 'musical-notes', color: '#00A884' },
    { name: 'Documents', size: '89 MB', icon: 'document-text', color: '#00A884' },
    { name: 'GIFs', size: '34 MB', icon: 'film', color: '#00A884' },
    { name: 'Stickers', size: '12 MB', icon: 'happy', color: '#00A884' },
  ];

  const usedStorage = 5.6;
  const totalStorage = 64;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <PageHeader title="Manage storage" />

        {/* Storage bar */}
        <SectionBlock marginTop={0}>
          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 13, color: '#8696A0' }}>{usedStorage} GB used</Text>
              <Text style={{ fontSize: 13, color: '#8696A0' }}>{totalStorage} GB</Text>
            </View>
            <View style={{ height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, overflow: 'hidden' }}>
              <View style={{ height: '100%', width: `${(usedStorage / totalStorage) * 100}%` as any, backgroundColor: '#00A884', borderRadius: 4 }} />
            </View>
          </View>
        </SectionBlock>

        {/* Review items */}
        <View style={{ marginTop: 8 }} />
        <SectionBlock marginTop={0}>
          <TouchableOpacity activeOpacity={0.5} onPress={() => alert('Forwarded many times', 'Items forwarded 5 or more times')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: Colors.lightGray }}>
              <Ionicons name="repeat" size={22} color="#E08D00" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 16, color: Colors.text }}>Forwarded many times</Text>
              </View>
              <Text style={{ fontSize: 14, color: '#8696A0', marginRight: 4 }}>245 MB</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.5} onPress={() => alert('Larger than 5 MB', 'Items larger than 5 MB')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, paddingHorizontal: 16, paddingVertical: 14 }}>
              <Ionicons name="document" size={22} color="#E08D00" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 16, color: Colors.text }}>Larger than 5 MB</Text>
              </View>
              <Text style={{ fontSize: 14, color: '#8696A0', marginRight: 4 }}>128 MB</Text>
            </View>
          </TouchableOpacity>
        </SectionBlock>

        {/* Categories */}
        <View style={{ marginTop: 8 }} />
        <SectionBlock marginTop={0}>
          {categories.map((cat, index) => (
            <TouchableOpacity
              key={cat.name}
              activeOpacity={0.5}
              onPress={() => alert(cat.name, 'Storage used: ' + cat.size)}>
              <View style={{
                flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
                paddingHorizontal: 16, paddingVertical: 14,
                borderBottomWidth: index < categories.length - 1 ? 0.5 : 0, borderBottomColor: Colors.lightGray,
              }}>
                <Ionicons name={cat.icon as any} size={22} color={cat.color} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 16, color: Colors.text }}>{cat.name}</Text>
                </View>
                <Text style={{ fontSize: 14, color: '#8696A0', marginRight: 4 }}>{cat.size}</Text>
                <Ionicons name="chevron-forward" size={18} color="#B0B0B0" />
              </View>
            </TouchableOpacity>
          ))}
        </SectionBlock>
      </ScrollView>
    </View>
  );
};

export default ManageStoragePage;

