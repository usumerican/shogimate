import BrowseView from './BrowseView.mjs';
import ConfirmView from './ConfirmView.mjs';
import MenuView from './MenuView.mjs';
import ShogiPanel from './ShogiPanel.mjs';
import { on, parseHtml, setTextareaValue } from './browser.mjs';
import {
  formatGameUsiFromLastStep,
  formatPvMoveUsis,
  formatPvScoreValue,
  parseMoveUsi,
  parsePvInfoUsi,
  parsePvScore,
} from './shogi.mjs';

export default class MatchView {
  constructor(app) {
    this.app = app;
    this.el = parseHtml(`
      <div class="MatchView">
        <div class="TitleBar">
          <button class="CloseButton">閉じる</button>
          <div class="TitleOutput Center">対局</div>
          <button class="MenuButton">メニュー</button>
        </div>
        <canvas class="ShogiPanel"></canvas>
        <textarea class="HintOutput" readonly></textarea>
        <div class="ToolBar">
          <button class="UndoButton">待った</button>
          <button class="HintButton">ヒント</button>
          <button class="ResignButton">投了</button>
        </div>
      </div>
    `);
    this.titleOutput = this.el.querySelector('.TitleOutput');
    this.shogiPanel = new ShogiPanel(this.app, this.el.querySelector('.ShogiPanel'), this);
    this.hintOutput = this.el.querySelector('.HintOutput');

    on(this.el.querySelector('.CloseButton'), 'click', () => {
      this.hide();
    });

    on(this.el.querySelector('.MenuButton'), 'click', () => {
      new MenuView(this.app).show('メニュー', this.shogiPanel.createMenuItems());
    });

    on(this.el.querySelector('.UndoButton'), 'click', () => {
      if (this.step.parent) {
        this.step.appendEnd('待った');
        let step = this.step.parent;
        if (step.parent && this.isSideAuto(step)) {
          step = step.parent;
        }
        this.step = step;
        this.update();
        this.think();
      }
    });

    on(this.el.querySelector('.HintButton'), 'click', async () => {
      const targetStep = this.step;
      targetStep.hint = await this.analyze(targetStep, 1000);
      if (targetStep.hint) {
        targetStep.hint.text =
          '#ヒント[' +
          formatPvScoreValue(targetStep.hint.scoreValue) +
          '] ' +
          formatPvMoveUsis(targetStep, targetStep.hint.pv).join(' ');
      }
      this.update();
    });

    on(this.el.querySelector('.ResignButton'), 'click', async () => {
      if (await new ConfirmView(this.app).show('投了しますか?', ['いいえ', 'はい'])) {
        this.step = this.step.appendEnd('投了');
        this.doBrowse();
      }
    });
  }

  show(title, game) {
    this.title = this.titleOutput.textContent = title;
    this.game = this.shogiPanel.game = game;
    this.step = this.game.startStep;
    this.update();
    this.app.pushView(this);
    this.think();
  }

  hide() {
    this.app.popView(this);
  }

  onPointerBefore() {
    return !this.isSideAuto() && !this.step.endName;
  }

  onStepAfter(step) {
    this.app.playPieceSound();
    this.step = step;
    this.update();
    this.think();
  }

  update() {
    this.shogiPanel.changeStep(this.step);
    this.shogiPanel.bestMove = this.step.hint?.bestMove || 0;
    setTextareaValue(this.hintOutput, this.step.hint?.text || '');
    this.shogiPanel.request();
  }

  async think() {
    const targetStep = this.step;
    targetStep.gameUsi = formatGameUsiFromLastStep(targetStep);
    targetStep.fromToMap = await this.app.engine.getFromToMap(targetStep.gameUsi);
    if (!targetStep.fromToMap.size) {
      await this.endGame(targetStep, '詰み');
      return;
    }
    targetStep.analysis = await this.analyze(targetStep, 500);
    if (this.isSideAuto()) {
      const moveUsi = (
        await Promise.all([
          this.app.engine.bestmove(targetStep.gameUsi, 100, this.game.level),
          new Promise((resolve) => setTimeout(resolve, 100)),
        ])
      )[0];
      if (moveUsi) {
        const step = targetStep.appendMoveUsi(moveUsi);
        if (step.endName) {
          await this.endGame(targetStep, step.endName);
          return;
        }
        this.onStepAfter(step);
      }
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

  isSideAuto(step = this.step) {
    return (1 << step.position.sideToMove) & this.game.auto;
  }

  async endGame(step, endName) {
    await new ConfirmView(this.app).show(`${this.game.sideNames[step.position.sideToMove]}の${endName}です。`, ['OK']);
    this.step = step.appendEnd(endName);
    this.doBrowse();
  }

  doBrowse() {
    this.hide();
    new BrowseView(this.app).show(this.title, this.game, this.step);
  }
}
