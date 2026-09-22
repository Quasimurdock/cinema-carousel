<!--
  CinemaCarousel — Vue 3 适配组件（<script setup>，复制进任意 Vue 3 项目即可）

  项目内使用（推荐）：
    import { createCarousel } from 'cinema-carousel/src/cinema-carousel.core.js';
    （把下面 `const { createCarousel } = window.CinemaCarouselCore;` 换成这行 import）

  用法：
    <CinemaCarousel :items="items" :initial-index="0" :autoplay="4500" @change="i => ..." />
-->
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const { createCarousel } = window.CinemaCarousel;

const props = defineProps({
  items: { type: Array, required: true },        // [{ src, alt, title, desc, href?, eyebrow? }]
  initialIndex: { type: Number, default: 0 },
  autoplay: { type: Number, default: 0 },        // ms，0 = 关闭
  loop: { type: Boolean, default: false },
  showControls: { type: Boolean, default: true },
});

const emit = defineEmits(['change']);

const pad2 = (n) => String(n).padStart(2, '0');
const index = ref(props.initialIndex);
let core = null;
let unsub = null;

function cardCls(i) {
  return [
    'cc-card',
    { 'is-active': i === index.value },
    { 'is-collapsed': i !== index.value },
  ];
}

function onProgressClick(e) {
  const rect = e.currentTarget.getBoundingClientRect();
  const ratio = (e.clientX - rect.left) / rect.width;
  core?.goTo(Math.round(ratio * (props.items.length - 1)), { user: true });
}

onMounted(() => {
  core = createCarousel({
    count: props.items.length,
    initialIndex: props.initialIndex,
    autoplay: props.autoplay,
    loop: props.loop,
  });
  unsub = core.subscribe((s) => {
    index.value = s.index;
    emit('change', s.index);
  });
  if (props.autoplay > 0) core.startAutoplay();
});

onBeforeUnmount(() => {
  unsub?.();
  core?.destroy();
});
</script>

<template>
  <div class="cc-stage" tabindex="0" @keydown.left="core?.prev({ user: true })"
    @keydown.right="core?.next({ user: true })">
    <div class="cc-carousel">
      <article v-for="(item, i) in items" :key="i" :class="cardCls(i)"
        @click="core?.goTo(i, { user: true })">
        <img class="cc-card__img" :src="item.src" :alt="item.alt || ''" draggable="false" />
        <div class="cc-card__scrim" />
        <header class="cc-card__head">
          <span class="cc-card__num">{{ pad2(i + 1) }}</span>
          <span class="cc-card__num cc-card__num--end">{{ pad2(i + 1) }}</span>
        </header>
        <p class="cc-card__eyebrow">
          <span class="cc-dot" />
          {{ item.eyebrow || 'VISUAL IDENTITY' }}
        </p>
        <h2 class="cc-card__title">{{ item.title }}</h2>
        <div class="cc-card__body">
          <div class="cc-card__info">
            <span class="cc-card__index">{{ pad2(i + 1) }}</span>
            <h3 class="cc-card__heading">{{ item.title }}</h3>
            <p class="cc-card__desc" v-html="(item.desc || '').replace(/\n/g, '<br>')"></p>
            <a v-if="item.href" class="cc-card__cta" :href="item.href" @click.stop>
              View project
              <span class="cc-card__cta-arrow">
                <svg viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" stroke="#111" stroke-width="1.5"
                    stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
            </a>
          </div>
        </div>
      </article>
    </div>

    <footer v-if="showControls" class="cc-controls">
      <div class="cc-controls__counter">
        <span class="cc-counter-current">{{ pad2(index + 1) }}</span>
        <span class="cc-controls__total">/ {{ pad2(items.length) }}</span>
      </div>
      <div class="cc-controls__progress" @click="onProgressClick">
        <div class="cc-controls__bar"
          :style="{ width: 100 / items.length + '%', left: (100 / items.length) * index + '%' }" />
      </div>
      <div class="cc-controls__nav">
        <button class="cc-nav-btn cc-prev" aria-label="上一张"
          :disabled="index === 0 && !loop" @click="core?.prev({ user: true })">
          <svg viewBox="0 0 20 20" fill="none">
            <path d="M11.5 5.5 7 10l4.5 4.5" stroke="currentColor" stroke-width="1.5"
              stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <button class="cc-nav-btn cc-next" aria-label="下一张"
          :disabled="index === items.length - 1 && !loop" @click="core?.next({ user: true })">
          <svg viewBox="0 0 20 20" fill="none">
            <path d="M8.5 5.5 13 10l-4.5 4.5" stroke="currentColor" stroke-width="1.5"
              stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    </footer>
  </div>
</template>
