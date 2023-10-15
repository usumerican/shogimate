/* eslint-env browser */

import BrowseView from './BrowseView.mjs';
import ProgressView from './ProgressView.mjs';
import ShogiPanel from './ShogiPanel.mjs';
import { on, parseHtml, setSelectValue } from './browser.mjs';
import { Step, formatGameUsiFromLastStep, formatStep, parsePvInfoUsi, parseMoveUsi } from './shogi.mjs';

export default class ResearchView {
  constructor(app) {
    this.app = app;
    this.el = parseHtml(`
      <div class="ResearchView">
        <div class="TitleBar">
          <button class="CloseButton">閉じる</button>
          <div class="Center">検討</div>
        </div>
        <canvas class="ShogiPanel"></canvas>
        <div class="ToolBar">
          <button class="StepPrevButton">前手</button>
          <select class="MpvSelect">
            <option value="1">1位のみ</option>
            <option value="2">2位まで</option>
            <option value="3">3位まで</option>
            <option value="4">4位まで</option>
            <option value="5">5位まで</option>
          </select>
          <select class="TimeSelect">
            <option value="1000">1秒</option>
            <option value="2000">2秒</option>
            <option value="3000">3秒</option>
            <option value="4000">4秒</option>
            <option value="5000">5秒</option>
          </select>
          <button class="ResearchButton">再検討</button>
        </div>
        <table class="PvInfoTable">
          <tbody class="PvInfoTbody"></tbody>
        </table>
      </div>
    `);
    this.shogiPanel = new ShogiPanel(this.app, this.el.querySelector('.ShogiPanel'), this);
    this.pvInfoTable = this.el.querySelector('.PvInfoTable');
    this.pvInfoTbody = this.el.querySelector('.PvInfoTbody');
    this.timeSelect = this.el.querySelector('.TimeSelect');
    this.mpvSelect = this.el.querySelector('.MpvSelect');

    on(this.el.querySelector('.CloseButton'), 'click', () => {
      this.hide();
    });

    on(this.el.querySelector('.StepPrevButton'), 'click', () => {
      if (this.step.parent) {
        this.changeStep(this.step.parent);
      }
    });

    on(this.el.querySelector('.ResearchButton'), 'click', () => {
      const time = +this.timeSelect.value;
      const mpv = +this.mpvSelect.value;
      this.app.setState(['research', 'time'], time);
      this.app.setState(['research', 'mpv'], mpv);
      this.app.saveState();
      this.doResearch(time, mpv);
    });
  }

  async show(parentPanel) {
    this.shogiPanel.inversion = parentPanel.inversion;
    this.shogiPanel.sideNames = parentPanel.sideNames;
    setSelectValue(this.timeSelect, this.app.getState(['research', 'time']));
    setSelectValue(this.mpvSelect, this.app.getState(['research', 'mpv']));
    this.changeStep(new Step(parentPanel.step));
    this.app.pushView(this);
    await this.doResearch();
  }

  hide() {
    this.app.popView();
  }

  onPointerBefore() {
    return !this.step.endName;
  }

  async onStepAfter(step) {
    this.changeStep(step);
    await this.doResearch();
  }

  async doResearch(time = 1000, mpv = 1) {
    const progressView = new ProgressView(this.app);
    progressView.show();
    const step = this.step;
    step.data = {};
    const headerRow = parseHtml(`
      <tr class="PvInfoRow">
        <th>位</th>
        <th>評価値</th>
        <th>深さ</th>
        <th class="SummaryOutput"></th>
      </tr>
    `);
    const summaryOutput = headerRow.querySelector('.SummaryOutput');
    const rows = (step.data.pvInfoRows = [headerRow]);
    for (let i = 0; i < mpv; i++) {
      const row = parseHtml(`
        <tr class="PvInfoRow">
          <td>${i + 1}</td>
          <td class="ScoreOutput"></td>
          <td class="DepthOutput"></td>
          <td class="PvOutput"></td>
        </tr>
      `);
      row.scoreOutput = row.querySelector('.ScoreOutput');
      row.depthOutput = row.querySelector('.DepthOutput');
      row.pvOutput = row.querySelector('.PvOutput');
      on(row, 'click', () => {
        new BrowseView(this.app).show('読み筋', this.shogiPanel, step, row.moveUsis, 1);
      });
      rows.push(row);
    }
    await this.app.engine.research(formatGameUsiFromLastStep(step), time, mpv, (line) => {
      console.log(line);
      const pvInfo = parsePvInfoUsi(line);
      if (pvInfo) {
        summaryOutput.textContent =
          (pvInfo.get('time')?.[0] / 1000).toFixed(1) + '秒 ' + (+pvInfo.get('nodes')?.[0]).toLocaleString() + '面 ';
        const row = rows[pvInfo.get('multipv')?.[0] || 1];
        row.scoreOutput.textContent = pvInfo.get('score')?.join(' ');
        row.depthOutput.textContent = pvInfo.get('depth')?.[0] + '/' + pvInfo.get('seldepth')?.[0];
        row.moveUsis = pvInfo.get('pv') || [];
        const names = [];
        let st = new Step(step);
        for (const moveUsi of row.moveUsis) {
          st = st.appendMoveUsi(moveUsi);
          names.push(formatStep(st));
        }
        row.pvOutput.textContent = row.pvOutput.title = names.join(' ');
      }
    });
    const bestMoveUsi = rows[1]?.moveUsis[0];
    if (bestMoveUsi) {
      step.data.bestMove = parseMoveUsi(bestMoveUsi);
    }

    this.updateStep();
    progressView.hide();
  }

  changeStep(step) {
    this.step = step;
    this.shogiPanel.changeStep(this.step);
    this.updateStep();
  }

  updateStep() {
    if (this.step.data?.pvInfoRows) {
      this.pvInfoTbody.replaceChildren(...this.step.data.pvInfoRows);
      this.shogiPanel.bestMove = this.step.data.bestMove;
    } else {
      this.pvInfoTbody.replaceChildren();
      this.shogiPanel.bestMove = 0;
    }
    this.shogiPanel.request();
  }
}
