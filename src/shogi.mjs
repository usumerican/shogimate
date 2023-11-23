export const sideN = 2;
export const sides = [0, 1];
export const sideInfos = [
  { name: '先手', alias: '下手', char: '☗', kif: '▲', usi: 'b', csa: '+' },
  { name: '後手', alias: '上手', char: '☖', kif: '△', usi: 'w', csa: '-' },
];

export const colN = 9;
export const colInfos = [
  { name: '９', char: '9', phoneme: 'きゅう' },
  { name: '８', char: '8', phoneme: 'はち' },
  { name: '７', char: '7', phoneme: 'なな' },
  { name: '６', char: '6', phoneme: 'ろく' },
  { name: '５', char: '5', phoneme: 'ごぉ' },
  { name: '４', char: '4', phoneme: 'よん' },
  { name: '３', char: '3', phoneme: 'さん' },
  { name: '２', char: '2', phoneme: 'にぃ' },
  { name: '１', char: '1', phoneme: 'いち' },
];
export const textColMap = colInfos.reduce((map, info, col) => map.set(info.name, col).set(info.char, col), new Map());
export const charColMap = colInfos.reduce((map, info, col) => map.set(info.char, col), new Map());

export const rowN = 9;
export const rowInfos = [
  { name: '一', alias: '１', char: '1', phoneme: 'いち', usi: 'a' },
  { name: '二', alias: '２', char: '2', phoneme: 'にぃ', usi: 'b' },
  { name: '三', alias: '３', char: '3', phoneme: 'さん', usi: 'c' },
  { name: '四', alias: '４', char: '4', phoneme: 'よん', usi: 'd' },
  { name: '五', alias: '５', char: '5', phoneme: 'ごぉ', usi: 'e' },
  { name: '六', alias: '６', char: '6', phoneme: 'ろく', usi: 'f' },
  { name: '七', alias: '７', char: '7', phoneme: 'なな', usi: 'g' },
  { name: '八', alias: '８', char: '8', phoneme: 'はち', usi: 'h' },
  { name: '九', alias: '９', char: '9', phoneme: 'きゅう', usi: 'i' },
];
export const textRowMap = rowInfos.reduce(
  (map, info, row) => map.set(info.name, row).set(info.alias, row).set(info.char, row),
  new Map()
);
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

