import ConfirmView from './ConfirmView.mjs';
import ExportView from './ExportView.mjs';
import SettingsView from './SettingsView.mjs';
import { on } from './browser.mjs';
import {
  colInfos,
  colN,
  demotePiece,
  formatTimeMS,
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
  isKindPromotable,
  isKindPromoted,
  isMoveDropped,
  KING,
  makeDrop,
  makeMove,
  makePiece,
  makeSquare,
  promotePiece,
  rowInfos,
  rowN,
  sideInfos,
  sides,
  squareN,
} from './shogi.mjs';

function rectContains(rx, ry, rw, rh, px, py) {
  return px >= rx && px < rx + rw && py >= ry && py < ry + rh;
}

export default class ShogiPanel {
  constructor(el, handler, editing) {
    this.el = el;
    this.handler = handler;
    this.editing = editing;
    this.editingPiece = 0;
    this.squareW = 100;
    this.squareH = 105;
    this.stageW = this.squareW * 10;
    this.stageH = this.squareH * (this.editing ? 16 : 13);
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
    this.playerPoints = [
      [this.squareW * 4.5, this.squareH * 6.25],
      [this.squareW * -4.5, this.squareH * -6.25],
    ];
    this.stockRects = [
      [this.squareW * -4.5, this.squareH * 6.5, this.squareW * 8, this.squareH],
      [this.squareW * -3.5, this.squareH * -7.5, this.squareW * 8, this.squareH],
    ];
    this.bulkPoints = [
      [this.squareW * 3.5, this.squareH * 6.5],
      [this.squareW * -4.5, this.squareH * -7.5],
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
    this.sideFont = ~~(this.squareW * 0.8) + 'px sans-serif';
    this.countFont = 'bold ' + ~~(this.squareW * 0.4) + 'px sans-serif';
    this.playerFont = ~~(this.squareW * 0.4) + 'px sans-serif';
    this.addrFont = ~~(this.squareW * 0.3) + 'px sans-serif';
    this.matrix = [1, 0, 0, 1, 0, 0];
    this.lastFrameTime = 0;
    this.clockTimes = [-1, -1];

    new ResizeObserver(() => {
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
    if (!this.handler?.onPointerBefore?.(pointer)) {
      return;
    }
    const canvasRect = this.el.getBoundingClientRect();
    const i = this.game.flipped ? -1 : 1;
    const x = (i * ((pointer.clientX - canvasRect.left) * devicePixelRatio - this.matrix[4])) / this.matrix[0];
    const y = (i * ((pointer.clientY - canvasRect.top) * devicePixelRatio - this.matrix[5])) / this.matrix[3];
    if (rectContains(this.boardX, this.boardY, this.boardW, this.boardH, x, y)) {
      const sq = makeSquare(Math.floor((x - this.boardX) / this.squareW), Math.floor((y - this.boardY) / this.squareH));
      if (this.editing) {
        const piece = this.step.position.getPiece(sq);
        if (piece) {
          const kind = getPieceKind(piece);
          if (isKindPromotable(kind) && !isKindPromoted(kind)) {
            this.step.position.setPiece(sq, promotePiece(piece));
          } else {
            this.step.position.setPiece(sq, 0);
            this.stockCounts[getPieceBase(piece)]++;
            this.editingPiece = isKindPromoted(kind) ? demotePiece(piece) : piece;
          }
        } else {
          const base = getPieceBase(this.editingPiece);
          if (this.stockCounts[base]) {
            this.step.position.setPiece(sq, this.editingPiece);
            this.stockCounts[base]--;
          }
        }
        this.request();
      } else {
        this.doSquare(sq);
      }
      return;
    }
    for (const side of sides) {
      const [hx, hy, hw, hh] = this.handRects[side];
      if (rectContains(hx, hy, hw, hh, x, y)) {
        const base = handBases[Math.floor((side ? hx + hw - x : x - hx) / this.squareW)];
        if (this.editing) {
          if (this.stockCounts[base]) {
            this.step.position.addHandCount(side, base, 1);
            this.stockCounts[base]--;
          } else {
            const count = this.step.position.getHandCount(side, base);
            if (count) {
              this.step.position.addHandCount(side, base, -count);
              this.stockCounts[base] += count;
            }
          }
          this.editingPiece = makePiece(base, side);
          this.request();
        } else {
          this.doHand(side, base);
        }
        return;
      }
    }
    if (this.editing) {
      for (const side of sides) {
        const [sx, sy, sw, sh] = this.stockRects[side];
        if (rectContains(sx, sy, sw, sh, x, y)) {
          const order = Math.floor((side ? sx + sw - x : x - sx) / this.squareW);
          const base = order ? handBases[order - 1] : KING;
          this.editingPiece = makePiece(base, side);
          this.request();
          return;
        }
        if (rectContains(...this.sidePoints[side], this.squareW, this.squareH, x, y)) {
          this.step.position.sideToMove = side;
          this.request();
          return;
        }
        if (rectContains(...this.bulkPoints[side], this.squareW, this.squareH, x, y)) {
          if (this.stockCounts.some((count, base) => base && count)) {
            for (const base of handBases) {
              this.step.position.addHandCount(side, base, this.stockCounts[base]);
              this.stockCounts[base] = 0;
            }
          } else {
            for (const base of handBases) {
              const count = this.step.position.getHandCount(side, base);
              if (count) {
                this.stockCounts[base] += count;
                this.step.position.addHandCount(side, base, -count);
              }
            }
          }
          this.request();
          return;
        }
      }
    }
  }

  async doSquare(sq) {
    if (this.nextToMap?.has(sq)) {
      const nextFrom = getMoveFrom(this.nextMove);
      if (isMoveDropped(this.nextMove)) {
        this.handler?.onMove(makeDrop(nextFrom, sq));
      } else {
        let promoted = this.nextToMap.get(sq) - 1;
        if (promoted === 2) {
          promoted = await new ConfirmView().show(this.app, '成りますか?', ['成らない', '成る']);
        }
        this.handler?.onMove(makeMove(nextFrom, sq, promoted));
      }
    } else if (this.nextMove && !isMoveDropped(this.nextMove) && getMoveFrom(this.nextMove) === sq) {
      this.resetNext();
    } else {
      const piece = this.step.position.getPiece(sq);
      if (piece) {
        if (getPieceSide(piece) === this.step.position.sideToMove) {
          this.nextMove = makeMove(sq, squareN);
          this.nextToMap = this.step.fromToMap?.get(this.nextMove);
        }
      }
    }
    this.request();
  }

  async doHand(side, base) {
    if (side !== this.step.position.sideToMove) {
      return;
    }
    if (!this.step.position.getHandCount(side, base)) {
      return;
    }
    if (this.nextMove && isMoveDropped(this.nextMove) && getMoveFrom(this.nextMove) === base) {
      this.resetNext();
    } else {
      this.nextMove = makeDrop(base, squareN);
      this.nextToMap = this.step.fromToMap?.get(this.nextMove);
    }
    this.request();
  }

  changeStep(step) {
    this.step = step;
    this.resetNext();
    this.bestMove = 0;
  }

  resetNext() {
    this.nextMove = 0;
    this.nextToMap = null;
  }

  request() {
    requestAnimationFrame((frameTime) => {
      if (frameTime !== this.lastFrameTime) {
        this.lastFrameTime = frameTime;
        const canvasRect = this.el.getBoundingClientRect();
        this.el.width = canvasRect.width * devicePixelRatio;
        this.el.height = canvasRect.height * devicePixelRatio;
        this.matrix[0] = this.matrix[3] = Math.min(this.el.width / this.stageW, this.el.height / this.stageH);
        this.matrix[4] = this.el.width / 2;
        this.matrix[5] = this.el.height / 2;
        const context = this.el.getContext('2d');
        context.save();
        try {
          context.clearRect(0, 0, this.el.width, this.el.height);
          context.setTransform(...this.matrix);
          if (this.game.flipped) {
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
    if (!this.step) {
      return;
    }
    context.lineCap = context.lineJoin = 'round';

    this.pieceStyle = this.app.getPieceStyle();
    this.pieceTitleSet = this.app.getPieceTitleSet();
    const nextSide = this.step.position.sideToMove;
    const nextFilterColor = this.pieceStyle.filterColors[nextSide];
    context.fillStyle = nextFilterColor;
    context.fillRect(...this.sidePoints[nextSide], this.squareW, this.squareH);
    const lastSide = nextSide ^ 1;

    if (this.nextMove) {
      context.fillStyle = nextFilterColor;
      const nextMoveFrom = getMoveFrom(this.nextMove);
      if (isMoveDropped(this.nextMove)) {
        context.fillRect(...this.getHandPoint(nextSide, nextMoveFrom), this.squareW, this.squareH);
      } else {
        context.fillRect(...this.getSquarePoint(nextMoveFrom), this.squareW, this.squareH);
      }
    } else if (this.step.move) {
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
          this.squareH,
        );
      }
    }

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

    context.fillStyle = '#000';
    for (const sq of [30, 33, 57, 60]) {
      context.beginPath();
      context.arc(...this.getSquarePoint(sq), this.squareW * 0.05, 0, Math.PI * 2);
      context.fill();
    }

    context.font = this.addrFont;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    for (let col = 0; col < colN; col++) {
      const name = colInfos[col].name;
      const x = this.boardX + this.squareW * (0.5 + col);
      this.renderText(context, name, x, this.boardY - this.squareH * 0.2, this.game.flipped);
      this.renderText(context, name, x, this.boardY + this.boardH + this.squareH * 0.2, this.game.flipped);
    }
    for (let row = 0; row < rowN; row++) {
      const name = rowInfos[row].name;
      const y = this.boardY + this.squareH * (0.5 + row);
      this.renderText(context, name, this.boardX - this.squareW * 0.2, y, this.game.flipped);
      this.renderText(context, name, this.boardX + this.boardW + this.squareW * 0.2, y, this.game.flipped);
    }

    context.lineWidth = 4;
    context.strokeRect(this.boardX, this.boardY, this.boardW, this.boardH);
    context.font = this.sideFont;
    for (const side of sides) {
      context.strokeRect(...this.handRects[side]);
      const [sx, sy] = this.sidePoints[side];
      context.strokeRect(sx, sy, this.squareW, this.squareH);
      this.renderText(context, sideInfos[side].char, sx + this.squareW / 2, sy + this.squareH / 2, side);
    }
    context.font = this.playerFont;
    for (const side of sides) {
      const playerTitle = (this.game.getSideName(side) + ' ' + this.game.players[side].name).trim();
      if (playerTitle) {
        context.textAlign = side ^ this.game.flipped ? 'left' : 'right';
        this.renderText(context, playerTitle, ...this.playerPoints[side], this.game.flipped);
      }
    }
    context.textAlign = 'center';
    for (const side of sides) {
      const clockTime = this.clockTimes[side];
      if (clockTime >= 0) {
        context.fillStyle = this.game.players[side].isTimeLimited() && clockTime <= 10_000 ? '#f00' : '#000';
        this.renderText(context, formatTimeMS(clockTime), ...this.clockPoints[side], this.game.flipped);
      }
    }

    if (this.step.count) {
      context.fillStyle = lastSide ? '#000' : '#fff';
      this.renderText(
        context,
        this.step.count,
        this.sidePoints[lastSide][0] + this.squareW / 2,
        this.sidePoints[lastSide][1] + this.squareH / 2,
        this.game.flipped,
        lastSide ? '#fff' : '#000',
      );
    }

    for (let sq = 0; sq < squareN; sq++) {
      const piece = this.step.position.getPiece(sq);
      if (piece) {
        this.renderPiece(context, getPieceSide(piece), getPieceKind(piece), this.getSquarePoint(sq));
      }
    }
    for (const side of sides) {
      for (const base of handBases) {
        const handCount = this.step.position.getHandCount(side, base);
        if (handCount) {
          this.renderPiece(context, side, base, this.getHandPoint(side, base), handCount);
        }
      }
    }

    if (this.editing) {
      if (this.editingPiece) {
        const side = getPieceSide(this.editingPiece);
        context.fillStyle = this.pieceStyle.filterColors[side];
        context.fillRect(...this.getStockPoint(side, getPieceBase(this.editingPiece)), this.squareW, this.squareH);
      }
      context.font = this.sideFont;
      context.fillStyle = '#000';
      for (const side of sides) {
        const [bx, by] = this.bulkPoints[side];
        context.strokeRect(bx, by, this.squareW, this.squareH);
        this.renderText(context, '↕︎', bx + this.squareW / 2, by + this.squareH / 2, side);
        context.strokeRect(...this.stockRects[side]);
        for (let base = 0; base < this.stockCounts.length; base++) {
          const count = this.stockCounts[base];
          if (count) {
            this.renderPiece(context, side, base || KING, this.getStockPoint(side, base), count);
          }
        }
      }
    }

    context.lineWidth = 2;
    context.strokeStyle = '#666';

    if (this.nextToMap) {
      context.fillStyle = nextFilterColor;
      for (const to of this.nextToMap.keys()) {
        const [x, y] = this.getSquarePoint(to);
        context.beginPath();
        context.arc(x + this.squareW / 2, y + this.squareH / 2, this.squareW * 0.45, 0, Math.PI * 2);
        context.fill();
        context.stroke();
      }
    }

    if (this.bestMove) {
      context.fillStyle = nextFilterColor;
      this.renderArrow(context, this.bestMove, nextSide);
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

  getStockPoint(side, base) {
    const rect = this.stockRects[side];
    const order = base ? handOrderMap.get(base) : -1;
    return [rect[0] + this.squareW * (side ? handBaseN - 1 - order : 1 + order), rect[1]];
  }

  renderPiece(context, side, kind, [x, y], count) {
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
      context.fillStyle = this.pieceStyle.bodyColors[side];
      context.fill();
      context.lineWidth = 2;
      context.strokeStyle = '#666';
      context.stroke();

      context.font = font;
      context.textAlign = 'center';
      context.fillStyle = isKindPromoted(kind)
        ? this.pieceStyle.promotedColors[side]
        : this.pieceStyle.textColors[side];
      const [ch0, ch1] = this.pieceTitleSet.titles[makePiece(kind, side)];
      if (ch1) {
        context.save();
        try {
          context.scale(0.8, 0.6);
          context.textBaseline = 'bottom';
          context.fillText(ch0, 0, this.shapeTy);
          context.textBaseline = 'top';
          context.fillText(ch1, 0, this.shapeTy);
        } finally {
          context.restore();
        }
      } else {
        context.textBaseline = 'middle';
        context.fillText(ch0, 0, this.shapeTy);
      }

      if (count > 1) {
        if (side ^ this.game.flipped) {
          context.transform(-1, 0, 0, -1, 0, 0);
        }
        context.font = this.countFont;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        const cx = this.squareW * 0.25;
        const cy = this.squareH * 0.25;
        context.lineWidth = 8;
        context.strokeStyle = '#000';
        context.strokeText(count, cx, cy);
        context.fillStyle = '#fff';
        context.fillText(count, cx, cy);
      }
    } finally {
      context.restore();
    }
  }

  renderText(context, text, x, y, flipped, strokeStyle) {
    if (text) {
      context.save();
      try {
        const cos = flipped ? -1 : 1;
        context.transform(cos, 0, 0, cos, x, y);
        if (strokeStyle) {
          context.lineWidth = 8;
          context.strokeStyle = strokeStyle;
          context.strokeText(text, 0, 0);
        }
        context.fillText(text, 0, 0);
      } finally {
        context.restore();
      }
    }
  }

  renderArrow(context, move, side) {
    if (!move) {
      return;
    }
    const [toX, toY] = this.getSquarePoint(getMoveTo(move));
    const from = getMoveFrom(move);
    const [fromX, fromY] = isMoveDropped(move) ? this.getHandPoint(side, from) : this.getSquarePoint(from);
    const l = Math.hypot(toX - fromX, toY - fromY);
    const r = this.squareW * 0.1;
    const rr = r * 3;
    context.save();
    try {
      context.translate(toX + this.squareW / 2, toY + this.squareW / 2);
      context.rotate(Math.atan2(toY - fromY, toX - fromX));
      context.beginPath();
      context.moveTo(0, 0);
      context.lineTo(-rr, -rr);
      context.lineTo(-rr, -r);
      context.lineTo(-l, -r);
      context.lineTo(-l, r);
      context.lineTo(-rr, r);
      context.lineTo(-rr, rr);
      context.closePath();
      context.fill();
      context.stroke();
    } finally {
      context.restore();
    }
  }

  createMenuItems() {
    return [
      {
        title: '盤面の反転',
        callback: () => {
          this.game.flipped ^= 1;
          this.request();
        },
      },
      {
        title: '棋譜・局面の書き出し',
        callback: async () => {
          await new ExportView().show(this.app, this.game, this.step);
        },
      },
      {
        title: 'アプリ設定',
        callback: async () => {
          if (await new SettingsView().show(this.app)) {
            this.request();
          }
        },
      },
    ];
  }

  initClocks() {
    for (const side of sides) {
      const player = this.game.players[side];
      player.initRestTime();
      this.clockTimes[side] = player.getClockTime();
    }
  }

  startClock(side) {
    clearInterval(this.intervalId);
    const player = this.game.players[side];
    player.startClock();
    this.clockTimes[side] = player.getClockTime();
    this.intervalId = setInterval(() => {
      const clockTime = player.getClockTime();
      this.clockTimes[side] = clockTime;
      if (player.isTimeLimited() && clockTime <= 0) {
        clearInterval(this.intervalId);
        this.handler?.onExpired?.();
      }
      this.request();
    }, 200);
  }

  stopClock(side) {
    clearInterval(this.intervalId);
    const player = this.game.players[side];
    this.clockTimes[side] = player.getClockTime();
    return player.stopClock();
  }
}
