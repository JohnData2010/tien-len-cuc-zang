import { Card, TablePlay, RuleMode, ComboInfo, ComboType } from '../../../shared/types';

export const RANK_NAMES = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
export const SUIT_SYMBOLS = ['♠', '♣', '♦', '♥'];

export function getComboDescription(cards: Card[], ruleMode: RuleMode): { name: string; isValid: boolean } {
  if (!cards || cards.length === 0) return { name: '', isValid: false };

  const sorted = [...cards].sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return a.suit - b.suit;
  });

  const n = sorted.length;

  // 1 lá: Rác
  if (n === 1) {
    const c = sorted[0];
    return { name: `Rác ${RANK_NAMES[c.rank]}${SUIT_SYMBOLS[c.suit]}`, isValid: true };
  }

  // 2 lá: Đôi
  if (n === 2) {
    if (sorted[0].rank === sorted[1].rank) {
      if (ruleMode === 'TLMB') {
        const isRed0 = sorted[0].suit === 2 || sorted[0].suit === 3;
        const isRed1 = sorted[1].suit === 2 || sorted[1].suit === 3;
        if (isRed0 !== isRed1) {
          return { name: `Đôi ${RANK_NAMES[sorted[0].rank]} (Miền Bắc: Phải cùng màu)`, isValid: false };
        }
      }
      return { name: `Đôi ${RANK_NAMES[sorted[0].rank]}`, isValid: true };
    }
    return { name: `2 lá khác số (Không phải đôi)`, isValid: false };
  }

  // 3 lá: Sám cô hoặc Sảnh 3 lá
  if (n === 3) {
    if (sorted[0].rank === sorted[1].rank && sorted[1].rank === sorted[2].rank) {
      return { name: `Sám cô ${RANK_NAMES[sorted[0].rank]} (3 lá)`, isValid: true };
    }
    if (isStraight(sorted)) {
      if (ruleMode === 'TLMB' && !isSameSuit(sorted)) {
        return { name: `Sảnh 3 lá (Miền Bắc: Bắt buộc đồng chất)`, isValid: false };
      }
      return {
        name: `Sảnh ${RANK_NAMES[sorted[0].rank]}-${RANK_NAMES[sorted[2].rank]} (3 lá)`,
        isValid: true,
      };
    }
    return { name: `3 lá không hợp lệ`, isValid: false };
  }

  // 4 lá: Tứ quý hoặc Sảnh 4 lá
  if (n === 4) {
    if (
      sorted[0].rank === sorted[1].rank &&
      sorted[1].rank === sorted[2].rank &&
      sorted[2].rank === sorted[3].rank
    ) {
      return { name: `💥 Tứ quý ${RANK_NAMES[sorted[0].rank]}`, isValid: true };
    }
    if (isStraight(sorted)) {
      if (ruleMode === 'TLMB' && !isSameSuit(sorted)) {
        return { name: `Sảnh 4 lá (Miền Bắc: Bắt buộc đồng chất)`, isValid: false };
      }
      return {
        name: `Sảnh ${RANK_NAMES[sorted[0].rank]}-${RANK_NAMES[sorted[3].rank]} (4 lá)`,
        isValid: true,
      };
    }
    return { name: `4 lá không hợp lệ`, isValid: false };
  }

  // 6 lá: 3 đôi thông hoặc Sảnh 6 lá
  if (n === 6) {
    if (isConsecutivePairs(sorted, 3)) {
      if (ruleMode === 'TLMB') {
        return { name: `3 đôi thông (Miền Bắc không dùng)`, isValid: false };
      }
      return { name: `💥 Ba đôi thông (${RANK_NAMES[sorted[0].rank]} đến ${RANK_NAMES[sorted[5].rank]})`, isValid: true };
    }
    if (isStraight(sorted)) {
      if (ruleMode === 'TLMB' && !isSameSuit(sorted)) {
        return { name: `Sảnh 6 lá (Miền Bắc: Bắt buộc đồng chất)`, isValid: false };
      }
      return { name: `Sảnh 6 lá (${RANK_NAMES[sorted[0].rank]}-${RANK_NAMES[sorted[5].rank]})`, isValid: true };
    }
  }

  // 8 lá: 4 đôi thông hoặc Sảnh 8 lá
  if (n === 8) {
    if (isConsecutivePairs(sorted, 4)) {
      if (ruleMode === 'TLMB') {
        return { name: `4 đôi thông (Miền Bắc không dùng)`, isValid: false };
      }
      return { name: `💥 Bốn đôi thông (${RANK_NAMES[sorted[0].rank]} đến ${RANK_NAMES[sorted[7].rank]})`, isValid: true };
    }
    if (isStraight(sorted)) {
      return { name: `Sảnh 8 lá`, isValid: true };
    }
  }

  // Sảnh từ 5, 7, 9, 10, 11, 12 lá
  if (isStraight(sorted)) {
    if (ruleMode === 'TLMB' && !isSameSuit(sorted)) {
      return { name: `Sảnh ${n} lá (Miền Bắc: Bắt buộc đồng chất)`, isValid: false };
    }
    return {
      name: `Sảnh ${n} lá (${RANK_NAMES[sorted[0].rank]}-${RANK_NAMES[sorted[n - 1].rank]})`,
      isValid: true,
    };
  }

  return { name: `${n} lá không hợp lệ`, isValid: false };
}

