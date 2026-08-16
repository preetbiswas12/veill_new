import OptionSelector from '@/components/OptionSelector';
import { useState, useEffect } from 'react';
import StorageService from '@/utils/storage';

const LastSeenPage = () => {
  const [selected, setSelected] = useState('everyone');

  useEffect(() => {
    const loadLastSeen = async () => {
      const settings = await StorageService.getSettings();
      setSelected(settings.lastSeen || 'everyone');
    };
    loadLastSeen();
  }, []);

  const handleSelect = async (value: string) => {
    setSelected(value);
    await StorageService.updateSetting('lastSeen', value);
  };

  return (
    <OptionSelector
      title="Last seen and online"
      description="Who can see my last seen"
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

export default LastSeenPage;
