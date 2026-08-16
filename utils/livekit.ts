import { Platform } from 'react-native';

export type LiveKitCallState = 'idle' | 'connecting' | 'connected' | 'ended' | 'failed';

export type LiveKitServiceEvents = {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onParticipantConnected?: (participant: any) => void;
  onParticipantDisconnected?: (participant: any) => void;
  onTrackSubscribed?: (track: any, participant: any) => void;
  onCallEnded?: () => void;
};

class LiveKitCallService {
  private state: LiveKitCallState = 'idle';
  private events: LiveKitServiceEvents = {};
  private currentRoom: any = null;

  async startCall(
    token: string,
    roomName: string,
    enableVideo: boolean,
    events: LiveKitServiceEvents
  ): Promise<{ success: boolean; error?: string }> {
    try {
      this.events = events;
      this.setState('connecting');

      if (Platform.OS === 'web') {
        return { success: false, error: 'LiveKit calls are not supported on web' };
      }

      const { Room, createLocalVideoTrack, createLocalAudioTrack, RoomEvent } = await import('livekit-client');
      
      const roomInstance = new Room({
        adaptiveStream: true,
      });

      roomInstance.on(RoomEvent.Connected, () => {
        console.log('[LiveKit] Connected to room:', roomName);
        this.setState('connected');
        this.events.onConnected?.();
      });

      roomInstance.on(RoomEvent.Disconnected, () => {
        console.log('[LiveKit] Disconnected');
        this.setState('ended');
        this.events.onDisconnected?.();
        this.cleanup();
      });

      roomInstance.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log('[LiveKit] Participant connected:', participant.identity);
        this.events.onParticipantConnected?.(participant);
      });

      roomInstance.on(RoomEvent.ParticipantDisconnected, (participant) => {
        console.log('[LiveKit] Participant disconnected:', participant.identity);
        this.events.onParticipantDisconnected?.(participant);
        this.events.onCallEnded?.();
        this.cleanup();
      });

      roomInstance.on(RoomEvent.TrackSubscribed, (track, participant) => {
        console.log('[LiveKit] Track subscribed:', track.kind);
        this.events.onTrackSubscribed?.(track, participant);
      });

      const LIVEKIT_URL = __DEV__
        ? 'wss://preetllm.qzz.io'
        : 'wss://veill.qzz.io';

      await roomInstance.connect(LIVEKIT_URL, token);

      const tracks: any[] = [];
      if (enableVideo) {
        const videoTrack = await createLocalVideoTrack({
          deviceId: undefined,
        });
        tracks.push(videoTrack);
      }

      const audioTrack = await createLocalAudioTrack({
        deviceId: undefined,
      });
      tracks.push(audioTrack);

      await roomInstance.localParticipant.publishTracks(tracks);

      this.currentRoom = roomInstance;
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[LiveKit] startCall error:', msg);
      this.setState('failed');
      this.cleanup();
      return { success: false, error: msg };
    }
  }

  async endCall(): Promise<void> {
    if (this.currentRoom) {
      try {
        await this.currentRoom.disconnect();
      } catch {
        // ignore disconnect errors
      }
      this.cleanup();
    }
  }

  getState(): LiveKitCallState {
    return this.state;
  }

  getRoom(): any {
    return this.currentRoom;
  }

  private setState(state: LiveKitCallState): void {
    this.state = state;
  }

  private cleanup(): void {
    this.currentRoom = null;
    this.events = {};
  }
}

export const liveKitCallService = new LiveKitCallService();
