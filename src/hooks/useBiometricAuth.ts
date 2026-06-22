import { useState, useEffect, useCallback } from 'react';

const BIOMETRIC_ENROLLED_KEY = 'nc_biometric_enrolled';

function detectDevice(): { label: string; icon: string } {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|Mac/.test(ua)) return { label: 'Face ID / Touch ID', icon: '🍎' };
  if (/Android/.test(ua))          return { label: 'Empreinte / Reconnaissance faciale', icon: '🤖' };
  if (/Win/.test(ua))              return { label: 'Windows Hello', icon: '🪟' };
  return { label: 'Biométrie', icon: '🔒' };
}

export function useBiometricAuth() {
  const isSupported = typeof window !== 'undefined' && !!window.PublicKeyCredential;
  const [isPlatformAuthAvailable, setIsPlatformAuthAvailable] = useState<boolean | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(() => localStorage.getItem(BIOMETRIC_ENROLLED_KEY) === 'true');
  const [isLoading, setIsLoading] = useState(false);

  const { label: deviceLabel, icon: deviceIcon } = detectDevice();

  // Check platform authenticator availability
  useEffect(() => {
    if (!isSupported) { setIsPlatformAuthAvailable(false); return; }
    PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      .then(setIsPlatformAuthAvailable)
      .catch(() => setIsPlatformAuthAvailable(false));
  }, [isSupported]);

  const enroll = useCallback(async () => {
    setIsLoading(true);
    try {
      const options: PublicKeyCredentialCreationOptions = {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: 'Kompilot', id: window.location.hostname },
        user: {
          id: crypto.getRandomValues(new Uint8Array(16)),
          name: 'user@kompilot.com',
          displayName: 'Utilisateur Kompilot',
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
      };
      await navigator.credentials.create({ publicKey: options });
    } catch {
      // User cancelled or device not supported — still mark as enrolled for demo
    }
    localStorage.setItem(BIOMETRIC_ENROLLED_KEY, 'true');
    setIsEnrolled(true);
    setIsLoading(false);
  }, []);

  const unenroll = useCallback(() => {
    localStorage.removeItem(BIOMETRIC_ENROLLED_KEY);
    setIsEnrolled(false);
  }, []);

  const authenticate = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const options: PublicKeyCredentialRequestOptions = {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        timeout: 60000,
        userVerification: 'required',
      };
      const result = await navigator.credentials.get({ publicKey: options });
      return !!result;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isSupported,
    isPlatformAuthAvailable,
    deviceLabel,
    deviceIcon,
    isEnrolled,
    enroll,
    unenroll,
    authenticate,
    isLoading,
  };
}
