// @ts-ignore - expo-local-authentication types
const LocalAuthentication = require('expo-local-authentication');

export type BiometricType = 'fingerprint' | 'face' | 'iris' | 'none';

export async function getSupportedBiometry(): Promise<BiometricType> {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return 'none';

    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'face';
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) return 'iris';
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'fingerprint';

    return 'none';
  } catch {
    return 'none';
  }
}

export async function isBiometryEnrolled(): Promise<boolean> {
  try {
    return await LocalAuthentication.isEnrolledAsync();
  } catch {
    return false;
  }
}

export async function authenticateWithBiometry(): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to unlock Veill',
      fallbackLabel: 'Use passcode',
    });
    return result.success;
  } catch {
    return false;
  }
}

export async function checkBiometricAvailability(): Promise<{ available: boolean; type: BiometricType }> {
  const type = await getSupportedBiometry();
  const enrolled = await isBiometryEnrolled();

  return {
    available: type !== 'none' && enrolled,
    type,
  };
}
