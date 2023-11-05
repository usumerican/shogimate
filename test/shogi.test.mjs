import { describe, expect, test } from 'vitest';
import {
  formatGameUsi,
  formatGameUsiFromLastStep,
  formatStep,
  parseGameUsi,
  parsePvInfoUsi,
  parseMoveUsi,
  parsePvScore,
  formatPvScoreValue,
  formatBod,
  defaultSfen,
  parseSfen,
  parseBod,
  formatMoveKif,
  parseMoveKif,
  formatSfen,
  formatMoveUsi,
  Position,
  flipPiece,
  formatMoveText,
  makeDrop,
  makeSquare,
  makeMove,
} from '../src/shogi.mjs';

describe('shogi', () => {
  const mateSfen = 'ln1gkg1nl/6+P2/2sppps1p/2p3p2/p8/P1P1P3P/2NP1PP2/3s1KSR1/L1+b2G1NL w R2Pbgp 42';

  test('position format', () => {
    const data = [
      {
        sfen: defaultSfen,
        bod: `後手の持駒：なし
  ９ ８ ７ ６ ５ ４ ３ ２ １
+---------------------------+
|v香v桂v銀v金v玉v金v銀v桂v香|一
| ・v飛 ・ ・ ・ ・ ・v角 ・|二
|v歩v歩v歩v歩v歩v歩v歩v歩v歩|三
| ・ ・ ・ ・ ・ ・ ・ ・ ・|四
| ・ ・ ・ ・ ・ ・ ・ ・ ・|五
| ・ ・ ・ ・ ・ ・ ・ ・ ・|六
| 歩 歩 歩 歩 歩 歩 歩 歩 歩|七
| ・ 角 ・ ・ ・ ・ ・ 飛 ・|八
| 香 桂 銀 金 玉 金 銀 桂 香|九
+---------------------------+
先手の持駒：なし
手数＝0
先手番
`,
      },
      {
        sfen: 'lnsgkgsn1/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1',
        bod: `上手の持駒：なし
  ９ ８ ７ ６ ５ ４ ３ ２ １
+---------------------------+
|v香v桂v銀v金v玉v金v銀v桂 ・|一
| ・v飛 ・ ・ ・ ・ ・v角 ・|二
|v歩v歩v歩v歩v歩v歩v歩v歩v歩|三
| ・ ・ ・ ・ ・ ・ ・ ・ ・|四
| ・ ・ ・ ・ ・ ・ ・ ・ ・|五
| ・ ・ ・ ・ ・ ・ ・ ・ ・|六
| 歩 歩 歩 歩 歩 歩 歩 歩 歩|七
| ・ 角 ・ ・ ・ ・ ・ 飛 ・|八
| 香 桂 銀 金 玉 金 銀 桂 香|九
+---------------------------+
下手の持駒：なし
手数＝0
上手番
`,
        sideNames: ['下手', '上手'],
      },
      {
        sfen: mateSfen,
        bod: `後手の持駒：角 金 歩
  ９ ８ ７ ６ ５ ４ ３ ２ １
+---------------------------+
|v香v桂 ・v金v玉v金 ・v桂v香|一
| ・ ・ ・ ・ ・ ・ と ・ ・|二
| ・ ・v銀v歩v歩v歩v銀 ・v歩|三
| ・ ・v歩 ・ ・ ・v歩 ・ ・|四
|v歩 ・ ・ ・ ・ ・ ・ ・ ・|五
| 歩 ・ 歩 ・ 歩 ・ ・ ・ 歩|六
| ・ ・ 桂 歩 ・ 歩 歩 ・ ・|七
| ・ ・ ・v銀 ・ 玉 銀 飛 ・|八
| 香 ・v馬 ・ ・ 金 ・ 桂 香|九
+---------------------------+
先手の持駒：飛 歩二
手数＝41
後手番
`,
      },
    ];
    for (const { sfen, bod, sideNames } of data) {
      expect(formatBod(parseSfen(sfen), sideNames)).toEqual(bod);
      expect(formatSfen(parseBod(bod))).toEqual(sfen);
    }
  });

  test('move format', () => {
    const pos = parseSfen(mateSfen);
    const lastMove = parseMoveUsi('8i7g');
    const data = [
      { usi: '6h5g', kif: '５七銀(68)' },
      { usi: '6h5g+', kif: '５七銀成(68)' },
      { usi: '6h7g', kif: '同　銀(68)' },
      { usi: 'B*5g', kif: '５七角打' },
    ];
    for (const { usi, kif } of data) {
      expect(formatMoveKif(pos, parseMoveUsi(usi), lastMove)).toEqual(kif);
      expect(formatMoveUsi(parseMoveKif(kif, lastMove))).toEqual(usi);
    }
  });

  test('gameUsi', () => {
    const prefix = 'position sfen ';
    const sfen = '+R1sgk1gnl/7p1/p2ppb2p/2p6/9/P5P2/2P+bPPK1P/1S2N4/LNG3srL w SL5Pgnp 66';
    const suffix = ' moves 2i2h+ 3g4f G*4e';
    expect(formatGameUsi(parseGameUsi(prefix + sfen + suffix))).toEqual(prefix + sfen + suffix);
    expect(formatGameUsi(parseGameUsi(prefix + sfen))).toEqual(prefix + sfen);
    expect(formatGameUsi(parseGameUsi(sfen + suffix))).toEqual(prefix + sfen + suffix);
    expect(formatGameUsi(parseGameUsi(sfen))).toEqual(prefix + sfen);
  });

  test('startpos', () => {
    const prefix = 'position ';
    const startpos = 'startpos';
    const suffix = ' moves 7g7f 3c3d';
    expect(formatGameUsi(parseGameUsi(prefix + startpos + suffix))).toEqual(prefix + startpos + suffix);
    expect(formatGameUsi(parseGameUsi(prefix + startpos))).toEqual(prefix + startpos);
    expect(formatGameUsi(parseGameUsi(startpos + suffix))).toEqual(prefix + startpos + suffix);
    expect(formatGameUsi(parseGameUsi(startpos))).toEqual(prefix + startpos);
  });

  test('formatStep', () => {
    let step = parseGameUsi('startpos').startStep;
    expect(formatStep(step)).toEqual('開始局面');
    step = step.appendMoveUsi('7g7f');
    expect(formatStep(step)).toEqual('☗７六歩');
    step = step.appendMoveUsi('3c3d');
    expect(formatStep(step)).toEqual('☖３四歩');
    step = step.appendMoveUsi('8h2b+');
    expect(formatStep(step)).toEqual('☗２二角成');
    step = step.appendMoveUsi('3a2b');
    expect(formatStep(step)).toEqual('☖同　銀');
    step = step.appendMoveUsi('B*3c');
    expect(formatStep(step)).toEqual('☗３三角');
    step = step.appendMoveUsi('resign');
    expect(formatStep(step)).toEqual('☖投　了');
  });

  test('parsePvInfoUsi', () => {
    const pvInfo = parsePvInfoUsi(
      'info depth 8 seldepth 4 score mate 3 nodes 1322 nps 47214 time 28 pv B*3g 5i5h S*4i'
    );
    expect(pvInfo.depth).toEqual(['8']);
    expect(pvInfo.score).toEqual(['mate', '3']);
    expect(pvInfo.pv).toEqual(['B*3g', '5i5h', 'S*4i']);
  });

  test('parsePvScore', () => {
    expect(parsePvScore(['cp', '1'], 0)).toEqual(1);
    expect(parsePvScore(['cp', '-1'], 0)).toEqual(-1);
    expect(parsePvScore(['cp', '1'], 1)).toEqual(-1);
    expect(parsePvScore(['cp', '-1'], 1)).toEqual(1);

    expect(parsePvScore(['cp', '0'], 0)).toEqual(0);
    expect(parsePvScore(['cp', '-0'], 0)).toEqual(-0);
    expect(parsePvScore(['cp', '0'], 1)).toEqual(-0);
    expect(parsePvScore(['cp', '-0'], 1)).toEqual(0);

    expect(parsePvScore(['mate', '1'], 0)).toEqual(31999);
    expect(parsePvScore(['mate', '-1'], 0)).toEqual(-31999);
    expect(parsePvScore(['mate', '1'], 1)).toEqual(-31999);
    expect(parsePvScore(['mate', '-1'], 1)).toEqual(31999);

    expect(parsePvScore(['mate', '0'], 0)).toEqual(32000);
    expect(parsePvScore(['mate', '-0'], 0)).toEqual(-32000);
    expect(parsePvScore(['mate', '0'], 1)).toEqual(-32000);
    expect(parsePvScore(['mate', '-0'], 1)).toEqual(32000);
  });

  test('formatPvScoreValue', () => {
    expect(formatPvScoreValue(1)).toEqual('☗1');
    expect(formatPvScoreValue(-1)).toEqual('☖1');
    expect(formatPvScoreValue(0)).toEqual('0');
    expect(formatPvScoreValue(-0)).toEqual('0');
    expect(formatPvScoreValue(31999)).toEqual('☗1手詰');
    expect(formatPvScoreValue(-31999)).toEqual('☖1手詰');
    expect(formatPvScoreValue(32000)).toEqual('☗0手詰');
    expect(formatPvScoreValue(-32000)).toEqual('☖0手詰');
    expect(formatPvScoreValue(31111)).toEqual('☗優等局面');
    expect(formatPvScoreValue(-31111)).toEqual('☖優等局面');
  });

  test('formatGameUsiFromLastStep', () => {
    let step = parseGameUsi('startpos').startStep;
    expect(formatGameUsiFromLastStep(step)).toEqual('position startpos');
    step = step.appendMove(parseMoveUsi('7g7f'));
    expect(formatGameUsiFromLastStep(step)).toEqual('position startpos moves 7g7f');
    step = step.appendMove(parseMoveUsi('3c3d'));
    expect(formatGameUsiFromLastStep(step)).toEqual('position startpos moves 7g7f 3c3d');
    step = step.appendEnd('resign');
    expect(formatGameUsiFromLastStep(step)).toEqual('position startpos moves 7g7f 3c3d');
  });

  test('flipPiece', () => {
    expect(flipPiece(14)).toEqual(30);
    expect(flipPiece(30)).toEqual(14);
  });

  describe('formatMoveText', () => {
    test('LANCE', () => {
      // prettier-ignore
      const pos = new Position({
        board: [
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0,18, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0,17, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
        ],
        handCounts: [
          0, 0, 0, 0, 0, 0, 0,
          0, 1, 0, 0, 0, 0, 0
        ],
        sideToMove: 1,
      });
      expect(formatMoveText(pos, makeDrop(2, makeSquare(4, 0)))).toEqual('５一香');
      expect(formatMoveText(pos, makeDrop(2, makeSquare(4, 4)))).toEqual('５五香打');
      expect(formatMoveText(pos, makeDrop(2, makeSquare(4, 7)))).toEqual('５八香');
    });

    test('SILVER', () => {
      // prettier-ignore
      const pos = new Position({
        board: [
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0,20,20, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0,20, 0,20, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
        ],
        sideToMove: 1,
      });
      expect(formatMoveText(pos, makeMove(makeSquare(3, 3), makeSquare(4, 4)))).toEqual('５五銀右上');
      expect(formatMoveText(pos, makeMove(makeSquare(4, 3), makeSquare(4, 4)))).toEqual('５五銀直');
      expect(formatMoveText(pos, makeMove(makeSquare(3, 5), makeSquare(4, 4)))).toEqual('５五銀右引');
      expect(formatMoveText(pos, makeMove(makeSquare(5, 5), makeSquare(4, 4)))).toEqual('５五銀左');
    });

    test('PRO_PAWN', () => {
      // prettier-ignore
      const pos = new Position({
        board: [
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0,25,25,25, 0, 0, 0,
          0, 0, 0, 0, 0,25, 0, 0, 0,
          0, 0, 0, 0,25, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
        ],
        sideToMove: 1,
      });
      expect(formatMoveText(pos, makeMove(makeSquare(3, 3), makeSquare(4, 4)))).toEqual('５五と右');
      expect(formatMoveText(pos, makeMove(makeSquare(4, 3), makeSquare(4, 4)))).toEqual('５五と直');
      expect(formatMoveText(pos, makeMove(makeSquare(5, 3), makeSquare(4, 4)))).toEqual('５五と左上');
      expect(formatMoveText(pos, makeMove(makeSquare(5, 4), makeSquare(4, 4)))).toEqual('５五と寄');
      expect(formatMoveText(pos, makeMove(makeSquare(4, 5), makeSquare(4, 4)))).toEqual('５五と引');
    });

    test('ROOK', () => {
      // prettier-ignore
      const pos = new Position({
        board: [
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0,22, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0,22, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
        ],
        sideToMove: 1,
      });
      expect(formatMoveText(pos, makeMove(makeSquare(4, 1), makeSquare(4, 0)))).toEqual('５一飛');
      expect(formatMoveText(pos, makeMove(makeSquare(4, 1), makeSquare(4, 5)))).toEqual('５六飛上');
      expect(formatMoveText(pos, makeMove(makeSquare(4, 1), makeSquare(4, 6)))).toEqual('５七飛上不成');
      expect(formatMoveText(pos, makeMove(makeSquare(4, 1), makeSquare(4, 6), true))).toEqual('５七飛上成');
      expect(formatMoveText(pos, makeMove(makeSquare(4, 7), makeSquare(4, 5)))).toEqual('５六飛引不成');
      expect(formatMoveText(pos, makeMove(makeSquare(4, 7), makeSquare(4, 5), true))).toEqual('５六飛引成');
      expect(formatMoveText(pos, makeMove(makeSquare(4, 7), makeSquare(4, 8)))).toEqual('５九飛不成');
      expect(formatMoveText(pos, makeMove(makeSquare(4, 7), makeSquare(4, 8), true))).toEqual('５九飛成');
    });

    test('HORSE', () => {
      // prettier-ignore
      const pos = new Position({
        board: [
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0,29, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0,29, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
        ],
        sideToMove: 1,
      });
      expect(formatMoveText(pos, makeMove(makeSquare(2, 2), makeSquare(2, 1)))).toEqual('７二馬右');
      expect(formatMoveText(pos, makeMove(makeSquare(4, 3), makeSquare(2, 1)))).toEqual('７二馬左');
      expect(formatMoveText(pos, makeMove(makeSquare(2, 2), makeSquare(3, 2)))).toEqual('６三馬寄');
      expect(formatMoveText(pos, makeMove(makeSquare(4, 3), makeSquare(3, 2)))).toEqual('６三馬引');
      expect(formatMoveText(pos, makeMove(makeSquare(2, 2), makeSquare(3, 3)))).toEqual('６四馬上');
      expect(formatMoveText(pos, makeMove(makeSquare(4, 3), makeSquare(3, 3)))).toEqual('６四馬寄');
      expect(formatMoveText(pos, makeMove(makeSquare(2, 2), makeSquare(4, 4)))).toEqual('５五馬右');
      expect(formatMoveText(pos, makeMove(makeSquare(4, 3), makeSquare(4, 4)))).toEqual('５五馬左');
    });

    test('DRAGON', () => {
      // prettier-ignore
      const pos = new Position({
        board: [
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0,30, 0, 0, 0, 0,
          0, 0, 0, 0, 0,30, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
        ],
        sideToMove: 1,
      });
      expect(formatMoveText(pos, makeMove(makeSquare(4, 2), makeSquare(5, 1)))).toEqual('４二龍右');
      expect(formatMoveText(pos, makeMove(makeSquare(5, 3), makeSquare(5, 1)))).toEqual('４二龍左');
      expect(formatMoveText(pos, makeMove(makeSquare(4, 2), makeSquare(5, 2)))).toEqual('４三龍寄');
      expect(formatMoveText(pos, makeMove(makeSquare(5, 3), makeSquare(5, 2)))).toEqual('４三龍引');
      expect(formatMoveText(pos, makeMove(makeSquare(4, 2), makeSquare(4, 3)))).toEqual('５四龍上');
      expect(formatMoveText(pos, makeMove(makeSquare(5, 3), makeSquare(4, 3)))).toEqual('５四龍寄');
      expect(formatMoveText(pos, makeMove(makeSquare(4, 2), makeSquare(4, 4)))).toEqual('５五龍右');
      expect(formatMoveText(pos, makeMove(makeSquare(5, 3), makeSquare(4, 4)))).toEqual('５五龍左');
    });

    test('same', () => {
      // prettier-ignore
      const pos = new Position({
        board: [
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0,20,23,28, 0, 0, 0,
          0, 0, 0, 0, 1, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
        ],
        sideToMove: 1,
      });
      const lastMove = makeDrop(1, makeSquare(4, 6));
      expect(formatMoveText(pos, makeMove(makeSquare(3, 5), makeSquare(4, 6)), lastMove)).toEqual('同銀不成');
      expect(formatMoveText(pos, makeMove(makeSquare(4, 5), makeSquare(4, 6)), lastMove)).toEqual('同金');
      expect(formatMoveText(pos, makeMove(makeSquare(5, 5), makeSquare(4, 6)), lastMove)).toEqual('同成銀');
    });
  });
});
