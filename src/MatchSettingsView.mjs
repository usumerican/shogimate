/* eslint-env browser */

import ConfirmView from './ConfirmView.mjs';
import ImportView from './ImportView.mjs';
import MatchView from './MatchView.mjs';
import ShogiPanel from './ShogiPanel.mjs';
import { on, parseHtml, setSelectValue } from './browser.mjs';
import { formatSfen, parseGameUsi, sideInfos, sides, startInfos, startNameSfenMap, timingInfos } from './shogi.mjs';

export default class MatchSettingsView {
  constructor(app) {
    this.app = app;
    this.el = parseHtml(`
      <div class="MatchSettingsView">
        <div class="Center">対局設定</div>
        <canvas class="ShogiPanel"></canvas>
        <div class="TitleBar">
          <label class="LabelCenter"><input type="checkbox" class="PositionSpecifiedCheckbox" />指定局面</label>
          <input class="PositionSfenInput" placeholder="指定局面SFEN" />
          <button class="ImportButton">読み込み</button>
        </div>
        <div class="ToolBar">
          <select class="StartSelect"></select>
          <select class="AutomationSelect">
            <option value="3">振り駒</option>
            <option value="2"></option>
            <option value="1"></option>
            <option value="0">手動</option>
          </select>
          <select class="LevelSelect"></select>
        </div>
        <div class="ToolBar">
          <select class="TimingNameSelect"></select>
          <select class="MainTimeSelect"></select>
          <select class="ExtraTimeSelect"></select>
        </div>
        <div class="ToolBar">
          <button class="CloseButton">キャンセル</button>
          <button class="StartButton">開始</button>
        </div>
      </div>
    `);
    this.shogiPanel = new ShogiPanel(this.app, this.el.querySelector('.ShogiPanel'));
    this.startSelect = this.el.querySelector('.StartSelect');
    this.startSelect.replaceChildren(...startInfos.map((info) => new Option(info.name)));
    this.automationSelect = this.el.querySelector('.AutomationSelect');
    this.levelSelect = this.el.querySelector('.LevelSelect');
    this.levelSelect.replaceChildren(...[...Array(21).keys()].map((i) => new Option(`レベル ${i}`, i)));
    this.positionSpecifiedCheckbox = this.el.querySelector('.PositionSpecifiedCheckbox');
    this.positionSfenInput = this.el.querySelector('.PositionSfenInput');
    this.timingNameSelect = this.el.querySelector('.TimingNameSelect');
    this.timingNameSelect.replaceChildren(
      new Option('時間無制限', ''),
      ...timingInfos.map((info) => new Option(info.title, info.name))
    );
    this.mainTimeSelect = this.el.querySelector('.MainTimeSelect');
    this.mainTimeSelect.replaceChildren(
      ...[0, 10, 20, 30, 40, 50].map((sec) => new Option(sec + '秒', sec * 1000)),
      ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60].map(
        (min) => new Option(min + '分', min * 60_000)
      )
    );
    this.extraTimeSelect = this.el.querySelector('.ExtraTimeSelect');
    this.extraTimeSelect.replaceChildren(
      ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60].map(
        (sec) => new Option('+' + sec + '秒', sec * 1000)
      )
    );

    on(this.el.querySelector('.CloseButton'), 'click', () => {
      this.hide();
    });

    on(this.positionSpecifiedCheckbox, 'change', () => {
      this.update();
    });

    on(this.positionSfenInput, 'change', () => {
      this.update();
    });

    on(this.el.querySelector('.ImportButton'), 'click', async () => {
      const game = await new ImportView(this.app).show();
      if (game) {
        this.positionSpecifiedCheckbox.checked = true;
        this.positionSfenInput.value = formatSfen(game.startStep.position);
        this.update();
      }
    });

    on(this.startSelect, 'change', () => {
      this.update();
    });

    on(this.automationSelect, 'change', () => {
      this.update();
    });

    on(this.levelSelect, 'change', () => {
      this.update();
    });

    on(this.timingNameSelect, 'change', () => {
      this.update();
    });

    on(this.mainTimeSelect, 'change', () => {
      this.update();
    });

    on(this.extraTimeSelect, 'change', () => {
      this.update();
    });

    on(this.el.querySelector('.StartButton'), 'click', async () => {
      const automation = +this.automationSelect.value;
      if (automation === 3) {
        const side = Math.floor(Math.random() * 2);
        if (
          !(await new ConfirmView(this.app).show(`あなたは${this.getAutomationOption(side).text}です。`, [
            'キャンセル',
            'OK',
          ]))
        ) {
          return;
        }
        this.game.automation = 2 >> side;
      }
      this.game.flipped = this.game.automation === 1 ? 1 : 0;
      for (const side of sides) {
        this.game.players[side].name = this.game.isSideAutomatic(side)
          ? this.levelSelect.selectedOptions[0].text
          : 'あなた';
      }
      if (!this.temporary) {
        this.app.settings.match = {
          positionSpecified: this.positionSpecifiedCheckbox.checked,
          positionSfen: this.positionSfenInput.value,
          startName: this.game.startName,
          automation,
          level: this.game.level,
          timingName: this.game.timingName,
          mainTime: this.game.mainTime,
          extraTime: this.game.extraTime,
        };
        this.app.saveSettings();
      }
      this.hide();
      new MatchView(this.app).show('対局', this.game);
    });
  }

  show({ startName, automation, level, positionSpecified, positionSfen } = {}, temporary) {
    setSelectValue(this.startSelect, startName);
    setSelectValue(this.automationSelect, automation);
    setSelectValue(this.levelSelect, level);
    this.positionSpecifiedCheckbox.checked = positionSpecified;
    this.positionSfenInput.value = positionSfen || '';
    setSelectValue(this.timingNameSelect, this.app.settings.match?.timingName);
    setSelectValue(this.mainTimeSelect, this.app.settings.match?.mainTime);
    setSelectValue(this.extraTimeSelect, this.app.settings.match?.extraTime);
    this.temporary = temporary;
    this.update();
    this.app.pushView(this);
  }

  hide() {
    this.app.popView(this);
  }

  update() {
    const positionSpecified = this.positionSpecifiedCheckbox.checked;
    this.game = parseGameUsi(
      (positionSpecified && this.positionSfenInput.value) || startNameSfenMap.get(this.startSelect.value)
    );
    this.positionSfenInput.disabled = !positionSpecified;
    this.game.startName = this.startSelect.value;
    this.game.automation = +this.automationSelect.value;
    this.game.flipped = this.game.automation === 1 ? 1 : 0;
    for (const side of sides) {
      this.getAutomationOption(side).text = sideInfos[side].char + this.game.getSideName(side);
    }
    this.game.level = +this.levelSelect.value;
    const timingName = this.timingNameSelect.value;
    this.game.timingName = timingName;
    this.mainTimeSelect.disabled = !timingName;
    this.extraTimeSelect.disabled = !timingName;
    this.game.mainTime = +this.mainTimeSelect.value;
    this.game.extraTime = +this.extraTimeSelect.value;
    this.shogiPanel.game = this.game;
    this.shogiPanel.step = this.game.startStep;
    this.shogiPanel.initClocks();
    this.shogiPanel.request();
  }

  getAutomationOption(side) {
    return this.automationSelect.options[side + 1];
  }
}
