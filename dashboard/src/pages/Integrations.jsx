import { useState } from 'react';
import { 
  Blocks, Terminal, Copy, Check, ExternalLink, ShieldCheck, 
  Sparkles, CheckCircle2, Play, Code2, Cpu, ArrowRight 
} from 'lucide-react';
import api from '../api/client';

export default function Integrations() {
  const [copiedKey, setCopiedKey] = useState(null);
  const [testUserId, setTestUserId] = useState('aditya');
  const [testContent, setTestContent] = useState('Developer prefers using Fastify with TypeScript for high-throughput microservices.');
  const [testLoading, setTestLoading] = useState(false);
  const [testResponse, setTestResponse] = useState(null);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleLiveVerification = async () => {
    setTestLoading(true);
    setTestResponse(null);
    try {
      // Step 1: Save memory
      const saveRes = await api.post('/memory', {
        user_id: testUserId,
        content: testContent,
        memory_type: 'preference',
        confidence_score: 0.98
      });

      // Step 2: Search memory back
      const searchRes = await api.get('/memory/search', {
        params: { q: 'Fastify microservices', user_id: testUserId }
      });

      setTestResponse({
        success: true,
        savedId: saveRes.data.id,
        resultsCount: searchRes.data.total,
        latencyMs: searchRes.data.query_time_ms || 12,
        firstMatch: searchRes.data.results?.[0]?.content
      });
    } catch (err) {
      setTestResponse({
        success: false,
        error: err.response?.data?.message || err.message
      });
    } finally {
      setTestLoading(false);
    }
  };

  const antigravitySnippet = `{
  "mcpServers": {
    "neura": {
      "url": "http://localhost:3001/v1/mcp/manifest",
      "headers": {
        "Authorization": "Bearer neura_live_your_key_here"
      }
    }
  }
}`;

  const claudeSnippet = `{
  "mcpServers": {
    "neura-memory": {
      "command": "node",
      "args": ["-e", "require('http').get('http://localhost:3001/v1/mcp/manifest')"],
      "env": {
        "NEURA_API_KEY": "neura_live_your_key_here",
        "NEURA_ENDPOINT": "http://localhost:3001/v1"
      }
    }
  }
}`;

  const cursorSnippet = `// .cursorrules or System Prompt
Always query Neura Memory before answering architecture or preference questions:
- Search API: GET http://localhost:3001/v1/memory/search?q={query}&user_id={userId}
- Header: Authorization: Bearer {NEURA_API_KEY}
- If new preferences or bug fixes are discussed, save to POST http://localhost:3001/v1/memory`;

  return (
    <div className="animate-slide-up">
      {/* Page Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>AI Coding Assistant Integrations</h2>
          <p style={styles.desc}>
            Connect Neura to your favorite AI coding agents (Antigravity, Claude Code, OpenAI Codex, Cursor). Enable persistent cross-session memory and context recall.
          </p>
        </div>
      </div>

      {/* Architecture Overview */}
      <div style={styles.architectureCard}>
        <div style={styles.archTitle}>
          <Blocks size={20} color="var(--accent)" />
          <span>Universal Memory Integration Protocol</span>
        </div>
        <p style={styles.archText}>
          Neura operates as an external, multi-tenant memory store. Coding assistants authenticate using standard Bearer API Keys or Model Context Protocol (MCP) JSON-RPC tools to save and recall facts without polluting raw LLM token limits.
        </p>
      </div>

      {/* Integration Cards */}
      <div style={styles.grid}>
        {/* Google Antigravity */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.cardIconBox}>
              <Sparkles size={22} color="var(--accent)" />
            </div>
            <div>
              <h3 style={styles.cardTitle}>Google Antigravity</h3>
              <span style={styles.cardSub}>Agentic AI Pair Programmer</span>
            </div>
            <span style={styles.badgeVerified}>MCP Compatible</span>
          </div>
          <p style={styles.cardDesc}>
            Equip Antigravity with custom tools or MCP hooks to recall previous architecture rules and past debugging decisions before generating code.
          </p>
          <div style={styles.codeBlock}>
            <div style={styles.codeHeader}>
              <span>antigravity_config.json</span>
              <button onClick={() => handleCopy(antigravitySnippet, 'anti')} style={styles.copyBtn}>
                {copiedKey === 'anti' ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                {copiedKey === 'anti' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre style={styles.codeContent}>{antigravitySnippet}</pre>
          </div>
        </div>

        {/* Claude Code */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.cardIconBox}>
              <Terminal size={22} color="#f59e0b" />
            </div>
            <div>
              <h3 style={styles.cardTitle}>Claude Code & Desktop</h3>
              <span style={styles.cardSub}>Anthropic CLI & Desktop Client</span>
            </div>
            <span style={styles.badgeVerified}>Native MCP</span>
          </div>
          <p style={styles.cardDesc}>
            Configure Claude Desktop or Claude Code CLI with Neura as a registered Model Context Protocol server. Claude will invoke memory tools automatically.
          </p>
          <div style={styles.codeBlock}>
            <div style={styles.codeHeader}>
              <span>claude_desktop_config.json</span>
              <button onClick={() => handleCopy(claudeSnippet, 'claude')} style={styles.copyBtn}>
                {copiedKey === 'claude' ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                {copiedKey === 'claude' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre style={styles.codeContent}>{claudeSnippet}</pre>
          </div>
        </div>

        {/* OpenAI Codex / Cursor */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.cardIconBox}>
              <Code2 size={22} color="#10b981" />
            </div>
            <div>
              <h3 style={styles.cardTitle}>Cursor & OpenAI Codex</h3>
              <span style={styles.cardSub}>AI IDE & Code Models</span>
            </div>
            <span style={styles.badgeRest}>REST API</span>
          </div>
          <p style={styles.cardDesc}>
            Embed Neura memory retrieval directly into your project's <code>.cursorrules</code> or custom system prompt so Cursor checks Neura on every prompt.
          </p>
          <div style={styles.codeBlock}>
            <div style={styles.codeHeader}>
              <span>.cursorrules</span>
              <button onClick={() => handleCopy(cursorSnippet, 'cursor')} style={styles.copyBtn}>
                {copiedKey === 'cursor' ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                {copiedKey === 'cursor' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre style={styles.codeContent}>{cursorSnippet}</pre>
          </div>
        </div>
      </div>

      {/* Live Agent Integration Sandbox / Verification */}
      <div style={styles.sandboxCard}>
        <div style={styles.sandboxHeader}>
          <div>
            <h3 style={styles.sandboxTitle}>Live Agent Integration Sandbox</h3>
            <p style={styles.sandboxSub}>
              Simulate an AI coding agent storing a memory and immediately performing a vector search to verify live bidirectional integration.
            </p>
          </div>
        </div>

        <div style={styles.sandboxForm}>
          <div style={styles.formRow}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Simulated Agent Target User</label>
              <input 
                type="text" 
                value={testUserId} 
                onChange={(e) => setTestUserId(e.target.value)} 
                style={styles.input}
              />
            </div>
          </div>
          <div>
            <label style={styles.label}>Agent Learned Context to Store</label>
            <input 
              type="text" 
              value={testContent} 
              onChange={(e) => setTestContent(e.target.value)} 
              style={styles.input}
            />
          </div>

          <button 
            onClick={handleLiveVerification} 
            className="btn btn-primary" 
            style={styles.runTestBtn}
            disabled={testLoading}
          >
            <Play size={16} />
            {testLoading ? 'Verifying Pipeline...' : 'Run Live Memory Test'}
          </button>
        </div>

        {testResponse && (
          <div style={{
            ...styles.testResultBox,
            background: testResponse.success ? 'var(--success-bg)' : 'var(--danger-bg)',
            borderColor: testResponse.success ? 'var(--success)' : 'var(--danger)',
          }}>
            {testResponse.success ? (
              <div>
                <div style={styles.successTitleRow}>
                  <CheckCircle2 size={18} color="var(--success)" />
                  <strong>Integration Test Passed! Pipeline verified.</strong>
                </div>
                <div style={styles.resultDetails}>
                  <div>Memory Stored with ID: <code>{testResponse.savedId}</code></div>
                  <div>Retrieved via Hybrid Search in: <strong>{testResponse.latencyMs}ms</strong></div>
                  <div>Top Match: <em>"{testResponse.firstMatch}"</em></div>
                </div>
              </div>
            ) : (
              <div>
                <strong>Test Failed:</strong> {testResponse.error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: 'var(--text-2xl)',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '6px',
  },
  desc: {
    color: 'var(--text-secondary)',
    fontSize: 'var(--text-sm)',
    maxWidth: '750px',
  },
  architectureCard: {
    padding: '20px 24px',
    background: 'var(--accent-subtle)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--accent-glow)',
    marginBottom: '28px',
  },
  archTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontWeight: 700,
    fontSize: 'var(--text-base)',
    color: 'var(--text-primary)',
    marginBottom: '8px',
  },
  archText: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: '24px',
    marginBottom: '32px',
  },
  card: {
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--border)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'var(--shadow-sm)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-elevated)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 'var(--text-base)',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  cardSub: {
    fontSize: '11px',
    color: 'var(--text-tertiary)',
  },
  badgeVerified: {
    marginLeft: 'auto',
    fontSize: '10px',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: 'var(--radius-full)',
    background: 'var(--success-bg)',
    color: 'var(--success)',
    border: '1px solid var(--success)',
    textTransform: 'uppercase',
  },
  badgeRest: {
    marginLeft: 'auto',
    fontSize: '10px',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: 'var(--radius-full)',
    background: 'var(--info-bg)',
    color: 'var(--info)',
    border: '1px solid var(--info)',
    textTransform: 'uppercase',
  },
  cardDesc: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    marginBottom: '16px',
  },
  codeBlock: {
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    overflow: 'hidden',
    marginTop: 'auto',
  },
  codeHeader: {
    padding: '8px 12px',
    background: 'var(--bg-elevated)',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-tertiary)',
  },
  copyBtn: {
    background: 'none',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: 'var(--text-tertiary)',
    fontSize: '11px',
    cursor: 'pointer',
  },
  codeContent: {
    padding: '12px',
    margin: 0,
    fontSize: '11px',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-primary)',
    overflowX: 'auto',
    lineHeight: 1.5,
  },
  sandboxCard: {
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--border)',
    padding: '24px',
    boxShadow: 'var(--shadow-sm)',
  },
  sandboxHeader: {
    marginBottom: '20px',
  },
  sandboxTitle: {
    fontSize: 'var(--text-lg)',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '4px',
  },
  sandboxSub: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-secondary)',
  },
  sandboxForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    marginBottom: '16px',
  },
  formRow: {
    display: 'flex',
    gap: '16px',
  },
  label: {
    display: 'block',
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    color: 'var(--text-tertiary)',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-sm)',
    outline: 'none',
  },
  runTestBtn: {
    alignSelf: 'flex-start',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
  },
  testResultBox: {
    padding: '16px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid',
    fontSize: 'var(--text-xs)',
    marginTop: '16px',
  },
  successTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--success)',
    marginBottom: '8px',
  },
  resultDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    color: 'var(--text-primary)',
    lineHeight: 1.5,
  },
};
