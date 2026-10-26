/**
 * Minimal ambient types for the parts of aes-js this app uses.
 *
 * aes-js ships no type declarations of its own. Rather than pull @types into
 * the dependency tree for one cipher mode, this declares the surface actually
 * exercised by lib/secure-media.ts: CTR construction with a 16/24/32-byte key,
 * a 16-byte initial counter block, and its symmetric encrypt/decrypt.
 *
 * The key types deliberately accept `Uint8Array` only — the library also
 * accepts number arrays, but allowing both invites passing the wrong one by
 * accident. Nothing in this app does.
 */
declare module 'aes-js' {
  export class ModeOfOperation {
    static readonly ctr: {
      new (key: Uint8Array, counterInitialValue: Uint8Array): {
        encrypt: (plaintext: Uint8Array) => Uint8Array;
        decrypt: (ciphertext: Uint8Array) => Uint8Array;
      };
    };
  }
}
