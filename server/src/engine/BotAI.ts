import { Card, TablePlay } from '../../../shared/types.js';
import { CardUtils } from './CardUtils.js';
import { ComboDetector } from './ComboDetector.js';
import { RuleStrategy } from './strategies/RuleStrategy.js';

export class BotAI {
  /**
   * Quyết định nước đi thông minh và đa dạng cho Bot (Đôi, Sảnh, Sám cô, Tứ quý, Đôi thông, Rác)
   */
  static findMove(
    botHand: Card[],
    lastPlay: TablePlay | null,
    strategy: RuleStrategy,
    isFirstMoveOfGame: boolean,
    requiredFirstCardId?: number
  ): number[] | null {
    if (!botHand || botHand.length === 0) return null;

    const sorted = CardUtils.sortCards(botHand);

    // 1. TRƯỜNG HỢP: BẮT ĐẦU VÒNG MỚI (BÀN TRỐNG / ĐƯỢC QUYỀN ĐÁNH TỰ DO)
    if (!lastPlay || !lastPlay.combo || lastPlay.combo.type === 'INVALID') {
      return this.chooseLeadingMove(
        sorted,
        strategy,
        isFirstMoveOfGame,
        requiredFirstCardId
      );
    }

    // 2. TRƯỜNG HỢP: CHẶN BÀI TRÊN BÀN (THEO BỘ CÙNG LOẠI HOẶC CHẶT HEO/HÀNG)
    return this.chooseBlockingMove(sorted, lastPlay, strategy);
  }

  /**
   * Chọn nước bài để mở đầu vòng mới (Ưu tiên đa dạng: Sảnh, Đôi, Sám, Rác)
   */
  private static chooseLeadingMove(
    sorted: Card[],
    strategy: RuleStrategy,
    isFirstMoveOfGame: boolean,
    requiredFirstCardId?: number
  ): number[] | null {
    const allCandidates = this.extractAllCombos(sorted);

    // Lọc các nước hợp lệ theo luật (đặc biệt nước đầu tiên có lá nhỏ nhất)
    const validCandidates = allCandidates.filter((cards) => {
      const val = strategy.validatePlay(
        cards,
        null,
        isFirstMoveOfGame,
        requiredFirstCardId
      );
      return val.valid;
    });

    if (validCandidates.length === 0) {
      // Trường hợp dự phòng: đánh lá nhỏ nhất
      return [sorted[0].id];
    }

    // Phân loại các nhóm tổ hợp bài bot đang cầm
    const straights = validCandidates.filter(
      (c) => ComboDetector.detectCombo(c).type === 'STRAIGHT'
    );
    const pairs = validCandidates.filter(
      (c) => ComboDetector.detectCombo(c).type === 'PAIR'
    );
    const triples = validCandidates.filter(
      (c) => ComboDetector.detectCombo(c).type === 'TRIPLE'
    );
    const consecutivePairs = validCandidates.filter(
      (c) =>
        ComboDetector.detectCombo(c).type === 'THREE_CONSECUTIVE_PAIRS' ||
        ComboDetector.detectCombo(c).type === 'FOUR_CONSECUTIVE_PAIRS'
    );
    const singles = validCandidates.filter(
      (c) => ComboDetector.detectCombo(c).type === 'SINGLE'
    );

    // Trọng số ngẫu nhiên giúp Bot đánh cực kỳ đa dạng và khó đoán
    const rand = Math.random();

    // 35% xác suất đánh Đôi nếu có đôi (không phải đôi Heo)
    const lowPairs = pairs.filter((p) => p[0].rank < 12);
    if (lowPairs.length > 0 && rand < 0.35) {
      return lowPairs[0].map((c) => c.id);
    }

    // 25% xác suất đánh Sảnh nếu có sảnh dài (để xả nhiều bài)
    if (straights.length > 0 && rand < 0.6) {
      // Ưu tiên sảnh dài nhất hoặc nhỏ nhất
      return straights[0].map((c) => c.id);
    }

    // 15% xác suất đánh Sám cô
    const lowTriples = triples.filter((t) => t[0].rank < 12);
    if (lowTriples.length > 0 && rand < 0.75) {
      return lowTriples[0].map((c) => c.id);
    }

    // 5% xác suất đánh Đôi thông nếu có
    if (consecutivePairs.length > 0 && rand < 0.8) {
      return consecutivePairs[0].map((c) => c.id);
    }

    // Còn lại: Đánh lá rác nhỏ nhất (tránh đánh Heo ngay đầu vòng)
    const nonHeoSingles = singles.filter((s) => s[0].rank < 12);
    if (nonHeoSingles.length > 0) {
      return [nonHeoSingles[0][0].id];
    }

    // Nếu chỉ còn đôi hoặc lá cao: chọn nước đầu tiên trong danh sách hợp lệ
    return validCandidates[0].map((c) => c.id);
  }

