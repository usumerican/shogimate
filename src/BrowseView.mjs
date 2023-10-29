/* eslint-env browser */

import MatchSettingsView from './MatchSettingsView.mjs';
import MenuView from './MenuView.mjs';
import ResearchView from './ResearchView.mjs';
import ShogiPanel from './ShogiPanel.mjs';
import { on, onLongPress, parseHtml } from './browser.mjs';
import { formatPvMoveUsis, formatPvScoreValue, formatSfen, formatStep, sideInfos } from './shogi.mjs';

export default class BrowseView {
  constructor(app) {
    this.app = app;
    this.el = parseHtml(`
      <div class="BrowseView">
        <div class="TitleBar">
          <button class="CloseButton">閉じる</button>
          <div class="TitleOutput Center"></div>
          <button class="MenuButton">メニュー</button>
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

    on(this.el.querySelector('.MenuButton'), 'click', async () => {
      new MenuView(this.app).show('メニュー', [
        ...this.shogiPanel.createMenuItems(),
        {
          title: '検討',
          callback: () => {
            new ResearchView(this.app).show(this.game, this.getCurrStep());
          },
        },
        {
          title: '対局',
          callback: () => {
            const currStep = this.getCurrStep();
            new MatchSettingsView(this.app).show(
              {
                startName: this.game.startName,
                auto: currStep.position.sideToMove ? 1 : 2,
                level: this.game.level,
                positionSpecified: true,
                positionSfen: formatSfen(currStep.position),
              },
              true
            );
          },
        },
      ]);
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
    const startNumber = this.game.startStep.position.number;
    this.steps = [];
    const rows = [];
    this.walkSteps(this.game.startStep, (st) => {
      this.steps.push(st);
      const row = parseHtml(`
        <tr>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>
      `);
      if (st.isMove()) {
        row.children[0].textContent = st.position.number - startNumber;
      }
      row.children[1].textContent = formatStep(st);
      on(row, 'click', () => {
        this.changeStep(row.rowIndex);
      });
      if (st.analysis) {
        if (st.parent?.analysis && st.move !== st.parent.analysis.bestMove) {
          if ((st.analysis.scoreValue - st.parent.analysis.scoreValue) * (st.position.sideToMove ? 1 : -1) <= -400) {
            row.children[2].textContent = sideInfos[st.position.sideToMove ^ 1].char + '悪手';
          }
        }
        row.children[3].textContent = formatPvScoreValue(st.analysis.scoreValue);
        row.children[4].textContent = formatPvMoveUsis(st, st.analysis.pv).join(' ');
      }
      rows.push(row);
    });
    this.stepTbody.replaceChildren(...rows);
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
    this.app.popView(this);
  }

  changeStep(stepIndex) {
    this.stepIndex = Math.max(0, Math.min(this.steps.length - 1, stepIndex));
    const currStep = this.getCurrStep();
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
    this.shogiPanel.changeStep(currStep);
    this.shogiPanel.bestMove = currStep.analysis?.bestMove || 0;
    this.shogiPanel.request();
  }

  getCurrStep() {
    return this.steps[this.stepIndex];
  }

  canStepPrev() {
    return this.stepIndex > 0;
  }

  canStepNext() {
    return this.stepIndex < this.steps.length - 1;
  }
}
