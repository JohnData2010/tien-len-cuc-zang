import React, { useState, useEffect, useRef } from 'react';
import { Card, PlayerPublicInfo, RoomStateUpdate } from '../../../shared/types';
import { CardView } from './CardView';
import { sound } from '../utils/audio';
import { findSmartHint } from '../utils/hint';
import {
  Volume2,
  VolumeX,
  Copy,
  LogOut,
  Bot,
  Play,
  CheckCircle,
  Sparkles,
  Lightbulb,
  ArrowUpDown,
} from 'lucide-react';

interface GameTableViewProps {
  roomState: RoomStateUpdate;
  myPlayerId: string;
  onPlayCards: (cardIds: number[]) => void;
  onPassTurn: () => void;
  onReady: (ready: boolean) => void;
  onStartGame: () => void;
  onAddBot: () => void;
  onLeaveRoom: () => void;
}

export const GameTableView: React.FC<GameTableViewProps> = ({
  roomState,
  myPlayerId,
  onPlayCards,
  onPassTurn,
  onReady,
  onStartGame,
  onAddBot,
  onLeaveRoom,
}) => {
  const [selectedCardIds, setSelectedCardIds] = useState<number[]>([]);
  const [isMuted, setIsMuted] = useState(sound.isMuted);
  const [copied, setCopied] = useState(false);
  const [sortedHand, setSortedHand] = useState<Card[]>([]);

  const me = roomState.players.find((p) => p.id === myPlayerId);
  const isMyTurn = roomState.currentTurnPlayerId === myPlayerId;
  const isHost = me?.isHost || false;
  const hasTimeLimit = roomState.settings.turnTimeLimit > 0;

  // Cập nhật và sắp xếp bài khi nhận bài mới
  useEffect(() => {
    const sorted = [...roomState.myHand].sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return a.suit - b.suit;
    });
    setSortedHand(sorted);
  }, [roomState.myHand]);

  // FIX LỖI MẤT CHỌN BÀI: Chỉ xóa bài chọn khi LƯỢT CHUYỂN sang người khác
  const prevTurnPlayerRef = useRef<string | null>(roomState.currentTurnPlayerId);
  useEffect(() => {
    if (prevTurnPlayerRef.current !== roomState.currentTurnPlayerId) {
      setSelectedCardIds([]);
      prevTurnPlayerRef.current = roomState.currentTurnPlayerId;
    }
  }, [roomState.currentTurnPlayerId]);

  // Âm thanh khi có người chặt heo hoặc đánh bài
  useEffect(() => {
    if (roomState.lastPlay) {
      if (roomState.lastPlay.message?.includes('Chặt')) {
        sound.playChatHeo();
      } else {
        sound.playCardPlay();
      }
    }
  }, [roomState.lastPlay]);

  // Bộ đếm âm thanh tích tắc khi còn dưới 5 giây
  useEffect(() => {
    if (
      hasTimeLimit &&
      isMyTurn &&
      roomState.turnTimeRemaining <= 5 &&
      roomState.turnTimeRemaining > 0
    ) {
      sound.playTick();
    }
  }, [roomState.turnTimeRemaining, isMyTurn, hasTimeLimit]);

  const toggleMute = () => {
    sound.isMuted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomState.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSelectCard = (id: number) => {
    sound.playCardSelect();
    setSelectedCardIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handlePlay = () => {
    if (selectedCardIds.length === 0) return;
    onPlayCards(selectedCardIds);
    // Tạm xóa bài đã chọn sau khi ấn đánh
    setSelectedCardIds([]);
  };

  // Tính năng GỢI Ý thông minh
  const handleSmartHint = () => {
    if (!isMyTurn) return;
    const suggestedIds = findSmartHint(
      sortedHand,
      roomState.lastPlay,
      roomState.settings.ruleMode
    );
    if (suggestedIds && suggestedIds.length > 0) {
      sound.playCardSelect();
      setSelectedCardIds(suggestedIds);
    } else {
      alert('Không có nước bài nào trên tay có thể chặn được! Bạn có thể chọn Bỏ Lượt.');
    }
  };

  // Tính năng XẾP LẠI BÀI
  const handleSortHand = () => {
    sound.playCardSelect();
    const sorted = [...sortedHand].sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return a.suit - b.suit;
    });
    setSortedHand(sorted);
  };

  // Tính vị trí các đối thủ quanh bàn theo chiều kim đồng hồ
  const myIndex = roomState.players.findIndex((p) => p.id === myPlayerId);
  const otherPlayers = roomState.players.filter((p) => p.id !== myPlayerId);

  const getOpponentPosition = (opp: PlayerPublicInfo) => {
    const total = roomState.players.length;
    const oppIndex = roomState.players.findIndex((p) => p.id === opp.id);
    const diff = (oppIndex - myIndex + total) % total;

    if (total === 2) return 'top';
    if (total === 3) {
      return diff === 1 ? 'right' : 'left';
    }
    // 4 người
    if (diff === 1) return 'right';
    if (diff === 2) return 'top';
    return 'left';
  };

  return (
    <div className="relative h-screen max-h-screen w-full flex flex-col justify-between overflow-hidden bg-slate-950 select-none">
      {/* 1. TOP HEADER (Fixed height: h-14) */}
      <div className="flex-shrink-0 h-14 z-20 flex items-center justify-between px-3 sm:px-6 bg-slate-950/90 backdrop-blur-md border-b border-amber-500/20">
        <div className="flex items-center gap-3">
          <div className="font-black text-amber-400 tracking-wider text-base sm:text-lg flex items-center gap-1.5">
            <span>👑 TIẾN LÊN CỤC ZÀNG</span>
          </div>

          {/* Room Code Badge */}
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 bg-slate-900 border border-amber-400/50 hover:bg-slate-800 px-3 py-1 rounded-full text-xs font-bold text-amber-300 transition"
            title="Click để sao chép mã bàn"
          >
            <span>Mã: {roomState.roomCode}</span>
            <Copy className="w-3.5 h-3.5" />
            {copied && <span className="text-emerald-400 text-[10px]">Đã chép!</span>}
          </button>

          {/* Rule Badge */}
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              roomState.settings.ruleMode === 'TLMB'
                ? 'bg-red-500/20 border border-red-500/50 text-red-300'
                : 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
            }`}
          >
            {roomState.settings.ruleMode === 'TLMB' ? 'Miền Bắc' : 'Miền Nam'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onLeaveRoom}
            className="flex items-center gap-1 bg-red-600/80 hover:bg-red-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Rời Bàn</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN FELT TABLE AREA (Flex-1, dynamically shrinks or grows to fit viewport) */}
      <div className="flex-1 min-h-0 relative flex items-center justify-center p-2 sm:p-4">
        {/* Felt Table Oval */}
        <div className="relative w-full max-w-4xl h-full max-h-[460px] bg-gradient-to-br from-[#0c3c26] to-[#062416] border-4 sm:border-8 border-[#3b220e] rounded-[70px] sm:rounded-[140px] shadow-[inset_0_0_60px_rgba(0,0,0,0.8),0_15px_30px_rgba(0,0,0,0.9)] flex items-center justify-center">
          {/* Subtle gold emblem inside felt table */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
            <span className="text-5xl sm:text-7xl font-black text-amber-300 tracking-widest uppercase">
              CỤC ZÀNG
            </span>
          </div>

          {/* Opponents Seats */}
          {otherPlayers.map((player) => {
            const pos = getOpponentPosition(player);
            const isTurn = roomState.currentTurnPlayerId === player.id;

            const posClasses = {
              top: 'top-2 sm:top-4 left-1/2 -translate-x-1/2',
              left: 'left-2 sm:left-4 top-1/2 -translate-y-1/2',
              right: 'right-2 sm:right-4 top-1/2 -translate-y-1/2',
            }[pos];

            return (
              <div
                key={player.id}
                className={`absolute z-10 flex flex-col items-center ${posClasses}`}
              >
                {/* Avatar with turn ring glow */}
                <div
                  className={`relative w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-slate-900 flex items-center justify-center text-xl sm:text-2xl border-2 transition-all ${
                    isTurn
                      ? 'border-amber-400 shadow-[0_0_20px_rgba(234,179,8,0.8)] scale-110'
                      : 'border-slate-700'
                  }`}
                >
                  {player.avatar}
                  {player.isHost && (
                    <span className="absolute -top-1 -right-1 text-xs">👑</span>
                  )}
                  {player.passed && (
                    <div className="absolute inset-0 bg-red-950/80 rounded-full flex items-center justify-center text-[9px] font-bold text-red-300">
                      BỎ LƯỢT
                    </div>
                  )}
                  {isTurn && hasTimeLimit && (
                    <div className="absolute -bottom-2 bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                      {roomState.turnTimeRemaining}s
                    </div>
                  )}
                </div>

                {/* Name & Card Count */}
                <div className="mt-1 bg-slate-950/80 px-2 py-0.5 rounded text-center backdrop-blur-sm border border-slate-800">
                  <div className="text-[11px] sm:text-xs font-bold text-white truncate max-w-[70px] sm:max-w-[90px]">
                    {player.name}
                  </div>
                  {roomState.phase === 'PLAYING' && (
                    <div className="text-[10px] text-amber-400 font-bold">
                      {player.cardCount} lá
                    </div>
                  )}
                  {roomState.phase === 'LOBBY' && (
                    <div
                      className={`text-[10px] font-semibold ${
                        player.isReady ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {player.isReady ? 'Sẵn sàng' : 'Chờ...'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* CENTER OF THE TABLE: Active Plays or Waiting Lobby */}
          <div className="z-10 flex flex-col items-center justify-center max-w-md text-center p-2">
            {roomState.phase === 'LOBBY' && (
              <div className="bg-slate-950/85 border border-amber-500/40 p-4 rounded-2xl backdrop-blur-md shadow-2xl flex flex-col items-center gap-3">
                <div className="text-amber-300 font-bold text-sm sm:text-base">
                  BÀN CHỜ: {roomState.players.length}/{roomState.settings.maxPlayers} NGƯỜI
                </div>

                <div className="flex gap-2">
                  {isHost && roomState.players.length < roomState.settings.maxPlayers && (
                    <button
                      onClick={onAddBot}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg"
                    >
                      <Bot className="w-4 h-4" />
                      <span>Thêm Bot</span>
                    </button>
                  )}

                  {isHost ? (
                    <button
                      onClick={onStartGame}
                      className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-black px-5 py-2 rounded-xl text-sm shadow-lg transition flex items-center gap-1.5"
                    >
                      <Play className="w-4 h-4 fill-slate-950" />
                      <span>BẮT ĐẦU VÁN</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onReady(!me?.isReady)}
                      className={`font-black px-5 py-2 rounded-xl text-sm transition flex items-center gap-1.5 ${
                        me?.isReady
                          ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{me?.isReady ? 'HỦY SẴN SÀNG' : 'SẴN SÀNG'}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {roomState.phase === 'PLAYING' && (
              <div className="flex flex-col items-center">
                {roomState.lastPlay ? (
                  <div className="flex flex-col items-center animate-fade-in">
                    {/* Action Banner (e.g. "Chặt Heo!") */}
                    {roomState.lastPlay.message && (
                      <div className="mb-2 bg-gradient-to-r from-red-600 to-amber-600 text-white text-xs sm:text-sm font-black px-3 py-0.5 rounded-full shadow-lg animate-bounce">
                        💥 {roomState.lastPlay.message}
                      </div>
                    )}

                    <div className="text-xs text-amber-300/80 mb-1 font-semibold">
                      {roomState.lastPlay.playerName} vừa đánh:
                    </div>

                    {/* Cards on board */}
                    <div className="flex -space-x-3 sm:-space-x-4 shadow-2xl">
                      {roomState.lastPlay.cards.map((c) => (
                        <CardView key={c.id} card={c} size="md" />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-950/70 border border-emerald-500/40 px-4 py-2 rounded-xl text-emerald-300 text-xs sm:text-sm font-bold shadow-lg">
                    ✨ VÒNG MỚI: ĐƯỢC QUYỀN ĐÁNH TỰ DO ✨
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. BOTTOM AREA: Action Bar & Player's Hand (Fixed at bottom, never clipped!) */}
      <div className="flex-shrink-0 z-30 bg-slate-950/95 border-t border-amber-500/30 px-2 pt-2 pb-3 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          {/* Action Button Bar */}
          {roomState.phase === 'PLAYING' && (
            <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap justify-center">
              {/* Turn Countdown Indicator */}
              {isMyTurn && (
                <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-400 text-amber-300 font-black px-3 py-1 rounded-full text-xs animate-pulse">
                  <span>LƯỢT CỦA BẠN</span>
                  {hasTimeLimit && (
                    <span className="text-sm font-extrabold">: {roomState.turnTimeRemaining}s</span>
                  )}
                </div>
              )}

              {/* Gợi ý button */}
              {isMyTurn && (
                <button
                  onClick={handleSmartHint}
                  className="bg-blue-600/80 hover:bg-blue-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition shadow-md"
                  title="Tự động tìm nước bài chặn hợp lệ"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Gợi Ý</span>
                </button>
              )}

              {/* Xếp bài button */}
              <button
                onClick={handleSortHand}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition"
                title="Sắp xếp lại các lá bài"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Xếp Bài</span>
              </button>

              {/* Bỏ lượt button */}
              <button
                onClick={onPassTurn}
                disabled={!isMyTurn || !roomState.lastPlay}
                className={`font-bold px-4 py-1.5 rounded-xl text-xs transition ${
                  isMyTurn && roomState.lastPlay
                    ? 'bg-slate-800 hover:bg-slate-700 text-red-400 border border-red-500/40 shadow-md cursor-pointer'
                    : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
                }`}
              >
                Bỏ Lượt
              </button>

              {/* Đánh bài button */}
              <button
                onClick={handlePlay}
                disabled={!isMyTurn || selectedCardIds.length === 0}
                className={`font-black px-6 py-2 rounded-xl text-xs sm:text-sm shadow-xl transition flex items-center gap-1.5 ${
                  isMyTurn && selectedCardIds.length > 0
                    ? 'bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 hover:from-yellow-400 hover:to-amber-400 text-slate-950 scale-105 animate-pulse cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>ĐÁNH BÀI ({selectedCardIds.length})</span>
              </button>
            </div>
          )}

          {/* Cards Hand of Player (With pt-7 for translated lifted cards) */}
          <div className="w-full overflow-x-auto overflow-y-visible flex justify-center pb-1">
            <div className="flex -space-x-3 sm:-space-x-5 px-3 pt-6 pb-2">
              {sortedHand.map((card) => {
                const isSelected = selectedCardIds.includes(card.id);
                return (
                  <div
                    key={card.id}
                    className={`transition-transform duration-150 ${
                      isSelected ? '-translate-y-5 z-20' : 'z-0 hover:-translate-y-2'
                    }`}
                  >
                    <CardView
                      card={card}
                      selected={isSelected}
                      onClick={() => toggleSelectCard(card.id)}
                      size="md"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
