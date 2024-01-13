import {
  getMoveFrom,
  getMoveTo,
  isMoveDropped,
  isMovePromoted,
  makeDrop,
  makeMove,
  parseMoveUsi,
  squareN,
} from './shogi.mjs';

export default class ShogiEngine {
  constructor(factory, options) {
    this.factory = factory;
    this.options = options || {
      Threads: 1,
      USI_Hash: 16,
      NetworkDelay: 0,
      NetworkDelay2: 0,
      MinimumThinkingTime: 1000,
      PvInterval: 0,
    };
  }

  async init() {
    if (!this.instance) {
      this.instance = await this.factory();
      this.instance.addMessageListener((line) => {
        if (this.callback?.(line)) {
          this.resolve(line);
          this.callback = this.resolve = this.reject = null;
        } else if (line.startsWith('info string Error')) {
          this.tryReject(line);
        }
      });
      await this.callCommand('usi', (line) => line === 'usiok');
      await this.postOptionCommands(this.options);
      await this.callCommand('isready', (line) => line === 'readyok');
    }
    return this.instance;
  }

  tryReject(reason) {
    if (this.reject) {
      this.reject(reason);
      this.callback = this.resolve = this.reject = null;
    }
  }

  callCommand(command, callback) {
    return new Promise((resolve, reject) => {
      this.tryReject('canceled');
      this.callback = callback;
      this.resolve = resolve;
      this.reject = reject;
      this.init().then((instance) => {
        instance.postMessage(command);
      });
    });
  }

  postCommand(command) {
    return new Promise((resolve) => {
      this.init().then((instance) => {
        instance.postMessage(command);
        resolve();
      });
    });
  }

  async postOptionCommands(options) {
    for (const name in options) {
      await this.postCommand('setoption name ' + name + ' value ' + options[name]);
    }
  }

  terminate() {
    if (this.instance) {
      this.tryReject('terminated');
      this.instance.terminate();
      this.instance = null;
    }
  }

  async getMoves(gameUsi, checks) {
    await this.postCommand(gameUsi);
    return (await this.callCommand(checks ? 'checks' : 'moves', () => true)).trim();
  }

  async getFromToMap(gameUsi, checks) {
    const fromToMap = new Map();
    const line = await this.getMoves(gameUsi, checks);
    if (line) {
      for (const moveUsi of line.split(/\s+/)) {
        const move = parseMoveUsi(moveUsi);
        if (move) {
          const from = getMoveFrom(move);
          const key = isMoveDropped(move) ? makeDrop(from, squareN) : makeMove(from, squareN);
          let toMap = fromToMap.get(key);
          if (!toMap) {
            toMap = new Map();
            fromToMap.set(key, toMap);
          }
          const to = getMoveTo(move);
          toMap.set(to, (toMap.get(to) || 0) | (isMovePromoted(move) ? 2 : 1));
        }
      }
    }
    return fromToMap;
  }

  async think(gameUsi, time, options, callback) {
    await this.postOptionCommands(options);
    await this.postCommand(gameUsi);
    return await this.callCommand(
      'go btime 0 wtime 0 byoyomi ' + time,
      (line) => line.startsWith('bestmove') || callback?.(line)
    );
  }

  async bestmove(gameUsi, time, level) {
    return (await this.think(gameUsi, time, { ConsiderationMode: false, MultiPV: 1, SkillLevel: level ?? 20 })).split(
      /\s+/
    )[1];
  }

  async research(gameUsi, time, mpv, callback) {
    return await this.think(gameUsi, time, { ConsiderationMode: true, MultiPV: mpv, SkillLevel: 20 }, callback);
  }
}
