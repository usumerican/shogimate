/* eslint-disable no-irregular-whitespace */

import { beforeAll, describe, expect, test } from 'vitest';
import {
  formatGameUsi,
  formatGameUsiFromLastStep,
  formatStep,
  parseGameUsi,
  parsePvInfoUsi,
  parseMoveUsi,
  parsePvScore,
  formatPvScoreValue,
  defaultSfen,
  parseSfen,
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
  getMovePhonemes,
  formatGameKif,
  formatGameKi2,
  formatGameCsa,
  parseGameKif,
  parseGameCsa,
} from '../src/shogi.mjs';

describe('shogi', () => {
  test('sfen', () => {
    const sfens = [
      defaultSfen,
      'lnsgkgsn1/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1', // handicap
      'l6nl/5+P1gk/2np1S3/p1p4Pp/3P2Sp1/1PPb2P1P/P5GS1/R8/LN4bKL w RGgsn5p 1', // matsuri
      'ln5+Pl/3s1kg+R1/p2ppl2p/2ps1Bp2/P8/2P3P1P/N2gP4/5KS2/L+r3G1N+b b GS3Pn3p 57', // pinned mate problem
    ];
    for (const sfen of Object.values(sfens)) {
      expect(formatSfen(parseSfen(sfen))).toEqual(sfen);
    }
  });

  test('move format', () => {
    const pos = parseSfen('ln1gkg1nl/6+P2/2sppps1p/2p3p2/p8/P1P1P3P/2NP1PP2/3s1KSR1/L1+b2G1NL w R2Pbgp 42');
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
    expect(formatStep(step)).toEqual('☖投了');
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

  test('getMovePhonemes', () => {
    expect(getMovePhonemes('☗３一銀左上不成')).toEqual(['さん', 'いち', 'ぎん', 'ひだり', 'あがる', 'ならず']);
    expect(getMovePhonemes('☖同成銀右寄')).toEqual(['どう', 'なりぎん', 'みぎ', 'よる']);
  });

  describe('formatGame', () => {
    const game = parseGameUsi(
      'position sfen lnsgkgsn1/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1 moves 3c3d 7g7f 2b8h 4i5h B*7g 8i7g'
    );

    beforeAll(() => {
      game.startName = '香落ち';
      game.sideNames = ['下手', '上手'];
      game.playerNames = ['Black', 'White'];
      game.startStep.children[0].children[0].children[0].children[0].children[0].children[0].appendEnd('反則勝ち');
      game.startStep.children[0].children[0]
        .appendMoveUsi('2b8h+')
        .appendMoveUsi('6i5h')
        .appendMoveUsi('B*7g')
        .appendEnd('投了');
    });

    test('kif', () => {
      expect(formatGameKif(game)).toEqual(`手合割：香落ち
下手：Black
上手：White
手数----指手---------消費時間--
1 ３四歩(33)
2 ７六歩(77)
3 ８八角(22)
4 ５八金(49)
5 ７七角打
6 同　桂(89)
7 反則勝ち

変化：3手
3 ８八角成(22)
4 ５八金(69)
5 ７七角打
6 投了
`);
    });

    test('ki2', () => {
      expect(formatGameKi2(game)).toEqual(`手合割：香落ち
下手：Black
上手：White
△３四歩 ▲７六歩 △８八角不成 ▲５八金右 △７七角打 ▲同　桂

変化：3手
△８八角成 ▲５八金左 △７七角
`);
    });

    test('csa', () => {
      expect(formatGameCsa(game)).toEqual(`V2.2
N+Black
N-White
PI11KY
-
-3334FU
+7776FU
-2288KA
+4958KI
-0077KA
+8977KE
%+ILLEGAL_ACTION
`);
    });
  });

  test('parseGameKif', () => {
    expect(formatGameUsi(parseGameKif(''))).toEqual('position startpos');
    expect(formatGameUsi(parseGameKif('手合割：香落ち'))).toEqual(
      'position sfen lnsgkgsn1/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1'
    );
    expect(formatGameUsi(parseGameKif('1 ３四歩(33)\n2 ７六歩(77)'))).toEqual('position startpos moves 3c3d 7g7f');
    const kif = `手数----指手---------消費時間--
1 ７六歩(77)
2 ３四歩(33)

変化：2手
2 ８四歩(83)

変化：1手
1 ２六歩(27)
2 ３四歩(33)

変化：2手
2 ８四歩(83)
`;
    expect(formatGameKif(parseGameKif(kif))).toEqual(kif);
  });

  test('parseGameCsa', () => {
    const gameCsas = [
      `V2.2
PI11KY82HI
-
-3334FU
+7776FU
-2288KA
+4958KI
-0077KA
+6968KI
-8879UM
%-ILLEGAL_ACTION
`,
      `V2.2
P1-KY-KE *  *  *  *  * +TO-KY
P2 *  *  * -GI * -OU-KI+RY *\x20
P3-FU *  * -FU-FU-KY *  * -FU
P4 *  * -FU-GI * +KA-FU *  *\x20
P5+FU *  *  *  *  *  *  *  *\x20
P6 *  * +FU *  *  * +FU * +FU
P7+KE *  * -KI+FU *  *  *  *\x20
P8 *  *  *  *  * +OU+GI *  *\x20
P9+KY-RY *  *  * +KI * +KE-UM
P+00KI00GI00FU00FU00FU
P-00KE00FU00FU00FU
+
`,
    ];
    for (const gameCsa of gameCsas) {
      expect(formatGameCsa(parseGameCsa(gameCsa))).toEqual(gameCsa);
    }
  });
});
