import { Card, ComboInfo, InstantWinType, TablePlay } from '../../../../shared/types.js';
import { CardUtils } from '../CardUtils.js';
import { ComboDetector } from '../ComboDetector.js';
import {
  PlayerEndState,
  RuleStrategy,
  ScoreAdjustment,
  ValidationResult,
} from './RuleStrategy.js';

export class TLMNStrategy implements RuleStrategy {
  private camThoiHaiCuoi: boolean;

  constructor(camThoiHaiCuoi = false) {
    this.camThoiHaiCuoi = camThoiHaiCuoi;
  }

  validatePlay(
    newPlayCards: Card[],
    currentTablePlay: TablePlay | null,
    isFirstMoveOfGame: boolean
  ): ValidationResult {
    const combo = ComboDetector.detectCombo(newPlayCards);

    if (combo.type === 'INVALID') {
      return { valid: false, reason: 'Tổ hợp bài không hợp lệ!' };
    }

    // Nước bài đầu tiên của ván phải có 3 Bích (Card ID = 0: Rank 0, Suit 0)
    if (isFirstMoveOfGame) {
      const hasThreeSpades = newPlayCards.some((c) => c.rank === 0 && c.suit === 0);
      if (!hasThreeSpades) {
        return {
          valid: false,
          reason: 'Nước bài đầu tiên của ván bắt buộc phải chứa 3 Bích (3♠)!',
        };
      }
    }

    // Bắt đầu vòng mới (bàn trống) -> Bất kỳ tổ hợp hợp lệ nào cũng được đánh
    if (!currentTablePlay || !currentTablePlay.combo || currentTablePlay.combo.type === 'INVALID') {
      return { valid: true, combo };
    }

    const prev = currentTablePlay.combo;
    const curr = combo;

    // 1. Cùng loại tổ hợp bài
    if (curr.type === prev.type) {
      if (curr.type === 'SINGLE' || curr.type === 'PAIR') {
        if (CardUtils.compareCards(curr.highestCard, prev.highestCard) > 0) {
          const actionMsg =
            prev.highestCard.rank === 12
              ? `Chặt Heo (${CardUtils.getCardName(curr.highestCard)} chặt ${CardUtils.getCardName(prev.highestCard)})!`
              : undefined;
          return { valid: true, combo, actionMessage: actionMsg };
        }
        return { valid: false, reason: 'Bài của bạn phải lớn hơn bài trên bàn!' };
      }

      if (curr.type === 'TRIPLE') {
        if (curr.highestCard.rank > prev.highestCard.rank) {
          return { valid: true, combo };
        }
        return { valid: false, reason: 'Sám cô của bạn phải có điểm lớn hơn!' };
      }

      if (curr.type === 'STRAIGHT') {
        if (curr.length !== prev.length) {
          return {
            valid: false,
            reason: `Sảnh của bạn phải có cùng độ dài (${prev.length} lá) với sảnh trên bàn!`,
          };
        }
        if (CardUtils.compareCards(curr.highestCard, prev.highestCard) > 0) {
          return { valid: true, combo };
        }
        return { valid: false, reason: 'Lá cuối sảnh của bạn phải lớn hơn sảnh trên bàn!' };
      }

      if (curr.type === 'FOUR_OF_A_KIND') {
        if (curr.highestCard.rank > prev.highestCard.rank) {
          return {
            valid: true,
            combo,
            actionMessage: 'Tứ quý đè Tứ quý! Đỉnh cao!',
          };
        }
        return { valid: false, reason: 'Tứ quý của bạn phải lớn hơn Tứ quý trên bàn!' };
      }

      if (curr.type === 'THREE_CONSECUTIVE_PAIRS' || curr.type === 'FOUR_CONSECUTIVE_PAIRS') {
        if (CardUtils.compareCards(curr.highestCard, prev.highestCard) > 0) {
          return {
            valid: true,
            combo,
            actionMessage: `${curr.type === 'THREE_CONSECUTIVE_PAIRS' ? 'Ba' : 'Bốn'} đôi thông đè!`,
          };
        }
        return { valid: false, reason: 'Đôi thông của bạn phải lớn hơn đôi thông trên bàn!' };
      }
    }

    // 2. Các quy tắc "CHẶT HÀNG" đặc biệt trong Tiến Lên Miền Nam

    // A. Chặt 1 con Heo (prev là SINGLE có rank 12)
    if (prev.type === 'SINGLE' && prev.highestCard.rank === 12) {
      if (curr.type === 'THREE_CONSECUTIVE_PAIRS') {
        return {
          valid: true,
          combo,
          actionMessage: 'Ba đôi thông Chặt Heo!',
        };
      }
      if (curr.type === 'FOUR_OF_A_KIND') {
        return {
          valid: true,
          combo,
          actionMessage: 'Tứ quý Chặt Heo!',
        };
      }
      if (curr.type === 'FOUR_CONSECUTIVE_PAIRS') {
        return {
          valid: true,
          combo,
          actionMessage: 'Bốn đôi thông Chặt Heo!',
        };
      }
    }

    // B. Chặt đôi Heo (prev là PAIR có rank 12)
    if (prev.type === 'PAIR' && prev.highestCard.rank === 12) {
      if (curr.type === 'FOUR_CONSECUTIVE_PAIRS') {
        return {
          valid: true,
          combo,
          actionMessage: 'Bốn đôi thông Chặt Đôi Heo!',
        };
      }
      if (curr.type === 'FOUR_OF_A_KIND') {
        return {
          valid: false,
          reason: 'Trong luật chuẩn TLMN, 1 Tứ quý không chặt được đôi Heo (cần Bốn đôi thông)!',
        };
      }
    }

    // C. Chặt 3 đôi thông (prev là THREE_CONSECUTIVE_PAIRS)
    if (prev.type === 'THREE_CONSECUTIVE_PAIRS') {
      if (curr.type === 'FOUR_OF_A_KIND') {
        return {
          valid: true,
          combo,
          actionMessage: 'Tứ quý Chặt Ba đôi thông!',
        };
      }
      if (curr.type === 'FOUR_CONSECUTIVE_PAIRS') {
        return {
          valid: true,
          combo,
          actionMessage: 'Bốn đôi thông Chặt Ba đôi thông!',
        };
      }
    }

    // D. Chặt Tứ quý (prev là FOUR_OF_A_KIND)
    if (prev.type === 'FOUR_OF_A_KIND') {
      if (curr.type === 'FOUR_CONSECUTIVE_PAIRS') {
        return {
          valid: true,
          combo,
          actionMessage: 'Bốn đôi thông Chặt Tứ quý!',
        };
      }
    }

    return {
      valid: false,
      reason: 'Bộ bài này không chặt được bài trên bàn theo luật Miền Nam!',
    };
  }

