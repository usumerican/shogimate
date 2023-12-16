/* eslint-env browser */

import BrowseView from './BrowseView.mjs';
import CollectionView from './CollectionView.mjs';
import ImportView from './ImportView.mjs';
import MatchSettingsView from './MatchSettingsView.mjs';
import QuestionView from './QuestionView.mjs';
import ResumeView from './ResumeView.mjs';
import SettingsView from './SettingsView.mjs';
import { on, openUrl, parseHtml, setSelectValue } from './browser.mjs';

export default class HomeView {
  constructor(app) {
    this.app = app;
    this.el = parseHtml(`
      <div class="HomeView">
        <div class="TitleOutput Center"></div>
        <select class="BookSelect"></select>
        <select class="VolumeSelect"></select>
        <button class="ContinueButton">続きから</button>
        <button class="StartButton">始めから</button>
        <button class="ChallengeButton">チャレンジ</button>
        <button class="CollectionButton">コレクション</button>
        <button class="ImportButton">棋譜の読み込み</button>
        <button class="MatchButton">AI 対局</button>
        <button class="ResumeButton">封じ手</button>
        <div class="ToolBar">
          <button class="InfoButton">ソース</button>
          <button class="SettingsButton">アプリ設定</button>
          <button class="ReloadButton">再読込</button>
        </div>
      </div>
    `);
    this.el.querySelector('.TitleOutput').textContent = `${this.app.title} ${this.app.version}`;
    this.bookSelect = this.el.querySelector('.BookSelect');
    this.volumeSelect = this.el.querySelector('.VolumeSelect');
    this.continueButton = this.el.querySelector('.ContinueButton');
    this.resumeButton = this.el.querySelector('.ResumeButton');

    on(this.el.querySelector('.InfoButton'), 'click', () => {
      openUrl('https://github.com/usumerican/shogimate');
    });

    on(this.el.querySelector('.SettingsButton'), 'click', async () => {
      await new SettingsView(this.app).show();
    });

    on(this.el.querySelector('.ReloadButton'), 'click', () => {
      location.reload();
    });

    on(this.bookSelect, 'change', () => {
      this.updateVolumeSelect();
    });

    on(this.volumeSelect, 'change', () => {
      this.updateButtons();
    });

    on(this.continueButton, 'click', () => {
      this.start(1);
    });

    on(this.el.querySelector('.StartButton'), 'click', () => {
      this.start(0);
    });

    on(this.el.querySelector('.ChallengeButton'), 'click', () => {
      this.start(-1);
    });

    on(this.el.querySelector('.CollectionButton'), 'click', () => {
      new CollectionView(this.app).show();
    });

    on(this.el.querySelector('.ImportButton'), 'click', async () => {
      const game = await new ImportView(this.app).show(this.app.settings.match);
      if (game) {
        new BrowseView(this.app).show('棋譜', game);
      }
    });

    on(this.el.querySelector('.MatchButton'), 'click', () => {
      new MatchSettingsView(this.app).show(this.app.settings.match);
    });

    on(this.resumeButton, 'click', () => {
      if (this.app.settings.adjournedGame) {
        new ResumeView(this.app).show();
      }
    });
  }

  show() {
    this.bookSelect.replaceChildren(...[...this.app.bookMap.values()].map((book) => new Option(book.title, book.name)));
    setSelectValue(this.bookSelect, this.app.getState(['bn']));
    this.app.pushView(this);
  }

  onFocus() {
    this.updateVolumeSelect();
  }

  async start(mode) {
    const book = this.app.bookMap.get(this.bookSelect.value);
    const volume = book.volumeMap.get(this.volumeSelect.value);
    const records = await this.app.fetchRecords(book.name, volume.name);
    if (
      await new QuestionView(this.app).show(
        records,
        mode > 0 ? this.app.getState(['bs', book.name, 'vs', volume.name, 'ro']) || 0 : mode,
        `${book.title} ${volume.title}`,
        book.name,
        volume.name
      )
    ) {
      this.volumeSelect.selectedOptions[0].text = this.formatVolumeOption(
        volume,
        this.app.getState(['bs', book.name, 'vs', volume.name])
      );
      this.updateButtons();
    }
  }

  updateVolumeSelect() {
    const bookName = this.bookSelect.value;
    const bookState = this.app.getState(['bs', bookName]);
    const options = [];
    for (const volume of this.app.bookMap.get(bookName).volumeMap.values()) {
      options.push(new Option(this.formatVolumeOption(volume, bookState?.vs?.[volume.name]), volume.name));
    }
    this.volumeSelect.replaceChildren(...options);
    setSelectValue(this.volumeSelect, bookState?.vn);
    this.updateButtons();
  }

  formatVolumeOption(volume, volumeState) {
    return volume.title + (volumeState?.rc ? ` (${(volumeState?.ro || 0) + 1}/${volumeState.rc})` : '');
  }

  updateButtons() {
    this.continueButton.disabled = !this.app.getState([
      'bs',
      this.bookSelect.value,
      'vs',
      this.volumeSelect.value,
      'ro',
    ]);
    this.resumeButton.disabled = !this.app.settings.adjournedGame;
  }
}
