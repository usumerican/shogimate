export const sideN = 2;
export const BLACK = 0;
export const WHITE = 1;
export const sideInfos = [
  { char: '☗', usi: 'b' },
  { char: '☖', usi: 'w' },
];

export const colN = 9;
export const colInfos = [
  { name: '９', char: '9' },
  { name: '８', char: '8' },
  { name: '７', char: '7' },
  { name: '６', char: '6' },
  { name: '５', char: '5' },
  { name: '４', char: '4' },
  { name: '３', char: '3' },
  { name: '２', char: '2' },
  { name: '１', char: '1' },
];
export const textColMap = colInfos.reduce(
  (map, info, col) => (map.set(info.name, col).set(info.char, col), map),
  new Map()
);

export const rowN = 9;
export const rowInfos = [
  { name: '一', char: '1', usi: 'a' },
  { name: '二', char: '2', usi: 'b' },
  { name: '三', char: '3', usi: 'c' },
  { name: '四', char: '4', usi: 'd' },
  { name: '五', char: '5', usi: 'e' },
  { name: '六', char: '6', usi: 'f' },
  { name: '七', char: '7', usi: 'g' },
  { name: '八', char: '8', usi: 'h' },
  { name: '九', char: '9', usi: 'i' },
];
export const textRowMap = rowInfos.reduce(
  (map, info, row) => (map.set(info.name, row).set(info.char, row).set(info.usi, row), map),
  new Map()
);

export const squareN = colN * rowN;

export function makeSquare(col, row) {
  return colN * row + col;
}

export function getCol(sq) {
  return sq % colN;
}

export function getRow(sq) {
  return Math.floor(sq / colN);
}

export const PAWN = 1;
export const LANCE = 2;
export const KNIGHT = 3;
export const SILVER = 4;
export const BISHOP = 5;
export const ROOK = 6;
export const GOLD = 7;
export const KING = 8;

export const pieceBaseMask = 7;
export const piecePromotedMask = 8;
export const pieceKindMask = 15;
export const pieceSideShift = 4;

export function makePiece(kind, side) {
  return kind | (side << pieceSideShift);
}

export function getPieceBase(piece) {
  return piece & pieceBaseMask;
}

export function getPieceKind(piece) {
  return piece & pieceKindMask;
}

export function getPieceSide(piece) {
  return piece >> pieceSideShift;
}

export function promotePiece(piece) {
  return piece | piecePromotedMask;
}

export const kindInfos = [
  null,
  { name: '歩', usi: 'P' },
  { name: '香', usi: 'L' },
  { name: '桂', usi: 'N' },
  { name: '銀', usi: 'S' },
  { name: '角', usi: 'B' },
  { name: '飛', usi: 'R' },
  { name: '金', usi: 'G' },
  { name: '玉', usi: 'K' },
  { name: 'と', usi: '+P' },
  { name: '成香', usi: '+L' },
  { name: '成桂', usi: '+N' },
  { name: '成銀', usi: '+S' },
  { name: '馬', usi: '+B' },
  { name: '竜', usi: '+R' },
];
export const pieceInfos = kindInfos.reduce((arr, info, kind) => {
  if (info) {
    arr[kind] = info;
    arr[makePiece(kind, WHITE)] = { name: info.name, usi: info.usi.toLowerCase() };
  }
  return arr;
}, []);
export const usiPieceMap = arrayToMap(pieceInfos.map((info) => info.usi));

export const handBaseN = 7;
export const handBases = [ROOK, BISHOP, GOLD, SILVER, KNIGHT, LANCE, PAWN];
export const handOrderMap = arrayToMap(handBases);

export const moveToMask = 0x7f;
export const movePromotedMask = 1 << 7;
export const moveDroppedMask = 1 << 8;
export const moveFromShift = 9;

export function makeMove(from, to, promoted) {
  return to | (from << moveFromShift) | (promoted && movePromotedMask);
}

export function makeDrop(base, to) {
  return to | (base << moveFromShift) | moveDroppedMask;
}

export function getMoveTo(move) {
  return move ? move & moveToMask : -1;
}

export function isMovePromoted(move) {
  return move & movePromotedMask;
}

export function isMoveDropped(move) {
  return move & moveDroppedMask;
}

