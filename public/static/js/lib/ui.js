// ---------- tiny DOM helpers ----------
export const $ = (s, r = document) => r.querySelector(s)
export const $$ = (s, r = document) => [...r.querySelectorAll(s)]

/** h('div.cls#id', {attrs}, ...children) */
export function h(tag, attrs, ...kids) {
  if (attrs == null || typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs)) {
    if (attrs != null) kids.unshift(attrs)
    attrs = {}
  }
  const m = tag.match(/^([a-z0-9-]+)?((?:[.#][\w-]+)*)$/i)
  const el = document.createElement(m[1] || 'div')
  ;(m[2].match(/[.#][\w-]+/g) || []).forEach((p) => (p[0] === '.' ? el.classList.add(p.slice(1)) : (el.id = p.slice(1))))
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue
    if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v)
    else if (k === 'html') el.innerHTML = v
    else if (k === 'style' && typeof v === 'object') Object.entries(v).forEach(([sk, sv]) => (sk.startsWith('--') ? el.style.setProperty(sk, sv) : (el.style[sk] = sv)))
    else el.setAttribute(k, v === true ? '' : v)
  }
  append(el, kids)
  return el
}
function append(el, kids) {
  for (const k of kids.flat(Infinity)) {
    if (k == null || k === false) continue
    el.appendChild(k instanceof Node ? k : document.createTextNode(String(k)))
  }
}
export const html = (str) => {
  const t = document.createElement('template')
  t.innerHTML = str.trim()
  return t.content.childElementCount === 1 ? t.content.firstElementChild : t.content
}

const SVGNS = 'http://www.w3.org/2000/svg'
export function s(tag, attrs = {}, ...kids) {
  const el = document.createElementNS(SVGNS, tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue
    if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v)
    else if (k === 'text') el.textContent = v
    else el.setAttribute(k, v)
  }
  for (const k of kids.flat(Infinity)) if (k != null && k !== false) el.appendChild(k instanceof Node ? k : document.createTextNode(String(k)))
  return el
}
export const svgRoot = (w, hgt, extra = {}) => s('svg', { viewBox: `0 0 ${w} ${hgt}`, preserveAspectRatio: 'xMidYMid meet', ...extra })

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
export const range = (n) => Array.from({ length: n }, (_, i) => i)

// ---------- math (KaTeX) ----------
export function typeset(el) {
  const run = () => {
    if (!window.renderMathInElement) return false
    window.renderMathInElement(el, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
      ],
      throwOnError: false,
    })
    return true
  }
  if (!run()) {
    let tries = 0
    const t = setInterval(() => { if (run() || ++tries > 50) clearInterval(t) }, 100)
  }
}
export function tex(str, display = false) {
  const span = h(display ? 'div' : 'span')
  const go = () => {
    if (window.katex) { window.katex.render(str, span, { displayMode: display, throwOnError: false }); return true }
    return false
  }
  if (!go()) { span.textContent = str; let n = 0; const t = setInterval(() => { if (go() || ++n > 50) clearInterval(t) }, 100) }
  return span
}

// ---------- reveal on scroll ----------
let io
export function observeReveal(root = document) {
  io?.disconnect()
  io = new IntersectionObserver((ents) => {
    ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } })
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 })
  $$('.reveal', root).forEach((el) => io.observe(el))
}

// ---------- storage ----------
const KEY = 'dsa-lab-v1'
export const store = {
  all() { try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} } },
  get(k, d) { const a = this.all(); return k in a ? a[k] : d },
  set(k, v) { const a = this.all(); a[k] = v; localStorage.setItem(KEY, JSON.stringify(a)) },
}

export function toast(msg) {
  const t = h('div.toast', msg)
  document.body.appendChild(t)
  setTimeout(() => t.remove(), 1800)
}

// ---------- Lab frame ----------
export function lab({ title, hint, body, foot, id }) {
  return h('figure.lab.reveal', { id, style: { margin: '28px 0' } },
    h('div.lab-head',
      h('div.t', h('span.dot'), title),
      hint ? h('div.hint', hint) : null),
    h('div.lab-body', body),
    foot ? h('div.lab-foot', foot) : null,
  )
}

// ---------- Step player ----------
const ICON = {
  first: '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3 2h2v12H3zM14 2v12L6 8z"/></svg>',
  prev: '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M11 2v12L3 8z"/></svg>',
  next: '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M5 2v12l8-6z"/></svg>',
  play: '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2v12l10-6z"/></svg>',
  pause: '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3 2h4v12H3zM9 2h4v12H9z"/></svg>',
}
/**
 * Player: steps = array of frames, render(frame, index)
 * キーボード: ← → で1ステップ, Space で再生/停止 (lab にフォーカス時)
 */
