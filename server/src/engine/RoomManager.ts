import { Server } from 'socket.io';
import { RoomSettings } from '../../../shared/types.js';
import { GameRoom } from './GameRoom.js';

export class RoomManager {
  private rooms: Map<string, GameRoom> = new Map();
  private playerToRoom: Map<string, string> = new Map();
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  public createRoom(
    hostId: string,
    socketId: string,
    hostName: string,
    avatar: string,
    settings: RoomSettings
  ): GameRoom {
    let roomCode = this.generateRoomCode();
    while (this.rooms.has(roomCode)) {
      roomCode = this.generateRoomCode();
    }

    const roomName = `Bàn Cục Zàng #${roomCode}`;
    const room = new GameRoom(roomCode, roomName, settings, () => {
      this.broadcastRoomState(roomCode);
    });

    room.addPlayer(hostId, socketId, hostName, avatar);
    this.rooms.set(roomCode, room);
    this.playerToRoom.set(hostId, roomCode);

    return room;
  }

  public joinRoom(
    roomCode: string,
    playerId: string,
    socketId: string,
    playerName: string,
    avatar: string
  ): { success: boolean; room?: GameRoom; error?: string } {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) {
      return { success: false, error: 'Không tìm thấy phòng chơi này!' };
    }

    if (room.phase !== 'LOBBY' && !room.players.has(playerId)) {
      return { success: false, error: 'Bàn chơi đang trong trận, không thể tham gia!' };
    }

    const added = room.addPlayer(playerId, socketId, playerName, avatar);
    if (!added) {
      return { success: false, error: 'Bàn chơi đã đầy người (tối đa 4 người)!' };
    }

    this.playerToRoom.set(playerId, room.roomCode);
    return { success: true, room };
  }

  public getRoomByPlayer(playerId: string): GameRoom | undefined {
    const code = this.playerToRoom.get(playerId);
    if (!code) return undefined;
    return this.rooms.get(code);
  }

  public getRoom(roomCode: string): GameRoom | undefined {
    return this.rooms.get(roomCode.toUpperCase());
  }

  public setPlayerRoom(playerId: string, roomCode: string) {
    this.playerToRoom.set(playerId, roomCode.toUpperCase());
  }

  public leaveRoom(playerId: string) {
    const code = this.playerToRoom.get(playerId);
    if (!code) return;

    const room = this.rooms.get(code);
    if (room) {
      room.removePlayer(playerId);
      if (room.players.size === 0) {
        // Hủy phòng nếu không còn ai
        this.rooms.delete(code);
      }
    }
    this.playerToRoom.delete(playerId);
  }

  public addBotToRoom(roomCode: string): { success: boolean; error?: string } {
    const room = this.rooms.get(roomCode);
    if (!room) return { success: false, error: 'Không tìm thấy phòng' };
    if (room.phase !== 'LOBBY') return { success: false, error: 'Chỉ thêm Bot trong sảnh chờ' };

    const botNumber = room.players.size + 1;
    const botId = `bot_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const botName = `Bot Cục Zàng #${botNumber}`;
    const botAvatar = `🤖`;

    const added = room.addPlayer(botId, 'bot_socket', botName, botAvatar, true);
    if (!added) return { success: false, error: 'Phòng đã đầy!' };

    return { success: true };
  }

  public broadcastRoomState(roomCode: string) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    // Gửi state đã được mã hóa cách ly bài riêng cho từng player
    for (const player of room.players.values()) {
      if (!player.isBot && player.socketId) {
        const state = room.getStateForPlayer(player.id);
        this.io.to(player.socketId).emit('room_state_update', state);
      }
    }
  }
}