export function getMoveFrom(move) {
  return move ? move >> moveFromShift : -1;
}

export class Position {
  constructor({ board, handCounts, sideToMove, number } = {}) {
    this.board = board ? board.slice() : new Int8Array(squareN);
    this.handCounts = handCounts ? handCounts.slice() : new Int8Array(handBaseN * sideN);
    this.sideToMove = sideToMove || 0;
    this.number = number || 0;
  }

  getPiece(sq) {
    return this.board[sq];
  }

  setPiece(sq, piece) {
    this.board[sq] = piece;
  }

  getHandCount(side, base) {
    return this.handCounts[handBaseN * side + base - 1];
  }

  addHandCount(side, base, d) {
    this.handCounts[handBaseN * side + base - 1] += d;
  }

  doMove(move) {
    const from = getMoveFrom(move);
    const to = getMoveTo(move);
    const capturedPiece = this.getPiece(to);
    if (isMoveDropped(move)) {
      this.setPiece(to, makePiece(from, this.sideToMove));
      this.addHandCount(this.sideToMove, from, -1);
    } else {
      if (capturedPiece) {
        const base = getPieceBase(capturedPiece);
        this.addHandCount(this.sideToMove, base, 1);
      }
      const piece = this.getPiece(from);
      this.setPiece(to, isMovePromoted(move) ? promotePiece(piece) : piece);
      this.setPiece(from, 0);
    }
    this.sideToMove ^= 1;
    this.number++;
    return capturedPiece;
  }
}

export function formatSfen(pos) {
  let sfen = '';
  for (let row = 0; row < rowN; row++) {
    if (row) {
      sfen += '/';
    }
    let empty = 0;
    for (let col = 0; col < colN; col++) {
      const piece = pos.getPiece(makeSquare(col, row));
      if (piece) {
        if (empty) {
          sfen += empty;
          empty = 0;
        }
        sfen += pieceInfos[piece].usi;
      } else {
        empty++;
      }
    }
    if (empty) {
      sfen += empty;
    }
  }
  sfen += ' ' + sideInfos[pos.sideToMove].usi + ' ';
  let handsUsi = '';
  for (let side = 0; side < sideN; side++) {
    for (const base of handBases) {
      const count = pos.getHandCount(side, base);
      if (count) {
        if (count > 1) {
          handsUsi += count;
        }
        handsUsi += pieceInfos[makePiece(base, side)].usi;
      }
    }
  }
  return sfen + (handsUsi || '-') + ' ' + pos.number;
}

export const endInfos = [
  { name: '投了', usi: 'resign' },
  { name: '入玉勝ち', usi: 'win' },
  { name: '千日手', usi: 'rep_draw' },
  { name: '反則勝ち', usi: 'rep_win' },
  { name: '反則負け', usi: 'rep_lose' },
  { name: '優等局面', usi: 'rep_sup' },
  { name: '劣等局面', usi: 'rep_inf' },
];
export const usiEndNameMap = endInfos.reduce((map, info) => (info.usi && map.set(info.usi, info.name), map), new Map());

export class Step {
  constructor({ parent, children, move, position, capturedPiece, endName } = {}) {
    this.parent = parent;
    this.children = children ? children.slice() : [];
    this.move = move || 0;
    this.position = position;
    this.capturedPiece = capturedPiece || 0;
    this.endName = endName || '';
  }

  isMove() {
    return this.parent && !this.endName;
  }

  appendMove(move) {
    const position = new Position(this.position);
    const capturedPiece = position.doMove(move);
    const step = new Step({ parent: this, move, position, capturedPiece });
    this.children.push(step);
    return step;
  }

  appendEnd(endName) {
    const step = new Step(this);
    step.endName = endName;
    this.children.push(step);
    return step;
  }
}

export function formatStep(step) {
  if (!step.parent) {
    return '開始局面';
  }
  if (step.endName) {
    return step.endName;
  }
  const to = getMoveTo(step.move);
  const prefix = sideInfos[step.position.sideToMove ^ 1].char + colInfos[getCol(to)].name + rowInfos[getRow(to)].name;
  const from = getMoveFrom(step.move);
  if (isMoveDropped(step.move)) {
    return prefix + kindInfos[from].name + '打';
  }
  const piece = step.position.getPiece(to);
  return (
    prefix +
    (isMovePromoted(step.move) ? kindInfos[getPieceBase(piece)].name + '成' : kindInfos[getPieceKind(piece)].name) +
    `(${colInfos[getCol(from)].char}${rowInfos[getRow(from)].char})`
  );
}

