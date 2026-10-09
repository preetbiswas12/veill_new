import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';

import Avatar from '@/components/Avatar';
import Button from '@/components/Button';
import Screen from '@/components/Screen';
import { getCallingSdk, useCometChat } from '@/hooks/useCometChat';

const CallScreen = () => {
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

  // This screen is the single initiator of outgoing calls — one per mount.
  const didStart = useRef(false);
  useEffect(() => {
    if (didStart.current || !isOutgoing) return;
    if (rtcState !== 'idle' || activeCall) return;
    if (!peerId) return;
    didStart.current = true;
    void startCall(peerId, isVideo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Leave no call behind when this screen goes away (back gesture, logout…).
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

  // Auto-dismiss shortly after the call finishes (hang up, decline, error…).
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

  const statusText = () => {
    if (callError) return callError;
    if (isIncomingRing) return callVideo ? 'Incoming video call' : 'Incoming voice call';
    if (joining) return isOutgoing ? 'Calling…' : 'Connecting…';
    if (ended) return 'Call ended';
    return 'Ringing…';
  };

  const onDecline = () => {
    void rejectIncomingCall();
    router.back();
  };

  const onHangUp = () => {
    // endCall flips rtcState to 'ended', which auto-dismisses the screen.
    void endCall();
  };

  if (inCall && CallsComponent && callToken && callSettings) {
    return (
      <Screen className="bg-[#0e0e0e]" viewClassName="bg-[#0e0e0e]">
        <View className="flex-1">
          <View className="items-center gap-1 pt-6 px-6 pb-1">
            <Text className="text-white text-2xl font-semibold" numberOfLines={1}>
              {peerName}
            </Text>
            <Text className="text-gray-400 text-base">
              {callVideo ? 'Video call' : 'Voice call'} · Connected
            </Text>
          </View>
          <View className="flex-1">
            <CallsComponent callToken={callToken} sessionSettings={callSettings} />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen className="bg-[#0e0e0e]" viewClassName="bg-[#0e0e0e]">
      <View className="flex-1 px-6 py-8 justify-between">
        <View className="items-center gap-2 pt-6">
          <Text className="text-white text-2xl font-semibold" numberOfLines={1}>
            {peerName}
          </Text>
          <Text className="text-gray-400 text-base">{statusText()}</Text>
        </View>

        <View className="items-center justify-center">
          <Avatar
            name={peerName}
            imageUrl={peerImage}
            size={140}
            fontSize={56}
            placeholderType="text"
          />
        </View>

        <View className="items-center gap-6 pb-4">
          {isIncomingRing ? (
            <View className="flex-row items-center gap-10">
              <Button
                variant="plain"
                onPress={() => void acceptIncomingCall()}
                className="w-16 h-16 rounded-full items-center justify-center bg-green-500"
                accessibilityLabel="Accept call"
              >
                <Feather name="phone" size={26} color="white" />
              </Button>
              <Button
                variant="plain"
                onPress={onDecline}
                className="w-16 h-16 rounded-full items-center justify-center bg-red-500"
                accessibilityLabel="Decline call"
              >
                <Feather name="phone-off" size={26} color="white" />
              </Button>
            </View>
          ) : ended ? (
            <View className="items-center gap-2">
              <Feather name="phone-off" size={30} color="#9ca3af" />
              <Text className="text-sm text-gray-500">{callError || 'Call ended'}</Text>
            </View>
          ) : (
            <Button
              variant="plain"
              onPress={onHangUp}
              className="w-16 h-16 rounded-full items-center justify-center bg-red-500"
              accessibilityLabel={joining ? 'Cancel call' : 'End call'}
            >
              <Feather name="phone-off" size={26} color="white" />
            </Button>
          )}
        </View>
      </View>
    </Screen>
  );
};

export default CallScreen;
