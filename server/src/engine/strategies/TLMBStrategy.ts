import { Card, ComboInfo, InstantWinType, TablePlay } from '../../../../shared/types.js';
import { CardUtils } from '../CardUtils.js';
import { ComboDetector } from '../ComboDetector.js';
import {
  PlayerEndState,
  RuleStrategy,
  ScoreAdjustment,
  ValidationResult,
} from './RuleStrategy.js';

export class TLMBStrategy implements RuleStrategy {
  validatePlay(
    newPlayCards: Card[],
    currentTablePlay: TablePlay | null,
    isFirstMoveOfGame: boolean,
    requiredFirstCardId?: number
  ): ValidationResult {
    const combo = ComboDetector.detectCombo(newPlayCards);

    if (combo.type === 'INVALID') {
      return { valid: false, reason: 'Tổ hợp bài không hợp lệ theo quy tắc chung!' };
    }

    // Nước bài đầu tiên của ván phải có lá nhỏ nhất
    if (isFirstMoveOfGame && requiredFirstCardId !== undefined) {
      const hasRequiredCard = newPlayCards.some((c) => c.id === requiredFirstCardId);
      if (!hasRequiredCard) {
        return {
          valid: false,
          reason: 'Nước bài đầu tiên của ván bắt buộc phải chứa lá bài nhỏ nhất trên tay bạn!',
        };
      }
    }

    // Kiểm tra tính hợp lệ riêng của Tiến Lên Miền Bắc:
    // Sảnh Miền Bắc PHẢI đồng chất 100%
    if (combo.type === 'STRAIGHT') {
      const firstSuit = combo.cards[0].suit;
      const isMonochromeSuit = combo.cards.every((c) => c.suit === firstSuit);
      if (!isMonochromeSuit) {
        return {
          valid: false,
          reason: 'Luật Miền Bắc: Sảnh (Lốc) bắt buộc phải ĐỒNG CHẤT 100% (cùng 1 chất duy nhất)!',
        };
      }
    }

    // Đôi Miền Bắc PHẢI cùng màu (cùng đỏ hoặc cùng đen)
    if (combo.type === 'PAIR') {
      const c1 = combo.cards[0];
      const c2 = combo.cards[1];
      const sameColor =
        (CardUtils.isRed(c1) && CardUtils.isRed(c2)) ||
        (CardUtils.isBlack(c1) && CardUtils.isBlack(c2));
      if (!sameColor) {
        return {
          valid: false,
          reason: 'Luật Miền Bắc: Bộ đôi bắt buộc phải CÙNG MÀU (cùng màu đỏ hoặc cùng màu đen)!',
        };
      }
    }

    // Không có luật đôi thông trong Miền Bắc truyền thống
    if (
      combo.type === 'THREE_CONSECUTIVE_PAIRS' ||
      combo.type === 'FOUR_CONSECUTIVE_PAIRS'
    ) {
      return {
        valid: false,
        reason: 'Luật Miền Bắc truyền thống không sử dụng tổ hợp Đôi Thông!',
      };
    }

    // Bắt đầu vòng mới -> Cho phép đánh bộ bài hợp lệ
    if (!currentTablePlay || !currentTablePlay.combo || currentTablePlay.combo.type === 'INVALID') {
      return { valid: true, combo };
    }

    const prev = currentTablePlay.combo;
    const curr = combo;

    // 1. CHẶT HEO BẰNG TỨ QUÝ
    // Ở Miền Bắc: Tứ quý chặt được 1 con Heo bất kỳ hoặc Tứ quý nhỏ hơn
    if (curr.type === 'FOUR_OF_A_KIND') {
      if (prev.type === 'SINGLE' && prev.highestCard.rank === 12) {
        return {
          valid: true,
          combo,
          actionMessage: 'Tứ quý Chặt Heo theo luật Miền Bắc!',
        };
      }
      if (prev.type === 'FOUR_OF_A_KIND') {
        if (curr.highestCard.rank > prev.highestCard.rank) {
          return {
            valid: true,
            combo,
            actionMessage: 'Tứ quý đè Tứ quý!',
          };
        }
        return { valid: false, reason: 'Tứ quý của bạn phải lớn hơn Tứ quý trên bàn!' };
      }
    }

    // Nếu không phải tứ quý chặt heo, 2 bộ bài phải cùng loại
    if (curr.type !== prev.type) {
      return {
        valid: false,
        reason: 'Luật Miền Bắc: Bạn phải chặn bằng bộ bài cùng loại!',
      };
    }

    // 2. CHẶN RÁC (SINGLE): Phải cùng chất và lớn hơn
    if (curr.type === 'SINGLE') {
      const currCard = curr.cards[0];
      const prevCard = prev.cards[0];

      // Trường hợp Heo Cơ (2♥) - lá bài lớn nhất thiên hạ
      if (currCard.rank === 12 && currCard.suit === 3) {
        if (prevCard.rank === 12 && prevCard.suit === 3) {
          return { valid: false, reason: 'Không lá bài nào chặn được Heo Cơ (2♥)!' };
        }
        return {
          valid: true,
          combo,
          actionMessage: 'Heo Cơ (2♥) quyền lực nhất thiên hạ!',
        };
      }

      // Đánh Heo đè Heo (Heo lớn chất hơn đè Heo nhỏ chất hơn: Bích < Chuồn < Rô < Cơ)
      if (currCard.rank === 12 && prevCard.rank === 12) {
        if (currCard.suit > prevCard.suit) {
          return {
            valid: true,
            combo,
            actionMessage: `Heo ${CardUtils.getCardName(currCard)} đè Heo ${CardUtils.getCardName(prevCard)}!`,
          };
        }
        return { valid: false, reason: 'Heo của bạn phải có chất lớn hơn!' };
      }

      // Đánh Heo đè bài thường: Heo phải cùng chất hoặc Heo Cơ
      if (currCard.rank === 12 && prevCard.rank < 12) {
        if (currCard.suit === prevCard.suit || currCard.suit === 3) {
          return {
            valid: true,
            combo,
            actionMessage: `Chặt bài bằng Heo ${CardUtils.getCardName(currCard)}!`,
          };
        }
        return {
          valid: false,
          reason: 'Luật Miền Bắc: Heo chặn bài thường phải CÙNG CHẤT (hoặc là Heo Cơ 2♥)!',
        };
      }

      // Chặn bài thường với bài thường: Bắt buộc CÙNG CHẤT và rank lớn hơn
      if (currCard.suit !== prevCard.suit) {
        return {
          valid: false,
          reason: `Luật Miền Bắc: Bài rác phải CÙNG CHẤT! Bài trên bàn là ${CardUtils.getCardName(prevCard)}, bạn phải ra lá chất ${CardUtils.getCardName(prevCard).slice(-1)}.`,
        };
      }

      if (currCard.rank > prevCard.rank) {
        return { valid: true, combo };
      }
      return { valid: false, reason: 'Lá bài của bạn phải có điểm số lớn hơn!' };
    }

    // 3. CHẶN ĐÔI (PAIR): Phải cùng màu và lớn hơn
    if (curr.type === 'PAIR') {
      const prevIsRed = CardUtils.isRed(prev.cards[0]);
      const currIsRed = CardUtils.isRed(curr.cards[0]);

      if (prevIsRed !== currIsRed) {
        return {
          valid: false,
          reason: `Luật Miền Bắc: Đôi chặn phải CÙNG MÀU (${prevIsRed ? 'Màu Đỏ' : 'Màu Đen'})!`,
        };
      }

      if (curr.highestCard.rank > prev.highestCard.rank) {
        return { valid: true, combo };
      }
      return { valid: false, reason: 'Đôi của bạn phải có điểm số lớn hơn!' };
    }

    // 4. CHẶN SÁM (TRIPLE): Điểm số lớn hơn
    if (curr.type === 'TRIPLE') {
      if (curr.highestCard.rank > prev.highestCard.rank) {
        return { valid: true, combo };
      }
      return { valid: false, reason: 'Sám cô của bạn phải có điểm lớn hơn!' };
    }

    // 5. CHẶN SẢNH (STRAIGHT): Cùng độ dài, CÙNG CHẤT 100%, và lá cuối lớn hơn
    if (curr.type === 'STRAIGHT') {
      if (curr.length !== prev.length) {
        return {
          valid: false,
          reason: `Sảnh phải có cùng độ dài (${prev.length} lá)!`,
        };
      }

      // Phải cùng chất với sảnh trên bàn
      if (curr.cards[0].suit !== prev.cards[0].suit) {
        return {
          valid: false,
          reason: 'Luật Miền Bắc: Sảnh chặn bắt buộc phải CÙNG CHẤT với sảnh trên bàn!',
        };
      }

      if (curr.highestCard.rank > prev.highestCard.rank) {
        return { valid: true, combo };
      }
      return { valid: false, reason: 'Sảnh của bạn phải có giá trị cao hơn!' };
    }

    return {
      valid: false,
      reason: 'Nước bài không hợp lệ theo luật Tiến Lên Miền Bắc!',
    };
  }