function isSameSuit(cards: Card[]): boolean {
  return cards.every((c) => c.suit === cards[0].suit);
}

function isStraight(cards: Card[]): boolean {
  for (let i = 0; i < cards.length; i++) {
    if (cards[i].rank === 12) return false; // Không chứa 2
    if (i > 0 && cards[i].rank !== cards[i - 1].rank + 1) return false;
  }
  return true;
}

function isConsecutivePairs(cards: Card[], pairCount: number): boolean {
  if (cards.length !== pairCount * 2) return false;
  for (let p = 0; p < pairCount; p++) {
    const idx = p * 2;
    if (cards[idx].rank !== cards[idx + 1].rank) return false;
    if (cards[idx].rank === 12) return false;
    if (p > 0 && cards[idx].rank !== cards[(p - 1) * 2].rank + 1) return false;
  }
  return true;
}

export function findSmartHint(
  hand: Card[],
  lastPlay: TablePlay | null,
  ruleMode: RuleMode
): number[] | null {
  if (!hand || hand.length === 0) return null;

  const sorted = [...hand].sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return a.suit - b.suit;
  });

  // 1. Nếu bắt đầu vòng mới (chưa có ai đánh trên bàn):
  // Gợi ý thông minh: Đôi, Sảnh, Sám cô, hoặc Rác
  if (!lastPlay || !lastPlay.combo || lastPlay.combo.type === 'INVALID') {
    // A. Ưu tiên gợi ý Sảnh dài (nếu có sảnh >= 3 lá)
    for (let len = 5; len >= 3; len--) {
      const straights = findAllStraights(sorted, len, ruleMode === 'TLMB');
      if (straights.length > 0) return straights[0].map((c) => c.id);
    }

    // B. Ưu tiên gợi ý Đôi nhỏ (để xả đôi thấp)
    const pairs = findAllPairs(sorted).filter((p) => {
      if (p[0].rank === 12) return false; // không gợi ý xả đôi 2 vội
      if (ruleMode === 'TLMB') {
        const isRed0 = p[0].suit === 2 || p[0].suit === 3;
        const isRed1 = p[1].suit === 2 || p[1].suit === 3;
        return isRed0 === isRed1;
      }
      return true;
    });
    if (pairs.length > 0) return pairs[0].map((c) => c.id);

    // C. Ưu tiên gợi ý Sám cô nhỏ
    const triples = findAllTriples(sorted).filter((t) => t[0].rank < 12);
    if (triples.length > 0) return triples[0].map((c) => c.id);

    // D. Gợi ý lá rác nhỏ nhất
    return [sorted[0].id];
  }

  const prev = lastPlay.combo;

  // 2. Chặn RÁC (SINGLE)
  if (prev.type === 'SINGLE') {
    const prevCard = prev.cards[0];

    // Miền Bắc: phải cùng chất và lớn hơn (hoặc Heo cơ)
    if (ruleMode === 'TLMB') {
      for (const c of sorted) {
        if (c.suit === prevCard.suit && c.rank > prevCard.rank) {
          return [c.id];
        }
      }
      // Heo cơ chặn tất cả
      const heoCo = sorted.find((c) => c.rank === 12 && c.suit === 3);
      if (heoCo && (prevCard.rank < 12 || prevCard.suit < 3)) {
        return [heoCo.id];
      }
      // Tứ quý chặt 1 heo
      if (prevCard.rank === 12) {
        const tuQuy = findFourOfAKind(sorted);
        if (tuQuy) return tuQuy.map((c) => c.id);
      }
    } else {
      // Miền Nam: bất kỳ lá nào rank cao hơn, hoặc cùng rank suit cao hơn
      for (const c of sorted) {
        if (c.rank > prevCard.rank || (c.rank === prevCard.rank && c.suit > prevCard.suit)) {
          return [c.id];
        }
      }
      // Chặt Heo trong TLMN: 3 đôi thông, Tứ quý, 4 đôi thông
      if (prevCard.rank === 12) {
        const threePairs = findThreeConsecutivePairs(sorted);
        if (threePairs) return threePairs.map((c) => c.id);

        const tuQuy = findFourOfAKind(sorted);
        if (tuQuy) return tuQuy.map((c) => c.id);

        const fourPairs = findFourConsecutivePairs(sorted);
        if (fourPairs) return fourPairs.map((c) => c.id);
      }
    }
    return null;
  }

  // 3. Chặn ĐÔI (PAIR)
  if (prev.type === 'PAIR') {
    const prevHighest = prev.highestCard;
    const prevIsRed = prevHighest.suit === 2 || prevHighest.suit === 3;
    const pairs = findAllPairs(sorted);

    for (const pair of pairs) {
      if (ruleMode === 'TLMB') {
        const pairIsRed = pair[0].suit === 2 || pair[0].suit === 3;
        if (pairIsRed === prevIsRed && pair[1].rank > prevHighest.rank) {
          return pair.map((c) => c.id);
        }
      } else {
        if (
          pair[1].rank > prevHighest.rank ||
          (pair[1].rank === prevHighest.rank && pair[1].suit > prevHighest.suit)
        ) {
          return pair.map((c) => c.id);
        }
      }
    }

    // TLMN: Đôi Heo bị chặt bởi Tứ quý hoặc 4 đôi thông!
    if (ruleMode === 'TLMN' && prevHighest.rank === 12) {
      const tuQuy = findFourOfAKind(sorted);
      if (tuQuy) return tuQuy.map((c) => c.id);

      const fourPairs = findFourConsecutivePairs(sorted);
      if (fourPairs) return fourPairs.map((c) => c.id);
    }
    return null;
  }

  // 4. Chặn SÁM (TRIPLE)
  if (prev.type === 'TRIPLE') {
    const triples = findAllTriples(sorted);
    for (const trip of triples) {
      if (trip[0].rank > prev.highestCard.rank) {
        return trip.map((c) => c.id);
      }
    }
    return null;
  }

  // 5. Chặn SẢNH (STRAIGHT)
  if (prev.type === 'STRAIGHT') {
    const len = prev.length;
    const straights = findAllStraights(sorted, len, ruleMode === 'TLMB');
    for (const s of straights) {
      const sHighest = s[s.length - 1];
      if (ruleMode === 'TLMB') {
        if (s[0].suit === prev.cards[0].suit && sHighest.rank > prev.highestCard.rank) {
          return s.map((c) => c.id);
        }
      } else {
        if (
          sHighest.rank > prev.highestCard.rank ||
          (sHighest.rank === prev.highestCard.rank && sHighest.suit > prev.highestCard.suit)
        ) {
          return s.map((c) => c.id);
        }
      }
    }
    return null;
  }

  // 6. Chặn TỨ QUÝ
  if (prev.type === 'FOUR_OF_A_KIND') {
    const tuQuys = findAllFourOfAKinds(sorted);
    for (const tq of tuQuys) {
      if (tq[0].rank > prev.highestCard.rank) {
        return tq.map((c) => c.id);
      }
    }
    if (ruleMode === 'TLMN') {
      const fourPairs = findFourConsecutivePairs(sorted);
      if (fourPairs) return fourPairs.map((c) => c.id);
    }
    return null;
  }

  // 7. Chặn BA ĐÔI THÔNG
  if (prev.type === 'THREE_CONSECUTIVE_PAIRS' && ruleMode === 'TLMN') {
    const threePairs = findAllThreeConsecutivePairs(sorted);
    for (const tp of threePairs) {
      if (
        tp[5].rank > prev.highestCard.rank ||
        (tp[5].rank === prev.highestCard.rank && tp[5].suit > prev.highestCard.suit)
      ) {
        return tp.map((c) => c.id);
      }
    }
    const tuQuy = findFourOfAKind(sorted);
    if (tuQuy) return tuQuy.map((c) => c.id);

    const fourPairs = findFourConsecutivePairs(sorted);
    if (fourPairs) return fourPairs.map((c) => c.id);
  }

  return null;
}

