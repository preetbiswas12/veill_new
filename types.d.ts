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

declare module 'expo-local-authentication' {
  export const AuthenticationType: {
    FACIAL_RECOGNITION: number;
    IRIS: number;
    FINGERPRINT: number;
  };

  export async function hasHardwareAsync(): Promise<boolean>;
  export async function supportedAuthenticationTypesAsync(): Promise<number[]>;
  export async function isEnrolledAsync(): Promise<boolean>;
  export async function authenticateAsync(opts?: {
    promptMessage?: string;
    fallbackLabel?: string;
  }): Promise<{ success: boolean }>;
}

declare module 'expo-media-library' {
  export async function requestPermissionsAsync(): Promise<{ status: string }>;
  export async function getPermissionsAsync(): Promise<{ status: string }>;
}

declare module 'expo-av' {
  export async function requestPermissionsAsync(): Promise<{ status: string }>;
  export async function getPermissionsAsync(): Promise<{ status: string }>;
}

declare module '*.png' {
  const content: any;
  export default content;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_SERVER_URL: string;
      EXPO_PUBLIC_ONESIGNAL_APP_ID: string;
    }
  }
}

export {};
