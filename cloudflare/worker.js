/**
 * GitHub Pages 反代 Worker —— cinema-carousel 及同账户项目通用
 *
 * 部署后：
 *   https://<你的子域>.workers.dev/cc/…           → quasimurdock.github.io/cinema-carousel/…
 *   https://<你的子域>.workers.dev/infinite-fly… → quasimurdock.github.io/<repo>/…（可扩展更多路由）
 *
 * 边缘缓存：静态资源缓存 24h，HTML 缓存 10 分钟，HTML 不缓存时也不回源 github.io 过频
 */

// 路由表：前缀 → GitHub Pages 仓库（加新项目就在这里加一行）
const ROUTES = {
  'cc': 'cinema-carousel',
  // 'demo': 'another-repo',
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const firstSeg = url.pathname.split('/')[1] || '';

    // 根路径给个简单索引页，避免裸 404
    if (!firstSeg) {
      return new Response(
        `<h3>cinema-carousel 反代已就绪</h3>
         <ul><li><a href="/cc/">/cc/ → cinema-carousel</a></li></ul>
         <p>用 <code>https://&lt;worker 域名&gt;/cc/</code> 访问站点。</p>`,
        { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } }
      );
    }

    const repo = ROUTES[firstSeg];
    if (!repo) return new Response('Unknown route', { status: 404 });

    // /cc/xxx → /cinema-carousel/xxx；/cc/ → /cinema-carousel/
    const path = url.pathname.replace(`/${firstSeg}`, '') || '/';
    const target = `https://quasimurdock.github.io/${repo}${path}${url.search}`;

    const accept = request.headers.get('accept') || '';
    const isHtml = accept.includes('text/html');

    const resp = await fetch(target, {
      redirect: 'follow',
      cf: {
        cacheEverything: true,
        cacheTtl: isHtml ? 600 : 86400,      // HTML 10min，静态资源 24h
        cacheTtlByStatus: { '200-299': undefined, 404: 60 },
      },
    });

    // 透传时保留必要头，去掉会干扰缓存的头
    const headers = new Headers(resp.headers);
    headers.set('x-proxied-by', 'cinema-carousel-worker');
    headers.delete('set-cookie');
    headers.set('cache-control', isHtml
      ? 'public, max-age=600'
      : 'public, max-age=86400');

    return new Response(resp.body, { status: resp.status, headers });
  },
};
