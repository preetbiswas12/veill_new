declare module 'centrifuge' {
  export class Centrifuge {
    constructor(endpoint: string, opts?: { token?: string });
    on(event: string, cb: (...args: any[]) => void): void;
    connect(): void;
    disconnect(): void;
    newSubscription(channel: string, opts?: { token?: string }): CentrifugeSubscription;
    get state(): string;
  }

  export class CentrifugeSubscription {
    on(event: string, cb: (...args: any[]) => void): void;
    subscribe(): void;
  }
}

declare module 'livekit-client' {
  export class Room {
    constructor(opts?: { adaptiveStream?: boolean });
    connect(url: string, token: string): Promise<void>;
    disconnect(): Promise<void>;
    localParticipant: LocalParticipant;
    on(event: string, cb: (...args: any[]) => void): void;
  }

  export class LocalParticipant {
    publishTracks(tracks: any[]): Promise<void>;
  }

  export class RemoteParticipant {
    identity: string;
  }

  export const RoomEvent: Record<string, string>;
  export function createLocalVideoTrack(opts?: any): Promise<any>;
  export function createLocalAudioTrack(opts?: any): Promise<any>;
  export const Track: Record<string, any>;
}

declare module '*.png' {
  const content: any;
  export default content;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      API_BASE_URL: string;
      PUSH_SERVER_URL: string;
      ONESIGNAL_APP_ID: string;
      COMETCHAT_APP_ID: string;
      COMETCHAT_REGION: string;
      DAILY_DOMAIN: string;
    }
  }
}

export {};
