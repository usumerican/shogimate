/* eslint-env browser */

import ConfirmView from './ConfirmView.mjs';
import CollectionExportView from './CollectionExportView.mjs';
import CollectionImportView from './CollectionImportView.mjs';
import QuestionView from './QuestionView.mjs';
import { on, parseHtml } from './browser.mjs';

export default class CollectionView {
  constructor(app) {
    this.app = app;
    this.el = parseHtml(`
      <div class="CollectionView">
        <div class="Center">コレクション</div>
        <div class="ToolBar">
          <button class="CloseButton">閉じる</button>
          <button class="SelectButton">全て選択</button>
          <button class="ImportButton">読み込み</button>
          <button class="ExportButton">書き出し</button>
        </div>
        <div class="LimitList"></div>
        <button class="StartButton">始めから</button>
        <button class="ChallengeButton">チャレンジ</button>
      </div>
    `);
    this.exportButton = this.el.querySelector('.ExportButton');
    this.startButton = this.el.querySelector('.StartButton');
    this.challengeButton = this.el.querySelector('.ChallengeButton');
    this.limitList = this.el.querySelector('.LimitList');
    const limitTitles = [
      [1, '1手'],
      [3, '3手'],
      [5, '5手'],
      [7, '7手'],
      [9, '9手'],
      [11, '11手'],
      [0, '解答例なし'],
      [-1, 'その他'],
    ];
    this.limitItems = limitTitles.map(([limit, title]) => {
      const item = parseHtml(`
        <div class="LimitItem">
          <label>
            <input type="checkbox" />
            <span class="TitleOutput"></span>
            <span class="CountOutput"></span>
          </label>
          <button class="DeleteButton">削除</button>
        </div>
      `);
      item.limit = limit;
      item.checkbox = item.querySelector('input');
      on(item.checkbox, 'change', () => {
        this.updateButtons();
      });
      item.querySelector('.TitleOutput').textContent = title;
      item.countOutput = item.querySelector('.CountOutput');
      item.deleteButton = item.querySelector('.DeleteButton');
      on(item.deleteButton, 'click', async () => {
        if (item.records.length) {
          if (await new ConfirmView(this.app).show('削除しますか?', ['いいえ', 'はい'])) {
            for (const record of item.records) {
              this.app.collection.delete(record);
            }
            this.app.saveCollection();
            this.updateCounts();
          }
        }
      });
      return item;
    });
    this.limitList.replaceChildren(...this.limitItems);
    this.limitItemMap = this.limitItems.reduce((map, item) => (map.set(item.limit, item), map), new Map());

    on(this.el.querySelector('.CloseButton'), 'click', () => {
      this.hide();
    });

    on(this.el.querySelector('.SelectButton'), 'click', () => {
      const value = !this.limitItems.every((item) => item.checkbox.checked);
      for (const item of this.limitItems) {
        item.checkbox.checked = value;
      }
      this.updateButtons();
    });

    on(this.el.querySelector('.ImportButton'), 'click', async () => {
      if (await new CollectionImportView(this.app).show()) {
        this.updateCounts();
      }
    });

    on(this.exportButton, 'click', () => {
      const records = [];
      for (const item of this.limitItems) {
        if (item.checkbox.checked) {
          records.push(...item.records);
        }
      }
      new CollectionExportView(this.app).show(records);
    });

    on(this.startButton, 'click', () => {
      this.start(0);
    });

    on(this.challengeButton, 'click', () => {
      this.start(-1);
    });
  }

  show() {
    const limitSet = new Set(this.app.settings.collection?.limits);
    for (const item of this.limitItems) {
      item.checkbox.checked = limitSet.has(item.limit);
    }
    this.updateCounts();
    this.app.pushView(this);
  }

  hide() {
    this.app.popView(this);
  }

  async start(startRecordOrder) {
    const records = [];
    const limits = [];
    for (const item of this.limitItems) {
      if (item.checkbox.checked) {
        records.push(...item.records);
        limits.push(item.limit);
      }
    }
    if (records.length) {
      this.app.settings.collection = { limits };
      this.app.saveSettings();
      await new QuestionView(this.app).show(records, startRecordOrder, 'コレクション');
      this.updateCounts();
    }
  }

  updateCounts() {
    for (const item of this.limitItems) {
      item.records = [];
    }
    for (const record of this.app.collection) {
      const limit =
        record
          .trim()
          .split(/\s+moves\s+/)[1]
          ?.split(/\s+/).length || 0;
      const item = this.limitItemMap.get(limit) || this.limitItemMap.get(-1);
      item.records.push(record);
    }
    for (const item of this.limitItems) {
      item.countOutput.textContent = `(${item.records.length}件)`;
    }
    this.updateButtons();
  }

  updateButtons() {
    let allDisabled = true;
    for (const item of this.limitItems) {
      allDisabled &= item.deleteButton.disabled = !(item.checkbox.checked && item.records.length);
    }
    this.exportButton.disabled = this.startButton.disabled = this.challengeButton.disabled = allDisabled;
  }
}
