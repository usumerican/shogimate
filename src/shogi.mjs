export const sideN = 2;
export const sideInfos = [
  { name: '先手', alias: '下手', char: '☗', kif: '▲', usi: 'b' },
  { name: '後手', alias: '上手', char: '☖', kif: '△', usi: 'w' },
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
export const textColMap = colInfos.reduce((map, info, col) => map.set(info.name, col).set(info.char, col), new Map());
export const charColMap = colInfos.reduce((map, info, col) => map.set(info.char, col), new Map());

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
export const textRowMap = rowInfos.reduce((map, info, row) => map.set(info.name, row).set(info.char, row), new Map());
export const usiRowMap = rowInfos.reduce((map, info, row) => map.set(info.usi, row), new Map());

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

export function formatSquareUsi(sq) {
  return colInfos[getCol(sq)].char + rowInfos[getRow(sq)].usi;
}

export function parseSquareUsi(squareUsi) {
  return makeSquare(charColMap.get(squareUsi[0]), usiRowMap.get(squareUsi[1]));
}

export const PAWN = 1;
export const LANCE = 2;
export const KNIGHT = 3;
export const SILVER = 4;
export const BISHOP = 5;
export const ROOK = 6;
export const GOLD = 7;
export const KING = 8;
export const PRO_PAWN = 9;
export const PRO_LANCE = 10;
export const PRO_KNIGHT = 11;
export const PRO_SILVER = 12;
export const HORSE = 13;
export const DRAGON = 14;

export function isKindPromoted(kind) {
  return kind > KING;
}

export const pieceBaseMask = 7;
export const piecePromotedMask = 8;
export const pieceKindMask = 15;
export const pieceSideMask = 16;
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

export function flipPiece(piece) {
  return piece ^ pieceSideMask;
}

export function isPiecePromotable(piece, fromRow, toRow) {
  return getPieceKind(piece) < GOLD && (getPieceSide(piece) ? toRow > 5 || fromRow > 5 : toRow < 3 || fromRow < 3);
}

export const kindInfos = [
  null,
  { name: '歩', usi: 'P', neighbors: [[0, -1]], directions: [] },
  { name: '香', usi: 'L', neighbors: [], directions: [[0, -1]] },
  {
    name: '桂',
    usi: 'N',
    neighbors: [
      [-1, -2],
      [1, -2],
    ],
    directions: [],
  },
  {
    name: '銀',
    usi: 'S',
    neighbors: [
      [-1, -1],
      [-1, 1],
      [0, -1],
      [1, -1],
      [1, 1],
    ],
    directions: [],
  },
  {
    name: '角',
    usi: 'B',
    neighbors: [],
    directions: [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ],
  },
  {
    name: '飛',
    usi: 'R',
    neighbors: [],
    directions: [
      [-1, 0],
      [0, -1],
      [0, 1],
      [1, 0],
    ],
  },
  {
    name: '金',
    usi: 'G',
    neighbors: [
      [-1, -1],
      [-1, 0],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
    ],
    directions: [],
  },
  {
    name: '玉',
    usi: 'K',
    neighbors: [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ],
    directions: [],
  },
  {
    name: 'と',
    neighbors: [
      [-1, -1],
      [-1, 0],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
    ],
    directions: [],
  },
  {
    name: '成香',
    char: '杏',
    neighbors: [
      [-1, -1],
      [-1, 0],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
    ],
    directions: [],
  },
  {
    name: '成桂',
    char: '圭',
    neighbors: [
      [-1, -1],
      [-1, 0],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
    ],
    directions: [],
  },
  {
    name: '成銀',
    char: '全',
    neighbors: [
      [-1, -1],
      [-1, 0],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
    ],
    directions: [],
  },
  {
    name: '馬',
    neighbors: [
      [-1, 0],
      [0, -1],
      [0, 1],
      [1, 0],
    ],
    directions: [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ],
  },
  {
    name: '龍',
    neighbors: [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ],
    directions: [
      [-1, 0],
      [0, -1],
      [0, 1],
      [1, 0],
    ],
  },
].reduce((arr, info, kind) => {
  if (info) {
    info.char ??= info.name;
    info.usi ??= '+' + arr[getPieceBase(kind)].usi;
  }
  arr.push(info);
  return arr;
}, []);
export const kindNames = kindInfos.map((info) => info?.name || '');
export const textKindMap = kindInfos.reduce(
  (map, info, kind) => (info && map.set(info.name, kind).set(info.char, kind), map),
  new Map([
    ['王', 8],
    ['成歩', 9],
    ['竜', 14],
  ])
);

export const pieceInfos = kindInfos.reduce((arr, info, kind) => {
  if (info) {
    arr[kind] = info;
    const pieceInfo = Object.assign({}, info);
    pieceInfo.usi = info.usi.toLowerCase();
    pieceInfo.neighbors = pieceInfo.neighbors.map((vec) => [-vec[0], -vec[1]]);
    pieceInfo.directions = pieceInfo.directions.map((vec) => [-vec[0], -vec[1]]);
    arr[makePiece(kind, 1)] = pieceInfo;
  }
  return arr;
}, []);
export const usiPieceMap = pieceInfos.reduce((map, info, piece) => (map.set(info.usi, piece), map), new Map());

export const handBaseN = 7;
export const handBases = [ROOK, BISHOP, GOLD, SILVER, KNIGHT, LANCE, PAWN];
export const handOrderMap = handBases.reduce((map, base, order) => (map.set(base, order), map), new Map());

export const countNames = [
  '〇',
  '一',
  '二',
  '三',
  '四',
  '五',
  '六',
  '七',
  '八',
  '九',
  '十',
  '十一',
  '十二',
  '十三',
  '十四',
  '十五',
  '十六',
  '十七',
  '十八',
];
export const textCountMap = countNames.reduce((map, name, count) => map.set(name, count), new Map());

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

export function formatMoveUsi(move) {
  const from = getMoveFrom(move);
  const toUsi = formatSquareUsi(getMoveTo(move));
  return isMoveDropped(move)
    ? pieceInfos[from].usi + '*' + toUsi
    : formatSquareUsi(from) + toUsi + (isMovePromoted(move) ? '+' : '');
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

export class Position {
  constructor({ board, handCounts, sideToMove, number } = {}) {
    this.board = board?.slice() || new Int8Array(squareN);
    this.handCounts = handCounts?.slice() || new Int8Array(handBaseN * sideN);
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

export function walkAttackers(pos, col, row, piece, callback) {
  const { neighbors, directions } = pieceInfos[makePiece(getPieceKind(piece), getPieceSide(piece) ^ 1)];
  for (const [dc, dr] of neighbors) {
    const c = col + dc;
    if (c < 0 || c >= colN) {
      continue;
    }
    const r = row + dr;
    if (r < 0 || r >= rowN) {
      continue;
    }
    const sq = makeSquare(c, r);
    if (pos.getPiece(sq) === piece) {
      const ret = callback(sq);
      if (ret) {
        return ret;
      }
    }
  }
  for (const [dv, dh] of directions) {
    let dc = 0;
    let dr = 0;
    for (;;) {
      dc += dv;
      const c = col + dc;
      if (c < 0 || c >= colN) {
        break;
      }
      dr += dh;
      const r = row + dr;
      if (r < 0 || r >= rowN) {
        break;
      }
      const sq = makeSquare(c, r);
      const p = pos.getPiece(sq);
      if (p) {
        if (p === piece) {
          const ret = callback(sq);
          if (ret) {
            return ret;
          }
        }
        break;
      }
    }
  }
  return null;
}

function getHorizontalModifier(h, side) {
  if (side) {
    h = -h;
  }
  return h < 0 ? '右' : h > 0 ? '左' : '直';
}

function getVerticalModifier(v, side) {
  if (side) {
    v = -v;
  }
  return v < 0 ? '上' : v > 0 ? '引' : '寄';
}

export function formatMoveModifier(pos, move) {
  const from = getMoveFrom(move);
  const to = getMoveTo(move);
  const toCol = getCol(to);
  const toRow = getRow(to);
  if (isMoveDropped(move)) {
    return walkAttackers(pos, toCol, toRow, makePiece(from, pos.sideToMove), () => '打') || '';
  }
  const piece = pos.getPiece(from);
  const fromCol = getCol(from);
  const fromRow = getRow(from);
  const hm = getHorizontalModifier(toCol - fromCol, pos.sideToMove);
  const vm = getVerticalModifier(toRow - fromRow, pos.sideToMove);
  let hc = 0;
  let vc = 0;
  let attacker = -1;
  walkAttackers(pos, toCol, toRow, piece, (sq) => {
    if (sq !== from) {
      attacker = sq;
      if (getHorizontalModifier(toCol - getCol(sq), pos.sideToMove) === hm) {
        hc++;
      }
      if (getVerticalModifier(toRow - getRow(sq), pos.sideToMove) === vm) {
        vc++;
      }
    }
  });
  let modifier = '';
  if (~attacker) {
    if (vc) {
      if (hc) {
        if (hm === '直') {
          modifier = '直';
        } else {
          modifier = hm + vm;
        }
      } else {
        if (hm === '直' && getPieceKind(piece) >= HORSE) {
          modifier = getHorizontalModifier(getCol(attacker) - fromCol, pos.sideToMove);
        } else {
          modifier = hm;
        }
      }
    } else {
      modifier = vm;
    }
  }
  if (isMovePromoted(move)) {
    modifier += '成';
  } else if (isPiecePromotable(piece, fromRow, toRow)) {
    modifier += '不成';
  }
  return modifier;
}

export function formatMoveText(pos, move, lastMove) {
  const to = getMoveTo(move);
  const from = getMoveFrom(move);
  return (
    (lastMove && getMoveTo(lastMove) === to ? '同' : colInfos[getCol(to)].name + rowInfos[getRow(to)].name) +
    kindNames[isMoveDropped(move) ? from : getPieceKind(pos.getPiece(from))] +
    formatMoveModifier(pos, move)
  );
}

export function formatMoveKif(pos, move, lastMove) {
  const from = getMoveFrom(move);
  const to = getMoveTo(move);
  const prefix =
    lastMove && getMoveTo(lastMove) === to ? '同　' : colInfos[getCol(to)].name + rowInfos[getRow(to)].name;
  if (isMoveDropped(move)) {
    return prefix + kindNames[from] + '打';
  }
  return (
    prefix +
    kindNames[getPieceKind(pos.getPiece(from))] +
    (isMovePromoted(move) ? '成' : '') +
    '(' +
    colInfos[getCol(from)].char +
    rowInfos[getRow(from)].char +
    ')'
  );
}

const addrPattern = '[1-9１２３４５６７８９一二三四五六七八九]';
const moveKifRegExp = new RegExp(
  String.raw`(?:(同\s*)|(${addrPattern})(${addrPattern}))(${[...textKindMap.keys()].join(
    '|'
  )})(?:(打)|(成)?\((${addrPattern})(${addrPattern})\))`
);

export function parseMoveKif(moveKif, lastMove) {
  const found = moveKif.match(moveKifRegExp);
  if (!found) {
    return 0;
  }
  const [, sameKif, toColKif, toRowKif, kindKif, droppedKif, promotedKif, fromColKif, fromRowKif] = found;
  const to = sameKif ? getMoveTo(lastMove) : makeSquare(textColMap.get(toColKif), textRowMap.get(toRowKif));
  if (droppedKif) {
    return makeDrop(textKindMap.get(kindKif), to);
  }
  return makeMove(makeSquare(textColMap.get(fromColKif), textRowMap.get(fromRowKif)), to, promotedKif);
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
  return sfen + (handsUsi || '-') + ' ' + (pos.number + 1);
}

export function parseSfen(sfen) {
  const found = sfen.trim().match(/^([+a-zA-Z\d/]+)\s+([bw])\s+(?:-|([a-zA-Z\d]+))\s+(\d+)$/);
  if (!found) {
    return null;
  }
  const [, boardUsi, sideUsi, handsUsi, numUsi] = found;
  const pos = new Position();
  let row = 0;
  for (const rowUsi of boardUsi.split('/')) {
    let col = 0;
    for (const [, emptyUsi, pieceUsi] of rowUsi.matchAll(/(\d)|(\+?[a-zA-Z])/g)) {
      if (emptyUsi) {
        col += +emptyUsi;
        continue;
      }
      const piece = usiPieceMap.get(pieceUsi);
      if (piece) {
        pos.setPiece(makeSquare(col, row), piece);
      }
      col++;
    }
    row++;
  }
  if (handsUsi) {
    for (const [, countUsi, pieceUsi] of handsUsi.matchAll(/(\d*)([a-zA-Z])/g)) {
      const piece = usiPieceMap.get(pieceUsi);
      if (piece) {
        pos.addHandCount(getPieceSide(piece), getPieceBase(piece), +countUsi || 1);
      }
    }
  }
  pos.sideToMove = sideUsi === sideInfos[1].usi ? 1 : 0;
  pos.number = (+numUsi || 1) - 1;
  return pos;
}

function formatHandKif(pos, side) {
  let handKif = '';
  for (const base of handBases) {
    const count = pos.getHandCount(side, base);
    if (count) {
      if (handKif) {
        handKif += ' ';
      }
      handKif += pieceInfos[makePiece(base, side)].name;
      if (count > 1) {
        handKif += countNames[count];
      }
    }
  }
  return handKif || 'なし';
}

export function formatBod(pos, sideNames) {
  const sideName0 = sideNames?.[0] || sideInfos[0].name;
  const sideName1 = sideNames?.[1] || sideInfos[1].name;
  let bod =
    sideName1 + 'の持駒：' + formatHandKif(pos, 1) + '\n  ９ ８ ７ ６ ５ ４ ３ ２ １\n+---------------------------+\n';
  for (let row = 0; row < rowN; row++) {
    bod += '|';
    for (let col = 0; col < colN; col++) {
      const piece = pos.getPiece(makeSquare(col, row));
      if (piece) {
        bod += (getPieceSide(piece) ? 'v' : ' ') + kindInfos[getPieceKind(piece)].char;
      } else {
        bod += ' ・';
      }
    }
    bod += '|' + rowInfos[row].name + '\n';
  }
  return (
    bod +
    '+---------------------------+\n' +
    sideName0 +
    'の持駒：' +
    formatHandKif(pos, 0) +
    '\n' +
    '手数＝' +
    pos.number +
    '\n' +
    (pos.sideToMove ? sideName1 : sideName0) +
    '番\n'
  );
}

export function parseBod(bod) {
  const pos = new Position();
  for (const line of bod.split('\n').map((line) => line.trim())) {
    const ch = line[0];
    if (!ch || ch === '#') {
      continue;
    }
    if (ch === '|') {
      const row = textRowMap.get(line.slice(-1));
      for (let col = 0, p = 1; col < colN; col++, p += 2) {
        const kind = textKindMap.get(line[p + 1]);
        if (kind) {
          pos.setPiece(makeSquare(col, row), makePiece(kind, line[p] === 'v'));
        }
      }
      continue;
    }
    const p = line.indexOf('：');
    if (~p) {
      const name = line.slice(0, p).trim();
      const value = line.slice(p + 1).trim();
      if (name.startsWith('手の持駒', 1)) {
        const side = ch === '後' || ch === '上' ? 1 : 0;
        for (const s of value.split(/\s+/).map((s) => s.trim())) {
          pos.addHandCount(side, textKindMap.get(s[0]), textCountMap.get(s.slice(1)) || 1);
        }
      }
      continue;
    }
    if (line.startsWith('手数＝')) {
      pos.number = parseInt(line.slice(3)) || 0;
      continue;
    }
    if (line.startsWith('手番', 1)) {
      pos.sideToMove = ch === '後' || ch === '上' ? 1 : 0;
      continue;
    }
  }
  return pos;
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
    const step = new Step({ parent: this, position: this.position, endName });
    this.children.push(step);
    return step;
  }

  appendMoveUsi(moveUsi) {
    const move = parseMoveUsi(moveUsi);
    if (move) {
      return this.appendMove(move);
    }
    return this.appendEnd(usiEndNameMap.get(moveUsi) || moveUsi);
  }
}

export function formatStep(step) {
  const text = step.endName
    ? sideInfos[step.position.sideToMove].char + step.endName
    : !step.parent
    ? '開始局面'
    : sideInfos[step.position.sideToMove ^ 1].char + formatMoveText(step.parent.position, step.move, step.parent.move);
  return text.length === 3 ? text.slice(0, 2) + '　' + text.slice(2) : text;
}

export const defaultSfen = 'lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1';

export const startInfos = [
  { name: '平手', sfen: defaultSfen },
  { name: '香落ち', sfen: 'lnsgkgsn1/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1' },
  { name: '右香落ち', sfen: '1nsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1' },
  { name: '左銀落ち', sfen: 'lnsgkg1nl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1' },
  { name: '右銀落ち', sfen: 'ln1gkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1' },
  { name: '角落ち', sfen: 'lnsgkgsnl/1r7/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1' },
  { name: '飛車落ち', sfen: 'lnsgkgsnl/7b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1' },
  { name: '飛香落ち', sfen: 'lnsgkgsn1/7b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1' },
  { name: '二枚落ち', sfen: 'lnsgkgsnl/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1' },
  { name: '三枚落ち', sfen: 'lnsgkgsn1/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1' },
  { name: '四枚落ち', sfen: '1nsgkgsn1/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1' },
  { name: '五枚落ち', sfen: '2sgkgsn1/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1' },
  { name: '左五枚落ち', sfen: '1nsgkgs2/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1' },
  { name: '六枚落ち', sfen: '2sgkgs2/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1' },
  { name: '左七枚落ち', sfen: '2sgkg3/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1' },
  { name: '右七枚落ち', sfen: '3gkgs2/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1' },
  { name: '八枚落ち', sfen: '3gkg3/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1' },
  { name: '十枚落ち', sfen: '4k4/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1' },
];
export const startNameSfenMap = startInfos.reduce((map, info) => (map.set(info.name, info.sfen), map), new Map());

export class Game {
  constructor({ startStep, flipped, sideNames } = {}) {
    this.startStep = startStep;
    this.flipped = flipped || 0;
    this.sideNames = sideNames ? sideNames.slice(0) : ['', ''];
  }
}

export function formatMoveUsis(step) {
  const moveUsis = [];
  for (let st = step.children[0]; st && st.move; st = st.children[0]) {
    moveUsis.push(formatMoveUsi(st.move));
  }
  return moveUsis;
}

export function makePositionCommand(sfen, moveUsis) {
  return (
    'position ' +
    (sfen === defaultSfen ? 'startpos' : 'sfen ' + sfen) +
    (moveUsis?.length ? ' moves ' + moveUsis.join(' ') : '')
  );
}

export function formatGameUsi(game) {
  return makePositionCommand(formatSfen(game.startStep.position), formatMoveUsis(game.startStep));
}

export function formatGameUsiFromLastStep(lastStep) {
  const moveUsis = [];
  let step = lastStep;
  while (step.parent) {
    if (step.move) {
      moveUsis.unshift(formatMoveUsi(step.move));
    }
    step = step.parent;
  }
  return makePositionCommand(formatSfen(step.position), moveUsis);
}

export function parseGameUsi(gameUsi) {
  const found = gameUsi
    .trim()
    .match(/^(?:position\s+)?(?:startpos|(?:sfen\s+)?(\S+\s+\S+\s+\S+\s+\d+))(?:\s+moves\s+(.+))?$/);
  if (!found) {
    return null;
  }
  const [, sfen, movesUsi] = found;
  const position = parseSfen(sfen || defaultSfen);
  if (!position) {
    return null;
  }
  const startStep = new Step({ position });
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

const pvInfoKeySet = new Set([
  'depth',
  'seldepth',
  'score',
  'lowerbound',
  'upperbound',
  'multipv',
  'nodes',
  'nps',
  'hashfull',
  'time',
  'pv',
]);

export function parsePvInfoUsi(pvInfoUsi) {
  const words = pvInfoUsi.trim().split(/\s+/);
  if (words[0] !== 'info') {
    return null;
  }
  const pvInfo = {};
  for (let i = 1, key; i < words.length; i++) {
    const word = words[i];
    if (pvInfoKeySet.has(word)) {
      pvInfo[word] = [];
      key = word;
      continue;
    }
    if (key) {
      pvInfo[key].push(word);
    }
  }
  return pvInfo;
}

const mateScoreValue = 32000;
const superiorScoreValue = 31111;

export function parsePvScore(pvScore, sideToMove) {
  let value = Math.abs(pvScore[1]);
  if (pvScore[0] === 'mate') {
    value = mateScoreValue - value;
  }
  return (pvScore[1][0] === '-') ^ sideToMove ? -value : value;
}

export function formatPvScoreValue(pvScoreValue) {
  const abs = Math.abs(pvScoreValue);
  if (!abs) {
    return '0';
  }
  return (
    sideInfos[pvScoreValue > 0 ? 0 : 1].char +
    (abs < superiorScoreValue ? abs : abs > superiorScoreValue ? mateScoreValue - abs + '手詰' : '優等局面')
  );
}

export function formatPvMoveUsis(step, pvMoveUsis) {
  const names = [];
  let st = new Step(step);
  for (const moveUsi of pvMoveUsis) {
    st = st.appendMoveUsi(moveUsi);
    names.push(formatStep(st));
  }
  return names;
}
