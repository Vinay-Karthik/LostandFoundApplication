import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { messageApi } from '../api/messageApi';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { 
  Send, Search, ShieldOff, MessageSquare, ShieldCheck, 
  ArrowLeft, X, CheckCheck, User as UserIcon, AlertCircle 
} from 'lucide-react';
import { format } from 'date-fns';

const formatMessageTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    return isToday ? format(d, 'h:mm a') : format(d, 'MMM d, h:mm a');
  } catch {
    return '';
  }
};

const formatPartnerTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    return isToday ? format(d, 'h:mm a') : format(d, 'MMM d');
  } catch {
    return '';
  }
};

export const MessagesPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { incomingMessage } = useWebSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [partners, setPartners] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  
  // Parse userId query parameter (represents recipient / conversation partner)
  const rawParamUserId = searchParams.get('userId');
  const queryPartnerId = useMemo(() => {
    if (!rawParamUserId) return null;
    const parsed = parseInt(rawParamUserId, 10);
    if (isNaN(parsed)) return null;
    // Prevent confusing current user with conversation partner (cannot message oneself)
    if (user?.id && Number(parsed) === Number(user.id)) return null;
    return parsed;
  }, [rawParamUserId, user?.id]);

  const [selectedPartnerId, setSelectedPartnerId] = useState(queryPartnerId);
  const [conversation, setConversation] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);
  const chatScrollContainerRef = useRef(null);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Keep state in sync with URL searchParams (e.g. Back/Forward button, direct links)
  useEffect(() => {
    if (queryPartnerId !== selectedPartnerId) {
      setSelectedPartnerId(queryPartnerId);
    }
  }, [queryPartnerId]);

  // Sync selectedPartnerId back to URL search params
  const handleSelectPartner = (partnerId) => {
    setSelectedPartnerId(partnerId);
    const params = new URLSearchParams(searchParams);
    if (partnerId) {
      params.set('userId', partnerId.toString());
    } else {
      params.delete('userId');
    }
    setSearchParams(params);
  };

  // Load chat partners list for the logged-in user
  const loadPartners = async () => {
    try {
      setLoadingPartners(true);
      const res = await messageApi.getPartners();
      if (res && res.success && Array.isArray(res.data)) {
        setPartners(res.data);
      }
    } catch (err) {
      console.error('Failed to load chat partners:', err);
    } finally {
      setLoadingPartners(false);
    }
  };

  // Load message conversation for a specific partner
  const loadConversation = async (partnerId) => {
    if (!partnerId) {
      setConversation([]);
      return;
    }
    try {
      setLoadingChat(true);
      setError('');
      const res = await messageApi.getConversation(partnerId);
      if (res && res.success && Array.isArray(res.data)) {
        // Sort chronologically ascending
        const sorted = [...res.data].sort((a, b) => {
          const tA = new Date(a.timestamp).getTime();
          const tB = new Date(b.timestamp).getTime();
          return tA - tB;
        });
        setConversation(sorted);

        // If this partner is not yet in the partners list, derive their contact info from conversation messages
        setPartners((prev) => {
          const exists = prev.some((p) => Number(p.userId) === Number(partnerId));
          if (!exists && sorted.length > 0) {
            const partnerMsg = sorted.find(
              (m) => Number(m.senderId) === Number(partnerId) || Number(m.receiverId) === Number(partnerId)
            );
            if (partnerMsg) {
              const partnerName = Number(partnerMsg.senderId) === Number(partnerId)
                ? partnerMsg.senderName
                : partnerMsg.receiverName;
              const lastMsg = sorted[sorted.length - 1];
              return [
                {
                  userId: partnerId,
                  userName: partnerName || `Student #${partnerId}`,
                  role: 'STUDENT',
                  lastMessage: lastMsg.content,
                  lastMessageTime: lastMsg.timestamp,
                  unreadCount: 0,
                },
                ...prev,
              ];
            }
          }
          return prev;
        });

        setTimeout(() => scrollToBottom('auto'), 60);
        window.dispatchEvent(new CustomEvent('messages-read', { detail: { partnerId } }));
      }
    } catch (err) {
      console.error('Failed to load conversation:', err);
      setError('Could not load message history.');
    } finally {
      setLoadingChat(false);
    }
  };

  // Auth protection & initial fetch
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadPartners();
  }, [isAuthenticated, navigate]);

  // Load conversation when selected partner changes
  useEffect(() => {
    if (selectedPartnerId) {
      loadConversation(selectedPartnerId);
    } else {
      setConversation([]);
    }
  }, [selectedPartnerId]);

  // Real-time WebSocket updates
  useEffect(() => {
    if (incomingMessage) {
      const msgSender = Number(incomingMessage.senderId);
      const msgReceiver = Number(incomingMessage.receiverId);
      const currentSelected = Number(selectedPartnerId);

      if (msgSender === currentSelected || msgReceiver === currentSelected) {
        setConversation((prev) => {
          if (prev.some((m) => m.id === incomingMessage.id)) return prev;
          return [...prev, incomingMessage];
        });
        setTimeout(() => scrollToBottom('smooth'), 50);
      }
      loadPartners();
    }
  }, [incomingMessage, selectedPartnerId]);

  // Send message handler
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!messageText.trim() || !selectedPartnerId || sending) return;

    setSending(true);
    setError('');
    const content = messageText.trim();

    try {
      const res = await messageApi.sendMessage({
        receiverId: selectedPartnerId,
        content,
      });

      if (res && res.success && res.data) {
        const sentMsg = res.data;
        setConversation((prev) => {
          if (prev.some((m) => m.id === sentMsg.id)) return prev;
          return [...prev, sentMsg];
        });
        setMessageText('');
        loadPartners();
        setTimeout(() => scrollToBottom('smooth'), 50);
      }
    } catch (err) {
      setError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Active partner identification
  const activePartner = useMemo(() => {
    if (!selectedPartnerId) return null;
    const found = partners.find((p) => Number(p.userId) === Number(selectedPartnerId));
    if (found) return found;

    // Fallback: derive name from message conversation history
    const foundMsg = conversation.find(
      (m) => Number(m.senderId) === Number(selectedPartnerId) || Number(m.receiverId) === Number(selectedPartnerId)
    );
    if (foundMsg) {
      const name = Number(foundMsg.senderId) === Number(selectedPartnerId)
        ? foundMsg.senderName
        : foundMsg.receiverName;
      return {
        userId: selectedPartnerId,
        userName: name || `Contact #${selectedPartnerId}`,
        role: 'STUDENT',
      };
    }

    // Fallback from router state if passed
    if (location.state?.partnerName) {
      return {
        userId: selectedPartnerId,
        userName: location.state.partnerName,
        role: 'STUDENT',
      };
    }

    return {
      userId: selectedPartnerId,
      userName: `Contact #${selectedPartnerId}`,
      role: 'STUDENT',
    };
  }, [partners, selectedPartnerId, conversation, location.state]);

  // Filter partners by search keyword
  const filteredPartners = useMemo(() => {
    if (!searchFilter.trim()) return partners;
    const q = searchFilter.toLowerCase();
    return partners.filter((p) => 
      (p.userName || '').toLowerCase().includes(q) ||
      (p.lastMessage || '').toLowerCase().includes(q)
    );
  }, [partners, searchFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      {/* Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Messages
          </h1>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
            Coordinate item details and arrange secure campus handovers.
          </p>
        </div>
      </div>

      {/* Main Two-Column Messages Card */}
      <div className={`messages-layout-card ${selectedPartnerId ? 'has-active-chat' : ''}`}>
        
        {/* Left Column: Conversations List */}
        <div 
          className="conversations-list-pane"
          style={{
            borderRight: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--bg-surface)',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          {/* Search Bar */}
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'var(--bg-elevated)',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}>
              <Search size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
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
              {searchFilter && (
                <button
                  type="button"
                  onClick={() => setSearchFilter('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-muted)' }}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Conversation List Stream */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {loadingPartners ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                Loading conversations...
              </div>
            ) : filteredPartners.length === 0 ? (
              searchFilter ? (
                <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Search size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    No conversations found
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    No messages matched "{searchFilter}"
                  </div>
                  <button 
                    onClick={() => setSearchFilter('')} 
                    className="btn btn-ghost btn-sm"
                    style={{ marginTop: '0.75rem', fontSize: '0.75rem' }}
                  >
                    Clear Filter
                  </button>
                </div>
              ) : (
                <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-elevated)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.75rem',
                    color: 'var(--accent-blue)',
                  }}>
                    <MessageSquare size={24} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    No conversations yet
                  </div>
                  <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.45 }}>
                    When you contact item owners or respond to inquiries, your conversations will appear here.
                  </div>
                  <Link to="/items" className="btn btn-secondary btn-sm" style={{ marginTop: '1rem', display: 'inline-flex' }}>
                    Browse Directory
                  </Link>
                </div>
              )
            ) : (
              filteredPartners.map((p) => {
                const isSelected = Number(p.userId) === Number(selectedPartnerId);
                const partnerInitial = p.userName ? p.userName.charAt(0).toUpperCase() : 'U';

                return (
                  <button
                    key={p.userId}
                    onClick={() => handleSelectPartner(p.userId)}
                    className={`chat-partner-btn ${isSelected ? 'active' : ''}`}
                  >
                    {/* Avatar Initials Circle */}
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: isSelected ? 'var(--accent-blue)' : 'var(--bg-elevated)',
                      color: isSelected ? '#FFFFFF' : 'var(--accent-blue)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      flexShrink: 0,
                      boxShadow: isSelected ? '0 2px 6px rgba(37, 99, 235, 0.25)' : 'none',
                    }}>
                      {partnerInitial}
                    </div>

                    {/* Partner Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.35rem' }}>
                        <span style={{ 
                          fontWeight: 700, 
                          fontSize: '0.875rem', 
                          color: isSelected ? 'var(--accent-blue)' : 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {p.userName}
                        </span>
                        {p.lastMessageTime && (
                          <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                            {formatPartnerTime(p.lastMessageTime)}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.15rem' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          flex: 1,
                        }}>
                          {p.lastMessage || 'Click to view conversation'}
                        </span>

                        {p.unreadCount > 0 && (
                          <span style={{
                            marginLeft: '0.5rem',
                            backgroundColor: 'var(--accent-coral)',
                            color: '#FFFFFF',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '0.1rem 0.4rem',
                            borderRadius: 'var(--radius-full)',
                            flexShrink: 0,
                          }}>
                            {p.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Conversation Stream */}
        <div 
          className="chat-conversation-pane"
          style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
        >
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
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {/* Back button for mobile navigation */}
                  <button
                    type="button"
                    onClick={() => handleSelectPartner(null)}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '0.35rem 0.5rem', color: 'var(--text-secondary)' }}
                    title="Back to conversation list"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  {/* Partner Avatar */}
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--accent-blue)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    boxShadow: 'var(--shadow-sm)',
                    flexShrink: 0,
                  }}>
                    {activePartner?.userName ? activePartner.userName.charAt(0).toUpperCase() : 'U'}
                  </div>

                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-primary)' }}>
                      {activePartner?.userName || `Contact #${selectedPartnerId}`}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#16A34A' }} />
                      Verified Campus Student
                    </div>
                  </div>
                </div>

                {/* Safety / Block Action */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    onClick={() => {
                      if (window.confirm(`Block this user? You will no longer receive messages from them.`)) {
                        messageApi.blockUser(selectedPartnerId).then(() => {
                          handleSelectPartner(null);
                          loadPartners();
                        }).catch((err) => alert(err.message || 'Failed to block user'));
                      }
                    }}
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--status-lost-text)', fontSize: '0.75rem', gap: '0.3rem' }}
                    title="Block user for safety"
                  >
                    <ShieldOff size={14} /> Block
                  </button>
                </div>
              </div>

              {/* Error Toast if send or load fails */}
              {error && (
                <div style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'var(--status-lost-bg)',
                  color: 'var(--status-lost-text)',
                  borderBottom: '1px solid var(--status-lost-border)',
                  fontSize: '0.785rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <AlertCircle size={15} />
                  <span>{error}</span>
                  <button 
                    onClick={() => setError('')} 
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              {/* Messages Body */}
              <div 
                ref={chatScrollContainerRef}
                className="chat-thread-bg"
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                }}
              >
                {loadingChat ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', margin: 'auto' }}>
                    Loading message history...
                  </div>
                ) : conversation.length === 0 ? (
                  <div style={{
                    margin: 'auto',
                    textAlign: 'center',
                    maxWidth: 360,
                    padding: '2rem 1rem',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-sm)',
                  }}>
                    <MessageSquare size={32} color="var(--accent-blue)" style={{ margin: '0 auto 0.75rem', opacity: 0.8 }} />
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      Start your conversation
                    </div>
                    <p style={{ fontSize: '0.785rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.45 }}>
                      Say hello or ask details about the item with {activePartner?.userName || 'this student'}.
                    </p>
                  </div>
                ) : (
                  conversation.map((msg, idx) => {
                    // Check message ownership using mine, isMine, or senderId match
                    const isMine = Boolean(
                      msg.mine || 
                      msg.isMine || 
                      (user?.id && Number(msg.senderId) === Number(user.id))
                    );

                    return (
                      <div
                        key={msg.id || idx}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isMine ? 'flex-end' : 'flex-start',
                          maxWidth: '72%',
                          alignSelf: isMine ? 'flex-end' : 'flex-start',
                        }}
                      >
                        {/* Bubble */}
                        <div
                          style={{
                            padding: '0.75rem 1.05rem',
                            borderRadius: isMine ? '16px 16px 3px 16px' : '16px 16px 16px 3px',
                            backgroundColor: isMine ? 'var(--chat-bubble-out-bg)' : 'var(--chat-bubble-in-bg)',
                            color: isMine ? 'var(--chat-bubble-out-text)' : 'var(--chat-bubble-in-text)',
                            fontSize: '0.875rem',
                            lineHeight: 1.45,
                            boxShadow: 'var(--shadow-sm)',
                            border: isMine ? 'none' : '1px solid var(--chat-bubble-in-border)',
                            wordBreak: 'break-word',
                          }}
                        >
                          {msg.content}
                        </div>

                        {/* Timestamp & Read Receipt */}
                        <div style={{
                          fontSize: '0.675rem',
                          color: 'var(--text-muted)',
                          marginTop: '0.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: isMine ? '0 0.25rem 0 0' : '0 0 0 0.25rem',
                        }}>
                          <span>{formatMessageTime(msg.timestamp) || 'Just now'}</span>
                          {isMine && (
                            <CheckCheck size={12} color={msg.read || msg.isRead ? 'var(--accent-blue)' : 'var(--text-muted)'} />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Fixed Bottom Input Bar */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  padding: '0.85rem 1.25rem',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  gap: '0.65rem',
                  backgroundColor: 'var(--bg-surface)',
                  flexShrink: 0,
                  alignItems: 'center',
                }}
              >
                <input
                  type="text"
                  placeholder={`Message ${activePartner?.userName || 'contact'}...`}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                  className="form-input"
                  style={{
                    flex: 1,
                    padding: '0.7rem 1.15rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.875rem',
                  }}
                />
                <button
                  type="submit"
                  disabled={sending || !messageText.trim()}
                  className="btn btn-primary"
                  style={{
                    borderRadius: 'var(--radius-full)',
                    width: 42,
                    height: 42,
                    padding: 0,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: sending || !messageText.trim() ? 0.6 : 1,
                    cursor: sending || !messageText.trim() ? 'not-allowed' : 'pointer',
                  }}
                  title="Send message (Enter)"
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            /* Empty State when no conversation is selected (Desktop) */
            <div 
              className="chat-thread-bg"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                padding: '2.5rem',
                textAlign: 'center',
              }}
            >
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-blue)',
                marginBottom: '1rem',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <MessageSquare size={30} />
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                Your Messages & Inquiries
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: 390, lineHeight: 1.5, marginBottom: '1.5rem' }}>
                Select a conversation from the left to coordinate item details, verification questions, and return locations safely.
              </p>

              <div style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1.15rem',
                maxWidth: 420,
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                textAlign: 'left',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <ShieldCheck size={22} color="var(--accent-blue)" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Campus Safety Tip:</strong> Always arrange handovers in public daytime campus locations like student unions, library service desks, or campus security stations.
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