  /**
   * Chọn nước bài để chặn bài trên bàn
   */
  private static chooseBlockingMove(
    sorted: Card[],
    lastPlay: TablePlay,
    strategy: RuleStrategy
  ): number[] | null {
    const allCandidates = this.extractAllCombos(sorted);

    // Lọc những tổ hợp có thể chặn được bài trên bàn
    const validBlockers = allCandidates.filter((cards) => {
      const val = strategy.validatePlay(cards, lastPlay, false);
      return val.valid;
    });

    if (validBlockers.length === 0) {
      return null; // Không có bài chặn -> Bỏ lượt
    }

    // Sắp xếp các nước chặn từ nhỏ đến lớn (tiết kiệm bài, không lãng phí bài cao)
    validBlockers.sort((a, b) => {
      const comboA = ComboDetector.detectCombo(a);
      const comboB = ComboDetector.detectCombo(b);

      // Ưu tiên không dùng Heo nếu có bài thường chặn được
      const hasHeoA = a.some((c) => c.rank === 12);
      const hasHeoB = b.some((c) => c.rank === 12);
      if (!hasHeoA && hasHeoB) return -1;
      if (hasHeoA && !hasHeoB) return 1;

      // So sánh lá cao nhất
      return CardUtils.compareCards(comboA.highestCard, comboB.highestCard);
    });

    // Chọn nước chặn nhỏ nhất hợp lệ
    return validBlockers[0].map((c) => c.id);
  }

  /**
   * Trích xuất tất cả các tổ hợp có thể đánh từ bộ bài trên tay
   */
  private static extractAllCombos(sorted: Card[]): Card[][] {
    const combos: Card[][] = [];

    // 1. Tất cả các lá đơn (Rác)
    for (const card of sorted) {
      combos.push([card]);
    }

    // 2. Tất cả các Đôi (Pairs)
    for (let i = 0; i < sorted.length - 1; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        if (sorted[i].rank === sorted[j].rank) {
          combos.push([sorted[i], sorted[j]]);
        }
      }
    }

    // 3. Tất cả các Sám cô (Triples)
    for (let i = 0; i < sorted.length - 2; i++) {
      if (
        sorted[i].rank === sorted[i + 1].rank &&
        sorted[i].rank === sorted[i + 2].rank
      ) {
        combos.push([sorted[i], sorted[i + 1], sorted[i + 2]]);
      }
    }

    // 4. Tất cả các Tứ quý (Four of a kind)
    for (let i = 0; i < sorted.length - 3; i++) {
      if (
        sorted[i].rank === sorted[i + 1].rank &&
        sorted[i].rank === sorted[i + 2].rank &&
        sorted[i].rank === sorted[i + 3].rank
      ) {
        combos.push([sorted[i], sorted[i + 1], sorted[i + 2], sorted[i + 3]]);
      }
    }

    // 5. Tất cả các Sảnh (Straights từ 3 đến 12 lá)
    const noHeo = sorted.filter((c) => c.rank < 12);
    const rankMap = new Map<number, Card[]>();
    for (const c of noHeo) {
      if (!rankMap.has(c.rank)) rankMap.set(c.rank, []);
      rankMap.get(c.rank)!.push(c);
    }

    for (let len = 3; len <= 12; len++) {
      for (let start = 0; start <= 12 - len; start++) {
        let possible = true;
        for (let r = start; r < start + len; r++) {
          if (!rankMap.has(r)) {
            possible = false;
            break;
          }
        }
        if (possible) {
          // Lấy sảnh chuẩn
          const straightCombo: Card[] = [];
          for (let r = start; r < start + len; r++) {
            straightCombo.push(rankMap.get(r)![0]);
          }
          combos.push(straightCombo);
        }
      }
    }

    // 6. Ba đôi thông (3 consecutive pairs)
    const pairs = combos.filter(
      (c) => c.length === 2 && c[0].rank === c[1].rank && c[0].rank < 12
    );
    for (let i = 0; i < pairs.length; i++) {
      for (let j = i + 1; j < pairs.length; j++) {
        for (let k = j + 1; k < pairs.length; k++) {
          const p1 = pairs[i], p2 = pairs[j], p3 = pairs[k];
          if (p2[0].rank === p1[0].rank + 1 && p3[0].rank === p2[0].rank + 1) {
            combos.push([...p1, ...p2, ...p3]);
          }
        }
      }
    }

    // 7. Bốn đôi thông (4 consecutive pairs)
    for (let i = 0; i < pairs.length; i++) {
      for (let j = i + 1; j < pairs.length; j++) {
        for (let k = j + 1; k < pairs.length; k++) {
          for (let l = k + 1; l < pairs.length; l++) {
            const p1 = pairs[i], p2 = pairs[j], p3 = pairs[k], p4 = pairs[l];
            if (
              p2[0].rank === p1[0].rank + 1 &&
              p3[0].rank === p2[0].rank + 1 &&
              p4[0].rank === p3[0].rank + 1
            ) {
              combos.push([...p1, ...p2, ...p3, ...p4]);
            }
          }
        }
      }
    }

    return combos;
  }
}
