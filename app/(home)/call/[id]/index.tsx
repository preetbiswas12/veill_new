import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import Avatar from '@/components/Avatar';
import Screen from '@/components/Screen';
import { getCallingSdk, useCometChat } from '@/hooks/useCometChat';
import { useTheme } from '@/hooks/useTheme';
import { showAlertDialog } from '@/components/AlertDialog';

/** Elapsed call time, ticking only while the call is actually up. */
const useCallTimer = (running: boolean) => {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [running]);
  return seconds;
};

const formatDuration = (total: number): string => {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

/**
 * One circular control on the call screens. 64pt, per the design's Accept /
 * Decline and the in-call row.
 */
const CallControl = ({
  icon,
  label,
  onPress,
  tone,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  tone: 'accept' | 'decline' | 'neutral';
}) => {
  const { colors } = useTheme();
  const background =
    tone === 'accept' ? '#25d366' : tone === 'decline' ? colors['text-error'] : 'rgba(255,255,255,0.16)';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="items-center gap-2 active:opacity-70"
    >
      <View
        className="w-16 h-16 rounded-full items-center justify-center"
        style={{ backgroundColor: background }}
      >
        <Ionicons name={icon} size={28} color="#ffffff" />
      </View>
      <Text className="text-caption text-white">{label}</Text>
    </Pressable>
  );
};

