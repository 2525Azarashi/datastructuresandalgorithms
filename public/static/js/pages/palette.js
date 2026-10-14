import { h, $ } from '../lib/ui.js'
import { LECTURES } from '../lectures/index.js'
import { GLOSSARY } from '../data/glossary.js'

export function openPalette() {
  const rootEl = $('#palette-root')
  if (rootEl.firstChild) return
  const avail = new Set(LECTURES.map((l) => l.n))
  const items = [
    { t: '講義一覧（ホーム）', g: 'PAGE', href: '#/' },
    { t: '計算量表', g: 'PAGE', href: '#/cheatsheet' },
    { t: '用語集', g: 'PAGE', href: '#/glossary' },
    ...LECTURES.flatMap((l) => [
      { t: `第${l.n}回 ${l.title}`, g: 'LECTURE', href: `#/lecture/${l.n}` },
      ...l.chapters.map((c) => ({ t: c.title, g: `第${l.n}回`, href: `#/lecture/${l.n}?a=${c.id}` })),
      { t: `第${l.n}回 類題`, g: `第${l.n}回`, href: `#/lecture/${l.n}?a=quiz` },
    ]),
    ...GLOSSARY.filter((g) => avail.has(g[3])).map(([t, en, , n, id]) => ({ t: `${t}  ·  ${en}`, g: '用語', href: `#/lecture/${n}?a=${id}` })),
  ]
  let sel = 0, list = items
  const input = h('input', { placeholder: '章・用語を検索…（↑↓ で選択, Enter で移動, Esc で閉じる）', 'aria-label': '検索' })
  const ul = h('ul', { role: 'listbox' })
  const close = () => { rootEl.innerHTML = '' }
  const go = (it) => { close(); if (location.hash === it.href) dispatchEvent(new HashChangeEvent('hashchange')); else location.hash = it.href }
  const draw = () => {
    const q = input.value.trim().toLowerCase()
    list = q ? items.filter((i) => (i.t + i.g).toLowerCase().includes(q)) : items
    sel = Math.min(sel, Math.max(0, list.length - 1))
    ul.innerHTML = ''
    if (!list.length) ul.appendChild(h('li.empty', '見つかりません'))
    list.slice(0, 60).forEach((it, i) => ul.appendChild(h('li', { class: i === sel ? 'on' : '' }, h('a', { href: it.href, onclick: (e) => { e.preventDefault(); go(it) }, onmousemove: () => { if (sel !== i) { sel = i; draw() } } }, h('span', it.t), h('span.g', it.g)))))
    ul.querySelector('.on')?.scrollIntoView({ block: 'nearest' })
  }
  input.addEventListener('input', () => { sel = 0; draw() })
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, list.length - 1); draw() }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); draw() }
    else if (e.key === 'Enter' && list[sel]) go(list[sel])
    else if (e.key === 'Escape') close()
  })
  const ov = h('div.palette-overlay', { onclick: (e) => { if (e.target === ov) close() } }, h('div.palette', { role: 'dialog', 'aria-label': 'クイック検索' }, input, ul))
  rootEl.appendChild(ov)
  draw()
  input.focus()
}
