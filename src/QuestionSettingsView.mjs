import CollectionView from './CollectionView.mjs';
import QuestionView from './QuestionView.mjs';
import View from './View.mjs';
import { on, setSelectValue } from './browser.mjs';

export default class QuestionSettingsView extends View {
  constructor() {
    super(`
      <div class="QuestionSettingsView">
        <div class="Center">実戦詰将棋設定</div>
        <select class="BookSelect"></select>
        <select class="VolumeSelect"></select>
        <button class="ContinueButton">続きから</button>
        <button class="StartButton">始めから</button>
        <button class="ChallengeButton">チャレンジ</button>
        <button class="CollectionButton">コレクション</button>
        <button class="CloseButton">閉じる</button>
      </div>
    `);
    this.bookSelect = this.el.querySelector('.BookSelect');
    this.volumeSelect = this.el.querySelector('.VolumeSelect');
    this.continueButton = this.el.querySelector('.ContinueButton');

    on(this.el.querySelector('.CloseButton'), 'click', () => {
      this.hide();
    });

    on(this.bookSelect, 'change', () => {
      this.update();
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

    on(this.el.querySelector('.CollectionButton'), 'click', async () => {
      await new CollectionView().show(this);
    });
  }

  onShow() {
    this.bookSelect.replaceChildren(...[...this.app.bookMap.values()].map((book) => new Option(book.title, book.name)));
    setSelectValue(this.bookSelect, this.app.getState(['bn']));
    this.update();
  }

  async start(mode) {
    const book = this.app.bookMap.get(this.bookSelect.value);
    const volume = book.volumeMap.get(this.volumeSelect.value);
    const records = await this.app.fetchRecords(book.name, volume.name);
    if (
      await new QuestionView().show(
        this,
        records,
        mode > 0 ? this.app.getState(['bs', book.name, 'vs', volume.name, 'ro']) || 0 : mode,
        `${book.title} ${volume.title}`,
        book.name,
        volume.name,
      )
    ) {
      this.update();
    }
  }

  update() {
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
  }
}
