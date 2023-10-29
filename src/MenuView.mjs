/* eslint-env browser */

import { on, parseHtml } from './browser.mjs';

export default class MenuView {
  constructor(app) {
    this.el = parseHtml(`
      <div class="MenuView">
        <div class="Content">
          <div class="MessageOutput Center"></div>
          <div class="ItemList"></div>
        </div>
      </div>
    `);
    this.app = app;
    this.messageOutput = this.el.querySelector('.MessageOutput');
    this.itemList = this.el.querySelector('.ItemList');

    on(this.el.querySelector('.Content'), 'click', () => {});

    on(this.el, 'click', () => this.hide());
  }

  show(message, items) {
    this.messageOutput.textContent = message;
    this.itemList.replaceChildren(
      ...items.map((item) => {
        const button = document.createElement('button');
        button.textContent = item.title;
        button.disabled = item.disabled;
        on(button, 'click', () => {
          item.callback();
          this.hide();
        });
        return button;
      })
    );
    this.app.pushView(this);
  }

  hide() {
    this.app.popView(this);
  }
}
