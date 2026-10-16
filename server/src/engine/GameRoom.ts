import {
  Card,
  GamePhase,
  InstantWinType,
  PlayerPublicInfo,
  RoomSettings,
  RoomStateUpdate,
  TablePlay,
} from '../../../shared/types.js';
import { CardUtils } from './CardUtils.js';
import { ComboDetector } from './ComboDetector.js';
import { PlayerEndState, RuleStrategy } from './strategies/RuleStrategy.js';
import { TLMBStrategy } from './strategies/TLMBStrategy.js';
import { TLMNStrategy } from './strategies/TLMNStrategy.js';

export interface InternalPlayer {
  id: string;
  socketId: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  hand: Card[];
  passed: boolean;
  rank?: number;
  score: number;
  hasPlayedAnyCard: boolean;
  isBot?: boolean;
}

export class GameRoom {
  public roomCode: string;
  public roomName: string;
  public settings: RoomSettings;
  public phase: GamePhase = 'LOBBY';
  public players: Map<string, InternalPlayer> = new Map();
  public currentTurnPlayerId: string | null = null;
  public lastPlay: TablePlay | null = null;
  public lastPlayerToPlayId: string | null = null;
  public starterPlayerId: string | null = null;
  public isFirstMoveOfGame = false;
  public gameHistory: string[] = [];

  private timerInterval: NodeJS.Timeout | null = null;
  public turnTimeRemaining = 20;
  private strategy: RuleStrategy;
  private onStateChange: () => void;
  private finishedPlayerRanks: string[] = [];
  private requiredFirstCardId?: number;

  constructor(
    roomCode: string,
    roomName: string,
    settings: RoomSettings,
    onStateChange: () => void
  ) {
    this.roomCode = roomCode;
    this.roomName = roomName;
    this.settings = settings;
    this.onStateChange = onStateChange;
    this.strategy =
      settings.ruleMode === 'TLMB'
        ? new TLMBStrategy()
        : new TLMNStrategy(settings.camThoiHaiCuoi);
  }

  public updateSettings(newSettings: Partial<RoomSettings>) {
    if (this.phase !== 'LOBBY') return;
    this.settings = { ...this.settings, ...newSettings };
    this.strategy =
      this.settings.ruleMode === 'TLMB'
        ? new TLMBStrategy()
        : new TLMNStrategy(this.settings.camThoiHaiCuoi);
    this.notifyState();
  }

  public addPlayer(
    id: string,
    socketId: string,
    name: string,
    avatar: string,
    isBot = false
  ): boolean {
    if (this.players.size >= this.settings.maxPlayers && !this.players.has(id)) {
      return false;
    }

    if (this.players.has(id)) {
      // Reconnect
      const existing = this.players.get(id)!;
      existing.socketId = socketId;
      return true;
    }

    const isHost = this.players.size === 0;
    this.players.set(id, {
      id,
      socketId,
      name,
      avatar,
      isHost,
      isReady: isHost || isBot,
      hand: [],
      passed: false,
      score: 100000, // Khởi tạo 100k Cục Zàng xu
      hasPlayedAnyCard: false,
      isBot,
    });

    this.notifyState();
    return true;
  }

  public removePlayer(id: string) {
    const player = this.players.get(id);
    if (!player) return;

    this.players.delete(id);

    // Nếu host rời, chuyển host cho người tiếp theo
    if (player.isHost && this.players.size > 0) {
      const nextHost = this.players.values().next().value;
      if (nextHost) nextHost.isHost = true;
    }

    // Nếu đang chơi mà còn ít hơn 2 người -> reset về LOBBY
    if (this.phase !== 'LOBBY' && this.players.size < 2) {
      this.stopTimer();
      this.phase = 'LOBBY';
      this.currentTurnPlayerId = null;
      this.lastPlay = null;
    }

    this.notifyState();
  }

