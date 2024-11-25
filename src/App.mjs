import ConfirmView from './ConfirmView.mjs';
import HomeView from './HomeView.mjs';
import { KING, kindInfos, makePiece, getMovePhonemes } from './shogi.mjs';

export default class App {
  static NAME = 'shogimate';

  constructor(id, title, version, engine) {
    this.id = id || App.NAME;
    this.title = title;
    this.version = version;
    this.engine = engine;
  }

  start() {
    this.el = document.getElementById(this.id) || document.body;
    this.el.classList.add(App.NAME);
    this.timeoutMap = new Map();
    this.soundDataMap = new Map();
    this.recordsCache = new Map();
    this.state = this.loadItem('state') || {};
    this.settings = this.loadItem('settings') || {};
    this.collection = new Set(this.loadItem('collection') || []);
    this.pieceSounds = [
      {
        name: '',
        title: 'なし',
      },
      {
        name: 'shogi-drop',
        title: '将棋の駒を打つ',
      },
      {
        name: 'slap',
        title: '平手打ち',
      },
      {
        name: 'click',
        title: 'クリック',
      },
      {
        name: 'chick-cheep',
        title: 'ヒヨコの鳴き声',
      },
    ];
    const pieceStyles = [
      {
        name: 'black-red',
        title: '標準',
        bodyColors: ['#fe9', '#fe9'],
        textColors: ['#000', '#000'],
        promotedColors: ['#f00', '#f00'],
        filterColors: ['#6666', '#9996'],
      },
      {
        name: 'black-white',
        title: '黒対白',
        bodyColors: ['#000', '#fff'],
        textColors: ['#fff', '#000'],
        promotedColors: ['#0ff', '#f00'],
        filterColors: ['#6666', '#9996'],
      },
      {
        name: 'blue-red',
        title: '青対赤',
        bodyColors: ['#ddf', '#fdd'],
        textColors: ['#00c', '#c00'],
        promotedColors: ['#60f', '#f06'],
        filterColors: ['#ccf6', '#fcc6'],
      },
    ];
    this.defaultPieceStyle = pieceStyles[0];
    this.pieceStyleMap = pieceStyles.reduce((map, style) => map.set(style.name, style), new Map());
    const pieceTitleSets = [
      {
        name: 'name',
        title: '標準',
        titles: kindInfos.map((info) => info.name),
      },
      {
        name: 'char',
        title: '一文字',
        titles: kindInfos.map((info) => info.char),
      },
      {
        name: 'title',
        title: '二文字',
        titles: [
          '',
          '歩兵',
          '香車',
          '桂馬',
          '銀将',
          '角行',
          '飛車',
          '金将',
          '玉将',
          'と金',
          '成香',
          '成桂',
          '成銀',
          '竜馬',
          '龍王',
        ],
      },
      {
        name: 'en',
        title: '英字',
        titles: kindInfos.map((info) => info.usi),
      },
      {
        name: 'animal',
        title: '動物絵文字',
        titles: ['', '🐥', '🐭', '🐰', '🐵', '🐯', '🐻', '🐶', '🦁', '🐔', '🐁', '🐇', '🐒', '🦄', '🐲'],
      },
    ].map((titleSet) => {
      titleSet.titles = titleSet.titles.reduce((arr, title, kind) => {
        arr[kind] = title;
        arr[makePiece(kind, 1)] = kind === KING ? title.replace('玉', '王') : title;
        return arr;
      }, []);
      return titleSet;
    });
    this.defaultPieceTitleSet = pieceTitleSets[0];
    this.pieceTitleSetMap = pieceTitleSets.reduce((map, titleSet) => map.set(titleSet.name, titleSet), new Map());
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
      { name: 'nextmove', title: '次の一手(参考)', volumeCount: 5 },
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
    this.viewStack = [];
    new HomeView().show(this);
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

  saveSettings() {
    this.saveItem('settings', this.settings);
  }

  saveCollection() {
    this.saveItem('collection', [...this.collection]);
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
    await new ConfirmView().show(this, 'クリップボードにコピーしました。', ['OK']);
  }

  async readFromClipboard() {
    try {
      return await navigator.clipboard.readText();
    } catch (e) {
      console.error(e);
    }
    return '';
  }

  initAudio() {
    if (this.settings.pieceSoundName || this.settings.speech) {
      this.playPieceSound(0);
      this.speakMoveText('');
    }
  }

  async playSound(name, duration) {
    if (!name) {
      return;
    }
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    let soundData = this.soundDataMap.get(name);
    if (!soundData) {
      soundData = await this.audioContext.decodeAudioData(await (await fetch(`sound/${name}.mp3`)).arrayBuffer());
      this.soundDataMap.set(name, soundData);
    }
    const soundSource = this.audioContext.createBufferSource();
    soundSource.buffer = soundData;
    soundSource.connect(this.audioContext.destination);
    soundSource.start(0, 0, duration);
  }

  async playPieceSound(duration) {
    await this.playSound(this.settings.pieceSoundName, duration);
  }

  getPieceStyle() {
    return this.pieceStyleMap.get(this.settings.pieceStyleName) || this.defaultPieceStyle;
  }

  getPieceTitleSet() {
    return this.pieceTitleSetMap.get(this.settings.pieceTitleSetName) || this.defaultPieceTitleSet;
  }

  speakText(text) {
    const uttr = new SpeechSynthesisUtterance(text);
    uttr.lang = 'ja-JP';
    uttr.volume = 0.5;
    speechSynthesis.speak(uttr);
  }

  speakMoveText(moveText) {
    if (!this.settings.speech) {
      return;
    }
    this.speakText(getMovePhonemes(moveText).join(' '));
  }
}
