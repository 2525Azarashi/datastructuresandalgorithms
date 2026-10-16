// =========================================================
// infographics.js — スクロール連動・アニメーションするインフォグラフィック
// =========================================================
import { h, s } from '../lib/ui.js'
import { fmtJP, scrollProgress, REDUCE } from '../lib/motion.js'

// ---------- 増加レース（スクロールテリング） ----------
const OPS = 1e8 // 1 秒あたりの基本操作回数（目安）
const AGE = 4.35e17 // 宇宙の年齢 [s]
const ORDERS = [
  { k: 'O(1)', f: () => 0, c: '#2fbf71', bg: '#d3f5e2', who: '配列の i 番目' },
  { k: 'O(log n)', f: (L) => Math.log10(Math.max(1, Math.log2(10 ** L))), c: '#3fa9f5', bg: '#d8eeff', who: '二分探索' },
  { k: 'O(n)', f: (L) => L, c: '#9b7bff', bg: '#ebe2ff', who: '線形探索' },
  { k: 'O(n log n)', f: (L) => L + Math.log10(Math.max(1, Math.log2(10 ** L))), c: '#ffb020', bg: '#fff3bf', who: '良い整列' },
  { k: 'O(n²)', f: (L) => 2 * L, c: '#ff8a3d', bg: '#ffe0cc', who: '二重ループ' },
  { k: 'O(2ⁿ)', f: (L) => (10 ** L) * Math.LOG10E * Math.LN2, c: '#ff5c8a', bg: '#ffdbe7', who: '部分和の総当たり' },
]
const fmtOps = (lg) => {
  if (lg < 16) { const v = 10 ** lg; return v < 10 ? Math.round(v).toString() : fmtJP(v) }
  return `10<sup>${Math.round(lg).toLocaleString()}</sup>`
}
const fmtTime = (lg) => {
  const sec = lg - 8 // log10(秒)
  if (sec < -4) return ['一瞬', 'ok']
  if (sec < 0) return [`${(10 ** sec * 1000).toFixed(10 ** sec < 0.01 ? 2 : 0)} ミリ秒`, 'ok']
  const v = 10 ** sec
  if (sec < Math.log10(60)) return [`${v.toFixed(v < 10 ? 1 : 0)} 秒`, 'ok']
  if (sec < Math.log10(3600)) return [`${(v / 60).toFixed(0)} 分`, 'mid']
  if (sec < Math.log10(86400)) return [`${(v / 3600).toFixed(1)} 時間`, 'mid']
  if (sec < Math.log10(3.15e7)) return [`${(v / 86400).toFixed(0)} 日`, 'bad']
  if (sec < Math.log10(AGE)) return [`${fmtJP(v / 3.15e7)} 年`, 'bad']
  return ['宇宙の年齢を超える', 'boom']
}

export function growthRace() {
  const nBig = h('span.gr-n-v', '10')
  const rows = ORDERS.map((o) => {
    const bar = h('i.gr-bar', { style: { background: o.c } })
    const ops = h('span.gr-ops')
    const time = h('span.gr-time')
    const row = h('div.gr-row', { style: { '--c': o.c, '--bg': o.bg } },
      h('div.gr-k', h('b', o.k), h('small', o.who)),
      h('div.gr-track', bar, h('span.gr-fire', { 'aria-hidden': 'true' }, '🔥')),
      h('div.gr-val', ops, time))
    return { o, bar, ops, time, row }
  })
  const pbar = h('i')
  const caption = h('p.gr-cap')
  const sticky = h('div.gr-sticky',
    h('div.wrap',
      h('div.gr-head',
        h('div',
          h('div.eyebrow', 'Infographic — Order of growth'),
          h('h2.gr-title.kt-auto', 'n が増えると、何が起きる？')),
        h('div.gr-n', h('span.gr-n-k', 'n ='), nBig)),
      h('div.gr-board', rows.map((r) => r.row)),
      h('div.gr-foot', h('div.gr-prog', pbar), caption)))
  const sec = h('section.gr#growth', sticky)
  const CAP = [
    [1.4, 'n が小さいうちは、どれも <b>一瞬</b>。差なんて見えない。'],
    [2.2, 'n が 30 を超えたあたりで、<b>2ⁿ（総当たり）</b>だけが急に暴れ出す。'],
    [4.4, '2ⁿ はもう宇宙の年齢でも終わらない。ほかはまだ平気。'],
    [5.6, 'n が 10 万を超えると、<b>n²（二重ループ）</b>は「待たされる」レベルに。'],
    [99, 'n = 100 万。<b>計算量のオーダーが、速さのすべて</b>を決める。'],
  ]
  const MAXL = 12.5 // バーの最大（10^12.5 回）
  let lastL = -1
  const update = () => {
    const p = REDUCE ? 1 : scrollProgress(sec)
    const L = 1 + 5 * Math.min(1, p / 0.88)
    pbar.style.width = (p * 100).toFixed(1) + '%'
    if (Math.abs(L - lastL) < 0.004) return
    lastL = L
    nBig.textContent = Math.round(10 ** L).toLocaleString()
    rows.forEach(({ o, bar, ops, time, row }) => {
      const lg = o.f(L)
      const w = Math.min(1, Math.max(0.012, lg / MAXL))
      bar.style.transform = `scaleX(${w.toFixed(4)})`
      ops.innerHTML = fmtOps(lg) + '<small> 回</small>'
      const [t, cls] = fmtTime(lg)
      time.textContent = t
      row.dataset.state = cls
      row.classList.toggle('over', lg > MAXL)
    })
    caption.innerHTML = CAP.find(([l]) => L < l)[1] + `<span class="gr-note">※ 1 秒に 1 億回の基本操作ができるとして計算</span>`
  }
  let raf
  const loop = () => { update(); raf = requestAnimationFrame(loop) }
  raf = requestAnimationFrame(loop)
  return { el: sec, destroy: () => cancelAnimationFrame(raf) }
}

