import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search as SearchIcon, Palette, Cpu, Play, Box, 
  CloudUpload, Bot, Wrench, CreditCard, Keyboard, Info, 
  Star, Key, Trash2, Check, AlertCircle, RefreshCw, Sparkles,
  Cloud, Terminal, X, Eye, EyeOff
} from 'lucide-react';
import api from '../api/client';
import { useTheme } from '../context/ThemeContext';

export default function AiProviders() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('providers');
  const [searchSettings, setSearchSettings] = useState('');
  const [toast, setToast] = useState(null);

  // Modal configuration state
  const [configModal, setConfigModal] = useState(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [endpointInput, setEndpointInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    loadProviders();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadProviders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/providers');
      setProviders(res.data.providers || []);
    } catch (err) {
      showToast('Failed to load providers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (p) => {
    try {
      await api.put(`/providers/${p.id}`, { is_enabled: !p.is_enabled });
      setProviders(prev => prev.map(item => item.id === p.id ? { ...item, is_enabled: !item.is_enabled } : item));
      showToast(`${p.name} ${!p.is_enabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      showToast('Toggle failed', 'error');
    }
  };

  const handleSetDefault = async (p) => {
    if (p.is_default) return;
    try {
      await api.put(`/providers/${p.id}`, { is_default: true, is_enabled: true });
      setProviders(prev => prev.map(item => ({
        ...item,
        is_default: item.id === p.id,
        is_enabled: item.id === p.id ? true : item.is_enabled
      })));
      showToast(`${p.name} set as default AI provider`);
    } catch (err) {
      showToast('Failed to set default', 'error');
    }
  };

  const handleReset = async (p) => {
    if (!confirm(`Reset API credentials and settings for ${p.name}?`)) return;
    try {
      await api.delete(`/providers/${p.id}`);
      showToast(`${p.name} settings reset`);
      loadProviders();
    } catch (err) {
      showToast('Reset failed', 'error');
    }
  };

  const openConfig = (p) => {
    setConfigModal(p);
    setApiKeyInput('');
    setShowKey(false);
    setSelectedModel(p.selected_model);
    setEndpointInput(p.endpoint);
    setTestResult(null);
  };

  const handleSaveConfig = async () => {
    if (!configModal) return;
    setSaving(true);
    try {
      const payload = {
        selected_model: selectedModel,
        endpoint: endpointInput,
      };
      if (apiKeyInput.trim()) {
        payload.api_key = apiKeyInput.trim();
      }
      await api.put(`/providers/${configModal.id}`, payload);
      showToast(`${configModal.name} settings saved!`);
      setConfigModal(null);
      loadProviders();
    } catch (err) {
      showToast(err.response?.data?.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTestInModal = async () => {
    if (!configModal) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.post(`/providers/${configModal.id}/test`, {
        api_key: apiKeyInput.trim()
      });
      setTestResult({ success: true, message: res.data.message });
      showToast('Connection verified successfully!');
    } catch (err) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || 'Connection test failed'
      });
    } finally {
      setTesting(false);
    }
  };

  // Provider Icons Renderer matching screenshot
  const renderProviderIcon = (id) => {
    switch (id) {
      case 'anthropic':
        return (
          <div style={styles.iconAnthropic}>
            <span style={styles.iconAnthropicText}>AI</span>
          </div>
        );
      case 'openai':
        return (
          <div style={styles.iconOpenAI}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 3a9 9 0 0 1 6.36 15.36M12 21a9 9 0 0 1-6.36-15.36" />
            </svg>
          </div>
        );
      case 'gemini':
        return (
          <div style={styles.iconGemini}>
            <Sparkles size={20} color="#38bdf8" />
          </div>
        );
      case 'opencode':
        return (
          <div style={styles.iconOpenCode}>
            <span style={styles.iconOpenCodeText}>&lt;&nbsp;&gt;</span>
          </div>
        );
      case 'copilot':
      default:
        return (
          <div style={styles.iconCopilot}>
            <Bot size={20} color="#c084fc" />
          </div>
        );
    }
  };

  return (
    <div style={styles.windowFrame} className="animate-slide-up">
      {/* Top macOS-style window bar */}
      <div style={styles.windowBar}>
        <div style={styles.windowDots}>
          <span style={{ ...styles.dot, background: '#ff5f56' }} />
          <span style={{ ...styles.dot, background: '#ffbd2e' }} />
          <span style={{ ...styles.dot, background: '#27c93f' }} />
        </div>
        <div style={styles.windowTitleGroup}>
          <span style={styles.windowTitle}>neura-memory</span>
          <span style={styles.branchPill}>⑂ feat/neura-engine-v2</span>
        </div>
        <div style={styles.windowControls}>
          <button onClick={toggleTheme} style={styles.topThemeBtn} title="Toggle Dark/Light Mode">
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </div>

      {/* Main Settings Body */}
      <div style={styles.settingsLayout}>
        {/* Left Sub-Sidebar (Settings Menu from screenshot) */}
        <aside style={styles.settingsNav}>
          <button onClick={() => navigate('/')} style={styles.backBtn}>
            <ArrowLeft size={14} />
            <span>Back to app</span>
          </button>

          <div style={styles.settingsNavSection}>SETTINGS</div>

          <div style={styles.navSearchBox}>
            <SearchIcon size={13} color="var(--text-tertiary)" />
            <input 
              type="text" 
              placeholder="Search settings..."
              value={searchSettings}
              onChange={(e) => setSearchSettings(e.target.value)}
              style={styles.navSearchInput}
            />
          </div>

          <div style={styles.navLinks}>
            <button 
              onClick={() => { setActiveTab('appearance'); toggleTheme(); }}
              style={{ ...styles.navLinkItem, ...(activeTab === 'appearance' ? styles.navLinkActive : {}) }}
            >
              <Palette size={15} />
              <span>Appearance</span>
            </button>

            <button 
              onClick={() => setActiveTab('providers')}
              style={{ ...styles.navLinkItem, ...(activeTab === 'providers' ? styles.navLinkActive : {}) }}
            >
              <Cpu size={15} />
              <span>AI Providers</span>
            </button>

            <button 
              onClick={() => navigate('/chat')}
              style={styles.navLinkItem}
            >
              <Play size={15} />
              <span>Execution / Chat</span>
            </button>

            <button 
              onClick={() => navigate('/memories')}
              style={styles.navLinkItem}
            >
              <Box size={15} />
              <span>Memory Sandbox</span>
            </button>

            <button 
              onClick={() => navigate('/integrations')}
              style={styles.navLinkItem}
            >
              <Bot size={15} />
              <span>Agents & MCP</span>
            </button>

            <button 
              onClick={() => navigate('/api-keys')}
              style={styles.navLinkItem}
            >
              <Key size={15} />
              <span>API Keys</span>
            </button>

            <button 
              onClick={() => alert('Neura – AI Memory Platform v2.0\nPersistent cross-session context engine for AI coding agents.')}
              style={styles.navLinkItem}
            >
              <Info size={15} />
              <span>About</span>
            </button>
          </div>
        </aside>

        {/* Right Main Content Area */}
        <main style={styles.settingsMain}>
          <div style={styles.contentHeader}>
            <h1 style={styles.pageHeading}>AI Providers</h1>
            <p style={styles.pageSubheading}>
              Configure providers and set your default. Use CLI mode with installed tools or add an API key for direct API access.
            </p>
          </div>

          {/* Toast Notification */}
          {toast && (
            <div style={{
              ...styles.toast,
              background: toast.type === 'error' ? 'var(--danger-bg)' : 'var(--success-bg)',
              borderColor: toast.type === 'error' ? 'var(--danger)' : 'var(--success)',
              color: toast.type === 'error' ? 'var(--danger)' : 'var(--success)',
            }}>
              {toast.type === 'error' ? <AlertCircle size={15} /> : <Check size={15} />}
              <span>{toast.message}</span>
            </div>
          )}

          {/* Provider List (Horizontal sleek cards matching screenshot) */}
          {loading ? (
            <div style={styles.loadingBox}>
              <RefreshCw size={20} className="animate-spin" color="var(--accent)" />
              <span>Loading AI providers...</span>
            </div>
          ) : (
            <div style={styles.providerList}>
              {providers.map((p) => {
                return (
                  <div 
                    key={p.id} 
                    style={{
                      ...styles.providerCard,
                      borderColor: p.is_default ? 'rgba(99, 102, 241, 0.4)' : 'var(--border)',
                    }}
                  >
                    {/* Left: Brand Icon & Names */}
                    <div style={styles.cardLeft}>
                      {renderProviderIcon(p.id)}

                      <div style={styles.cardTitleBlock}>
                        <div style={styles.nameRow}>
                          <span style={styles.providerTitle}>{p.name}</span>
                          {p.is_default && (
                            <span style={styles.defaultPill}>Default</span>
                          )}
                        </div>

                        {/* Subline matching screenshot: >_ CLI ☁ API · model */}
                        <div style={styles.sublineRow}>
                          {p.cli_supported && (
                            <span style={styles.cliTag}>
                              <span style={styles.cliPrompt}>&gt;_</span> CLI
                            </span>
                          )}

                          {p.api_supported && (
                            <span style={styles.apiTag}>
                              <Cloud size={11} /> API
                            </span>
                          )}

                          <span style={styles.dotSeparator}>·</span>

                          <span style={styles.modelTag}>{p.selected_model}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Controls matching screenshot (Toggle, Star, Key, Trash) */}
                    <div style={styles.cardRightControls}>
                      {/* Green Toggle Switch */}
                      <label style={styles.switchWrapper}>
                        <input 
                          type="checkbox" 
                          checked={p.is_enabled} 
                          onChange={() => handleToggle(p)}
                          style={styles.switchCheckbox}
                        />
                        <span style={{
                          ...styles.switchTrack,
                          background: p.is_enabled ? '#22c55e' : 'var(--border-light)',
                        }}>
                          <span style={{
                            ...styles.switchThumb,
                            transform: p.is_enabled ? 'translateX(16px)' : 'translateX(0)',
                          }} />
                        </span>
                      </label>

                      {/* Star Icon for Default */}
                      <button 
                        onClick={() => handleSetDefault(p)}
                        style={{
                          ...styles.iconControlBtn,
                          color: p.is_default ? '#eab308' : 'var(--text-tertiary)',
                        }}
                        title={p.is_default ? 'Default Provider' : 'Make Default'}
                      >
                        <Star size={16} fill={p.is_default ? '#eab308' : 'none'} />
                      </button>

                      {/* Key / Settings Icon */}
                      <button 
                        onClick={() => openConfig(p)}
                        style={styles.iconControlBtn}
                        title="Configure API Key and Model"
                      >
                        <Key size={16} />
                      </button>

                      {/* Trash / Reset Icon */}
                      <button 
                        onClick={() => handleReset(p)}
                        style={{ ...styles.iconControlBtn, color: 'var(--text-tertiary)' }}
                        title="Reset Provider Configuration"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Configuration Modal */}
      {configModal && (
        <div style={styles.modalOverlay} onClick={() => setConfigModal(null)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {renderProviderIcon(configModal.id)}
                <div>
                  <h3 style={styles.modalTitle}>Configure {configModal.name}</h3>
                  <span style={styles.modalSub}>API Key, Model selection & Custom Endpoint</span>
                </div>
              </div>
              <button onClick={() => setConfigModal(null)} style={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>

            <div style={styles.modalBody}>
              {/* API Key Field */}
              {configModal.id !== 'opencode' && (
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>
                    API Key
                    {configModal.has_key && (
                      <span style={{ fontSize: '11px', color: 'var(--success)' }}>
                        (Key currently saved: <code>{configModal.api_key_masked}</code>)
                      </span>
                    )}
                  </label>
                  <div style={styles.passwordWrapper}>
                    <input 
                      type={showKey ? 'text' : 'password'}
                      placeholder={configModal.has_key ? 'Enter new key to replace...' : `Enter ${configModal.name} API Key`}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      style={styles.modalInput}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowKey(!showKey)}
                      style={styles.eyeBtn}
                    >
                      {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Model Selector */}
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Select Active Model</label>
                <select 
                  value={selectedModel} 
                  onChange={(e) => setSelectedModel(e.target.value)}
                  style={styles.modalSelect}
                >
                  {configModal.models.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Endpoint */}
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Base API Endpoint</label>
                <input 
                  type="text" 
                  value={endpointInput}
                  onChange={(e) => setEndpointInput(e.target.value)}
                  style={styles.modalInput}
                />
              </div>

              {/* Live Test Feedback */}
              {testResult && (
                <div style={{
                  ...styles.testBox,
                  background: testResult.success ? 'var(--success-bg)' : 'var(--danger-bg)',
                  borderColor: testResult.success ? 'var(--success)' : 'var(--danger)',
                  color: testResult.success ? 'var(--success)' : 'var(--danger)',
                }}>
                  {testResult.success ? <Check size={14} /> : <AlertCircle size={14} />}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button 
                type="button" 
                onClick={handleTestInModal}
                className="btn btn-secondary"
                disabled={testing}
                style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={13} className={testing ? 'animate-spin' : ''} />
                {testing ? 'Testing...' : 'Test Connection'}
              </button>

              <button 
                type="button" 
                onClick={() => setConfigModal(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>

              <button 
                type="button" 
                onClick={handleSaveConfig}
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  windowFrame: {
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--border)',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-lg)',
    minHeight: 'calc(100vh - 60px)',
    display: 'flex',
    flexDirection: 'column',
  },
  windowBar: {
    height: '40px',
    background: 'var(--bg-primary)',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    gap: '16px',
    userSelect: 'none',
  },
  windowDots: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  dot: {
    width: '11px',
    height: '11px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  windowTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: 'var(--text-xs)',
    color: 'var(--text-secondary)',
  },
  windowTitle: {
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  branchPill: {
    fontSize: '11px',
    color: 'var(--text-tertiary)',
    background: 'var(--bg-input)',
    padding: '2px 8px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
  },
  windowControls: {
    marginLeft: 'auto',
  },
  topThemeBtn: {
    background: 'none',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '3px 8px',
    fontSize: '11px',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  },
  settingsLayout: {
    display: 'flex',
    flex: 1,
  },
  settingsNav: {
    width: '220px',
    borderRight: '1px solid var(--border)',
    background: 'var(--bg-primary)',
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: 'var(--text-xs)',
    cursor: 'pointer',
    padding: '6px 8px',
    borderRadius: 'var(--radius-sm)',
    marginBottom: '16px',
  },
  settingsNavSection: {
    fontSize: '10px',
    fontWeight: 700,
    color: 'var(--text-tertiary)',
    letterSpacing: '0.08em',
    padding: '0 8px',
    marginBottom: '8px',
  },
  navSearchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 10px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    marginBottom: '16px',
  },
  navSearchInput: {
    width: '100%',
    background: 'none',
    border: 'none',
    outline: 'none',
    color: 'var(--text-primary)',
    fontSize: '11px',
  },
  navLinks: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  navLinkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 10px',
    borderRadius: 'var(--radius-md)',
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: 'var(--text-xs)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease',
  },
  navLinkActive: {
    background: 'var(--bg-card-hover)',
    color: 'var(--text-primary)',
    fontWeight: 600,
  },
  settingsMain: {
    flex: 1,
    padding: '32px 40px',
    background: 'var(--bg-secondary)',
    overflowY: 'auto',
  },
  contentHeader: {
    marginBottom: '28px',
  },
  pageHeading: {
    fontSize: '22px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '6px',
  },
  pageSubheading: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-secondary)',
    maxWidth: '680px',
    lineHeight: 1.5,
  },
  toast: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid',
    fontSize: 'var(--text-xs)',
    marginBottom: '18px',
    fontWeight: 500,
  },
  providerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxWidth: '820px',
  },
  providerCard: {
    background: 'var(--bg-card)',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    padding: '14px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    transition: 'all 0.15s ease',
  },
  cardLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  cardTitleBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  providerTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  defaultPill: {
    fontSize: '11px',
    fontWeight: 500,
    padding: '1px 8px',
    borderRadius: '6px',
    background: 'var(--bg-elevated)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)',
  },
  sublineRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '11px',
    color: 'var(--text-tertiary)',
  },
  cliTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    color: 'var(--text-secondary)',
  },
  cliPrompt: {
    color: '#22c55e',
    fontWeight: 700,
  },
  apiTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    color: 'var(--text-secondary)',
  },
  dotSeparator: {
    color: 'var(--text-tertiary)',
  },
  modelTag: {
    color: 'var(--text-secondary)',
  },
  cardRightControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  switchWrapper: {
    position: 'relative',
    display: 'inline-block',
    width: '38px',
    height: '22px',
    cursor: 'pointer',
  },
  switchCheckbox: {
    opacity: 0,
    width: 0,
    height: 0,
  },
  switchTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: '22px',
    transition: '0.2s',
  },
  switchThumb: {
    position: 'absolute',
    top: '2px',
    left: '2px',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    background: '#ffffff',
    boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
    transition: '0.2s',
  },
  iconControlBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.15s ease',
  },
  iconAnthropic: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: '#d97706',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconAnthropicText: {
    color: '#ffffff',
    fontWeight: 800,
    fontSize: '15px',
    fontFamily: 'sans-serif',
  },
  iconOpenAI: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: 'rgba(16, 185, 129, 0.15)',
    color: '#10b981',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGemini: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: 'rgba(56, 189, 248, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOpenCode: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: 'rgba(239, 68, 68, 0.15)',
    color: '#ef4444',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOpenCodeText: {
    fontWeight: 700,
    fontSize: '13px',
    fontFamily: 'monospace',
  },
  iconCopilot: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: 'rgba(192, 132, 252, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '40px',
    color: 'var(--text-secondary)',
    fontSize: 'var(--text-sm)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modalCard: {
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--border)',
    width: '100%',
    maxWidth: '500px',
    boxShadow: 'var(--shadow-lg)',
  },
  modalHeader: {
    padding: '18px 24px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 'var(--text-base)',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  modalSub: {
    fontSize: '11px',
    color: 'var(--text-tertiary)',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
  },
  modalBody: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  inputLabel: {
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    display: 'flex',
    justifyContent: 'space-between',
  },
  passwordWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  modalInput: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-sm)',
    outline: 'none',
  },
  modalSelect: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-sm)',
    outline: 'none',
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
  },
  testBox: {
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid',
    fontSize: '11px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  modalFooter: {
    padding: '16px 24px',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    background: 'var(--bg-primary)',
  },
};
