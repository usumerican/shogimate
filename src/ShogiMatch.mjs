import {
  formatGameUsiFromLastStep,
  getMoveFrom,
  getMoveTo,
  getPieceSide,
  isMoveDropped,
  isMovePromoted,
  makeDrop,
  makeMove,
  parseMoveUsi,
  squareN,
} from './shogi.mjs';

export default class ShogiMatch {
  constructor(app, shogiPanel, checksOnly) {
    this.app = app;
    this.shogiPanel = shogiPanel;
    this.checksOnly = checksOnly;
  }

  async onSquare(sq) {
    const step = this.shogiPanel.step;
    if (this.shogiPanel.nextToMap?.has(sq)) {
      const nextFrom = getMoveFrom(this.shogiPanel.nextMove);
      if (isMoveDropped(this.shogiPanel.nextMove)) {
        await this.changeStep(step.appendMove(makeDrop(nextFrom, sq)));
      } else {
        let promoted = this.shogiPanel.nextToMap.get(sq) - 1;
        if (promoted === 2) {
          promoted = await this.app.confirmView.show('成りますか?', ['成らない', '成る']);
        }
        await this.changeStep(step.appendMove(makeMove(nextFrom, sq, promoted)));
      }
    } else if (
      this.shogiPanel.nextMove &&
      !isMoveDropped(this.shogiPanel.nextMove) &&
      getMoveFrom(this.shogiPanel.nextMove) === sq
    ) {
      this.shogiPanel.resetNext();
    } else {
      const piece = step.position.getPiece(sq);
      if (piece) {
        if (getPieceSide(piece) === step.position.sideToMove) {
          this.shogiPanel.nextMove = makeMove(sq, squareN);
          this.shogiPanel.nextToMap = (await this.getFromToMap(step)).get(this.shogiPanel.nextMove);
        }
      }
    }
    this.shogiPanel.request();
  }

  async onHand(side, base) {
    const step = this.shogiPanel.step;
    if (step !== side) {
      return;
    }
    if (!step.position.getHandCount(side, base)) {
      return;
    }
    if (
      this.shogiPanel.nextMove &&
      isMoveDropped(this.shogiPanel.nextMove) &&
      getMoveFrom(this.shogiPanel.nextMove) === base
    ) {
      this.shogiPanel.resetNext();
    } else {
      this.shogiPanel.nextMove = makeDrop(base, squareN);
      this.shogiPanel.nextToMap = (await this.getFromToMap(step)).get(this.shogiPanel.nextMove);
    }
    this.shogiPanel.request();
  }

  async getFromToMap(step) {
    if (!this.fromToMap) {
      this.fromToMap = new Map();
      for (const moveUsi of await this.app.engine.moves(formatGameUsiFromLastStep(step), this.checksOnly)) {
        const move = parseMoveUsi(moveUsi);
        if (move) {
          const from = getMoveFrom(move);
          const key = isMoveDropped(move) ? makeDrop(from, squareN) : makeMove(from, squareN);
          let toMap = this.fromToMap.get(key);
          if (!toMap) {
            toMap = new Map();
            this.fromToMap.set(key, toMap);
          }
          const to = getMoveTo(move);
          toMap.set(to, (toMap.get(to) || 0) | (isMovePromoted(move) ? 2 : 1));
        }
      }
    }
    return this.fromToMap;
  }

  changeStep(step) {
    this.shogiPanel.step = step;
    this.shogiPanel.resetNext();
    this.shogiPanel.bestMove = 0;
    this.fromToMap = null;
  }
}
