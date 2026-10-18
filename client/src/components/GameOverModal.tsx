import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PlayerPublicInfo, RoomStateUpdate } from '../../../shared/types';
import { CardView } from './CardView';
import { sound } from '../utils/audio';
import { Trophy, RotateCcw, LogOut } from 'lucide-react';

interface GameOverModalProps {
  roomState: RoomStateUpdate;
  myPlayerId: string;
  onReadyNext: () => void;
  onLeave: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  roomState,
  myPlayerId,
  onReadyNext,
  onLeave,
}) => {
  const isMeWinner = roomState.players.some(
    (p) => p.id === myPlayerId && p.rank === 1
  );

  useEffect(() => {
    if (isMeWinner) {
      sound.playVictory();
      // Bắn pháo hoa ăn mừng rực rỡ
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [isMeWinner]);

  // Sắp xếp người chơi theo thứ hạng
  const sortedPlayers = [...roomState.players].sort(
    (a, b) => (a.rank || 99) - (b.rank || 99)
  );

  const getRankBadge = (rank?: number) => {
    switch (rank) {
      case 1:
        return <span className="text-xl">🥇 Nhất</span>;
      case 2:
        return <span className="text-xl">🥈 Nhì</span>;
      case 3:
        return <span className="text-xl">🥉 Ba</span>;
      default:
        return <span className="text-xl">🥀 Bét</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 safe-top safe-bottom">
      <div className="bg-slate-900 border-2 border-amber-400/80 rounded-2xl max-w-xl w-full max-h-[90dvh] overflow-y-auto p-4 sm:p-6 shadow-2xl text-white flex flex-col justify-between">
        <div className="text-center mb-4 sm:mb-6">
          <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400 mx-auto mb-2 animate-bounce" />
          <h2 className="text-xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500">
            KẾT THÚC VÁN ĐẤU!
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Luật: {roomState.settings.ruleMode === 'TLMB' ? 'Tiến Lên Miền Bắc' : 'Tiến Lên Miền Nam'}
          </p>
        </div>

        {/* Bảng xếp hạng người chơi */}
        <div className="space-y-3 mb-6">
          {sortedPlayers.map((player) => {
            const isMe = player.id === myPlayerId;
            return (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3.5 rounded-xl border ${
                  isMe
                    ? 'bg-amber-500/15 border-amber-400'
                    : 'bg-slate-800/60 border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xl border border-slate-700">
                    {player.avatar}
                  </div>
                  <div>
                    <div className="font-bold flex items-center gap-2">
                      <span>{player.name}</span>
                      {isMe && (
                        <span className="text-xs bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-extrabold">
                          BẠN
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      Xu: {player.score.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="text-right font-extrabold text-amber-300">
                  {getRankBadge(player.rank)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Lịch sử ván */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 mb-6 max-h-32 overflow-y-auto text-xs text-slate-300 space-y-1">
          <div className="font-semibold text-amber-400/90 mb-1">Nhật Ký Ván:</div>
          {roomState.gameHistory.map((h, i) => (
            <div key={i}>{h}</div>
          ))}
        </div>

        {/* Nút hành động */}
        <div className="flex gap-3">
          <button
            onClick={onLeave}
            className="flex-1 bg-slate-800 hover:bg-slate-700 font-bold py-3 rounded-xl transition flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Rời Bàn</span>
          </button>
          <button
            onClick={onReadyNext}
            className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-black py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Ván Tiếp Theo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
