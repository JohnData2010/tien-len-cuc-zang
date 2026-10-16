export type Suit = 0 | 1 | 2 | 3; // 0: ♠ (Bích), 1: ♣ (Chuồn), 2: ♦ (Rô), 3: ♥ (Cơ)
export type Rank = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12; // 0: 3, 1: 4, ..., 8: J, 9: Q, 10: K, 11: A, 12: 2

export interface Card {
  id: number; // 0..51
  rank: Rank;
  suit: Suit;
}

export type ComboType =
  | 'INVALID'
  | 'SINGLE' // Rác (1 lá)
  | 'PAIR' // Đôi (2 lá)
  | 'TRIPLE' // Sám cô (3 lá)
  | 'STRAIGHT' // Sảnh (3+ lá liên tiếp)
  | 'FOUR_OF_A_KIND' // Tứ quý
  | 'THREE_CONSECUTIVE_PAIRS' // 3 đôi thông
  | 'FOUR_CONSECUTIVE_PAIRS'; // 4 đôi thông

export interface ComboInfo {
  type: ComboType;
  cards: Card[];
  highestCard: Card;
  length: number;
}

export type RuleMode = 'TLMN' | 'TLMB';

export type InstantWinType =
  | 'SANH_RONG' // 3 đến A (12 lá)
  | 'TU_QUY_HAI' // 4 con Heo
  | 'SAU_DOI_THONG'
  | 'NAM_DOI_THONG'
  | 'DONG_MAU' // 12 hoặc 13 lá cùng màu đỏ hoặc đen
  | 'SAU_DOI'; // 6 đôi bất kỳ

export interface RoomSettings {
  ruleMode: RuleMode;
  maxPlayers: number; // 2..4
  turnTimeLimit: number; // seconds (default: 20)
  bet: number;
  camThoiHaiCuoi: boolean; // Miền Bắc bắt buộc, Miền Nam tùy chọn
}

export interface PlayerPublicInfo {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  cardCount: number;
  passed: boolean;
  rank?: number; // 1, 2, 3, 4
  score: number;
  isBot?: boolean;
}

export interface TablePlay {
  playerId: string;
  playerName: string;
  cards: Card[];
  combo: ComboInfo;
  message?: string; // Ví dụ: "Chặt Heo!", "Bốn đôi thông!"
}

export type GamePhase = 'LOBBY' | 'DEALING' | 'PLAYING' | 'ROUND_END' | 'GAME_OVER';

export interface RoomStateUpdate {
  roomCode: string;
  roomName: string;
  settings: RoomSettings;
  phase: GamePhase;
  players: PlayerPublicInfo[];
  myHand: Card[]; // Server chỉ gửi bài riêng cho player này
  currentTurnPlayerId: string | null;
  lastPlay: TablePlay | null;
  turnTimeRemaining: number;
  starterPlayerId: string | null;
  gameHistory: string[];
  instantWinner?: {
    playerId: string;
    playerName: string;
    winType: InstantWinType;
  };
}

export interface GameOverResult {
  rankings: {
    playerId: string;
    playerName: string;
    rank: number;
    scoreChange: number;
    penaltyDescription?: string;
    remainingCards: Card[];
  }[];
  instantWin?: boolean;
}
