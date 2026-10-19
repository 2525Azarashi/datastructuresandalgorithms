// =========================================================
// patterns.js — モバイル UI パターン
//   sheet(opts)            : Bottom Sheet（ドラッグで閉じる / スナップ / Esc / フォーカス管理）
//   swipeable(el, opts)    : Swipe Action（左右スワイプで背面アクションを実行）
//   pullToRefresh(opts)    : Pull to Refresh（タッチ端末・ページ最上部で引っぱる）
//   autocomplete(input, o) : Auto Complete（combobox / 候補ハイライト / 履歴 / Tab 補完）
//   skeleton(kind)         : Skeleton Screen（ページ種別ごとの骨組み）
// =========================================================
import { h, store } from './ui.js'
import { avatar } from './chars.js'

const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
export const markMatch = (text, q) => {
  if (!q) return esc(text)
  const i = text.toLowerCase().indexOf(q.toLowerCase())
  return i < 0 ? esc(text) : esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length))
}

/* ---------------------------------------------------------
   Bottom Sheet
   --------------------------------------------------------- */
let openSheet = null
export function sheet({ title, sub, body, foot, onClose, tall = false, label }) {
  openSheet?.close(true)
  const prevFocus = document.activeElement
  const panel = h('div.sheet', { role: 'dialog', 'aria-modal': 'true', 'aria-label': label || title, tabindex: '-1', class: tall ? 'tall' : '' },
    h('div.sheet-grab', { 'aria-hidden': 'true' }, h('i')),
    h('div.sheet-head',
      h('div', title ? h('h3.sheet-title', title) : null, sub ? h('div.sheet-sub', sub) : null),
      h('button.sheet-x', { 'aria-label': '閉じる', onclick: () => api.close() }, '×')),
    h('div.sheet-body', body),
    foot ? h('div.sheet-foot', foot) : null)
  const ov = h('div.sheet-ov', { onclick: (e) => { if (e.target === ov) api.close() } }, panel)
  document.body.appendChild(ov)
  document.documentElement.classList.add('sheet-lock')
  requestAnimationFrame(() => { ov.classList.add('open'); panel.focus({ preventScroll: true }) })
  // シート内の .reveal は即表示（遅延付きで順番に）
  setTimeout(() => panel.querySelectorAll('.reveal').forEach((e) => e.classList.add('in')), 120)

  // drag to dismiss（ハンドル・ヘッダ、または本文が最上部のとき）
  const bodyEl = panel.querySelector('.sheet-body')
  let y0 = null, dy = 0, t0 = 0
  const start = (e) => {
    if (e.target.closest('button, a, input, select, textarea')) return
    const onBody = e.target.closest('.sheet-body')
    if (onBody && bodyEl.scrollTop > 0) return
    y0 = e.clientY; dy = 0; t0 = performance.now()
    panel.classList.add('drag')
  }
  const move = (e) => {
    if (y0 == null) return
    dy = e.clientY - y0
    if (dy < 0) dy = dy / 4 // 上方向はゴム
    if (Math.abs(dy) > 4) { panel.setPointerCapture?.(e.pointerId) }
    panel.style.transform = `translateY(${dy}px)`
    ov.style.setProperty('--dim', String(Math.max(0, 1 - Math.max(0, dy) / 400)))
  }
  const end = () => {
    if (y0 == null) return
    y0 = null
    panel.classList.remove('drag')
    const v = dy / Math.max(1, performance.now() - t0)
    if (dy > 120 || v > 0.6) api.close()
    else { panel.style.transform = ''; ov.style.removeProperty('--dim') }
  }
  panel.addEventListener('pointerdown', start)
  panel.addEventListener('pointermove', move)
  panel.addEventListener('pointerup', end)
  panel.addEventListener('pointercancel', end)

  const key = (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); api.close() }
    else if (e.key === 'Tab') { // focus trap
      const f = [...panel.querySelectorAll('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((x) => !x.disabled && x.offsetParent)
      if (!f.length) return
      const first = f[0], last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
  }
  document.addEventListener('keydown', key, true)
  const api = {
    el: panel,
    close(instant) {
      if (api.closed) return
      api.closed = true
      document.removeEventListener('keydown', key, true)
      ov.classList.remove('open'); ov.classList.add('closing')
      panel.style.transform = ''
      const done = () => { ov.remove(); if (openSheet === api) openSheet = null; if (!openSheet) document.documentElement.classList.remove('sheet-lock') }
      if (instant || REDUCE) done(); else setTimeout(done, 340)
      onClose?.()
      if (!instant) prevFocus?.focus?.({ preventScroll: true })
    },
  }
  openSheet = api
  return api
}
export const closeSheet = () => openSheet?.close(true)

/* ---------------------------------------------------------
   Swipe Action
   left  : 左へスワイプ（右端に現れる）  right : 右へスワイプ（左端に現れる）
   各 { label, icon, cls, fn }
   --------------------------------------------------------- */
export function swipeable(el, { left, right, threshold = 90, onTap } = {}) {
  const wrap = h('div.swipe', { tabindex: '-1' })
  const bgL = right ? h(`div.swipe-bg.l.${right.cls || 'mint'}`, { 'aria-hidden': 'true' }, h('span', { html: right.icon || '' }), h('b', right.label)) : null
  const bgR = left ? h(`div.swipe-bg.r.${left.cls || 'pink'}`, { 'aria-hidden': 'true' }, h('b', left.label), h('span', { html: left.icon || '' })) : null
  el.classList.add('swipe-fg')
  el.replaceWith?.(wrap)
  wrap.append(...[bgL, bgR, el].filter(Boolean))
  let x0 = null, y0 = 0, dx = 0, lock = null, moved = false
  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('a, button, input')) return
    x0 = e.clientX; y0 = e.clientY; dx = 0; lock = null; moved = false
  })
  el.addEventListener('pointermove', (e) => {
    if (x0 == null) return
    const mx = e.clientX - x0, my = e.clientY - y0
    if (!lock && Math.hypot(mx, my) > 8) { lock = Math.abs(mx) > Math.abs(my) ? 'x' : 'y'; if (lock === 'x') { el.setPointerCapture(e.pointerId); wrap.classList.add('drag') } }
    if (lock !== 'x') return
    moved = true
    dx = mx
    if ((dx > 0 && !right) || (dx < 0 && !left)) dx = dx / 5
    el.style.transform = `translateX(${dx}px) rotate(${dx / 60}deg)`
    const p = Math.min(1, Math.abs(dx) / threshold)
    wrap.style.setProperty('--p', p.toFixed(2))
    wrap.classList.toggle('arm-l', dx > threshold && !!right)
    wrap.classList.toggle('arm-r', dx < -threshold && !!left)
    wrap.classList.toggle('dir-l', dx > 0); wrap.classList.toggle('dir-r', dx < 0)
  })
  const end = () => {
    if (x0 == null) return
    x0 = null
    wrap.classList.remove('drag', 'arm-l', 'arm-r')
    if (lock === 'x' && dx > threshold && right) fire(right, 1)
    else if (lock === 'x' && dx < -threshold && left) fire(left, -1)
    else { el.style.transform = ''; wrap.style.removeProperty('--p') }
  }
  el.addEventListener('pointerup', end)
  el.addEventListener('pointercancel', end)
  el.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false } else if (onTap && !e.target.closest('a, button')) onTap(e) }, true)
  const fire = (a, dir) => {
    el.style.transform = `translateX(${dir * 110}%) rotate(${dir * 6}deg)`
    el.classList.add('fly')
    setTimeout(() => { el.classList.remove('fly'); el.style.transition = 'none'; el.style.transform = `translateX(${-dir * 30}px)`; wrap.style.removeProperty('--p'); requestAnimationFrame(() => { el.style.transition = ''; el.style.transform = '' }); a.fn() }, 260)
  }
  wrap.trigger = (side) => fire(side === 'right' ? right : left, side === 'right' ? 1 : -1)
  return wrap
}

