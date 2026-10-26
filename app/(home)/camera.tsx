import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { setPendingCapture } from '@/lib/capture';
import { showAlertDialog } from '@/components/AlertDialog';

/**
 * Capture screen.
 *
 * expo-image-picker's `launchCameraAsync` hands off to the OS camera app, which
 * gives no control over whether the shutter records a photo or a video. This is
 * an in-app camera for that reason: one shutter, a photo/video toggle above it,
 * and record/stop while in video mode.
 *
 * The result is handed back to the composer through a router param, since that
 * is how the rest of the modal flow already passes values.
 */
type Mode = 'photo' | 'video';

const CameraScreen = () => {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [mode, setMode] = useState<Mode>('photo');
  const [recording, setRecording] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [busy, setBusy] = useState(false);

  const hasCamera = cameraPermission?.granted ?? false;
  const hasMic = micPermission?.granted ?? false;

  const ensurePermissions = async (needsMic: boolean) => {
    if (!hasCamera) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        showAlertDialog('Camera needed', 'Allow camera access to take a photo.');
        return false;
      }
    }
    if (needsMic && !hasMic) {
      const result = await requestMicPermission();
      if (!result.granted) {
        showAlertDialog('Microphone needed', 'Allow microphone access to record video.');
        return false;
      }
    }
    return true;
  };

  const finish = (uri: string, kind: Mode) => {
    setPendingCapture({ uri, kind });
    router.back();
  };

  const shoot = async () => {
    if (busy || !cameraRef.current) return;
    if (mode === 'photo') {
      if (!(await ensurePermissions(false))) return;
      setBusy(true);
      try {
        const shot = await cameraRef.current.takePictureAsync({ quality: 0.9 });
        if (shot?.uri) finish(shot.uri, 'photo');
      } catch {
        showAlertDialog('Could not take the photo', 'The camera reported an error.');
      } finally {
        setBusy(false);
      }
      return;
    }

    // Video: first press starts, second press stops and sends the clip.
    if (recording) {
      setBusy(true);
      try {
        await cameraRef.current.stopRecording();
      } catch {
        showAlertDialog('Could not stop the recording', 'The camera reported an error.');
      } finally {
        setBusy(false);
      }
      return;
    }

    if (!(await ensurePermissions(true))) return;
    setRecording(true);
    try {
      // recordAsync resolves with the clip once stopRecording, maxDuration or
      // maxFileSize ends it.
      const result = await cameraRef.current.recordAsync({ maxDuration: 60 });
      if (result?.uri) finish(result.uri, 'video');
    } catch {
      showAlertDialog('Could not record', 'The camera reported an error.');
    } finally {
      setRecording(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back">
        {/* Photo / video toggle. */}
        <SafeAreaView edges={['top']} className="flex-row items-center justify-between px-4 py-2">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Close camera"
            hitSlop={10}
          >
            <Ionicons name="close" size={28} color="#ffffff" />
          </Pressable>

          <View className="flex-row items-center rounded-full bg-black/50 px-1 py-1">
            {(['photo', 'video'] as Mode[]).map((option) => (
              <Pressable
                key={option}
                onPress={() => {
                  if (recording) return;
                  setMode(option);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: mode === option }}
                className={`px-4 py-1 rounded-full ${
                  mode === option ? 'bg-white' : 'bg-transparent'
                }`}
              >
                <Text
                  className="text-body-2 font-semibold"
                  style={{ color: mode === option ? '#0a0a0a' : '#ffffff' }}
                >
                  {option === 'photo' ? 'Photo' : 'Video'}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="w-7" />
        </SafeAreaView>

        {/* Shutter. */}
        <SafeAreaView edges={['bottom']} className="mt-auto items-center py-8">
          {mode === 'video' && recording ? (
            <Text className="mb-3 text-body-2 text-white">Recording — tap to stop</Text>
          ) : null}
          <Pressable
            onPress={() => void shoot()}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={recording ? 'Stop recording' : mode === 'photo' ? 'Take photo' : 'Record video'}
            className="h-20 w-20 rounded-full border-4 border-white items-center justify-center active:opacity-70"
          >
            <View
              className={
                recording
                  ? 'w-8 h-8 rounded-[6px] bg-red-600'
                  : mode === 'video'
                    ? 'w-14 h-14 rounded-full bg-red-600'
                    : 'w-14 h-14 rounded-full bg-white'
              }
            />
          </Pressable>
        </SafeAreaView>
      </CameraView>
    </View>
  );
};

export default CameraScreen;