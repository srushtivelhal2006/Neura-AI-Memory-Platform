import { useState } from 'react';
import { Search as SearchIcon, Zap, Clock, AlertCircle } from 'lucide-react';
import api from '../api/client';

export default function Search() {
  const [query, setQuery] = useState('');
  const [userId, setUserId] = useState('');
  const [results, setResults] = useState([]);
  const [queryTime, setQueryTime] = useState(null);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim() || !userId.trim()) return;
    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const res = await api.get('/memory/search', {
        params: { q: query, user_id: userId, top_k: 20 },
      });
      setResults(res.data.results || []);
      setQueryTime(res.data.query_time_ms);
      setTotalResults(res.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const sourceLabel = (src) => {
    const map = {
      semantic: { class: 'badge-semantic', label: 'Semantic' },
      keyword: { class: 'badge-keyword', label: 'Keyword' },
      graph: { class: 'badge-graph', label: 'Graph' },
    };
    return map[src] || { class: 'badge-type', label: src };
  };

  return (
    <div className="animate-slide-up">
      <h2 style={styles.title}>Search Memories</h2>
      <p style={styles.desc}>Multi-strategy search across semantic, keyword, and graph indexes</p>

      <div style={styles.searchBox}>
        <div style={styles.searchInputs}>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="User ID"
            className="input"
            style={{ maxWidth: 220 }}
          />
          <div style={styles.searchRow}>
            <SearchIcon size={18} style={styles.searchIcon} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="What are you looking for?"
              className="input"
              style={{ paddingLeft: 42, flex: 1 }}
            />
          </div>
          <button onClick={handleSearch} className="btn btn-primary" disabled={loading || !query.trim() || !userId.trim()}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {error && (
        <div style={styles.errorBox}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {queryTime !== null && !error && (
        <div style={styles.meta}>
          <span style={styles.metaItem}>
            <Zap size={14} color="var(--accent)" />
            {totalResults} results
          </span>
          <span style={styles.metaItem}>
            <Clock size={14} color="var(--text-tertiary)" />
            {queryTime}ms
          </span>
        </div>
      )}

      {results.length > 0 && (
        <div style={styles.resultsList}>
          {results.map((result, index) => (
            <div key={result.id} className="card" style={styles.resultCard}>
              <div style={styles.resultHeader}>
                <span style={styles.resultRank}>#{index + 1}</span>
                <span className="badge badge-type">{result.memory_type.replace(/_/g, ' ')}</span>
                <div style={styles.sourceRow}>
                  {(result.sources || []).map((src) => {
                    const info = sourceLabel(src);
                    return (
                      <span key={src} className={`badge ${info.class}`}>
                        {info.label}
                      </span>
                    );
                  })}
                </div>
                <div style={styles.scoreBar}>
                  <div style={{ ...styles.scoreFill, width: `${Math.min(result.score * 200, 100)}%` }} />
                </div>
                <span style={styles.scoreText}>{(result.score * 100).toFixed(1)}</span>
              </div>
              <p style={styles.resultContent}>{result.content}</p>
              <div style={styles.resultFooter}>
                <span style={styles.footerItem}>
                  Confidence: {(result.confidence * 100).toFixed(0)}%
                </span>
                <span style={styles.footerItem}>
                  {new Date(result.created_at).toLocaleDateString()}
                </span>
                {result.valid_until && (
                  <span style={styles.footerItem}>
                    Expires: {new Date(result.valid_until).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {searched && results.length === 0 && !loading && !error && (
        <div className="empty-state" style={{ marginTop: 64 }}>
          <SearchIcon size={48} />
          <h3 style={{ marginTop: 16, color: 'var(--text-secondary)' }}>No results found</h3>
          <p style={{ fontSize: 'var(--text-sm)' }}>Try a different query or check the user ID</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  title: {
    fontSize: 'var(--text-2xl)',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  desc: {
    color: 'var(--text-tertiary)',
    fontSize: 'var(--text-sm)',
    marginTop: '4px',
    marginBottom: '24px',
  },
  searchBox: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px',
  },
  searchInputs: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  searchRow: {
    position: 'relative',
    flex: 1,
    minWidth: 200,
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-tertiary)',
    pointerEvents: 'none',
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
  meta: {
    display: 'flex',
    gap: '20px',
    marginTop: '16px',
    padding: '8px 0',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: 'var(--text-sm)',
    color: 'var(--text-secondary)',
  },
  resultsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '16px',
  },
  resultCard: {
    padding: '20px',
  },
  resultHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px',
    flexWrap: 'wrap',
  },
  resultRank: {
    fontSize: 'var(--text-xs)',
    fontWeight: 700,
    color: 'var(--text-tertiary)',
    minWidth: 24,
  },
  sourceRow: {
    display: 'flex',
    gap: '4px',
  },
  scoreBar: {
    flex: 1,
    height: 4,
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-full)',
    overflow: 'hidden',
    minWidth: 60,
    maxWidth: 120,
  },
  scoreFill: {
    height: '100%',
    background: 'linear-gradient(90deg, var(--accent), var(--accent-light))',
    borderRadius: 'var(--radius-full)',
    transition: 'width 0.5s ease',
  },
  scoreText: {
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    color: 'var(--accent-light)',
    minWidth: 30,
    textAlign: 'right',
  },
  resultContent: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-primary)',
    lineHeight: 1.6,
    marginBottom: '10px',
  },
  resultFooter: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  footerItem: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-tertiary)',
  },
};
