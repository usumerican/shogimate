/* eslint-env browser */

import BrowseView from './BrowseView.mjs';
import MenuView from './MenuView.mjs';
import ProgressView from './ProgressView.mjs';
import ResearchView from './ResearchView.mjs';
import ShogiPanel from './ShogiPanel.mjs';
import View from './View.mjs';
import { on, onLongPress, shuffle } from './browser.mjs';
import {
  Step,
  parseMoveUsi,
  usiEndNameMap,
  parseGameUsi,
  formatGameUsiFromLastStep,
  Game,
  Position,
  sides,
  formatMoveText,
} from './shogi.mjs';

export default class QuestionView extends View {
  constructor() {
    super(`
      <div class="QuestionView">
        <div class="TitleBar">
          <button class="CloseButton">閉じる</button>
          <div class="TitleOutput Center"></div>
          <button class="MenuButton">メニュー</button>
        </div>
        <canvas class="ShogiPanel"></canvas>
        <div class="ToolBar">
          <button class="ResetButton">やり直す</button>
          <button class="UndoButton">待った</button>
          <button class="ResearchButton">検討</button>
          <button class="AnswerButton">解答例</button>
        </div>
        <div class="ToolBar">
          <button class="RecordPrevButton">前問</button>
          <select class="RecordSelect"></select>
          <button class="CollectButton">コレクト</button>
          <button class="RecordNextButton">次問</button>
        </div>
      </div>
    `);
    this.titleOutput = this.el.querySelector('.TitleOutput');
    this.recordSelect = this.el.querySelector('.RecordSelect');
    this.recordPrevButton = this.el.querySelector('.RecordPrevButton');
    this.recordNextButton = this.el.querySelector('.RecordNextButton');
    this.collectButton = this.el.querySelector('.CollectButton');
    this.shogiPanel = new ShogiPanel(this.el.querySelector('.ShogiPanel'), this);
    this.resetButton = this.el.querySelector('.ResetButton');
    this.undoButton = this.el.querySelector('.UndoButton');
    this.answerButton = this.el.querySelector('.AnswerButton');

    on(this.el.querySelector('.CloseButton'), 'click', () => {
      this.hide(this.changed);
    });

    on(this.el.querySelector('.MenuButton'), 'click', async () => {
      await new MenuView().show(this, 'メニュー', this.shogiPanel.createMenuItems());
    });

    on(this.recordSelect, 'change', () => {
      this.changeRecord(+this.recordSelect.value);
    });

    onLongPress(this.recordPrevButton, () => {
      this.doRecordPrev();
    });

    onLongPress(this.recordNextButton, () => {
      this.doRecordNext();
    });

    on(this.collectButton, 'click', () => {
      const recordIndex = this.recordIndices[this.recordOrder];
      const record = this.records[recordIndex];
      const marked = this.app.collection.has(record);
      if (marked) {
        this.app.collection.delete(record);
      } else {
        this.app.collection.add(record);
      }
      this.app.saveCollection();
      this.recordSelect.selectedOptions[0].text = this.formatRecordOption(recordIndex, !marked);
    });

    on(this.resetButton, 'click', () => {
      this.doReset();
    });

    on(this.undoButton, 'click', () => {
      this.doUndo();
    });

    on(this.answerButton, 'click', async () => {
      if (this.limit) {
        await new BrowseView().show(this, '解答例', this.answerGame);
      }
    });

    on(this.el.querySelector('.ResearchButton'), 'click', async () => {
      await new ResearchView().show(this, this.game, this.step);
    });
  }

  onShow(records, startRecordOrder, title, bookName, volumeName) {
    this.shogiPanel.app = this.app;
    this.title = title;
    this.bookName = bookName;
    this.volumeName = volumeName;
    this.records = records;
    const recordCount = records.length;
    this.startRecordOrder = Math.min(startRecordOrder, recordCount - 1);
    this.recordOrder = this.startRecordOrder < 0 ? 0 : this.startRecordOrder;
    this.recordIndices = [...Array(recordCount).keys()];
    if (this.startRecordOrder < 0) {
      shuffle(this.recordIndices);
    }
    const options = [];
    for (let i = 0; i < this.recordIndices.length; i++) {
      const recordIndex = this.recordIndices[i];
      options.push(
        new Option(this.formatRecordOption(recordIndex, this.app.collection.has(this.records[recordIndex])), i)
      );
    }
    if (
      this.bookName &&
      this.volumeName &&
      this.app.getState(['bs', this.bookName, 'vs', this.volumeName, 'rc']) !== recordCount
    ) {
      this.app.setState(['bs', this.bookName, 'vs', this.volumeName, 'rc'], recordCount);
      this.app.setState(['bs', this.bookName, 'vs', this.volumeName, 'ro'], this.recordOrder);
      this.app.saveState();
      this.changed = true;
    }
    this.recordSelect.replaceChildren(...options);
    this.app.initAudio();
    this.updateRecord();
  }

  formatRecordOption(recordIndex, marked) {
    return `第${recordIndex + 1}問${marked ? '❤️' : ''}`;
  }

