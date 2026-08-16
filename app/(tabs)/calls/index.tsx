import Colors from '@/constants/Colors';
import Fonts from '@/constants/Fonts';
import { Stack } from 'expo-router';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { alert } from '@/utils/customAlert';
import { useState, useEffect } from 'react';
import { SegmentedControl } from '@/components/SegmentedControl';
import calls from '@/assets/data/calls.json';
import { defaultStyles } from '@/constants/Styles';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import Animated, {
  CurvedTransition,
  FadeInUp,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import SwipeableRow from '@/components/SwipeableRow';
import * as Haptics from 'expo-haptics';
import StorageService from '@/utils/storage';
import SocketService from '@/utils/socket';
import { liveKitCallService } from '@/utils/livekit';

const transition = CurvedTransition.delay(100);

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const Page = () => {
  const [selectedOption, setSelectedOption] = useState('All');
  const [items, setItems] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const editing = useSharedValue(-30);
  const [callDetail, setCallDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeCall, setActiveCall] = useState<any>(null);
  const [liveKitConnected, setLiveKitConnected] = useState(false);

  useEffect(() => {
    const loadCalls = async () => {
      let storedCalls = await StorageService.getCalls();
      if (storedCalls.length === 0) {
        storedCalls = calls;
        await StorageService.saveCalls(storedCalls);
      }
      setItems(storedCalls);
      setLoading(false);
    };
    loadCalls();
  }, []);

  useEffect(() => {
    const unsubscribe = SocketService.onCall((signal) => {
      if (signal.type === 'call-initiated') {
        handleLiveKitConnect(signal);
      } else if (signal.type === 'incoming-call') {
        handleIncomingCall(signal);
      } else if (signal.type === 'call-accepted') {
        handleLiveKitConnect(signal);
      } else if (signal.type === 'call-rejected') {
        alert('Call Rejected', 'The call was rejected.');
        setActiveCall(null);
      } else if (signal.type === 'call-ended') {
        endActiveCall();
        alert('Call Ended', 'The call has ended.');
      }
    });
    return unsubscribe;
  }, []);

  const onSegmentChange = (option: string) => {
    setSelectedOption(option);
    if (option === 'All') {
      setItems(items);
    } else {
      setItems(items.filter((call) => call.missed));
    }
  };

  const removeCall = async (toDelete: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newItems = items.filter((item) => item.id !== toDelete.id);
    setItems(newItems);
    await StorageService.saveCalls(newItems);
  };

  const onEdit = () => {
    let editingNew = !isEditing;
    editing.value = editingNew ? 0 : -30;
    setIsEditing(editingNew);
  };

  const initiateCall = async (item: any) => {
    alert(
      `Call ${item.name}?`,
      `Do you want to start a ${item.video ? 'video' : 'voice'} call with ${item.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: async () => {
            const callId = `call_${Date.now()}`;
            setActiveCall({
              id: callId,
              name: item.name,
              video: item.video,
              status: 'connecting',
            });

            SocketService.initiateCall(item.id, item.video ? 'video' : 'audio');

            const newCall = {
              id: `call-${Date.now()}`,
              name: item.name,
              date: new Date().toISOString(),
              incoming: false,
              missed: false,
              img: item.img,
              video: item.video,
            };

            const updatedCalls = [newCall, ...items];
            setItems(updatedCalls);
            await StorageService.saveCalls(updatedCalls);
          },
        },
      ]
    );
  };

  const handleIncomingCall = (signal: any) => {
    const callerName = signal.callerName || 'Unknown';
    const callType = signal.callType === 'video' ? 'Video' : 'Voice';
    alert(
      `Incoming ${callType} Call`,
      `${callerName} is calling you...`,
      [
        { text: 'Decline', style: 'cancel', onPress: () => SocketService.rejectCall(signal.callId) },
        {
          text: 'Accept',
          onPress: async () => {
            setActiveCall({
              id: signal.callId,
              name: callerName,
              video: signal.callType === 'video',
              status: 'connected',
            });
            SocketService.acceptCall(signal.callId);
          },
        },
      ]
    );
  };

  const endActiveCall = () => {
    if (activeCall) {
      SocketService.endCall(activeCall.id);
      liveKitCallService.endCall().catch(() => {});
      setActiveCall(null);
      setLiveKitConnected(false);
    }
  };

  const handleLiveKitConnect = async (signal: any) => {
    if (!signal.token || !signal.roomName) return;

    setActiveCall((prev: any) => ({
      ...prev,
      status: 'connecting',
    }));

    const result = await liveKitCallService.startCall(
      signal.token,
      signal.roomName,
      signal.callType === 'video',
      {
        onConnected: () => {
          setLiveKitConnected(true);
          setActiveCall((prev: any) => ({
            ...prev,
            status: 'connected',
          }));
        },
        onDisconnected: () => {
          setLiveKitConnected(false);
          setActiveCall(null);
        },
        onCallEnded: () => {
          setLiveKitConnected(false);
          setActiveCall(null);
        },
      }
    );

    if (!result.success) {
      alert('Call Failed', result.error || 'Could not connect to call server');
      setActiveCall(null);
      setLiveKitConnected(false);
    }
  };

  const showCallDetail = (item: any) => {
    setCallDetail(item);
  };

  const animatedRowStyles = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(editing.value) }],
  }));

  const animatedPosition = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(editing.value) }],
  }));

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <SegmentedControl
              options={['All', 'Missed']}
              selectedOption={selectedOption}
              onOptionPress={onSegmentChange}
            />
          ),
          headerLeft: () => (
            <TouchableOpacity onPress={onEdit}>
              <Text style={{ color: Colors.text, fontSize: 18 }}>
                {isEditing ? 'Done' : 'Edit'}
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 40 }}>
        <Animated.View style={[defaultStyles.block]} layout={transition}>
          <Animated.FlatList
            skipEnteringExitingAnimations
            data={items}
            scrollEnabled={false}
            itemLayoutAnimation={transition}
            keyExtractor={(item) => item.id.toString()}
            ItemSeparatorComponent={() => <View style={defaultStyles.separator} />}
            renderItem={({ item, index }: { item: any; index: number }) => (
              <SwipeableRow onDelete={() => removeCall(item)}>
                <Animated.View
                  entering={FadeInUp.delay(index * 20)}
                  exiting={FadeOutUp}
                  style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <AnimatedTouchableOpacity
                    style={[animatedPosition, { paddingLeft: 8 }]}
                    onPress={() => removeCall(item)}>
                    <Ionicons name="remove-circle" size={24} color={Colors.red} />
                  </AnimatedTouchableOpacity>

                  <Animated.View
                    style={[defaultStyles.item, { paddingLeft: 20 }, animatedRowStyles]}>
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}
                      onPress={() => initiateCall(item)}
                      activeOpacity={0.6}>
                      <Image source={{ uri: item.img }} style={styles.avatar} />

                      <View style={{ flex: 1, gap: 2 }}>
                        <Text
                          style={{ fontSize: 18, color: item.missed ? Colors.red : '#000' }}>
                          {item.name}
                        </Text>

                        <View style={{ flexDirection: 'row', gap: 4 }}>
                          <Ionicons
                            name={item.video ? 'videocam' : 'call'}
                            size={16}
                            color={Colors.text}
                          />
                          <Text style={{ color: Colors.text, flex: 1 }}>
                            {item.incoming ? 'Incoming' : 'Outgoing'}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>

                    <View
                      style={{
                        flexDirection: 'row',
                        gap: 6,
                        alignItems: 'center',
                      }}>
                      <Text style={{ color: Colors.text }}>
                        {dayjs(item.date).format( 'MM.dd.yy')}
                      </Text>
                      <TouchableOpacity onPress={() => showCallDetail(item)}>
                        <Ionicons
                          name="information-circle-outline"
                          size={24}
                          color={Colors.text}
                        />
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                </Animated.View>
              </SwipeableRow>
            )}
          />
        </Animated.View>
      </ScrollView>

      {activeCall && (
        <Modal visible={!!activeCall} transparent animationType="fade">
          <View style={styles.activeCallOverlay}>
            <View style={styles.activeCallCard}>
              <Image source={{ uri: activeCall.img || 'https://i.pravatar.cc/150' }} style={styles.activeCallAvatar} />
              <Text style={styles.activeCallName}>{activeCall.name}</Text>
              <Text style={styles.activeCallStatus}>
                {activeCall.status === 'connecting' ? 'Connecting...' : 'Connected'}
              </Text>
              <View style={styles.activeCallActions}>
                <TouchableOpacity
                  style={[styles.activeCallButton, { backgroundColor: Colors.red }]}
                  onPress={endActiveCall}>
                  <Ionicons name="call" size={24} color="#fff" style={{ transform: [{ rotateY: '180deg' }] }} />
                </TouchableOpacity>
                {activeCall.video && (
                  <TouchableOpacity style={[styles.activeCallButton, { backgroundColor: '#E8E8E8' }]}>
                    <Ionicons name="videocam" size={24} color="#000" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}

      <Modal visible={callDetail !== null} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'flex-end',
          }}>
          <View
            style={{
              backgroundColor: Colors.card,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 24,
              paddingBottom: 40,
            }}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Image
                source={{ uri: callDetail?.img }}
                style={{ width: 70, height: 70, borderRadius: 35 }}
              />
              <Text style={{ fontSize: 20, fontWeight: '600', fontFamily: Fonts.heading, marginTop: 12 }}>
                {callDetail?.name}
              </Text>
              <Text style={{ color: Colors.text, fontSize: 14, marginTop: 4 }}>
                {callDetail?.video ? 'Video' : 'Voice'} Call •{' '}
                {callDetail?.incoming ? 'Incoming' : 'Outgoing'}
                {callDetail?.missed ? ' • Missed' : ''}
              </Text>
              <Text style={{ color: Colors.text, fontSize: 14, marginTop: 4 }}>
                {callDetail?.date ? dayjs(callDetail.date).format( 'EEEE, MMM d, yyyy h:mm a') : ''}
              </Text>
            </View>

            <View style={{ gap: 12 }}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: Colors.primary }]}
                onPress={() => {
                  setCallDetail(null);
                  if (callDetail) initiateCall(callDetail);
                }}>
                <Ionicons name="call" size={20} color={Colors.text} />
                <Text style={styles.modalButtonText}>
                  {callDetail?.video ? 'Video Call' : 'Voice Call'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#E8E8E8' }]}
                onPress={() => {
                  setCallDetail(null);
                  alert('Info', 'Call detail info coming soon.');
                }}>
                <Ionicons name="information-circle" size={20} color={Colors.text} />
                <Text style={[styles.modalButtonText, { color: Colors.text }]}>Call Info</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#E8E8E8' }]}
                onPress={() => setCallDetail(null)}>
                <Text style={[styles.modalButtonText, { color: Colors.text }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  modalButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  activeCallOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeCallCard: {
    alignItems: 'center',
    padding: 40,
  },
  activeCallAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  activeCallName: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: Fonts.heading,
    color: '#fff',
    marginBottom: 8,
  },
  activeCallStatus: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 40,
  },
  activeCallActions: {
    flexDirection: 'row',
    gap: 20,
  },
  activeCallButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Page;