  public setReady(id: string, ready: boolean) {
    const player = this.players.get(id);
    if (player && !player.isHost && this.phase === 'LOBBY') {
      player.isReady = ready;
      this.notifyState();
    }
  }

  /**
   * Bắt đầu ván chơi mới
   */
  public startGame(): { success: boolean; error?: string } {
    if (this.players.size < 2) {
      return { success: false, error: 'Cần ít nhất 2 người chơi để bắt đầu!' };
    }

    // Kiểm tra tất cả đã sẵn sàng
    for (const p of this.players.values()) {
      if (!p.isHost && !p.isReady) {
        return { success: false, error: `Người chơi ${p.name} chưa sẵn sàng!` };
      }
    }

    this.phase = 'DEALING';
    this.finishedPlayerRanks = [];
    this.lastPlay = null;
    this.lastPlayerToPlayId = null;
    this.gameHistory = [`Ván đấu mới bắt đầu với luật: ${this.settings.ruleMode === 'TLMB' ? 'Tiến Lên Miền Bắc' : 'Tiến Lên Miền Nam'}`];

    // Chia bài
    const deck = CardUtils.shuffle(CardUtils.createDeck());
    const playerList = Array.from(this.players.values());

    playerList.forEach((p, idx) => {
      p.hand = CardUtils.sortCards(deck.slice(idx * 13, (idx + 1) * 13));
      p.passed = false;
      p.rank = undefined;
      p.hasPlayedAnyCard = false;
    });

    // Kiểm tra Tới Trắng
    for (const p of playerList) {
      const instantWin = this.strategy.checkInstantWin(p.hand);
      if (instantWin) {
        this.phase = 'GAME_OVER';
        p.rank = 1;
        this.gameHistory.push(`${p.name} TỚI TRẮNG với tổ hợp: ${instantWin}!`);
        this.notifyState();
        return { success: true };
      }
    }

    // Tìm người có lá bài nhỏ nhất (ưu tiên 3 Bích = Card ID 0)
    let firstPlayer = playerList.find((p) =>
      p.hand.some((c) => c.rank === 0 && c.suit === 0)
    );
    let smallestCardId = 0;

    if (!firstPlayer) {
      // Nếu không ai cầm 3 Bích (bàn 2-3 người), tìm lá nhỏ nhất trong tất cả các bài đã chia
      let minCard: Card | null = null;
      for (const p of playerList) {
        if (p.hand.length > 0) {
          const pMin = p.hand[0]; // Bài đã được sort từ nhỏ đến lớn
          if (!minCard || CardUtils.compareCards(pMin, minCard) < 0) {
            minCard = pMin;
            firstPlayer = p;
          }
        }
      }
      smallestCardId = minCard ? minCard.id : 0;
    }

    this.requiredFirstCardId = smallestCardId;
    this.starterPlayerId = firstPlayer ? firstPlayer.id : playerList[0].id;
    this.currentTurnPlayerId = this.starterPlayerId;
    this.isFirstMoveOfGame = true;
    this.phase = 'PLAYING';

    this.startTurnTimer();
    this.notifyState();

    this.checkBotTurn();
    return { success: true };
  }

