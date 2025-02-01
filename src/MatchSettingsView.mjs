import { randomInt } from 'jshuffle';
import ConfirmView from './ConfirmView.mjs';
import MatchView from './MatchView.mjs';
import PositionView from './PositionView.mjs';
import ShogiPanel from './ShogiPanel.mjs';
import View from './View.mjs';
import { on, setSelectValue } from './browser.mjs';
import {
  formatExtraTime,
  formatMainTime,
  formatSfen,
  parseGameUsi,
  sideInfos,
  sides,
  startInfos,
  startNameSfenMap,
  timingInfos,
} from './shogi.mjs';

export default class MatchSettingsView extends View {
  constructor() {
    super(`
      <div class="MatchSettingsView">
        <div class="Center">対局設定</div>
        <canvas class="ShogiPanel"></canvas>
        <div class="ToolBar">
          <label class="LabelCenter"><input type="checkbox" class="PositionSpecifiedCheckbox" />指定局面</label>
          <input class="PositionSfenInput" placeholder="指定局面SFEN" />
          <button class="PositionButton">局面編集</button>
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
          <button class="CloseButton">閉じる</button>
          <button class="StartButton">開始</button>
        </div>
      </div>
    `);
    this.shogiPanel = new ShogiPanel(this.el.querySelector('.ShogiPanel'));
    this.startSelect = this.el.querySelector('.StartSelect');
    this.startSelect.replaceChildren(...startInfos.map((info) => new Option(info.name)));
    this.automationSelect = this.el.querySelector('.AutomationSelect');
    this.levelSelect = this.el.querySelector('.LevelSelect');
    this.levelSelect.replaceChildren(...[...Array(21).keys()].map((i) => new Option(`レベル ${i}`, i)));
    this.positionSpecifiedCheckbox = this.el.querySelector('.PositionSpecifiedCheckbox');
    this.positionSfenInput = this.el.querySelector('.PositionSfenInput');
    this.timingNameSelect = this.el.querySelector('.TimingNameSelect');
    this.timingNameSelect.replaceChildren(...timingInfos.map((info) => new Option(info.title, info.name)));
    this.mainTimeSelect = this.el.querySelector('.MainTimeSelect');
    this.mainTimeSelect.replaceChildren(
      ...[
        0, 10_000, 20_000, 30_000, 40_000, 50_000, 60_000, 120_000, 180_000, 240_000, 300_000, 360_000, 420_000,
        480_000, 540_000, 600_000, 900_000, 1200_000, 1500_000, 1800_000, 2100_000, 2400_000, 2700_000, 3000_000,
        3300_000, 3600_000,
      ].map((time) => new Option(formatMainTime(time), time)),
    );
    this.extraTimeSelect = this.el.querySelector('.ExtraTimeSelect');
    this.extraTimeSelect.replaceChildren(
      ...[
        0, 1_000, 2_000, 3_000, 4_000, 5_000, 6_000, 7_000, 8_000, 9_000, 10_000, 15_000, 20_000, 25_000, 30_000,
        35_000, 40_000, 45_000, 50_000, 55_000, 60_000,
      ].map((time) => new Option(formatExtraTime(time), time)),
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

    on(this.el.querySelector('.PositionButton'), 'click', async () => {
      const step = await new PositionView().show(this, this.game.startStep);
      if (step) {
        this.positionSfenInput.value = formatSfen(step.position);
        this.positionSpecifiedCheckbox.checked = true;
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
        const side = randomInt(2);
        if (
          !(await new ConfirmView().show(this, `あなたは${this.getAutomationOption(side).text}です。`, [
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
      await new MatchView().show(this.parent, this.game);
    });
  }

  onShow({ startName, automation, level, positionSpecified, positionSfen } = {}, temporary) {
    this.shogiPanel.app = this.app;
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
  }

  update() {
    const positionSpecified = this.positionSpecifiedCheckbox.checked;
    this.positionSfenInput.disabled = !positionSpecified;
    this.game = null;
    if (positionSpecified) {
      this.game = parseGameUsi(this.positionSfenInput.value);
    }
    if (!this.game) {
      this.game = parseGameUsi(startNameSfenMap.get(this.startSelect.value));
    }
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
