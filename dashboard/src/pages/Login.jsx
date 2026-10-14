import { useState } from 'react';
import { 
  Sparkles, ArrowRight, KeyRound, Sun, Moon, Mail, Lock, 
  Building2, AlertCircle, Check, Copy, ShieldCheck 
} from 'lucide-react';
import api from '../api/client';
import { useTheme } from '../context/ThemeContext';

export default function Login({ onLogin }) {
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState('login'); // 'login' or 'register'

  // Login form state
  const [apiKey, setApiKey] = useState('');

  // Register form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [tier, setTier] = useState('developer');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registeredKey, setRegisteredKey] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  // Validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const handleLogin = async (e) => {
    e.preventDefault();
    const cleanKey = apiKey.trim();
    setError('');

    // Client-side validations
    if (!cleanKey) {
      setError('Please enter your Neura API Key.');
      return;
    }
    if (!cleanKey.startsWith('neura_live_') && !cleanKey.startsWith('neura_test_')) {
      setError('Invalid API Key format. Neura API Keys must start with "neura_live_". If you are new, please use the Register tab.');
      return;
    }
    if (cleanKey.length < 24) {
      setError('API Key is too short. Please verify your full key.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.get('/auth/keys', {
        headers: { Authorization: `Bearer ${cleanKey}` },
      });
      if (res.data) {
        onLogin(cleanKey);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or revoked API key. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // 1. Name validation
    if (!cleanName) {
      setError('Please enter your Developer or Organization Name.');
      return;
    }
    if (cleanName.length < 3) {
      setError('Organization Name must be at least 3 characters long.');
      return;
    }
    if (cleanName.length > 50) {
      setError('Organization Name cannot exceed 50 characters.');
      return;
    }
    if (!/^[a-zA-Z0-9\s._'-]{3,50}$/.test(cleanName) || (cleanName.match(/[a-zA-Z]/g) || []).length < 2) {
      setError('Please enter a valid name containing real alphabetic letters (not just digits or symbols).');
      return;
    }

    // 2. Email validation
    if (!cleanEmail) {
      setError('Please enter your business or developer email address.');
      return;
    }
    if (!emailRegex.test(cleanEmail)) {
      setError('Invalid email address format. Please enter a valid email like name@domain.com.');
      return;
    }

    // 3. Password validation
    if (!cleanPassword) {
      setError('Please create a master password for your workspace.');
      return;
    }
    if (cleanPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/register', { 
        name: cleanName, 
        email: cleanEmail,
        password: cleanPassword,
        tier: tier 
      });
      setRegisteredKey(res.data.api_key);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your input.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(registeredKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleUseKey = () => {
    onLogin(registeredKey);
  };

  return (
    <div style={styles.page}>
      {/* Theme Toggle Button */}
      <button 
        onClick={toggleTheme}
        style={styles.themeToggleBtn}
        title="Toggle Dark / Light Theme"
      >
        {theme === 'dark' ? <Sun size={15} color="#f59e0b" /> : <Moon size={15} color="#6366f1" />}
        <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
      </button>

      <div style={styles.bgGlow} />

      <div style={styles.container} className="animate-slide-up">
        {/* Logo and Brand Title */}
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>
            <Sparkles size={28} color="#6366f1" />
          </div>
          <div>
            <h1 style={styles.logoText}>Neura</h1>
            <p style={styles.logoSub}>AI Memory Platform</p>
          </div>
        </div>

        {/* Success Registration Box */}
        {registeredKey ? (
          <div style={styles.successBox} className="animate-fade-in">
            <div style={styles.successIconBadge}>
              <ShieldCheck size={28} color="var(--success)" />
            </div>
            <h2 style={styles.heading}>Registration Successful!</h2>
            <p style={styles.successText}>
              Your tenant workspace has been created. Save your secret API Key securely — it grants access to your persistent memory bank.
            </p>
            
            <div style={styles.keyDisplay}>
              <code style={styles.keyCode}>{registeredKey}</code>
              <button 
                type="button" 
                onClick={handleCopyKey}
                style={styles.copyKeyBtn}
                title="Copy API Key"
              >
                {copiedKey ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
                {copiedKey ? 'Copied' : 'Copy'}
              </button>
            </div>

            <button onClick={handleUseKey} className="btn btn-primary" style={styles.fullBtn}>
              Continue to Dashboard
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <>
            {/* Tabs: Sign In / Register */}
            <div style={styles.tabs}>
              <button
                onClick={() => { setMode('login'); setError(''); }}
                style={{ ...styles.tab, ...(mode === 'login' ? styles.tabActive : {}) }}
              >
                Sign In with Key
              </button>
              <button
                onClick={() => { setMode('register'); setError(''); }}
                style={{ ...styles.tab, ...(mode === 'register' ? styles.tabActive : {}) }}
              >
                Register Workspace
              </button>
            </div>

            {/* Error Banner */}
            {error && (
              <div style={styles.errorBox} className="animate-fade-in">
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Sign In Mode */}
            {mode === 'login' ? (
              <form onSubmit={handleLogin} style={styles.form}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Neura API Key</label>
                  <div style={styles.inputRow}>
                    <KeyRound size={16} style={styles.inputIcon} />
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => { setApiKey(e.target.value); setError(''); }}
                      placeholder="neura_live_..."
                      style={styles.inputField}
                      autoFocus
                    />
                  </div>
                  <span style={styles.fieldHint}>
                    Format: <code>neura_live_xxxxxxxxxxxxxxxx</code>
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading || !apiKey.trim()}
                  className="btn btn-primary"
                  style={styles.fullBtn}
                >
                  {loading ? 'Verifying Credentials...' : 'Sign In'}
                  {!loading && <ArrowRight size={16} />}
                </button>
              </form>
            ) : (
              /* Register Mode with Strict Validations */
              <form onSubmit={handleRegister} style={styles.form}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>
                    Developer / Organization Name <span style={styles.requiredMark}>*</span>
                  </label>
                  <div style={styles.inputRow}>
                    <Building2 size={16} style={styles.inputIcon} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => { setName(e.target.value); setError(''); }}
                      placeholder="e.g. Aditya Sharma or Team Neura"
                      style={styles.inputField}
                      autoFocus
                    />
                  </div>
                  <span style={styles.fieldHint}>Minimum 3 characters, real words only</span>
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.label}>
                    Developer Email <span style={styles.requiredMark}>*</span>
                  </label>
                  <div style={styles.inputRow}>
                    <Mail size={16} style={styles.inputIcon} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      placeholder="e.g. developer@company.com"
                      style={styles.inputField}
                    />
                  </div>
                  <span style={styles.fieldHint}>Must be a valid email address</span>
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.label}>
                    Master Password / Passcode <span style={styles.requiredMark}>*</span>
                  </label>
                  <div style={styles.inputRow}>
                    <Lock size={16} style={styles.inputIcon} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      placeholder="At least 6 characters"
                      style={styles.inputField}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      style={styles.showPassBtn}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Selected Tier</label>
                  <select 
                    value={tier} 
                    onChange={(e) => setTier(e.target.value)}
                    style={styles.selectField}
                  >
                    <option value="developer">Developer Free (10,000 Memories, Hybrid Search)</option>
                    <option value="pro">Pro Workspace (Unlimited Memories, Dedicated Graph)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={styles.fullBtn}
                >
                  {loading ? 'Creating Workspace...' : 'Register & Generate API Key'}
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
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
  },
  themeToggleBtn: {
    position: 'absolute',
    top: 24,
    right: 24,
    padding: '8px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    zIndex: 10,
    boxShadow: 'var(--shadow-sm)',
  },
  bgGlow: {
    position: 'absolute',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
    opacity: 0.5,
  },
  container: {
    width: '100%',
    maxWidth: '460px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)',
    padding: '36px 32px',
    boxShadow: 'var(--shadow-lg)',
    position: 'relative',
    zIndex: 1,
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '28px',
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 'var(--radius-lg)',
    background: 'var(--accent-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 'var(--text-2xl)',
    fontWeight: 800,
    color: 'var(--text-primary)',
    lineHeight: 1.1,
  },
  logoSub: {
    fontSize: 'var(--text-xs)',
    color: 'var(--accent)',
    fontWeight: 600,
  },
  tabs: {
    display: 'flex',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-input)',
    padding: '4px',
    marginBottom: '20px',
    border: '1px solid var(--border)',
  },
  tab: {
    flex: 1,
    padding: '9px 12px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  tabActive: {
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    boxShadow: 'var(--shadow-sm)',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--danger-bg)',
    border: '1px solid var(--danger)',
    color: 'var(--danger)',
    fontSize: 'var(--text-xs)',
    marginBottom: '18px',
    lineHeight: 1.4,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  requiredMark: {
    color: 'var(--danger)',
  },
  inputRow: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    color: 'var(--text-tertiary)',
    pointerEvents: 'none',
  },
  inputField: {
    width: '100%',
    padding: '11px 14px 11px 38px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-sm)',
    outline: 'none',
    transition: 'border-color 0.15s ease',
  },
  showPassBtn: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    color: 'var(--text-tertiary)',
    fontSize: '11px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  selectField: {
    width: '100%',
    padding: '11px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-xs)',
    outline: 'none',
  },
  fieldHint: {
    fontSize: '11px',
    color: 'var(--text-tertiary)',
  },
  fullBtn: {
    width: '100%',
    padding: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    marginTop: '6px',
  },
  successBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  successIconBadge: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: 'var(--success-bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  heading: {
    fontSize: 'var(--text-xl)',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '8px',
  },
  successText: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    marginBottom: '20px',
  },
  keyDisplay: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '8px 12px',
    marginBottom: '20px',
    gap: '10px',
  },
  keyCode: {
    flex: 1,
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--accent)',
    wordBreak: 'break-all',
    textAlign: 'left',
  },
  copyKeyBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 10px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontSize: '11px',
    cursor: 'pointer',
    fontWeight: 600,
  },
};
