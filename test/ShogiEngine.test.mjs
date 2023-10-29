import factory from '../public/lib/sse42/yaneuraou.js';
import ShogiEngine from '../src/ShogiEngine.mjs';
import { afterAll, describe, expect, test } from 'vitest';
import { makeMove, makeSquare, squareN } from '../src/shogi.mjs';

describe('ShogiEngine', () => {
  const engine = new ShogiEngine(factory);

  afterAll(() => {
    engine.terminate();
  });

  test('usinewgame', async () => {
    await engine.postCommand('usinewgame');
    const moves = await engine.callCommand('moves', () => true);
    expect(moves.trim().split(/\s+/).length).toEqual(30);
    const checks = await engine.callCommand('checks', () => true);
    expect(checks).toEqual('');
  });

  test('pinned', async () => {
    await engine.postCommand(
      'position sfen ln5+Pl/3s1kg+R1/p2ppl2p/2ps1Bp2/P8/2P3P1P/N2gP4/5KS2/L+r3G1N+b b GS3Pn3p 57'
    );
    const moves = await engine.callCommand('moves', () => true);
    expect(moves.trim().split(/\s+/).length).toEqual(151);
    const checks = await engine.callCommand('checks', () => true);
    expect(checks.trim().split(/\s+/).length).toEqual(9);
    expect(checks.includes('4d3c+')).toBeFalsy();
  });

  test('getFromToMap', async () => {
    const fromToMap = await engine.getFromToMap(
      'position sfen l2g5/1+r1s1kl2/p2ppp1Np/6P2/2L2P3/2PP2RP1/2G1P3P/9/3SKG1NL b BGS2N5Pbsp 97'
    );
    expect(fromToMap.size).toEqual(20);
    const toMap = fromToMap.get(makeMove(makeSquare(2, 4), squareN));
    expect(toMap.size).toEqual(4);
    expect(toMap.get(makeSquare(2, 3))).toEqual(1);
    expect(toMap.get(makeSquare(2, 2))).toEqual(3);
    expect(toMap.get(makeSquare(2, 0))).toEqual(2);
  });
});