export const defaultSfen = 'lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1';

export class Game {
  constructor({ startStep } = {}) {
    this.startStep = startStep;
  }
}

export function formatSquareUsi(sq) {
  return colInfos[getCol(sq)].char + rowInfos[getRow(sq)].usi;
}

export function formatMoveUsi(move) {
  const from = getMoveFrom(move);
  const toUsi = formatSquareUsi(getMoveTo(move));
  return isMoveDropped(move)
    ? pieceInfos[from].usi + '*' + toUsi
    : formatSquareUsi(from) + toUsi + (isMovePromoted(move) ? '+' : '');
}

export function formatGameUsi(game) {
  const sfen = formatSfen(game.startStep.position);
  let movesUsi = '';
  let step = game.startStep.children[0];
  while (step) {
    if (!step.move) {
      break;
    }
    movesUsi += ' ' + formatMoveUsi(step.move);
    step = step.children[0];
  }
  return 'position ' + (sfen === defaultSfen ? 'startpos' : 'sfen ' + sfen) + (movesUsi ? ' moves' + movesUsi : '');
}

export function parseSfen(sfen) {
  const pos = new Position();
  if (!sfen) {
    return pos;
  }
  const [boardUsi, sideUsi, handsUsi, numStr] = sfen.split(/\s+/);
  let row = 0;
  for (const rowUsi of boardUsi.split('/')) {
    let sq = makeSquare(0, row);
    for (const [, emptyStr, pieceUsi] of rowUsi.matchAll(/(\d)|(\+?[a-zA-Z])/g)) {
      if (emptyStr) {
        for (let i = +emptyStr; i--; ) {
          pos.setPiece(sq++, 0);
        }
      } else {
        const piece = usiPieceMap.get(pieceUsi);
        if (piece) {
          pos.setPiece(sq++, piece);
        }
      }
    }
    row++;
  }
  for (const [, countStr, pieceUsi] of handsUsi.matchAll(/(\d*)([a-zA-Z])/g)) {
    const piece = usiPieceMap.get(pieceUsi);
    if (piece) {
      pos.addHandCount(getPieceSide(piece), getPieceBase(piece), +countStr || 1);
    }
  }
  pos.sideToMove = +(sideUsi === sideInfos[1].usi);
  pos.number = +numStr;
  return pos;
}

export function parseSquareUsi(squareUsi) {
  return makeSquare(textColMap.get(squareUsi[0]), textRowMap.get(squareUsi[1]));
}

export function parseMoveUsi(moveUsi) {
  const found = moveUsi.match(/^(?:([A-Z])\*|([1-9][a-i]))([1-9][a-i])(\+)?$/);
  if (!found) {
    return 0;
  }
  const [, baseUsi, fromUsi, toUsi, promoted] = found;
  const to = parseSquareUsi(toUsi);
  if (baseUsi) {
    return makeDrop(usiPieceMap.get(baseUsi), to);
  }
  return makeMove(parseSquareUsi(fromUsi), to, promoted);
}

export function parseGameUsi(gameUsi) {
  const found = gameUsi
    .trim()
    .match(/^(?:position\s+)?(?:startpos|(?:sfen\s+)?(\S+\s+\S+\s+\S+\s+\d+))(?:\s+moves\s+(.+))?$/);
  if (!found) {
    return null;
  }
  const startStep = new Step({ position: parseSfen(found[1] || defaultSfen) });
  const movesUsi = found[2];
  if (movesUsi) {
    let step = startStep;
    for (const moveUsi of movesUsi.split(/\s+/)) {
      const move = parseMoveUsi(moveUsi);
      if (!move) {
        break;
      }
      step = step.appendMove(move);
    }
  }
  return new Game({ startStep });
}

function arrayToMap(arr, map = new Map()) {
  return arr.reduce((m, v, i) => (m.set(v, i), m), map);
}
