import { on, parseHtml } from './browser.mjs';
import { parseGameCsa, parseGameKif, parseGameUsi } from './shogi.mjs';

export default class ImportView {
  constructor(app) {
    this.app = app;
    this.el = parseHtml(`
      <div class="ImportView">
        <div class="Center">読み込み</div>
        <textarea class="TextInput" placeholder="KIF/KI2/CSA/USI/BOD/SFEN"></textarea>
        <input class="FileInput" type="file" accept=".kifu,.kif,.ki2u,.ki2,.csa,.usi,.bod,.sfen,.txt" />
        <button class="FileButton">ファイル選択</button>
        <div class="ToolBar">
          <button class="CloseButton">閉じる</button>
          <button class="SubmitButton">読み込み</button>
        </div>
      </div>
    `);
    this.textInput = this.el.querySelector('.TextInput');

    on(this.el.querySelector('.CloseButton'), 'click', () => {
      this.hide();
    });

    on(this.el.querySelector('.SubmitButton'), 'click', () => {
      const gameText = this.textInput.value.trim();
      if (gameText) {
        this.hide(parseGameUsi(gameText) || parseGameCsa(gameText) || parseGameKif(gameText));
      }
    });
  }

  show() {
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
