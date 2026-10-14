import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Brain, Lightbulb, Tag, GitBranch, Clock, Activity, MessageSquare, 
  Cpu, Blocks, ArrowRight, Sparkles, ShieldCheck 
} from 'lucide-react';
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
  const [userId, setUserId] = useState('aditya');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const keysRes = await api.get('/auth/keys');
      const memRes = await api.get('/memory/list', { params: { user_id: 'aditya', limit: 10 } });
      
      const memories = memRes.data.memories || [];
      setRecent(memories);
      setStats({
        totalKeys: keysRes.data.total || 0,
        activeKeys: keysRes.data.keys?.filter((k) => k.is_active).length || 0,
        totalMemories: memRes.data.total || memories.length,
        typeCounts: countTypes(memories),
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
        <div className="stats-grid" style={{ marginTop: '24px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      {/* Top Title Banner */}
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.pageTitle}>Neura – AI Memory Platform</h2>
          <p style={styles.pageDesc}>Universal persistent memory & context layer for AI coding agents and LLMs</p>
        </div>
        <div style={styles.badgeEngine}>
          <Sparkles size={14} color="var(--accent)" />
          <span>v2.0 Hybrid Engine</span>
        </div>
      </div>

      {/* Feature Action Cards */}
      <div style={styles.quickGrid}>
        <Link to="/chat" style={{ ...styles.quickCard, borderColor: 'var(--accent)' }}>
          <div style={{ ...styles.quickIcon, background: 'var(--accent-subtle)' }}>
            <MessageSquare size={22} color="var(--accent)" />
          </div>
          <div style={styles.quickContent}>
            <div style={styles.quickTitleRow}>
              <span style={styles.quickTitle}>AI Memory Chat</span>
              <span style={styles.newBadge}>Live</span>
            </div>
            <p style={styles.quickDesc}>Ask questions about saved projects, code decisions, and preferences with real citations.</p>
          </div>
          <ArrowRight size={18} color="var(--accent)" style={styles.quickArrow} />
        </Link>

        <Link to="/providers" style={styles.quickCard}>
          <div style={{ ...styles.quickIcon, background: 'var(--info-bg)' }}>
            <Cpu size={22} color="var(--info)" />
          </div>
          <div style={styles.quickContent}>
            <div style={styles.quickTitleRow}>
              <span style={styles.quickTitle}>AI Providers & Models</span>
            </div>
            <p style={styles.quickDesc}>Connect Claude, OpenAI, Gemini, or local Ollama endpoints with verified status checks.</p>
          </div>
          <ArrowRight size={18} color="var(--text-tertiary)" style={styles.quickArrow} />
        </Link>

        <Link to="/integrations" style={styles.quickCard}>
          <div style={{ ...styles.quickIcon, background: 'var(--success-bg)' }}>
            <Blocks size={22} color="var(--success)" />
          </div>
          <div style={styles.quickContent}>
            <div style={styles.quickTitleRow}>
              <span style={styles.quickTitle}>Agent Integrations</span>
            </div>
            <p style={styles.quickDesc}>Connect Google Antigravity, Claude Code, and Cursor via MCP protocol.</p>
          </div>
          <ArrowRight size={18} color="var(--text-tertiary)" style={styles.quickArrow} />
        </Link>
      </div>

      {/* Filter / User Search Row */}
      <div style={styles.searchRow}>
        <span style={styles.searchLabel}>Active Target User ID:</span>
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadUserMemories()}
          placeholder="Enter user_id..."
          className="input"
          style={{ maxWidth: 280 }}
        />
        <button onClick={loadUserMemories} className="btn btn-primary" disabled={!userId.trim()}>
          Filter Stats
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ marginTop: '20px' }}>
        <div className="card stat-card">
          <div style={styles.statIconRow}>
            <div style={{ ...styles.statIcon, background: 'var(--accent-subtle)' }}>
              <Brain size={20} color="var(--accent)" />
            </div>
          </div>
          <div className="stat-value">{stats?.totalMemories ?? '0'}</div>
          <div className="stat-label">Total Saved Memories</div>
        </div>

        <div className="card stat-card">
          <div style={styles.statIconRow}>
            <div style={{ ...styles.statIcon, background: 'var(--success-bg)' }}>
              <Tag size={20} color="var(--success)" />
            </div>
          </div>
          <div className="stat-value">
            {stats?.typeCounts ? Object.keys(stats.typeCounts).length : '0'}
          </div>
          <div className="stat-label">Memory Classifications</div>
        </div>

        <div className="card stat-card">
          <div style={styles.statIconRow}>
            <div style={{ ...styles.statIcon, background: 'var(--warning-bg)' }}>
              <Activity size={20} color="var(--warning)" />
            </div>
          </div>
          <div className="stat-value">{stats?.activeKeys ?? '1'}</div>
          <div className="stat-label">Active Agent API Keys</div>
        </div>

        <div className="card stat-card">
          <div style={styles.statIconRow}>
            <div style={{ ...styles.statIcon, background: 'var(--info-bg)' }}>
              <Clock size={20} color="var(--info)" />
            </div>
          </div>
          <div className="stat-value">{recent.length > 0 ? 'Active' : 'Idle'}</div>
          <div className="stat-label">Memory Retrieval Pipeline</div>
        </div>
      </div>

      {/* Memory Types Breakdown */}
      {stats?.typeCounts && Object.keys(stats.typeCounts).length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h3 style={styles.sectionTitle}>Memory Type Distribution</h3>
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

      {/* Recent Memories List */}
      {recent.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Recent Memories in Neura Bank</h3>
            <Link to="/memories" style={styles.viewAllLink}>
              View All Memories &rarr;
            </Link>
          </div>
          <div style={styles.recentList}>
            {recent.map((memory) => {
              const Icon = typeIcons[memory.memory_type] || Brain;
              const color = typeColors[memory.memory_type] || '#6366f1';
              return (
                <div key={memory.id} className="card" style={styles.recentItem}>
                  <div style={styles.recentHeader}>
                    <div style={styles.recentMeta}>
                      <Icon size={16} color={color} />
                      <span className="badge badge-type">{memory.memory_type.replace(/_/g, ' ')}</span>
                      <span style={styles.userBadge}>User: {memory.user_id}</span>
                    </div>
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
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  pageTitle: {
    fontSize: 'var(--text-2xl)',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '4px',
  },
  pageDesc: {
    color: 'var(--text-secondary)',
    fontSize: 'var(--text-sm)',
  },
  badgeEngine: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: 'var(--radius-full)',
    background: 'var(--accent-subtle)',
    border: '1px solid var(--accent-glow)',
    color: 'var(--accent)',
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  quickGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '16px',
    marginBottom: '28px',
  },
  quickCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '18px 20px',
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--border)',
    textDecoration: 'none',
    boxShadow: 'var(--shadow-sm)',
    transition: 'all 0.2s ease',
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  quickContent: {
    flex: 1,
    minWidth: 0,
  },
  quickTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  quickTitle: {
    fontSize: 'var(--text-sm)',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  newBadge: {
    fontSize: '9px',
    fontWeight: 800,
    padding: '1px 6px',
    borderRadius: 'var(--radius-full)',
    background: 'var(--accent)',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  quickDesc: {
    fontSize: '11px',
    color: 'var(--text-tertiary)',
    lineHeight: 1.4,
  },
  quickArrow: {
    flexShrink: 0,
  },
  searchRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  searchLabel: {
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    color: 'var(--text-tertiary)',
  },
  statIconRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: 'var(--text-base)',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  viewAllLink: {
    fontSize: 'var(--text-xs)',
    color: 'var(--accent)',
    fontWeight: 600,
    textDecoration: 'none',
  },
  typeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '12px',
    marginTop: '12px',
  },
  typeCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    background: 'var(--bg-card)',
  },
  typeName: {
    flex: 1,
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    color: 'var(--text-primary)',
    textTransform: 'capitalize',
  },
  typeCount: {
    fontSize: 'var(--text-sm)',
    fontWeight: 700,
    color: 'var(--text-secondary)',
  },
  recentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '12px',
  },
  recentItem: {
    padding: '16px 20px',
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
  },
  recentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  recentMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  userBadge: {
    fontSize: '11px',
    color: 'var(--text-tertiary)',
    background: 'var(--bg-input)',
    padding: '2px 8px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
  },
  recentTime: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-tertiary)',
  },
  recentContent: {
    color: 'var(--text-secondary)',
    fontSize: 'var(--text-sm)',
    lineHeight: 1.6,
  },
};
