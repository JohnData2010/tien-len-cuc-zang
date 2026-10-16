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

    return () => {
      socket.disconnect();
    };
  }, []);

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
    socketRef.current.emit('ready', { ready });
  }, []);

  const startGame = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('start_game');
  }, []);

  const playCards = useCallback((cardIds: number[]) => {
    if (!socketRef.current) return;
    socketRef.current.emit('play_cards', { cardIds });
  }, []);

  const passTurn = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('pass_turn');
  }, []);

  const addBot = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('add_bot');
  }, []);

  const leaveRoom = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('leave_room');
    setRoomState(null);
  }, []);

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
