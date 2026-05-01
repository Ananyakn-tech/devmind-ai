// frontend/hooks/useSocket.ts
'use client';
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/components/providers/AuthProvider';

let socketInstance: Socket | null = null;

export function useSocket() {
  const { token } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    if (!socketInstance) {
      socketInstance = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000', {
        auth: { token },
        transports: ['websocket'],
      });
    }

    socketRef.current = socketInstance;

    return () => {
      // Don't disconnect on unmount — keep singleton alive
    };
  }, [token]);

  return socketRef.current;
}

export function useWorkspaceSocket(workspaceId: string | null) {
  const socket = useSocket();

  useEffect(() => {
    if (!socket || !workspaceId) return;
    socket.emit('workspace:join', workspaceId);
    return () => {
      socket.emit('workspace:leave', workspaceId);
    };
  }, [socket, workspaceId]);

  return socket;
}
