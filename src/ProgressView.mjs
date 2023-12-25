import View from './View.mjs';

export default class ProgressView extends View {
  constructor() {
    super(`<div class="ProgressView Center"></div>`);
  }

  onShow(message, background, time) {
    this.el.textContent = message;
    this.el.style.background = background;
    if (time) {
      setTimeout(() => {
        this.hide();
      }, time);
    }
  }
}
