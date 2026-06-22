import { useState, useCallback } from 'react';

const PIN_HASH_KEY = 'nc_pin_hash';

function hashPin(pin: string): string {
  return btoa(`nc_pin:${pin}`);
}

export function usePinAuth() {
  const [isPinSet, setIsPinSet] = useState(() => !!localStorage.getItem(PIN_HASH_KEY));

  const setPin = useCallback((pin: string) => {
    localStorage.setItem(PIN_HASH_KEY, hashPin(pin));
    setIsPinSet(true);
  }, []);

  const verifyPin = useCallback((pin: string): boolean => {
    const stored = localStorage.getItem(PIN_HASH_KEY);
    return stored === hashPin(pin);
  }, []);

  const clearPin = useCallback(() => {
    localStorage.removeItem(PIN_HASH_KEY);
    setIsPinSet(false);
  }, []);

  // Simple: PIN is required if it's set (can be extended with visibility events)
  const isPinRequired = isPinSet;

  return { isPinSet, setPin, verifyPin, clearPin, isPinRequired };
}
