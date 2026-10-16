import { Card, TablePlay, RuleMode } from '../../../shared/types';

export function findSmartHint(
  hand: Card[],
  lastPlay: TablePlay | null,
  ruleMode: RuleMode
): number[] | null {
  if (!hand || hand.length === 0) return null;

  // Sắp xếp bài từ nhỏ đến lớn
  const sorted = [...hand].sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return a.suit - b.suit;
  });

  // 1. Nếu bắt đầu vòng mới (chưa có ai đánh trên bàn)
  if (!lastPlay || !lastPlay.combo || lastPlay.combo.type === 'INVALID') {
    // Ưu tiên nếu có 3 Bích (Card ID = 0)
    const threeSpade = sorted.find((c) => c.rank === 0 && c.suit === 0);
    if (threeSpade) return [threeSpade.id];
    // Hoặc gợi ý lá bài nhỏ nhất
    return [sorted[0].id];
  }

  const prev = lastPlay.combo;

  // 2. Chặn RÁC (SINGLE)
  if (prev.type === 'SINGLE') {
    const prevCard = prev.cards[0];

    // Miền Bắc: phải cùng chất và lớn hơn (hoặc Heo cùng chất/Heo cơ)
    if (ruleMode === 'TLMB') {
      // Tìm bài thường cùng chất lớn hơn
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
      // Heo cùng chất lớn hơn
      const heoSameSuit = sorted.find(
        (c) => c.rank === 12 && c.suit === prevCard.suit && c.rank > prevCard.rank
      );
      if (heoSameSuit) return [heoSameSuit.id];

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

    // Tìm tất cả các đôi trong tay
    const pairs = findAllPairs(sorted);

    for (const pair of pairs) {
      if (ruleMode === 'TLMB') {
        const pairIsRed = pair[0].suit === 2 || pair[0].suit === 3;
        // Miền Bắc: bắt buộc cùng màu
        if (pairIsRed === prevIsRed && pair[1].rank > prevHighest.rank) {
          return pair.map((c) => c.id);
        }
      } else {
        // Miền Nam: đôi lớn hơn
        if (
          pair[1].rank > prevHighest.rank ||
          (pair[1].rank === prevHighest.rank && pair[1].suit > prevHighest.suit)
        ) {
          return pair.map((c) => c.id);
        }
      }
    }

    // TLMN: Đôi Heo bị chặt bởi 4 đôi thông
    if (ruleMode === 'TLMN' && prevHighest.rank === 12) {
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
  // Tìm 3 đôi thông liên tiếp, không chứa rank 12
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

  // Nhóm theo rank
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
        // Kiểm tra đồng chất (Miền Bắc)
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
        // Miền Nam: lấy 1 lá mỗi rank
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
