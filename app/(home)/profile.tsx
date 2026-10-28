import { ImagePickerAsset } from 'expo-image-picker';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useCometChat } from '@/hooks/useCometChat';

import Button from '@/components/Button';
import ImageInput from '@/components/ImageInput';
import Screen from '@/components/Screen';
import TextField from '@/components/TextField';
import { getError } from '@/lib/utils';
import { showAlertDialog } from '@/components/AlertDialog';

/**
 * Profile edits the CometChat user directly — there is no separate identity
 * provider, so the display name and avatar are stored on the CometChat
 * account and are what every other client sees.
 */
const ProfileScreen = () => {
  const { user, updateCurrentUserProfile } = useCometChat();
  const [nickName, setNickName] = useState(user?.name || '');
  const [profileImage, setProfileImage] = useState<ImagePickerAsset>({
    uri: user?.image || '',
    width: 100,
    height: 100,
  });
  const [loading, setLoading] = useState(false);

  const updateProfile = async () => {
    const trimmed = nickName.trim();
    if (!trimmed) {
      showAlertDialog('Name required', 'Enter a display name first.');
      return;
    }
    try {
      setLoading(true);
      await updateCurrentUserProfile({
        nickName: trimmed,
        avatarUrl: profileImage.uri || undefined,
      });
      showAlertDialog('Profile updated', 'Your profile has been updated.');
    } catch (error) {
      getError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      viewClassName="pt-3 px-4 items-center gap-6"
      loadingOverlay={loading}
    >
      <View className="items-center gap-3">
        <ImageInput
          name={user?.name || ''}
          imageUri={profileImage.uri || null}
          onChangeImage={(asset) =>
            setProfileImage(asset ?? { ...profileImage, uri: '' })
          }
        />
        <Text className="text-body-2 text-text-muted">
          {user?.id ? `CometChat UID: ${user.id}` : ''}
        </Text>
      </View>
      <View className="gap-3 w-full">
        <TextField
          value={nickName}
          placeholder="Display name"
          onChangeText={setNickName}
        />
      </View>
      <Button onPress={updateProfile} disabled={loading || !nickName.trim()}>
        Save
      </Button>
    </Screen>
  );
};

export default ProfileScreen;