/* eslint-env browser */

import ShogiPanel from './ShogiPanel.mjs';
import { on, onLongPress, parseHtml } from './browser.mjs';
import { Step, formatStep, parseMoveUsi } from './shogi.mjs';

export default class BrowseView {
  constructor(app) {
    this.app = app;
    this.el = parseHtml(`
      <div class="BrowseView">
        <div class="TitleBar">
          <button class="CloseButton">閉じる</button>
          <div class="TitleOutput Center"></div>
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

    on(this.el.querySelector('.CloseButton'), 'click', () => {
      this.hide();
    });

    on(this.stepSelect, 'change', () => {
      this.changeStep(+this.stepSelect.selectedIndex);
    });

    onLongPress(this.el.querySelector('.StepPrevButton'), () => {
      if (this.stepIndex > 0) {
        this.changeStep(this.stepIndex - 1);
      }
    });

    onLongPress(this.el.querySelector('.StepNextButton'), () => {
      if (this.stepIndex < this.steps.length - 1) {
        this.changeStep(this.stepIndex + 1);
      }
    });
  }

  show(title, parentPanel, moveUsis) {
    this.titleOutput.textContent = title;
    this.shogiPanel.inversion = parentPanel.inversion;
    this.shogiPanel.sideNames = parentPanel.sideNames;
    this.shogiPanel.pieceStyle = parentPanel.pieceStyle;
    this.shogiPanel.pieceTitleSet = parentPanel.pieceTitleSet;
    this.steps = [];
    const currStep = new Step(parentPanel.step.endName ? parentPanel.step.parent : parentPanel.step);
    let step = currStep;
    while (step) {
      this.steps.unshift(step);
      step = step.parent;
    }
    const stepIndex = this.steps.length - 1;
    if (moveUsis) {
      step = currStep;
      for (const moveUsi of moveUsis) {
        const move = parseMoveUsi(moveUsi);
        if (!move) {
          break;
        }
        step = step.appendMove(move);
        this.steps.push(step);
      }
    }
    this.stepSelect.replaceChildren(
      ...this.steps.map((step) => new Option(formatStep(step) + (step === currStep ? '*' : '')))
    );
    this.changeStep(stepIndex);
    this.app.pushView(this);
  }

  hide() {
    this.app.popView();
  }

  changeStep(stepIndex) {
    this.stepIndex = stepIndex;
    this.stepSelect.selectedIndex = this.stepIndex;
    this.shogiPanel.step = this.steps[this.stepIndex];
    this.shogiPanel.request();
  }
}
