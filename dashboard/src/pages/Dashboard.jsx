import { useState, useEffect } from 'react';
import { Brain, Lightbulb, Tag, GitBranch, Clock, Activity } from 'lucide-react';
import api from '../api/client';

const typeIcons = {
  explicit_fact: Brain,
  behavioral_pattern: Activity,
  preference: Lightbulb,
  entity: GitBranch,
  temporal_fact: Clock,
};

const typeColors = {
  explicit_fact: '#3b82f6',
  behavioral_pattern: '#8b5cf6',
  preference: '#f59e0b',
  entity: '#10b981',
  temporal_fact: '#ef4444',
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const keysRes = await api.get('/auth/keys');
      setStats({
        totalKeys: keysRes.data.total || 0,
        activeKeys: keysRes.data.keys?.filter((k) => k.is_active).length || 0,
      });
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserMemories = async () => {
    if (!userId.trim()) return;
    try {
      const res = await api.get('/memory/list', { params: { user_id: userId, limit: 10 } });
      setRecent(res.data.memories || []);
      setStats((prev) => ({
        ...prev,
        totalMemories: res.data.total || 0,
        typeCounts: countTypes(res.data.memories || []),
      }));
    } catch (err) {
      console.error('Failed to load memories:', err);
    }
  };

  const countTypes = (memories) => {
    const counts = {};
    for (const m of memories) {
      counts[m.memory_type] = (counts[m.memory_type] || 0) + 1;
    }
    return counts;
  };

  if (loading) {
    return (
      <div>
        <h2 style={styles.pageTitle}>Dashboard</h2>
        <div className="stats-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: 120 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      <h2 style={styles.pageTitle}>Dashboard</h2>
      <p style={styles.pageDesc}>Overview of your Pragma memory system</p>

      <div style={styles.searchRow}>
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadUserMemories()}
          placeholder="Enter user_id to load memories..."
          className="input"
          style={{ maxWidth: 400 }}
        />
        <button onClick={loadUserMemories} className="btn btn-primary" disabled={!userId.trim()}>
          Load
        </button>
      </div>

      <div className="stats-grid" style={{ marginTop: '24px' }}>
        <div className="card stat-card">
          <div style={styles.statIconRow}>
            <div style={{ ...styles.statIcon, background: 'var(--accent-subtle)' }}>
              <Brain size={20} color="var(--accent)" />
            </div>
          </div>
          <div className="stat-value">{stats?.totalMemories ?? '—'}</div>
          <div className="stat-label">Total Memories</div>
        </div>

        <div className="card stat-card">
          <div style={styles.statIconRow}>
            <div style={{ ...styles.statIcon, background: 'var(--success-bg)' }}>
              <Tag size={20} color="var(--success)" />
            </div>
          </div>
          <div className="stat-value">
            {stats?.typeCounts ? Object.keys(stats.typeCounts).length : '—'}
          </div>
          <div className="stat-label">Memory Types</div>
        </div>

        <div className="card stat-card">
          <div style={styles.statIconRow}>
            <div style={{ ...styles.statIcon, background: 'var(--warning-bg)' }}>
              <Activity size={20} color="var(--warning)" />
            </div>
          </div>
          <div className="stat-value">{stats?.activeKeys ?? '—'}</div>
          <div className="stat-label">Active API Keys</div>
        </div>

        <div className="card stat-card">
          <div style={styles.statIconRow}>
            <div style={{ ...styles.statIcon, background: 'var(--info-bg)' }}>
              <Clock size={20} color="var(--info)" />
            </div>
          </div>
          <div className="stat-value">{recent.length > 0 ? 'Active' : '—'}</div>
          <div className="stat-label">Recent Activity</div>
        </div>
      </div>

      {stats?.typeCounts && Object.keys(stats.typeCounts).length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h3 style={styles.sectionTitle}>Memory Types</h3>
          <div style={styles.typeGrid}>
            {Object.entries(stats.typeCounts).map(([type, count]) => {
              const Icon = typeIcons[type] || Brain;
              const color = typeColors[type] || '#6366f1';
              return (
                <div key={type} className="card" style={styles.typeCard}>
                  <Icon size={18} color={color} />
                  <span style={styles.typeName}>{type.replace(/_/g, ' ')}</span>
                  <span style={styles.typeCount}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {recent.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h3 style={styles.sectionTitle}>Recent Memories</h3>
          <div style={styles.recentList}>
            {recent.map((memory) => {
              const Icon = typeIcons[memory.memory_type] || Brain;
              const color = typeColors[memory.memory_type] || '#6366f1';
              return (
                <div key={memory.id} className="card" style={styles.recentItem}>
                  <div style={styles.recentHeader}>
                    <Icon size={16} color={color} />
                    <span className="badge badge-type">{memory.memory_type.replace(/_/g, ' ')}</span>
                    <span style={styles.recentTime}>
                      {new Date(memory.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p style={styles.recentContent}>{memory.content}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  pageTitle: {
    fontSize: 'var(--text-2xl)',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  pageDesc: {
    color: 'var(--text-tertiary)',
    fontSize: 'var(--text-sm)',
    marginTop: '4px',
  },
  searchRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginTop: '24px',
  },
  statIconRow: {
    marginBottom: '12px',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 'var(--text-lg)',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '16px',
  },
  typeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '12px',
  },
  typeCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px',
  },
  typeName: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-secondary)',
    textTransform: 'capitalize',
    flex: 1,
  },
  typeCount: {
    fontSize: 'var(--text-lg)',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  recentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  recentItem: {
    padding: '16px',
  },
  recentHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  recentTime: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-tertiary)',
    marginLeft: 'auto',
  },
  recentContent: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
};
