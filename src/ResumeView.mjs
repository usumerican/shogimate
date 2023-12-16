import MatchView from './MatchView.mjs';
import ShogiPanel from './ShogiPanel.mjs';
import { on, parseHtml } from './browser.mjs';
import { Game, sides } from './shogi.mjs';

export default class ResumeView {
  constructor(app) {
    this.app = app;
    this.el = parseHtml(`
      <div class="ResumeView">
        <div class="Center">封じ手</div>
        <canvas class="ShogiPanel"></canvas>
        <div class="ToolBar">
          <button class="CloseButton">閉じる</button>
          <button class="SubmitButton">再開</button>
        </div>
      </div>
    `);
    this.shogiPanel = new ShogiPanel(this.app, this.el.querySelector('.ShogiPanel'));

    on(this.el.querySelector('.CloseButton'), 'click', () => {
      this.hide();
    });

    on(this.el.querySelector('.SubmitButton'), 'click', () => {
      this.hide();
      new MatchView(this.app).show('再開', this.game, this.shogiPanel.step);
      this.app.settings.adjournedGame = null;
      this.app.saveSettings();
    });
  }

  show() {
    this.game = Game.fromObject(this.app.settings.adjournedGame);
    this.shogiPanel.game = this.game;
    this.shogiPanel.step = this.findLastStep(this.game.startStep);
    for (const side of sides) {
      this.shogiPanel.clockTimes[side] = this.game.players[side].restTime;
    }
    this.shogiPanel.request();
    this.app.pushView(this);
  }

  hide() {
    this.app.popView(this);
  }

  findLastStep(step) {
    if (!step.children.length) {
      return step;
    }
    return this.findLastStep(step.children[step.children.length - 1]);
  }
}