  /**
   * Người chơi đánh bài
   */
  public playCards(
    playerId: string,
    cardIds: number[]
  ): { success: boolean; error?: string } {
    if (this.phase !== 'PLAYING') {
      return { success: false, error: 'Ván bài chưa bắt đầu hoặc đã kết thúc!' };
    }

    if (this.currentTurnPlayerId !== playerId) {
      return { success: false, error: 'Chưa tới lượt của bạn!' };
    }

    const player = this.players.get(playerId);
    if (!player) return { success: false, error: 'Không tìm thấy người chơi!' };

    // Kiểm tra người chơi có cầm những lá bài này không
    const selectedCards: Card[] = [];
    for (const id of cardIds) {
      const card = player.hand.find((c) => c.id === id);
      if (!card) {
        return { success: false, error: 'Bạn không sở hữu một số lá bài này!' };
      }
      selectedCards.push(card);
    }

    // Thẩm định bằng RuleStrategy
    const validation = this.strategy.validatePlay(
      selectedCards,
      this.lastPlay,
      this.isFirstMoveOfGame,
      this.requiredFirstCardId
    );

    if (!validation.valid || !validation.combo) {
      return { success: false, error: validation.reason || 'Nước bài không hợp lệ!' };
    }

    // Kiểm tra thối 2 cuối bài nếu ván đấu kết thúc bằng nước bài này
    if (player.hand.length === selectedCards.length) {
      const illegalCheck = this.strategy.isGameOverMoveIllegal(
        selectedCards,
        player.hand
      );
      if (illegalCheck.illegal) {
        return { success: false, error: illegalCheck.reason };
      }
    }

    // Hợp lệ -> Rút bài khỏi tay người chơi
    player.hand = player.hand.filter((c) => !cardIds.includes(c.id));
    player.hasPlayedAnyCard = true;
    this.isFirstMoveOfGame = false;
    this.requiredFirstCardId = undefined;

    // Cập nhật bài trên bàn
    const actionMsg = validation.actionMessage || (this.lastPlay ? 'Chặn bài' : 'Ra bài');
    this.lastPlay = {
      playerId: player.id,
      playerName: player.name,
      cards: validation.combo.cards,
      combo: validation.combo,
      message: validation.actionMessage,
    };
    this.lastPlayerToPlayId = player.id;

    const cardsStr = validation.combo.cards
      .map((c) => CardUtils.getCardName(c))
      .join(' ');
    this.gameHistory.push(`${player.name} ${actionMsg}: [ ${cardsStr} ]`);

    // Kiểm tra xem người này có hết bài chưa
    if (player.hand.length === 0) {
      this.finishedPlayerRanks.push(player.id);
      player.rank = this.finishedPlayerRanks.length;
      this.gameHistory.push(`🎉 ${player.name} đã về thứ ${player.rank}!`);

      // Kiểm tra điều kiện kết thúc ván
      const remainingActivePlayers = Array.from(this.players.values()).filter(
        (p) => p.hand.length > 0
      );

      if (remainingActivePlayers.length <= 1) {
        // Còn 1 người hoặc 0 người -> Kết thúc ván!
        if (remainingActivePlayers.length === 1) {
          const lastPlayer = remainingActivePlayers[0];
          this.finishedPlayerRanks.push(lastPlayer.id);
          lastPlayer.rank = this.finishedPlayerRanks.length;
          this.gameHistory.push(`😢 ${lastPlayer.name} về chót (${lastPlayer.rank})!`);
        }
        this.endGame();
        return { success: true };
      }
    }

    // Chuyển lượt
    this.advanceTurn();
    return { success: true };
  }

  /**
   * Bỏ lượt (Pass)
   */
  public passTurn(playerId: string): { success: boolean; error?: string } {
    if (this.phase !== 'PLAYING') {
      return { success: false, error: 'Không trong giai đoạn đánh bài!' };
    }

    if (this.currentTurnPlayerId !== playerId) {
      return { success: false, error: 'Chưa tới lượt của bạn!' };
    }

    if (!this.lastPlay) {
      return {
        success: false,
        error: 'Vòng mới: Bạn là người cầm cái, không được bỏ lượt!',
      };
    }

    const player = this.players.get(playerId);
    if (!player) return { success: false, error: 'Người chơi không tồn tại' };

    player.passed = true;
    this.gameHistory.push(`${player.name} bỏ lượt.`);

    this.advanceTurn();
    return { success: true };
  }

