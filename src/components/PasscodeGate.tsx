import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import { usePasscode } from '../hooks/usePasscode';

interface PasscodeGateProps {
  onSuccess: () => void;
}

export function PasscodeGate({ onSuccess }: PasscodeGateProps) {
  const { isAuthenticated, authenticate } = usePasscode();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);
  const keypadRef = useRef<HTMLDivElement>(null);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  // Auto-focus the keypad and handle already-authenticated state on mount
  useEffect(() => {
    if (isAuthenticated) {
      onSuccessRef.current();
    }
    keypadRef.current?.focus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-submit when 4 digits are entered
  useEffect(() => {
    if (pin.length !== 4) return;

    const valid = authenticate(pin);
    if (valid) {
      onSuccessRef.current();
    } else {
      setError(true);
      setShaking(true);
      const clearTimer = setTimeout(() => {
        setPin('');
        setShaking(false);
      }, 400);
      const errorTimer = setTimeout(() => {
        setError(false);
      }, 1500);
      return () => {
        clearTimeout(clearTimer);
        clearTimeout(errorTimer);
      };
    }
  }, [pin, authenticate]);

  // Document-level keyboard support (0-9, Backspace, Enter)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        setPin(prev => (prev.length < 4 ? prev + e.key : prev));
        setError(false);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setPin(prev => prev.slice(0, -1));
        setError(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleDigit = useCallback((digit: string) => {
    setPin(prev => (prev.length < 4 ? prev + digit : prev));
    setError(false);
  }, []);

  const handleBackspace = useCallback(() => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  }, []);

  const dots = [0, 1, 2, 3].map(i => (
    <div
      key={i}
      class={`passcode-dot${i < pin.length ? ' filled' : ''}`}
    />
  ));

  const keyLabels: (string | null)[] = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    null, '0', 'backspace',
  ];

  return (
    <div class={`passcode-overlay${shaking ? ' passcode-shake' : ''}`}>
      <div class="passcode-title">JvC Bible</div>
      <div class="passcode-subtitle">Enter passcode</div>

      <div class="passcode-dots">{dots}</div>

      <div class="passcode-error-msg">
        {error ? 'Incorrect passcode' : ''}
      </div>

      <div ref={keypadRef} class="passcode-keypad" tabIndex={-1}>
        {keyLabels.map((key, i) => {
          if (key === null) {
            return <div key={`s-${i}`} class="passcode-key" />;
          }
          if (key === 'backspace') {
            return (
              <button
                key="backspace"
                type="button"
                class="passcode-key key-backspace"
                onClick={handleBackspace}
              >
                ⌫
              </button>
            );
          }
          return (
            <button
              key={`k-${key}`}
              type="button"
              class="passcode-key"
              onClick={() => handleDigit(key)}
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}
