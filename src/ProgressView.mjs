import { parseHtml } from './browser.mjs';

export default class ProgressView {
  constructor(app) {
    this.app = app;
    this.el = parseHtml(`<div class="ProgressView Center">処理中</div>`);
  }

  show() {
    this.app.pushView(this);
  }

  hide() {
    this.app.popView();
  }
}
