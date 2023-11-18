/* eslint-env browser */

import { on, parseHtml, setTextareaValue } from './browser.mjs';
import { formatBod, formatGameKi2, formatGameKif, formatGameUsi, formatSfen } from './shogi.mjs';

export default class ExportView {
  constructor(app) {
    this.app = app;
    this.el = parseHtml(`
      <div class="ExportView">
        <div class="Center">書き出し</div>
        <textarea class="TextOutput Monospace"></textarea>
        <select class="FormatSelect"></select>
        <div class="ToolBar">
          <button class="CloseButton">閉じる</button>
          <button class="CopyButton">コピー</button>
          <button class="SubmitButton">ダウンロード</button>
        </div>
      </div>
    `);
    this.textOutput = this.el.querySelector('.TextOutput');
    this.formatInfos = [
      { name: '棋譜', suffix: '.kifu', handler: () => formatGameKif(this.game) },
      { name: '棋譜', suffix: '.ki2u', handler: () => formatGameKi2(this.game) },
      { name: '棋譜', suffix: '.usi', handler: () => formatGameUsi(this.game) },
      {
        name: '局面',
        suffix: '.bod',
        handler: () => formatBod(this.step.position, this.game.sideNames, this.step.position.number),
      },
      { name: '局面', suffix: '.sfen', handler: () => formatSfen(this.step.position) },
    ];
    this.formatSelect = this.el.querySelector('.FormatSelect');
    this.formatSelect.replaceChildren(
      ...this.formatInfos.map((info, i) => new Option(`${info.name} (${info.suffix})`, i))
    );

    on(this.el.querySelector('.CloseButton'), 'click', () => {
      this.hide();
    });

    on(this.formatSelect, 'change', () => {
      this.update();
    });

    on(this.el.querySelector('.CopyButton'), 'click', () => {
      this.app.writeToClipboard(this.textOutput.value);
    });
  }

  show(game, step) {
    this.game = game;
    this.step = step;
    this.update();
    this.app.pushView(this);
  }

  hide() {
    this.app.popView(this);
  }

  update() {
    setTextareaValue(this.textOutput, this.formatInfos[+this.formatSelect.value].handler());
  }
}
