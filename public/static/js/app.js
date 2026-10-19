import { h, $, $$, observeReveal, typeset, store } from './lib/ui.js'
import { LECTURES, UPCOMING } from './lectures/index.js'
import { avatar } from './lib/chars.js'
import { kinetic, curtain, initGlobalMotion } from './lib/motion.js'
import { renderHome } from './pages/home.js'
import { renderLecture } from './pages/lecture.js'
import { renderCheatsheet } from './pages/cheatsheet.js'
import { renderGlossary } from './pages/glossary.js'
import { openPalette } from './pages/palette.js'
import { sheet, closeSheet, skeleton, pullToRefresh } from './lib/patterns.js'
import { toast } from './lib/ui.js'
import { quizProgress } from './lib/quiz.js'

const BRAND = `<svg class="brand-mark" viewBox="0 0 40 40" aria-hidden="true"><rect x="2" y="4" width="36" height="34" rx="12" fill="#3d2e54"/><rect x="2" y="1.5" width="36" height="34" rx="12" fill="#ffd23f" stroke="#3d2e54" stroke-width="2.4"/><path d="M12 24 20 12 28 24" stroke="#3d2e54" stroke-width="2.4" fill="none" stroke-linejoin="round"/><circle cx="12" cy="24" r="4.2" fill="#ff8a3d" stroke="#3d2e54" stroke-width="2.2"/><circle cx="20" cy="12" r="4.2" fill="#fff" stroke="#3d2e54" stroke-width="2.2"/><circle cx="28" cy="24" r="4.2" fill="#3fa9f5" stroke="#3d2e54" stroke-width="2.2"/></svg>`

