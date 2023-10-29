/* eslint-env browser */

import { on, parseHtml, setTextareaValue } from './browser.mjs';

export default class ExportView {
  constructor(app) {
    this.el = parseHtml(`
      <div class="ExportView">
        <div class="Center">書き出し</div>
        <textarea class="TextOutput"></textarea>
        <div class="ToolBar">
          <button class="CloseButton">閉じる</button>
          <button class="CopyButton">コピー</button>
          <button class="SubmitButton">ダウンロード</button>
        </div>
      </div>
    `);
    this.app = app;
    this.textOutput = this.el.querySelector('.TextOutput');

    on(this.el.querySelector('.CloseButton'), 'click', () => {
      this.hide();
    });

    on(this.el.querySelector('.CopyButton'), 'click', () => {
      this.app.writeToClipboard(this.textOutput.value);
    });

    on(this.el.querySelector('.SubmitButton'), 'click', () => {
      const anchor = document.createElement('a');
      anchor.href = 'data:application/octet-stream,' + encodeURIComponent(this.textOutput.value);
      anchor.download = 'collection.txt';
      anchor.click();
    });
  }

  show(records) {
    setTextareaValue(this.textOutput, records.join('\n') + '\n');
    this.app.pushView(this);
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  hide(value) {
    this.app.popView(this);
    if (this.resolve) {
      this.resolve(value);
      this.resolve = null;
    }
  }
}
