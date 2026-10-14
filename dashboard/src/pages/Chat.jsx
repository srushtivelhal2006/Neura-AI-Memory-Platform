import { useState, useEffect, useRef } from 'react';
import { 
  Send, Sparkles, Plus, Trash2, Copy, Check, BookmarkPlus, 
  Brain, ExternalLink, Bot, AlertCircle, Clock, ChevronRight, 
  MessageSquare, RefreshCw 
} from 'lucide-react';
import api from '../api/client';

const SUGGESTED_PROMPTS = [
  "What architecture did I use in my previous project?",
  "What coding decisions did I make earlier?",
  "What was the error I fixed yesterday?",
  "What UI/styling preferences do I have?"
];

export default function Chat() {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [activeConv, setActiveConv] = useState(null);
  const [inputMessage, setInputMessage] = useState('');
  const [userId, setUserId] = useState('aditya');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [savingMemoryId, setSavingMemoryId] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);
  
  const messagesEndRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    loadConversations();
  }, [userId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConv?.messages, loading]);

  const loadConversations = async () => {
    try {
      const res = await api.get('/chat/conversations', { params: { user_id: userId } });
      const convs = res.data.conversations || [];
      setConversations(convs);
      if (convs.length > 0 && !activeConvId) {
        selectConversation(convs[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const selectConversation = async (id) => {
    setActiveConvId(id);
    try {
      const res = await api.get(`/chat/conversations/${id}`);
      setActiveConv(res.data);
    } catch (err) {
      showToast('Failed to load conversation', 'error');
    }
  };

  const handleNewConversation = async () => {
    try {
      const res = await api.post('/chat/conversations', {
        user_id: userId,
        title: 'New Memory Query',
      });
      setConversations(prev => [res.data, ...prev]);
      setActiveConvId(res.data.id);
      setActiveConv(res.data);
    } catch (err) {
      showToast('Failed to create conversation', 'error');
    }
  };

  const handleDeleteConversation = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this conversation history? (Saved memories in Neura will remain intact)')) return;
    try {
      await api.delete(`/chat/conversations/${id}`);
      const remaining = conversations.filter(c => c.id !== id);
      setConversations(remaining);
      if (activeConvId === id) {
        if (remaining.length > 0) {
          selectConversation(remaining[0].id);
        } else {
          setActiveConvId(null);
          setActiveConv(null);
        }
      }
      showToast('Conversation deleted');
    } catch (err) {
      showToast('Delete failed', 'error');
    }
  };

  const handleSendMessage = async (customPrompt) => {
    const textToSend = customPrompt || inputMessage;
    if (!textToSend.trim() || loading) return;

    setInputMessage('');
    setLoading(true);

    // Optimistically update conversation
    const tempUserMsg = {
      id: 'temp_' + Date.now(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString()
    };

    setActiveConv(prev => {
      const currentMessages = prev?.messages || [];
      return {
        ...prev,
        messages: [...currentMessages, tempUserMsg]
      };
    });

    try {
      const res = await api.post('/chat/message', {
        conversation_id: activeConvId,
        user_id: userId,
        message: textToSend,
      });

      const { conversation_id, message } = res.data;
      if (!activeConvId) {
        setActiveConvId(conversation_id);
      }

      setActiveConv(prev => ({
        ...prev,
        id: conversation_id,
        messages: [...(prev?.messages?.filter(m => m.id !== tempUserMsg.id) || []), tempUserMsg, message]
      }));

      // Refresh conversations list to update title
      loadConversations();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send message', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveToMemory = async (content, msgId) => {
    setSavingMemoryId(msgId);
    try {
      await api.post('/memory', {
        user_id: userId,
        content: content,
        memory_type: 'explicit_fact',
        confidence_score: 0.95
      });
      showToast('Context permanently saved to Neura Memory Library!');
    } catch (err) {
      showToast('Failed to save memory', 'error');
    } finally {
      setSavingMemoryId(null);
    }
  };

  return (
    <div style={styles.container} className="animate-slide-up">
      {/* Toast Alert */}
      {toast && (
        <div style={{
          ...styles.toast,
          background: toast.type === 'error' ? 'var(--danger-bg)' : 'var(--success-bg)',
          borderColor: toast.type === 'error' ? 'var(--danger)' : 'var(--success)',
          color: toast.type === 'error' ? 'var(--danger)' : 'var(--success)',
        }}>
          {toast.message}
        </div>
      )}

      {/* Left Chat Sidebar (Conversations History) */}
      <aside style={styles.sidebarPanel}>
        <div style={styles.sidebarHeader}>
          <button onClick={handleNewConversation} className="btn btn-primary" style={styles.newChatBtn}>
            <Plus size={16} />
            New Memory Chat
          </button>
        </div>

        <div style={styles.userSelectorRow}>
          <span style={styles.userSelectorLabel}>Target User:</span>
          <input 
            type="text" 
            value={userId} 
            onChange={(e) => setUserId(e.target.value)} 
            style={styles.userSelectInput}
            title="User ID whose memory bank is retrieved"
          />
        </div>

        <div style={styles.convList}>
          <div style={styles.convSectionTitle}>Recent Conversations</div>
          {conversations.length === 0 ? (
            <div style={styles.emptyConvs}>No past chats found</div>
          ) : (
            conversations.map((c) => {
              const isActive = c.id === activeConvId;
              return (
                <div
                  key={c.id}
                  onClick={() => selectConversation(c.id)}
                  style={{
                    ...styles.convItem,
                    background: isActive ? 'var(--bg-elevated)' : 'transparent',
                    borderColor: isActive ? 'var(--accent)' : 'transparent',
                  }}
                >
                  <MessageSquare size={16} color={isActive ? 'var(--accent)' : 'var(--text-tertiary)'} />
                  <span style={styles.convTitle} title={c.title}>{c.title}</span>
                  <button 
                    onClick={(e) => handleDeleteConversation(e, c.id)} 
                    style={styles.deleteConvBtn}
                    title="Delete Chat"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Conversation Area */}
      <main style={styles.chatArea}>
        {/* Chat Top Bar */}
        <div style={styles.chatHeader}>
          <div>
            <h3 style={styles.chatTitle}>
              {activeConv?.title || 'Memory Context Chat'}
            </h3>
            <div style={styles.metaRow}>
              <span style={styles.contextBadge}>
                <Brain size={13} color="var(--accent)" />
                Connected to Neura Memory Bank (User: <strong>{userId}</strong>)
              </span>
              <span style={styles.providerBadge}>
                <Sparkles size={12} color="#f59e0b" />
                Default: Claude 3.7 Sonnet / Context Engine
              </span>
            </div>
          </div>
        </div>

        {/* Message Stream */}
        <div style={styles.messageStream}>
          {(!activeConv?.messages || activeConv.messages.length === 0) ? (
            <div style={styles.welcomeBox}>
              <div style={styles.welcomeIcon}>
                <Sparkles size={36} color="var(--accent)" />
              </div>
              <h2 style={styles.welcomeHeading}>Ask Neura About Your Saved Context</h2>
              <p style={styles.welcomeDesc}>
                Neura searches your personal vector and graph memories to answer questions about past coding decisions, preferences, architectures, and errors.
              </p>

              <div style={styles.suggestedGrid}>
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    style={styles.suggestedCard}
                  >
                    <span>{prompt}</span>
                    <ChevronRight size={14} color="var(--accent)" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={styles.messagesList}>
              {activeConv.messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    style={{
                      ...styles.messageRow,
                      justifyContent: isUser ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div style={{
                      ...styles.messageBubble,
                      background: isUser ? 'var(--accent)' : 'var(--bg-card)',
                      color: isUser ? '#ffffff' : 'var(--text-primary)',
                      border: isUser ? 'none' : '1px solid var(--border)',
                    }}>
                      <div style={styles.msgHeader}>
                        <span style={styles.msgSender}>
                          {isUser ? 'You' : 'Neura Memory Assistant'}
                        </span>
                        <span style={styles.msgTime}>
                          {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>

                      <div style={styles.msgContent}>
                        {msg.content.split('\n').map((line, i) => (
                          <p key={i} style={{ marginBottom: line ? '6px' : '0' }}>{line}</p>
                        ))}
                      </div>

                      {/* Source Memories Citation Pills */}
                      {!isUser && msg.sources && msg.sources.length > 0 && (
                        <div style={styles.sourcesBox}>
                          <div style={styles.sourcesTitle}>
                            <Brain size={13} color="var(--accent)" />
                            <span>Retrieved Sources from Neura:</span>
                          </div>
                          <div style={styles.sourcesList}>
                            {msg.sources.map((src, sIdx) => (
                              <button
                                key={sIdx}
                                onClick={() => setSelectedSource(src)}
                                style={styles.sourcePill}
                                title="Inspect source memory details"
                              >
                                <span style={styles.sourceTag}>[{src.memory_type}]</span>
                                <span style={styles.sourceText}>{src.content.slice(0, 55)}...</span>
                                <span style={styles.simScore}>({Math.round(src.similarity * 100)}% match)</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Assistant Actions Row */}
                      {!isUser && (
                        <div style={styles.msgActions}>
                          <button 
                            onClick={() => handleCopy(msg.content, msg.id)}
                            style={styles.msgActionBtn}
                            title="Copy response"
                          >
                            {copiedId === msg.id ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                            {copiedId === msg.id ? 'Copied' : 'Copy'}
                          </button>

                          <button
                            onClick={() => handleSaveToMemory(msg.content, msg.id)}
                            style={styles.msgActionBtn}
                            title="Permanently save this conversation point into Memory Library"
                            disabled={savingMemoryId === msg.id}
                          >
                            <BookmarkPlus size={14} color="var(--accent)" />
                            {savingMemoryId === msg.id ? 'Saving...' : 'Save as Memory'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div style={{ ...styles.messageRow, justifyContent: 'flex-start' }}>
                  <div style={{ ...styles.messageBubble, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div style={styles.typingIndicator}>
                      <RefreshCw size={16} className="animate-spin" color="var(--accent)" />
                      <span>Retrieving memories and synthesizing answer...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div style={styles.inputContainer}>
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} 
            style={styles.inputForm}
          >
            <input
              type="text"
              placeholder="Ask Neura about past projects, code decisions, errors..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              style={styles.textInput}
              disabled={loading}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={styles.sendBtn}
              disabled={loading || !inputMessage.trim()}
            >
              <Send size={16} />
            </button>
          </form>
          <div style={styles.inputFootnote}>
            Neura searches stored semantic vectors, keyword indices, and knowledge graphs before answering.
          </div>
        </div>
      </main>

      {/* Source Memory Detail Modal */}
      {selectedSource && (
        <div style={styles.modalOverlay} onClick={() => setSelectedSource(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalHeaderTitleRow}>
                <Brain size={20} color="var(--accent)" />
                <h3 style={styles.modalTitle}>Source Memory Inspection</h3>
              </div>
              <button onClick={() => setSelectedSource(null)} style={styles.closeBtn}>&times;</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.modalField}>
                <span style={styles.modalFieldLabel}>Memory ID:</span>
                <code>{selectedSource.id}</code>
              </div>
              <div style={styles.modalField}>
                <span style={styles.modalFieldLabel}>Memory Type:</span>
                <span className="badge badge-type">{selectedSource.memory_type}</span>
              </div>
              <div style={styles.modalField}>
                <span style={styles.modalFieldLabel}>Relevance Score:</span>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                  {Math.round(selectedSource.similarity * 100)}% Match ({selectedSource.source || 'semantic'})
                </span>
              </div>
              <div style={styles.modalContentBox}>
                <div style={styles.modalFieldLabel}>Memory Content:</div>
                <p style={styles.modalContentText}>{selectedSource.content}</p>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setSelectedSource(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    height: 'calc(100vh - 40px)',
    background: 'var(--bg-primary)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--border)',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-md)',
  },
  sidebarPanel: {
    width: '300px',
    background: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  sidebarHeader: {
    padding: '16px',
    borderBottom: '1px solid var(--border)',
  },
  newChatBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: 'var(--text-sm)',
    padding: '10px 16px',
  },
  userSelectorRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    background: 'var(--bg-input)',
    borderBottom: '1px solid var(--border)',
    gap: '8px',
    fontSize: 'var(--text-xs)',
  },
  userSelectorLabel: {
    color: 'var(--text-tertiary)',
    fontWeight: 500,
  },
  userSelectInput: {
    flex: 1,
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    padding: '3px 8px',
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
  },
  convList: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  convSectionTitle: {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: 'var(--text-tertiary)',
    padding: '6px 8px',
    letterSpacing: '0.05em',
  },
  emptyConvs: {
    color: 'var(--text-tertiary)',
    fontSize: 'var(--text-xs)',
    padding: '16px 8px',
    textAlign: 'center',
  },
  convItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    border: '1px solid transparent',
    transition: 'all 0.15s ease',
  },
  convTitle: {
    flex: 1,
    fontSize: 'var(--text-xs)',
    fontWeight: 500,
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  deleteConvBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
    opacity: 0.6,
    padding: '4px',
  },
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    background: 'var(--bg-primary)',
  },
  chatHeader: {
    padding: '16px 24px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-secondary)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatTitle: {
    fontSize: 'var(--text-base)',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '4px',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  contextBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: 'var(--text-secondary)',
  },
  providerBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '11px',
    color: 'var(--text-tertiary)',
  },
  messageStream: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
  },
  welcomeBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
    maxWidth: '620px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  welcomeIcon: {
    width: 64,
    height: 64,
    borderRadius: 'var(--radius-xl)',
    background: 'var(--accent-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  welcomeHeading: {
    fontSize: 'var(--text-2xl)',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '10px',
  },
  welcomeDesc: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    marginBottom: '32px',
  },
  suggestedGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    width: '100%',
  },
  suggestedCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    padding: '14px 16px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-xs)',
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease',
  },
  messagesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  messageRow: {
    display: 'flex',
    width: '100%',
  },
  messageBubble: {
    maxWidth: '780px',
    borderRadius: 'var(--radius-lg)',
    padding: '16px 20px',
    boxShadow: 'var(--shadow-sm)',
  },
  msgHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    gap: '12px',
  },
  msgSender: {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    opacity: 0.8,
  },
  msgTime: {
    fontSize: '10px',
    opacity: 0.6,
  },
  msgContent: {
    fontSize: 'var(--text-sm)',
    lineHeight: 1.6,
  },
  sourcesBox: {
    marginTop: '14px',
    paddingTop: '12px',
    borderTop: '1px solid var(--border)',
  },
  sourcesTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-tertiary)',
    marginBottom: '8px',
  },
  sourcesList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  sourcePill: {
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-full)',
    padding: '4px 10px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    fontSize: '11px',
    color: 'var(--text-secondary)',
    transition: 'all 0.15s ease',
  },
  sourceTag: {
    fontWeight: 700,
    color: 'var(--accent)',
  },
  sourceText: {
    maxWidth: '240px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  simScore: {
    color: 'var(--success)',
    fontWeight: 600,
  },
  msgActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '12px',
    paddingTop: '8px',
    borderTop: '1px solid var(--border)',
  },
  msgActionBtn: {
    background: 'none',
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    color: 'var(--text-tertiary)',
    fontSize: '11px',
    cursor: 'pointer',
    fontWeight: 500,
  },
  typingIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: 'var(--text-xs)',
    color: 'var(--text-secondary)',
  },
  inputContainer: {
    padding: '16px 24px',
    background: 'var(--bg-secondary)',
    borderTop: '1px solid var(--border)',
  },
  inputForm: {
    display: 'flex',
    gap: '12px',
  },
  textInput: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-sm)',
    outline: 'none',
  },
  sendBtn: {
    padding: '0 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputFootnote: {
    fontSize: '11px',
    color: 'var(--text-tertiary)',
    marginTop: '8px',
    textAlign: 'center',
  },
  toast: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    padding: '10px 16px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid',
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    zIndex: 1000,
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modalContent: {
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--border)',
    width: '100%',
    maxWidth: '540px',
    boxShadow: 'var(--shadow-lg)',
  },
  modalHeader: {
    padding: '18px 20px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeaderTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  modalTitle: {
    fontSize: 'var(--text-base)',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '22px',
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
  },
  modalBody: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  modalField: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 'var(--text-xs)',
  },
  modalFieldLabel: {
    color: 'var(--text-tertiary)',
    fontWeight: 500,
  },
  modalContentBox: {
    marginTop: '6px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  modalContentText: {
    padding: '12px 14px',
    background: 'var(--bg-input)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    fontSize: 'var(--text-xs)',
    lineHeight: 1.6,
    color: 'var(--text-primary)',
  },
  modalFooter: {
    padding: '14px 20px',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    justifyContent: 'flex-end',
    background: 'var(--bg-secondary)',
  },
};
