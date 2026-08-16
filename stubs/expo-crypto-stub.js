const NOOP = () => {};
const stub = {
  getRandomValues: (arr) => arr,
  CryptoAlgorithm: { SHA256: 'SHA-256' },
  digestStringAsync: async () => '',
  generateKeyPairAsync: async () => ({ publicKey: '', privateKey: '' }),
  importKeyAsync: async () => ({}),
  deriveKeyAsync: async () => ({}),
  encryptAsync: async () => new Uint8Array(),
  decryptAsync: async () => '',
};

module.exports = stub;
