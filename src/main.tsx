import { render } from 'preact';
import { BibleViewer } from './components/BibleViewer';
import { PasscodeGate } from './components/PasscodeGate';
import { usePasscode } from './hooks/usePasscode';
import './style.css';

function App() {
  const { isAuthenticated } = usePasscode();

  if (!isAuthenticated) {
    return (
      <PasscodeGate
        onSuccess={() => {
          // PasscodeGate has authenticated via sessionStorage in its own
          // usePasscode instance. Reload to pick up the new auth state.
          window.location.reload();
        }}
      />
    );
  }

  return <BibleViewer />;
}

const root = document.getElementById('app');
if (root) {
  render(<App />, root);
}
