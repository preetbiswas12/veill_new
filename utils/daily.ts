import StorageService from './storage';
import { cancelRing, ringCall } from './onesignal';
import AuthService from './auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ActiveCall = {
  callId: string;
  roomUrl: string;
  isVideo: boolean;
  isIncoming: boolean;
  peerId: string;
  peerName: string;
  peerImage?: string;
};

export type CallPhase = 'idle' | 'incoming' | 'connecting' | 'connected' | 'ended';

type CallStateHandler = (state: { phase: CallPhase; call: ActiveCall | null }) => void;

const PUSH_SERVER_URL = (process.env.PUSH_SERVER_URL || process.env.API_BASE_URL || '').replace(/\/$/, '');

async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem('veill_auth_token');
  } catch {
    return null;
  }
}

async function requestDailyRoom(roomName: string): Promise<string> {
  try {
    const token = await getAuthToken();
    const resp = await fetch(`${PUSH_SERVER_URL}/api/daily/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ name: roomName }),
    });
    const data = await resp.json().catch(() => ({}));
    if (resp.ok && data?.url) {
      return data.url as string;
    }
  } catch (err) {
    console.warn('[Daily] Room request failed:', err);
  }
  return `https://veill.daily.co/${roomName}`;
}

async function recordCallLog(entry: {
  peerId: string;
  name: string;
  img?: string;
  video: boolean;
  incoming: boolean;
}): Promise<void> {
  try {
    const calls = await StorageService.getCalls();
    const newCall = {
      id: `call-${Date.now()}`,
      peerId: entry.peerId,
      name: entry.name,
      date: new Date().toISOString(),
      incoming: entry.incoming,
      missed: false,
      img: entry.img || `https://i.pravatar.cc/150?u=${encodeURIComponent(entry.peerId)}`,
      video: entry.video,
    };
    await StorageService.saveCalls([newCall, ...calls]);
  } catch (err) {
    console.warn('[Daily] Failed to record call log:', err);
  }
}

class DailyCallServiceClass {
  private state: { phase: CallPhase; call: ActiveCall | null } = { phase: 'idle', call: null };
  private handlers: CallStateHandler[] = [];
  private callObject: any = null;
  private listenerAdded = false;

  getState(): { phase: CallPhase; call: ActiveCall | null } {
    return this.state;
  }

  onCallStateChanged(handler: CallStateHandler): () => void {
    this.handlers.push(handler);
    handler(this.state);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  private setState(next: { phase: CallPhase; call: ActiveCall | null }): void {
    this.state = next;
    this.handlers.forEach((h) => h(this.state));
  }

  async startOutgoingCall(
    peer: { id: string; name: string; image?: string },
    isVideo: boolean
  ): Promise<void> {
    if (this.state.phase !== 'idle') return;

    const callId = `call_${Date.now()}`;
    const roomName = `veill-${callId.replace(/[^a-zA-Z0-9]/g, '')}`.toLowerCase();
    const roomUrl = await requestDailyRoom(roomName);

    const me = await AuthService.getCurrentAuthState();
    const myUserId = me.userId || me.username || 'unknown';
    const myName = me.displayName || me.username || 'Someone';

    const call: ActiveCall = {
      callId,
      roomUrl,
      isVideo,
      isIncoming: false,
      peerId: peer.id,
      peerName: peer.name,
      peerImage: peer.image,
    };

    this.setState({ phase: 'connecting', call });

    console.log(`[Call] outgoing ${isVideo ? 'video' : 'voice'} to ${peer.id} via ${roomUrl}`);

    ringCall({
      calleeIds: [peer.id],
      callerId: myUserId,
      callerName: myName,
      callType: isVideo ? 'video' : 'voice',
      callId,
      roomUrl,
    }).catch(() => {});
  }

  async joinCall(call: ActiveCall): Promise<void> {
    try {
      const Daily = (await import('@daily-co/react-native-daily-js')).default;
      if (this.callObject) {
        try { await this.callObject.leave(); } catch {}
        this.callObject = null;
      }
      this.callObject = Daily.createCallObject();
      this.attachCallListeners();
      await this.callObject.join({ url: call.roomUrl, audio: true, video: call.isVideo });
      this.setState({ phase: 'connected', call });
    } catch (err) {
      console.error('[Daily] joinCall failed:', err);
      this.endCall('local');
    }
  }

  private attachCallListeners() {
    if (!this.callObject || this.listenerAdded) return;
    this.listenerAdded = true;
    const events = [
      'participant-joined',
      'participant-left',
      'active-speaker-change',
      'error',
      'camera-error',
      'microphone-error',
    ];
    events.forEach((evt) => {
      try {
        this.callObject.on(evt as any, () => {});
      } catch {}
    });
    try {
      this.callObject.on('left-meeting' as any, () => {
        this.endCall('remote');
      });
    } catch {}
  }

  toggleMic(): boolean {
    if (!this.callObject) return false;
    const local = this.callObject.localParticipant();
    const next = !(local?.audio ?? false);
    this.callObject.setLocalAudio(next);
    return next;
  }

  toggleCamera(): boolean {
    if (!this.callObject) return false;
    const local = this.callObject.localParticipant();
    const next = !(local?.video ?? false);
    this.callObject.setLocalVideo(next);
    return next;
  }

  setMicEnabled(enabled: boolean): void {
    if (this.callObject) this.callObject.setLocalAudio(enabled);
  }

  setCameraEnabled(enabled: boolean): void {
    if (this.callObject) this.callObject.setLocalVideo(enabled);
  }

  getParticipants(): any[] {
    if (!this.callObject) return [];
    const list = this.callObject.participants();
    return Object.values(list || {});
  }

  getCallObject(): any {
    return this.callObject;
  }

  acceptIncomingCall(): ActiveCall | null {
    const { call } = this.state;
    if (!call) return null;
    this.setState({ phase: 'connecting', call });
    try {
      const { reportCallConnected } = require('./callKeep');
      reportCallConnected();
    } catch {}
    recordCallLog({
      peerId: call.peerId,
      name: call.peerName,
      img: call.peerImage,
      video: call.isVideo,
      incoming: true,
    });
    return call;
  }

  declineIncomingCall(): void {
    const { call } = this.state;
    if (!call) return;
    cancelRing([call.peerId], call.callId).catch(() => {});
    this.setState({ phase: 'idle', call: null });
  }

  handleIncomingInvite(invite: {
    callId: string;
    roomUrl: string;
    callType: 'voice' | 'video';
    callerId: string;
    callerName: string;
  }): void {
    if (this.state.phase !== 'idle') return;
    const call: ActiveCall = {
      callId: invite.callId,
      roomUrl: invite.roomUrl,
      isVideo: invite.callType === 'video',
      isIncoming: true,
      peerId: invite.callerId,
      peerName: invite.callerName,
    };
    this.setState({ phase: 'incoming', call });
  }

  async endCall(reason?: 'remote' | 'local'): Promise<void> {
    const { call } = this.state;
    if (!call) return;

    if (this.callObject) {
      try {
        await this.callObject.leave();
      } catch {}
      this.callObject = null;
      this.listenerAdded = false;
    }

    try {
      const { reportCallEnded } = require('./callKeep');
      reportCallEnded();
    } catch {}

    cancelRing([call.peerId], call.callId).catch(() => {});

    if (!call.isIncoming) {
      recordCallLog({
        peerId: call.peerId,
        name: call.peerName,
        img: call.peerImage,
        video: call.isVideo,
        incoming: false,
      });
    }

    this.setState({ phase: 'ended', call });
    setTimeout(() => {
      if (this.state.call?.callId === call.callId) {
        this.setState({ phase: 'idle', call: null });
      }
    }, 400);
  }
}

export const dailyCallService = new DailyCallServiceClass();
export default dailyCallService;
