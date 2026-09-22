# cinema-carousel

复刻 [thrilled-need-423110.framer.app](https://thrilled-need-423110.framer.app/) 的折叠手风琴轮播（accordion carousel），重构为框架无关的可复用组件：**一套核心状态机 + 三个适配层（Vanilla / React / Vue3）**。

**在线演示**：<https://quasimurdock.github.io/cinema-carousel/>

## 效果

- 折叠手风琴布局：激活卡片展开占满，其余收成固定宽度细条（98px），`flex` 过渡完成动画
- 折叠卡：`writing-mode: vertical-rl` 竖排标题 + 顶部编号
- 激活卡：lime 眉标在左上、编号在右上、底部标题 / 描述 / CTA 圆钮
- 底部控制条：计数器、lime 进度条（可点击跳转）、圆形箭头按钮（边界置灰）
- 支持：点击切换、← / → 方向键、进度条跳转、自动轮播（用户交互后停止）、循环（可选）
- 纯原生实现，核心零依赖、约 130 行

## 目录结构

```
cinema-carousel/
├── index.html                     # Vanilla 演示（GitHub Pages 入口）
├── src/
│   ├── cinema-carousel.core.js    # 框架无关状态机（UMD：script 直引 / require 均可）
│   ├── cinema-carousel.css        # 组件样式（cc- 前缀，主题变量可覆盖）
│   └── adapters/
│       ├── vanilla.js             # DOM 绑定适配层
│       ├── CinemaCarousel.jsx     # React 16.8+ 组件
│       └── CinemaCarousel.vue     # Vue 3 SFC（<script setup>）
└── examples/
    ├── react.html                 # React 18 CDN 直跑示例
    └── vue.html                   # Vue 3 CDN 直跑示例
```

## 快速开始

所有页面都是静态 HTML，克隆后可直接打开，或起一个静态服务器：

```bash
npx serve .
# 浏览器打开
#   /                → Vanilla 演示
#   /examples/react  → React 18 CDN 示例
#   /examples/vue    → Vue 3 CDN 示例
```

## 三种用法

### 1. Vanilla（声明式 HTML + 一行绑定）

```html
<link rel="stylesheet" href="src/cinema-carousel.css">

<div class="cc-stage" id="stage">
  <div class="cc-carousel">
    <article class="cc-card">
      <img class="cc-card__img" src="a.jpg" alt="">
      <div class="cc-card__scrim"></div>
      <header class="cc-card__head">
        <span class="cc-card__num">01</span>
        <span class="cc-card__num cc-card__num--end">01</span>
      </header>
      <p class="cc-card__eyebrow"><span class="cc-dot"></span>VISUAL IDENTITY</p>
      <h2 class="cc-card__title">Beyond ordinary.</h2>
      <div class="cc-card__body">
        <div class="cc-card__info">
          <span class="cc-card__index">01</span>
          <h3 class="cc-card__heading">Beyond ordinary.</h3>
          <p class="cc-card__desc">Sharp geometry, bold statements.</p>
          <a class="cc-card__cta" href="#">View project <span class="cc-card__cta-arrow"></span></a>
        </div>
      </div>
    </article>
    <!-- 更多 .cc-card … -->
  </div>

  <footer class="cc-controls">
    <div class="cc-controls__counter">
      <span class="cc-counter-current">01</span> <span class="cc-controls__total">/ 04</span>
    </div>
    <div class="cc-controls__progress"><div class="cc-controls__bar"></div></div>
    <div class="cc-controls__nav">
      <button class="cc-nav-btn cc-prev" aria-label="上一张" disabled><!-- 箭头 svg --></button>
      <button class="cc-nav-btn cc-next" aria-label="下一张"><!-- 箭头 svg --></button>
    </div>
  </footer>
</div>

<script src="src/cinema-carousel.core.js"></script>
<script src="src/adapters/vanilla.js"></script>
<script>
  CinemaCarouselVanilla.bindCarousel(document.getElementById('stage'), {
    initialIndex: 1,   // 初始展开第 2 张
    autoplay: 4500,    // 自动轮播间隔 ms，0 = 关闭
    loop: false,       // 到边界后循环
  });
</script>
```

### 2. React 16.8+

复制 `src/adapters/CinemaCarousel.jsx` 与 `src/cinema-carousel.css` 到项目中，把组件头部的
`window.CinemaCarouselCore` 取值换成 `import { createCarousel } from '.../cinema-carousel.core.js'`（文件尾部有说明），然后：

```jsx
import CinemaCarousel from './adapters/CinemaCarousel';
import 'cinema-carousel/src/cinema-carousel.css';

const items = [
  { src: 'a.jpg', title: 'Beyond ordinary.', desc: 'Sharp geometry, bold statements.' },
  // …
];

<CinemaCarousel
  items={items}
  initialIndex={1}
  autoplay={4500}
  onChange={(index) => console.log(index)}
/>
```

### 3. Vue 3

复制 `src/adapters/CinemaCarousel.vue` 与 `src/cinema-carousel.css` 到项目中，同样把
`window.CinemaCarouselCore` 换成 import，然后：

```vue
<script setup>
import CinemaCarousel from './adapters/CinemaCarousel.vue';
import 'cinema-carousel/src/cinema-carousel.css';

const items = [/* 同上 */];
</script>

<template>
  <CinemaCarousel :items="items" :initial-index="1" :autoplay="4500" @change="(i) => …" />
</template>
```

## Core API（`createCarousel`）

| 成员 | 说明 |
| --- | --- |
| `goTo(i, {user})` / `expand(i, {user})` | 展开第 i 张；`user: true`（默认）会停止自动轮播 |
| `next()` / `prev()` | 相邻切换，`loop` 开启时环绕 |
| `startAutoplay()` / `stopAutoplay()` | 自动轮播控制 |
| `getState()` | 快照 `{ index, count, collapsed[], autoplaying }` |
| `isLoop()` | 是否开启循环 |
| `subscribe(fn)` | 订阅状态变化（订阅即回调一次；返回退订函数） |
| `destroy()` | 清理计时器与订阅 |

构造参数：`{ count, initialIndex?, autoplay?, loop? }`。

## 主题定制

样式全部走 CSS 变量，在宿主页面覆盖即可：

```css
.cc-stage {
  --cc-accent: #ff6b6b;   /* 强调色 */
  --cc-fold-w: 80px;      /* 折叠卡宽度 */
  --cc-dur: 0.5s;         /* 过渡时长 */
}
```

全部变量见 `src/cinema-carousel.css` 头部。

## 部署（GitHub Pages）

仓库内置 `.github/workflows/deploy-pages.yml`：push 到 `main` 自动把站点发布到 GitHub Pages
（也可在 Actions 页手动触发）。首次使用请在仓库 **Settings → Pages → Build and deployment →
Source** 选择 **GitHub Actions**。

## License

[MIT](LICENSE)
