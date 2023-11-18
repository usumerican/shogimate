/* eslint-env browser */

import ConfirmView from './ConfirmView.mjs';
import MatchView from './MatchView.mjs';
import ShogiPanel from './ShogiPanel.mjs';
import { on, parseHtml, setSelectValue } from './browser.mjs';
import { parseGameUsi, sideInfos, sides, startInfos, startNameSfenMap } from './shogi.mjs';

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
              <option value="2"></option>
              <option value="1"></option>
              <option value="0">手動</option>
            </select>
            <select class="LevelSelect"></select>
          </div>
          <div class="PositionBar">
            <label><input type="checkbox" class="PositionSpecifiedCheckbox" />指定局面</label>
            <input class="PositionSfenInput" placeholder="指定局面SFEN" />
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
    this.startSelect.replaceChildren(...startInfos.map((info) => new Option(info.name)));
    this.autoSelect = this.el.querySelector('.AutoSelect');
    this.levelSelect = this.el.querySelector('.LevelSelect');
    this.levelSelect.replaceChildren(...[...Array(21).keys()].map((i) => new Option(`レベル ${i}`, i)));
    this.positionSpecifiedCheckbox = this.el.querySelector('.PositionSpecifiedCheckbox');
    this.positionSfenInput = this.el.querySelector('.PositionSfenInput');

    on(this.el.querySelector('.CloseButton'), 'click', () => {
      this.hide();
    });

    on(this.positionSpecifiedCheckbox, 'change', () => {
      this.update();
    });

    on(this.positionSfenInput, 'change', () => {
      this.update();
    });

    on(this.startSelect, 'change', () => {
      this.update();
    });

    on(this.autoSelect, 'change', () => {
      this.update();
    });

    on(this.el.querySelector('.StartButton'), 'click', async () => {
      const auto = +this.autoSelect.value;
      if (auto >= 0) {
        this.game.auto = auto;
      } else {
        const side = Math.floor(Math.random() * 2);
        if (
          !(await new ConfirmView(this.app).show(`あなたは${this.autoSelect.options[side + 1].text}です。`, [
            'キャンセル',
            'OK',
          ]))
        ) {
          return;
        }
        this.game.auto = side ? 1 : 2;
      }
      this.game.startName = this.startSelect.value;
      this.game.level = +this.levelSelect.value;
      this.game.flipped = this.game.auto === 1 ? 1 : 0;
      for (const side of sides) {
        this.game.playerNames[side] =
          (1 << side) & this.game.auto ? this.levelSelect.selectedOptions[0].text : 'あなた';
      }
      if (!this.temporary) {
        this.app.settings.match = {
          positionSpecified: this.positionSpecifiedCheckbox.checked,
          positionSfen: this.positionSfenInput.value,
          startName: this.game.startName,
          auto,
          level: this.game.level,
        };
        this.app.saveSettings();
      }
      this.hide();
      new MatchView(this.app).show('対局', this.game);
    });
  }

  show({ startName, auto, level, positionSpecified, positionSfen } = {}, temporary) {
    setSelectValue(this.startSelect, startName);
    setSelectValue(this.autoSelect, auto);
    setSelectValue(this.levelSelect, level);
    this.positionSpecifiedCheckbox.checked = positionSpecified;
    this.positionSfenInput.value = positionSfen || '';
    this.temporary = temporary;
    this.update();
    this.app.pushView(this);
  }

  hide() {
    this.app.popView(this);
  }

  update() {
    this.game = this.shogiPanel.game = parseGameUsi(
      (this.positionSpecifiedCheckbox.checked && this.positionSfenInput.value) ||
        startNameSfenMap.get(this.startSelect.value)
    );
    this.game.flipped = +this.autoSelect.value === 1 ? 1 : 0;
    const key = this.startSelect.selectedIndex ? 'alias' : 'name';
    for (const side of sides) {
      this.autoSelect.options[side + 1].text =
        sideInfos[side].char + (this.game.sideNames[side] = sideInfos[side][key]);
    }
    this.shogiPanel.step = this.game.startStep;
    this.shogiPanel.request();
  }
}