function header() {
  const el = $('#site-header')
  el.innerHTML = ''
  el.append(
    h('a.brand', { href: '#/', 'aria-label': 'ホーム', html: `${BRAND}<span>DS&amp;A Lab <small>/ データ構造とアルゴリズム</small></span>` }),
    h('nav.nav', { 'aria-label': 'メイン' },
      h('a.hide-sm', { href: '#/', 'data-nav': 'home' }, '講義'),
      h('a.hide-sm', { href: '#/cheatsheet', 'data-nav': 'cheatsheet' }, '計算量表'),
      h('a.hide-sm', { href: '#/glossary', 'data-nav': 'glossary' }, '用語集'),
      h('button.nav-search', { onclick: openPalette, 'aria-label': '検索' }, h('span.lbl', '検索'), h('kbd', '⌘K')),
      h('button.nav-menu.show-sm', { onclick: openMenu, 'aria-label': 'メニューを開く', 'aria-haspopup': 'dialog', html: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg>' })),
    h('div.progress-bar'))
  addEventListener('scroll', onScroll, { passive: true })
}
// ---- Bottom Sheet: モバイルのメインメニュー ----
function openMenu() {
  const cur = location.hash || '#/'
  const link = (href, t, sub, ic) => h('a.menu-link', { href, class: cur === href || (href !== '#/' && cur.startsWith(href)) ? 'on' : '', onclick: () => m.close(true) }, h('span.menu-ic', { html: ic }), h('span', h('b', t), sub ? h('small', sub) : null), h('span.menu-arr', '→'))
  const m = sheet({
    title: 'メニュー', sub: 'どこへ行く？', label: 'メインメニュー',
    body: [
      h('div.menu-grid',
        link('#/', 'ホーム', '講義一覧', '<svg viewBox="0 0 24 24"><path d="M4 11 12 4l8 7v9H4z" fill="#ffe0cc" stroke="#3d2e54" stroke-width="2" stroke-linejoin="round"/></svg>'),
        link('#/cheatsheet', '計算量表', 'O(…) を一枚に', '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4" fill="#d8eeff" stroke="#3d2e54" stroke-width="2"/><path d="M8 15l3-4 2 2 3-5" fill="none" stroke="#3d2e54" stroke-width="2"/></svg>'),
        link('#/glossary', '用語集', 'スワイプで暗記', '<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="3" fill="#d3f5e2" stroke="#3d2e54" stroke-width="2"/><path d="M9 8h6M9 12h6" stroke="#3d2e54" stroke-width="2"/></svg>')),
      h('div.menu-k', '講義'),
      h('div.menu-lecs', LECTURES.map((l) => {
        const p = quizProgress('lec' + l.n, l.quiz.length)
        return h('a.menu-lec', { href: `#/lecture/${l.n}`, class: cur.startsWith(`#/lecture/${l.n}`) ? 'on' : '', onclick: () => m.close(true), style: { '--p': `${(p.ok / p.total) * 100}%` } },
          h('span.n', String(l.n).padStart(2, '0')), h('span.t', l.title), h('span.pg', `${p.ok}/${p.total}`))
      })),
      h('button.btn.menu-search', { onclick: () => { m.close(true); openPalette() } }, '🔍 章・用語を検索'),
    ],
  })
}

function onScroll() {
  const el = $('#site-header')
  el.classList.toggle('scrolled', scrollY > 10)
  const max = document.documentElement.scrollHeight - innerHeight
  $('.progress-bar', el).style.width = (max > 0 ? (scrollY / max) * 100 : 0) + '%'
}
function footer() {
  $('#site-footer').innerHTML = ''
  $('#site-footer').append(h('div.wrap',
    h('div.foot-cast', h('span', { html: avatar('S', 'happy') + avatar('R', 'happy') }), h('span', 'またね！ — DS&A Lab は「データ構造とアルゴリズム」講義の非公式学習サイトです')),
    h('div', `${LECTURES.length} lectures · made with ♥ for intuition`)))
}

const kindOf = (path) => (/^\/lecture\//.test(path) ? 'lecture' : path === '/glossary' ? 'glossary' : path === '/cheatsheet' ? 'cheatsheet' : 'home')
const curPath = () => (location.hash.replace(/^#/, '') || '/').split('?a=')[0]
// Skeleton Screen: 描画前に骨組みを出す
function showSkeleton(path) {
  const main = $('#app')
  main.innerHTML = ''
  main.appendChild(skeleton(kindOf(path)))
}

let cleanup = null
function route() {
  const hash = location.hash.replace(/^#/, '') || '/'
  const [path, anchor] = hash.split('?a=')
  const main = $('#app')
  cleanup?.()
  closeSheet()
  $('#palette-root').innerHTML = ''
  ;(window.__players || []).forEach((p) => p.stop())
  window.__players = []
  cleanup = null
  main.innerHTML = ''
  const page = h('div.page-enter')
  main.appendChild(page)
  let nav = 'home'
  const m = path.match(/^\/lecture\/(\d+)/)
  if (m) {
    const lec = LECTURES.find((l) => l.n === +m[1])
    if (lec) { cleanup = renderLecture(page, lec, LECTURES); nav = 'lec' }
    else cleanup = renderHome(page, LECTURES, UPCOMING)
  } else if (path === '/cheatsheet') { cleanup = renderCheatsheet(page, LECTURES); nav = 'cheatsheet' }
  else if (path === '/glossary') { cleanup = renderGlossary(page, LECTURES); nav = 'glossary' }
  else cleanup = renderHome(page, LECTURES, UPCOMING)
  $$('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === nav))
  typeset(page)
  observeReveal(page)
  kinetic(page)
  if (anchor) requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView())
  else scrollTo({ top: 0, behavior: 'instant' })
  onScroll()
  document.title = (m ? `第${m[1]}回 · ` : path === '/cheatsheet' ? '計算量表 · ' : path === '/glossary' ? '用語集 · ' : '') + 'DS&A Lab — データ構造とアルゴリズム'
}

addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette() }
  else if (e.key === '/' && !e.target.matches('input,textarea,select')) { e.preventDefault(); openPalette() }
})
let lastPath = null
addEventListener('hashchange', () => {
  const p = (location.hash.replace(/^#/, '') || '/').split('?a=')[0]
  if (lastPath !== null && p !== lastPath) { curtain(); setTimeout(() => showSkeleton(p), 300); setTimeout(route, 520) } else route()
  lastPath = p
})
lastPath = (location.hash.replace(/^#/, '') || '/').split('?a=')[0]
initGlobalMotion()
header()
footer()
// 初回: フォントと数式の準備を待つあいだ骨組みを見せる
showSkeleton(lastPath)
Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 700))]).then(() => setTimeout(route, 180))

// Pull to Refresh: 進捗を読み直して再描画
pullToRefresh({
  onRefresh: async () => {
    const y = scrollY
    showSkeleton(curPath())
    await new Promise((r) => setTimeout(r, 700))
    route()
    scrollTo(0, y)
    toast('最新の状態にしたよ！', 'ok')
  },
})
