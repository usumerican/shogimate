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
      ConsiderationMode: true,
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
      for (const name in this.options) {
        await this.postCommand('setoption name ' + name + ' value ' + this.options[name]);
      }
      await this.callCommand('isready', (line) => line === 'readyok');
    }
    return this.instance;
  }

  postCommand(command) {
    return new Promise((resolve) => {
      this.init().then((instance) => {
        instance.postMessage(command);
        resolve();
      });
    });
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

  terminate() {
    if (this.instance) {
      this.tryReject('terminated');
      this.instance.terminate();
      this.instance = null;
    }
  }

  tryReject(reason) {
    if (this.reject) {
      this.reject(reason);
      this.callback = this.resolve = this.reject = null;
    }
  }

  async checks(gameUsi) {
    await this.postCommand(gameUsi);
    const line = (await this.callCommand('checks', () => true)).trim();
    return line ? line.split(/\s+/) : [];
  }

  async bestmove(gameUsi, time) {
    await this.postCommand(gameUsi);
    const line = await this.callCommand('go btime 0 wtime 0 byoyomi ' + time, (line) => line.startsWith('bestmove'));
    return line.split(/\s+/)[1];
  }
}
