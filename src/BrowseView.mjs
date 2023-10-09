/* eslint-env browser */

import ResearchView from './ResearchView.mjs';
import ShogiPanel from './ShogiPanel.mjs';
import { on, onLongPress, parseHtml } from './browser.mjs';
import { Step, formatStep } from './shogi.mjs';

export default class BrowseView {
  constructor(app) {
    this.app = app;
    this.el = parseHtml(`
      <div class="BrowseView">
        <div class="TitleBar">
          <button class="CloseButton">閉じる</button>
          <div class="TitleOutput Center"></div>
          <button class="ResearchButton">検討</button>
        </div>
        <canvas class="ShogiPanel"></canvas>
        <div class="TitleBar">
          <button class="StepPrevButton">前手</button>
          <select class="StepSelect"></select>
          <button class="StepNextButton">次手</button>
        </div>
      </div>
    `);
    this.titleOutput = this.el.querySelector('.TitleOutput');
    this.shogiPanel = new ShogiPanel(this.el.querySelector('.ShogiPanel'));
    this.stepSelect = this.el.querySelector('.StepSelect');
    this.stepPrevButton = this.el.querySelector('.StepPrevButton');
    this.stepNextButton = this.el.querySelector('.StepNextButton');

    on(this.el.querySelector('.CloseButton'), 'click', () => {
      this.hide();
    });

    on(this.el.querySelector('.ResearchButton'), 'click', () => {
      new ResearchView(this.app).show(this.shogiPanel);
    });

    on(this.stepSelect, 'change', () => {
      this.changeStep(+this.stepSelect.selectedIndex);
    });

    onLongPress(this.stepPrevButton, () => {
      if (this.canStepPrev()) {
        this.changeStep(this.stepIndex - 1);
      }
    });

    onLongPress(this.stepNextButton, () => {
      if (this.canStepNext()) {
        this.changeStep(this.stepIndex + 1);
      }
    });
  }

  show(title, parentPanel, step, moveUsis, offset = 0) {
    this.titleOutput.textContent = title;
    this.shogiPanel.inversion = parentPanel.inversion;
    this.shogiPanel.sideNames = parentPanel.sideNames;
    this.shogiPanel.pieceStyle = parentPanel.pieceStyle;
    this.shogiPanel.pieceTitleSet = parentPanel.pieceTitleSet;
    this.steps = [];
    const currStep = new Step(step);
    let st = currStep;
    while (st) {
      this.steps.unshift(st);
      st = st.parent;
    }
    const stepIndex = this.steps.length - 1 + offset;
    if (moveUsis) {
      st = currStep;
      for (const moveUsi of moveUsis) {
        st = st.appendMoveUsi(moveUsi);
        this.steps.push(st);
      }
    }
    const startNumber = this.steps[0].position.number;
    this.stepSelect.replaceChildren(
      ...this.steps.map(
        (step, i) =>
          new Option(
            (step.isMove() ? step.position.number - startNumber + '. ' : '') +
              formatStep(step) +
              (i === stepIndex ? '*' : '')
          )
      )
    );
    this.changeStep(stepIndex);
    this.app.pushView(this);
  }

  hide() {
    this.app.popView();
  }

  changeStep(stepIndex) {
    this.stepIndex = Math.max(0, Math.min(this.steps.length - 1, stepIndex));
    this.stepSelect.selectedIndex = this.stepIndex;
    this.stepPrevButton.disabled = !this.canStepPrev();
    this.stepNextButton.disabled = !this.canStepNext();
    this.shogiPanel.step = this.steps[this.stepIndex];
    this.shogiPanel.request();
  }

  canStepPrev() {
    return this.stepIndex > 0;
  }

  canStepNext() {
    return this.stepIndex < this.steps.length - 1;
  }
}
