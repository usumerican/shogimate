import View from './View.mjs';
import { downloadTextFile, on, setTextareaValue } from './browser.mjs';

export default class CollectionExportView extends View {
  constructor() {
    super(`
      <div class="CollectionExportView">
        <div class="Center">書き出し</div>
        <textarea class="TextOutput"></textarea>
        <div class="ToolBar">
          <button class="CloseButton">閉じる</button>
          <button class="CopyButton">コピー</button>
          <button class="DownloadButton">ダウンロード</button>
        </div>
      </div>
    `);
    this.textOutput = this.el.querySelector('.TextOutput');

    on(this.el.querySelector('.CloseButton'), 'click', () => {
      this.hide();
    });

    on(this.el.querySelector('.CopyButton'), 'click', () => {
      this.app.writeToClipboard(this.textOutput.value);
    });

    on(this.el.querySelector('.DownloadButton'), 'click', () => {
      downloadTextFile('collection.txt', this.textOutput.value);
    });
  }

  onShow(records) {
    setTextareaValue(this.textOutput, records.join('\n') + '\n');
  }
}
