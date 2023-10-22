/* eslint-env browser */

import ResearchView from './ResearchView.mjs';
import ShogiPanel from './ShogiPanel.mjs';
import { on, onLongPress, parseHtml } from './browser.mjs';
import { formatPvScore, formatStep } from './shogi.mjs';

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
        <table class="StepTable">
          <tbody class="StepTbody"></tbody>
        </table>
        <div class="ToolBar">
          <button class="FirstButton">|&lt;</button>
          <button class="PrevButton">&lt;</button>
          <output class="PageOutput Center"></output>
          <button class="NextButton">&gt;</button>
          <button class="LastButton">&gt;|</button>
        </div>
      </div>
    `);
    this.titleOutput = this.el.querySelector('.TitleOutput');
    this.shogiPanel = new ShogiPanel(this.app, this.el.querySelector('.ShogiPanel'));
    this.stepTbody = this.el.querySelector('.StepTbody');
    this.pageOutput = this.el.querySelector('.PageOutput');
    this.firstButton = this.el.querySelector('.FirstButton');
    this.prevButton = this.el.querySelector('.PrevButton');
    this.nextButton = this.el.querySelector('.NextButton');
    this.lastButton = this.el.querySelector('.LastButton');

    on(this.el.querySelector('.CloseButton'), 'click', () => {
      this.hide();
    });

    on(this.el.querySelector('.ResearchButton'), 'click', () => {
      new ResearchView(this.app).show(this.game, this.steps[this.stepIndex]);
    });

    on(this.firstButton, 'click', () => {
      this.changeStep(0);
    });

    onLongPress(this.prevButton, () => {
      this.changeStep(this.stepIndex - 1);
    });

    onLongPress(this.nextButton, () => {
      this.changeStep(this.stepIndex + 1);
    });

    on(this.lastButton, 'click', () => {
      this.changeStep(this.steps.length - 1);
    });
  }

  show(title, game, step) {
    this.titleOutput.textContent = title;
    this.game = this.shogiPanel.game = game;
    this.steps = [];
    this.walkSteps(this.game.startStep, (st) => {
      this.steps.push(st);
    });
    const startNumber = this.game.startStep.position.number;
    this.stepTbody.replaceChildren(
      ...this.steps.map((st, i) => {
        const row = parseHtml(`
          <tr>
            <td></td>
            <td></td>
            <td></td>
          </tr>
        `);
        if (st.isMove()) {
          row.children[0].textContent = st.position.number - startNumber;
        }
        row.children[1].textContent = formatStep(st);
        if (st.analysis) {
          row.children[2].textContent = formatPvScore(st.analysis.score, st.position.sideToMove);
        }
        on(row, 'click', () => {
          this.changeStep(i);
        });
        return row;
      })
    );
    this.changeStep(this.steps.indexOf(step));
    this.app.pushView(this);
  }

  walkSteps(step, callback) {
    if (step) {
      callback(step);
      for (const child of step.children) {
        this.walkSteps(child, callback);
      }
    }
  }

  hide() {
    this.app.popView();
  }

  changeStep(stepIndex) {
    this.stepIndex = Math.max(0, Math.min(this.steps.length - 1, stepIndex));
    for (const row of this.stepTbody.querySelectorAll('.Selected')) {
      row.classList.remove('Selected');
    }
    const row = this.stepTbody.children[this.stepIndex];
    row.classList.add('Selected');
    setTimeout(() => {
      row.scrollIntoView({ block: 'center' });
    });
    this.pageOutput.textContent = `${this.stepIndex} / ${this.steps.length - 1}`;
    this.firstButton.disabled = this.prevButton.disabled = !this.canStepPrev();
    this.lastButton.disabled = this.nextButton.disabled = !this.canStepNext();
    const step = this.steps[this.stepIndex];
    this.shogiPanel.changeStep(step);
    this.shogiPanel.bestMove = step.analysis?.bestMove || 0;
    this.shogiPanel.request();
  }

  canStepPrev() {
    return this.stepIndex > 0;
  }

  canStepNext() {
    return this.stepIndex < this.steps.length - 1;
  }
}
