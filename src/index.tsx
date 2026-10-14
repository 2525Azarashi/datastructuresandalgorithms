import { Hono } from 'hono'

const app = new Hono()

const shell = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DS&amp;A — データ構造とアルゴリズム 学習ラボ</title>
  <meta name="description" content="データ構造とアルゴリズムを、動かして・触って・直感で理解するためのインタラクティブ学習サイト" />
  <meta name="theme-color" content="#0b0d11" />
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='7' fill='%230b0d11'/><circle cx='9' cy='22' r='3.2' fill='%23ffb547'/><circle cx='16' cy='10' r='3.2' fill='%23e9e6df'/><circle cx='23' cy='22' r='3.2' fill='%235ad8ff'/><path d='M9 22 16 10 23 22' stroke='%23e9e6df' stroke-width='1.6' fill='none'/></svg>" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@400;500;600;700&family=Zen+Kaku+Gothic+New:wght@400;500;700;900&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" />
  <link rel="stylesheet" href="/static/css/app.css" />
</head>
<body>
  <div id="grain" aria-hidden="true"></div>
  <header id="site-header"></header>
  <main id="app" tabindex="-1"></main>
  <footer id="site-footer"></footer>
  <div id="palette-root"></div>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script>
  <script type="module" src="/static/js/app.js"></script>
</body>
</html>`

app.get('/', (c) => c.html(shell))

export default app
