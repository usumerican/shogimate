/* eslint-env browser */

import { on, parseHtml, setSelectValue } from './browser.mjs';

export default class SettingsView {
  constructor(app) {
    this.app = app;
    this.el = parseHtml(`
      <div class="SettingsView">
        <div class="Center">アプリ設定</div>
        <div class="FieldList">
          <div class="FieldItem">
            <span class="Center">駒音</span>
            <select class="PieceSoundSelect"></select>
          </div>
          <div class="FieldItem">
            <span class="Center">読み上げ</span>
            <select class="SpeechSelect">
              <option value="0">なし</option>
              <option value="1">あり</option>
            </select>
          </div>
          <div class="FieldItem">
            <span class="Center">駒配色</span>
            <select class="PieceStyleSelect"></select>
          </div>
          <div class="FieldItem">
            <span class="Center">駒文字</span>
            <select class="PieceTitleSetSelect"></select>
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
    this.speechSelect = this.el.querySelector('.SpeechSelect');
    this.pieceStyleSelect = this.el.querySelector('.PieceStyleSelect');
    this.pieceStyleSelect.replaceChildren(
      ...[...this.app.pieceStyleMap].map(([name, style]) => new Option(style.title, name))
    );
    this.pieceTitleSetSelect = this.el.querySelector('.PieceTitleSetSelect');
    this.pieceTitleSetSelect.replaceChildren(
      ...[...this.app.pieceTitleSetMap].map(([name, titleSet]) => new Option(titleSet.title, name))
    );

    on(this.el.querySelector('.CloseButton'), 'click', () => {
      this.hide();
    });

    on(this.pieceSoundSelect, 'change', () => {
      this.app.playSound(this.pieceSoundSelect.value);
    });

    on(this.speechSelect, 'change', () => {
      if (this.speechSelect.selectedIndex) {
        this.app.speakText(this.speechSelect.selectedOptions[0].text);
      }
    });

    on(this.el.querySelector('.SubmitButton'), 'click', () => {
      this.app.settings.pieceSoundName = this.pieceSoundSelect.value;
      this.app.settings.speech = +this.speechSelect.value;
      this.app.settings.pieceStyleName = this.pieceStyleSelect.value;
      this.app.settings.pieceTitleSetName = this.pieceTitleSetSelect.value;
      this.app.saveSettings();
      this.hide(true);
    });
  }

  show() {
    setSelectValue(this.pieceSoundSelect, this.app.settings.pieceSoundName);
    setSelectValue(this.speechSelect, this.app.settings.speech);
    setSelectValue(this.pieceStyleSelect, this.app.settings.pieceStyleName);
    setSelectValue(this.pieceTitleSetSelect, this.app.settings.pieceTitleSetName);
    this.app.pushView(this);
    this.app.initAudio();
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
