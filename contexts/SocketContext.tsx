import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Message } from '../types';
import { AUTH_TOKEN_KEY } from '../constants';

// Socket URL - same as API but without /api
const SOCKET_URL = import.meta.env.DEV 
  ? 'http://localhost:5001' 
  : 'https://rentproperty-backend.onrender.com';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: string[];
  typingUsers: Map<string, string>; // conversationId -> userId
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendTypingIndicator: (conversationId: string, receiverId: string) => void;
  stopTypingIndicator: (conversationId: string, receiverId: string) => void;
  onNewMessage: (callback: (message: Message) => void) => () => void;
  onMessageRead: (callback: (data: { messageId: string; readAt: string }) => void) => () => void;
  onUserTyping: (callback: (data: { conversationId: string; userId: string }) => void) => () => void;
  onUserStoppedTyping: (callback: (data: { conversationId: string; userId: string }) => void) => () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const typingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    
    if (!token) {
      return;
    }

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'], // Prefer websocket over polling for better performance
      upgrade: true,
      rememberUpgrade: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: 5,
      timeout: 20000,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      newSocket.emit('getOnlineUsers');
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    newSocket.on('onlineUsers', (users: string[]) => {
      setOnlineUsers(users);
    });

    newSocket.on('userOnline', ({ userId }: { userId: string }) => {
      setOnlineUsers(prev => [...new Set([...prev, userId])]);
    });

    newSocket.on('userOffline', ({ userId }: { userId: string }) => {
      setOnlineUsers(prev => prev.filter(id => id !== userId));
    });

    newSocket.on('userTyping', ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        newMap.set(conversationId, userId);
        return newMap;
      });
      
      // Clear typing indicator after 3 seconds
      const existingTimeout = typingTimeouts.current.get(conversationId);
      if (existingTimeout) clearTimeout(existingTimeout);
      
      const timeout = setTimeout(() => {
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          newMap.delete(conversationId);
          return newMap;
        });
      }, 3000);
      typingTimeouts.current.set(conversationId, timeout);
    });

    newSocket.on('userStoppedTyping', ({ conversationId }: { conversationId: string }) => {
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        newMap.delete(conversationId);
        return newMap;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
      typingTimeouts.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const joinConversation = useCallback((conversationId: string) => {
    socket?.emit('joinConversation', conversationId);
  }, [socket]);

  const leaveConversation = useCallback((conversationId: string) => {
    socket?.emit('leaveConversation', conversationId);
  }, [socket]);

  const sendTypingIndicator = useCallback((conversationId: string, receiverId: string) => {
    socket?.emit('typing', { conversationId, receiverId });
  }, [socket]);

  const stopTypingIndicator = useCallback((conversationId: string, receiverId: string) => {
    socket?.emit('stopTyping', { conversationId, receiverId });
  }, [socket]);

  const onNewMessage = useCallback((callback: (message: Message) => void) => {
    if (!socket) return () => {};
    
    socket.on('newMessage', callback);
    return () => {
      socket.off('newMessage', callback);
    };
  }, [socket]);

  const onMessageRead = useCallback((callback: (data: { messageId: string; readAt: string }) => void) => {
    if (!socket) return () => {};
    
    socket.on('messageRead', callback);
    return () => {
      socket.off('messageRead', callback);
    };
  }, [socket]);

  const onUserTyping = useCallback((callback: (data: { conversationId: string; userId: string }) => void) => {
    if (!socket) return () => {};
    
    socket.on('userTyping', callback);
    return () => {
      socket.off('userTyping', callback);
    };
  }, [socket]);

  const onUserStoppedTyping = useCallback((callback: (data: { conversationId: string; userId: string }) => void) => {
    if (!socket) return () => {};
    
    socket.on('userStoppedTyping', callback);
    return () => {
      socket.off('userStoppedTyping', callback);
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      onlineUsers,
      typingUsers,
      joinConversation,
      leaveConversation,
      sendTypingIndicator,
      stopTypingIndicator,
      onNewMessage,
      onMessageRead,
      onUserTyping,
      onUserStoppedTyping,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;

