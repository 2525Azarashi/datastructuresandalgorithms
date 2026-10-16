// =========================================================
// motion.js — kinetic typography & UI motion layer
//   splitText / kinetic(root)   : 文字単位に分解して出現・波打ち
//   reactiveType(el)            : カーソルに反応して文字が浮く
//   rotateWord(el, words)       : 単語がパタパタ入れ替わる
//   scramble(el)                : 記号がシャッフルされて文字に落ち着く
//   countUp(el, to)             : 数字のカウントアップ
//   marquee(rows)               : スクロール速度に連動して流れる巨大文字
//   initGlobalMotion()          : カーソル / マグネット / チルト / 波紋 / 値のバンプ
//   curtain()                   : ページ遷移のカーテン
// =========================================================
export const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches
const FINE = matchMedia('(pointer: fine)').matches

/** テキストノードを 1 文字ずつ span.ch に分解（子要素の装飾は保持） */
export function splitText(el, { skip = '.katex, .sub, .no-split', by = 'char' } = {}) {
  if (el.dataset.split) return el.querySelectorAll('.ch')
  el.dataset.split = '1'
  let i = 0
  const walk = (node) => {
    ;[...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const text = n.textContent
        if (!text.trim()) return
        const frag = document.createDocumentFragment()
        const parts = by === 'word' ? text.split(/(\s+)/) : [...text]
        parts.forEach((c) => {
          if (/^\s+$/.test(c)) { frag.appendChild(document.createTextNode(c)); return }
          const s = document.createElement('span')
          s.className = 'ch'
          s.textContent = c
          s.style.setProperty('--i', i++)
          frag.appendChild(s)
        })
        n.replaceWith(frag)
      } else if (n.nodeType === 1 && !n.matches(skip)) walk(n)
    })
  }
  walk(el)
  el.style.setProperty('--n', i)
  el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim())
  return el.querySelectorAll('.ch')
}

let kio
/** 見出しなどを kinetic に。画面に入ったら .in を付ける */
export function kinetic(root = document) {
  kio?.disconnect()
  kio = new IntersectionObserver((ents) => ents.forEach((e) => {
    if (!e.isIntersecting) return
    const el = e.target
    el.classList.add('in')
    if (el.matches('[data-scramble]')) scramble(el)
    if (el.matches('[data-count]')) countUp(el, +el.dataset.count, { dur: +(el.dataset.dur || 1400), fmt: el.dataset.fmt })
    kio.unobserve(el)
  }), { rootMargin: '0px 0px -10% 0px', threshold: 0.1 })
  root.querySelectorAll('.sec-head h2, .chapter h2, .lec-hero h1, .page-hero h1, .kt-auto').forEach((el) => {
    splitText(el)
    el.classList.add('kt')
    kio.observe(el)
  })
  root.querySelectorAll('.lec-hero .big-num').forEach((el) => { splitText(el); el.classList.add('kt', 'kt-flip'); kio.observe(el) })
  root.querySelectorAll('[data-scramble], [data-count], .kt-watch').forEach((el) => kio.observe(el))
}

/** カーソル近傍の文字が持ち上がる（ヒーロー見出し用） */
export function reactiveType(el) {
  if (REDUCE || !FINE) return () => {}
  const chars = [...el.querySelectorAll('.ch')]
  let pts = [], mx = -1e4, my = -1e4, raf = 0, active = false
  const measure = () => { pts = chars.map((c) => { const r = c.getBoundingClientRect(); return { c, x: r.left + r.width / 2, y: r.top + r.height / 2 + scrollY } }) }
  const tick = () => {
    raf = 0
    pts.forEach((p) => {
      const dx = p.x - mx, dy = p.y - scrollY - my, d = Math.hypot(dx, dy)
      const f = Math.max(0, 1 - d / 220)
      const e = f * f
      p.c.style.setProperty('--ky', (-e * 26).toFixed(1) + 'px')
      p.c.style.setProperty('--ks', (1 + e * 0.22).toFixed(3))
      p.c.style.setProperty('--kr', ((dx / 220) * e * -14).toFixed(1) + 'deg')
    })
  }
  const move = (ev) => { mx = ev.clientX; my = ev.clientY; if (!active) { active = true; measure() } if (!raf) raf = requestAnimationFrame(tick) }
  const leave = () => { mx = my = -1e4; if (!raf) raf = requestAnimationFrame(tick) }
  const re = () => { active = false }
  setTimeout(() => el.classList.add('reactive'), 1400)
  addEventListener('pointermove', move, { passive: true })
  document.addEventListener('pointerleave', leave)
  addEventListener('resize', re); addEventListener('scroll', re, { passive: true })
  return () => { removeEventListener('pointermove', move); document.removeEventListener('pointerleave', leave); removeEventListener('resize', re); removeEventListener('scroll', re) }
}

