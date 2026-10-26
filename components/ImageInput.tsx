import * as ImagePicker from 'expo-image-picker';
import { useEffect } from 'react';
import { Pressable } from 'react-native';

import { Feather } from '@expo/vector-icons';
import Avatar from './Avatar';
import { showAlertDialog } from '@/components/AlertDialog';

interface ImageInputProps {
  name?: string;
  imageUri: string | null;
  onChangeImage: (file: ImagePicker.ImagePickerAsset | null) => void;
}

function ImageInput({ name, imageUri, onChangeImage }: ImageInputProps) {
  const requestPermission = async () => {
    try {
      const { granted } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted)
        alert('You need to enable permission to access the library');
    } catch (error) {
      console.error('Error requesting media library permissions:', error);
    }
  };

  useEffect(() => {
    void requestPermission();
  }, []);

  const handlePress = () => {
    if (!imageUri) selectImage();
    else
      showAlertDialog('Delete', 'Are you sure you want to delete this image?', [
        {
          text: 'Yes',
          onPress: () => onChangeImage(null),
        },
        { text: 'No' },
      ]);
    return;
  };

  const selectImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
      });

      if (!result.canceled) {
        onChangeImage(result.assets[0]);
        return;
      }
    } catch (error) {
      console.error('Error selecting image:', error);
    }
  };

  return (
    <Pressable onPress={handlePress} className="items-center justify-center">
      <Avatar
        imageUrl={imageUri!}
        size={100}
        fontSize={40}
        name={name || 'User'}
        placeholderType={name ? 'text' : 'icon'}
      />
      {imageUri && (
        <Feather
          color="#ffffff78"
          name="edit-2"
          size={40}
          className="absolute"
        />
      )}
    </Pressable>
  );
}

export default ImageInput;
