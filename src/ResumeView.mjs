import MatchView from './MatchView.mjs';
import ShogiPanel from './ShogiPanel.mjs';
import View from './View.mjs';
import { on } from './browser.mjs';
import { Game, sides } from './shogi.mjs';

export default class ResumeView extends View {
  constructor() {
    super(`
      <div class="ResumeView">
        <div class="TitleOutput Center"></div>
        <canvas class="ShogiPanel"></canvas>
        <div class="ToolBar">
          <button class="CloseButton">閉じる</button>
          <button class="SubmitButton">再開</button>
        </div>
      </div>
    `);
    this.titleOutput = this.el.querySelector('.TitleOutput');
    this.shogiPanel = new ShogiPanel(this.el.querySelector('.ShogiPanel'));

    on(this.el.querySelector('.CloseButton'), 'click', () => {
      this.hide();
    });

    on(this.el.querySelector('.SubmitButton'), 'click', async () => {
      this.app.settings.adjournedGame = null;
      this.app.saveSettings();
      this.hide();
      await new MatchView().show(this.parent, this.game, this.shogiPanel.step);
    });
  }

  onShow() {
    this.shogiPanel.app = this.app;
    this.game = Game.fromObject(this.app.settings.adjournedGame);
    this.titleOutput.textContent = this.game.getTimingTitle();
    this.shogiPanel.game = this.game;
    this.shogiPanel.step = this.findLastStep(this.game.startStep);
    for (const side of sides) {
      this.shogiPanel.clockTimes[side] = this.game.players[side].getClockTime();
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
