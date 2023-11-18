/* eslint-env browser */

import { on, parseHtml } from './browser.mjs';

export default class ConfirmView {
  constructor(app) {
    this.app = app;
    this.el = parseHtml(`
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

  show(message, texts) {
    this.messageOutput.textContent = message;
    this.itemList.replaceChildren(
      ...texts.map((t, i) => {
        const button = document.createElement('button');
        button.textContent = t;
        on(button, 'click', () => this.hide(i));
        return button;
      })
    );
    this.app.pushView(this);
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  hide(value) {
    this.app.popView(this);
    if (this.resolve) {
      this.resolve(value);
      this.resolve = null;
    }
  }
}
