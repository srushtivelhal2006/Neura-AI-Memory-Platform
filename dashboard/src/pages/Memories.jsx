import { useState } from 'react';
import { Trash2, ChevronLeft, ChevronRight, Brain, AlertCircle, History } from 'lucide-react';
import api from '../api/client';

export default function Memories() {
  const [userId, setUserId] = useState('');
  const [memories, setMemories] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [historyModal, setHistoryModal] = useState(null);
  const [historyData, setHistoryData] = useState([]);

  const loadMemories = async (p = 1) => {
    if (!userId.trim()) return;
    setLoading(true);
    setError('');
    try {
      const params = { user_id: userId, page: p, limit };
      if (filter) params.memory_type = filter;
      const res = await api.get('/memory/list', { params });
      setMemories(res.data.memories || []);
      setTotal(res.data.total || 0);
      setPage(p);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load memories');
    } finally {
      setLoading(false);
    }
  };

  const deleteMemory = async (id) => {
    if (!confirm('Delete this memory?')) return;
    try {
      await api.delete(`/memory/${id}`);
      showToast('Memory deleted', 'success');
      loadMemories(page);
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  const deleteAll = async () => {
    if (!confirm(`Delete ALL memories for user "${userId}"? This cannot be undone.`)) return;
    try {
      const res = await api.delete(`/memory/user/${userId}`);
      showToast(`Deleted ${res.data.deleted_count} memories`, 'success');
      setMemories([]);
      setTotal(0);
    } catch (err) {
      showToast(err.response?.data?.message || 'Bulk delete failed', 'error');
    }
  };

  const viewHistory = async (id) => {
    try {
      const res = await api.get(`/memory/history/${id}`);
      setHistoryData(res.data.history || []);
      setHistoryModal(id);
    } catch (err) {
      showToast('Failed to load history', 'error');
    }
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="animate-slide-up">
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Memories</h2>
          <p style={styles.desc}>Browse, manage, and delete memories</p>
        </div>
        {memories.length > 0 && (
          <button onClick={deleteAll} className="btn btn-danger">
            <Trash2 size={14} /> Delete All
          </button>
        )}
      </div>

      <div style={styles.controls}>
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadMemories(1)}
          placeholder="Enter user_id..."
          className="input"
          style={{ maxWidth: 300 }}
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input"
          style={{ maxWidth: 200 }}
        >
          <option value="">All Types</option>
          <option value="explicit_fact">Explicit Fact</option>
          <option value="behavioral_pattern">Behavioral Pattern</option>
          <option value="preference">Preference</option>
          <option value="entity">Entity</option>
          <option value="temporal_fact">Temporal Fact</option>
        </select>
        <button onClick={() => loadMemories(1)} className="btn btn-primary" disabled={!userId.trim()}>
          Load
        </button>
      </div>

      {error && (
        <div style={styles.errorBox}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ marginTop: 24 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton" style={{ height: 60, marginBottom: 8 }} />
          ))}
        </div>
      ) : memories.length > 0 ? (
        <>
          <div className="table-container" style={{ marginTop: 24 }}>
            <table>
              <thead>
                <tr>
                  <th>Content</th>
                  <th>Type</th>
                  <th>Confidence</th>
                  <th>Created</th>
                  <th style={{ width: 120 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {memories.map((mem) => (
                  <tr key={mem.id}>
                    <td style={{ maxWidth: 400 }}>
                      <span style={styles.content}>
                        {mem.content.length > 120 ? mem.content.substring(0, 120) + '...' : mem.content}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-type">
                        {mem.memory_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        color: mem.confidence >= 0.8 ? 'var(--success)' :
                          mem.confidence >= 0.5 ? 'var(--warning)' : 'var(--danger)',
                        fontWeight: 600,
                        fontSize: 'var(--text-sm)',
                      }}>
                        {(mem.confidence * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                      {new Date(mem.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => viewHistory(mem.id)} className="btn btn-ghost btn-sm" title="View history">
                          <History size={14} />
                        </button>
                        <button onClick={() => deleteMemory(mem.id)} className="btn btn-danger btn-sm" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => loadMemories(page - 1)}
                disabled={page <= 1}
                className="btn btn-ghost btn-sm"
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                Page {page} of {totalPages} ({total} total)
              </span>
              <button
                onClick={() => loadMemories(page + 1)}
                disabled={page >= totalPages}
                className="btn btn-ghost btn-sm"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      ) : userId && !loading ? (
        <div className="empty-state" style={{ marginTop: 64 }}>
          <Brain size={48} />
          <h3 style={{ marginTop: 16, color: 'var(--text-secondary)' }}>No memories found</h3>
          <p style={{ fontSize: 'var(--text-sm)' }}>No memories exist for user "{userId}"</p>
        </div>
      ) : null}

      {historyModal && (
        <div style={styles.modalOverlay} onClick={() => setHistoryModal(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()} className="animate-slide-up">
            <h3 style={styles.modalTitle}>Change History</h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 16 }}>
              Memory ID: {historyModal}
            </p>
            {historyData.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)' }}>No history records</p>
            ) : (
              <div style={styles.timeline}>
                {historyData.map((h, i) => (
                  <div key={h.id || i} style={styles.timelineItem}>
                    <div style={styles.timelineDot} />
                    <div style={styles.timelineContent}>
                      <div style={styles.timelineHeader}>
                        <span className={`badge ${h.change_type === 'created' ? 'badge-active' : h.change_type === 'deleted' ? 'badge-revoked' : 'badge-type'}`}>
                          {h.change_type}
                        </span>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                          {new Date(h.changed_at).toLocaleString()}
                        </span>
                      </div>
                      {h.new_content && (
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 6 }}>
                          {h.new_content.substring(0, 200)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setHistoryModal(null)} className="btn btn-secondary" style={{ marginTop: 16, width: '100%' }}>
              Close
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.msg}
        </div>
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
  controls: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginTop: '24px',
    flexWrap: 'wrap',
  },
  content: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-primary)',
    lineHeight: 1.4,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '16px',
    padding: '12px 16px',
    background: 'var(--danger-bg)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--danger)',
    fontSize: 'var(--text-sm)',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)',
    padding: '32px',
    width: '520px',
    maxHeight: '80vh',
    overflowY: 'auto',
  },
  modalTitle: {
    fontSize: 'var(--text-lg)',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '4px',
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  timelineItem: {
    display: 'flex',
    gap: '12px',
    position: 'relative',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: 'var(--accent)',
    marginTop: 6,
    flexShrink: 0,
  },
  timelineContent: {
    flex: 1,
  },
  timelineHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
};
