import { h } from '../lib/ui.js'
import { GLOSSARY } from '../data/glossary.js'

const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])
const mark = (s, q) => (q ? esc(s).replace(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), (m) => `<mark>${m}</mark>`) : esc(s))

export function renderGlossary(root, LECTURES) {
  const avail = new Set(LECTURES.map((l) => l.n))
  const items = GLOSSARY.filter((g) => avail.has(g[3]))
  let lec = 0
  const input = h('input.txt.gloss-search', { placeholder: '用語・英語・説明で検索…', 'aria-label': '用語を検索', autofocus: true })
  const grid = h('div.gloss-grid')
  const count = h('span.small')
  const filt = h('div.seg', { style: { marginTop: '16px' } })
  ;[[0, 'すべて'], ...LECTURES.map((l) => [l.n, `第${l.n}回`])].forEach(([v, t]) => filt.appendChild(h('button', { class: v === 0 ? 'on' : '', onclick: (e) => { lec = v; [...filt.children].forEach((b) => b.classList.remove('on')); e.currentTarget.classList.add('on'); draw() } }, t)))
  const draw = () => {
    const q = input.value.trim()
    const ql = q.toLowerCase()
    const list = items.filter((g) => (!lec || g[3] === lec) && (!q || g.slice(0, 3).some((x) => x.toLowerCase().includes(ql))))
    grid.innerHTML = ''
    list.forEach(([t, en, d, n, id]) => grid.appendChild(h('article.gloss',
      h('h4', h('span', { html: mark(t, q) }), h('span.en', { html: mark(en, q) })),
      h('p', { html: mark(d, q) }),
      h('a.src', { href: `#/lecture/${n}?a=${id}` }, `→ 第${n}回で確認`))))
    if (!list.length) grid.appendChild(h('p.small', '該当する用語がありません'))
    count.textContent = `${list.length} 語`
  }
  input.addEventListener('input', draw)
  root.append(
    h('section.page-hero.wrap', h('div.eyebrow', 'Glossary'), h('h1', '用語集'), h('p', '講義に登場した用語の定義。各カードから、その用語が説明されている章へ移動できます。'), input, h('div.ctrl-row', { style: { marginTop: '6px' } }, filt, count)),
    h('div.wrap', grid))
  draw()
  return () => {}
}