  onHide() {
    for (const side of sides) {
      this.shogiPanel.stopClock(side);
    }
  }

  canRecordPrev() {
    return this.recordOrder > 0;
  }

  doRecordPrev() {
    if (this.canRecordPrev()) {
      this.changeRecord(this.recordOrder - 1);
    }
  }

  canRecordNext() {
    return this.recordOrder < this.recordIndices.length - 1;
  }

  doRecordNext() {
    if (this.canRecordNext()) {
      this.changeRecord(this.recordOrder + 1);
    }
  }

  changeRecord(recordOrder) {
    if (this.bookName && this.volumeName && this.startRecordOrder >= 0) {
      this.app.setState(['bs', this.bookName, 'vs', this.volumeName, 'ro'], recordOrder);
      this.app.saveState();
      this.changed = true;
    }
    this.recordOrder = recordOrder;
    this.updateRecord();
  }

  updateRecord() {
    this.titleOutput.textContent = `${this.title} (${this.recordOrder + 1}/${this.records.length})`;
    this.recordSelect.value = this.recordOrder;
    this.recordPrevButton.disabled = !this.canRecordPrev();
    this.recordNextButton.disabled = !this.canRecordNext();
    const [gameUsi, rate] = this.records[this.recordIndices[this.recordOrder]].split('\t');
    this.answerGame = parseGameUsi(gameUsi);
    this.startSide = this.answerGame.startStep.position.sideToMove;
    this.answerGame.flipped = this.startSide;
    this.answerGame.players[this.startSide].name = '攻方';
    this.answerGame.players[this.startSide ^ 1].name = '受方';
    this.limit = 0;
    for (let st = this.answerGame.startStep.children[0]; st && st.move; st = st.children[0]) {
      this.limit++;
    }
    this.answerButton.disabled = !this.limit;
    this.rate = rate;
    this.collectButton.disabled = this.rate;
    this.game = new Game(this.answerGame);
    const position = new Position(this.answerGame.startStep.position);
    position.number = 0;
    this.startStep = new Step({ position });
    this.game.startStep = this.startStep;
    this.shogiPanel.game = this.game;
    this.shogiPanel.initClocks();
    this.changeStep(this.startStep);
    this.think();
  }

  canReset() {
    return !this.thinking && this.step.parent;
  }

  doReset() {
    if (this.canReset()) {
      this.appendEnd('中断');
      this.changeStep(this.startStep);
      this.think();
    }
  }

  doUndo() {
    if (this.canReset()) {
      this.appendEnd('待った');
      let st = this.step.endName ? this.step.parent?.parent : this.step.parent;
      for (; st; st = st.parent) {
        if (st.position.sideToMove === this.startStep.position.sideToMove) {
          break;
        }
      }
      this.changeStep(st || this.startStep);
      this.think();
    }
  }

  onPointerBefore() {
    return !this.thinking && this.step.position.sideToMove === this.startSide && !this.isExceeded();
  }

  async onMove(move) {
    this.app.playPieceSound();
    this.app.speakMoveText(formatMoveText(this.step.position, move, this.step.move));
    this.changeStep(this.step.appendMove(move, this.shogiPanel.stopClock(this.step.position.sideToMove)));
    this.think();
  }

  async think() {
    this.thinking = true;
    try {
      this.shogiPanel.startClock(this.step.position.sideToMove);
      const manual = this.step.position.sideToMove === this.startSide;
      if (manual && this.isExceeded()) {
        await this.endGame('不詰');
        return;
      }
      this.step.gameUsi = formatGameUsiFromLastStep(this.step);
      this.step.fromToMap = await this.app.engine.getFromToMap(this.step.gameUsi, manual && !this.rate);
      if (!this.step.fromToMap.size) {
        await this.endGame('詰み', !manual);
        return;
      }
      if (manual) {
        return;
      }
      const time = 500;
      const moveUsi = (
        await Promise.all([
          this.app.engine.bestmove(this.step.gameUsi, time),
          new Promise((resolve) => setTimeout(resolve, time)),
        ])
      )[0];
      const move = parseMoveUsi(moveUsi);
      if (move) {
        this.onMove(move);
      } else {
        await this.endGame(usiEndNameMap.get(moveUsi) || moveUsi);
      }
    } finally {
      this.thinking = false;
    }
  }

  async endGame(endName, success) {
    this.changeStep(this.appendEnd(endName));
    await new ProgressView().show(this, ...(success ? ['成功', '#cfc6'] : ['失敗', '#fcc6']), 1000);
  }

  appendEnd(endName) {
    return this.step.appendEnd(endName, this.shogiPanel.stopClock(this.step.position.sideToMove));
  }

  changeStep(step) {
    this.step = step;
    this.thinking = false;
    this.resetButton.disabled = !this.canReset();
    this.undoButton.disabled = !this.canReset();
    this.shogiPanel.changeStep(this.step);
    this.shogiPanel.request();
  }

  isExceeded() {
    return (
      !this.rate &&
      this.startRecordOrder >= 0 &&
      this.limit &&
      this.step.position.number - this.startStep.position.number > this.limit
    );
  }
}
