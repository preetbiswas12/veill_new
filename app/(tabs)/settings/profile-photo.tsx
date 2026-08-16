import OptionSelector from '@/components/OptionSelector';
import { useState, useEffect } from 'react';
import StorageService from '@/utils/storage';

const ProfilePhotoPage = () => {
  const [selected, setSelected] = useState('everyone');

  useEffect(() => {
    const loadProfilePhoto = async () => {
      const settings = await StorageService.getSettings();
      setSelected(settings.profilePhoto || 'everyone');
    };
    loadProfilePhoto();
  }, []);

  const handleSelect = async (value: string) => {
    setSelected(value);
    await StorageService.updateSetting('profilePhoto', value);
  };

  return (
    <OptionSelector
      title="Profile photo"
      description="Who can see my profile photo"
      options={[
        { label: 'Everyone', value: 'everyone' },
        { label: 'My contacts', value: 'contacts' },
        { label: 'My contacts except...', value: 'except', description: 'Choose contacts to exclude' },
        { label: 'Nobody', value: 'nobody' },
      ]}
      selected={selected}
      onSelect={handleSelect}
    />
  );
};

export default ProfilePhotoPage;
