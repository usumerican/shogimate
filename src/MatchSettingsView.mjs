/* eslint-env browser */

import ConfirmView from './ConfirmView.mjs';
import MatchView from './MatchView.mjs';
import ShogiPanel from './ShogiPanel.mjs';
import { on, parseHtml, setSelectValue } from './browser.mjs';
import { parseGameUsi, startInfos } from './shogi.mjs';

export default class MatchSettingsView {
  constructor(app) {
    this.app = app;
    this.el = parseHtml(`
      <div class="MatchSettingsView">
        <div class="Content">
          <div class="Center">対局設定</div>
          <canvas class="ShogiPanel"></canvas>
          <div class="ToolBar">
            <select class="StartSelect"></select>
            <select class="AutoSelect">
              <option value="-1">振り駒</option>
              <option value="2">先手/下手</option>
              <option value="1">後手/上手</option>
              <option value="0">手動</option>
            </select>
            <select class="LevelSelect"></select>
          </div>
          <div class="ToolBar">
            <button class="CloseButton">キャンセル</button>
            <button class="StartButton">開始</button>
          </div>
        </div>
      </div>
    `);
    this.shogiPanel = new ShogiPanel(this.app, this.el.querySelector('.ShogiPanel'));
    this.startSelect = this.el.querySelector('.StartSelect');
    this.startSelect.replaceChildren(...startInfos.map((info) => new Option(info.name, info.sfen)));
    this.autoSelect = this.el.querySelector('.AutoSelect');
    this.levelSelect = this.el.querySelector('.LevelSelect');
    this.levelSelect.replaceChildren(...[...Array(21).keys()].map((i) => new Option(`レベル ${i}`, i)));

    on(this.el.querySelector('.CloseButton'), 'click', () => {
      this.hide();
    });

    on(this.startSelect, 'change', () => {
      this.update();
    });

    on(this.autoSelect, 'change', () => {
      this.update();
    });

    on(this.el.querySelector('.StartButton'), 'click', async () => {
      const start = this.startSelect.value;
      const auto = +this.autoSelect.value;
      if (auto >= 0) {
        this.game.auto = auto;
      } else {
        const side = Math.floor(Math.random() * 2);
        if (
          !(await new ConfirmView(this.app).show(`あなたは${this.game.sideNames[side]}です。`, ['キャンセル', 'OK']))
        ) {
          return;
        }
        this.game.auto = side ? 1 : 2;
      }
      const level = +this.levelSelect.value;
      this.game.level = level;
      this.game.inversion = this.game.auto === 1 ? 1 : 0;
      this.app.settings.match = { start, auto, level };
      this.app.saveSettings();
      this.hide();
      new MatchView(this.app).show(
        auto ? this.levelSelect.selectedOptions[0].text : this.autoSelect.selectedOptions[0].text,
        this.game
      );
    });
  }

  show() {
    setSelectValue(this.startSelect, this.app.settings.match?.start);
    setSelectValue(this.autoSelect, this.app.settings.match?.auto);
    setSelectValue(this.levelSelect, this.app.settings.match?.level);
    this.update();
    this.app.pushView(this);
  }

  hide() {
    this.app.popView();
  }

  update() {
    this.game = this.shogiPanel.game = parseGameUsi(this.startSelect.value);
    this.game.inversion = +this.autoSelect.value === 1 ? 1 : 0;
    this.game.sideNames[0] = this.autoSelect.options[1].text = this.startSelect.selectedIndex ? '下手' : '先手';
    this.game.sideNames[1] = this.autoSelect.options[2].text = this.startSelect.selectedIndex ? '上手' : '後手';
    this.shogiPanel.step = this.game.startStep;
    this.shogiPanel.request();
  }
}
