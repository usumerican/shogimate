import { describe, expect, test } from 'vitest';
import { formatGameUsi, formatStep, parseGameUsi, parseMoveUsi } from '../src/shogi.mjs';

describe('shogi', () => {
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
    step = step.appendMove(parseMoveUsi('7g7f'));
    expect(formatStep(step)).toEqual('☗７六歩(77)');
    step = step.appendMove(parseMoveUsi('3c3d'));
    step = step.appendMove(parseMoveUsi('8h2b+'));
    expect(formatStep(step)).toEqual('☗２二角成(88)');
    step = step.appendMove(parseMoveUsi('3a2b'));
    step = step.appendMove(parseMoveUsi('B*4e'));
    expect(formatStep(step)).toEqual('☗４五角打');
  });
});
