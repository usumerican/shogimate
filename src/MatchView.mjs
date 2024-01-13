import BrowseView from './BrowseView.mjs';
import ConfirmView from './ConfirmView.mjs';
import MenuView from './MenuView.mjs';
import ProgressView from './ProgressView.mjs';
import ResumeView from './ResumeView.mjs';
import ShogiPanel from './ShogiPanel.mjs';
import View from './View.mjs';
import { on, setTextareaValue } from './browser.mjs';
import {
  formatGameUsiFromLastStep,
  formatMoveText,
  formatPvMoveUsis,
  formatPvScoreValue,
  parseMoveUsi,
  parsePvInfoUsi,
  parsePvScore,
  sideInfos,
  sides,
  usiEndNameMap,
} from './shogi.mjs';

export default class MatchView extends View {
  constructor() {
    super(`
      <div class="MatchView">
        <div class="TitleBar">
          <button class="CloseButton">閉じる</button>
          <div class="TitleOutput Center">対局</div>
          <button class="MenuButton">メニュー</button>
        </div>
        <canvas class="ShogiPanel"></canvas>
        <textarea class="HintOutput" readonly></textarea>
        <div class="ToolBar">
          <label class="LabelCenter"><input type="checkbox" class="AdjournCheckbox" />封じ手</label>
          <button class="UndoButton">待った</button>
          <button class="HintButton">ヒント</button>
          <button class="ResignButton">投了</button>
        </div>
      </div>
    `);
    this.titleOutput = this.el.querySelector('.TitleOutput');
    this.shogiPanel = new ShogiPanel(this.el.querySelector('.ShogiPanel'), this);
    this.hintOutput = this.el.querySelector('.HintOutput');
    this.adjournCheckbox = this.el.querySelector('.AdjournCheckbox');

    on(this.el.querySelector('.CloseButton'), 'click', () => {
      this.hide();
    });

    on(this.el.querySelector('.MenuButton'), 'click', async () => {
      await new MenuView().show(this, 'メニュー', this.shogiPanel.createMenuItems());
    });

    on(this.el.querySelector('.UndoButton'), 'click', () => {
      if (!this.thinking) {
        const targetStep = this.step;
        if (targetStep.parent) {
          this.appendEnd(targetStep, '待った');
          let step = targetStep.parent;
          if (step.parent && this.isAutomatic(step)) {
            step = step.parent;
          }
          this.changeStep(step);
          this.think();
        }
      }
    });

    on(this.el.querySelector('.HintButton'), 'click', async () => {
      const progressView = new ProgressView();
      progressView.show(this, '考え中', '#fff6');
      try {
        const targetStep = this.step;
        targetStep.hint = await this.analyze(targetStep, 1000);
        if (targetStep.hint) {
          targetStep.hint.text =
            '#ヒント[' +
            formatPvScoreValue(targetStep.hint.scoreValue) +
            '] ' +
            formatPvMoveUsis(targetStep, targetStep.hint.pv).join(' ');
        }
        this.updateHint();
      } finally {
        progressView.hide();
      }
    });

    on(this.el.querySelector('.ResignButton'), 'click', async () => {
      if (!this.thinking) {
        const targetStep = this.step;
        if (await new ConfirmView().show(this, '投了しますか?', ['いいえ', 'はい'])) {
          this.changeStep(this.appendEnd(targetStep, '投了'));
          await this.doBrowse();
        }
      }
    });
  }

  onShow(title, game, lastStep = game.startStep) {
    this.shogiPanel.app = this.app;
    this.title = this.titleOutput.textContent = title;
    this.game = this.shogiPanel.game = game;
    if (lastStep === this.game.startStep) {
      this.shogiPanel.initClocks();
    } else {
      for (const side of sides) {
        this.shogiPanel.clockTimes[side] = this.game.players[side].restTime;
      }
    }
    this.changeStep(lastStep);
    this.app.initAudio();
    this.think();
  }

  onHide() {
    for (const side of sides) {
      this.shogiPanel.stopClock(side);
    }
  }

  onPointerBefore() {
    return !this.thinking && !this.isAutomatic() && !this.step.endName;
  }

  async onMove(move) {
    if (!this.adjournCheckbox.checked) {
      this.app.playPieceSound();
      this.app.speakMoveText(formatMoveText(this.step.position, move, this.step.move));
    }
    this.changeStep(this.step.appendMove(move, this.shogiPanel.stopClock(this.step.position.sideToMove)));
    if (this.adjournCheckbox.checked) {
      this.app.settings.adjournedGame = this.game.toObject();
      this.app.saveSettings();
      await new ResumeView().show(this);
      this.hide();
    } else {
      await this.think();
    }
  }

  async onExpired() {
    await this.endGame(this.step, '切れ負け');
  }

  changeStep(step) {
    this.step = step;
    this.shogiPanel.changeStep(this.step);
    this.updateHint();
  }

  updateHint() {
    this.shogiPanel.bestMove = this.step.hint?.bestMove || 0;
    setTextareaValue(this.hintOutput, this.step.hint?.text || '');
    this.shogiPanel.request();
  }

  async think() {
    this.thinking = true;
    try {
      const targetStep = this.step;
      this.shogiPanel.startClock(targetStep.position.sideToMove);
      targetStep.gameUsi = formatGameUsiFromLastStep(targetStep);
      targetStep.fromToMap = await this.app.engine.getFromToMap(targetStep.gameUsi);
      if (!targetStep.fromToMap.size) {
        await this.endGame(targetStep, '詰み');
        return;
      }
      targetStep.analysis = await this.analyze(targetStep, 500);
      if (this.isAutomatic()) {
        const moveUsi = (
          await Promise.all([
            this.app.engine.bestmove(targetStep.gameUsi, 100, this.game.level),
            new Promise((resolve) => setTimeout(resolve, 100)),
          ])
        )[0];
        if (moveUsi) {
          const move = parseMoveUsi(moveUsi);
          if (move) {
            this.onMove(move);
          } else {
            await this.endGame(targetStep, usiEndNameMap.get(moveUsi) || moveUsi);
          }
        }
      }
    } finally {
      this.thinking = false;
    }
  }

  async analyze(targetStep, time) {
    let pvInfoUsi;
    await this.app.engine.research(targetStep.gameUsi, time, 1, (line) => {
      pvInfoUsi = line;
    });
    const pvInfo = parsePvInfoUsi(pvInfoUsi);
    pvInfo.bestMove = parseMoveUsi(pvInfo.pv[0]);
    pvInfo.scoreValue = parsePvScore(pvInfo.score, targetStep.position.sideToMove);
    return pvInfo;
  }

  isAutomatic(step = this.step) {
    return this.game.isSideAutomatic(step.position.sideToMove);
  }

  async endGame(step, endName) {
    this.changeStep(this.appendEnd(step, endName));
    await new ConfirmView().show(
      this,
      `${sideInfos[step.position.sideToMove].char}${this.game.getSideName(step.position.sideToMove)}の${endName}です。`,
      ['OK']
    );
    await this.doBrowse();
  }

  appendEnd(step, endName) {
    return step.appendEnd(endName, this.shogiPanel.stopClock(step.position.sideToMove));
  }

  async doBrowse() {
    await new BrowseView().show(this, this.title, this.game, this.step, true);
    this.hide();
  }
}
