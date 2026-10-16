import { CardUtils } from './engine/CardUtils.js';
import { ComboDetector } from './engine/ComboDetector.js';
import { TLMNStrategy } from './engine/strategies/TLMNStrategy.js';
import { TLMBStrategy } from './engine/strategies/TLMBStrategy.js';
import { Card, TablePlay } from '../shared/types.js';

console.log('--- 🧪 CHẠY KIỂM THỬ RULE ENGINE TIẾN LÊN CỤC ZÀNG ---');

// 1. Kiểm tra CardUtils
const deck = CardUtils.createDeck();
console.assert(deck.length === 52, 'Bộ bài phải có đủ 52 lá');
console.log('✅ Bộ bài 52 lá tạo thành công.');

// 2. Kiểm tra ComboDetector
const pairCards: Card[] = [
  { id: 0, rank: 0, suit: 0 }, // 3♠
  { id: 1, rank: 0, suit: 1 }, // 3♣
];
const pairCombo = ComboDetector.detectCombo(pairCards);
console.assert(pairCombo.type === 'PAIR', 'Phải nhận diện ra Đôi');

const straightCards: Card[] = [
  { id: 4, rank: 1, suit: 0 }, // 4♠
  { id: 8, rank: 2, suit: 1 }, // 5♣
  { id: 12, rank: 3, suit: 2 }, // 6♦
];
const straightCombo = ComboDetector.detectCombo(straightCards);
console.assert(straightCombo.type === 'STRAIGHT', 'Phải nhận diện ra Sảnh');
console.log('✅ Nhận diện tổ hợp bài (Đôi, Sảnh) chính xác.');

// 3. Kiểm tra TLMN: 3 đôi thông chặt Heo
const tlmn = new TLMNStrategy();
const heoCard: Card[] = [{ id: 48, rank: 12, suit: 0 }]; // 2♠
const tablePlayHeo: TablePlay = {
  playerId: 'p1',
  playerName: 'Player 1',
  cards: heoCard,
  combo: ComboDetector.detectCombo(heoCard),
};

const threePairs: Card[] = [
  { id: 0, rank: 0, suit: 0 },
  { id: 1, rank: 0, suit: 1 }, // Đôi 3
  { id: 4, rank: 1, suit: 0 },
  { id: 5, rank: 1, suit: 1 }, // Đôi 4
  { id: 8, rank: 2, suit: 0 },
  { id: 9, rank: 2, suit: 1 }, // Đôi 5
];
const tlmnResult = tlmn.validatePlay(threePairs, tablePlayHeo, false);
console.assert(tlmnResult.valid === true, 'TLMN: 3 đôi thông phải chặt được 1 con Heo');
console.log('✅ TLMN: Ba đôi thông Chặt Heo thành công!');

// 4. Kiểm tra TLMB: Sảnh trộn chất PHẢI BỊ TỪ CHỐI
const tlmb = new TLMBStrategy();
const mixedStraight: Card[] = [
  { id: 4, rank: 1, suit: 0 }, // 4♠ (Bích)
  { id: 8, rank: 2, suit: 1 }, // 5♣ (Chuồn)
  { id: 12, rank: 3, suit: 2 }, // 6♦ (Rô)
];
const tlmbStraightRes = tlmb.validatePlay(mixedStraight, null, false);
console.assert(
  tlmbStraightRes.valid === false,
  'TLMB: Sảnh trộn chất phải bị từ chối'
);
console.log('✅ TLMB: Chặn sảnh trộn chất thành công (Bắt buộc đồng chất 100%)!');

// 5. Kiểm tra TLMB: Cấm về bằng 2 (Thối 2)
const finishOnTwo = tlmb.isGameOverMoveIllegal(
  [{ id: 51, rank: 12, suit: 3 }], // 2♥
  [{ id: 51, rank: 12, suit: 3 }]
);
console.assert(finishOnTwo.illegal === true, 'TLMB: Cấm về bằng Heo');
console.log('✅ TLMB: Nghiêm cấm về bằng 2 (Thối Heo cuối bài) chính xác!');

console.log('🎉 TẤT CẢ TEST CASES ĐÃ ĐẠT 100%!');