/* ---------------------------------------------------------
   Pull to Refresh（タッチのみ。ページ最上部から下へ引く）
   --------------------------------------------------------- */
export function pullToRefresh({ onRefresh, threshold = 78 }) {
  const ind = h('div.ptr', { 'aria-hidden': 'true' },
    h('div.ptr-ball', { html: avatar('R', 'normal') }),
    h('div.ptr-label', '引っぱって更新'))
  document.body.appendChild(ind)
  let y0 = null, dy = 0, busy = false
  const set = (d) => {
    const p = Math.min(1, d / threshold)
    ind.style.setProperty('--d', `${Math.min(d, threshold * 1.6)}px`)
    ind.style.setProperty('--p', p.toFixed(2))
    ind.classList.toggle('armed', p >= 1)
    ind.querySelector('.ptr-label').textContent = p >= 1 ? '離すと更新！' : '引っぱって更新'
  }
  addEventListener('touchstart', (e) => {
    if (busy || scrollY > 0 || document.documentElement.classList.contains('sheet-lock') || e.touches.length > 1) return
    if (e.target.closest('.swipe, .lab svg, .sheet, input, textarea')) return
    y0 = e.touches[0].clientY; dy = 0
  }, { passive: true })
  addEventListener('touchmove', (e) => {
    if (y0 == null) return
    dy = e.touches[0].clientY - y0
    if (dy <= 0 || scrollY > 0) { if (dy < -4) { y0 = null; set(0); ind.classList.remove('show') } return }
    if (e.cancelable) e.preventDefault()
    const d = dy * 0.5 // 抵抗感
    ind.classList.add('show')
    set(d)
  }, { passive: false })
  addEventListener('touchend', async () => {
    if (y0 == null) return
    y0 = null
    if (dy * 0.5 >= threshold) {
      busy = true
      ind.classList.add('loading'); ind.classList.remove('armed')
      ind.querySelector('.ptr-label').textContent = '更新中…'
      set(threshold)
      try { await onRefresh() } finally {
        ind.classList.add('done')
        ind.querySelector('.ptr-label').textContent = 'できた！'
        setTimeout(() => { ind.classList.remove('show', 'loading', 'done'); set(0); busy = false }, 520)
      }
    } else { ind.classList.remove('show'); set(0) }
  })
}

