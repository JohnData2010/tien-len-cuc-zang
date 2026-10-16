import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { RoomManager } from './engine/RoomManager.js';
import { RoomSettings } from '../../shared/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const roomManager = new RoomManager(io);

// Health check endpoint cho Render và Uptime monitoring
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    game: 'Tiến Lên Cục Zàng',
    serverTime: new Date().toISOString(),
  });
});

import fs from 'fs';

// Phục vụ frontend tĩnh sau khi build trong production
const possiblePaths = [
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(__dirname, '../../../../client/dist'),
  path.resolve(__dirname, '../../client/dist'),
];
const clientDistPath = possiblePaths.find((p) => fs.existsSync(p)) || possiblePaths[0];
app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('Game Server Tiến Lên Cục Zàng đang chạy! Hãy build client để vào bàn chơi.');
    }
  });
});

// Xử lý các kết nối WebSocket realtime
io.on('connection', (socket) => {
  let boundPlayerId: string | null = null;

  socket.on('create_room', ({ playerId, playerName, avatar, settings }: {
    playerId: string;
    playerName: string;
    avatar: string;
    settings: RoomSettings;
  }) => {
    boundPlayerId = playerId;
    const room = roomManager.createRoom(playerId, socket.id, playerName, avatar, settings);
    socket.emit('room_created', { roomCode: room.roomCode });
    roomManager.broadcastRoomState(room.roomCode);
  });

  socket.on('join_room', ({ roomCode, playerId, playerName, avatar }: {
    roomCode: string;
    playerId: string;
    playerName: string;
    avatar: string;
  }) => {
    boundPlayerId = playerId;
    const result = roomManager.joinRoom(roomCode, playerId, socket.id, playerName, avatar);
    if (!result.success) {
      socket.emit('action_error', { message: result.error });
    } else if (result.room) {
      socket.emit('room_joined', { roomCode: result.room.roomCode });
      roomManager.broadcastRoomState(result.room.roomCode);
    }
  });

  socket.on('register_player', ({ playerId, roomCode }: { playerId: string; roomCode?: string }) => {
    boundPlayerId = playerId;
    let room = roomCode ? roomManager.getRoom(roomCode) : undefined;
    if (!room) {
      room = roomManager.getRoomByPlayer(playerId);
    }
    if (room && room.players.has(playerId)) {
      const p = room.players.get(playerId)!;
      p.socketId = socket.id;
      roomManager.setPlayerRoom(playerId, room.roomCode);
      socket.emit('room_state_update', room.getStateForPlayer(playerId));
    }
  });

  socket.on('ready', (data: { playerId?: string; ready: boolean }) => {
    const pid = data.playerId || boundPlayerId;
    if (!pid) return;
    const room = roomManager.getRoomByPlayer(pid);
    if (room) {
      const player = room.players.get(pid);
      if (player) player.socketId = socket.id;
      room.setReady(pid, data.ready);
    }
  });

  socket.on('update_settings', (data: { playerId?: string; settings: Partial<RoomSettings> }) => {
    const pid = data.playerId || boundPlayerId;
    if (!pid) return;
    const room = roomManager.getRoomByPlayer(pid);
    if (room) {
      const player = room.players.get(pid);
      if (player) player.socketId = socket.id;
      if (player?.isHost) {
        room.updateSettings(data.settings);
      }
    }
  });

  socket.on('start_game', (data?: { playerId?: string }) => {
    const pid = data?.playerId || boundPlayerId;
    if (!pid) return;
    const room = roomManager.getRoomByPlayer(pid);
    if (room) {
      const player = room.players.get(pid);
      if (player) player.socketId = socket.id;
      if (!player?.isHost) {
        socket.emit('action_error', { message: 'Chỉ có Chủ phòng mới có quyền bắt đầu ván!' });
        return;
      }
      const startResult = room.startGame();
      if (!startResult.success) {
        socket.emit('action_error', { message: startResult.error });
      }
    }
  });

  socket.on('play_cards', (data: { playerId?: string; cardIds: number[] }) => {
    const pid = data.playerId || boundPlayerId;
    if (!pid) {
      socket.emit('action_error', { message: 'Mất kết nối người chơi, vui lòng tải lại trang!' });
      return;
    }
    const room = roomManager.getRoomByPlayer(pid);
    if (room) {
      const player = room.players.get(pid);
      if (player) player.socketId = socket.id;
      const playResult = room.playCards(pid, data.cardIds);
      if (!playResult.success) {
        socket.emit('action_error', { message: playResult.error });
      }
    }
  });

  socket.on('pass_turn', (data?: { playerId?: string }) => {
    const pid = data?.playerId || boundPlayerId;
    if (!pid) return;
    const room = roomManager.getRoomByPlayer(pid);
    if (room) {
      const player = room.players.get(pid);
      if (player) player.socketId = socket.id;
      const passResult = room.passTurn(pid);
      if (!passResult.success) {
        socket.emit('action_error', { message: passResult.error });
      }
    }
  });

  socket.on('add_bot', (data?: { playerId?: string }) => {
    const pid = data?.playerId || boundPlayerId;
    if (!pid) return;
    const room = roomManager.getRoomByPlayer(pid);
    if (room) {
      const player = room.players.get(pid);
      if (player) player.socketId = socket.id;
      if (!player?.isHost) {
        socket.emit('action_error', { message: 'Chỉ Chủ phòng mới có quyền thêm Bot!' });
        return;
      }
      const botRes = roomManager.addBotToRoom(room.roomCode);
      if (!botRes.success) {
        socket.emit('action_error', { message: botRes.error });
      } else {
        roomManager.broadcastRoomState(room.roomCode);
      }
    }
  });

  socket.on('leave_room', (data?: { playerId?: string }) => {
    const pid = data?.playerId || boundPlayerId;
    if (pid) {
      roomManager.leaveRoom(pid);
      boundPlayerId = null;
    }
  });

  socket.on('disconnect', () => {
    // Để tránh kick người chơi khi refresh trình duyệt, chúng ta không xóa ngay lập tức
    // Người chơi có thể reconnect lại bằng cùng playerId
  });
});

const PORT = Number(process.env.PORT) || 10000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`===============================================`);
  console.log(`🏆 GAME TIẾN LÊN CỤC ZÀNG SERVER IS ONLINE!`);
  console.log(`🚀 Port: ${PORT}`);
  console.log(`🌐 Ready for Render Deployment & Local Pairing`);
  console.log(`===============================================`);
});