export class Player {
  constructor({ render, interval = 900, keyTarget }) {
    this.render = render
    this.steps = []
    this.i = 0
    this.base = interval
    this.speed = 1
    this.timer = null
    ;(window.__players ||= []).push(this)
    this.el = h('div.player')
    this.bFirst = h('button.pbtn', { 'aria-label': '最初へ', title: '最初へ', html: ICON.first, onclick: () => this.go(0) })
    this.bPrev = h('button.pbtn', { 'aria-label': '1つ戻る', title: '1つ戻る (←)', html: ICON.prev, onclick: () => this.go(this.i - 1) })
    this.bPlay = h('button.pbtn.play', { 'aria-label': '再生', title: '再生 / 停止 (Space)', html: ICON.play, onclick: () => this.toggle() })
    this.bNext = h('button.pbtn', { 'aria-label': '1つ進む', title: '1つ進む (→)', html: ICON.next, onclick: () => this.go(this.i + 1) })
    this.range = h('input', { type: 'range', min: 0, max: 0, value: 0, 'aria-label': 'ステップ', oninput: (e) => { this.stop(); this.go(+e.target.value) } })
    this.count = h('span.count', '0 / 0')
    this.speedSel = h('div.seg', ...[0.5, 1, 2, 4].map((v) => h('button', { class: v === 1 ? 'on' : '', onclick: (e) => { this.speed = v; $$('button', this.speedSel).forEach((b) => b.classList.remove('on')); e.currentTarget.classList.add('on'); if (this.timer) { this.stop(); this.play() } } }, `${v}×`)))
    this.el.append(this.bFirst, this.bPrev, this.bPlay, this.bNext, h('div.scrub', this.range, this.count), this.speedSel)
    if (keyTarget) {
      keyTarget.tabIndex = 0
      keyTarget.addEventListener('keydown', (e) => {
        if (e.target.matches('input,select,textarea')) return
        if (e.key === 'ArrowRight') { e.preventDefault(); this.stop(); this.go(this.i + 1) }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); this.stop(); this.go(this.i - 1) }
        else if (e.key === ' ') { e.preventDefault(); this.toggle() }
      })
    }
  }
  load(steps, start = 0) {
    this.stop()
    this.steps = steps
    this.range.max = Math.max(0, steps.length - 1)
    this.go(start)
  }
  go(i) {
    if (!this.steps.length) return
    this.i = clamp(i, 0, this.steps.length - 1)
    this.range.value = this.i
    this.count.textContent = `${this.i + 1} / ${this.steps.length}`
    this.bFirst.disabled = this.bPrev.disabled = this.i === 0
    this.bNext.disabled = this.i === this.steps.length - 1
    this.render(this.steps[this.i], this.i, this.steps)
    if (this.i === this.steps.length - 1) this.stop()
  }
  play() {
    if (this.i >= this.steps.length - 1) this.go(0)
    this.bPlay.innerHTML = ICON.pause
    this.timer = setInterval(() => this.go(this.i + 1), this.base / this.speed)
  }
  stop() { clearInterval(this.timer); this.timer = null; this.bPlay.innerHTML = ICON.play }
  toggle() { this.timer ? this.stop() : this.play() }
}

// ---------- small builders ----------
export const stat = (k, v, cls = '') => {
  const vEl = h('div.v', { html: String(v) })
  const el = h(`div.stat${cls ? '.' + cls : ''}`, h('div.k', { html: k }), vEl)
  el.set = (x) => { vEl.innerHTML = x }
  return el
}
export const callout = (kind, label, htmlStr) => h(`div.callout.${kind}`, h('span.ic', label), h('div', { html: htmlStr }))
export const tldr = (htmlStr) => h('p.tldr', { html: htmlStr })
export const prose = (htmlStr) => h('div.prose', { html: htmlStr })
export const card = (title, body, k, cls = '') => h(`div.card${cls ? '.' + cls : ''}`, k ? h('div.k', k) : null, h('h4', { html: title }), h('p', { html: body }))
export const cols = (n, ...items) => h('div.cols', { style: { '--c': n } }, ...items)
export const formula = (texStr) => { const d = h('div.formula'); d.appendChild(tex(texStr, true)); return d }
export function table(head, rows, cellClass) {
  return h('div.tbl-wrap', h('table.tbl',
    h('thead', h('tr', head.map((x) => h('th', { html: x })))),
    h('tbody', rows.map((r, ri) => h('tr', r.map((c, ci) => h('td', { class: cellClass?.(c, ri, ci) || '', html: c })))))))
}
export function seg(options, value, onChange) {
  const el = h('div.seg')
  options.forEach(([v, label]) => {
    el.appendChild(h('button', { class: v === value ? 'on' : '', onclick: (e) => { $$('button', el).forEach((b) => b.classList.remove('on')); e.currentTarget.classList.add('on'); onChange(v) } }, label))
  })
  return el
}
export function parseNums(str) {
  return str.split(/[\s,，、]+/).filter(Boolean).map(Number).filter((x) => Number.isFinite(x))
}
