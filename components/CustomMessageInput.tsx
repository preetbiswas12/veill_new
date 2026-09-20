import { View, TextInput, Text } from 'react-native';
import { useCometChat } from '@/hooks/useCometChat';
import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import Button from './Button';

interface CustomMessageInputProps {
  conversationId?: string;
  onSend?: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const CustomMessageInput = ({ 
  conversationId, 
  onSend, 
  placeholder = "Message",
  disabled = false 
}: CustomMessageInputProps) => {
  const { sendTextMessage } = useCometChat();
  const [text, setText] = useState('');

  const handleSend = async () => {
    if (!text.trim() || !conversationId) return;
    const messageText = text;
    setText('');
    if (onSend) {
      onSend(messageText);
    } else {
      await sendTextMessage(conversationId, messageText, 'user');
    }
  };

  return (
    <View className="flex-row items-center gap-2 p-4 bg-white border-t border-gray-100">
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-base"
        maxLength={1000}
        multiline
        editable={!disabled}
      />
      <Button
        variant="plain"
        onPress={handleSend}
        disabled={!text.trim() || disabled}
        className="p-0.5 bg-primary rounded-full"
      >
        <Feather name="arrow-up" size={24} color="white" />
      </Button>
    </View>
  );
};

export default CustomMessageInput;
