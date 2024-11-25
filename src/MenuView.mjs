import View from './View.mjs';
import { on } from './browser.mjs';

export default class MenuView extends View {
  constructor() {
    super(`
      <div class="MenuView">
        <div class="Content">
          <div class="MessageOutput Center"></div>
          <div class="ItemList"></div>
        </div>
      </div>
    `);
    this.messageOutput = this.el.querySelector('.MessageOutput');
    this.itemList = this.el.querySelector('.ItemList');

    on(this.el.querySelector('.Content'), 'click', () => {});

    on(this.el, 'click', () => this.hide());
  }

  onShow(message, items) {
    this.messageOutput.textContent = message;
    this.itemList.replaceChildren(
      ...items.map((item) => {
        const button = document.createElement('button');
        button.textContent = item.title;
        button.disabled = item.disabled;
        on(button, 'click', () => {
          this.hide();
          item.callback();
        });
        return button;
      }),
    );
  }
}
