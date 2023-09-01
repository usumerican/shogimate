# 詰将棋メイト

詰将棋メイトは、ブラウザ上で動作する詰将棋・実戦詰アプリです。

王手の連続で相手の玉を詰ますと成功です。駒余り、余詰、無駄合などは許容します。

実戦詰の設問には、[やねうら王の詰将棋データ](https://yaneuraou.yaneu.com/2020/12/25/christmas-present/) を使いました。

実戦詰の解答例には、[KomoringHeights v1.0.0](https://github.com/komori-n/KomoringHeights) を使いました。

将棋エンジンには、[やねうら王 + 水匠(SuishoPetite) の WebAssembly 版を調整したもの](https://github.com/usumerican/yaneuraou-suisho-petite) を使っています。

WebAssembly SIMD の判別には、[WebAssembly Feature Detection](https://github.com/GoogleChromeLabs/wasm-feature-detect) を使っています。

## 開発

Node.js が必要です。

```
npm install
npm test
npm run dev
npm run build
npm run preview
```
