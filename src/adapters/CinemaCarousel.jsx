/**
 * CinemaCarousel — React 适配组件（无构建依赖，复制进任意 React 16.8+ 项目即可）
 *
 * 项目内使用（推荐）：
 *   import { createCarousel } from 'cinema-carousel/src/cinema-carousel.core.js';
 *   （把下面 `const { createCarousel } = window.CinemaCarouselCore;` 换成这行 import）
 *
 * Props:
 *   items        必填，[{ src, alt, title, desc, href?, eyebrow? }]
 *   initialIndex 初始展开卡片，默认 0
 *   autoplay     自动轮播间隔 ms，0 = 关闭
 *   loop         是否循环，默认 false
 *   showControls 是否渲染底部控制条，默认 true
 *   onChange     (index) => void，展开卡片变化时触发
 */
const { createCarousel } = window.CinemaCarouselCore;

function CinemaCarousel({
  items,
  initialIndex = 0,
  autoplay = 0,
  loop = false,
  showControls = true,
  onChange,
}) {
  const coreRef = React.useRef(null);
  if (!coreRef.current) {
    // 惰性初始化：首次渲染即创建状态机，保证 render 时快照可用
    coreRef.current = createCarousel({ count: items.length, initialIndex, autoplay, loop });
  }
  const core = coreRef.current;
  const [snap, setSnap] = React.useState(core.getState());
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;

  React.useEffect(() => {
    const unsub = core.subscribe((s) => {
      setSnap(s);
      onChangeRef.current && onChangeRef.current(s.index);
    });
    if (autoplay > 0) core.startAutoplay();
    return () => { unsub(); core.destroy(); };
    // items.length 变化属于重建场景，其余 props 变化不重建
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const state = snap;

  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') core.prev({ user: true });
    if (e.key === 'ArrowRight') core.next({ user: true });
  };

  const pad2 = (n) => String(n).padStart(2, '0');

  return (
    <div className="cc-stage" tabIndex={0} onKeyDown={onKeyDown}>
      <div className="cc-carousel">
        {items.map((item, i) => (
          <article
            key={i}
            className={
              'cc-card' +
              (i === state.index ? ' is-active' : '') +
              (state.collapsed[i] ? ' is-collapsed' : '')
            }
            onClick={() => core.goTo(i, { user: true })}
          >
            <img className="cc-card__img" src={item.src} alt={item.alt || ''} draggable={false} />
            <div className="cc-card__scrim" />
            <header className="cc-card__head">
              <span className="cc-card__num">{pad2(i + 1)}</span>
              <span className="cc-card__num cc-card__num--end">{pad2(i + 1)}</span>
            </header>
            <p className="cc-card__eyebrow">
              <span className="cc-dot" />
              {item.eyebrow || 'VISUAL IDENTITY'}
            </p>
            <h2 className="cc-card__title">{item.title}</h2>
            <div className="cc-card__body">
              <div className="cc-card__info">
                <span className="cc-card__index">{pad2(i + 1)}</span>
                <h3 className="cc-card__heading">{item.title}</h3>
                <p className="cc-card__desc">
                  {(item.desc || '').split('\n').map((line, k, arr) => (
                    <React.Fragment key={k}>
                      {line}
                      {k < arr.length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </p>
                {item.href && (
                  <a className="cc-card__cta" href={item.href} onClick={(e) => e.stopPropagation()}>
                    View project
                    <span className="cc-card__cta-arrow">
                      <svg viewBox="0 0 16 16" fill="none">
                        <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" stroke="#111" strokeWidth="1.5"
                          strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </a>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {showControls && (
        <footer className="cc-controls">
          <div className="cc-controls__counter">
            <span className="cc-counter-current">{pad2(state.index + 1)}</span>{' '}
            <span className="cc-controls__total">/ {pad2(items.length)}</span>
          </div>
          <div
            className="cc-controls__progress"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              core.goTo(Math.round(ratio * (items.length - 1)), { user: true });
            }}
          >
            <div
              className="cc-controls__bar"
              style={{
                width: `${100 / items.length}%`,
                left: `${(100 / items.length) * state.index}%`,
              }}
            />
          </div>
          <div className="cc-controls__nav">
            <button
              className="cc-nav-btn cc-prev"
              aria-label="上一张"
              disabled={state.index === 0 && !loop}
              onClick={() => core.prev({ user: true })}
            >
              <svg viewBox="0 0 20 20" fill="none">
                <path d="M11.5 5.5 7 10l4.5 4.5" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              className="cc-nav-btn cc-next"
              aria-label="下一张"
              disabled={state.index === items.length - 1 && !loop}
              onClick={() => core.next({ user: true })}
            >
              <svg viewBox="0 0 20 20" fill="none">
                <path d="M8.5 5.5 13 10l-4.5 4.5" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}

// 打包器场景：取消下面这行注释（或改为 export default CinemaCarousel）
// export default CinemaCarousel;
