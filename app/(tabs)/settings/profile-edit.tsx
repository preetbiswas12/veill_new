import Colors from '@/constants/Colors';
import Fonts from '@/constants/Fonts';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { alert } from '@/utils/customAlert';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import StorageService from '@/utils/storage';

const ProfileEditScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    name: string;
    about: string;
    avatar: string;
  }>();

  const [name, setName] = useState(params.name || 'John Doe');
  const [about, setAbout] = useState(params.about || 'Hey there! I am using Veill.');
  const [avatar, setAvatar] = useState(
    params.avatar || 'https://i.pravatar.cc/150?u=settings-user'
  );
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    if (Platform.OS === 'ios') {
      alert('Change Profile Photo', 'Choose an option', [
        { text: 'Camera', onPress: () => launchCamera() },
        { text: 'Photo Library', onPress: () => launchLibrary() },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } else {
      alert('Change Profile Photo', 'Choose an option', [
        { text: 'Camera', onPress: () => launchCamera() },
        { text: 'Photo Library', onPress: () => launchLibrary() },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const launchCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.granted) {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!result.canceled && result.assets[0]) {
        setAvatar(result.assets[0].uri);
      }
    } else {
      alert('Permission Required', 'Camera access is needed to take a profile photo.');
    }
  };

  const launchLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.granted) {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!result.canceled && result.assets[0]) {
        setAvatar(result.assets[0].uri);
      }
    } else {
      alert('Permission Required', 'Photo library access is needed to change your photo.');
    }
  };

  const saveProfile = async () => {
    if (!name.trim()) {
      alert('Error', 'Name cannot be empty.');
      return;
    }
    setSaving(true);
    await StorageService.saveProfile({ name, about, avatar });
    setSaving(false);
    alert('Profile Updated', 'Your profile has been saved successfully.', [
      {
        text: 'OK',
        onPress: () => {
          router.back();
        },
      },
    ]);
  };

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
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: '600', color: Colors.text, fontFamily: Fonts.heading, flex: 1 }}>
            Edit Profile
          </Text>
          <TouchableOpacity onPress={saveProfile} disabled={saving}>
            <Text style={{ color: Colors.text, fontSize: 16, fontWeight: '500' }}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Profile Photo */}
        <View
          style={{
            backgroundColor: Colors.card,
            marginTop: 16,
            paddingVertical: 20,
            alignItems: 'center',
          }}>
          <TouchableOpacity activeOpacity={0.8} onPress={pickImage}>
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                overflow: 'hidden',
                backgroundColor: '#DADADA',
              }}>
              <Image source={{ uri: avatar }} style={{ width: 120, height: 120 }} />
            </View>
            {/* Camera overlay */}
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: Colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 3,
                borderColor: '#fff',
              }}>
              <Feather name="camera" size={16} color={Colors.text} />
            </View>
          </TouchableOpacity>
          <Text style={{ color: Colors.text, fontSize: 14, marginTop: 12 }}>
            Change Profile Photo
          </Text>
        </View>

        {/* Name Section */}
        <View style={{ backgroundColor: Colors.card, marginTop: 16, paddingHorizontal: 16 }}>
          <View style={{ paddingVertical: 12 }}>
            <Text style={{ color: Colors.text, fontSize: 14 }}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              style={{
                fontSize: 16,
                color: Colors.text,
                marginTop: 4,
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: Colors.primary,
              }}
              maxLength={25}
            />
            <Text style={{ color: Colors.text, fontSize: 12, marginTop: 4 }}>
              {25 - name.length} characters remaining
            </Text>
          </View>
        </View>

        {/* About Section */}
        <View style={{ backgroundColor: Colors.card, marginTop: 16, paddingHorizontal: 16 }}>
          <View style={{ paddingVertical: 12 }}>
            <Text style={{ color: Colors.text, fontSize: 14 }}>About</Text>
            <TextInput
              value={about}
              onChangeText={setAbout}
              placeholder="Add about info"
              style={{
                fontSize: 16,
                color: Colors.text,
                marginTop: 4,
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: Colors.primary,
              }}
              maxLength={139}
            />
            <Text style={{ color: Colors.text, fontSize: 12, marginTop: 4 }}>
              {139 - about.length} characters remaining
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

export default ProfileEditScreen;

