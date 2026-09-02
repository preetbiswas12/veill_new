import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  Animated,
  Easing,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../navigation/types';
import dailyCallService, { ActiveCall, CallPhase } from '../../../utils/daily';

type Nav = StackNavigationProp<RootStackParamList, 'CallScreen'>;
type Route = RouteProp<RootStackParamList, 'CallScreen'>;

async function requestPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const grants = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      PermissionsAndroid.PERMISSIONS.CAMERA,
    ]);
    return (
      grants[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED &&
      grants[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED
    );
  } catch {
    return false;
  }
}

const CallScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const incomingCall = route.params?.incoming;
  const [phase, setPhase] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [call, setCall] = useState<ActiveCall | null>(incomingCall || null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pulse animation for connecting state
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  useEffect(() => {
    const off = dailyCallService.onCallStateChanged((state: { phase: CallPhase; call: ActiveCall | null }) => {
      if (state.call && state.call.callId !== call?.callId) {
        setCall(state.call);
      }
      if (state.phase === 'connected') setPhase('connected');
      if (state.phase === 'ended') {
        setPhase('ended');
        (async () => {
          try {
            const notifee = (await import('@notifee/react-native')).default;
            await notifee.cancelNotification('veill_incoming_call');
          } catch {}
        })();
        setTimeout(() => navigation.goBack(), 600);
      }
    });
    return off;
  }, [call?.callId, navigation]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const ok = await requestPermissions();
      if (!ok) {
        console.warn('[CallScreen] Mic/Camera permission denied');
        return;
      }
      try {
        const IncallManager = (await import('react-native-incall-manager')).default;
        IncallManager.start({ media: call?.isVideo ? 'video' : 'audio' });
        IncallManager.setKeepScreenOn(true);
        IncallManager.setForceSpeakerphoneOn(call?.isVideo ?? false);
      } catch (err) {
        console.warn('[CallScreen] IncallManager start failed:', err);
      }
      const c = dailyCallService.getState().call;
      if (c) {
        setCall(c);
        await dailyCallService.joinCall(c);
      }
    })();
    return () => {
      mounted = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      (async () => {
        try {
          const IncallManager = (await import('react-native-incall-manager')).default;
          IncallManager.stop();
        } catch {}
      })();
    };
  }, []);

  useEffect(() => {
    if (phase === 'connected') {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  const toggleMute = () => {
    const next = dailyCallService.toggleMic();
    setMuted(!next);
  };

  const toggleCamera = () => {
    const next = dailyCallService.toggleCamera();
    setCameraOff(!next);
  };

  const hangup = async () => {
    await dailyCallService.endCall('local');
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const ss = (s % 60).toString().padStart(2, '0');
    return `${m}:${ss}`;
  };

  if (!call) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#00a884" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Video surface for video calls */}
      {call.isVideo && phase !== 'connecting' && (
        <View style={styles.videoSurface}>
          <DailyVideoPreview />
        </View>
      )}

      {/* Top gradient overlay */}
      <View style={styles.topGradient} />

      {/* Peer info */}
      <View style={styles.peerInfo}>
        <Animated.View
          style={[
            styles.avatar,
            {
              opacity: phase === 'connecting' ? pulseAnim : 1,
              transform: [
                {
                  scale: phase === 'connecting'
                    ? pulseAnim.interpolate({
                        inputRange: [0.4, 1],
                        outputRange: [0.92, 1.08],
                      })
                    : 1,
                },
              ],
            },
          ]}
        >
          <Text style={styles.avatarText}>
            {call.peerName?.[0]?.toUpperCase() || '?'}
          </Text>
        </Animated.View>
        <Text style={styles.peerName}>{call.peerName}</Text>
        <Text style={styles.phase}>
          {phase === 'connecting'
            ? call.isVideo
              ? 'Connecting video...'
              : 'Connecting...'
            : phase === 'ended'
            ? 'Call ended'
            : formatTime(elapsed)}
        </Text>
        {call.isVideo && phase === 'connected' && (
          <Text style={styles.subtle}>Video call</Text>
        )}
      </View>

      {/* Spacer for controls */}
      <View style={styles.spacer} />

      {/* Bottom controls */}
      <View style={styles.controls}>
        <View style={styles.controlRow}>
          {/* Mute */}
          <View style={styles.controlItem}>
            <Pressable
              style={[styles.controlBtn, muted && styles.controlBtnActive]}
              onPress={toggleMute}
            >
              <Text style={styles.controlIcon}>{muted ? '🔇' : '🎤'}</Text>
            </Pressable>
            <Text style={styles.controlLabel}>{muted ? 'Unmute' : 'Mute'}</Text>
          </View>

          {/* Camera (video calls only) */}
          {call.isVideo && (
            <View style={styles.controlItem}>
              <Pressable
                style={[styles.controlBtn, cameraOff && styles.controlBtnActive]}
                onPress={toggleCamera}
              >
                <Text style={styles.controlIcon}>{cameraOff ? '📷' : '📹'}</Text>
              </Pressable>
              <Text style={styles.controlLabel}>
                {cameraOff ? 'Camera on' : 'Camera off'}
              </Text>
            </View>
          )}
        </View>

        {/* End call button */}
        <View style={styles.endBtnWrap}>
          <Pressable style={styles.endBtn} onPress={hangup}>
            <Text style={styles.endBtnText}>End</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const DailyVideoPreview: React.FC = () => {
  const videoRef = useRef<any>(null);
  const callObj = dailyCallService.getCallObject();

  useEffect(() => {
    const obj = dailyCallService.getCallObject();
    if (obj && videoRef.current) {
      try {
        obj.setVideoRenderer(videoRef.current, 'fullscreen');
      } catch {}
    }
  }, [callObj]);

  return <View ref={videoRef} style={styles.videoContent} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b141a',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b141a',
  },
  videoSurface: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  videoContent: {
    flex: 1,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1,
  },
  peerInfo: {
    alignItems: 'center',
    paddingTop: 60,
    zIndex: 2,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarText: {
    color: '#e9edef',
    fontSize: 52,
    fontWeight: '700',
  },
  peerName: {
    color: '#e9edef',
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  phase: {
    color: '#8696a0',
    marginTop: 6,
    fontSize: 15,
  },
  subtle: {
    color: '#8696a0',
    fontSize: 13,
    marginTop: 4,
  },
  spacer: {
    flex: 1,
  },
  controls: {
    paddingHorizontal: 40,
    paddingBottom: 40,
    zIndex: 2,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 48,
    marginBottom: 32,
  },
  controlItem: {
    alignItems: 'center',
    gap: 8,
  },
  controlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  controlBtnActive: {
    backgroundColor: '#00a884',
    borderColor: '#00a884',
  },
  controlIcon: {
    fontSize: 22,
  },
  controlLabel: {
    color: '#8696a0',
    fontSize: 12,
    fontWeight: '500',
  },
  endBtnWrap: {
    alignItems: 'center',
  },
  endBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ea4335',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#ea4335',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  endBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default CallScreen;
