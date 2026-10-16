import { Card, ComboInfo, ComboType } from '../../../shared/types.js';
import { CardUtils } from './CardUtils.js';

export class ComboDetector {
  /**
   * Nhận diện tổ hợp bài từ danh sách bài đưa vào
   */
  static detectCombo(rawCards: Card[]): ComboInfo {
    if (!rawCards || rawCards.length === 0) {
      return {
        type: 'INVALID',
        cards: [],
        highestCard: { id: -1, rank: 0, suit: 0 },
        length: 0,
      };
    }

    const cards = CardUtils.sortCards(rawCards);
    const n = cards.length;
    const highestCard = cards[n - 1];

    // 1. Rác (Single)
    if (n === 1) {
      return { type: 'SINGLE', cards, highestCard, length: 1 };
    }

    // 2. Đôi (Pair)
    if (n === 2) {
      if (cards[0].rank === cards[1].rank) {
        return { type: 'PAIR', cards, highestCard, length: 2 };
      }
      return { type: 'INVALID', cards, highestCard, length: 2 };
    }

    // 3. Sám cô (Triple)
    if (n === 3) {
      if (cards[0].rank === cards[1].rank && cards[1].rank === cards[2].rank) {
        return { type: 'TRIPLE', cards, highestCard, length: 3 };
      }
    }

    // 4. Tứ quý (Four of a kind)
    if (n === 4) {
      if (
        cards[0].rank === cards[1].rank &&
        cards[1].rank === cards[2].rank &&
        cards[2].rank === cards[3].rank
      ) {
        return { type: 'FOUR_OF_A_KIND', cards, highestCard, length: 4 };
      }
    }

    // 5. Ba đôi thông (3 consecutive pairs - 6 cards)
    if (n === 6) {
      if (this.isConsecutivePairs(cards, 3)) {
        return { type: 'THREE_CONSECUTIVE_PAIRS', cards, highestCard, length: 6 };
      }
    }

    // 6. Bốn đôi thông (4 consecutive pairs - 8 cards)
    if (n === 8) {
      if (this.isConsecutivePairs(cards, 4)) {
        return { type: 'FOUR_CONSECUTIVE_PAIRS', cards, highestCard, length: 8 };
      }
    }

    // 7. Sảnh (Straight - từ 3 lá trở lên liên tiếp, không bao gồm Heo - rank 12)
    if (n >= 3 && n <= 12) {
      if (this.isStraight(cards)) {
        return { type: 'STRAIGHT', cards, highestCard, length: n };
      }
    }

    return { type: 'INVALID', cards, highestCard, length: n };
  }

  /**
   * Kiểm tra có phải sảnh hợp lệ không (ranks tăng dần đúng 1 đơn vị, không chứa 2)
   */
  private static isStraight(cards: Card[]): boolean {
    for (let i = 0; i < cards.length; i++) {
      // Heo (rank 12 = lá 2) không bao giờ được nằm trong sảnh
      if (cards[i].rank === 12) {
        return false;
      }
      if (i > 0) {
        if (cards[i].rank !== cards[i - 1].rank + 1) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Kiểm tra các cặp đôi liên tiếp (ví dụ 3 đôi thông: 6 lá, 4 đôi thông: 8 lá)
   */
  private static isConsecutivePairs(cards: Card[], pairCount: number): boolean {
    if (cards.length !== pairCount * 2) {
      return false;
    }

    for (let p = 0; p < pairCount; p++) {
      const idx = p * 2;
      // Hai lá trong cùng một đôi phải có cùng rank
      if (cards[idx].rank !== cards[idx + 1].rank) {
        return false;
      }
      // Không được chứa Heo (rank 12)
      if (cards[idx].rank === 12) {
        return false;
      }
      // Đôi sau phải liền kề đôi trước (rank tăng 1)
      if (p > 0) {
        const prevIdx = (p - 1) * 2;
        if (cards[idx].rank !== cards[prevIdx].rank + 1) {
          return false;
        }
      }
    }
    return true;
  }
}