  checkInstantWin(hand: Card[]): InstantWinType | null {
    if (hand.length !== 13) return null;

    const sorted = CardUtils.sortCards(hand);

    // 1. Tứ quý 2 (4 con Heo)
    const twoCount = sorted.filter((c) => c.rank === 12).length;
    if (twoCount === 4) {
      return 'TU_QUY_HAI';
    }

    // 2. Sảnh rồng: 12 hoặc 13 lá liên tiếp từ 3 đến A (rank 0 đến 11)
    const uniqueRanks = Array.from(new Set(sorted.map((c) => c.rank)));
    const hasDragon = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].every((r) =>
      uniqueRanks.includes(r as any)
    );
    if (hasDragon) {
      return 'SANH_RONG';
    }

    // 3. Đồng màu: 12 hoặc 13 lá cùng màu đỏ hoặc đen
    const redCount = sorted.filter(CardUtils.isRed).length;
    const blackCount = sorted.filter(CardUtils.isBlack).length;
    if (redCount >= 12 || blackCount >= 12) {
      return 'DONG_MAU';
    }

    // 4. 6 đôi bất kỳ hoặc đôi thông
    // Đếm số đôi
    const rankCounts = new Map<number, number>();
    for (const c of sorted) {
      rankCounts.set(c.rank, (rankCounts.get(c.rank) || 0) + 1);
    }

