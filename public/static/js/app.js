import { h, $, $$, observeReveal, typeset, store } from './lib/ui.js'
import { LECTURES, UPCOMING } from './lectures/index.js'
import { renderHome } from './pages/home.js'
import { renderLecture } from './pages/lecture.js'
import { renderCheatsheet } from './pages/cheatsheet.js'
import { renderGlossary } from './pages/glossary.js'
import { openPalette } from './pages/palette.js'

const BRAND = `<svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><rect x=".5" y=".5" width="31" height="31" rx="8" fill="none" stroke="rgba(233,230,223,.18)"/><path d="M9 22 16 10 23 22" stroke="#ece9e2" stroke-width="1.4" fill="none"/><circle cx="9" cy="22" r="3" fill="#ffb547"/><circle cx="16" cy="10" r="3" fill="#ece9e2"/><circle cx="23" cy="22" r="3" fill="#5ad8ff"/></svg>`

function header() {
  const el = $('#site-header')
  el.innerHTML = ''
  el.append(
    h('a.brand', { href: '#/', 'aria-label': 'ホーム', html: `${BRAND}<span>DS&amp;A Lab <small>/ データ構造とアルゴリズム</small></span>` }),
    h('nav.nav', { 'aria-label': 'メイン' },
      h('a.hide-sm', { href: '#/', 'data-nav': 'home' }, '講義'),
      h('a.hide-sm', { href: '#/cheatsheet', 'data-nav': 'cheatsheet' }, '計算量表'),
      h('a.hide-sm', { href: '#/glossary', 'data-nav': 'glossary' }, '用語集'),
      h('button.nav-search', { onclick: openPalette, 'aria-label': '検索' }, h('span.lbl', '検索'), h('kbd', '⌘K'))),
    h('div.progress-bar'))
  addEventListener('scroll', onScroll, { passive: true })
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
    h('div', 'DS&A Lab — 「データ構造とアルゴリズム」講義の理解を深めるための非公式学習サイト'),
    h('div.mono', `${LECTURES.length} lectures · built for intuition`)))
}

let cleanup = null
function route() {
  const hash = location.hash.replace(/^#/, '') || '/'
  const [path, anchor] = hash.split('?a=')
  const main = $('#app')
  cleanup?.()
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
  if (anchor) requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView())
  else scrollTo({ top: 0, behavior: 'instant' })
  onScroll()
  document.title = (m ? `第${m[1]}回 · ` : path === '/cheatsheet' ? '計算量表 · ' : path === '/glossary' ? '用語集 · ' : '') + 'DS&A Lab — データ構造とアルゴリズム'
}

addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette() }
  else if (e.key === '/' && !e.target.matches('input,textarea,select')) { e.preventDefault(); openPalette() }
})
addEventListener('hashchange', route)
header()
footer()
route()
