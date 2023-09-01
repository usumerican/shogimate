/* eslint-env browser */

import { on, parseHtml } from './browser.mjs';
import { formatGameUsi, parseGameUsi } from './shogi.mjs';

export default class ImportView {
  constructor(app) {
    this.el = parseHtml(`
      <div class="ImportView">
        <div class="Center">読み込み</div>
        <textarea class="TextInput" placeholder="SFEN moves MOVE1 MOVE2..."></textarea>
        <input class="FileInput" type="file" accept=".txt" />
        <button class="FileButton">ファイル選択</button>
        <div class="ToolBar">
          <button class="CloseButton">閉じる</button>
          <button class="SubmitButton">読み込み</button>
        </div>
      </div>
    `);
    this.app = app;
    this.textInput = this.el.querySelector('.TextInput');
    this.fileInput = this.el.querySelector('.FileInput');

    on(this.el.querySelector('.CloseButton'), 'click', () => {
      this.hide();
    });

    on(this.el.querySelector('.FileButton'), 'click', () => {
      this.fileInput.click();
    });

    on(this.fileInput, 'change', () => {
      const file = this.fileInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          this.changeText(reader.result);
        };
        reader.readAsText(file, 'UTF-8');
      }
    });

    on(this.el.querySelector('.SubmitButton'), 'click', async () => {
      const records = [];
      let i = 0;
      for (const line of this.textInput.value.split('\n').map((line) => line.trim())) {
        if (line) {
          const game = parseGameUsi(line);
          if (game) {
            records.push(this.formatRecord(game));
          } else {
            await this.app.confirmView.show(`書式エラー: ${i + 1}行目`, ['OK']);
            return;
          }
        }
        i++;
      }
      if (records.length) {
        let skipCount = 0;
        for (const record of records) {
          if (this.app.collection.has(record)) {
            skipCount++;
          } else {
            this.app.collection.add(record);
          }
        }
        this.app.saveCollection();
        await this.app.confirmView.show(
          `${records.length - skipCount}件読み込みました。` + (skipCount ? `(登録済: ${skipCount}件)` : ''),
          ['OK']
        );
        this.hide(true);
      }
    });
  }

  show() {
    this.textInput.value = '';
    this.fileInput.value = '';
    this.app.pushView(this);
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  hide(value) {
    this.app.popView();
    if (this.resolve) {
      this.resolve(value);
      this.resolve = null;
    }
  }

  formatRecord(game) {
    let record = formatGameUsi(game);
    if (record.startsWith('position ')) {
      record = record.slice(9);
    }
    if (record.startsWith('sfen ')) {
      record = record.slice(5);
    }
    return record;
  }

  changeText(text) {
    this.textInput.value = text;
    this.textInput.scrollTop = 0;
  }
}