  checkInstantWin(hand: Card[]): InstantWinType | null {
    if (hand.length !== 13) return null;

    // Tứ quý 2 (4 con Heo)
    const twoCount = hand.filter((c) => c.rank === 12).length;
    if (twoCount === 4) {
      return 'TU_QUY_HAI';
    }

    // Sảnh rồng đồng chất (rất hiếm trong Miền Bắc)
    const sorted = CardUtils.sortCards(hand);
    const firstSuit = sorted[0].suit;
    if (sorted.every((c) => c.suit === firstSuit)) {
      const isDragon = sorted.slice(0, 12).every((c, idx) => c.rank === idx);
      if (isDragon) return 'SANH_RONG';
    }

    return null;
  }

  isGameOverMoveIllegal(
    playedCards: Card[],
    handBeforePlay: Card[]
  ): { illegal: boolean; reason?: string } {
    // Luật Miền Bắc NGHIÊM CẤM TUYỆT ĐỐI về bằng Heo (Thối 2 cuối bài)
    if (playedCards.some((c) => c.rank === 12)) {
      return {
        illegal: true,
        reason: 'Luật Miền Bắc: TUYỆT ĐỐI KHÔNG ĐƯỢC ĐÁNH LÁ 2 (HEO) CUỐI CÙNG ĐỂ VỀ NHẤT (Bị xử Thối 2)!',
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

      // Kiểm tra thối 2 (Heo)
      for (const c of p.remainingCards) {
        if (c.rank === 12) {
          const fine = c.suit === 3 ? bet * 4 : bet * 2; // Heo cơ phạt nặng nhất
          penalty += fine;
          reasons.push(`Thối Heo ${CardUtils.getCardName(c)} (+${fine})`);
        }
      }

      // Thối tứ quý
      const ranksMap = new Map<number, number>();
      for (const c of p.remainingCards) {
        ranksMap.set(c.rank, (ranksMap.get(c.rank) || 0) + 1);
      }
      for (const [rank, count] of ranksMap.entries()) {
        if (count === 4 && rank !== 12) {
          const fine = bet * 4;
          penalty += fine;
          reasons.push(`Thối Tứ quý (+${fine})`);
        }
      }

      // Cóng bài
      if (p.hasNeverPlayed) {
        penalty *= 2;
        reasons.push('CÓNG BÀI (x2)');
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