    let pairsCount = 0;
    const pairRanks: number[] = [];
    for (const [r, count] of rankCounts.entries()) {
      if (count >= 2) {
        pairsCount += Math.floor(count / 2);
        pairRanks.push(r);
      }
    }

    if (pairsCount >= 6) {
      // Kiểm tra xem có phải 6 đôi thông không
      pairRanks.sort((a, b) => a - b);
      let consecutive = 1;
      let maxConsecutive = 1;
      for (let i = 1; i < pairRanks.length; i++) {
        if (pairRanks[i] === pairRanks[i - 1] + 1 && pairRanks[i] !== 12) {
          consecutive++;
          if (consecutive > maxConsecutive) maxConsecutive = consecutive;
        } else {
          consecutive = 1;
        }
      }

      if (maxConsecutive >= 6) return 'SAU_DOI_THONG';
      if (maxConsecutive >= 5) return 'NAM_DOI_THONG';
      return 'SAU_DOI';
    }

    return null;
  }

  isGameOverMoveIllegal(
    playedCards: Card[],
    handBeforePlay: Card[]
  ): { illegal: boolean; reason?: string } {
    if (!this.camThoiHaiCuoi) {
      return { illegal: false };
    }

    // Nếu cấu hình cấm thối 2 cuối: nước bài về đích không được chứa 2
    if (playedCards.some((c) => c.rank === 12)) {
      return {
        illegal: true,
        reason: 'Phạm luật: Không được đánh lá số 2 (Heo) cuối cùng để về Nhất (Thối 2)!',
      };
    }

    return { illegal: false };
  }

  calculateEndGameScores(
    players: PlayerEndState[],
    bet: number
  ): ScoreAdjustment[] {
    const adjustments: ScoreAdjustment[] = [];
    const winner = players.find((p) => p.rank === 1);

    if (!winner) return adjustments;

    let totalWinnerEarn = 0;

    for (const p of players) {
      if (p.playerId === winner.playerId) continue;

      let penalty = 0;
      const reasons: string[] = [];

      // Phạt theo số lá còn lại trên tay
      const cardPenalty = p.remainingCards.length * bet;
      penalty += cardPenalty;
      reasons.push(`${p.remainingCards.length} lá (${cardPenalty})`);

      // Kiểm tra thối Heo / Hàng
      for (const c of p.remainingCards) {
        if (c.rank === 12) {
          // Heo đen (Bích, Chuồn): phạt 2 lần cược
          // Heo đỏ (Rô, Cơ): phạt 4 lần cược
          const isRed = CardUtils.isRed(c);
          const heoFine = isRed ? bet * 4 : bet * 2;
          penalty += heoFine;
          reasons.push(`Thối Heo ${isRed ? 'Đỏ' : 'Đen'} (${CardUtils.getCardName(c)})`);
        }
      }

      // Thối tứ quý trong bài
      const ranksMap = new Map<number, number>();
      for (const c of p.remainingCards) {
        ranksMap.set(c.rank, (ranksMap.get(c.rank) || 0) + 1);
      }
      for (const [rank, count] of ranksMap.entries()) {
        if (count === 4 && rank !== 12) {
          const fine = bet * 6;
          penalty += fine;
          reasons.push(`Thối Tứ quý (+${fine})`);
        }
      }

      // Cóng (chưa đánh được lá nào)
      if (p.hasNeverPlayed) {
        penalty *= 2;
        reasons.push('BỊ CÓNG (x2 phạt)');
      }

      adjustments.push({
        playerId: p.playerId,
        scoreChange: -penalty,
        reason: reasons.join(', '),
      });

      totalWinnerEarn += penalty;
    }

    adjustments.push({
      playerId: winner.playerId,
      scoreChange: totalWinnerEarn,
      reason: 'Về Nhất!',
    });

    return adjustments;
  }
}
