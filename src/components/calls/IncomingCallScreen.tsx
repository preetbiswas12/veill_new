import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Vibration, Platform, AppState, Animated, Dimensions } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import notifee from '@notifee/react-native';
import { RootStackParamList } from '../../navigation/types';
import dailyCallService, { ActiveCall, CallPhase } from '../../../utils/daily';

const CALL_NOTIFICATION_ID = 'veill_incoming_call';

async function dismissHeadsUp() {
  try {
    await notifee.cancelNotification(CALL_NOTIFICATION_ID);
  } catch {}
}

type Nav = StackNavigationProp<RootStackParamList, 'IncomingCall'>;
type Route = RouteProp<RootStackParamList, 'IncomingCall'>;

const IncomingCallScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const initialCall = route.params?.call || dailyCallService.getState().call;
  const [call, setCall] = useState<ActiveCall | null>(initialCall);
  const slideAnim = useRef(new Animated.Value(1)).current;
  const avatarScale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const pattern = [0, 800, 400, 800];
    Vibration.vibrate(pattern, true);

    // Entrance animation
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(avatarScale, {
        toValue: 1,
        friction: 6,
        tension: 30,
        useNativeDriver: true,
      }),
    ]).start();

    dismissHeadsUp();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') dismissHeadsUp();
    });
    return () => {
      Vibration.cancel();
      sub.remove();
      dismissHeadsUp();
    };
  }, []);

  useEffect(() => {
    const off = dailyCallService.onCallStateChanged((state: { phase: CallPhase; call: ActiveCall | null }) => {
      setCall(state.call);
      if (state.phase === 'idle') {
        dismissHeadsUp();
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start(() => navigation.goBack());
      }
    });
    return off;
  }, [navigation, slideAnim]);

  const accept = () => {
    Vibration.cancel();
    dismissHeadsUp();
    const active = dailyCallService.acceptIncomingCall() || call;
    if (active) {
      Animated.timing(slideAnim, {
        toValue: -1,
        duration: 250,
        useNativeDriver: true,
      }).start(() => navigation.replace('CallScreen', { incoming: active }));
    } else {
      navigation.goBack();
    }
  };

  const decline = () => {
    Vibration.cancel();
    dismissHeadsUp();
    dailyCallService.declineIncomingCall();
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start(() => navigation.goBack());
  };

  if (!call) {
    return (
      <View style={styles.container}>
        <Text style={styles.peerName}>No active call</Text>
        <Pressable style={styles.declineBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>Close</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            transform: [
              { translateY: slideAnim.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: [-600, 0, 600],
              })},
            ],
            opacity: slideAnim.interpolate({
              inputRange: [-1, 0, 1],
              outputRange: [0, 1, 0],
            }),
          },
        ]}
      >
        <Animated.View
          style={[
            styles.avatarWrap,
            {
              transform: [{ scale: avatarScale }],
            },
          ]}
        >
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {call.peerName?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
          </View>
        </Animated.View>

        <Text style={styles.peerName}>{call.peerName}</Text>
        <Text style={styles.callType}>
          Incoming {call.isVideo ? 'video' : 'voice'} call...
        </Text>

        <View style={styles.actions}>
          <Pressable style={[styles.actionBtn, styles.declineBtn]} onPress={decline}>
            <Text style={styles.btnIcon}>✕</Text>
            <Text style={styles.btnText}>Decline</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.acceptBtn]} onPress={accept}>
            <Text style={styles.btnIcon}>✓</Text>
            <Text style={[styles.btnText, styles.acceptText]}>Accept</Text>
          </Pressable>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b141a',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  avatarWrap: {
    marginBottom: 32,
  },
  avatarRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(0, 168, 132, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0, 168, 132, 0.3)',
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#1f2c33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#e9edef',
    fontSize: 60,
    fontWeight: '700',
  },
  peerName: {
    color: '#e9edef',
    fontSize: 26,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  callType: {
    color: '#8696a0',
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 80,
    marginTop: 60,
  },
  actionBtn: {
    alignItems: 'center',
    gap: 8,
  },
  declineBtn: {
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
  acceptBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#00a884',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#00a884',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  btnIcon: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  btnText: {
    color: '#8696a0',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
  },
  acceptText: {
    color: '#00a884',
  },
});

export default IncomingCallScreen;
