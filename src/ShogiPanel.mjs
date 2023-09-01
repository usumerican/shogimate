/* eslint-env browser */

import { on } from './browser.mjs';
import {
  KING,
  colInfos,
  colN,
  getCol,
  getMoveFrom,
  getMoveTo,
  getPieceBase,
  getPieceKind,
  getPieceSide,
  getRow,
  handBaseN,
  handBases,
  handOrderMap,
  isMoveDropped,
  kindInfos,
  makeSquare,
  rowInfos,
  rowN,
  sideInfos,
  sideN,
  squareN,
} from './shogi.mjs';

export default class ShogiPanel {
  constructor(el, handler) {
    this.el = el;
    this.handler = handler;
    this.squareL = 100;
    this.squareR = this.squareL / 2;
    this.stageW = this.squareL * 10;
    this.stageH = this.squareL * 13;
    this.boardW = this.boardH = this.squareL * 9;
    this.boardX = this.boardY = this.squareL * -4.5;
    this.handRects = [
      [this.squareL * -3.5, this.squareL * 5, this.squareL * 7, this.squareL],
      [this.squareL * -3.5, this.squareL * -6, this.squareL * 7, this.squareL],
    ];
    this.sidePoints = [
      [this.squareL * 3.5, this.squareL * 5],
      [this.squareL * -4.5, this.squareL * -6],
    ];
    this.clockPoints = [
      [this.squareL * -4.25, this.squareL * 5.5],
      [this.squareL * 4.25, this.squareL * -5.5],
    ];
    this.squareFont = ~~(this.squareL * 0.7) + 'px serif';
    this.kingFont = 'bold ' + ~~(this.squareL * 0.7) + 'px sans-serif';
    this.smallFont = ~~(this.squareL * 0.4) + 'px sans-serif';
    this.sideStyles = ['#00c', '#c00'];
    this.filterStyles = ['#00c3', '#c003'];
    this.matrix = [1, 0, 0, 1, 0, 0];
    this.lastFrameTime = 0;
    this.inversion = 0;
    this.sideNames = ['', ''];
    this.clocks = ['', ''];

    new ResizeObserver(() => {
      const canvasRect = this.el.getBoundingClientRect();
      this.el.width = canvasRect.width * devicePixelRatio;
      this.el.height = canvasRect.height * devicePixelRatio;
      this.matrix[0] = this.matrix[3] = Math.min(this.el.width / this.stageW, this.el.height / this.stageH);
      this.matrix[4] = this.el.width / 2;
      this.matrix[5] = this.el.height / 2;
      this.request();
    }).observe(this.el);

    if (this.handler) {
      on(this.el, 'mousedown', (ev) => {
        this.onPoinerDown(ev);
      });
      on(this.el, 'touchstart', (ev) => {
        this.onPoinerDown(ev.changedTouches[0]);
      });
    }
  }

  onPoinerDown(pointer) {
    const canvasRect = this.el.getBoundingClientRect();
    const i = this.inversion ? -1 : 1;
    const x = (i * ((pointer.clientX - canvasRect.left) * devicePixelRatio - this.matrix[4])) / this.matrix[0];
    const y = (i * ((pointer.clientY - canvasRect.top) * devicePixelRatio - this.matrix[5])) / this.matrix[3];
    if (this.rectContains(this.boardX, this.boardY, this.boardW, this.boardH, x, y)) {
      this.handler.onSquare(
        makeSquare(Math.floor((x - this.boardX) / this.squareL), Math.floor((y - this.boardY) / this.squareL))
      );
    } else {
      for (let side = 0; side < sideN; side++) {
        const [hx, hy, hw, hh] = this.handRects[side];
        if (this.rectContains(hx, hy, hw, hh, x, y)) {
          this.handler.onHand(side, handBases[Math.floor((side ? hx + hw - x : x - hx) / this.squareL)]);
        }
      }
    }
  }

  rectContains(rx, ry, rw, rh, px, py) {
    return px >= rx && px < rx + rw && py >= ry && py < ry + rh;
  }

  resetNext() {
    this.nextMove = 0;
    this.nextToMap = null;
  }

  request() {
    requestAnimationFrame((frameTime) => {
      if (frameTime !== this.lastFrameTime) {
        this.lastFrameTime = frameTime;
        const context = this.el.getContext('2d');
        context.save();
        try {
          context.clearRect(0, 0, this.el.width, this.el.height);
          context.setTransform(...this.matrix);
          if (this.inversion) {
            context.transform(-1, 0, 0, -1, 0, 0);
          }
          this.render(context);
        } finally {
          context.restore();
        }
      }
    });
  }

