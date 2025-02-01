import { parseHtml } from './browser.mjs';

export default class View {
  constructor(html) {
    this.el = parseHtml(html);
  }

  show(parent, ...params) {
    this.parent = parent;
    this.app = this.parent.app || this.parent;
    this.onShow?.(...params);
    this.app.el.appendChild(this.el);
    this.focusView(this);
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  hide(value) {
    this.onHide?.();
    this.app.el.removeChild(this.el);
    this.focusView(this.parent);
    this.resolve?.(value);
  }

  focusView(view) {
    view.onFocus?.();
    view.el.querySelector('button:not(:disabled)')?.focus();
  }
}