export function formatSquareCsa(sq) {
  return colInfos[getCol(sq)].char + rowInfos[getRow(sq)].char;
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

export const baseCounts = [2, 18, 4, 4, 4, 2, 2, 4];
export const kindInfos = [
  { name: '', phoneme: '', usi: '', csa: '', neighbors: [], directions: [] },
  { name: '歩', phoneme: 'ふぅ', usi: 'P', csa: 'FU', neighbors: [[0, -1]], directions: [] },
  { name: '香', phoneme: 'きょう', usi: 'L', csa: 'KY', neighbors: [], directions: [[0, -1]] },
  {
    name: '桂',
    phoneme: 'けい',
    usi: 'N',
    csa: 'KE',
    neighbors: [
      [-1, -2],
      [1, -2],
    ],
    directions: [],
  },
  {
    name: '銀',
    phoneme: 'ぎん',
    usi: 'S',
    csa: 'GI',
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
    phoneme: 'かく',
    usi: 'B',
    csa: 'KA',
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
    phoneme: 'ひぃ',
    usi: 'R',
    csa: 'HI',
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
    phoneme: 'きん',
    usi: 'G',
    csa: 'KI',
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
    phoneme: 'ぎょく',
    usi: 'K',
    csa: 'OU',
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
    phoneme: 'とぉ',
    csa: 'TO',
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
    phoneme: 'なりきょう',
    csa: 'NY',
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
    phoneme: 'なりけい',
    csa: 'NK',
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
    phoneme: 'なりぎん',
    csa: 'NG',
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
    phoneme: 'うま',
    csa: 'UM',
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
    phoneme: 'りゅう',
    csa: 'RY',
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
export const kindNames = kindInfos.map((info) => info.name);
export const textKindMap = kindInfos.reduce(
  (map, info, kind) => {
    if (info.name) {
      map.set(info.name, kind);
    }
    if (info.char) {
      map.set(info.char, kind);
    }
    return map;
  },
  new Map([
    ['王', 8],
    ['成歩', 9],
    ['成角', 13],
    ['成飛', 14],
    ['竜', 14],
  ])
);
export const csaKindMap = kindInfos.reduce((map, info, kind) => (info.csa && map.set(info.csa, kind), map), new Map());

export const pieceInfos = kindInfos.reduce((arr, info, kind) => {
  if (kind) {
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

export const modifierInfos = [
  { name: '同', phoneme: 'どう' },
  { name: '左', phoneme: 'ひだり' },
  { name: '直', phoneme: 'すぐ' },
  { name: '右', phoneme: 'みぎ' },
  { name: '上', phoneme: 'あがる' },
  { name: '寄', phoneme: 'よる' },
  { name: '引', phoneme: 'ひく' },
  { name: '打', phoneme: 'うつ' },
  { name: '不成', phoneme: 'ならず' },
  { name: '成', phoneme: 'なり' },
];
export const textModifierMap = modifierInfos.reduce((map, info, modifier) => map.set(info.name, modifier), new Map());

function getHorizontalModifier(dc, side) {
  if (side) {
    dc = -dc;
  }
  return dc > 0 ? '左' : dc < 0 ? '右' : '直';
}

function getVerticalModifier(dr, side) {
  if (side) {
    dr = -dr;
  }
  return dr > 0 ? '引' : dr < 0 ? '上' : '寄';
}

export function getMoveModifiers(pos, move) {
  const modifiers = [];
  const from = getMoveFrom(move);
  const to = getMoveTo(move);
  const toCol = getCol(to);
  const toRow = getRow(to);
  if (isMoveDropped(move)) {
    walkAttackers(pos, toCol, toRow, makePiece(from, pos.sideToMove), () => modifiers.push('打'));
    return modifiers;
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
  if (~attacker) {
    if (vc) {
      if (hc) {
        if (hm === '直') {
          modifiers.push('直');
        } else {
          modifiers.push(hm, vm);
        }
      } else {
        if (hm === '直' && getPieceKind(piece) >= HORSE) {
          modifiers.push(getHorizontalModifier(getCol(attacker) - fromCol, pos.sideToMove));
        } else {
          modifiers.push(hm);
        }
      }
    } else {
      modifiers.push(vm);
    }
  }
  if (isMovePromoted(move)) {
    modifiers.push('成');
  } else if (isPiecePromotable(piece, fromRow, toRow)) {
    modifiers.push('不成');
  }
  return modifiers;
}

export function formatMoveText(pos, move, lastMove, padding) {
  const to = getMoveTo(move);
  const from = getMoveFrom(move);
  const text =
    (lastMove && getMoveTo(lastMove) === to ? '同' : colInfos[getCol(to)].name + rowInfos[getRow(to)].name) +
    kindNames[isMoveDropped(move) ? from : getPieceKind(pos.getPiece(from))] +
    getMoveModifiers(pos, move).join('');

  return padding && text.length === 2 ? text[0] + '　' + text.slice(1) : text;
}

const colPattern = [...textColMap.keys()].join('|');
const rowPattern = [...textRowMap.keys()].join('|');
const kindPattern = [...textKindMap.keys()].join('|');
const moveTextRegExp = new RegExp(
  String.raw`(${colPattern})?(${rowPattern})?(?:(同)\s*)?(${kindPattern})(?:(打)|(左|直|右)?(上|寄|引)?(不成|成)?)`
);
const textPhonemeMap = new Map([
  ...[...textColMap].map(([text, col]) => [text, colInfos[col].phoneme]),
  ...[...textRowMap].map(([text, row]) => [text, rowInfos[row].phoneme]),
  ...[...textKindMap].map(([text, kind]) => [text, kindInfos[kind].phoneme]),
  ...modifierInfos.map((info) => [info.name, info.phoneme]),
]);

export function getMovePhonemes(moveText) {
  const phonemes = [];
  const found = moveText.match(moveTextRegExp);
  if (found) {
    for (let i = 1; i < found.length; i++) {
      const text = found[i];
      if (text) {
        phonemes.push(textPhonemeMap.get(text));
      }
    }
  }
  return phonemes;
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
  for (const side of sides) {
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

export function formatBod(pos, sideNames, number) {
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
  bod += '+---------------------------+\n' + sideName0 + 'の持駒：' + formatHandKif(pos, 0) + '\n';
  if (number) {
    bod += '手数＝' + pos.number + '\n';
  }
  return bod + (pos.sideToMove ? sideName1 : sideName0) + '番\n';
}

export const defaultEndName = '中断';
export const endInfos = [
  { name: defaultEndName, kif: true, csa: 'CHUDAN' },
  { name: '投了', kif: true, csa: 'TORYO', usi: 'resign' },
  { name: '持将棋', kif: true, csa: 'JISHOGI' },
  { name: '千日手', kif: true, csa: 'SENNICHITE', usi: 'rep_draw' },
  { name: '切れ負け', kif: true, csa: 'TIME_UP' },
  { name: '反則勝ち', kif: true, csa: 'ILLEGAL_ACTION', usi: 'rep_win' },
  { name: '反則負け', kif: true, csa: 'ILLEGAL_MOVE', usi: 'rep_lose' },
  { name: '入玉勝ち', kif: true, csa: 'KACHI', usi: 'win' },
  { name: '不戦勝', kif: true, csa: '' },
  { name: '不戦敗', kif: true, csa: '' },
  { name: '詰み', kif: true, csa: 'TSUMI' },
  { name: '不詰', kif: true, csa: 'FUZUMI' },
  { name: '引き分け', kif: false, csa: 'HIKIWAKE' },
  { name: '待った', kif: false, csa: 'MATTA' },
  { name: 'エラー', kif: false, csa: 'ERROR' },
  { name: '優等局面', kif: false, csa: '', usi: 'rep_sup' },
  { name: '劣等局面', kif: false, csa: '', usi: 'rep_inf' },
];
export const nameEndInfoMap = endInfos.reduce((map, info) => map.set(info.name, info), new Map());
export const usiEndNameMap = endInfos.reduce((map, info) => (info.usi && map.set(info.usi, info.name), map), new Map());
export const csaEndNameMap = endInfos.reduce((map, info) => (info.csa && map.set(info.csa, info.name), map), new Map());

export class Step {
  constructor({ parent, children, move, position, capturedPiece, endName } = {}) {
    this.parent = parent;
    this.children = children?.slice() || [];
    this.move = move || 0;
    this.position = position;
    this.capturedPiece = capturedPiece || 0;
    this.endName = endName || '';
  }

  isMove() {
    return this.parent && !this.endName;
  }

  appendMove(move) {
    if (this.endName) {
      return null;
    }
    const position = new Position(this.position);
    const capturedPiece = position.doMove(move);
    const step = new Step({ parent: this, move, position, capturedPiece });
    this.children.push(step);
    return step;
  }

  appendEnd(endName) {
    if (this.endName) {
      return null;
    }
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
  if (step.endName) {
    return sideInfos[step.position.sideToMove].char + step.endName;
  }
  if (!step.parent) {
    return '開始局面';
  }
  return (
    sideInfos[step.position.sideToMove ^ 1].char +
    formatMoveText(step.parent.position, step.move, step.parent.move, true)
  );
}

export const defaultStartName = '平手';
export const defaultSfen = 'lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1';

export const startInfos = [
  { name: defaultStartName, sfen: defaultSfen, csa: 'PI' },
  { name: '香落ち', sfen: 'lnsgkgsn1/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1', csa: 'PI11KY' },
  { name: '右香落ち', sfen: '1nsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1', csa: 'PI91KY' },
  { name: '左銀落ち', sfen: 'lnsgkg1nl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1', csa: 'PI31GI' },
  { name: '右銀落ち', sfen: 'ln1gkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1', csa: 'PI61KY' },
  { name: '角落ち', sfen: 'lnsgkgsnl/1r7/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1', csa: 'PI22KA' },
  { name: '飛車落ち', sfen: 'lnsgkgsnl/7b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1', csa: 'PI82HI' },
  { name: '飛香落ち', sfen: 'lnsgkgsn1/7b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1', csa: 'PI11KY82HI' },
  { name: '二枚落ち', sfen: 'lnsgkgsnl/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1', csa: 'PI22KA82HI' },
  { name: '三枚落ち', sfen: 'lnsgkgsn1/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1', csa: 'PI11KY22KA82HI' },
  { name: '四枚落ち', sfen: '1nsgkgsn1/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1', csa: 'PI11KY22KA82HI91KY' },
  {
    name: '五枚落ち',
    sfen: '2sgkgsn1/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1',
    csa: 'PI11KY22KA81KE82HI91KY',
  },
  {
    name: '左五枚落ち',
    sfen: '1nsgkgs2/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1',
    csa: 'PI11KY21KE22KA82HI91KY',
  },
  {
    name: '六枚落ち',
    sfen: '2sgkgs2/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1',
    csa: 'PI11KY21KE22KA81KE82HI91KY',
  },
  {
    name: '左七枚落ち',
    sfen: '2sgkg3/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1',
    csa: 'PI11KY21KE22KA31GI81KE82HI91KY',
  },
  {
    name: '右七枚落ち',
    sfen: '3gkgs2/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1',
    csa: 'PI11KY21KE22KA71GI81KE82HI91KY',
  },
  {
    name: '八枚落ち',
    sfen: '3gkg3/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1',
    csa: 'PI11KY21KE22KA31GI71GI81KE82HI91KY',
  },
  {
    name: '十枚落ち',
    sfen: '4k4/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1',
    csa: 'PI11KY21KE22KA31GI41KI61KI71GI81KE82HI91KY',
  },
];
export const startNameSfenMap = startInfos.reduce((map, info) => map.set(info.name, info.sfen), new Map());
export const sfenStartInfoMap = startInfos.reduce((map, info) => map.set(info.sfen, info), new Map());

export class Game {
  constructor({ startStep, flipped, startName, sideNames, playerNames } = {}) {
    this.startStep = startStep;
    this.flipped = flipped || 0;
    this.startName = startName || '';
    this.sideNames = sideNames?.slice() || ['', ''];
    this.playerNames = playerNames?.slice() || ['', ''];
  }
}

export function makePositionCommand(sfen, moveUsis) {
  return (
    'position ' +
    (sfen === defaultSfen ? 'startpos' : 'sfen ' + sfen) +
    (moveUsis?.length ? ' moves ' + moveUsis.join(' ') : '')
  );
}

export function formatGameUsi(game) {
  const moveUsis = [];
  for (let st = game.startStep.children[0]; st && st.move; st = st.children[0]) {
    moveUsis.push(formatMoveUsi(st.move));
  }
  return makePositionCommand(formatSfen(game.startStep.position), moveUsis);
}

export function formatGameUsiFromLastStep(lastStep) {
  const moveUsis = [];
  let st = lastStep;
  for (; st.parent; st = st.parent) {
    if (st.move) {
      moveUsis.unshift(formatMoveUsi(st.move));
    }
  }
  return makePositionCommand(formatSfen(st.position), moveUsis);
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
      if (!step) {
        break;
      }
    }
  }
  return new Game({ startStep });
}

function formatHeadKif(game) {
  let headKif = '';
  if (game.startName) {
    headKif += '手合割：' + game.startName + '\n';
  }
  const sideNames = sides.map((side) => game.sideNames[side] || sideInfos[side].name);
  if (formatSfen(game.startStep.position) !== startNameSfenMap.get(game.startName || defaultStartName)) {
    headKif += formatBod(game.startStep.position, sideNames);
  }
  for (const side of sides) {
    if (game.playerNames[side]) {
      headKif += sideNames[side] + '：' + game.playerNames[side] + '\n';
    }
  }
  return headKif;
}

export function formatGameKif(game) {
  let gameKif = formatHeadKif(game) + '手数----指手---------消費時間--\n';
  const stack = [[game.startStep, 0, 0]];
  while (stack.length) {
    const [step, siblingOrder, depth] = stack.pop();
    if (step.parent) {
      if (siblingOrder) {
        gameKif += '\n変化：' + depth + '手\n';
      }
      gameKif += depth + ' ';
      if (step.endName) {
        if (nameEndInfoMap.get(step.endName)?.kif) {
          gameKif += step.endName + '\n';
        } else {
          gameKif += defaultEndName + '\n*#' + step.endName + '\n';
        }
      } else {
        gameKif += formatMoveKif(step.parent.position, step.move, step.parent.move) + '\n';
      }
    }
    for (let i = step.children.length; i--; ) {
      stack.push([step.children[i], i, depth + 1]);
    }
  }
  return gameKif;
}

export function formatGameKi2(game) {
  let gameKi2 = formatHeadKif(game);
  const stack = [[game.startStep, 0]];
  while (stack.length) {
    const [step, siblingOrder] = stack.pop();
    if (step.parent) {
      if (siblingOrder) {
        gameKi2 += '\n\n変化：' + step.position.number + '手\n';
      }
      if (!step.endName) {
        if (gameKi2 && !gameKi2.endsWith('\n')) {
          gameKi2 += ' ';
        }
        gameKi2 +=
          sideInfos[step.position.sideToMove ^ 1].kif +
          formatMoveText(step.parent.position, step.move, step.parent.move, true);
      }
    }
    for (let i = step.children.length; i--; ) {
      stack.push([step.children[i], i]);
    }
  }
  return gameKi2 && !gameKi2.endsWith('\n') ? gameKi2 + '\n' : gameKi2;
}

const addrKifPattern = '[1-9１２３４５６７８９一二三四五六七八九]';
const kindKifPattern = [...textKindMap.keys()].join('|');
const moveKifRegExp = new RegExp(
  String.raw`(?:(同\s*)|(${addrKifPattern})(${addrKifPattern}))(${kindKifPattern})(?:(打)|(成)?\((${addrKifPattern})(${addrKifPattern})\))`
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

export function parseGameKif(gameKif) {
  const game = parseGameUsi(defaultSfen);
  let targetStep = game.startStep;
  const numberSteps = [targetStep];
  for (const line of gameKif.split('\n').map((line) => line.trim())) {
    const ch = line[0];
    if (!ch || ch === '#') {
      continue;
    }
    if (ch === '|') {
      const row = textRowMap.get(line.slice(-1));
      for (let col = 0, p = 1; col < colN; col++, p += 2) {
        const kind = textKindMap.get(line[p + 1]);
        game.startStep.position.setPiece(makeSquare(col, row), kind ? makePiece(kind, line[p] === 'v') : 0);
      }
      continue;
    }
    const p = line.indexOf('：');
    if (~p) {
      const name = line.slice(0, p).trim();
      const value = line.slice(p + 1).trim();
      if (name === '手合割') {
        game.startName = value;
        game.startStep.position = parseSfen(startNameSfenMap.get(game.startName) || defaultSfen);
      } else if (name.startsWith('手の持駒', 1)) {
        const side = ch === '後' || ch === '上' ? 1 : 0;
        for (const s of value.split(/\s+/).map((s) => s.trim())) {
          game.startStep.position.addHandCount(side, textKindMap.get(s[0]), textCountMap.get(s.slice(1)) || 1);
        }
      } else if (name === '変化') {
        targetStep = numberSteps[parseInt(value) - 1] || targetStep;
      }
      continue;
    }
    if (line.startsWith('手数＝')) {
      game.startStep.position.number = parseInt(line.slice(3)) || 0;
      continue;
    }
    if (line.startsWith('手番', 1)) {
      game.startStep.position.sideToMove = ch === '後' || ch === '上' ? 1 : 0;
      continue;
    }
    const move = parseMoveKif(line);
    if (move) {
      targetStep = targetStep.appendMove(move);
      numberSteps[targetStep.position.number] = targetStep;
    }
  }
  return game;
}

export function formatGameCsa(game) {
  let gameCsa = 'V2.2\n';
  for (const side of sides) {
    const playerName = game.playerNames[side];
    if (playerName) {
      gameCsa += 'N' + sideInfos[side].csa + playerName + '\n';
    }
  }
  const pos = game.startStep.position;
  const startInfo = sfenStartInfoMap.get(formatSfen(pos));
  if (startInfo?.csa) {
    gameCsa += startInfo.csa + '\n';
  } else {
    for (let row = 0; row < rowN; row++) {
      gameCsa += 'P' + (row + 1);
      for (let col = 0; col < colN; col++) {
        const piece = pos.getPiece(makeSquare(col, row));
        gameCsa += piece ? sideInfos[getPieceSide(piece)].csa + kindInfos[getPieceKind(piece)].csa : ' * ';
      }
      gameCsa += '\n';
    }
  }
  for (const side of sides) {
    let handCsa = '';
    for (const base of handBases) {
      const count = pos.getHandCount(side, base);
      if (count) {
        handCsa += ('00' + kindInfos[base].csa).repeat(count);
      }
    }
    if (handCsa) {
      gameCsa += 'P' + sideInfos[side].csa + handCsa + '\n';
    }
  }
  gameCsa += sideInfos[pos.sideToMove].csa + '\n';
  for (let st = game.startStep.children[0]; st; st = st.children[0]) {
    if (st.endName) {
      const endCsa = nameEndInfoMap.get(st.endName).csa || 'CHUDAN';
      gameCsa += '%' + (endCsa === 'ILLEGAL_ACTION' ? sideInfos[st.position.sideToMove ^ 1].csa : '') + endCsa;
    } else {
      const to = getMoveTo(st.move);
      gameCsa +=
        sideInfos[st.position.sideToMove ^ 1].csa +
        (isMoveDropped(st.move) ? '00' : formatSquareCsa(getMoveFrom(st.move))) +
        formatSquareCsa(to) +
        kindInfos[getPieceKind(st.position.getPiece(to))].csa;
    }
    gameCsa += '\n';
  }
  return gameCsa;
}

const kindCsaPattern = kindInfos
  .map((info) => info.csa)
  .filter((csa) => csa)
  .join('|');
const startCsaRegExp = new RegExp(String.raw`([1-9])([1-9])(${kindCsaPattern})`);
const handCsaRegExp = new RegExp(String.raw`(00AL)|(?:(00)|([1-9])([1-9]))(${kindCsaPattern})`);
const boardCsaRegExp = new RegExp(String.raw`([+-])(${kindCsaPattern})`);
const moveCsaRegExp = new RegExp(String.raw`(?:(00)|([1-9])([1-9]))([1-9])([1-9])(${kindCsaPattern})`);

export function parseGameCsa(gameCsa) {
  if (!gameCsa.match(/^\s*[+-]\s*$/m)) {
    return null;
  }
  const game = new Game({ startStep: new Step({ position: new Position() }) });
  const stockCounts = baseCounts.slice();
  let targetStep = game.startStep;
  for (const line of gameCsa.split(/[\n,]/).map((line) => line.trim())) {
    const ch = line[0];
    if (!ch || ch === "'") {
      continue;
    }
    if (ch === '/') {
      break;
    }
    const ch2 = line[1];
    if (ch === 'N') {
      game.playerNames[ch2 === '-' ? 1 : 0] = line.slice(2).trim();
      continue;
    }
    if (ch === 'P') {
      if (ch2 === 'I') {
        game.startStep.position = parseSfen(defaultSfen);
        stockCounts.fill(0);
        for (let i = 2; i < line.length; i += 4) {
          const found = line.slice(i, i + 4).match(startCsaRegExp);
          if (!found) {
            break;
          }
          game.startStep.position.setPiece(makeSquare(textColMap.get(found[1]), textRowMap.get(found[2])), 0);
        }
      } else if (ch2 === '+' || ch2 === '-') {
        const side = ch2 === '-' ? 1 : 0;
        for (let i = 2; i < line.length; i += 4) {
          const found = line.slice(i, i + 4).match(handCsaRegExp);
          if (!found) {
            break;
          }
          const [, all, hand, colS, rowS, kindCsa] = found;
          if (all) {
            for (let base = 1; base < stockCounts.length; base++) {
              game.startStep.position.addHandCount(side, base, stockCounts[base]);
              stockCounts[base] = 0;
            }
          } else {
            const kind = csaKindMap.get(kindCsa);
            const base = getPieceBase(kind);
            stockCounts[base]--;
            if (hand) {
              game.startStep.position.addHandCount(side, base, 1);
            } else {
              game.startStep.position.setPiece(
                makeSquare(textColMap.get(colS), textRowMap.get(rowS)),
                makePiece(kind, side)
              );
            }
          }
        }
      } else {
        const row = +ch2 - 1;
        if (row >= 0) {
          for (let i = 2, col = 0; i < line.length; i += 3, col++) {
            const sq = makeSquare(col, row);
            const found = line.slice(i, i + 3).match(boardCsaRegExp);
            if (found) {
              const piece = makePiece(csaKindMap.get(found[2]), found[1] === '-' ? 1 : 0);
              game.startStep.position.setPiece(sq, piece);
              stockCounts[getPieceBase(piece)]--;
            } else {
              game.startStep.position.setPiece(sq, 0);
            }
          }
        }
      }
      continue;
    }
    if (ch === '+' || ch === '-') {
      if (ch2) {
        const found = line.slice(1).match(moveCsaRegExp);
        if (found) {
          const [, dropped, fromColS, fromRowS, toColS, toRowS, kindCsa] = found;
          const to = makeSquare(textColMap.get(toColS), textRowMap.get(toRowS));
          const kind = csaKindMap.get(kindCsa);
          let move;
          if (dropped) {
            move = makeDrop(getPieceBase(kind), to);
          } else {
            const from = makeSquare(textColMap.get(fromColS), textRowMap.get(fromRowS));
            move = makeMove(from, to, getPieceKind(targetStep.position.getPiece(from)) !== kind);
          }
          targetStep = targetStep.appendMove(move);
        }
      } else {
        game.startStep.position.sideToMove = ch === '-' ? 1 : 0;
      }
      continue;
    }
    if (ch === '%') {
      const endCsa = line.slice(ch2 === '+' || ch2 === '-' ? 2 : 1);
      targetStep = targetStep.appendEnd(csaEndNameMap.get(endCsa) || defaultEndName);
      continue;
    }
  }
  return game;
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
  let st = new Step({ position: step.position });
  for (const moveUsi of pvMoveUsis) {
    st = st.appendMoveUsi(moveUsi);
    if (!st) {
      break;
    }
    names.push(formatStep(st));
  }
  return names;
}
