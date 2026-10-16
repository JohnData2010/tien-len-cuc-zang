import React, { useState } from 'react';
import { RuleMode, RoomSettings } from '../../../shared/types';
import { Crown, Play, Users, Clock, ShieldCheck, Flame } from 'lucide-react';

interface LobbyViewProps {
  playerName: string;
  setPlayerName: (name: string) => void;
  avatar: string;
  setAvatar: (avatar: string) => void;
  onCreateRoom: (settings: RoomSettings) => void;
  onJoinRoom: (roomCode: string) => void;
  isConnecting: boolean;
}

const AVATARS = ['👑', '🐯', '🐱', '🐼', '🦊', '🦁', '🦄', '💎'];

export const LobbyView: React.FC<LobbyViewProps> = ({
  playerName,
  setPlayerName,
  avatar,
  setAvatar,
  onCreateRoom,
  onJoinRoom,
  isConnecting,
}) => {
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [ruleMode, setRuleMode] = useState<RuleMode>('TLMN');
  const [maxPlayers, setMaxPlayers] = useState<number>(4);
  const [turnTimeLimit, setTurnTimeLimit] = useState<number>(20);
  const [bet, setBet] = useState<number>(5000);
  const [camThoiHaiCuoi, setCamThoiHaiCuoi] = useState<boolean>(true);

  const handleCreate = () => {
    if (!playerName.trim()) return alert('Vui lòng nhập tên của bạn!');
    onCreateRoom({
      ruleMode,
      maxPlayers,
      turnTimeLimit,
      bet,
      camThoiHaiCuoi: ruleMode === 'TLMB' ? true : camThoiHaiCuoi,
    });
  };

  const handleJoin = () => {
    if (!playerName.trim()) return alert('Vui lòng nhập tên của bạn!');
    if (!roomCodeInput.trim()) return alert('Vui lòng nhập mã phòng!');
    onJoinRoom(roomCodeInput.trim().toUpperCase());
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Game Logo & Title */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 via-yellow-400/30 to-amber-500/20 border border-amber-400/50 px-4 py-1.5 rounded-full mb-3 shadow-lg">
          <Crown className="w-5 h-5 text-amber-400 animate-bounce" />
          <span className="text-amber-300 font-bold tracking-wider text-sm uppercase">
            Game Bài Đa Nền Tảng Online
          </span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-amber-400 to-yellow-600 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
          TIẾN LÊN CỤC ZÀNG
        </h1>
        <p className="text-slate-300 text-sm sm:text-base mt-2 font-medium">
          Hỗ trợ trọn vẹn cả <span className="text-amber-400 font-bold">Tiến Lên Miền Nam</span> & <span className="text-red-400 font-bold">Tiến Lên Miền Bắc</span>
        </p>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-5 bg-slate-900/90 border border-amber-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-amber-300 mb-4 flex items-center gap-2">
              <span>👤</span> Hồ Sơ Người Chơi
            </h2>

            <label className="block text-xs text-slate-400 font-semibold mb-1">
              Biệt Danh (Tên Hiển Thị)
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Nhập tên..."
              className="w-full bg-slate-800 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-3 text-white font-bold outline-none mb-5"
              maxLength={15}
            />

            <label className="block text-xs text-slate-400 font-semibold mb-2">
              Chọn Avatar Vui Nhộn
            </label>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {AVATARS.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setAvatar(av)}
                  className={`text-2xl p-2.5 rounded-xl transition-all ${
                    avatar === av
                      ? 'bg-amber-500/30 border-2 border-amber-400 scale-105 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800/80 border border-slate-700 hover:bg-slate-700/80'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Join By Room Code */}
          <div className="pt-4 border-t border-slate-800">
            <label className="block text-xs text-slate-400 font-semibold mb-1">
              Tham Gia Bằng Mã Bàn
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value)}
                placeholder="VD: ZANG88"
                className="flex-1 uppercase bg-slate-800 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2.5 text-center font-bold tracking-widest outline-none"
                maxLength={8}
              />
              <button
                type="button"
                onClick={handleJoin}
                disabled={isConnecting}
                className="bg-emerald-600 hover:bg-emerald-500 font-bold px-5 py-2.5 rounded-xl transition shadow-lg flex items-center gap-1.5"
              >
                <span>Vào Bàn</span>
              </button>
            </div>
          </div>
        </div>

        {/* Create Room Card */}
        <div className="md:col-span-7 bg-slate-900/90 border border-amber-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
          <h2 className="text-xl font-bold text-amber-300 mb-4 flex items-center gap-2">
            <span>🎲</span> Thiết Lập Bàn Chơi Mới
          </h2>

          {/* Rule Selector */}
          <div className="mb-4">
            <label className="block text-xs text-slate-400 font-semibold mb-1.5">
              Chọn Luật Chơi
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRuleMode('TLMN')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  ruleMode === 'TLMN'
                    ? 'bg-gradient-to-r from-amber-600/30 to-amber-500/10 border-amber-400 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-800/60 border-slate-700 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Tiến Lên Miền Nam</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Tự do, không đồng chất. 3-4 đôi thông & Tứ quý chặt heo.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRuleMode('TLMB')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  ruleMode === 'TLMB'
                    ? 'bg-gradient-to-r from-red-600/30 to-red-500/10 border-red-400 shadow-lg shadow-red-500/10'
                    : 'bg-slate-800/60 border-slate-700 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-red-300">
                  <ShieldCheck className="w-4 h-4 text-red-400" />
                  <span>Tiến Lên Miền Bắc</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Đồng chất đồng màu nghiêm ngặt. Sảnh 1 chất. Cấm về bằng Heo.
                </p>
              </button>
            </div>
          </div>

          {/* Room Settings Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-1">
                <Users className="w-3.5 h-3.5" /> Số Người Chơi
              </label>
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold outline-none"
              >
                <option value={2}>2 Người (Solo Đối Kháng)</option>
                <option value={3}>3 Người</option>
                <option value={4}>4 Người (Tiêu Chuẩn)</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-1">
                <Clock className="w-3.5 h-3.5" /> Thời Gian Lượt Đánh
              </label>
              <select
                value={turnTimeLimit}
                onChange={(e) => setTurnTimeLimit(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold outline-none"
              >
                <option value={0}>Không Giới Hạn (Thong Thả)</option>
                <option value={15}>15 Giây (Nhanh)</option>
                <option value={20}>20 Giây (Vừa Phải)</option>
                <option value={30}>30 Giây (Thư Thả)</option>
                <option value={60}>60 Giây (Nhiều Thời Gian)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-1">
                Mức Cược (Điểm / Xu)
              </label>
              <select
                value={bet}
                onChange={(e) => setBet(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold outline-none"
              >
                <option value={1000}>1.000 Xu</option>
                <option value={5000}>5.000 Xu</option>
                <option value={10000}>10.000 Xu</option>
                <option value={50000}>50.000 Xu</option>
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer bg-slate-800/80 border border-slate-700 rounded-xl p-2.5">
                <input
                  type="checkbox"
                  checked={ruleMode === 'TLMB' ? true : camThoiHaiCuoi}
                  disabled={ruleMode === 'TLMB'}
                  onChange={(e) => setCamThoiHaiCuoi(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-200">
                  Cấm Thối 2 Cuối Bài
                </span>
              </label>
            </div>
          </div>

          {/* Create Button */}
          <button
            type="button"
            onClick={handleCreate}
            disabled={isConnecting}
            className="w-full mt-2 bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-black text-lg py-3.5 rounded-xl shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>TẠO BÀN CHƠI NGAY</span>
          </button>
        </div>
      </div>
    </div>
  );
};
