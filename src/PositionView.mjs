import ExportView from './ExportView.mjs';
import ImportView from './ImportView.mjs';
import ShogiPanel from './ShogiPanel.mjs';
import View from './View.mjs';
import { on } from './browser.mjs';
import {
  baseCounts,
  defaultSfen,
  Game,
  getPieceBase,
  handBases,
  parseSfen,
  Position,
  sides,
  squareN,
  Step,
} from './shogi.mjs';

export default class PositionView extends View {
  constructor() {
    super(`
      <div class="PositionView">
        <div class="Center">局面編集</div>
        <canvas class="ShogiPanel"></canvas>
        <div class="ToolBar">
          <button class="EmptyButton">空にする</button>
          <button class="DefaultButton">平手にする</button>
          <button class="ImportButton">読み込み</button>
          <button class="ExportButton">書き出し</button>
        </div>
        <div class="ToolBar">
          <button class="CloseButton">キャンセル</button>
          <button class="SubmitButton">決定</button>
        </div>
      </div>
    `);
    this.shogiPanel = new ShogiPanel(this.el.querySelector('.ShogiPanel'), this, true);

    on(this.el.querySelector('.CloseButton'), 'click', () => {
      this.hide();
    });

    on(this.el.querySelector('.EmptyButton'), 'click', () => {
      this.shogiPanel.step.position = new Position();
      this.update();
    });

    on(this.el.querySelector('.DefaultButton'), 'click', () => {
      this.shogiPanel.step.position = parseSfen(defaultSfen);
      this.update();
    });

    on(this.el.querySelector('.ImportButton'), 'click', async () => {
      const game = await new ImportView().show(this);
      if (game) {
        this.shogiPanel.step.position = game.startStep.position;
        this.update();
      }
    });

    on(this.el.querySelector('.ExportButton'), 'click', async () => {
      await new ExportView().show(this.app, this.shogiPanel.game, this.shogiPanel.step);
    });

    on(this.el.querySelector('.SubmitButton'), 'click', () => {
      this.hide(this.shogiPanel.step);
    });
  }

  onShow(step) {
    this.shogiPanel.app = this.app;
    this.shogiPanel.step = new Step({ position: new Position(step.position) });
    this.shogiPanel.game = new Game({ startStep: this.shogiPanel.step });
    this.update();
  }

  onPointerBefore() {
    return true;
  }

  update() {
    this.shogiPanel.stockCounts = baseCounts.slice();
    for (let sq = 0; sq < squareN; sq++) {
      const piece = this.shogiPanel.step.position.getPiece(sq);
      if (piece) {
        this.shogiPanel.stockCounts[getPieceBase(piece)]--;
      }
    }
    for (const side of sides) {
      for (const base of handBases) {
        const handCount = this.shogiPanel.step.position.getHandCount(side, base);
        if (handCount) {
          this.shogiPanel.stockCounts[base] -= handCount;
        }
      }
    }
    this.shogiPanel.request();
  }
}
