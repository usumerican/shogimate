import { parseHtml } from './browser.mjs';

export default class ProgressView {
  constructor(app) {
    this.app = app;
    this.el = parseHtml(`<div class="ProgressView Center"></div>`);
  }

  show(message = '処理中', background = '#fff6', time) {
    this.el.textContent = message;
    this.el.style.background = background;
    this.app.pushView(this);
    if (time) {
      setTimeout(() => {
        this.hide();
      }, time);
    }
  }

  hide() {
    this.app.popView();
  }
}
