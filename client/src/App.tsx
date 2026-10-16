import React, { useState, useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
import { LobbyView } from './components/LobbyView';
import { GameTableView } from './components/GameTableView';
import { GameOverModal } from './components/GameOverModal';
import { AlertCircle, WifiOff } from 'lucide-react';

export function App() {
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('tienlen_name') || 'Cục Zàng ' + Math.floor(Math.random() * 90 + 10);
  });

  const [avatar, setAvatar] = useState(() => {
    return localStorage.getItem('tienlen_avatar') || '👑';
  });

  useEffect(() => {
    localStorage.setItem('tienlen_name', playerName);
  }, [playerName]);

  useEffect(() => {
    localStorage.setItem('tienlen_avatar', avatar);
  }, [avatar]);

  const {
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
  } = useSocket();

  return (
    <div className="relative min-h-screen text-white select-none">
      {/* Toast thông báo lỗi nếu có */}
      {errorMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-red-600/90 text-white font-bold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-red-400 backdrop-blur-md animate-bounce">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{errorMessage}</span>
        </div>
      )}

      {/* Cảnh báo mất kết nối */}
      {!connected && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-600 text-slate-950 font-black text-xs py-1 text-center flex items-center justify-center gap-1 shadow-md">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Đang kết nối lại tới Game Server Tiến Lên Cục Zàng...</span>
        </div>
      )}

      {/* Nếu chưa vào phòng -> Màn hình Sảnh (Lobby) */}
      {!roomState ? (
        <LobbyView
          playerName={playerName}
          setPlayerName={setPlayerName}
          avatar={avatar}
          setAvatar={setAvatar}
          onCreateRoom={(settings) => createRoom(settings, playerName, avatar)}
          onJoinRoom={(code) => joinRoom(code, playerName, avatar)}
          isConnecting={!connected}
        />
      ) : (
        /* Đang ở trong phòng chơi */
        <GameTableView
          roomState={roomState}
          myPlayerId={playerId}
          onPlayCards={playCards}
          onPassTurn={passTurn}
          onReady={setReady}
          onStartGame={startGame}
          onAddBot={addBot}
          onLeaveRoom={leaveRoom}
        />
      )}

      {/* Modal Tổng Kết Ván khi GAME_OVER */}
      {roomState && roomState.phase === 'GAME_OVER' && (
        <GameOverModal
          roomState={roomState}
          myPlayerId={playerId}
          onReadyNext={() => setReady(true)}
          onLeave={leaveRoom}
        />
      )}
    </div>
  );
}
export default App;
