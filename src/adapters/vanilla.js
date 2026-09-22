/**
 * cinema-carousel vanilla 适配层 — 把核心状态机绑到声明式 HTML 上
 *
 * 用法：页面里写好 .cc-stage > (.cc-carousel > .cc-card…) [+.cc-controls]，
 * 然后 bindCarousel(stageEl, options)。见 /index.html 演示。
 *
 * UMD：<script> 引入 → window.CinemaCarouselVanilla.bindCarousel
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../cinema-carousel.core.js'));
  } else {
    root.CinemaCarouselVanilla = factory(root.CinemaCarouselCore);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Core) {
  'use strict';

  var pad2 = function (n) { return String(n).padStart(2, '0'); };

  var ARROW_SVG =
    '<svg viewBox="0 0 16 16" fill="none"><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" ' +
    'stroke="#111" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /**
   * @param {HTMLElement} stageEl 包含 .cc-carousel（与可选 .cc-controls）的容器
   * @param {Object} [opts] { initialIndex, autoplay, loop }
   * @returns {{ core: Object, destroy: Function }}
   */
  function bindCarousel(stageEl, opts) {
    opts = opts || {};
    var carouselEl = stageEl.querySelector('.cc-carousel');
    var cards = Array.prototype.slice.call(carouselEl.querySelectorAll('.cc-card'));
    if (!cards.length) throw new Error('[cinema-carousel] no .cc-card found');

    var controls = stageEl.querySelector('.cc-controls');
    var counterEl = controls && controls.querySelector('.cc-counter-current');
    var totalEl = controls && controls.querySelector('.cc-controls__total');
    var progressEl = controls && controls.querySelector('.cc-controls__progress');
    var barEl = controls && controls.querySelector('.cc-controls__bar');
    var prevBtn = controls && controls.querySelector('.cc-prev');
    var nextBtn = controls && controls.querySelector('.cc-next');

    if (totalEl) totalEl.textContent = '/ ' + pad2(cards.length);

    // 为每张卡片补齐默认结构（编号、箭头 SVG 等可选增强）
    cards.forEach(function (card, i) {
      card.setAttribute('data-index', i);
      card.querySelector('.cc-card__cta-arrow') && (card.querySelector('.cc-card__cta-arrow').innerHTML = ARROW_SVG);
    });

    var core = Core.createCarousel({
      count: cards.length,
      initialIndex: opts.initialIndex || 0,
      autoplay: opts.autoplay || 0,
      loop: !!opts.loop
    });

    function apply(s) {
      cards.forEach(function (card, i) {
        card.classList.toggle('is-active', i === s.index);
        card.classList.toggle('is-collapsed', s.collapsed[i]);
      });
      if (counterEl) counterEl.textContent = pad2(s.index + 1);
      if (barEl) {
        var seg = 100 / s.count;
        barEl.style.width = seg + '%';
        barEl.style.left = seg * s.index + '%';
      }
      if (prevBtn) prevBtn.disabled = s.index === 0 && !core.isLoop();
      if (nextBtn) nextBtn.disabled = s.index === s.count - 1 && !core.isLoop();
    }

    var unsubscribe = core.subscribe(apply);

    function onCardClick(i) { core.goTo(i, { user: true }); }
    function onKeydown(e) {
      if (e.key === 'ArrowLeft') { core.prev({ user: true }); }
      else if (e.key === 'ArrowRight') { core.next({ user: true }); }
    }
    function onProgressClick(e) {
      var rect = progressEl.getBoundingClientRect();
      var ratio = (e.clientX - rect.left) / rect.width;
      core.goTo(Math.round(ratio * (core.getState().count - 1)), { user: true });
    }

    var cardHandlers = cards.map(function (card, i) {
      var h = function () { onCardClick(i); };
      card.addEventListener('click', h);
      return h;
    });

    if (prevBtn) prevBtn.addEventListener('click', function () { core.prev({ user: true }); });
    if (nextBtn) nextBtn.addEventListener('click', function () { core.next({ user: true }); });
    if (progressEl) progressEl.addEventListener('click', onProgressClick);
    document.addEventListener('keydown', onKeydown);

    if (opts.autoplay > 0) core.startAutoplay();

    return {
      core: core,
      destroy: function () {
        unsubscribe();
        document.removeEventListener('keydown', onKeydown);
        if (progressEl) progressEl.removeEventListener('click', onProgressClick);
        cards.forEach(function (card, i) { card.removeEventListener('click', cardHandlers[i]); });
        core.destroy();
      }
    };
  }

  return { bindCarousel: bindCarousel };
});
