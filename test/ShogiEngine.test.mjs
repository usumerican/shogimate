import factory from '../public/lib/sse42/yaneuraou.js';
import ShogiEngine from '../src/ShogiEngine.mjs';
import { afterAll, describe, expect, test } from 'vitest';

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

  test('legal checks', async () => {
    await engine.postCommand(
      'position sfen ln5+Pl/3s1kg+R1/p2ppl2p/2ps1Bp2/P8/2P3P1P/N2gP4/5KS2/L+r3G1N+b b GS3Pn3p 57'
    );
    const moves = await engine.callCommand('moves', () => true);
    expect(moves.trim().split(/\s+/).length).toEqual(151);
    const checks = await engine.callCommand('checks', () => true);
    expect(checks.trim().split(/\s+/).length).toEqual(9);
    expect(checks.includes('4d3c+')).toBeFalsy();
  });
});