  /**
   * Chuyển lượt sang người tiếp theo
   */
  private advanceTurn() {
    this.stopTimer();

    const playerList = Array.from(this.players.values());
    const currentIndex = playerList.findIndex(
      (p) => p.id === this.currentTurnPlayerId
    );

    // Kiểm tra xem vòng này đã kết thúc chưa (tất cả những người còn bài đều đã pass, ngoại trừ người đánh cuối)
    const activeUnfinishedPlayers = playerList.filter((p) => p.hand.length > 0);
    const nonPassedPlayers = activeUnfinishedPlayers.filter((p) => !p.passed);

    // Nếu chỉ còn 1 hoặc 0 người chưa pass -> CLEAR ROUND
    if (
      nonPassedPlayers.length <= 1 &&
      (nonPassedPlayers.length === 0 ||
        nonPassedPlayers[0].id === this.lastPlayerToPlayId)
    ) {
      // Vòng mới! Reset cờ pass của mọi người
      activeUnfinishedPlayers.forEach((p) => (p.passed = false));
      this.lastPlay = null;

      // Người cầm cái vòng mới là người vừa đánh cuối cùng (nếu người đó chưa hết bài)
      const lastPlayer = this.players.get(this.lastPlayerToPlayId || '');
      if (lastPlayer && lastPlayer.hand.length > 0) {
        this.currentTurnPlayerId = lastPlayer.id;
      } else {
        // Nếu người vừa đánh cuối đã hết bài, người tiếp theo theo chiều kim đồng hồ được quyền ra bài
        this.currentTurnPlayerId = this.findNextActivePlayer(currentIndex);
      }

      const nextP = this.players.get(this.currentTurnPlayerId || '');
      this.gameHistory.push(`--- Bắt đầu vòng mới: ${nextP?.name || ''} cầm cái ---`);
    } else {
      // Vẫn trong vòng -> Chuyển lượt cho người kế tiếp chưa pass và còn bài
      this.currentTurnPlayerId = this.findNextActivePlayer(currentIndex);
    }

    this.startTurnTimer();
    this.notifyState();
    this.checkBotTurn();
  }

  private findNextActivePlayer(startIndex: number): string | null {
    const playerList = Array.from(this.players.values());
    const total = playerList.length;

    for (let i = 1; i <= total; i++) {
      const idx = (startIndex + i) % total;
      const candidate = playerList[idx];
      if (candidate.hand.length > 0 && !candidate.passed) {
        return candidate.id;
      }
    }

    return null;
  }

  /**
   * Kết thúc ván bài
   */
  private endGame() {
    this.stopTimer();
    this.phase = 'GAME_OVER';

    const endStates: PlayerEndState[] = Array.from(this.players.values()).map(
      (p) => ({
        playerId: p.id,
        playerName: p.name,
        rank: p.rank || 4,
        remainingCards: p.hand,
        hasNeverPlayed: !p.hasPlayedAnyCard,
      })
    );

    const scoreAdjustments = this.strategy.calculateEndGameScores(
      endStates,
      this.settings.bet
    );

    for (const adj of scoreAdjustments) {
      const p = this.players.get(adj.playerId);
      if (p) {
        p.score += adj.scoreChange;
        this.gameHistory.push(
          `${p.name}: ${adj.scoreChange >= 0 ? '+' : ''}${adj.scoreChange} (${adj.reason})`
        );
      }
    }

    this.notifyState();
  }

