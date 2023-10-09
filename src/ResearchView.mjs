/* eslint-env browser */

import BrowseView from './BrowseView.mjs';
import ProgressView from './ProgressView.mjs';
import ShogiPanel from './ShogiPanel.mjs';
import { on, parseHtml, setSelectValue } from './browser.mjs';
import { Step, formatGameUsiFromLastStep, formatStep, parseInfoUsi, parseMoveUsi } from './shogi.mjs';

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
        <table class="InfoTable">
          <tbody class="InfoTbody"></tbody>
        </table>
        <div class="ToolBar">
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
          <button class="StartButton">再検討</button>
        </div>
      </div>
    `);
    this.shogiPanel = new ShogiPanel(this.el.querySelector('.ShogiPanel'));
    this.infoTable = this.el.querySelector('.InfoTable');
    this.infoTbody = this.el.querySelector('.InfoTbody');
    this.timeSelect = this.el.querySelector('.TimeSelect');
    this.mpvSelect = this.el.querySelector('.MpvSelect');

    on(this.el.querySelector('.CloseButton'), 'click', () => {
      this.hide();
    });

    on(this.el.querySelector('.StartButton'), 'click', () => {
      const time = +this.timeSelect.value;
      const mpv = +this.mpvSelect.value;
      this.app.setState(['research', 'time'], time);
      this.app.setState(['research', 'mpv'], mpv);
      this.app.saveState();
      this.doResearch(time, mpv);
    });
  }

  show(parentPanel) {
    this.step = new Step(parentPanel.step);
    this.shogiPanel.step = this.step;
    this.shogiPanel.inversion = parentPanel.inversion;
    this.shogiPanel.sideNames = parentPanel.sideNames;
    this.shogiPanel.pieceStyle = parentPanel.pieceStyle;
    this.shogiPanel.pieceTitleSet = parentPanel.pieceTitleSet;
    setSelectValue(this.timeSelect, this.app.getState(['research', 'time']));
    setSelectValue(this.mpvSelect, this.app.getState(['research', 'mpv']));
    this.app.pushView(this);
    this.doResearch();
  }

  hide() {
    this.app.popView();
  }

  async doResearch(time = 1000, mpv = 1) {
    const progressView = new ProgressView(this.app);
    progressView.show();
    this.shogiPanel.bestMove = 0;
    this.shogiPanel.request();
    this.infoTbody.innerHTML = '';
    const headerRow = parseHtml(`
    <tr class="InfoRow">
      <th>順位</th>
      <th>評価値</th>
      <th>深さ</th>
      <th class="InfoOutput"></th>
    </tr>
  `);
    const infoOutput = headerRow.querySelector('.InfoOutput');
    this.infoRows = [headerRow];
    for (let i = 0; i < mpv; i++) {
      const row = parseHtml(`
        <tr class="InfoRow">
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
        new BrowseView(this.app).show('読み筋', this.shogiPanel, this.step, row.moveUsis, 1);
      });
      this.infoRows.push(row);
    }
    this.infoTbody.replaceChildren(...this.infoRows);
    await this.app.engine.research(formatGameUsiFromLastStep(this.step), time, mpv, (line) => {
      console.log(line);
      const infoMap = parseInfoUsi(line);
      if (infoMap) {
        infoOutput.textContent =
          (infoMap.get('time')?.[0] / 1000).toFixed(1) + '秒 ' + (+infoMap.get('nodes')?.[0]).toLocaleString() + '面 ';
        const row = this.infoRows[infoMap.get('multipv')?.[0] || 1];
        row.scoreOutput.textContent = infoMap.get('score')?.join(' ');
        row.depthOutput.textContent = infoMap.get('depth')?.[0] + '/' + infoMap.get('seldepth')?.[0];
        row.moveUsis = infoMap.get('pv') || [];
        const names = [];
        let st = new Step(this.step);
        for (const moveUsi of row.moveUsis) {
          st = st.appendMoveUsi(moveUsi);
          names.push(formatStep(st));
        }
        row.pvOutput.textContent = row.pvOutput.title = names.join(' ');
      }
    });
    const bestMoveUsi = this.infoRows[1]?.moveUsis[0];
    if (bestMoveUsi) {
      this.shogiPanel.bestMove = parseMoveUsi(bestMoveUsi);
      this.shogiPanel.request();
    }
    progressView.hide();
  }
}
