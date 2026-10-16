import { h, $, $$, observeReveal, typeset, store } from './lib/ui.js'
import { LECTURES, UPCOMING } from './lectures/index.js'
import { avatar } from './lib/chars.js'
import { kinetic, curtain, initGlobalMotion } from './lib/motion.js'
import { renderHome } from './pages/home.js'
import { renderLecture } from './pages/lecture.js'
import { renderCheatsheet } from './pages/cheatsheet.js'
import { renderGlossary } from './pages/glossary.js'
import { openPalette } from './pages/palette.js'

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
    h('div.foot-cast', h('span', { html: avatar('S', 'happy') + avatar('R', 'happy') }), h('span', 'またね！ — DS&A Lab は「データ構造とアルゴリズム」講義の非公式学習サイトです')),
    h('div', `${LECTURES.length} lectures · made with ♥ for intuition`)))
}

let cleanup = null
function route() {
  const hash = location.hash.replace(/^#/, '') || '/'
  const [path, anchor] = hash.split('?a=')
  const main = $('#app')
  cleanup?.()
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
  if (lastPath !== null && p !== lastPath) { curtain(); setTimeout(route, 420) } else route()
  lastPath = p
})
lastPath = (location.hash.replace(/^#/, '') || '/').split('?a=')[0]
initGlobalMotion()
header()
footer()
route()