function findAllPairs(sorted: Card[]): Card[][] {
  const pairs: Card[][] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      if (sorted[i].rank === sorted[j].rank) {
        pairs.push([sorted[i], sorted[j]]);
      }
    }
  }
  return pairs;
}

function findAllTriples(sorted: Card[]): Card[][] {
  const triples: Card[][] = [];
  for (let i = 0; i < sorted.length - 2; i++) {
    if (sorted[i].rank === sorted[i + 1].rank && sorted[i].rank === sorted[i + 2].rank) {
      triples.push([sorted[i], sorted[i + 1], sorted[i + 2]]);
    }
  }
  return triples;
}

function findFourOfAKind(sorted: Card[]): Card[] | null {
  for (let i = 0; i < sorted.length - 3; i++) {
    if (
      sorted[i].rank === sorted[i + 1].rank &&
      sorted[i].rank === sorted[i + 2].rank &&
      sorted[i].rank === sorted[i + 3].rank
    ) {
      return [sorted[i], sorted[i + 1], sorted[i + 2], sorted[i + 3]];
    }
  }
  return null;
}

function findAllFourOfAKinds(sorted: Card[]): Card[][] {
  const res: Card[][] = [];
  for (let i = 0; i < sorted.length - 3; i++) {
    if (
      sorted[i].rank === sorted[i + 1].rank &&
      sorted[i].rank === sorted[i + 2].rank &&
      sorted[i].rank === sorted[i + 3].rank
    ) {
      res.push([sorted[i], sorted[i + 1], sorted[i + 2], sorted[i + 3]]);
    }
  }
  return res;
}

