import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { messageApi } from '../api/messageApi';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { Send, Search, ShieldOff, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

export const MessagesPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { incomingMessage } = useWebSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [partners, setPartners] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState(
    searchParams.get('userId') ? parseInt(searchParams.get('userId'), 10) : null
  );
  const [conversation, setConversation] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadPartners = () => {
    messageApi.getPartners().then((res) => {
      if (res.success && res.data) {
        setPartners(res.data);
      }
    }).catch(console.error).finally(() => setLoading(false));
  };

  const loadConversation = (partnerId) => {
    if (!partnerId) return;
    messageApi.getConversation(partnerId).then((res) => {
      if (res.success && res.data) {
        setConversation(res.data);
        setTimeout(scrollToBottom, 100);
        window.dispatchEvent(new CustomEvent('messages-read', { detail: { partnerId } }));
      }
    }).catch(console.error);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadPartners();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (selectedPartnerId) {
      loadConversation(selectedPartnerId);
      const params = new URLSearchParams(searchParams);
      params.set('userId', selectedPartnerId.toString());
      setSearchParams(params);
    }
  }, [selectedPartnerId]);

  useEffect(() => {
    if (incomingMessage) {
      if (
        incomingMessage.senderId === selectedPartnerId ||
        incomingMessage.receiverId === selectedPartnerId
      ) {
        setConversation((prev) => {
          if (prev.some((m) => m.id === incomingMessage.id)) {
            return prev;
          }
          return [...prev, incomingMessage];
        });
        setTimeout(scrollToBottom, 100);
      }
      loadPartners();
    }
  }, [incomingMessage, selectedPartnerId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedPartnerId) return;

    setSending(true);
    setError('');

    try {
      const res = await messageApi.sendMessage({
        receiverId: selectedPartnerId,
        content: messageText.trim(),
      });

      if (res.success && res.data) {
        setConversation((prev) => {
          if (prev.some((m) => m.id === res.data.id)) {
            return prev;
          }
          return [...prev, res.data];
        });
        setMessageText('');
        loadPartners();
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const activePartner = partners.find((p) => p.userId === selectedPartnerId);

  const filteredPartners = partners.filter((p) =>
    (p.userName || '').toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: 'calc(100vh - 140px)' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>Messages</h1>
      </div>

      <div className="surface-card" style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        flex: 1,
        overflow: 'hidden',
        minHeight: 480,
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}>
        {/* Left: Chat Partners List (Screen 7) */}
        <div style={{
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-surface)',
        }}>
          {/* Search conversation */}
          <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'var(--bg-elevated)',
              padding: '0.45rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}>
              <Search size={16} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.8125rem',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {filteredPartners.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                No conversations yet
              </div>
            ) : (
              filteredPartners.map((p) => {
                const isSelected = p.userId === selectedPartnerId;
                return (
                  <button
                    key={p.userId}
                    onClick={() => setSelectedPartnerId(p.userId)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.85rem 1rem',
                      backgroundColor: isSelected ? 'var(--accent-blue-subtle)' : 'transparent',
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: 'inherit',
                      transition: 'background-color var(--transition)',
                    }}
                  >
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: isSelected ? 'var(--accent-blue)' : 'var(--bg-elevated)',
                      color: isSelected ? '#FFFFFF' : 'var(--accent-blue)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      flexShrink: 0,
                    }}>
                      {p.userName ? p.userName.charAt(0).toUpperCase() : 'U'}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          {p.userName}
                        </span>
                        {p.unreadCount > 0 && (
                          <span style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: 'var(--accent-coral)',
                          }} />
                        )}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginTop: '0.1rem',
                      }}>
                        {p.lastMessage || 'Start messaging...'}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Message Stream with Minimal Background Pattern */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {selectedPartnerId ? (
            <>
              {/* Header */}
              <div style={{
                padding: '0.85rem 1.25rem',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--bg-surface)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{
                    width: 34,
                    height: 34,
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--accent-blue)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                  }}>
                    {activePartner?.userName ? activePartner.userName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {activePartner?.userName || `Member #${selectedPartnerId}`}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#16A34A', fontWeight: 600 }}>
                      ● Online / Verified Student
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      if (window.confirm('Block this user?')) {
                        messageApi.blockUser(selectedPartnerId).then(() => {
                          setSelectedPartnerId(null);
                          loadPartners();
                        });
                      }
                    }}
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--status-lost-text)', fontSize: '0.75rem' }}
                  >
                    <ShieldOff size={13} /> Block
                  </button>
                </div>
              </div>

              {/* Messages Body with Minimal Background Texture */}
              <div 
                className="chat-thread-bg"
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                {conversation.map((msg, idx) => {
                  const isMine = msg.senderId === user?.id || msg.isMine;
                  return (
                    <div
                      key={msg.id || idx}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMine ? 'flex-end' : 'flex-start',
                        maxWidth: '65%',
                        alignSelf: isMine ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          padding: '0.7rem 1rem',
                          borderRadius: isMine ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                          backgroundColor: isMine ? 'var(--chat-bubble-out-bg)' : 'var(--chat-bubble-in-bg)',
                          color: isMine ? 'var(--chat-bubble-out-text)' : 'var(--chat-bubble-in-text)',
                          fontSize: '0.875rem',
                          lineHeight: 1.45,
                          boxShadow: 'var(--shadow-sm)',
                          border: isMine ? 'none' : '1px solid var(--chat-bubble-in-border)',
                        }}
                      >
                        {msg.content}
                      </div>
                      <div style={{
                        fontSize: '0.675rem',
                        color: 'var(--text-muted)',
                        marginTop: '0.2rem',
                      }}>
                        {msg.timestamp ? format(new Date(msg.timestamp), 'h:mm a') : 'Now'}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  padding: '0.85rem 1.25rem',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  gap: '0.5rem',
                  backgroundColor: 'var(--bg-surface)',
                }}
              >
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="form-input"
                  style={{ flex: 1, padding: '0.65rem 1rem', borderRadius: 'var(--radius-full)' }}
                />
                <button
                  type="submit"
                  disabled={sending || !messageText.trim()}
                  className="btn btn-primary"
                  style={{ borderRadius: 'var(--radius-full)', width: 42, height: 42, padding: 0 }}
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div 
              className="chat-thread-bg"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                color: 'var(--text-muted)',
                fontSize: '0.875rem',
              }}
            >
              <MessageSquare size={36} color="var(--text-muted)" style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
              <div>Select a conversation to start chatting.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
