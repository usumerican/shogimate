import View from './View.mjs';
import { on } from './browser.mjs';

export default class ConfirmView extends View {
  constructor() {
    super(`
      <div class="ConfirmView">
        <div class="Content">
          <div class="MessageOutput Center"></div>
          <div class="ItemList"></div>
        </div>
      </div>
    `);
    this.messageOutput = this.el.querySelector('.MessageOutput');
    this.itemList = this.el.querySelector('.ItemList');
  }

  onShow(message, texts) {
    this.messageOutput.textContent = message;
    this.itemList.replaceChildren(
      ...texts.map((t, i) => {
        const button = document.createElement('button');
        button.textContent = t;
        on(button, 'click', () => this.hide(i));
        return button;
      }),
    );
  }
}