  /**
   * Quản lý bộ đếm thời gian lượt đánh (Turn Timer)
   */
  private startTurnTimer() {
    this.stopTimer();
    // Nếu cài đặt không giới hạn thời gian (<= 0)
    if (this.settings.turnTimeLimit <= 0) {
      this.turnTimeRemaining = 0;
      return;
    }
    this.turnTimeRemaining = this.settings.turnTimeLimit;
    this.timerInterval = setInterval(() => {
      this.turnTimeRemaining--;
      if (this.turnTimeRemaining <= 0) {
        this.handleTurnTimeout();
      } else {
        this.notifyState();
      }
    }, 1000);
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private handleTurnTimeout() {
    this.stopTimer();
    if (!this.currentTurnPlayerId || this.phase !== 'PLAYING') return;

    const player = this.players.get(this.currentTurnPlayerId);
    if (!player) return;

    if (!this.lastPlay) {
      // Vòng mới, không được bỏ lượt -> Tự đánh lá nhỏ nhất
      if (player.hand.length > 0) {
        const smallestCard = player.hand[0];
        this.playCards(player.id, [smallestCard.id]);
      }
    } else {
      // Tự động bỏ lượt
      this.passTurn(player.id);
    }
  }

  /**
   * Trí tuệ nhân tạo (Bot) tự động chơi khi đến lượt
   */
  private checkBotTurn() {
    if (this.phase !== 'PLAYING' || !this.currentTurnPlayerId) return;

    const currentPlayer = this.players.get(this.currentTurnPlayerId);
    if (!currentPlayer || !currentPlayer.isBot) return;

    // Giả lập bot suy nghĩ trong 1.2 giây cho tự nhiên
    setTimeout(() => {
      if (
        this.phase !== 'PLAYING' ||
        this.currentTurnPlayerId !== currentPlayer.id
      )
        return;

      const botHand = currentPlayer.hand;

      // 1. Nếu bắt đầu vòng mới -> đánh lá nhỏ nhất hoặc đôi nhỏ nhất
      if (!this.lastPlay) {
        // Ưu tiên nếu có nước đầu tiên của game (cần 3 bích)
        if (this.isFirstMoveOfGame) {
          const threeSpade = botHand.find((c) => c.rank === 0 && c.suit === 0);
          if (threeSpade) {
            this.playCards(currentPlayer.id, [threeSpade.id]);
            return;
          }
        }
        // Ra lá đơn nhỏ nhất
        if (botHand.length > 0) {
          this.playCards(currentPlayer.id, [botHand[0].id]);
          return;
        }
      }

      // 2. Tìm nước chặn hợp lệ đơn giản
      let played = false;
      const prev = this.lastPlay;

      if (prev && prev.combo.type === 'SINGLE') {
        // Tìm 1 lá có thể đè
        for (const card of botHand) {
          const val = this.strategy.validatePlay([card], prev, false);
          if (val.valid) {
            this.playCards(currentPlayer.id, [card.id]);
            played = true;
            break;
          }
        }
      } else if (prev && prev.combo.type === 'PAIR') {
        // Tìm 1 đôi đè
        for (let i = 0; i < botHand.length - 1; i++) {
          if (botHand[i].rank === botHand[i + 1].rank) {
            const pairCards = [botHand[i], botHand[i + 1]];
            const val = this.strategy.validatePlay(pairCards, prev, false);
            if (val.valid) {
              this.playCards(currentPlayer.id, [botHand[i].id, botHand[i + 1].id]);
              played = true;
              break;
            }
          }
        }
      }

      // Nếu không tìm được nước đánh hợp lệ -> Bỏ lượt
      if (!played) {
        this.passTurn(currentPlayer.id);
      }
    }, 1200);
  }

  /**
   * Tạo state update an toàn cho một người chơi cụ thể (Che giấu bài của người khác)
   */
  public getStateForPlayer(playerId: string): RoomStateUpdate {
    const targetPlayer = this.players.get(playerId);
    const publicPlayers: PlayerPublicInfo[] = Array.from(
      this.players.values()
    ).map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      isHost: p.isHost,
      isReady: p.isReady,
      cardCount: p.hand.length,
      passed: p.passed,
      rank: p.rank,
      score: p.score,
      isBot: p.isBot,
    }));

    return {
      roomCode: this.roomCode,
      roomName: this.roomName,
      settings: this.settings,
      phase: this.phase,
      players: publicPlayers,
      myHand: targetPlayer ? targetPlayer.hand : [],
      currentTurnPlayerId: this.currentTurnPlayerId,
      lastPlay: this.lastPlay,
      turnTimeRemaining: this.turnTimeRemaining,
      starterPlayerId: this.starterPlayerId,
      gameHistory: this.gameHistory.slice(-8), // 8 dòng log mới nhất
    };
  }

  private notifyState() {
    this.onStateChange();
  }
}
