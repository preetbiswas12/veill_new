import OptionSelector from '@/components/OptionSelector';
import { useState, useEffect } from 'react';
import StorageService from '@/utils/storage';

const PopupNotificationPage = () => {
  const [selected, setSelected] = useState('no_popup');

  useEffect(() => {
    const loadPopup = async () => {
      const settings = await StorageService.getSettings();
      setSelected(settings.popupNotification || 'no_popup');
    };
    loadPopup();
  }, []);

  const handleSelect = async (value: string) => {
    setSelected(value);
    await StorageService.updateSetting('popupNotification', value);
  };

  return (
    <OptionSelector
      title="Popup notification"
      description="Choose how popup notifications are displayed"
      options={[
        { label: 'No popup', value: 'no_popup', description: 'Notification appears in status bar only' },
        { label: 'Only when screen "on"', value: 'screen_on', description: 'Popup appears when screen is on' },
        { label: 'Only when screen "off"', value: 'screen_off', description: 'Popup appears when screen is off' },
        { label: 'Always show popup', value: 'always', description: 'Always show popup notification' },
      ]}
      selected={selected}
      onSelect={handleSelect}
    />
  );
};

export default PopupNotificationPage;