/** 単語のフリップ入れ替え */
export function rotateWord(el, words, every = 2600) {
  let k = 0
  const set = (w) => {
    el.innerHTML = ''
    ;[...w].forEach((c, i) => { const s = document.createElement('span'); s.className = 'ch flip-in'; s.textContent = c; s.style.setProperty('--i', i); el.appendChild(s) })
    el.setAttribute('aria-label', w)
  }
  if (REDUCE) return () => {}
  const t = setInterval(() => {
    const old = [...el.querySelectorAll('.ch')]
    old.forEach((s, i) => { s.classList.remove('flip-in'); s.classList.add('flip-out'); s.style.setProperty('--i', i) })
    setTimeout(() => set(words[(k = (k + 1) % words.length)]), 260 + old.length * 22)
  }, every)
  return () => clearInterval(t)
}

const GLYPHS = '01<>[]{}()+=*#/\\%$&→←↑↓∑∫∅'
/** ランダム記号 → 本来の文字 */
export function scramble(el, dur = 900) {
  const final = el.dataset.text || el.textContent
  el.dataset.text = final
  if (REDUCE) { el.textContent = final; return }
  const t0 = performance.now()
  const step = (now) => {
    const p = Math.min(1, (now - t0) / dur)
    let out = ''
    for (let i = 0; i < final.length; i++) {
      const reveal = i / final.length < p * 1.15
      out += reveal || final[i] === ' ' ? final[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0]
    }
    el.textContent = out
    if (p < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

export const fmtJP = (v) => {
  if (v >= 1e12) return (v / 1e12).toFixed(v >= 1e13 ? 0 : 1) + '兆'
  if (v >= 1e8) return (v / 1e8).toFixed(v >= 1e9 ? 0 : 1) + '億'
  if (v >= 1e4) return (v / 1e4).toFixed(v >= 1e5 ? 0 : 1) + '万'
  return Math.round(v).toLocaleString()
}
/** カウントアップ */
export function countUp(el, to, { dur = 1400, fmt } = {}) {
  const f = fmt === 'jp' ? fmtJP : fmt === 'pct' ? (v) => Math.round(v) + '%' : (v) => Math.round(v).toLocaleString()
  if (REDUCE) { el.textContent = f(to); return }
  const t0 = performance.now()
  const ease = (x) => 1 - Math.pow(1 - x, 4)
  const step = (now) => {
    const p = Math.min(1, (now - t0) / dur)
    el.textContent = f(to * ease(p))
    if (p < 1) requestAnimationFrame(step)
    else el.classList.add('counted')
  }
  requestAnimationFrame(step)
}

/** スクロール速度に連動するマーキー。rows: [{el, dir}] */
export function marquee(rows) {
  let last = scrollY, vel = 0, x = 0, raf
  const loop = () => {
    const d = scrollY - last; last = scrollY
    vel += (d - vel) * 0.12
    x += (REDUCE ? 0 : 0.6) + Math.abs(vel) * 0.9
    rows.forEach(({ el, dir }) => {
      const w = el.scrollWidth / 2 || 1
      const off = ((x * dir) % w + w) % w
      el.style.transform = `translate3d(${-off}px,0,0) skewX(${Math.max(-7, Math.min(7, -vel * 0.35 * dir))}deg)`
    })
    raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame(loop)
  return () => cancelAnimationFrame(raf)
}

/** ページ遷移のカーテン（4 色の帯が順に抜ける） */
export function curtain() {
  if (REDUCE) return
  const c = document.createElement('div')
  c.className = 'curtain'
  c.setAttribute('aria-hidden', 'true')
  c.innerHTML = '<i></i><i></i><i></i><i></i><b></b>'
  document.body.appendChild(c)
  setTimeout(() => c.remove(), 1100)
}

/** 全体で 1 度だけ: カスタムカーソル・マグネット・チルト・波紋・値バンプ */
export function initGlobalMotion() {
  // ripple
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.btn, .op, .q-opt, .pbtn, .seg button, .lec-pill')
    if (!b || b.disabled || REDUCE) return
    const r = b.getBoundingClientRect()
    const s = document.createElement('span')
    s.className = 'ripple'
    const d = Math.max(r.width, r.height) * 2.2
    s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`
    b.appendChild(s)
    setTimeout(() => s.remove(), 650)
  })

  // value bump (stat / var / score が書き換わったらポンッ)
  const mo = new MutationObserver((ms) => {
    const set = new Set()
    ms.forEach((m) => { const t = (m.target.nodeType === 3 ? m.target.parentElement : m.target)?.closest?.('.stat .v, .var, .score, .player .count'); if (t) set.add(t) })
    set.forEach((t) => { t.classList.remove('bump'); void t.offsetWidth; t.classList.add('bump') })
  })
  mo.observe(document.getElementById('app'), { subtree: true, childList: true, characterData: true })

  if (!FINE || REDUCE) return
  // custom cursor
  const cur = document.createElement('div')
  cur.className = 'cursor'
  cur.innerHTML = '<i></i><b></b>'
  document.body.appendChild(cur)
  const ring = cur.querySelector('i'), dot = cur.querySelector('b')
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, shown = false
  addEventListener('pointermove', (e) => {
    mx = e.clientX; my = e.clientY
    if (!shown) { shown = true; cur.classList.add('on'); rx = mx; ry = my }
    const t = e.target.closest?.('a, button, input, select, label, .node.clickable, .matrix td, canvas, .q-opt')
    cur.classList.toggle('hover', !!t)
    cur.classList.toggle('text', !!e.target.closest?.('input.txt, input.num, .palette input'))
  }, { passive: true })
  document.addEventListener('pointerleave', () => { shown = false; cur.classList.remove('on') })
  addEventListener('pointerdown', () => cur.classList.add('down'))
  addEventListener('pointerup', () => cur.classList.remove('down'))
  const loop = () => {
    rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18
    ring.style.transform = `translate3d(${rx}px,${ry}px,0)`
    dot.style.transform = `translate3d(${mx}px,${my}px,0)`
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)

  // magnetic buttons
  let mag = null
  addEventListener('pointermove', (e) => {
    const b = e.target.closest?.('.btn, .lec-go, .nav-search, .pbtn.play, .brand')
    if (mag && mag !== b) { mag.style.translate = ''; mag = null }
    if (!b) return
    mag = b
    const r = b.getBoundingClientRect()
    const dx = (e.clientX - (r.left + r.width / 2)) / r.width, dy = (e.clientY - (r.top + r.height / 2)) / r.height
    b.style.translate = `${dx * 10}px ${dy * 8}px`
  }, { passive: true })

  // 3D tilt + glare
  let tl = null
  addEventListener('pointermove', (e) => {
    const c = e.target.closest?.('.tilt, .principle, .cast-card, .tool-card, .gloss')
    if (tl && tl !== c) { tl.style.removeProperty('--rx'); tl.style.removeProperty('--ry'); tl.classList.remove('tilting'); tl = null }
    if (!c) return
    tl = c; c.classList.add('tilting')
    const r = c.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height
    const k = +(c.dataset.tilt || 7)
    c.style.setProperty('--rx', ((0.5 - py) * k).toFixed(2) + 'deg')
    c.style.setProperty('--ry', ((px - 0.5) * k).toFixed(2) + 'deg')
    c.style.setProperty('--gx', (px * 100).toFixed(1) + '%')
    c.style.setProperty('--gy', (py * 100).toFixed(1) + '%')
  }, { passive: true })
}

/** スクロール量（要素が画面を通過する割合 0..1） */
export function scrollProgress(el) {
  const r = el.getBoundingClientRect()
  const total = r.height - innerHeight
  return total <= 0 ? (r.top < 0 ? 1 : 0) : Math.min(1, Math.max(0, -r.top / total))
}
