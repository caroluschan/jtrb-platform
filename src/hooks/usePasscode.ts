import { useState, useCallback } from 'preact/hooks';

const CORRECT_PIN = '9499';
const SESSION_KEY = 'jvc-auth';

export function usePasscode(): {
  isAuthenticated: boolean;
  authenticate: (pin: string) => boolean;
} {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(SESSION_KEY) === '1';
  });

  const authenticate = useCallback((pin: string): boolean => {
    if (pin === CORRECT_PIN) {
      sessionStorage.setItem(SESSION_KEY, '1');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }, []);

  return { isAuthenticated, authenticate };
}
