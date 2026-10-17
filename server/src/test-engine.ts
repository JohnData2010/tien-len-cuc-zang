import { CardUtils } from './engine/CardUtils.js';
import { ComboDetector } from './engine/ComboDetector.js';
import { TLMNStrategy } from './engine/strategies/TLMNStrategy.js';
import { TLMBStrategy } from './engine/strategies/TLMBStrategy.js';
import { Card, TablePlay } from '../../shared/types.js';

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

// 6. Kiểm tra Nước đầu tiên với bàn 2-3 người (Lá nhỏ nhất linh hoạt)
const dynamicFirstMove = tlmn.validatePlay(
  [{ id: 1, rank: 0, suit: 1 }], // 3♣
  null,
  true,
  1 // yêu cầu lá nhỏ nhất là 3♣ vì không ai cầm 3♠
);
console.assert(dynamicFirstMove.valid === true, 'Phải chấp nhận lá nhỏ nhất hợp lệ');
console.log('✅ Bàn 2-3 người: Xác định lá nhỏ nhất đi đầu chuẩn xác!');

// 7. Kiểm tra TLMN: Tứ quý CHẶT ĐÔI HEO
const doiHeo: Card[] = [
  { id: 48, rank: 12, suit: 0 }, // 2♠
  { id: 51, rank: 12, suit: 3 }, // 2♥
];
const tableDoiHeo: TablePlay = {
  playerId: 'p1',
  playerName: 'Player 1',
  cards: doiHeo,
  combo: ComboDetector.detectCombo(doiHeo),
};
const tuQuy8: Card[] = [
  { id: 20, rank: 5, suit: 0 },
  { id: 21, rank: 5, suit: 1 },
  { id: 22, rank: 5, suit: 2 },
  { id: 23, rank: 5, suit: 3 }, // Tứ quý 8
];
const tuQuyDoiHeoRes = tlmn.validatePlay(tuQuy8, tableDoiHeo, false);
console.assert(tuQuyDoiHeoRes.valid === true, 'Tứ quý phải chặt được Đôi Heo trong TLMN');
console.log('✅ TLMN: Tứ quý Chặt Đôi Heo thành công!');

// 8. Kiểm tra BotAI: Bot chặn Đôi với Đôi lớn hơn
import { BotAI } from './engine/BotAI.js';
const botHandForPair: Card[] = [
  { id: 8, rank: 2, suit: 0 }, // 5♠
  { id: 9, rank: 2, suit: 1 }, // 5♣
  { id: 16, rank: 4, suit: 0 }, // 7♠
  { id: 17, rank: 4, suit: 1 }, // 7♣
];
const tablePair4: TablePlay = {
  playerId: 'p2',
  playerName: 'Player 2',
  cards: [
    { id: 4, rank: 1, suit: 0 },
    { id: 5, rank: 1, suit: 1 },
  ], // Đôi 4
  combo: ComboDetector.detectCombo([
    { id: 4, rank: 1, suit: 0 },
    { id: 5, rank: 1, suit: 1 },
  ]),
};
const botPairMove = BotAI.findMove(botHandForPair, tablePair4, tlmn, false);
console.assert(botPairMove !== null && botPairMove.length === 2, 'Bot phải chặn bằng một đôi');
console.assert(botPairMove![0] === 8 && botPairMove![1] === 9, 'Bot phải chọn đôi 5 (nhỏ nhất) để chặn');
console.log('✅ BotAI: Tự động phát hiện và chặn Đôi bằng Đôi lớn hơn chuẩn xác!');

// 9. Kiểm tra BotAI: Bot chặn Sảnh với Sảnh lớn hơn
const botHandForStraight: Card[] = [
  { id: 12, rank: 3, suit: 0 }, // 6♠
  { id: 16, rank: 4, suit: 1 }, // 7♣
  { id: 20, rank: 5, suit: 2 }, // 8♦
];
const tableStraight: TablePlay = {
  playerId: 'p3',
  playerName: 'Player 3',
  cards: [
    { id: 0, rank: 0, suit: 0 }, // 3♠
    { id: 4, rank: 1, suit: 1 }, // 4♣
    { id: 8, rank: 2, suit: 2 }, // 5♦
  ],
  combo: ComboDetector.detectCombo([
    { id: 0, rank: 0, suit: 0 },
    { id: 4, rank: 1, suit: 1 },
    { id: 8, rank: 2, suit: 2 },
  ]),
};
const botStraightMove = BotAI.findMove(botHandForStraight, tableStraight, tlmn, false);
console.assert(botStraightMove !== null && botStraightMove.length === 3, 'Bot phải chặn bằng Sảnh 3 lá');
console.log('✅ BotAI: Tự động phát hiện và chặn Sảnh bằng Sảnh lớn hơn thành công!');

console.log('🎉 TẤT CẢ TEST CASES ĐÃ ĐẠT 100%!');
