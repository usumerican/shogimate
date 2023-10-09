/* eslint-env browser */

import BrowseView from './BrowseView.mjs';
import ProgressView from './ProgressView.mjs';
import ResearchView from './ResearchView.mjs';
import ShogiPanel from './ShogiPanel.mjs';
import { on, onLongPress, parseHtml, shuffle } from './browser.mjs';
import {
  Step,
  formatGameUsi,
  formatSfen,
  formatStep,
  getMoveFrom,
  getMoveTo,
  getPieceSide,
  isMoveDropped,
  isMovePromoted,
  makeDrop,
  makeMove,
  parseMoveUsi,
  squareN,
  usiEndNameMap,
  parseGameUsi,
  formatGameUsiFromLastStep,
  formatMoveUsis,
} from './shogi.mjs';

export default class QuestionView {
  constructor(app) {
    this.el = parseHtml(`
      <div class="QuestionView">
        <div class="TitleOutput Center"></div>
        <div class="ToolBar">
          <button class="CloseButton">閉じる</button>
          <select class="RecordSelect"></select>
          <button class="CollectButton">コレクト</button>
          <button class="MenuButton">メニュー</button>
        </div>
        <canvas class="ShogiPanel"></canvas>
        <div class="TitleBar">
          <button class="ResetButton">やり直す</button>
          <select class="StepSelect"></select>
          <button class="UndoButton">待った</button>
        </div>
        <div class="ToolBar">
          <button class="RecordPrevButton">前問</button>
          <button class="ResearchButton">検討</button>
          <button class="AnswerButton">解答例</button>
          <button class="RecordNextButton">次問</button>
        </div>
      </div>
    `);
    this.app = app;
    this.titleOutput = this.el.querySelector('.TitleOutput');
    this.recordSelect = this.el.querySelector('.RecordSelect');
    this.recordPrevButton = this.el.querySelector('.RecordPrevButton');
    this.recordNextButton = this.el.querySelector('.RecordNextButton');
    this.collectButton = this.el.querySelector('.CollectButton');
    this.answerButton = this.el.querySelector('.AnswerButton');
    this.shogiPanel = new ShogiPanel(this.el.querySelector('.ShogiPanel'), this);
    this.stepSelect = this.el.querySelector('.StepSelect');
    this.resetButton = this.el.querySelector('.ResetButton');
    this.undoButton = this.el.querySelector('.UndoButton');

    on(this.el.querySelector('.CloseButton'), 'click', () => {
      this.hide(this.changed);
    });

    on(this.el.querySelector('.MenuButton'), 'click', async () => {
      switch (
        await this.app.menuView.show('メニュー', [
          '盤面反転',
          '開始局面のコピー (SFEN)',
          '解答例のコピー (USI)',
          '設定',
        ])
      ) {
        case 0:
          this.inversion ^= 1;
          this.shogiPanel.inversion ^= 1;
          this.shogiPanel.request();
          break;
        case 1:
          this.app.writeToClipboard(this.startSfen);
          break;
        case 2:
          this.app.writeToClipboard(formatGameUsi(this.game));
          break;
        case 3:
          if (await this.app.settingsView.show()) {
            this.updateSettings();
            this.shogiPanel.request();
          }
          break;
      }
    });

    on(this.el.querySelector('.ResearchButton'), 'click', () => {
      new ResearchView(this.app).show(this.shogiPanel);
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

    on(this.recordSelect, 'change', () => {
      this.changeRecord(+this.recordSelect.value);
    });

    onLongPress(this.recordPrevButton, () => {
      this.doRecordPrev();
    });

    onLongPress(this.recordNextButton, () => {
      this.doRecordNext();
    });

    on(this.answerButton, 'click', () => {
      if (this.limit) {
        this.stopClock();
        new BrowseView(this.app).show('解答例', this.shogiPanel, this.startStep, this.answerMoveUsis, 1);
      } else {
        this.app.confirmView.show('解答例はありません。', ['OK']);
      }
    });

    on(this.stepSelect, 'change', () => {
      this.changePlayStep(this.stepSelect.selectedIndex);
    });

    on(this.resetButton, 'click', () => {
      this.doPlayReset();
    });

    on(this.undoButton, 'click', () => {
      this.doPlayUndo();
    });
  }

  show(records, startRecordOrder, title, bookName, volumeName) {
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
    this.inversion = 0;
    this.updateSettings();
    this.updateRecord();
    this.app.pushView(this);
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  updateSettings() {
    this.shogiPanel.pieceStyle = this.app.getPieceStyle();
    this.shogiPanel.pieceTitleSet = this.app.getPieceTitleSet();
    this.app.playPieceSound(0);
  }

  formatRecordOption(recordIndex, marked) {
    return `第${recordIndex + 1}問${marked ? '❤️' : ''}`;
  }

  hide(value) {
    this.stopClock();
    this.app.popView();
    if (this.resolve) {
      this.resolve(value);
      this.resolve = null;
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
    } else {
      this.app.confirmView.show('次問はありません。', ['OK']);
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
    this.game = parseGameUsi(gameUsi);
    this.startStep = new Step(this.game.startStep);
    this.startSfen = formatSfen(this.startStep.position);
    this.startSide = this.startStep.position.sideToMove;
    this.startNumber = this.startStep.position.number;
    this.shogiPanel.inversion = this.startSide ^ this.inversion;
    this.shogiPanel.sideNames[this.startSide] = '攻方';
    this.shogiPanel.sideNames[this.startSide ^ 1] = '受方';
    this.shogiPanel.clocks[this.startSide] = '';
    this.shogiPanel.clocks[this.startSide ^ 1] = '';
    this.answerMoveUsis = formatMoveUsis(this.startStep);
    this.limit = this.answerMoveUsis.length;
    this.answerButton.disabled = !this.limit;
    this.rate = rate;
    this.collectButton.disabled = this.rate;
    this.playSteps = [];
    this.playIndex = -1;
    this.playOptions = [];
    this.stepSelect.replaceChildren();
    this.appendPlayStep(this.startStep);
    this.changePlayStep(0);
    this.startClock();
  }

  startClock() {
    this.stopClock();
    this.startTime = Date.now();
    this.clockId = setInterval(() => {
      const time = Date.now() - this.startTime;
      this.shogiPanel.clocks[this.startSide] =
        Math.floor(time / 60_000) + ':' + ('' + (Math.floor(time / 1000) % 60)).padStart(2, '0');
      this.shogiPanel.request();
    }, 200);
  }

  stopClock() {
    clearInterval(this.clockId);
    this.clockId = 0;
  }

  isPlayExceeded() {
    return !this.rate && this.startRecordOrder >= 0 && this.limit && this.playNumber > this.limit;
  }

  async onSquare(sq) {
    if (this.isPlayExceeded()) {
      return;
    }
    if (this.playSide !== this.startSide) {
      return;
    }
    if (this.shogiPanel.nextToMap?.has(sq)) {
      const nextFrom = getMoveFrom(this.shogiPanel.nextMove);
      if (isMoveDropped(this.shogiPanel.nextMove)) {
        await this.doPlayStep(this.playStep.appendMove(makeDrop(nextFrom, sq)));
      } else {
        let promoted = this.shogiPanel.nextToMap.get(sq) - 1;
        if (promoted === 2) {
          promoted = await this.app.confirmView.show('成りますか?', ['成らない', '成る']);
        }
        await this.doPlayStep(this.playStep.appendMove(makeMove(nextFrom, sq, promoted)));
      }
    } else if (
      this.shogiPanel.nextMove &&
      !isMoveDropped(this.shogiPanel.nextMove) &&
      getMoveFrom(this.shogiPanel.nextMove) === sq
    ) {
      this.shogiPanel.resetNext();
    } else {
      const piece = this.playStep.position.getPiece(sq);
      if (piece) {
        if (getPieceSide(piece) === this.playSide) {
          this.shogiPanel.nextMove = makeMove(sq, squareN);
          this.shogiPanel.nextToMap = (await this.getFromToMap()).get(this.shogiPanel.nextMove);
        }
      }
    }
    this.shogiPanel.request();
  }

  async onHand(side, base) {
    if (this.isPlayExceeded()) {
      return;
    }
    if (this.playSide !== this.startSide) {
      return;
    }
    if (this.playSide !== side) {
      return;
    }
    if (!this.playStep.position.getHandCount(side, base)) {
      return;
    }
    if (
      this.shogiPanel.nextMove &&
      isMoveDropped(this.shogiPanel.nextMove) &&
      getMoveFrom(this.shogiPanel.nextMove) === base
    ) {
      this.shogiPanel.resetNext();
    } else {
      this.shogiPanel.nextMove = makeDrop(base, squareN);
      this.shogiPanel.nextToMap = (await this.getFromToMap()).get(this.shogiPanel.nextMove);
    }
    this.shogiPanel.request();
  }

  async doPlayStep(step) {
    this.app.playPieceSound();
    this.appendPlayStep(step);
    this.changePlayStep(this.playSteps.length - 1);
    if (this.playSide === this.startSide) {
      if (this.isPlayExceeded()) {
        await this.endPlay('不詰');
      } else if (!(await this.getFromToMap()).size) {
        await this.endPlay('中断');
      }
    } else {
      const time = 500;
      const moveUsi = (
        await Promise.all([
          this.app.engine.bestmove(formatGameUsiFromLastStep(this.playStep), time),
          new Promise((resolve) => setTimeout(resolve, time)),
        ])
      )[0];
      if (moveUsi) {
        const move = parseMoveUsi(moveUsi);
        if (move) {
          await this.doPlayStep(this.playStep.appendMove(move));
          return;
        }
      }
      if (moveUsi === 'resign') {
        this.endPlay('詰み');
      } else {
        await this.endPlay(usiEndNameMap.get(moveUsi) || moveUsi);
      }
    }
  }

  async endPlay(endName) {
    this.stopClock();
    this.appendPlayStep(this.playStep.appendEnd(endName));
    this.changePlayStep(this.playSteps.length - 1);
    const [message, background] = endName === '詰み' ? ['成功', '#cfc6'] : ['失敗', '#fcc6'];
    new ProgressView(this.app).show(message, background, 1000);
  }

  async getFromToMap() {
    if (!this.fromToMap) {
      this.fromToMap = new Map();
      for (const moveUsi of await this.app.engine.moves(formatGameUsiFromLastStep(this.playStep), !this.rate)) {
        const move = parseMoveUsi(moveUsi);
        if (move) {
          const from = getMoveFrom(move);
          const key = isMoveDropped(move) ? makeDrop(from, squareN) : makeMove(from, squareN);
          let toMap = this.fromToMap.get(key);
          if (!toMap) {
            toMap = new Map();
            this.fromToMap.set(key, toMap);
          }
          const to = getMoveTo(move);
          toMap.set(to, (toMap.get(to) || 0) | (isMovePromoted(move) ? 2 : 1));
        }
      }
    }
    return this.fromToMap;
  }

  appendPlayStep(step) {
    this.playSteps.push(step);
    const option = new Option((step.isMove() ? `${step.position.number - this.startNumber}. ` : '') + formatStep(step));
    option.parentIndex = this.playIndex;
    this.playOptions.push(option);
    this.stepSelect.appendChild(option);
  }

  canPlayReset() {
    return this.playNumber > 0;
  }

  doPlayReset() {
    if (this.canPlayReset()) {
      this.changePlayStep(0);
    }
  }

  doPlayUndo() {
    if (this.canPlayReset()) {
      for (let stepIndex = this.playIndex; stepIndex >= 0; ) {
        const parentIndex = this.playOptions[stepIndex].parentIndex;
        if (parentIndex <= 0) {
          this.changePlayStep(0);
          return;
        }
        const step = this.playSteps[stepIndex];
        if (step.isMove() && step.position.sideToMove !== this.startSide) {
          this.changePlayStep(parentIndex);
          return;
        }
        stepIndex = parentIndex;
      }
    }
  }

  changePlayStep(playIndex) {
    this.playIndex = playIndex;
    this.playStep = this.playSteps[this.playIndex];
    this.playSide = this.playStep.position.sideToMove;
    this.playNumber = this.playStep.position.number - this.startNumber;
    this.fromToMap = null;
    this.stepSelect.selectedIndex = this.playIndex;
    this.resetButton.disabled = !this.canPlayReset();
    this.undoButton.disabled = !this.canPlayReset();
    this.shogiPanel.step = this.playStep;
    this.shogiPanel.resetNext();
    this.shogiPanel.request();
  }
}
