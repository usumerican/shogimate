import BrowseView from './BrowseView.mjs';
import CapturingView from './CapturingView.mjs';
import ImportView from './ImportView.mjs';
import MatchSettingsView from './MatchSettingsView.mjs';
import QuestionSettingsView from './QuestionSettingsView.mjs';
import ResumeView from './ResumeView.mjs';
import SettingsView from './SettingsView.mjs';
import View from './View.mjs';
import { on, openUrl } from './browser.mjs';

export default class HomeView extends View {
  constructor() {
    super(`
      <div class="HomeView">
        <div class="AppTitleOutput Center"></div>
        <button class="CapturingButton">こまどり将棋</button>
        <button class="QuestionButton">実戦詰将棋</button>
        <button class="MatchButton">AI 対局</button>
        <button class="ResumeButton">封じ手</button>
        <button class="ImportButton">棋譜の読み込み</button>
        <div class="ToolBar">
          <button class="InfoButton">ソース</button>
          <button class="SettingsButton">アプリ設定</button>
          <button class="ReloadButton">再読込</button>
        </div>
      </div>
    `);
    this.appTitleOutput = this.el.querySelector('.AppTitleOutput');
    this.resumeButton = this.el.querySelector('.ResumeButton');

    on(this.el.querySelector('.InfoButton'), 'click', () => {
      openUrl('https://github.com/usumerican/shogimate');
    });

    on(this.el.querySelector('.SettingsButton'), 'click', async () => {
      await new SettingsView().show(this);
    });

    on(this.el.querySelector('.ReloadButton'), 'click', () => {
      location.reload();
    });

    on(this.el.querySelector('.CapturingButton'), 'click', async () => {
      await new CapturingView().show(this);
    });

    on(this.el.querySelector('.QuestionButton'), 'click', async () => {
      await new QuestionSettingsView().show(this);
    });

    on(this.el.querySelector('.ImportButton'), 'click', async () => {
      const game = await new ImportView().show(this, this.app.settings.match);
      if (game) {
        await new BrowseView().show(this, '棋譜', game);
      }
    });

    on(this.el.querySelector('.MatchButton'), 'click', async () => {
      await new MatchSettingsView().show(this, this.app.settings.match);
      this.update();
    });

    on(this.resumeButton, 'click', async () => {
      if (this.app.settings.adjournedGame) {
        await new ResumeView().show(this);
        this.update();
      }
    });
  }

  onShow() {
    this.appTitleOutput.textContent = `${this.app.title} ${this.app.version}`;
  }

  onFocus() {
    this.update();
  }

  update() {
    this.resumeButton.disabled = !this.app.settings.adjournedGame;
  }
}