/* ---------------------------------------------------------
   Auto Complete
   source(q) → [{ label, sub?, group?, value? , data? }]
   --------------------------------------------------------- */
let acSeq = 0
export function autocomplete(input, { source, onPick, historyKey, max = 8, emptyHint = '候補がありません' }) {
  const id = 'ac-' + (++acSeq)
  const box = h('div.ac', { 'data-ac': id })
  input.replaceWith(box)
  const ghost = h('div.ac-ghost', { 'aria-hidden': 'true' })
  const list = h('ul.ac-list', { id, role: 'listbox' })
  box.append(ghost, input, list)
  input.setAttribute('role', 'combobox')
  input.setAttribute('aria-autocomplete', 'both')
  input.setAttribute('aria-expanded', 'false')
  input.setAttribute('aria-controls', id)
  input.setAttribute('autocomplete', 'off')
  let items = [], sel = -1, open = false
  const hist = () => (historyKey ? store.get(historyKey, []) : [])
  const pushHist = (label) => { if (!historyKey) return; store.set(historyKey, [label, ...hist().filter((x) => x !== label)].slice(0, 5)) }

  const render = () => {
    const q = input.value.trim()
    list.innerHTML = ''
    if (!q) {
      const hs = hist()
      items = hs.map((l) => ({ label: l, recent: true }))
      if (hs.length) list.appendChild(h('li.ac-head', { role: 'presentation' }, h('span', '最近の検索'), h('button.ac-clear', { onmousedown: (e) => { e.preventDefault(); store.set(historyKey, []); render() } }, 'クリア')))
    } else items = source(q).slice(0, max)
    items.forEach((it, i) => {
      if (!it.recent && it.group && it.group !== items[i - 1]?.group) list.appendChild(h('li.ac-head', { role: 'presentation' }, h('span', it.group)))
      list.appendChild(h('li.ac-item', {
        id: `${id}-${i}`, role: 'option', 'aria-selected': i === sel ? 'true' : 'false', class: i === sel ? 'on' : '',
        onmousedown: (e) => { e.preventDefault(); pick(i) }, onmousemove: () => { if (sel !== i) { sel = i; paint() } },
        style: { '--i': i },
      },
      h('span.ac-ic', { html: it.recent ? '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>' : '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5 14 14"/></svg>' }),
      h('span.ac-l', { html: markMatch(it.label, q) }),
      it.sub ? h('span.ac-s', { html: markMatch(it.sub, q) }) : null))
    })
    if (q && !items.length) list.appendChild(h('li.ac-empty', { role: 'presentation' }, emptyHint))
    setOpen(document.activeElement === input && (items.length > 0 || !!q))
    paintGhost()
  }
  const paint = () => {
    ;[...list.querySelectorAll('.ac-item')].forEach((li, i) => { li.classList.toggle('on', i === sel); li.setAttribute('aria-selected', i === sel ? 'true' : 'false') })
    if (sel >= 0) { input.setAttribute('aria-activedescendant', `${id}-${sel}`); list.querySelector('.on')?.scrollIntoView({ block: 'nearest' }) }
    else input.removeAttribute('aria-activedescendant')
    paintGhost()
  }
  // 先頭一致する候補があれば、続きを薄く表示（Tab / → で確定）
  const completion = () => {
    const q = input.value
    if (!q.trim() || input.selectionStart !== q.length) return ''
    const it = items[sel >= 0 ? sel : 0]
    if (!it) return ''
    return it.label.toLowerCase().startsWith(q.toLowerCase()) && it.label.length > q.length ? it.label.slice(q.length) : ''
  }
  const paintGhost = () => {
    const rest = completion()
    ghost.innerHTML = rest ? `<span class="ac-ghost-q">${esc(input.value)}</span>${esc(rest)}` : ''
  }
  const setOpen = (v) => { open = v; box.classList.toggle('open', v); input.setAttribute('aria-expanded', v ? 'true' : 'false') }
  const pick = (i) => {
    const it = items[i]
    if (!it) return
    if (it.recent) { input.value = it.label; sel = -1; render(); input.dispatchEvent(new Event('input', { bubbles: true })); return }
    pushHist(it.label)
    input.value = it.value ?? it.label
    setOpen(false)
    onPick?.(it)
    input.dispatchEvent(new CustomEvent('ac-pick', { detail: it }))
  }
  input.addEventListener('input', () => { sel = -1; render() })
  input.addEventListener('focus', render)
  input.addEventListener('blur', () => setTimeout(() => setOpen(false), 120))
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (!open) render(); sel = Math.min(sel + 1, items.length - 1); paint() }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, -1); paint() }
    else if ((e.key === 'Tab' || e.key === 'ArrowRight') && completion()) { e.preventDefault(); input.value += completion(); render(); input.dispatchEvent(new Event('input', { bubbles: true })) }
    else if (e.key === 'Enter') { if (open && sel >= 0) { e.preventDefault(); pick(sel) } else if (input.value.trim()) { pushHist(input.value.trim()); setOpen(false) } }
    else if (e.key === 'Escape') { if (open) { e.stopPropagation(); setOpen(false) } else if (input.value) { input.value = ''; input.dispatchEvent(new Event('input', { bubbles: true })) } }
  })
  return { box, refresh: render, close: () => setOpen(false) }
}