  render(context) {
    context.beginPath();
    for (let col = 1; col < colN; col++) {
      const x = this.boardX + this.squareL * col;
      context.moveTo(x, this.boardY);
      context.lineTo(x, this.boardY + this.boardH);
    }
    for (let row = 1; row < rowN; row++) {
      const y = this.boardY + this.squareL * row;
      context.moveTo(this.boardX, y);
      context.lineTo(this.boardX + this.boardW, y);
    }
    context.stroke();

    context.font = this.smallFont;
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    for (let col = 0; col < colN; col++) {
      const name = colInfos[col].name;
      const x = this.boardX + this.squareL * (0.5 + col);
      this.renderText(context, name, x, this.boardY - this.squareL / 4, this.inversion);
      this.renderText(context, name, x, this.boardY + this.boardH + this.squareL / 4, this.inversion);
    }
    for (let row = 0; row < rowN; row++) {
      const name = rowInfos[row].name;
      const y = this.boardY + this.squareL * (0.5 + row);
      this.renderText(context, name, this.boardX - this.squareL / 4, y, this.inversion);
      this.renderText(context, name, this.boardX + this.boardW + this.squareL / 4, y, this.inversion);
    }

    context.lineWidth = 4;
    context.strokeRect(this.boardX, this.boardY, this.boardW, this.boardH);
    for (let side = 0; side < sideN; side++) {
      context.strokeRect(...this.handRects[side]);
      const [sx, sy] = this.sidePoints[side];
      context.strokeRect(sx, sy, this.squareL, this.squareL);
      context.fillStyle = this.sideStyles[side];
      context.font = this.squareFont;
      this.renderText(context, sideInfos[side].char, sx + this.squareR, sy + this.squareR, side);
      context.font = this.smallFont;
      this.renderText(
        context,
        this.sideNames[side],
        sx + this.squareR,
        sy + this.squareL * (side ? -0.25 : 1.25),
        this.inversion
      );
      this.renderText(context, this.clocks[side], ...this.clockPoints[side], this.inversion);
    }

    context.fillStyle = '#000';
    for (const sq of [30, 33, 57, 60]) {
      context.beginPath();
      context.arc(...this.getSquarePoint(sq), this.squareR * 0.1, 0, Math.PI * 2);
      context.fill();
    }

    if (!this.step) {
      return;
    }

    const nextSide = this.step.position.sideToMove;
    context.fillStyle = this.filterStyles[nextSide];
    context.fillRect(...this.sidePoints[nextSide], this.squareL, this.squareL);
    if (this.nextMove) {
      context.fillStyle = this.filterStyles[nextSide];
      const nextMoveFrom = getMoveFrom(this.nextMove);
      if (isMoveDropped(this.nextMove)) {
        context.fillRect(...this.getHandPoint(nextSide, nextMoveFrom), this.squareL, this.squareL);
      } else {
        context.fillRect(...this.getSquarePoint(nextMoveFrom), this.squareL, this.squareL);
      }
    } else if (this.step.move) {
      const lastSide = nextSide ^ 1;
      context.fillStyle = this.filterStyles[lastSide];
      context.fillRect(...this.getSquarePoint(getMoveTo(this.step.move)), this.squareL, this.squareL);
      const from = getMoveFrom(this.step.move);
      if (isMoveDropped(this.step.move)) {
        context.fillRect(...this.getHandPoint(lastSide, from), this.squareL, this.squareL);
      } else {
        context.fillRect(...this.getSquarePoint(from), this.squareL, this.squareL);
      }
      if (this.step.capturedPiece) {
        context.fillRect(
          ...this.getHandPoint(lastSide, getPieceBase(this.step.capturedPiece)),
          this.squareL,
          this.squareL
        );
      }
    }

    for (let sq = 0; sq < squareN; sq++) {
      const [x, y] = this.getSquarePoint(sq);
      const piece = this.step.position.getPiece(sq);
      if (piece) {
        this.renderPiece(context, getPieceSide(piece), getPieceKind(piece), x, y);
      }
    }

    for (let side = 0; side < sideN; side++) {
      for (const base of handBases) {
        const [x, y] = this.getHandPoint(side, base);
        const handCount = this.step.position.getHandCount(side, base);
        if (handCount) {
          this.renderPiece(context, side, base, x, y, handCount);
        }
      }
    }

    if (this.nextToMap) {
      context.fillStyle = this.filterStyles[nextSide];
      for (const to of this.nextToMap.keys()) {
        const [x, y] = this.getSquarePoint(to);
        context.beginPath();
        context.arc(x + this.squareR, y + this.squareR, this.squareR * 0.8, 0, Math.PI * 2);
        context.fill();
      }
    }
  }

  getSquarePoint(sq) {
    return [this.boardX + this.squareL * getCol(sq), this.boardY + this.squareL * getRow(sq)];
  }

  getHandPoint(side, base) {
    const rect = this.handRects[side];
    const order = handOrderMap.get(base);
    return [rect[0] + this.squareL * (side ? handBaseN - 1 - order : order), rect[1]];
  }

  renderPiece(context, side, kind, x, y, count) {
    context.save();
    try {
      const cos = side ? -1 : 1;
      context.transform(cos, 0, 0, cos, x + this.squareR, y + this.squareR);

      context.beginPath();
      context.moveTo(0, -this.squareR * 0.9);
      for (const [x, y] of [
        [this.squareR * 0.7, -this.squareR * 0.6],
        [this.squareR * 0.9, this.squareR * 0.9],
        [-this.squareR * 0.9, this.squareR * 0.9],
        [-this.squareR * 0.7, -this.squareR * 0.6],
      ]) {
        context.lineTo(x, y);
      }
      context.closePath();
      context.fillStyle = '#fe9';
      context.fill();
      context.lineWidth = 2;
      context.strokeStyle = '#666';
      context.stroke();

      context.font = kind === KING ? this.kingFont : this.squareFont;
      context.textAlign = 'center';
      context.fillStyle = this.sideStyles[side];
      const ty = this.squareR * 0.1;
      const text = kindInfos[kind].name;
      if (text[1]) {
        context.scale(1, 0.5);
        context.textBaseline = 'bottom';
        context.fillText(text[0], 0, ty);
        context.textBaseline = 'top';
        context.fillText(text[1], 0, ty);
      } else {
        context.textBaseline = 'middle';
        context.fillText(text, 0, ty);
      }
      if (count > 1) {
        context.font = this.smallFont;
        context.textBaseline = 'middle';
        this.renderText(context, count, 0, this.squareL * 0.75, this.inversion ^ side);
      }
    } finally {
      context.restore();
    }
  }

  renderText(context, text, x, y, inversion) {
    context.save();
    try {
      const cos = inversion ? -1 : 1;
      context.transform(cos, 0, 0, cos, x, y);
      context.fillText(text, 0, 0);
    } finally {
      context.restore();
    }
  }
}
