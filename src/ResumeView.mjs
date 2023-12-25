import MatchView from './MatchView.mjs';
import ShogiPanel from './ShogiPanel.mjs';
import View from './View.mjs';
import { on } from './browser.mjs';
import { Game, sides } from './shogi.mjs';

export default class ResumeView extends View {
  constructor() {
    super(`
      <div class="ResumeView">
        <div class="Center">封じ手</div>
        <canvas class="ShogiPanel"></canvas>
        <div class="ToolBar">
          <button class="CloseButton">閉じる</button>
          <button class="SubmitButton">再開</button>
        </div>
      </div>
    `);
    this.shogiPanel = new ShogiPanel(this.el.querySelector('.ShogiPanel'));

    on(this.el.querySelector('.CloseButton'), 'click', () => {
      this.hide();
    });

    on(this.el.querySelector('.SubmitButton'), 'click', async () => {
      this.app.settings.adjournedGame = null;
      this.app.saveSettings();
      await new MatchView().show(this, '再開', this.game, this.shogiPanel.step);
      this.hide();
    });
  }

  onShow() {
    this.shogiPanel.app = this.app;
    this.game = Game.fromObject(this.app.settings.adjournedGame);
    this.shogiPanel.game = this.game;
    this.shogiPanel.step = this.findLastStep(this.game.startStep);
    for (const side of sides) {
      this.shogiPanel.clockTimes[side] = this.game.players[side].restTime;
    }
    this.shogiPanel.request();
  }

  findLastStep(step) {
    if (!step.children.length) {
      return step;
    }
    return this.findLastStep(step.children[step.children.length - 1]);
  }
}
