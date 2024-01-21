# 将棋メイト

「将棋メイト」は、スマホや PC のブラウザ上で動作する将棋アプリです。
パズルや詰将棋に挑戦したり、AI との対局や検討ができます。

「こまどり将棋」は、駒の動かし方を学べるパズルです。
駒を取る手を指し続けて、相手の駒を全て取れば成功です。
自分の玉が取られるような手は指せません。

「実戦詰将棋」では、1〜11 手の実戦詰、約 5,000,000 問に挑戦できます。
王手の連続で相手の玉を詰ますと成功です。
駒余り、余詰、無駄合などは許容します。

「AI 対局」では、レベル 0〜20 の AI と対局できます。
対局後は、AI を使った局面の検討や、棋譜を様々な形式で書き出すことができます。

将棋エンジンには、[やねうら王 + 水匠(SuishoPetite) の WebAssembly 版を調整したもの](https://github.com/usumerican/yaneuraou-suisho-petite) を使っています。

WebAssembly SIMD の判別には、[WebAssembly Feature Detection](https://github.com/GoogleChromeLabs/wasm-feature-detect) を使っています。

実戦詰の設問には、[やねうら王の詰将棋データ](https://yaneuraou.yaneu.com/2020/12/25/christmas-present/) を使っています。

実戦詰の解答例には、[KomoringHeights v1.0.0](https://github.com/komori-n/KomoringHeights) を使っています。

次の一手の設問は、[次の１手問題自動作成プログラムのデータ](https://github.com/tayayan/cshogi_util)を使っています。

効果音には、[効果音ラボ](https://soundeffect-lab.info/)の音源を使っています。

## 開発

Node.js が必要です。

```
npm install
npm test
npm run dev
npm run build
npm run preview
```
