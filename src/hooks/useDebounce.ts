/**
 * useDebounce — retarde la mise à jour d'une valeur jusqu'à ce que
 * l'utilisateur ait arrêté de saisir pendant `delay` ms.
 *
 * Usage:
 *   const debouncedSearch = useDebounce(search, 350);
 *   useEffect(() => { fetchResults(debouncedSearch); }, [debouncedSearch]);
 */
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay = 350): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
