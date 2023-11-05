/* eslint-env browser */

import MatchSettingsView from './MatchSettingsView.mjs';
import MenuView from './MenuView.mjs';
import ResearchView from './ResearchView.mjs';
import ShogiPanel from './ShogiPanel.mjs';
import { on, onLongPress, parseHtml } from './browser.mjs';
import { Game, Step, formatPvMoveUsis, formatPvScoreValue, formatSfen, formatStep, sideInfos } from './shogi.mjs';

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
          <button class="ParentButton"></button>
          <button class="NextButton">&gt;</button>
          <button class="LastButton">&gt;|</button>
        </div>
      </div>
    `);
    this.titleOutput = this.el.querySelector('.TitleOutput');
    this.shogiPanel = new ShogiPanel(this.app, this.el.querySelector('.ShogiPanel'));
    this.stepTbody = this.el.querySelector('.StepTbody');
    this.parentButton = this.el.querySelector('.ParentButton');
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
          title: '局面の検討',
          callback: () => {
            new ResearchView(this.app).show(this.game, this.getCurrStep());
          },
        },
        {
          title: '指定局面として対局',
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

    on(this.parentButton, 'click', () => {
      this.jump(this.steps.indexOf(this.getCurrStep().parent));
    });

    on(this.firstButton, 'click', () => {
      this.jump(0);
    });

    onLongPress(this.prevButton, () => {
      this.jump(this.stepIndex - 1);
    });

    onLongPress(this.nextButton, () => {
      this.jump(this.stepIndex + 1);
    });

    on(this.lastButton, 'click', () => {
      this.jump(this.steps.length - 1);
    });
  }

  show(title, game, step, analyzed) {
    this.titleOutput.textContent = title;
    this.game = this.shogiPanel.game = game;
    const startNumber = this.game.startStep.position.number;
    this.steps = [];
    const rows = [];
    this.walkSteps(this.game.startStep, (rowStep) => {
      this.steps.push(rowStep);
      const row = parseHtml(`
        <tr>
          <td></td>
          <td></td>
        </tr>
      `);
      if (rowStep.isMove()) {
        row.children[0].textContent = rowStep.position.number - startNumber;
      }
      row.children[1].textContent = formatStep(rowStep);
      on(row, 'click', () => {
        this.jump(row.rowIndex);
      });
      if (analyzed) {
        const evalCell = row.insertCell();
        const scoreCell = row.insertCell();
        const pvCell = row.insertCell();
        pvCell.classList.add('PvOutput');
        if (rowStep.analysis) {
          if (rowStep.parent?.analysis && rowStep.move !== rowStep.parent.analysis.bestMove) {
            if (
              (rowStep.analysis.scoreValue - rowStep.parent.analysis.scoreValue) *
                (rowStep.position.sideToMove ? 1 : -1) <=
              -400
            ) {
              evalCell.textContent = sideInfos[rowStep.position.sideToMove ^ 1].char + '悪手';
            }
          }
          scoreCell.textContent = formatPvScoreValue(rowStep.analysis.scoreValue);
          pvCell.textContent = formatPvMoveUsis(rowStep, rowStep.analysis.pv).join(' ');
          on(pvCell, 'click', () => {
            const pvGame = new Game(this.game);
            let pvStep = (pvGame.startStep = new Step({ position: rowStep.position }));
            for (const moveUsi of rowStep.analysis.pv) {
              pvStep = pvStep.appendMoveUsi(moveUsi);
            }
            new BrowseView(this.app).show('読み筋', pvGame);
          });
        }
      }
      rows.push(row);
    });
    this.stepTbody.replaceChildren(...rows);
    this.jump(this.steps.indexOf(step));
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

  jump(stepIndex) {
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
    this.parentButton.textContent = `${this.stepIndex} / ${this.steps.length - 1}`;
    this.firstButton.disabled = this.prevButton.disabled = this.parentButton.disabled = !this.canStepPrev();
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
