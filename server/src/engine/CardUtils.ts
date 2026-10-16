import { Card, Rank, Suit } from '../../../shared/types.js';

export const SUIT_SYMBOLS: Record<Suit, string> = {
  0: '♠',
  1: '♣',
  2: '♦',
  3: '♥',
};

export const SUIT_NAMES: Record<Suit, string> = {
  0: 'Bích',
  1: 'Chuồn',
  2: 'Rô',
  3: 'Cơ',
};

export const RANK_SYMBOLS: Record<Rank, string> = {
  0: '3',
  1: '4',
  2: '5',
  3: '6',
  4: '7',
  5: '8',
  6: '9',
  7: '10',
  8: 'J',
  9: 'Q',
  10: 'K',
  11: 'A',
  12: '2',
};

export class CardUtils {
  /**
   * Tạo bộ bài 52 lá chuẩn
   */
  static createDeck(): Card[] {
    const deck: Card[] = [];
    for (let r = 0; r <= 12; r++) {
      for (let s = 0; s <= 3; s++) {
        deck.push({
          id: r * 4 + s,
          rank: r as Rank,
          suit: s as Suit,
        });
      }
    }
    return deck;
  }

  /**
   * Xáo bài theo thuật toán Fisher-Yates
   */
  static shuffle(deck: Card[]): Card[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Sắp xếp bài từ nhỏ đến lớn (Rank 3 -> 2, Suit Bích -> Cơ)
   */
  static sortCards(cards: Card[]): Card[] {
    return [...cards].sort((a, b) => {
      if (a.rank !== b.rank) {
        return a.rank - b.rank;
      }
      return a.suit - b.suit;
    });
  }

  /**
   * So sánh 2 lá bài: > 0 nếu a > b, < 0 nếu a < b
   */
  static compareCards(a: Card, b: Card): number {
    if (a.rank !== b.rank) {
      return a.rank - b.rank;
    }
    return a.suit - b.suit;
  }

  /**
   * Kiểm tra lá bài có phải màu đỏ không (Rô ♦ hoặc Cơ ♥)
   */
  static isRed(card: Card): boolean {
    return card.suit === 2 || card.suit === 3;
  }

  /**
   * Kiểm tra lá bài có phải màu đen không (Bích ♠ hoặc Chuồn ♣)
   */
  static isBlack(card: Card): boolean {
    return card.suit === 0 || card.suit === 1;
  }

  /**
   * Text đại diện lá bài (ví dụ: '3♠', '10♦', '2♥')
   */
  static getCardName(card: Card): string {
    return `${RANK_SYMBOLS[card.rank]}${SUIT_SYMBOLS[card.suit]}`;
  }

  /**
   * Tìm lá nhỏ nhất trong bài (thường để tìm 3 Bích = Card ID 0)
   */
  static hasCard(hand: Card[], cardId: number): boolean {
    return hand.some((c) => c.id === cardId);
  }
}
