import BrowseView from './BrowseView.mjs';
import MenuView from './MenuView.mjs';
import ProgressView from './ProgressView.mjs';
import ShogiPanel from './ShogiPanel.mjs';
import View from './View.mjs';
import { on, parseHtml, setSelectValue } from './browser.mjs';
import {
  Step,
  formatGameUsiFromLastStep,
  parsePvInfoUsi,
  parseMoveUsi,
  formatPvMoveUsis,
  Game,
  parsePvScore,
  formatPvScoreValue,
  formatMoveText,
} from './shogi.mjs';

export default class ResearchView extends View {
  constructor() {
    super(`
      <div class="ResearchView">
        <div class="TitleBar">
          <button class="CloseButton">閉じる</button>
          <div class="Center">検討</div>
          <button class="MenuButton">メニュー</button>
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
    this.shogiPanel = new ShogiPanel(this.el.querySelector('.ShogiPanel'), this);
    this.pvInfoTable = this.el.querySelector('.PvInfoTable');
    this.pvInfoTbody = this.el.querySelector('.PvInfoTbody');
    this.timeSelect = this.el.querySelector('.TimeSelect');
    this.mpvSelect = this.el.querySelector('.MpvSelect');

    on(this.el.querySelector('.CloseButton'), 'click', () => {
      this.hide();
    });

    on(this.el.querySelector('.MenuButton'), 'click', async () => {
      await new MenuView().show(this, 'メニュー', this.shogiPanel.createMenuItems());
    });

    on(this.el.querySelector('.StepPrevButton'), 'click', () => {
      if (this.step.parent) {
        this.changeStep(this.step.parent);
      }
    });

    on(this.el.querySelector('.ResearchButton'), 'click', () => {
      const time = +this.timeSelect.value;
      const mpv = +this.mpvSelect.value;
      this.app.settings.research = { time, mpv };
      this.app.saveSettings();
      this.doResearch(time, mpv);
    });
  }

  onShow(game, step) {
    this.shogiPanel.app = this.app;
    this.game = this.shogiPanel.game = game;
    setSelectValue(this.timeSelect, this.app.settings.research?.time);
    setSelectValue(this.mpvSelect, this.app.settings.research?.mpv);
    this.changeStep(new Step(step.endName && step.parent ? step.parent : step));
    this.app.initAudio();
    this.doResearch();
  }

  onPointerBefore() {
    return !this.step.endName;
  }

  async onMove(move) {
    this.app.playPieceSound();
    this.app.speakMoveText(formatMoveText(this.step.position, move, this.step.move));
    this.changeStep(this.step.appendMove(move));
    await this.doResearch();
  }

  async doResearch(time = 1000, mpv = 1) {
    const progressView = new ProgressView();
    progressView.show(this, '考え中', '#fff6');
    try {
      const targetStep = this.step;
      targetStep.gameUsi = formatGameUsiFromLastStep(targetStep);
      targetStep.fromToMap = await this.app.engine.getFromToMap(targetStep.gameUsi);
      targetStep.data = {};
      const headerRow = parseHtml(`
        <tr class="PvInfoRow">
          <th>位</th>
          <th>評価値</th>
          <th>深さ</th>
          <th class="SummaryOutput"></th>
        </tr>
      `);
      const summaryOutput = headerRow.querySelector('.SummaryOutput');
      const rows = (targetStep.data.pvInfoRows = [headerRow]);
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
        on(row, 'click', async () => {
          const game = new Game(this.game);
          let st = (game.startStep = new Step({ position: targetStep.position }));
          for (const moveUsi of row.moveUsis) {
            st = st.appendMoveUsi(moveUsi);
          }
          await new BrowseView().show(this, '読み筋', game);
        });
        rows.push(row);
      }
      await this.app.engine.research(targetStep.gameUsi, time, mpv, (line) => {
        console.log(line);
        const pvInfo = parsePvInfoUsi(line);
        if (pvInfo) {
          summaryOutput.textContent =
            (pvInfo.time?.[0] / 1000).toFixed(1) + '秒 ' + (+pvInfo.nodes?.[0]).toLocaleString() + '面 ';
          const row = rows[pvInfo.multipv?.[0] || 1];
          row.scoreOutput.textContent = formatPvScoreValue(parsePvScore(pvInfo.score, targetStep.position.sideToMove));
          row.depthOutput.textContent = pvInfo.depth?.[0] + '/' + pvInfo.seldepth?.[0];
          row.moveUsis = pvInfo.pv || [];
          row.pvOutput.textContent = row.pvOutput.title = formatPvMoveUsis(targetStep, row.moveUsis).join(' ');
        }
      });
      const bestMoveUsi = rows[1]?.moveUsis[0];
      if (bestMoveUsi) {
        targetStep.data.bestMove = parseMoveUsi(bestMoveUsi);
      }
      this.updatePvInfo();
    } finally {
      progressView.hide();
    }
  }

  changeStep(step) {
    this.step = step;
    this.shogiPanel.changeStep(this.step);
    this.updatePvInfo();
  }

  updatePvInfo() {
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
