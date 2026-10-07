import { useState } from 'react';
import { Sparkles, ArrowRight, KeyRound } from 'lucide-react';
import api from '../api/client';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [apiKey, setApiKey] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registeredKey, setRegisteredKey] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await api.get('/auth/keys', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (res.data) {
        onLogin(apiKey);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid API key');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/register', { name, tier: 'free' });
      setRegisteredKey(res.data.api_key);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUseKey = () => {
    onLogin(registeredKey);
  };

  return (
    <div style={styles.page}>
      <div style={styles.bgGlow} />
      <div style={styles.container} className="animate-slide-up">
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>
            <Sparkles size={28} color="#6366f1" />
          </div>
          <div>
            <h1 style={styles.logoText}>Pragma</h1>
            <p style={styles.logoSub}>AI Memory API</p>
          </div>
        </div>

        {registeredKey ? (
          <div style={styles.successBox}>
            <h2 style={styles.heading}>Registration Successful</h2>
            <p style={styles.successText}>
              Save your API key securely — it will not be shown again.
            </p>
            <div style={styles.keyDisplay}>
              <code style={styles.keyCode}>{registeredKey}</code>
            </div>
            <button onClick={handleUseKey} className="btn btn-primary" style={styles.fullBtn}>
              Continue to Dashboard
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <>
            <div style={styles.tabs}>
              <button
                onClick={() => { setMode('login'); setError(''); }}
                style={{ ...styles.tab, ...(mode === 'login' ? styles.tabActive : {}) }}
              >
                Sign In
              </button>
              <button
                onClick={() => { setMode('register'); setError(''); }}
                style={{ ...styles.tab, ...(mode === 'register' ? styles.tabActive : {}) }}
              >
                Register
              </button>
            </div>

            {mode === 'login' ? (
              <form onSubmit={handleLogin}>
                <label style={styles.label}>API Key</label>
                <div style={styles.inputRow}>
                  <KeyRound size={18} style={styles.inputIcon} />
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="prg_live_..."
                    className="input"
                    style={styles.inputField}
                    autoFocus
                  />
                </div>
                {error && <p style={styles.error}>{error}</p>}
                <button
                  type="submit"
                  disabled={loading || !apiKey.trim()}
                  className="btn btn-primary"
                  style={styles.fullBtn}
                >
                  {loading ? 'Verifying...' : 'Sign In'}
                  {!loading && <ArrowRight size={16} />}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister}>
                <label style={styles.label}>Organization Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Company"
                  className="input"
                  style={{ marginBottom: '16px' }}
                  autoFocus
                />
                {error && <p style={styles.error}>{error}</p>}
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="btn btn-primary"
                  style={styles.fullBtn}
                >
                  {loading ? 'Creating...' : 'Create Account'}
                  {!loading && <ArrowRight size={16} />}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-primary)',
    position: 'relative',
    overflow: 'hidden',
  },
  bgGlow: {
    position: 'absolute',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
  },
  container: {
    width: '420px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)',
    padding: '40px',
    position: 'relative',
    zIndex: 1,
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '32px',
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 'var(--radius-md)',
    background: 'var(--accent-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 'var(--text-2xl)',
    fontWeight: 800,
    color: 'var(--text-primary)',
    lineHeight: 1.2,
  },
  logoSub: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-tertiary)',
    fontWeight: 500,
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    marginBottom: '24px',
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-md)',
    padding: '4px',
  },
  tab: {
    flex: 1,
    padding: '8px',
    background: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-family)',
    fontSize: 'var(--text-sm)',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  tabActive: {
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    boxShadow: 'var(--shadow-sm)',
  },
  label: {
    display: 'block',
    fontSize: 'var(--text-sm)',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: '8px',
  },
  inputRow: {
    position: 'relative',
    marginBottom: '16px',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-tertiary)',
    pointerEvents: 'none',
  },
  inputField: {
    paddingLeft: '42px',
  },
  fullBtn: {
    width: '100%',
    padding: '12px',
    marginTop: '8px',
    fontSize: 'var(--text-sm)',
  },
  error: {
    color: 'var(--danger)',
    fontSize: 'var(--text-sm)',
    marginBottom: '12px',
    marginTop: '-8px',
  },
  heading: {
    fontSize: 'var(--text-xl)',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '8px',
  },
  successBox: {
    textAlign: 'center',
  },
  successText: {
    color: 'var(--text-secondary)',
    fontSize: 'var(--text-sm)',
    marginBottom: '20px',
  },
  keyDisplay: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '14px',
    marginBottom: '20px',
    overflowWrap: 'break-word',
  },
  keyCode: {
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--text-xs)',
    color: 'var(--accent-light)',
    wordBreak: 'break-all',
  },
};
