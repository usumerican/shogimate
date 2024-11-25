/* global __APP_VERSION__, YaneuraOu_sse42, YaneuraOu_nosimd */

import { simd } from 'wasm-feature-detect';
import App from './App.mjs';
import ShogiEngine from './ShogiEngine.mjs';

window[App.NAME] = (id) => {
  if (!window.crossOriginIsolated) {
    alert('Not crossOriginIsolated');
    return;
  }
  onunhandledrejection = (ev) => alert(ev.reason?.message || JSON.stringify(ev.reason));
  // visualViewport.onresize = () => (document.documentElement.style.height = visualViewport.height + 'px');
  // visualViewport.onscroll = () => (document.documentElement.scrollTop = 0);
  simd().then((simdValue) => {
    console.log(`simd: ${simdValue}`);
    const engine = new ShogiEngine(simdValue ? YaneuraOu_sse42 : YaneuraOu_nosimd);
    engine.init();
    new App(id, document.title, __APP_VERSION__, engine).start();
  });
};
