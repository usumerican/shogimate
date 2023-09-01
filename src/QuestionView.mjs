/* eslint-env browser */

import ShogiPanel from './ShogiPanel.mjs';
import { on, onLongPress, parseHtml, shuffle } from './browser.mjs';
import {
  Step,
  formatMoveUsi,
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
          <button class="StepPrevButton"></button>
          <select class="StepSelect"></select>
          <button class="StepNextButton"></button>
        </div>
        <div class="TitleBar">
          <button class="RecordPrevButton">前問</button>
          <div class="TabBar">
            <button class="PlayButton Center">実戦</button>
            <button class="AnswerButton Center">解答例</button>
          </div>
          <button class="RecordNextButton">次問</button>
        </div>
      </div>
    `);
    this.app = app;
    this.titleOutput = this.el.querySelector('.TitleOutput');
    this.recordSelect = this.el.querySelector('.RecordSelect');
    this.recordPrevButton = this.el.querySelector('.RecordPrevButton');
    this.recordNextButton = this.el.querySelector('.RecordNextButton');
    this.playButton = this.el.querySelector('.PlayButton');
    this.answerButton = this.el.querySelector('.AnswerButton');
    this.shogiPanel = new ShogiPanel(this.el.querySelector('.ShogiPanel'), this);
    this.stepSelect = this.el.querySelector('.StepSelect');
    this.stepPrevButton = this.el.querySelector('.StepPrevButton');
    this.stepNextButton = this.el.querySelector('.StepNextButton');

    on(this.el.querySelector('.CloseButton'), 'click', () => {
      this.hide(this.changed);
    });

    on(this.el.querySelector('.MenuButton'), 'click', async () => {
      switch (
        await this.app.menuView.show('メニュー', ['盤面反転', '開始局面のコピー (SFEN)', '解答例のコピー (USI)'])
      ) {
        case 0:
          this.inversion ^= 1;
          this.shogiPanel.inversion ^= 1;
          this.shogiPanel.request();
          break;
        case 1:
          await this.app.writeToClipboard(this.startSfen);
          break;
        case 2:
          await this.app.writeToClipboard(formatGameUsi(this.game));
          break;
      }
    });

    on(this.el.querySelector('.CollectButton'), 'click', () => {
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

    on(this.playButton, 'click', () => {
      this.doPlay();
    });

    on(this.answerButton, 'click', () => {
      this.doAnswer();
    });

    on(this.stepSelect, 'change', () => {
      if (this.answering) {
        this.changeAnswerStep(this.stepSelect.selectedIndex);
      } else {
        this.changePlayStep(this.stepSelect.selectedIndex);
      }
    });

    onLongPress(this.stepPrevButton, () => {
      if (this.answering) {
        this.doAnswerPrev();
      } else {
        this.doPlayReset();
        return true;
      }
    });

    onLongPress(this.stepNextButton, () => {
      if (this.answering) {
        this.doAnswerNext();
      } else {
        this.doPlayUndo();
        return true;
      }
    });
  }

  onSquare(sq) {
    if (this.answering) {
      this.doAnswerNext();
    } else {
      this.doPlaySquare(sq);
    }
  }

  onHand(side, base) {
    if (this.answering) {
      this.doAnswerPrev();
    } else {
      this.doPlayHand(side, base);
    }
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
    this.updateRecord();
    this.app.pushView(this);
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
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

  async doRecordNext() {
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
    this.game = parseGameUsi(this.records[this.recordIndices[this.recordOrder]]);
    this.startStep = new Step(this.game.startStep);
    this.startSfen = formatSfen(this.startStep.position);
    this.startSide = this.startStep.position.sideToMove;
    this.startNumber = this.startStep.position.number;
    this.playSteps = [];
    this.playOptions = [];
    this.playIndex = -1;
    this.appendPlayStep(this.startStep);
    this.answerSteps = [];
    for (let step = this.startStep; step; step = step.children[0]) {
      this.answerSteps.push(step);
    }
    this.limit = this.answerSteps.length - 1;
    this.answerOptions = this.answerSteps.map(
      (step) =>
        new Option(step.position.number > this.startNumber ? this.formatStepOption(step) : `解答例 (${this.limit}手)`)
    );
    this.answerButton.disabled = !this.limit;
    this.recordPrevButton.disabled = !this.canRecordPrev();
    this.recordNextButton.disabled = !this.canRecordNext();
    this.shogiPanel.inversion = this.startSide ^ this.inversion;
    this.shogiPanel.sideNames[this.startSide] = '攻方';
    this.shogiPanel.sideNames[this.startSide ^ 1] = '受方';
    this.shogiPanel.clocks[this.startSide] = '';
    this.shogiPanel.clocks[this.startSide ^ 1] = '';
    this.doPlay();
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

  doPlay() {
    this.answering = false;
    this.shogiPanel.el.classList.remove('Answering');
    this.answerButton.classList.remove('Selected');
    this.playButton.classList.add('Selected');
    this.stepSelect.replaceChildren(...this.playOptions);
    this.stepPrevButton.textContent = 'やり直す';
    this.stepNextButton.textContent = '待った';
    this.changePlayStep(0);
  }

  async doPlaySquare(sq) {
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

  async doPlayHand(side, base) {
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
    this.appendPlayStep(step);
    this.changePlayStep(this.playSteps.length - 1);
    if (this.playSide === this.startSide) {
      if (this.isPlayExceeded()) {
        await this.endPlay(`${this.limit}手で詰みませんでした。`);
      } else if (!(await this.getFromToMap()).size) {
        await this.endPlay('差せる手がありません。');
      }
    } else {
      const time = 500;
      const moveUsi = (
        await Promise.all([
          this.app.engine.bestmove(this.playGameUsi, time),
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
        this.stopClock();
        this.appendPlayStep(this.playStep.appendEnd('詰み'));
        this.changePlayStep(this.playSteps.length - 1);
        switch (
          await this.app.resultView.show(`${this.playNumber}手で詰みました。`, ['閉じる', '解答例', '次問'], true)
        ) {
          case 1:
            this.doAnswer();
            break;
          case 2:
            this.doRecordNext();
            break;
        }
      } else {
        await this.endPlay(`${usiEndNameMap.get(moveUsi) || moveUsi}です。`);
      }
    }
  }

  isPlayExceeded() {
    return this.startRecordOrder >= 0 && this.limit && this.playNumber > this.limit;
  }

  async getFromToMap() {
    if (!this.fromToMap) {
      this.fromToMap = new Map();
      const moveUsis = await this.app.engine.checks(this.playGameUsi);
      for (const move of moveUsis.map((moveUsi) => parseMoveUsi(moveUsi)).filter((move) => move)) {
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
    return this.fromToMap;
  }

  async endPlay(message) {
    this.stopClock();
    this.appendPlayStep(this.playStep.appendEnd('不詰'));
    this.changePlayStep(this.playSteps.length - 1);
    switch (await this.app.resultView.show(`${message}`, ['閉じる', 'やり直す', '待った'])) {
      case 1:
        this.doPlayReset();
        break;
      case 2:
        this.doPlayUndo();
        break;
    }
  }

  appendPlayStep(step) {
    this.playSteps.push(step);
    const option = new Option(this.formatStepOption(step));
    option.parentIndex = this.playIndex;
    this.playOptions.push(option);
    this.stepSelect.appendChild(option);
  }

  formatStepOption(step) {
    return (step.isMove() ? `${step.position.number - this.startNumber}. ` : '') + formatStep(step);
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
    let movesUsi = '';
    for (let step = this.playStep; step.parent; step = step.parent) {
      if (step.move) {
        movesUsi = ' ' + formatMoveUsi(step.move) + movesUsi;
      }
    }
    this.playGameUsi = 'position sfen ' + this.startSfen;
    if (movesUsi) {
      this.playGameUsi += ' moves' + movesUsi;
    }
    this.fromToMap = null;
    this.stepSelect.selectedIndex = playIndex;
    this.stepPrevButton.disabled = !this.canPlayReset();
    this.stepNextButton.disabled = !this.canPlayReset();
    this.shogiPanel.step = this.playStep;
    this.shogiPanel.resetNext();
    this.shogiPanel.request();
  }

  async doAnswer() {
    if (this.limit) {
      this.stopClock();
      this.answering = true;
      this.shogiPanel.el.classList.add('Answering');
      this.shogiPanel.resetNext();
      this.stepSelect.replaceChildren(...this.answerOptions);
      this.playButton.classList.remove('Selected');
      this.answerButton.classList.add('Selected');
      this.changeAnswerStep(0);
    } else {
      this.app.confirmView.show('解答例はありません。', ['OK']);
    }
  }

  canAnswerPrev() {
    return this.answerIndex > 0;
  }

  doAnswerPrev() {
    if (this.canAnswerPrev()) {
      this.changeAnswerStep(this.answerIndex - 1);
    }
  }

  canAnswerNext() {
    return this.answerIndex < this.limit;
  }

  doAnswerNext() {
    if (this.canAnswerNext()) {
      this.changeAnswerStep(this.answerIndex + 1);
    }
  }

  changeAnswerStep(answerIndex) {
    this.answerIndex = answerIndex;
    this.stepSelect.selectedIndex = answerIndex;
    this.stepPrevButton.textContent = '前手';
    this.stepPrevButton.disabled = !this.canAnswerPrev();
    this.stepNextButton.textContent = '次手';
    this.stepNextButton.disabled = !this.canAnswerNext();
    this.shogiPanel.step = this.answerSteps[answerIndex];
    this.shogiPanel.request();
  }
}
