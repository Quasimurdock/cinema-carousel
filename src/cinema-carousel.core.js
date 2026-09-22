/**
 * cinema-carousel core — 框架无关的轮播状态机
 *
 * UMD 双格式：
 *   - 浏览器 <script> 引入 → 挂载 window.CinemaCarouselCore.createCarousel
 *   - CommonJS（打包器）→ const { createCarousel } = require('.../core.js')
 *
 * 不操作任何 DOM：只维护「哪张展开、哪些折叠」的状态与自动轮播计时。
 * DOM 呈现交给适配层（adapters/vanilla.js / react.jsx / vue3.vue）。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CinemaCarouselCore = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /**
   * @param {Object} options
   * @param {number}  options.count        卡片总数（必填）
   * @param {number} [options.initialIndex] 初始展开的卡片，默认 0
   * @param {number} [options.autoplay]   自动轮播间隔 ms，0/缺省 = 关闭
   * @param {boolean}[options.loop]       到末尾后是否循环，默认 false
   * @returns 轮播控制器实例
   */
  function createCarousel(options) {
    if (!options || !(options.count > 0)) {
      throw new Error('[cinema-carousel] options.count (>=1) is required');
    }
    var count = Math.floor(options.count);
    var autoplayMs = options.autoplay > 0 ? options.autoplay : 0;
    var loop = !!options.loop;
    var index = clamp(Math.floor(options.initialIndex || 0), 0, count - 1);

    var timer = null;
    var autoplaying = false;
    var subscribers = new Set();
    var state = buildState();

    function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

    function buildState() {
      var collapsed = [];
      for (var i = 0; i < count; i++) collapsed.push(i !== index);
      return { index: index, count: count, collapsed: collapsed, autoplaying: autoplaying };
    }

    function emit() {
      state = buildState();
      subscribers.forEach(function (fn) { fn(state); });
    }

    /**
     * 展开第 i 张
     * @param {number} i    目标索引
     * @param {Object}[o]   { user: true } 表示来自用户交互 → 停止自动轮播
     */
    function expand(i, o) {
      var user = !o || o.user !== false;
      var target = clamp(i, 0, count - 1);
      if (target === index) return;
      if (user) stopAutoplay();
      index = target;
      emit();
    }

    function next(o) {
      var t = index + 1;
      if (t > count - 1) { if (!loop) return; t = 0; }
      expand(t, o);
    }

    function prev(o) {
      var t = index - 1;
      if (t < 0) { if (!loop) return; t = count - 1; }
      expand(t, o);
    }

    function startAutoplay() {
      if (!autoplayMs || timer) return;
      autoplaying = true;
      timer = setInterval(function () { next({ user: false }); }, autoplayMs);
      emit();
    }

    function stopAutoplay() {
      if (timer) { clearInterval(timer); timer = null; }
      if (autoplaying) { autoplaying = false; emit(); }
    }

    /** 订阅状态变化；订阅时立即回调一次当前状态（便于 React/Vue 初始化） */
    function subscribe(fn) {
      subscribers.add(fn);
      fn(state);
      return function unsubscribe() { subscribers.delete(fn); };
    }

    function destroy() {
      stopAutoplay();
      subscribers.clear();
    }

    return {
      /** 展开/跳转 */ goTo: expand,
      expand: expand,
      next: next,
      prev: prev,
      startAutoplay: startAutoplay,
      stopAutoplay: stopAutoplay,
      /** 当前状态快照 { index, count, collapsed[], autoplaying } */
      getState: function () { return state; },
      /** 是否开启循环 */
      isLoop: function () { return loop; },
      subscribe: subscribe,
      destroy: destroy
    };
  }

  return { createCarousel: createCarousel };
});
