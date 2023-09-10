/* eslint-env browser */

import { on, parseHtml, setSelectValue } from './browser.mjs';

export default class SettingsView {
  constructor(app) {
    this.app = app;
    this.el = parseHtml(`
      <div class="SettingsView">
        <div class="Center">設定</div>
        <div class="FieldList">
          <div class="FieldItem">
            <span class="Center">駒音</span>
            <select class="PieceSoundSelect"></select>
          </div>
          <div class="FieldItem">
            <span class="Center">駒表示</span>
            <select class="PieceStyleSelect"></select>
          </div>
        </div>
        <div class="ToolBar">
          <button class="CloseButton">キャンセル</button>
          <button class="SubmitButton">保存</button>
        </div>
      </div>
    `);
    this.pieceSoundSelect = this.el.querySelector('.PieceSoundSelect');
    this.pieceSoundSelect.replaceChildren(...this.app.pieceSounds.map((sound) => new Option(sound.title, sound.name)));
    this.pieceStyleSelect = this.el.querySelector('.PieceStyleSelect');
    this.pieceStyleSelect.replaceChildren(...this.app.pieceStyles.map((style) => new Option(style.title, style.name)));

    on(this.el.querySelector('.CloseButton'), 'click', () => {
      this.hide();
    });

    on(this.pieceSoundSelect, 'change', () => {
      this.app.playSound(this.pieceSoundSelect.value);
    });

    on(this.el.querySelector('.SubmitButton'), 'click', () => {
      this.app.settings.pieceSoundName = this.pieceSoundSelect.value;
      this.app.settings.pieceStyleName = this.pieceStyleSelect.value;
      this.app.saveSettings();
      this.hide(true);
    });
  }

  show() {
    setSelectValue(this.pieceSoundSelect, this.app.settings.pieceSoundName);
    setSelectValue(this.pieceStyleSelect, this.app.settings.pieceStyleName);
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
}
