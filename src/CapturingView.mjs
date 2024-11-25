import ProgressView from './ProgressView.mjs';
import ShogiPanel from './ShogiPanel.mjs';
import View from './View.mjs';
import { on, onLongPress } from './browser.mjs';
import {
  formatMoveText,
  formatSfen,
  getMoveTo,
  getPieceSide,
  makeMove,
  makePositionCommand,
  parseGameUsi,
  squareN,
} from './shogi.mjs';

export default class CapturingView extends View {
  constructor() {
    super(`
      <div class="CapturingView">
        <div class="TitleBar">
          <button class="CloseButton">閉じる</button>
          <div class="Center">こまどり将棋</div>
        </div>
        <canvas class="ShogiPanel"></canvas>
        <div class="ToolBar">
          <button class="ResetButton">やり直す</button>
          <button class="UndoButton">待った</button>
        </div>
        <div class="ToolBar">
          <button class="PrevButton">前問</button>
          <output class="CountOutput Center"></output>
          <button class="NextButton">次問</button>
        </div>
      </div>
    `);
    this.shogiPanel = new ShogiPanel(this.el.querySelector('.ShogiPanel'), this);
    this.prevButton = this.el.querySelector('.PrevButton');
    this.nextButton = this.el.querySelector('.NextButton');
    this.countOutput = this.el.querySelector('.CountOutput');

    on(this.el.querySelector('.CloseButton'), 'click', () => {
      this.hide();
    });

    onLongPress(this.prevButton, () => {
      if (this.canCapturingPrev()) {
        this.changeCapturing(this.capturingIndex - 1);
      }
    });

    onLongPress(this.nextButton, () => {
      if (this.canCapturingNext()) {
        this.changeCapturing(this.capturingIndex + 1);
      }
    });

    on(this.el.querySelector('.ResetButton'), 'click', () => {
      if (this.step.parent) {
        this.changeStep(this.game.startStep);
      }
    });

    on(this.el.querySelector('.UndoButton'), 'click', () => {
      if (this.step.parent) {
        this.changeStep(this.step.parent.parent);
      }
    });
  }

  onShow() {
    this.app.initAudio();
    this.shogiPanel.app = this.app;
    this.capturings = [
      '9/4+p4/4+p+p3/4+p4/4P4/9/9/9/9 b - 1',
      '3+p+p4/9/4+p4/9/4L4/9/9/9/9 b - 1',
      '4+p4/4+p+p3/3+p1+p3/9/4N4/9/9/9/9 b - 1',
      '9/9/5+p3/2+p+p+p+p3/3+pS4/9/9/9/9 b - 1',
      '9/9/9/+p+p+p+p+p+p+p+p+p/+p+p+p+pS+p+p+p+p/9/9/9/9 b - 1',
      '9/9/5+p3/2+p+p+p+p3/3+pG+p3/9/9/9/9 b - 1',
      '4+p4/4+p4/6+p2/9/4B2+p+p/9/2+p3+p2/9/9 b - 1',
      '9/7+p1/9/4+p3+p/4R2+p1/9/9/+p3+p2+p1/8+p b - 1',
      '9/9/4l4/4ll3/3lKp3/3pg4/9/9/9 b - 1',
      '4l4/9/3l5/4lp3/4SG3/3pK4/9/9/4L4 b - 1',
    ];
    this.changeCapturing(+this.app.settings.capturing?.capturingIndex || 0);
  }

  onPointerBefore() {
    return true;
  }

  async onMove(move) {
    this.app.playPieceSound();
    this.app.speakMoveText(formatMoveText(this.step.position, move, this.step.move));
    const step = this.step.appendMove(move).appendMove(0);
    this.changeStep(step);
    await this.turn();
    this.shogiPanel.nextMove = makeMove(getMoveTo(move), squareN);
    this.shogiPanel.nextToMap = step.fromToMap.get(this.shogiPanel.nextMove);
    this.shogiPanel.request();
  }

  changeCapturing(capturingIndex) {
    this.capturingIndex = Math.max(0, Math.min(capturingIndex, this.capturings.length - 1));
    this.prevButton.disabled = !this.canCapturingPrev();
    this.nextButton.disabled = !this.canCapturingNext();
    this.countOutput.textContent = this.capturingIndex + 1 + ' / ' + this.capturings.length;
    this.game = parseGameUsi(this.capturings[this.capturingIndex]);
    this.shogiPanel.game = this.game;
    this.app.settings.capturing = { capturingIndex: this.capturingIndex };
    this.app.saveSettings();
    this.changeStep(this.game.startStep);
    this.turn();
  }

  canCapturingPrev() {
    return this.capturingIndex > 0;
  }

  canCapturingNext() {
    return this.capturingIndex < this.capturings.length - 1;
  }

  changeStep(step) {
    this.step = step;
    this.shogiPanel.changeStep(this.step);
    this.shogiPanel.request();
  }

  async turn() {
    const targetStep = this.step;
    targetStep.gameUsi = makePositionCommand(formatSfen(targetStep.position));
    targetStep.fromToMap = await this.app.engine.getFromToMap(targetStep.gameUsi);
    for (const [from, toMap] of targetStep.fromToMap) {
      for (const to of toMap.keys()) {
        if (!targetStep.position.getPiece(to)) {
          toMap.delete(to);
          if (!toMap.size) {
            targetStep.fromToMap.delete(from);
          }
        }
      }
    }
    if (!targetStep.fromToMap.size) {
      let failed = false;
      for (let sq = 0; sq < squareN; sq++) {
        if (getPieceSide(targetStep.position.getPiece(sq))) {
          failed = true;
          break;
        }
      }
      await new ProgressView().show(this, ...(failed ? ['失敗', '#fcc6'] : ['成功', '#cfc6']), 1000);
    }
  }
}
