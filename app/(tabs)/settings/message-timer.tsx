import OptionSelector from '@/components/OptionSelector';
import { useState, useEffect } from 'react';
import StorageService from '@/utils/storage';

const MessageTimerPage = () => {
  const [selected, setSelected] = useState('off');

  useEffect(() => {
    const loadTimer = async () => {
      const settings = await StorageService.getSettings();
      setSelected(settings.messageTimer || 'off');
    };
    loadTimer();
  }, []);

  const handleSelect = async (value: string) => {
    setSelected(value);
    await StorageService.updateSetting('messageTimer', value);
  };

  return (
    <OptionSelector
      title="Default message timer"
      description="Set the default timer for new chats. Messages will disappear after the selected duration. This does not affect existing chats."
      options={[
        { label: 'Off', value: 'off', description: 'Messages do not disappear' },
        { label: '24 hours', value: '24h' },
        { label: '7 days', value: '7d' },
        { label: '90 days', value: '90d' },
      ]}
      selected={selected}
      onSelect={handleSelect}
    />
  );
};

export default MessageTimerPage;