const CallScreen = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    name?: string;
    image?: string;
    video?: string;
    direction?: string;
  }>();
  const peerId = typeof params.id === 'string' ? params.id : '';
  const isVideo = params.video === '1' || params.video === 'true';
  const isOutgoing = params.direction === 'outgoing';

  const {
    rtcState,
    incomingCall,
    activeCall,
    callToken,
    callSettings,
    callError,
    startCall,
    endCall,
    resetCall,
    acceptIncomingCall,
    rejectIncomingCall,
    audioEnabled,
    videoEnabled,
    toggleAudio,
    toggleVideo,
  } = useCometChat();

  const activeIncoming =
    incomingCall && (incomingCall.peerUserId === peerId || !peerId) ? incomingCall : null;
  const sessionPeerId = activeCall?.peerId || activeIncoming?.peerUserId || peerId;
  const peerName =
    (typeof params.name === 'string' && params.name) ||
    activeIncoming?.callerName ||
    sessionPeerId;
  const peerImage =
    (typeof params.image === 'string' && params.image) ||
    activeIncoming?.callerImage ||
    undefined;
  const callVideo = activeCall
    ? activeCall.video
    : activeIncoming
      ? activeIncoming.video
      : isVideo;

  // This screen is the single initiator of outgoing calls - one per mount.
  const didStart = useRef(false);
  useEffect(() => {
    if (didStart.current || !isOutgoing) return;
    if (rtcState !== 'idle' || activeCall) return;
    if (!peerId) return;
    didStart.current = true;
    void startCall(peerId, isVideo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Leave no call behind when this screen goes away (back gesture, logout...).
  const didMount = useRef(false);
  useEffect(() => {
    didMount.current = true;
    return () => {
      resetCall();
    };
  }, [resetCall]);

  // The remote side cancelled an incoming call while this screen was open.
  useEffect(() => {
    if (isOutgoing || !didMount.current) return;
    if (rtcState !== 'idle' || incomingCall || activeCall) return;
    const timer = setTimeout(() => router.back(), 500);
    return () => clearTimeout(timer);
  }, [isOutgoing, rtcState, incomingCall, activeCall, router]);

  // Auto-dismiss shortly after the call finishes (hang up, decline, error...).
  useEffect(() => {
    if (rtcState !== 'ended') return;
    const timer = setTimeout(() => router.back(), 1500);
    return () => clearTimeout(timer);
  }, [rtcState, router]);

  const CallsComponent = getCallingSdk()?.Component;
  const isIncomingRing = Boolean(activeIncoming) && rtcState === 'idle' && !activeCall;
  const joining = rtcState === 'connecting';
  const inCall = rtcState === 'joined' && Boolean(callToken) && Boolean(callSettings);
  const ended = rtcState === 'ended';
  const elapsed = useCallTimer(inCall);

  const statusText = () => {
    if (callError) return callError;
    if (isIncomingRing) return callVideo ? 'WhatsApp Video' : 'WhatsApp Audio';
    if (joining) return isOutgoing ? 'Calling\u2026' : 'Connecting\u2026';
    if (ended) return 'Call ended';
    return 'Ringing\u2026';
  };

  const onDecline = () => {
    void rejectIncomingCall();
    router.back();
  };

  const onHangUp = () => {
    // endCall flips rtcState to 'ended', which auto-dismisses the screen.
    void endCall();
  };

  // "Message" from the incoming screen opens the thread rather than ending the
  // ring, which is what WhatsApp does.
  const onMessage = () => {
    void rejectIncomingCall();
    router.replace({
      pathname: '/chat/[id]',
      params: { id: peerId, name: peerName, image: peerImage ?? '' },
    });
  };

  if (inCall && CallsComponent && callToken && callSettings) {
    return (
      <Screen className="bg-black" viewClassName="bg-black">
        <View className="flex-1">
          <View className="items-center gap-1 pt-6 px-6 pb-1">
            <Text className="text-white text-2xl font-semibold" numberOfLines={1}>
              {peerName}
            </Text>
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="lock-closed" size={11} color={colors['tick-read']} />
              <Text className="text-caption" style={{ color: colors['tick-read'] }}>
                End-to-end encrypted
              </Text>
            </View>
            <Text className="text-body-2 text-white/70" accessibilityLiveRegion="polite">
              {formatDuration(elapsed)}
            </Text>
          </View>

          <View className="flex-1">
            <CallsComponent callToken={callToken} sessionSettings={callSettings} />
          </View>

          {/* The design's floating control row over the call surface. */}
          <View className="flex-row items-center justify-around px-4 pb-10 pt-6">
            <CallControl
              icon={audioEnabled ? 'volume-medium-outline' : 'volume-mute-outline'}
              label="Speaker"
              tone="neutral"
              onPress={() => void toggleAudio()}
            />
            <CallControl
              icon="videocam-outline"
              label="Video"
              tone="neutral"
              onPress={() => void toggleVideo()}
            />
            <CallControl
              icon={videoEnabled ? 'mic-outline' : 'mic-off-outline'}
              label="Mute"
              tone="neutral"
              onPress={() => void toggleAudio()}
            />
            <CallControl
              icon="person-add-outline"
              label="Add"
              tone="neutral"
              onPress={() =>
                showAlertDialog(
                  'Add participant',
                  'CometChat calls start one-to-one from a chat or the contact info screen.'
                )
              }
            />
            <CallControl icon="close" label="End" tone="decline" onPress={onHangUp} />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen className="bg-black" viewClassName="bg-black">
      <View className="flex-1 px-6 py-8 justify-between">
        <View className="items-center gap-2 pt-6">
          <Text className="text-white text-2xl font-semibold" numberOfLines={1}>
            {peerName}
          </Text>
          <Text className="text-white/70 text-base">{statusText()}</Text>
        </View>

        <View className="items-center justify-center">
          <Avatar
            name={peerName}
            imageUrl={peerImage}
            size={160}
            fontSize={64}
            placeholderType="text"
          />
        </View>

        <View className="items-center gap-8 pb-4">
          {isIncomingRing ? (
            <>
              {/* "Message" and "Remind me" sit above the answer pair. */}
              <View className="flex-row items-center gap-10">
                <Pressable
                  onPress={onMessage}
                  accessibilityRole="button"
                  accessibilityLabel="Message instead of answering"
                  className="items-center gap-2 active:opacity-70"
                >
                  <View className="w-14 h-14 rounded-full items-center justify-center bg-white/15">
                    <Ionicons name="chatbubble-ellipses-outline" size={24} color="#ffffff" />
                  </View>
                  <Text className="text-caption text-white">Message</Text>
                </Pressable>

                <Pressable
                  onPress={onDecline}
                  accessibilityRole="button"
                  accessibilityLabel="Remind me later"
                  className="items-center gap-2 active:opacity-70"
                >
                  <View className="w-14 h-14 rounded-full items-center justify-center bg-white/15">
                    <Ionicons name="alarm-outline" size={24} color="#ffffff" />
                  </View>
                  <Text className="text-caption text-white">Remind me</Text>
                </Pressable>
              </View>

              <View className="flex-row items-center gap-10">
                <CallControl icon="close" label="Decline" tone="decline" onPress={onDecline} />
                <CallControl
                  icon="arrow-down"
                  label="Accept"
                  tone="accept"
                  onPress={() => void acceptIncomingCall()}
                />
              </View>
            </>
          ) : ended ? (
            <View className="items-center gap-2">
              <Ionicons name="close-circle-outline" size={30} color={colors['text-muted']} />
              <Text className="text-body-2 text-white/70">{callError || 'Call ended'}</Text>
            </View>
          ) : (
            <CallControl
              icon="close"
              label={joining ? 'Cancel' : 'End'}
              tone="decline"
              onPress={onHangUp}
            />
          )}
        </View>
      </View>
    </Screen>
  );
};

export default CallScreen;