// ---------- 数字で見るこのサイト ----------
export function siteStats(items) {
  return h('div.istats', items.map(([n, label, icon, cls]) =>
    h(`div.istat.tilt.${cls}`, { 'data-tilt': 10 },
      h('div.istat-ic', { html: icon }),
      h('div.istat-n', h('span', { 'data-count': n }, '0')),
      h('div.istat-k', label))))
}

// ---------- 講義ヒーローのインフォグラフィック ----------
export function lectureInfo(lec, root) {
  const labs = root.querySelectorAll('.lab').length
  const lines = root.querySelectorAll('.talk .line').length
  const sLines = root.querySelectorAll('.talk .line.s').length
  const ratio = lines ? Math.round((sLines / lines) * 100) : 50
  const C = 2 * Math.PI * 34
  const donut = h('div.ld-donut', { html: `<svg viewBox="0 0 84 84"><circle cx="42" cy="42" r="34" fill="none" stroke="#d8eeff" stroke-width="14"/><circle class="ld-arc" cx="42" cy="42" r="34" fill="none" stroke="#ff8a3d" stroke-width="14" stroke-dasharray="${C}" style="--off:${C * (1 - ratio / 100)};--full:${C}" transform="rotate(-90 42 42)"/><circle cx="42" cy="42" r="41" fill="none" stroke="#3d2e54" stroke-width="2.4"/><circle cx="42" cy="42" r="27" fill="none" stroke="#3d2e54" stroke-width="2.4"/></svg>` },
    h('div.ld-donut-c', h('b', { 'data-count': ratio, 'data-fmt': 'pct' }, '0'), h('small', 'サカイ')))
  const box = h('div.lec-info.kt-watch',
    h('div.li-cells',
      cell(lec.chapters.length, '章', '#ffe0cc'),
      cell(labs, 'ラボ', '#d8eeff'),
      cell(lines, 'セリフ', '#d3f5e2'),
      cell(lec.quiz.length, '類題', '#ebe2ff')),
    h('div.li-talk', donut, h('div.li-talk-t', h('b', '会話の割合'), h('span', { html: `<i style="background:#ff8a3d"></i>サカイ ${ratio}%　<i style="background:#d8eeff"></i>リョウガ ${100 - ratio}%` }))))
  return box
}
const cell = (n, k, bg) => h('div.li-cell', { style: { '--bg': bg } }, h('b', { 'data-count': n, 'data-dur': 1100 }, '0'), h('span', k))

// ---------- 計算量表：成長曲線チャート ----------
export function growthChart() {
  const W = 760, H = 340, P = { l: 46, r: 120, t: 18, b: 38 }
  const N = 24, YMAX = 120
  const X = (n) => P.l + (n / N) * (W - P.l - P.r)
  const Y = (v) => H - P.b - (Math.min(v, YMAX) / YMAX) * (H - P.t - P.b)
  const F = [
    ['1', () => 1, '#2fbf71'], ['log n', (n) => Math.log2(Math.max(1, n)), '#3fa9f5'], ['n', (n) => n, '#9b7bff'],
    ['n log n', (n) => n * Math.log2(Math.max(1, n)), '#ffb020'], ['n²', (n) => n * n, '#ff8a3d'], ['2ⁿ', (n) => 2 ** n, '#ff5c8a'],
  ]
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'gchart', role: 'img', 'aria-label': '増加の速さの比較グラフ' })
  for (let v = 0; v <= YMAX; v += 20) {
    svg.appendChild(s('line', { x1: P.l, x2: W - P.r, y1: Y(v), y2: Y(v), class: 'gc-grid' }))
    svg.appendChild(s('text', { x: P.l - 10, y: Y(v) + 4, 'text-anchor': 'end', class: 'gc-tick', text: v }))
  }
  for (let n = 0; n <= N; n += 4) svg.appendChild(s('text', { x: X(n), y: H - P.b + 22, 'text-anchor': 'middle', class: 'gc-tick', text: n }))
  svg.appendChild(s('text', { x: W - P.r, y: H - 6, 'text-anchor': 'end', class: 'gc-tick', text: 'n →' }))
  svg.appendChild(s('path', { d: `M${P.l} ${P.t} V${H - P.b} H${W - P.r}`, class: 'gc-axis' }))
  F.forEach(([k, f, c], i) => {
    const pts = []
    for (let n = 0; n <= N; n += 0.1) { const v = f(n); pts.push([X(n), Y(v)]); if (v > YMAX) break }
    const d = 'M' + pts.map((p) => p.map((x) => x.toFixed(1)).join(',')).join('L')
    const g = s('g', { class: 'gc-line', style: `--d:${i * 0.22}s` })
    g.appendChild(s('path', { d, stroke: c, pathLength: 1, class: 'gc-path' }))
    const [ex, ey] = pts[pts.length - 1]
    const top = ey <= P.t + 1
    const lx = top ? ex + 9 : ex + 12, ly = top ? P.t + 14 : ey + 5 + ({ 0: 8, 1: -6 }[i] || 0)
    g.appendChild(s('circle', { cx: ex, cy: ey, r: 6, fill: c, class: 'gc-dot' }))
    g.appendChild(s('text', { x: lx, y: ly, class: 'gc-lbl', fill: c, text: k }))
    svg.appendChild(g)
  })
  return h('div.gchart-wrap.kt-watch', svg)
}