/* ---------------------------------------------------------
   Skeleton Screen
   --------------------------------------------------------- */
const bone = (cls = '', style = {}) => h(`div.bone${cls}`, { style })
export function skeleton(kind = 'page') {
  const root = h('div.skel', { 'aria-busy': 'true', 'aria-label': '読み込み中' })
  const wrap = (...k) => h('div.wrap', ...k)
  if (kind === 'lecture') {
    root.append(
      wrap(h('div.skel-hero',
        h('div', bone('.num'), bone('.line', { width: '38%' }), bone('.h1'), bone('.line', { width: '64%' }),
          h('div.skel-row', bone('.av'), bone('.av'), bone('.line', { width: '40%', marginTop: '14px' })),
          h('div.skel-cells', bone('.cell'), bone('.cell'), bone('.cell'), bone('.cell'))),
        bone('.card', { height: '260px' }))),
      wrap(h('div.skel-body',
        h('div.skel-toc', ...Array.from({ length: 7 }, (_, i) => bone('.line', { width: `${70 + (i % 3) * 10}%` }))),
        h('div',
          bone('.line', { width: '22%' }), bone('.h2'),
          skTalk('l'), skTalk('r'), skTalk('l'),
          bone('.lab')))))
  } else if (kind === 'glossary') {
    root.append(wrap(h('div.skel-page', bone('.line', { width: '12%' }), bone('.h1', { width: '30%' }), bone('.line', { width: '50%' }), bone('.input'),
      h('div.skel-grid', ...Array.from({ length: 6 }, () => h('div.bone-card', bone('.line', { width: '45%' }), bone('.line'), bone('.line', { width: '80%' }), bone('.pill')))))))
  } else if (kind === 'cheatsheet') {
    root.append(wrap(h('div.skel-page', bone('.line', { width: '12%' }), bone('.h1', { width: '34%' }), bone('.line', { width: '50%' }), bone('.card', { height: '320px', marginTop: '30px' }),
      ...Array.from({ length: 5 }, () => bone('.row')))))
  } else {
    root.append(wrap(h('div.skel-page', bone('.line', { width: '20%' }), bone('.h1', { width: '70%', height: '90px' }), bone('.h1', { width: '50%', height: '90px' }), bone('.line', { width: '40%' }),
      h('div.skel-grid', bone('.card'), bone('.card'), bone('.card')))))
  }
  return root
}
const skTalk = (side) => h(`div.skel-talk.${side}`, bone('.av'), h('div.bone-bubble', bone('.line'), bone('.line', { width: '70%' })))
