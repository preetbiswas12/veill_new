import { useCometChat } from '@/hooks/useCometChat';
import { View } from 'react-native';
import { TouchableOpacity, Text } from 'react-native';

const ToggleVideo = () => {
  const { toggleVideo, videoEnabled } = useCometChat();

  return (
    <TouchableOpacity
      onPress={toggleVideo}
      className="w-12 h-12 rounded-full items-center justify-center bg-[#373737] p-4"
      accessibilityLabel={videoEnabled ? 'Stop video' : 'Start video'}
    >
      <Text style={{ color: '#fff', fontSize: 24 }}>
        {videoEnabled ? '📹' : '📷'}
      </Text>
    </TouchableOpacity>
  );
};

export default ToggleVideo;