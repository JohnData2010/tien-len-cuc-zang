import { Card, ComboInfo, InstantWinType, TablePlay } from '../../../../shared/types.js';

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  combo?: ComboInfo;
  actionMessage?: string; // Ví dụ: "Chặt Heo!", "Bốn đôi thông đỉnh cao!"
}

export interface PlayerEndState {
  playerId: string;
  playerName: string;
  rank: number; // 1, 2, 3, 4
  remainingCards: Card[];
  hasNeverPlayed: boolean; // Cóng (chưa ra được lá nào)
}

export interface ScoreAdjustment {
  playerId: string;
  scoreChange: number;
  reason: string;
}

export interface RuleStrategy {
  /**
   * Thẩm định xem nước bài đánh ra có hợp lệ theo luật hay không
   */
  validatePlay(
    newPlayCards: Card[],
    currentTablePlay: TablePlay | null,
    isFirstMoveOfGame: boolean
  ): ValidationResult;

  /**
   * Kiểm tra bài có tới trắng ngay sau khi chia không
   */
  checkInstantWin(hand: Card[]): InstantWinType | null;

  /**
   * Kiểm tra nước bài về đích có phạm quy không (ví dụ: về bằng 2 ở Miền Bắc hoặc luật cấm thối 2 cuối)
   */
  isGameOverMoveIllegal(
    playedCards: Card[],
    handBeforePlay: Card[]
  ): { illegal: boolean; reason?: string };

  /**
   * Tính toán điểm thưởng phạt (thối heo, thối hàng, cóng) khi ván đấu kết thúc
   */
  calculateEndGameScores(
    players: PlayerEndState[],
    bet: number
  ): ScoreAdjustment[];
}
