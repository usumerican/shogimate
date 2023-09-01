/* eslint-env browser */

import CollectionView from './CollectionView.mjs';
import ConfirmView from './ConfirmView.mjs';
import ExportView from './ExportView.mjs';
import HomeView from './HomeView.mjs';
import ImportView from './ImportView.mjs';
import MenuView from './MenuView.mjs';
import QuestionView from './QuestionView.mjs';
import ResultView from './ResultView.mjs';

export default class App {
  static NAME = 'shogimate';

  constructor(id, title, version, engine) {
    this.id = id || App.NAME;
    this.title = title;
    this.version = version;
    this.engine = engine;
  }

  start() {
    this.root = document.getElementById(this.id) || document.body;
    this.root.classList.add(App.NAME);
    this.timeoutMap = new Map();
    this.state = this.loadItem('state') || {};
    this.collection = new Set(this.loadItem('collection') || []);
    this.limitSet = new Set(this.loadItem('limits') || []);
    this.bookMap = [
      { name: 'mate3', title: '実戦詰3手', volumeCount: 998 },
      { name: 'mate5', title: '実戦詰5手', volumeCount: 998 },
      { name: 'mate7', title: '実戦詰7手', volumeCount: 998 },
      { name: 'mate9', title: '実戦詰9手', volumeCount: 998 },
      { name: 'mate11', title: '実戦詰11手', volumeCount: 998 },
      { name: 'extra1', title: '別冊・実戦詰1手', volumeCount: 2 },
      { name: 'extra3', title: '別冊・実戦詰3手', volumeCount: 2 },
      { name: 'extra5', title: '別冊・実戦詰5手', volumeCount: 2 },
      { name: 'extra7', title: '別冊・実戦詰7手', volumeCount: 3 },
      { name: 'extra9', title: '別冊・実戦詰9手', volumeCount: 3 },
    ].reduce((bookMap, book) => {
      book.volumeMap = [...Array(book.volumeCount).keys()].reduce((volumeMap, i) => {
        const volume = {
          name: ('' + i).padStart(3, '0'),
        };
        volume.title = `第${i + 1}巻`;
        volumeMap.set(volume.name, volume);
        return volumeMap;
      }, new Map());
      bookMap.set(book.name, book);
      return bookMap;
    }, new Map());
    this.recordsCache = new Map();
    this.viewStack = [];
    this.confirmView = new ConfirmView(this);
    this.menuView = new MenuView(this);
    this.questionView = new QuestionView(this);
    this.resultView = new ResultView(this);
    this.collectionView = new CollectionView(this);
    this.importView = new ImportView(this);
    this.exportView = new ExportView(this);
    new HomeView(this).show();
  }

  pushView(view) {
    this.viewStack.unshift(view);
    this.root.appendChild(view.el);
    this.focusView(view);
  }

  popView() {
    if (this.viewStack.length > 1) {
      this.root.removeChild(this.viewStack.shift().el);
      this.focusView(this.viewStack[0]);
    }
  }

  focusView(view) {
    view.el.querySelector('button:not(:disabled)')?.focus();
  }

  loadItem(key) {
    const item = localStorage.getItem(this.id + '/' + key);
    return item ? JSON.parse(item) : null;
  }

  saveItem(key, value, delay = 1000) {
    const clearId = this.timeoutMap.get(key);
    if (clearId) {
      clearTimeout(clearId);
    }
    const timeoutId = setTimeout(() => {
      if (this.timeoutMap.get(key) === timeoutId) {
        this.timeoutMap.delete(key);
        localStorage.setItem(this.id + '/' + key, JSON.stringify(value));
      }
    }, delay);
    this.timeoutMap.set(key, timeoutId);
  }

  saveCollection() {
    this.saveItem('collection', [...this.collection]);
  }

  saveLimitSet() {
    this.saveItem('limits', [...this.limitSet]);
  }

  getState(names) {
    let state = this.state;
    for (const name of names) {
      state = state[name];
      if (!state) {
        break;
      }
    }
    return state;
  }

  setState(names, value) {
    let state = this.state;
    const n = names.length - 1;
    for (let i = 0; i < n; i++) {
      const name = names[i];
      let value = state[name];
      if (!value) {
        value = state[name] = {};
      }
      state = value;
    }
    state[names[n]] = value;
  }

  saveState() {
    this.saveItem('state', this.state);
  }

  async fetchRecords(bookName, volumeName) {
    const url = `data/${bookName}/${volumeName}.txt`;
    let records = this.recordsCache.get(url);
    if (!records) {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`${res.statusText}: ${res.url}`);
      }
      records = (await res.text())
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line);
      this.recordsCache.set(url, records);
    }
    this.setState(['bn'], bookName);
    this.setState(['bs', bookName, 'vn'], volumeName);
    this.saveState();
    return records;
  }

  async writeToClipboard(text) {
    await navigator.clipboard.writeText(text);
    console.log(text);
    await this.confirmView.show('クリップボードにコピーしました。', ['OK']);
  }
}
