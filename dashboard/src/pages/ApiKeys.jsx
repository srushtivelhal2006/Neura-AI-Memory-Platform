import { useState, useEffect } from 'react';
import { Plus, Trash2, Key, Copy, Check, Shield } from 'lucide-react';
import api from '../api/client';

export default function ApiKeys() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/keys');
      setKeys(res.data.keys || []);
    } catch (err) {
      showToast('Failed to load keys', 'error');
    } finally {
      setLoading(false);
    }
  };

  const createKey = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const res = await api.post('/auth/keys', { name: newKeyName });
      setNewKey(res.data.api_key);
      setNewKeyName('');
      loadKeys();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create key', 'error');
    } finally {
      setCreating(false);
    }
  };

  const revokeKey = async (id, name) => {
    if (!confirm(`Revoke API key "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/auth/keys/${id}`);
      showToast('Key revoked', 'success');
      loadKeys();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to revoke key', 'error');
    }
  };

  const copyKey = async (text) => {
    await navigator.clipboard.writeText(text);
    setCopiedId('new');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="animate-slide-up">
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>API Keys</h2>
          <p style={styles.desc}>Manage API keys for your tenant</p>
        </div>
        <button
          onClick={() => { setShowCreate(!showCreate); setNewKey(''); }}
          className="btn btn-primary"
        >
          <Plus size={16} /> Create Key
        </button>
      </div>

      {showCreate && (
        <div className="card animate-slide-up" style={styles.createBox}>
          {newKey ? (
            <div>
              <h3 style={{ ...styles.createTitle, color: 'var(--success)' }}>
                <Check size={18} /> Key Created
              </h3>
              <p style={styles.createDesc}>
                Copy your key now — it will not be shown again.
              </p>
              <div style={styles.keyDisplay}>
                <code style={styles.keyCode}>{newKey}</code>
                <button
                  onClick={() => copyKey(newKey)}
                  className="btn btn-ghost btn-sm"
                >
                  {copiedId === 'new' ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <button onClick={() => { setShowCreate(false); setNewKey(''); }} className="btn btn-secondary" style={{ width: '100%' }}>
                Done
              </button>
            </div>
          ) : (
            <div>
              <h3 style={styles.createTitle}>Create New API Key</h3>
              <div style={styles.createForm}>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createKey()}
                  placeholder="Key name (e.g., Production, Staging)"
                  className="input"
                  autoFocus
                />
                <button
                  onClick={createKey}
                  disabled={creating || !newKeyName.trim()}
                  className="btn btn-primary"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div style={{ marginTop: 24 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 72, marginBottom: 8 }} />
          ))}
        </div>
      ) : keys.length > 0 ? (
        <div className="table-container" style={{ marginTop: 24 }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Key</th>
                <th>Status</th>
                <th>Permissions</th>
                <th>Last Used</th>
                <th>Created</th>
                <th style={{ width: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{k.name}</td>
                  <td>
                    <code style={styles.keyPreview}>{k.key_preview}</code>
                  </td>
                  <td>
                    <span className={`badge ${k.is_active ? 'badge-active' : 'badge-revoked'}`}>
                      {k.is_active ? 'Active' : 'Revoked'}
                    </span>
                  </td>
                  <td>
                    <div style={styles.perms}>
                      {k.permissions?.read && <Shield size={12} color="var(--success)" />}
                      {k.permissions?.write && <Key size={12} color="var(--accent)" />}
                      {k.permissions?.admin && <span style={{ color: 'var(--warning)', fontSize: 'var(--text-xs)' }}>Admin</span>}
                    </div>
                  </td>
                  <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    {new Date(k.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    {k.is_active && (
                      <button onClick={() => revokeKey(k.id, k.name)} className="btn btn-danger btn-sm" title="Revoke">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state" style={{ marginTop: 64 }}>
          <Key size={48} />
          <h3 style={{ marginTop: 16, color: 'var(--text-secondary)' }}>No API keys</h3>
          <p style={{ fontSize: 'var(--text-sm)' }}>Create your first API key to get started</p>
        </div>
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
      )}
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 'var(--text-2xl)',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  desc: {
    color: 'var(--text-tertiary)',
    fontSize: 'var(--text-sm)',
    marginTop: '4px',
  },
  createBox: {
    marginTop: '20px',
    padding: '24px',
  },
  createTitle: {
    fontSize: 'var(--text-base)',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  createDesc: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-secondary)',
    marginBottom: '16px',
  },
  createForm: {
    display: 'flex',
    gap: '12px',
  },
  keyDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 14px',
    marginBottom: '16px',
  },
  keyCode: {
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--text-xs)',
    color: 'var(--accent-light)',
    wordBreak: 'break-all',
    flex: 1,
  },
  keyPreview: {
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--text-xs)',
    color: 'var(--text-secondary)',
    background: 'var(--bg-secondary)',
    padding: '4px 8px',
    borderRadius: 'var(--radius-sm)',
  },
  perms: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
};