function findThreeConsecutivePairs(sorted: Card[]): Card[] | null {
  const pairs = findAllPairs(sorted).filter((p) => p[0].rank < 12);
  for (let i = 0; i < pairs.length; i++) {
    for (let j = i + 1; j < pairs.length; j++) {
      for (let k = j + 1; k < pairs.length; k++) {
        const p1 = pairs[i], p2 = pairs[j], p3 = pairs[k];
        if (p2[0].rank === p1[0].rank + 1 && p3[0].rank === p2[0].rank + 1) {
          return [...p1, ...p2, ...p3];
        }
      }
    }
  }
  return null;
}

function findAllThreeConsecutivePairs(sorted: Card[]): Card[][] {
  const res: Card[][] = [];
  const pairs = findAllPairs(sorted).filter((p) => p[0].rank < 12);
  for (let i = 0; i < pairs.length; i++) {
    for (let j = i + 1; j < pairs.length; j++) {
      for (let k = j + 1; k < pairs.length; k++) {
        const p1 = pairs[i], p2 = pairs[j], p3 = pairs[k];
        if (p2[0].rank === p1[0].rank + 1 && p3[0].rank === p2[0].rank + 1) {
          res.push([...p1, ...p2, ...p3]);
        }
      }
    }
  }
  return res;
}

function findFourConsecutivePairs(sorted: Card[]): Card[] | null {
  const pairs = findAllPairs(sorted).filter((p) => p[0].rank < 12);
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
            return [...p1, ...p2, ...p3, ...p4];
          }
        }
      }
    }
  }
  return null;
}

function findAllStraights(sorted: Card[], length: number, isMonoSuit: boolean): Card[][] {
  const straights: Card[][] = [];
  const noHeo = sorted.filter((c) => c.rank < 12);

  const rankMap = new Map<number, Card[]>();
  for (const c of noHeo) {
    if (!rankMap.has(c.rank)) rankMap.set(c.rank, []);
    rankMap.get(c.rank)!.push(c);
  }

  for (let startRank = 0; startRank <= 12 - length; startRank++) {
    let possible = true;
    for (let r = startRank; r < startRank + length; r++) {
      if (!rankMap.has(r)) {
        possible = false;
        break;
      }
    }
    if (possible) {
      if (isMonoSuit) {
        for (let suit = 0; suit <= 3; suit++) {
          let hasSuit = true;
          const combo: Card[] = [];
          for (let r = startRank; r < startRank + length; r++) {
            const match = rankMap.get(r)!.find((c) => c.suit === suit);
            if (!match) {
              hasSuit = false;
              break;
            }
            combo.push(match);
          }
          if (hasSuit) straights.push(combo);
        }
      } else {
        const combo: Card[] = [];
        for (let r = startRank; r < startRank + length; r++) {
          combo.push(rankMap.get(r)![0]);
        }
        straights.push(combo);
      }
    }
  }
  return straights;
}
