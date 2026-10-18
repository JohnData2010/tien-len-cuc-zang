import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { RoomSettings, RoomStateUpdate } from '../../../shared/types';

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const [roomState, setRoomState] = useState<RoomStateUpdate | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Lấy hoặc sinh playerId lưu trong localStorage để hỗ trợ reconnect khi F5
  const getPlayerId = useCallback(() => {
    let pid = localStorage.getItem('tienlen_player_id');
    if (!pid) {
      pid = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      localStorage.setItem('tienlen_player_id', pid);
    }
    return pid;
  }, []);

  const playerId = getPlayerId();

  useEffect(() => {
    // Kết nối đến cùng domain trong production (Render) hoặc localhost trong dev
    const serverUrl =
      import.meta.env.MODE === 'production'
        ? window.location.origin
        : 'http://localhost:10000';

    const socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Đã kết nối Socket Game:', socket.id);
      setConnected(true);
      // Đăng ký lại playerId với server sau khi kết nối/reconnect
      socket.emit('register_player', { playerId });
    });

    socket.on('disconnect', () => {
      console.log('Mất kết nối Socket');
      setConnected(false);
    });

    socket.on('room_state_update', (state: RoomStateUpdate) => {
      setRoomState(state);
    });

    socket.on('action_error', ({ message }: { message: string }) => {
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(null), 3500);
    });

    // Xử lý khi người dùng quay lại tab trình duyệt trên Mobile (Visibility Change)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (!socket.connected) {
          console.log('📱 Tab resumed on mobile, reconnecting socket...');
          socket.connect();
        } else {
          socket.emit('register_player', { playerId });
        }
      }
    };

    const handleOnline = () => {
      if (!socket.connected) {
        socket.connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      socket.disconnect();
    };
  }, [playerId]);

  const createRoom = useCallback(
    (settings: RoomSettings, playerName: string, avatar: string) => {
      if (!socketRef.current) return;
      socketRef.current.emit('create_room', {
        playerId,
        playerName,
        avatar,
        settings,
      });
    },
    [playerId]
  );

  const joinRoom = useCallback(
    (roomCode: string, playerName: string, avatar: string) => {
      if (!socketRef.current) return;
      socketRef.current.emit('join_room', {
        roomCode,
        playerId,
        playerName,
        avatar,
      });
    },
    [playerId]
  );

  const setReady = useCallback((ready: boolean) => {
    if (!socketRef.current) return;
    socketRef.current.emit('ready', { playerId, ready });
  }, [playerId]);

  const startGame = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('start_game', { playerId });
  }, [playerId]);

  const playCards = useCallback((cardIds: number[]) => {
    if (!socketRef.current) return;
    socketRef.current.emit('play_cards', { playerId, cardIds });
  }, [playerId]);

  const passTurn = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('pass_turn', { playerId });
  }, [playerId]);

  const addBot = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('add_bot', { playerId });
  }, [playerId]);

  const leaveRoom = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('leave_room', { playerId });
    setRoomState(null);
  }, [playerId]);

  return {
    connected,
    playerId,
    roomState,
    errorMessage,
    createRoom,
    joinRoom,
    setReady,
    startGame,
    playCards,
    passTurn,
    addBot,
    leaveRoom,
  };
}
