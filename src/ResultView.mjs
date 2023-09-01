/* eslint-env browser */

import { on, parseHtml } from './browser.mjs';

export default class ResultView {
  constructor(app) {
    this.el = parseHtml(`
      <div class="ResultView">
        <div class="MessageOutput Center"></div>
        <div class="Hole"></div>
        <div class="ItemList"></div>
      </div>
    `);
    this.app = app;
    this.messageOutput = this.el.querySelector('.MessageOutput');
    this.itemList = this.el.querySelector('.ItemList');

    on(this.el.querySelector('.Hole'), 'click', () => this.hide());
  }

  show(message, texts, success = false) {
    this.messageOutput.textContent = `${success ? '成功' : '失敗'}: ${message}`;
    this.messageOutput.classList.toggle('Success', success);
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
    this.app.popView();
    if (this.resolve) {
      this.resolve(value);
      this.resolve = null;
    }
  }
}
