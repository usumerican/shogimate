/* eslint-env browser */

import View from './View.mjs';
import { on, setTextareaValue } from './browser.mjs';
import { parseGameCsa, parseGameKif, parseGameUsi } from './shogi.mjs';

export default class ImportView extends View {
  constructor() {
    super(`
      <div class="ImportView">
        <div class="Center">読み込み</div>
        <textarea class="TextInput" placeholder="KIF/KI2/CSA/USI/BOD/SFEN"></textarea>
        <input class="FileInput" type="file" accept=".kifu,.kif,.ki2u,.ki2,.csa,.usi,.bod,.sfen,.txt" />
        <button class="FileButton">ファイル選択</button>
        <div class="ToolBar">
          <button class="CloseButton">閉じる</button>
          <button class="PasteButton">貼り付け</button>
          <button class="SubmitButton">読み込み</button>
        </div>
      </div>
    `);
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
          setTextareaValue(this.textInput, reader.result);
        };
        reader.readAsText(file, 'UTF-8');
      }
    });

    on(this.el.querySelector('.PasteButton'), 'click', async () => {
      setTextareaValue(this.textInput, await this.app.readFromClipboard());
    });

    on(this.el.querySelector('.SubmitButton'), 'click', () => {
      const gameText = this.textInput.value.trim();
      if (gameText) {
        this.hide(parseGameUsi(gameText) || parseGameCsa(gameText) || parseGameKif(gameText));
      }
    });
  }
}
