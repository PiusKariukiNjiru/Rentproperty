import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Message, User, Conversation, MessageAttachment } from '../types';
import { API_BASE_URL, AUTH_TOKEN_KEY } from '../constants';
import { useSocket } from '../contexts/SocketContext';
import LoadingSpinner from './LoadingSpinner';
import { PaperAirplaneIcon, PaperClipIcon, MagnifyingGlassIcon, XMarkIcon, CheckIcon, CheckCircleIcon } from './icons';

interface EnhancedMessagingProps {
  currentUser: User;
  onClose?: () => void;
}

const EnhancedMessaging: React.FC<EnhancedMessagingProps> = ({ currentUser, onClose }) => {
  const { 
    isConnected, 
    onlineUsers, 
    typingUsers,
    joinConversation, 
    leaveConversation,
    sendTypingIndicator,
    stopTypingIndicator,
    onNewMessage,
    onMessageRead,
  } = useSocket();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const authToken = localStorage.getItem(AUTH_TOKEN_KEY);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!authToken) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/messages/conversations`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [authToken]);

  // Fetch messages for a conversation
  const fetchConversationMessages = useCallback(async (conversationId: string) => {
    if (!authToken) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/messages/conversation/${conversationId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [authToken]);

  // Mark conversation as read
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    if (!authToken) return;
    
    try {
      await fetch(`${API_BASE_URL}/messages/conversation/${conversationId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      // Update local state
      setConversations(prev => prev.map(conv => 
        conv.conversationId === conversationId 
          ? { ...conv, unreadCount: 0 }
          : conv
      ));
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  }, [authToken]);

  // Search messages
  const searchMessages = useCallback(async () => {
    if (!authToken || !searchQuery.trim()) return;
    
    try {
      setIsSearching(true);
      const response = await fetch(`${API_BASE_URL}/messages/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Error searching messages:', error);
    } finally {
      setIsSearching(false);
    }
  }, [authToken, searchQuery]);

  // Upload file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authToken) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUploading(true);
      const response = await fetch(`${API_BASE_URL}/messages/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: formData
      });
      
      if (response.ok) {
        const attachment = await response.json();
        setAttachments(prev => [...prev, attachment]);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Send message
  const sendMessage = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || !selectedConversation || !authToken) return;

    const otherUser = getOtherUser(selectedConversation);
    if (!otherUser) return;

    try {
      setIsSending(true);
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiverId: otherUser.id,
          propertyId: selectedConversation.lastMessage?.propertyId 
            ? (typeof selectedConversation.lastMessage.propertyId === 'string' 
              ? selectedConversation.lastMessage.propertyId 
              : selectedConversation.lastMessage.propertyId.id)
            : undefined,
          content: newMessage.trim() || 'Sent an attachment',
          attachments
        })
      });

      if (response.ok) {
        const sentMessage = await response.json();
        setMessages(prev => [...prev, sentMessage]);
        setNewMessage('');
        setAttachments([]);
        fetchConversations(); // Refresh conversation list
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Handle typing
  const handleTyping = () => {
    if (!selectedConversation) return;
    
    const otherUser = getOtherUser(selectedConversation);
    if (!otherUser) return;

    sendTypingIndicator(selectedConversation.conversationId, otherUser.id);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      stopTypingIndicator(selectedConversation.conversationId, otherUser.id);
    }, 2000);
  };

  // Get other user from conversation
  const getOtherUser = (conversation: Conversation): User | null => {
    const lastMsg = conversation.lastMessage;
    if (!lastMsg) return null;
    
    const senderId = typeof lastMsg.senderId === 'string' ? lastMsg.senderId : lastMsg.senderId.id;
    const receiverId = typeof lastMsg.receiverId === 'string' ? lastMsg.receiverId : lastMsg.receiverId.id;
    
    if (senderId === currentUser.id) {
      return typeof lastMsg.receiverId === 'object' ? lastMsg.receiverId : null;
    } else {
      return typeof lastMsg.senderId === 'object' ? lastMsg.senderId : null;
    }
  };

  // Effects
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedConversation) {
      fetchConversationMessages(selectedConversation.conversationId);
      joinConversation(selectedConversation.conversationId);
      markConversationAsRead(selectedConversation.conversationId);
      
      return () => {
        leaveConversation(selectedConversation.conversationId);
      };
    }
  }, [selectedConversation, fetchConversationMessages, joinConversation, leaveConversation, markConversationAsRead]);

  useEffect(() => {
    const cleanup = onNewMessage((message: Message) => {
      if (selectedConversation && message.conversationId === selectedConversation.conversationId) {
        setMessages(prev => [...prev, message]);
        markConversationAsRead(selectedConversation.conversationId);
      }
      fetchConversations();
    });
    return cleanup;
  }, [onNewMessage, selectedConversation, markConversationAsRead, fetchConversations]);

  useEffect(() => {
    const cleanup = onMessageRead(({ messageId, readAt }) => {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, isRead: true, readAt } : msg
      ));
    });
    return cleanup;
  }, [onMessageRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Search effect
  useEffect(() => {
    if (searchQuery.trim()) {
      const debounce = setTimeout(searchMessages, 300);
      return () => clearTimeout(debounce);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, searchMessages]);

  const isUserOnline = (userId: string) => onlineUsers.includes(userId);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const currentTypingUser = selectedConversation ? typingUsers.get(selectedConversation.conversationId) : null;

  return (
    <div className="flex h-[600px] bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Conversations List */}
      <div className="w-1/3 border-r border-neutral flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-neutral">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg text-primary">Messages</h3>
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-danger'}`} 
                    title={isConnected ? 'Connected' : 'Disconnected'} />
              <button 
                onClick={() => setShowSearch(!showSearch)}
                className="p-1.5 hover:bg-neutral-light rounded-full transition-colors"
              >
                <MagnifyingGlassIcon className="w-5 h-5 text-neutral-dark" />
              </button>
            </div>
          </div>
          
          {/* Search */}
          {showSearch && (
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="w-full px-3 py-2 pl-9 border border-neutral rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <MagnifyingGlassIcon className="w-4 h-4 text-neutral-dark absolute left-3 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <XMarkIcon className="w-4 h-4 text-neutral-dark" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Search Results or Conversations */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && !selectedConversation ? (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner />
            </div>
          ) : showSearch && searchQuery ? (
            // Search Results
            <div>
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="sm" />
                </div>
              ) : searchResults.length === 0 ? (
                <p className="text-center text-neutral-dark py-8 text-sm">No messages found</p>
              ) : (
                searchResults.map(msg => {
                  const sender = typeof msg.senderId === 'object' ? msg.senderId : null;
                  return (
                    <div 
                      key={msg.id}
                      className="p-3 border-b border-neutral hover:bg-neutral-light cursor-pointer"
                      onClick={() => {
                        // Find or create conversation and select it
                        const conv = conversations.find(c => c.conversationId === msg.conversationId);
                        if (conv) {
                          setSelectedConversation(conv);
                          setShowSearch(false);
                          setSearchQuery('');
                        }
                      }}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm">{sender?.name || 'Unknown'}</span>
                        <span className="text-xs text-neutral-dark">{formatDate(msg.timestamp)}</span>
                      </div>
                      <p className="text-sm text-neutral-dark line-clamp-2">{msg.content}</p>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            // Conversations List
            conversations.length === 0 ? (
              <p className="text-center text-neutral-dark py-8 text-sm">No conversations yet</p>
            ) : (
              conversations.map(conv => {
                const otherUser = getOtherUser(conv);
                const isOnline = otherUser ? isUserOnline(otherUser.id) : false;
                const property = conv.lastMessage?.propertyId;
                const propertyTitle = property && typeof property === 'object' ? property.title : null;
                
                return (
                  <div
                    key={conv.conversationId}
                    className={`p-3 border-b border-neutral cursor-pointer transition-colors ${
                      selectedConversation?.conversationId === conv.conversationId 
                        ? 'bg-primary/10' 
                        : 'hover:bg-neutral-light'
                    }`}
                    onClick={() => setSelectedConversation(conv)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative flex-shrink-0">
                        <img 
                          src={otherUser?.profilePicture || 'https://via.placeholder.com/40'} 
                          alt={otherUser?.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        {isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm truncate">{otherUser?.name || 'Unknown'}</span>
                          <span className="text-xs text-neutral-dark">
                            {conv.lastMessage && formatTime(conv.lastMessage.timestamp)}
                          </span>
                        </div>
                        {propertyTitle && (
                          <p className="text-xs text-primary truncate">Re: {propertyTitle}</p>
                        )}
                        <p className="text-sm text-neutral-dark truncate">
                          {conv.lastMessage?.content || 'No messages'}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-neutral flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img 
                    src={getOtherUser(selectedConversation)?.profilePicture || 'https://via.placeholder.com/40'} 
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  {getOtherUser(selectedConversation) && isUserOnline(getOtherUser(selectedConversation)!.id) && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-white" />
                  )}
                </div>
                <div>
                  <h4 className="font-semibold">{getOtherUser(selectedConversation)?.name}</h4>
                  <p className="text-xs text-neutral-dark">
                    {getOtherUser(selectedConversation) && isUserOnline(getOtherUser(selectedConversation)!.id) 
                      ? 'Online' 
                      : 'Offline'}
                  </p>
                </div>
              </div>
              {onClose && (
                <button onClick={onClose} className="p-2 hover:bg-neutral-light rounded-full">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-light">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <LoadingSpinner />
                </div>
              ) : (
                <>
                  {messages.map((msg, index) => {
                    const isSent = (typeof msg.senderId === 'string' ? msg.senderId : msg.senderId.id) === currentUser.id;
                    const showDate = index === 0 || 
                      formatDate(messages[index - 1].timestamp) !== formatDate(msg.timestamp);
                    
                    return (
                      <React.Fragment key={msg.id}>
                        {showDate && (
                          <div className="text-center">
                            <span className="text-xs text-neutral-dark bg-white px-3 py-1 rounded-full">
                              {formatDate(msg.timestamp)}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] ${isSent ? 'order-2' : ''}`}>
                            <div className={`rounded-2xl px-4 py-2 ${
                              isSent 
                                ? 'bg-primary text-white rounded-br-md' 
                                : 'bg-white text-neutral-darker rounded-bl-md shadow-sm'
                            }`}>
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              
                              {/* Attachments */}
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mt-2 space-y-2">
                                  {msg.attachments.map((att, i) => (
                                    <a 
                                      key={i}
                                      href={`${API_BASE_URL.replace('/api', '')}${att.url}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`flex items-center space-x-2 text-sm ${
                                        isSent ? 'text-white/90 hover:text-white' : 'text-primary hover:underline'
                                      }`}
                                    >
                                      <PaperClipIcon className="w-4 h-4" />
                                      <span className="truncate">{att.originalName}</span>
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className={`flex items-center mt-1 space-x-1 ${isSent ? 'justify-end' : ''}`}>
                              <span className="text-xs text-neutral-dark">{formatTime(msg.timestamp)}</span>
                              {isSent && (
                                <span className="text-xs">
                                  {msg.isRead ? (
                                    <CheckCircleIcon className="w-4 h-4 text-success" title={`Read ${msg.readAt ? formatTime(msg.readAt) : ''}`} />
                                  ) : (
                                    <CheckIcon className="w-4 h-4 text-neutral-dark" title="Sent" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                  
                  {/* Typing Indicator */}
                  {currentTypingUser && (
                    <div className="flex justify-start">
                      <div className="bg-white rounded-2xl px-4 py-2 shadow-sm">
                        <div className="flex space-x-1">
                          <span className="w-2 h-2 bg-neutral-dark rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-neutral-dark rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-neutral-dark rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Attachments Preview */}
            {attachments.length > 0 && (
              <div className="px-4 py-2 bg-neutral-light border-t border-neutral flex flex-wrap gap-2">
                {attachments.map((att, i) => (
                  <div key={i} className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full shadow-sm">
                    <PaperClipIcon className="w-4 h-4 text-neutral-dark" />
                    <span className="text-sm truncate max-w-[150px]">{att.originalName}</span>
                    <button 
                      onClick={() => setAttachments(prev => prev.filter((_, index) => index !== i))}
                      className="text-danger hover:text-red-700"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-neutral bg-white">
              <div className="flex items-end space-x-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,.pdf"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-2 text-neutral-dark hover:text-primary hover:bg-neutral-light rounded-full transition-colors disabled:opacity-50"
                >
                  {isUploading ? <LoadingSpinner size="sm" /> : <PaperClipIcon className="w-5 h-5" />}
                </button>
                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    rows={1}
                    className="w-full px-4 py-2 border border-neutral rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={isSending || (!newMessage.trim() && attachments.length === 0)}
                  className="p-2 bg-primary text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? <LoadingSpinner size="sm" /> : <PaperAirplaneIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-neutral-light">
            <div className="text-center">
              <div className="w-20 h-20 bg-neutral rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-neutral-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-neutral-dark mb-1">Your Messages</h3>
              <p className="text-sm text-neutral-dark">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedMessaging;

