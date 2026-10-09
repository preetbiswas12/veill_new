import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleProp, ViewStyle } from 'react-native';

interface VideoAttachmentProps {
  uri: string;
  style?: StyleProp<ViewStyle>;
}

/** Inline video playback for message bubbles and story viewing. */
const VideoAttachment = ({ uri, style }: VideoAttachmentProps) => {
  const player = useVideoPlayer(uri);

  return (
    <VideoView
      player={player}
      style={style}
      contentFit="contain"
      nativeControls
    />
  );
};

export default VideoAttachment;
