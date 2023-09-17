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
    this.squareW = 100;
    this.squareH = 105;
    this.stageW = this.squareW * 10;
    this.stageH = this.squareH * 13;
    this.boardW = this.squareW * 9;
    this.boardH = this.squareH * 9;
    this.boardX = this.squareW * -4.5;
    this.boardY = this.squareH * -4.5;
    this.handRects = [
      [this.squareW * -3.5, this.squareH * 5, this.squareW * 7, this.squareH],
      [this.squareW * -3.5, this.squareH * -6, this.squareW * 7, this.squareH],
    ];
    this.sidePoints = [
      [this.squareW * 3.5, this.squareH * 5],
      [this.squareW * -4.5, this.squareH * -6],
    ];
    this.clockPoints = [
      [this.squareW * -4.25, this.squareH * 5.5],
      [this.squareW * 4.25, this.squareH * -5.5],
    ];
    const tana = Math.tan((81 / 180) * Math.PI);
    const tanc = Math.tan((72 / 180) * Math.PI);
    this.baseShapes = [
      [0.9, 0.9],
      [0.83, 0.83],
      [0.84, 0.84],
      [0.85, 0.85],
      [0.86, 0.86],
      [0.88, 0.88],
      [0.89, 0.89],
      [0.87, 0.87],
    ].map(([w, h], base) => {
      const ax = (w / 2) * this.squareW;
      const ay = (h / 2) * this.squareH;
      const by = (ay * (1 + tana * tanc) - ax * tana) / (1 - tana * tanc);
      const bx = (ay + by) * tanc;
      const fontSize = ~~(ax * 1.3);
      return { ax, ay, bx, by, font: base ? `${fontSize}px serif` : `bold ${fontSize}px sans-serif` };
    });
    this.shapeTy = this.squareH * 0.05;
    this.sideFont = ~~(this.squareW * 0.8) + 'px serif';
    this.countFont = ~~(this.squareW * 0.4) + 'px sans-serif';
    this.addrFont = ~~(this.squareW * 0.3) + 'px sans-serif';
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
        makeSquare(Math.floor((x - this.boardX) / this.squareW), Math.floor((y - this.boardY) / this.squareH))
      );
    } else {
      for (let side = 0; side < sideN; side++) {
        const [hx, hy, hw, hh] = this.handRects[side];
        if (this.rectContains(hx, hy, hw, hh, x, y)) {
          this.handler.onHand(side, handBases[Math.floor((side ? hx + hw - x : x - hx) / this.squareW)]);
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
      const x = this.boardX + this.squareW * col;
      context.moveTo(x, this.boardY);
      context.lineTo(x, this.boardY + this.boardH);
    }
    for (let row = 1; row < rowN; row++) {
      const y = this.boardY + this.squareH * row;
      context.moveTo(this.boardX, y);
      context.lineTo(this.boardX + this.boardW, y);
    }
    context.stroke();

    context.font = this.addrFont;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    for (let col = 0; col < colN; col++) {
      const name = colInfos[col].name;
      const x = this.boardX + this.squareW * (0.5 + col);
      this.renderText(context, name, x, this.boardY - this.squareH * 0.2, this.inversion);
      this.renderText(context, name, x, this.boardY + this.boardH + this.squareH * 0.2, this.inversion);
    }
    for (let row = 0; row < rowN; row++) {
      const name = rowInfos[row].name;
      const y = this.boardY + this.squareH * (0.5 + row);
      this.renderText(context, name, this.boardX - this.squareW * 0.2, y, this.inversion);
      this.renderText(context, name, this.boardX + this.boardW + this.squareW * 0.2, y, this.inversion);
    }

    if (!this.pieceStyle) {
      return;
    }

    context.lineWidth = 4;
    context.strokeRect(this.boardX, this.boardY, this.boardW, this.boardH);
    for (let side = 0; side < sideN; side++) {
      context.strokeRect(...this.handRects[side]);
      const [sx, sy] = this.sidePoints[side];
      context.strokeRect(sx, sy, this.squareW, this.squareH);
      context.fillStyle = this.pieceStyle.textColors[side];
      context.font = this.sideFont;
      this.renderText(context, sideInfos[side].char, sx + this.squareW / 2, sy + this.squareH / 2, side);
      context.font = this.countFont;
      this.renderText(
        context,
        this.sideNames[side],
        sx + this.squareW / 2,
        sy + this.squareH * (side ? -0.25 : 1.25),
        this.inversion
      );
      this.renderText(context, this.clocks[side], ...this.clockPoints[side], this.inversion);
    }

    context.fillStyle = '#000';
    for (const sq of [30, 33, 57, 60]) {
      context.beginPath();
      context.arc(...this.getSquarePoint(sq), this.squareW * 0.05, 0, Math.PI * 2);
      context.fill();
    }

    if (!this.step) {
      return;
    }

    const nextSide = this.step.position.sideToMove;
    context.fillStyle = this.pieceStyle.filterColors[nextSide];
    context.fillRect(...this.sidePoints[nextSide], this.squareW, this.squareH);
    if (this.nextMove) {
      context.fillStyle = this.pieceStyle.filterColors[nextSide];
      const nextMoveFrom = getMoveFrom(this.nextMove);
      if (isMoveDropped(this.nextMove)) {
        context.fillRect(...this.getHandPoint(nextSide, nextMoveFrom), this.squareW, this.squareH);
      } else {
        context.fillRect(...this.getSquarePoint(nextMoveFrom), this.squareW, this.squareH);
      }
    } else if (this.step.move) {
      const lastSide = nextSide ^ 1;
      context.fillStyle = this.pieceStyle.filterColors[lastSide];
      context.fillRect(...this.getSquarePoint(getMoveTo(this.step.move)), this.squareW, this.squareH);
      const from = getMoveFrom(this.step.move);
      if (isMoveDropped(this.step.move)) {
        context.fillRect(...this.getHandPoint(lastSide, from), this.squareW, this.squareH);
      } else {
        context.fillRect(...this.getSquarePoint(from), this.squareW, this.squareH);
      }
      if (this.step.capturedPiece) {
        context.fillRect(
          ...this.getHandPoint(lastSide, getPieceBase(this.step.capturedPiece)),
          this.squareW,
          this.squareH
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
      context.fillStyle = this.pieceStyle.filterColors[nextSide];
      for (const to of this.nextToMap.keys()) {
        const [x, y] = this.getSquarePoint(to);
        context.beginPath();
        context.arc(x + this.squareW / 2, y + this.squareH / 2, this.squareW * 0.4, 0, Math.PI * 2);
        context.fill();
      }
    }
  }

  getSquarePoint(sq) {
    return [this.boardX + this.squareW * getCol(sq), this.boardY + this.squareH * getRow(sq)];
  }

  getHandPoint(side, base) {
    const rect = this.handRects[side];
    const order = handOrderMap.get(base);
    return [rect[0] + this.squareW * (side ? handBaseN - 1 - order : order), rect[1]];
  }

  renderPiece(context, side, kind, x, y, count) {
    context.save();
    try {
      const cos = side ? -1 : 1;
      context.transform(cos, 0, 0, cos, x + this.squareW / 2, y + this.squareH / 2);

      const { ax, ay, bx, by, font } = this.baseShapes[getPieceBase(kind)];
      context.beginPath();
      context.moveTo(0, -ay);
      context.lineTo(bx, by);
      context.lineTo(ax, ay);
      context.lineTo(-ax, ay);
      context.lineTo(-bx, by);
      context.closePath();
      context.fillStyle = '#fe9';
      context.fill();
      context.lineWidth = 2;
      context.strokeStyle = '#666';
      context.stroke();

      context.font = font;
      context.textAlign = 'center';
      context.fillStyle = kind > KING ? this.pieceStyle.promotedColors[side] : this.pieceStyle.textColors[side];
      const text = kindInfos[kind].name;
      if (text[1]) {
        context.scale(1, 0.5);
        context.textBaseline = 'bottom';
        context.fillText(text[0], 0, this.shapeTy);
        context.textBaseline = 'top';
        context.fillText(text[1], 0, this.shapeTy);
      } else {
        context.textBaseline = 'middle';
        context.fillText(text, 0, this.shapeTy);
      }
      if (count > 1) {
        context.font = this.countFont;
        context.textBaseline = 'middle';
        this.renderText(context, count, 0, this.squareH * 0.75, this.inversion ^ side);
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
