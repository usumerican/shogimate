/* eslint-env browser */

import { downloadFile, on, parseHtml, setSelectValue, setTextareaValue } from './browser.mjs';
import { formatBod, formatGameCsa, formatGameKi2, formatGameKif, formatGameUsi, formatSfen } from './shogi.mjs';

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
          <button class="DownloadButton">ダウンロード</button>
        </div>
      </div>
    `);
    this.textOutput = this.el.querySelector('.TextOutput');
    this.formatInfos = [
      { name: 'game.kifu', title: '棋譜 (KIF)', handler: () => formatGameKif(this.game) },
      { name: 'game.ki2u', title: '棋譜 (KI2)', handler: () => formatGameKi2(this.game) },
      { name: 'game.csa', title: '棋譜 (CSA)', handler: () => formatGameCsa(this.game) },
      { name: 'game.usi', title: '棋譜 (USI)', handler: () => formatGameUsi(this.game) },
      {
        name: 'position.bod',
        title: '局面 (BOD)',
        handler: () => formatBod(this.step.position, this.game.sideNames, this.step.position.number),
      },
      { name: 'position.sfen', title: '局面 (SFEN)', handler: () => formatSfen(this.step.position) },
    ];
    this.formatSelect = this.el.querySelector('.FormatSelect');
    this.formatSelect.replaceChildren(...this.formatInfos.map((info) => new Option(info.title, info.name)));

    on(this.el.querySelector('.CloseButton'), 'click', () => {
      this.hide();
    });

    on(this.formatSelect, 'change', () => {
      this.app.settings.export = { formatName: this.formatSelect.value };
      this.app.saveSettings();
      this.update();
    });

    on(this.el.querySelector('.CopyButton'), 'click', () => {
      this.app.writeToClipboard(this.textOutput.value);
    });

    on(this.el.querySelector('.DownloadButton'), 'click', () => {
      downloadFile(this.formatSelect.value, this.textOutput.value);
    });
  }

  show(game, step) {
    this.game = game;
    this.step = step;
    setSelectValue(this.formatSelect, this.app.settings.export?.formatName);
    this.update();
    this.app.pushView(this);
  }

  hide() {
    this.app.popView(this);
  }

  update() {
    setTextareaValue(this.textOutput, this.formatInfos[this.formatSelect.selectedIndex].handler());
  }
}
