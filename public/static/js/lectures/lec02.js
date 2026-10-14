import { h, s, svgRoot, lab, Player, stat, callout, tldr, prose, card, cols, formula, table, tex, seg, $$, range , talk, point } from '../lib/ui.js'
import { codeView } from '../lib/code.js'
import { layoutTree, drawGraph, setNodeClass } from '../lib/viz.js'

/* ---------------------------------------------------------
   第2回  計算量の評価（漸近記法）
   --------------------------------------------------------- */

const lg = (n) => Math.log2(Math.max(n, 1))
export const FUNCS = {
  '1': { f: () => 1, tex: '1', rank: 0 },
  'log n': { f: (n) => lg(n), tex: '\\log n', rank: 1 },
  'n': { f: (n) => n, tex: 'n', rank: 2 },
  'n log n': { f: (n) => n * lg(n), tex: 'n\\log n', rank: 3 },
  'n²': { f: (n) => n * n, tex: 'n^2', rank: 4 },
  'n³': { f: (n) => n ** 3, tex: 'n^3', rank: 5 },
  '2ⁿ': { f: (n) => 2 ** n, tex: '2^n', rank: 6 },
}
const T_OPTS = {
  '7n + 1': { f: (n) => 7 * n + 1, tex: '7n+1', rank: 2 },
  '6n + 1': { f: (n) => 6 * n + 1, tex: '6n+1', rank: 2 },
  'n² + 3n + 6': { f: (n) => n * n + 3 * n + 6, tex: 'n^2+3n+6', rank: 4 },
  '3n log n + 20': { f: (n) => 3 * n * lg(n) + 20, tex: '3n\\log n+20', rank: 3 },
  '50 log n': { f: (n) => 50 * lg(n), tex: '50\\log n', rank: 1 },
  '0.01n³': { f: (n) => 0.01 * n ** 3, tex: '0.01n^3', rank: 5 },
  '2ⁿ + n': { f: (n) => 2 ** n + n, tex: '2^n+n', rank: 6 },
}

/* ---------- LAB 2-1: detail doesn't matter ---------- */
function detailLab() {
  const sl = h('input', { type: 'range', min: 0, max: 5, step: .01, value: 1, style: { width: '240px' }, 'aria-label': 'n' })
  const nOut = h('span.mono.amber')
  const tbl = h('div')
  const upd = () => {
    const n = Math.round(10 ** +sl.value)
    nOut.textContent = 'n = ' + n.toLocaleString()
    const a = 6 * n + 1, b = 7 * n + 1
    tbl.innerHTML = ''
    tbl.append(h('div.stats',
      stat('代入なし 6n+1', a.toLocaleString()),
      stat('代入あり 7n+1', b.toLocaleString()),
      stat('差', (b - a).toLocaleString(), 'cy'),
      stat('(6n+1) / n', (a / n).toFixed(3), 'hl'),
      stat('(7n+1) / n', (b / n).toFixed(3), 'hl')))
  }
  sl.addEventListener('input', upd); upd()
  return lab({ title: 'LAB 2-1 — 「1 行の書き方」で計算量は変わる。でも本質は？', hint: 'n を大きくしてみよう',
    body: h('div', h('div.ctrl-row', { style: { marginBottom: '14px' } }, sl, nOut), tbl,
      h('p.small', { style: { margin: '14px 0 0' } }, 'ループ内に代入を 1 つ足しただけで 6n+1 → 7n+1。詳細な回数は記述次第で変わるが、どちらも T(n)/n は定数に収束する ＝「n に比例」という性質は変わらない。これが漸近記法で議論する理由。')) })
}

/* ---------- LAB 2-2: bound explorer ---------- */
function boundLab() {
  let tKey = '7n + 1', gKey = 'n', mode = 'O'
  let c = 8, c1 = 6, n0 = 1
  const Wd = 640, Hd = 330, pad = { l: 54, r: 18, t: 18, b: 34 }
  const svg = svgRoot(Wd, Hd)
  const nmaxSel = seg([[20, 'n ≤ 20'], [100, '≤ 100'], [1000, '≤ 1000']], 100, (v) => { nmax = v; draw() })
  let nmax = 100
  const cIn = h('input', { type: 'range', min: -2, max: 2, step: 'any', value: Math.log10(8), style: { width: '160px' }, 'aria-label': 'c' })
  const c1In = h('input', { type: 'range', min: -2, max: 2, step: 'any', value: Math.log10(6), style: { width: '160px' }, 'aria-label': 'c1' })
  const n0In = h('input', { type: 'range', min: 1, max: 100, step: 1, value: 1, style: { width: '160px' }, 'aria-label': 'n0' })
  const cLbl = h('label', 'c'), cOut = h('span.mono.amber'), c1Out = h('span.mono.cyan'), n0Out = h('span.mono')
  const verdict = h('div.narr')
  const limitBox = h('div.formula', { style: { margin: 0 } })
  const c1Row = h('div.field', h('label', 'c₁'), c1In, c1Out)
  const tSel = h('select.sel', { 'aria-label': 'T(n)' }, Object.keys(T_OPTS).map((k) => h('option', { value: k }, k)))
  const gSel = h('select.sel', { 'aria-label': 'g(n)' }, Object.keys(FUNCS).map((k) => h('option', { value: k, selected: k === 'n' }, k)))
  tSel.onchange = () => { tKey = tSel.value; draw() }
  gSel.onchange = () => { gKey = gSel.value; draw() }
  const modeSeg = seg([['O', 'O（上界）'], ['Ω', 'Ω（下界）'], ['Θ', 'Θ（両側）']], 'O', (v) => { mode = v; draw() })
  ;[cIn, c1In, n0In].forEach((x) => x.addEventListener('input', draw))

  function draw() {
    c = +(10 ** +cIn.value).toPrecision(2); c1 = +(10 ** +c1In.value).toPrecision(2)
    n0In.max = nmax; n0 = Math.min(+n0In.value, nmax)
    cOut.textContent = c; c1Out.textContent = c1; n0Out.textContent = n0
    c1Row.style.display = mode === 'Θ' ? '' : 'none'
    cLbl.textContent = mode === 'Θ' ? 'c₂' : 'c'
    const T = T_OPTS[tKey].f, g = FUNCS[gKey].f
    const N = 200, xs = range(N + 1).map((i) => 1 + (i / N) * (nmax - 1))
    const up = mode === 'Ω' ? null : (n) => c * g(n)
    const lo = mode === 'O' ? null : (n) => (mode === 'Θ' ? c1 : c) * g(n)
    let ymax = Math.max(...xs.map(T)) * 1.25
    if (!isFinite(ymax) || ymax <= 0) ymax = 1
    const X = (n) => pad.l + ((n - 1) / (nmax - 1)) * (Wd - pad.l - pad.r)
    const Y = (v) => Hd - pad.b - Math.min(1.05, v / ymax) * (Hd - pad.t - pad.b)
    svg.innerHTML = ''
    // grid
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (i / 4) * (Hd - pad.t - pad.b)
      svg.appendChild(s('line', { x1: pad.l, x2: Wd - pad.r, y1: y, y2: y, stroke: 'rgba(233,230,223,.06)' }))
      svg.appendChild(s('text', { x: pad.l - 8, y: y + 4, 'text-anchor': 'end', class: 'lbl', text: fmtN(ymax * (1 - i / 4)) }))
    }
    ;[1, Math.round(nmax / 2), nmax].forEach((n) => svg.appendChild(s('text', { x: X(n), y: Hd - 14, 'text-anchor': 'middle', class: 'lbl', text: n })))
    svg.appendChild(s('text', { x: Wd - pad.r, y: Hd - 1, 'text-anchor': 'end', class: 'lbl', text: 'n →' }))
    // n0 region
    svg.appendChild(s('rect', { x: X(n0), y: pad.t, width: Math.max(0, X(nmax) - X(n0)), height: Hd - pad.t - pad.b, fill: 'rgba(255,181,71,.04)' }))
    svg.appendChild(s('line', { x1: X(n0), x2: X(n0), y1: pad.t, y2: Hd - pad.b, stroke: '#ffb547', 'stroke-dasharray': '3 4', opacity: .6 }))
    svg.appendChild(s('text', { x: X(n0) + 5, y: pad.t + 12, class: 'lbl am', text: 'n₀ = ' + n0 }))
    // violation points
    let bad = 0, badFirst = null
    xs.forEach((n) => {
      if (n < n0) return
      const tv = T(n)
      const viol = (up && tv > up(n) + 1e-9) || (lo && tv < lo(n) - 1e-9)
      if (viol) { bad++; if (badFirst == null) badFirst = n; svg.appendChild(s('rect', { x: X(n) - 1.5, y: Hd - pad.b - 6, width: 3, height: 6, fill: '#ff6b81' })) }
    })
    const path = (f) => 'M' + xs.map((n) => `${X(n).toFixed(1)},${Y(f(n)).toFixed(1)}`).join('L')
    if (up && lo) svg.appendChild(s('path', { d: path(up) + 'L' + xs.slice().reverse().map((n) => `${X(n).toFixed(1)},${Y(lo(n)).toFixed(1)}`).join('L') + 'Z', fill: 'rgba(90,216,255,.06)' }))
    if (up) svg.appendChild(s('path', { d: path(up), stroke: '#ffb547', 'stroke-width': 2, fill: 'none', 'stroke-dasharray': '6 4' }))
    if (lo) svg.appendChild(s('path', { d: path(lo), stroke: '#5ad8ff', 'stroke-width': 2, fill: 'none', 'stroke-dasharray': '6 4' }))
    svg.appendChild(s('path', { d: path(T), stroke: '#ece9e2', 'stroke-width': 2.6, fill: 'none' }))
    const lx = Wd - pad.r - 6
    svg.appendChild(s('text', { x: lx, y: pad.t + 14, 'text-anchor': 'end', fill: '#ece9e2', 'font-size': 12, 'font-family': 'JetBrains Mono', text: 'T(n) = ' + tKey }))
    if (up) svg.appendChild(s('text', { x: lx, y: pad.t + 30, 'text-anchor': 'end', fill: '#ffb547', 'font-size': 12, 'font-family': 'JetBrains Mono', text: `${c}·g(n)  上から` }))
    if (lo) svg.appendChild(s('text', { x: lx, y: pad.t + (up ? 46 : 30), 'text-anchor': 'end', fill: '#5ad8ff', 'font-size': 12, 'font-family': 'JetBrains Mono', text: `${mode === 'Θ' ? c1 : c}·g(n)  下から` }))

    // limit-based truth
    const rt = T_OPTS[tKey].rank, rg = FUNCS[gKey].rank
    const L = rt < rg ? '0' : rt > rg ? '\\infty' : limConst(tKey, gKey)
    const okO = rt <= rg, okW = rt >= rg, okT = rt === rg
    limitBox.innerHTML = ''
    limitBox.appendChild(tex(`\\lim_{n\\to\\infty}\\frac{${T_OPTS[tKey].tex}}{${FUNCS[gKey].tex}} = ${L}`, true))
    const truth = mode === 'O' ? okO : mode === 'Ω' ? okW : okT
    const sym = mode === 'O' ? 'O' : mode === 'Ω' ? '\\Omega' : '\\Theta'
    const graphOK = bad === 0
    verdict.innerHTML = ''
    verdict.append(h('div',
      h('div', { html: `この範囲のグラフでは: ${graphOK ? `<b class="l">n ≥ n₀ で常に条件成立 ✓</b>` : `<b class="r">n = ${Math.round(badFirst)} 付近で条件が破れている（赤い印）</b>`}` }),
      h('div', { style: { marginTop: '4px' } }, '極限による判定: ', tex(`T(n) ${truth ? '=' : '\\neq'} ${sym}(${FUNCS[gKey].tex})`), truth ? h('b.l', '  正しい') : h('b.r', '  成り立たない')),
      h('div.small', { style: { marginTop: '6px' } }, truth
        ? (graphOK ? '定数 c と n₀ を見つけられた ＝ 定義を満たす。' : 'c や n₀ を調整すれば条件を満たせるはず。スライダーを動かしてみよう。')
        : (mode !== 'Ω' && rt > rg ? 'T(n) の方が増加が速いので、どんな c を選んでも、いつか必ず c·g(n) を追い越す。' : 'T(n) の方が増加が遅いので、どんな c > 0 を選んでも、いつか必ず c·g(n) の下に潜る。'))))
  }
  draw()
  return lab({
    title: 'LAB 2-2 — 定義を「触って」確かめる: c と n₀ を探せ',
    hint: 'T(n) が破線の間（または上下）に収まるか',
    body: h('div',
      h('div.ctrl-row', h('div.field', h('label', 'T(n) ='), tSel), h('div.field', h('label', 'g(n) ='), gSel), modeSeg, nmaxSel),
      h('div.sep'),
      h('div.lab-grid.wide-left',
        h('div.stage', { style: { padding: '6px' } }, svg),
        h('div', { style: { display: 'grid', gap: '12px', alignContent: 'start' } },
          h('div', { style: { display: 'grid', gap: '8px' } },
            h('div.field', cLbl, cIn, cOut), c1Row, h('div.field', h('label', 'n₀'), n0In, n0Out)),
          limitBox, verdict))),
  })
}
function limConst(t, g) {
  const m = { '7n + 1|n': '7', '6n + 1|n': '6', 'n² + 3n + 6|n²': '1', '3n log n + 20|n log n': '3', '50 log n|log n': '50', '0.01n³|n³': '0.01', '2ⁿ + n|2ⁿ': '1' }
  return m[`${t}|${g}`] || 'c'
}
function fmtN(v) { return v >= 1e6 ? v.toExponential(0).replace('e+', 'e') : v >= 1000 ? Math.round(v / 100) / 10 + 'k' : v >= 10 ? Math.round(v) : v.toFixed(1) }

/* ---------- LAB 2-3: growth race ---------- */
function growthTable() {
  const names = ['log n', 'n', 'n log n', 'n²', 'n³', '2ⁿ', '10ⁿ']
  const f = { 'log n': (n) => Math.log10(n), 'n': (n) => n, 'n log n': (n) => n * Math.log10(n), 'n²': (n) => n * n, 'n³': (n) => n ** 3, '2ⁿ': (n) => n * Math.log10(2), '10ⁿ': (n) => n }
  const isExp = (k) => k === '2ⁿ' || k === '10ⁿ'
  const fmt = (k, n) => {
    if (isExp(k)) { const e = f[k](n); return e < 6 ? Math.round(10 ** e).toLocaleString() : `10^${e < 100 ? e.toFixed(1).replace('.0', '') : Math.round(e).toLocaleString()}` }
    const v = f[k](n); return v >= 1e6 ? `10^${Math.log10(v).toFixed(0)}` : (+v.toFixed(1)).toLocaleString()
  }
  const reveal = h('button.btn', { onclick: () => { $$('td.hide', wrap).forEach((t, i) => setTimeout(() => t.classList.remove('hide'), i * 25)); reveal.remove() } }, '自分で書いてから → 答えを表示')
  const ns = [10, 100, 1000, 10000]
  const t = table(['n', ...names], ns.map((n) => [`10<sup>${Math.log10(n)}</sup>`, ...names.map((k) => fmt(k, n))]), (c, ri, ci) => (ci === 0 ? '' : 'mid hide'))
  const wrap = h('div', t, h('div.ctrl-row', reveal, h('span.small', '※ log は log₁₀。2ⁿ は 10^x で近似（スライド 14 の課題）')))
  const st = h('style', '.tbl td.hide{color:transparent!important;background:repeating-linear-gradient(45deg,transparent 0 6px,rgba(255,255,255,.03) 6px 12px);transition:color .3s}')
  return lab({ title: 'LAB 2-3 — 関数の増加の大きさを実感する', hint: 'まずノートに書いてみる', body: h('div', st, formula('1 < \\log n < n < n\\log n < n^2 < n^3 < 2^n < 10^n'), wrap) })
}

function raceLab() {
  const W = 640, H = 300, pad = { l: 46, r: 100, t: 16, b: 30 }
  const svg = svgRoot(W, H)
  const sl = h('input', { type: 'range', min: 2, max: 64, step: 1, value: 24, style: { width: '220px' }, 'aria-label': 'n の最大値' })
  const keys = ['1', 'log n', 'n', 'n log n', 'n²', 'n³', '2ⁿ']
  const col = ['#5b606b', '#5ad8ff', '#b8f36b', '#b59cff', '#ffb547', '#ff9f43', '#ff6b81']
  const draw = () => {
    const nmax = +sl.value
    svg.innerHTML = ''
    const ymaxL = Math.log10(Math.max(...keys.map((k) => FUNCS[k].f(nmax)))) + .3
    const X = (n) => pad.l + ((n - 1) / (nmax - 1)) * (W - pad.l - pad.r)
    const Y = (v) => H - pad.b - (Math.log10(Math.max(v, 1)) / ymaxL) * (H - pad.t - pad.b)
    for (let e = 0; e <= ymaxL; e += Math.max(1, Math.ceil(ymaxL / 5))) {
      svg.appendChild(s('line', { x1: pad.l, x2: W - pad.r, y1: Y(10 ** e), y2: Y(10 ** e), stroke: 'rgba(233,230,223,.06)' }))
      svg.appendChild(s('text', { x: pad.l - 6, y: Y(10 ** e) + 4, 'text-anchor': 'end', class: 'lbl', text: '10^' + e }))
    }
    svg.appendChild(s('text', { x: W - pad.r, y: H - 10, 'text-anchor': 'end', class: 'lbl', text: `n = ${nmax}` }))
    svg.appendChild(s('text', { x: pad.l, y: H - 10, class: 'lbl', text: '1' }))
    keys.forEach((k, i) => {
      const xs = range(80).map((j) => 1 + (j / 79) * (nmax - 1))
      svg.appendChild(s('path', { d: 'M' + xs.map((n) => `${X(n).toFixed(1)},${Y(FUNCS[k].f(n)).toFixed(1)}`).join('L'), stroke: col[i], 'stroke-width': 2, fill: 'none' }))
      svg.appendChild(s('text', { x: W - pad.r + 8, y: Y(FUNCS[k].f(nmax)) + 4, fill: col[i], 'font-size': 12, 'font-family': 'JetBrains Mono', text: k }))
    })
  }
  sl.addEventListener('input', draw); draw()
  return lab({ title: 'LAB 2-4 — 増加のレース（縦軸は対数目盛）', hint: 'n を伸ばすと 2ⁿ が全てを置き去りにする',
    body: h('div', h('div.ctrl-row', { style: { marginBottom: '10px' } }, h('span.small.mono', 'n の範囲'), sl), h('div.stage', { style: { padding: '6px' } }, svg)) })
}

/* ---------- LAB: set nesting ---------- */
function setLab() {
  const order = ['1', 'log n', 'n', 'n log n', 'n²', 'n³', '2ⁿ']
  let pick = 2, mode = 'O'
  const W = 640, H = 270
  const svg = svgRoot(W, H)
  const narr = h('div.narr')
  const chips = h('div.chips')
  const draw = () => {
    svg.innerHTML = ''
    const left = 14, cy = H / 2
    const RX = (i) => (i < 0 ? 0 : 38 + i * 45), RY = (i) => 30 + i * 18
    const N = order.length
    const ring = (k) => (mode === 'Ω' ? N - 1 - k : k) // order index -> nesting index
    for (let i = N - 1; i >= 0; i--) {
      const k = mode === 'Ω' ? N - 1 - i : i
      const contains = mode === 'O' ? pick <= k : mode === 'Ω' ? pick >= k : pick === k
      svg.appendChild(s('ellipse', { cx: left + RX(i), cy, rx: RX(i), ry: RY(i), fill: contains ? 'rgba(255,181,71,.04)' : 'rgba(10,12,16,.0)', stroke: contains ? '#ffb547' : 'rgba(233,230,223,.16)', 'stroke-width': contains ? 1.5 : 1, style: 'transition: all .35s' }))
      svg.appendChild(s('text', { x: left + 2 * RX(i) - 8, y: cy - 6, 'text-anchor': 'end', fill: contains ? '#ffb547' : '#868b96', 'font-size': 11.5, 'font-family': 'JetBrains Mono', text: `${mode}(${order[k]})`, style: 'transition: fill .35s' }))
    }
    const r = ring(pick)
    const px = left + (2 * RX(r - 1) + 2 * RX(r)) / 2 - (r === 0 ? 8 : 4)
    svg.appendChild(s('circle', { cx: px, cy: cy + 16, r: 5, fill: '#ffb547' }))
    svg.appendChild(s('text', { x: px, y: cy + 34, 'text-anchor': 'middle', fill: '#ffb547', 'font-size': 10.5, 'font-family': 'JetBrains Mono', text: 'T' }))
    const ins = order.filter((_, j) => (mode === 'O' ? pick <= j : mode === 'Ω' ? pick >= j : pick === j))
    narr.innerHTML = `T(n) = ${order[pick]} は <b>${ins.map((k) => `${mode}(${k})`).join(', ')}</b> に属する。` + (mode === 'O' ? '<br><span class="small">O は「上界」。増加の大きい関数の集合ほど広く、小さい集合を含む: O(n) ⊂ O(n²)。だから O(n) = O(n²) と書くのは誤り（集合として異なる）。</span>' : mode === 'Ω' ? '<br><span class="small">Ω は「下界」。包含の向きが O と逆: Ω(n²) ⊂ Ω(n) ⊂ Ω(1)。</span>' : '<br><span class="small">Θ は上と下から挟む。g(n) が（定数倍を除いて）一意に定まりやすい。</span>')
  }
  order.forEach((k, i) => chips.appendChild(h('button.op', { class: i === pick ? 'op on' : 'op', onclick: (e) => { pick = i; $$('button', chips).forEach((b) => b.classList.remove('on')); e.currentTarget.classList.add('on'); draw() } }, k)))
  draw()
  return lab({ title: 'LAB 2-5 — O・Ω・Θ は「集合」である', hint: 'T(n) を選んで、どの集合に入るか見る',
    body: h('div', h('div.ctrl-row', h('span.small.mono', 'T(n) ='), chips, seg([['O', 'O'], ['Ω', 'Ω'], ['Θ', 'Θ']], 'O', (v) => { mode = v; draw() })), h('div.sep'), h('div.stage', svg), h('div', { style: { marginTop: '12px' } }, narr)) })
}

/* ---------- properties A/B ---------- */
const ALG_A = `
int main(void) {
  int n = 10;            // O(1)
  int sum = 0;           // O(1)
  for (int i = 0; i < n; i++) {
    sum += i;            // 1回 c → n回
  }
  printf("%d\\n", sum);   // O(1)
  return 0;
}`
const ALG_B = `
int func(int n) {
  int subsum = 0;
  for (int i = 0; i < n; i++) {
    subsum += i;
  }
  return subsum;         // f(n) = O(n)
}
int main(void) {
  int n = 10;
  int sum = 0;
  for (int i = 0; i < n; i++) {
    sum += func(n);      // O(n) を n 回
  }
  printf("%d\\n", sum);
  return 0;
}`
function propLab() {
  let which = 'A'
  const box = h('div')
  const draw = () => {
    box.innerHTML = ''
    const cv = codeView(which === 'A' ? ALG_A : ALG_B)
    const steps = which === 'A'
      ? [[[2, 3, 7, 8], 'O(1)', '繰り返し以外は定数回: d = O(1)'], [[4, 5, 6], 'O(n)', '1 回 c の処理を n 回: cn = O(n)'], [[], 'O(max(1, n)) = O(n)', '性質 A: 足し算は「大きい方」が残る → T_A(n) = d + cn = O(n)']]
      : [[[2, 3, 4, 5, 6, 7], 'f(n) = O(n)', '関数 func は n 回のループ: f(n) = O(n)（性質 A）'], [[12, 13, 14], 'O(n) × n', 'main のループは func(n) を n 回呼ぶ'], [[], 'O(n · n) = O(n²)', '性質 B: 掛け算はそのまま掛ける → f(n)·n = O(n²)'], [[], 'O(max(1, n²)) = O(n²)', '性質 A: 残りの d = O(1) と足して T_B(n) = O(n²)']]
    const narr = h('div.narr')
    const big = h('div', { style: { fontSize: '22px', padding: '12px 0' } })
    const root = h('div')
    const p = new Player({ interval: 1500, keyTarget: root, render: (f) => {
      cv.querySelectorAll('.ln').forEach((r, i) => r.classList.toggle('cur', f[0].includes(i + 1)))
      big.innerHTML = ''; big.appendChild(tex(f[1])); narr.textContent = f[2]
    } })
    root.append(h('div.lab-grid', cv, h('div', { style: { display: 'grid', gap: '10px', alignContent: 'start' } }, big, narr, p.el)))
    box.appendChild(root)
    p.load(steps)
  }
  draw()
  return lab({ title: 'LAB 2-6 — 性質 A（和）と性質 B（積）でコードを見積もる', hint: '← → で 1 段ずつ',
    body: h('div', h('div.ctrl-row', { style: { marginBottom: '14px' } }, seg([['A', 'アルゴリズム A（単一ループ）'], ['B', 'アルゴリズム B（関数呼び出しの入れ子）']], 'A', (v) => { which = v; draw() })), box) })
}

/* ---------- recursion tree (supplement) ---------- */
function fibLab() {
  let n = 5, ver = 'rec'
  const out = h('div')
  const draw = () => {
    out.innerHTML = ''
    if (ver === 'loop') {
      const ops = Math.max(0, n - 1)
      out.append(h('div.stats', stat('n', String(n)), stat('ループ回数', String(ops), 'hl'), stat('オーダ', 'O(n)', 'li')),
        h('p.small', { style: { marginTop: '12px' } }, 'f1, f2 の 2 変数を更新しながら i = 2..n を 1 回ずつ回るだけ。'))
      return
    }
    // build recursion tree
    let id = 0
    const ch = {}, lab_ = {}
    const mk = (k) => { const me = id++; lab_[me] = k; ch[me] = k <= 1 ? [] : [mk(k - 2), mk(k - 1)]; return me }
    mk(n)
    const L = layoutTree(0, (u) => ch[u], { dx: n >= 6 ? 26 : 40, dy: 46, pad: 18 })
    const edges = []; Object.entries(ch).forEach(([u, cs]) => cs.forEach((c) => edges.push([+u, c])))
    const G = drawGraph({ pos: L.pos, edges, W: L.W, H: L.H, r: n >= 6 ? 10 : 13, labels: (i) => lab_[i] })
    setNodeClass(G.nodeEl, (i) => (lab_[i] <= 1 ? 'vis' : ''))
    out.append(h('div.stage.scroll-x', { style: { padding: '6px' } }, G.svg),
      h('div.stats', { style: { marginTop: '12px' } }, stat('n', String(n)), stat('fib の呼び出し回数', String(id), 'hl'), stat('葉（n≤1）', String(Object.values(lab_).filter((k) => k <= 1).length), 'cy')),
      h('p.small', { style: { marginTop: '12px' } }, 'ノードの数字 = 引数。同じ fib(k) を何度も計算している。n を 1 増やすと木は前の 2 本を合わせた大きさになり、呼び出し回数は指数的に増える。'))
  }
  const sl = h('input', { type: 'range', min: 1, max: 9, value: n, style: { width: '160px' }, 'aria-label': 'n', oninput: (e) => { n = +e.target.value; nv.textContent = n; draw() } })
  const nv = h('span.mono.amber', String(n))
  draw()
  return lab({ title: 'LAB 2-7 — 補足: 再帰呼び出しの計算量を「木」で数える', hint: '課題に出てくるフィボナッチ数の 2 つの書き方',
    body: h('div', h('div.ctrl-row', { style: { marginBottom: '14px' } }, h('div.field', h('label', 'n ='), sl, nv), seg([['rec', '再帰版 fib(n-2)+fib(n-1)'], ['loop', 'ループ版']], 'rec', (v) => { ver = v; draw() })), out) })
}

export default {
  n: 2,
  title: '計算量の評価と漸近記法',
  sub: 'O(g(n))・Ω(g(n))・Θ(g(n)) の意味と性質',
  en: 'Asymptotic Notation',
  tags: ['漸近記法', 'O / Ω / Θ', '上界・下界', '性質A/B'],
  mini: '<svg viewBox="0 0 120 60"><path d="M4 56 C40 54 70 40 116 4" stroke="#ffb547" fill="none" stroke-dasharray="4 3"/><path d="M4 56 C40 52 80 36 116 20" stroke="#ece9e2" fill="none" stroke-width="1.6"/><path d="M4 56 C40 55 80 48 116 36" stroke="#5ad8ff" fill="none" stroke-dasharray="4 3"/></svg>',
  goals: [
    '漸近記法がなぜ必要かを人に説明できる',
    '$O(g(n))$ の定義（上界）と性質 A・B を説明できる',
    '$\\Omega(g(n))$ の定義（下界）を説明できる',
    '$\\Theta(g(n))$ の定義（上下から挟む）を説明できる',
  ],
  chapters: [
    {
      id: 'why', k: 'MOTIVATION', title: 'なぜ「大雑把」に評価するのか',
      build: (el) => el.append(
        talk(`R: 前回、線形探索の最悪計算量は 6n + 1 回でしたよね。
S: うん。じゃあ、ループの中に代入を 1 つ足したら？
R: えっと、1 周 7 回になるから… 7n + 1 ですか。
S: そう。<b>たった 1 行の書き方の違いで、計算量が変わっちゃう</b>。これじゃアルゴリズムの<b>本質</b>は議論できないよね。
R: 確かに…。じゃあどうするんですか？
S: n がすごく大きいときの<b>主要項だけ</b>を見る。これが<b>漸近記法</b>。たとえば n² + 3n + 6 なら、ざっくり n² として扱う。`),
        formula('T(n) = n^2 + 3n + 6 \\;\\;\\xrightarrow{\\; n\\gg1 \\;}\\;\\; T(n) \\approx n^2'),
        detailLab(),
        talk(`R: n が大きいと、6n+1 も 7n+1 も n で割ったら定数になる…。
S: そう、どっちも「<b>n に比例</b>」っていう性質は同じ。ちなみに良いアルゴリズムの基準は、少ない操作数（<b>時間計算量</b>）、少ない変数（<b>空間計算量</b>）、それに<b>理解しやすさ</b>。最後のは実用上けっこう大事だよ。`),
        point('詳細な計算量は記述次第で変わる → <b>主要項だけ</b>で議論するために漸近記法を使う。'),
      ),
    },
    {
      id: 'kinds', k: 'OVERVIEW', title: '漸近記法の 3 種類',
      build: (el) => el.append(
        talk(`S: 漸近記法は 3 種類。どれも T(n) を、ある関数 g(n) の<b>定数倍</b>と比べる。
R: 何が違うんですか？
S: <b>上から</b>抑えるのが O、<b>下から</b>抑えるのが Ω、<b>上と下の両方</b>から挟むのが Θ。`),
        cols(3,
          card('$T(n)=O(g(n))$', 'n ≫ 1 で g(n) の定数倍で<strong>上から</strong>抑えられる（上界）。「オーダ g(n)」と読む。', 'BIG-O', 'accent'),
          card('$T(n)=\\Omega(g(n))$', 'n ≫ 1 で g(n) の定数倍で<strong>下から</strong>抑えられる（下界）。', 'BIG-OMEGA'),
          card('$T(n)=\\Theta(g(n))$', 'n ≫ 1 で g(n) の定数倍で<strong>上と下から</strong>抑えられる。', 'BIG-THETA')),
        talk(`R: T(n) = 7n + 1 だと？
S: n ≥ 1 なら 6n < 7n + 1 < 8n でしょ。<b>8n で上から、6n で下から</b>挟めるから、O(n) でも Ω(n) でも Θ(n) でもある。`),
        formula('n\\ge1:\\quad 6n \\;<\\; T(n)=7n+1 \\;<\\; 8n \\;\\;\\Rightarrow\\;\\; T(n)=O(n),\\; \\Omega(n),\\; \\Theta(n)'),
      ),
    },
    {
      id: 'bigo', k: 'DEFINITION', title: 'O(g(n)) — 上から抑える',
      build: (el) => el.append(
        talk(`S: O の定義をちゃんと書くと、<b>ある正の定数 c と n₀ が存在して、n ≥ n₀ のすべての n で T(n) ≤ c·g(n)</b>。
R: うっ、急に数学っぽい…。
S: 言い換えると「<b>ある地点から先は、g(n) を何倍かしたグラフが、ずっと T(n) の上にある</b>」ってこと。同じ意味で扱いやすい形が <b>lim T(n)/g(n) < ∞</b>。`),
        formula('T(n)=O(g(n)) \\iff \\exists\\, c>0,\\, n_0 \\;\\text{s.t.}\\; \\forall n\\ge n_0:\\; T(n)\\le c\\,g(n) \\quad\\text{or}\\quad \\lim_{n\\to\\infty}\\frac{T(n)}{g(n)}<\\infty'),
        talk(`R: 不等式の方がイメージしやすくて、極限の方が計算しやすい、って感じですか。
S: そう。※ g(n) は n > 1 で常に正、しかも単調増加とする。下のラボで、実際に c と n₀ を動かして「上から抑えられるか」を確かめてみて。`),
        boundLab(),
        talk(`R: g(n) = 1 だと、どんな c にしても T(n) がいつか追い越しますね。
S: 極限で見ても lim (7n+1)/1 = ∞ だからダメ。g(n) = n なら 7、g(n) = n² なら 0 で、どっちも有限だから OK。`),
        h('div.reveal', table(['g(n)', '$\\lim T(n)/g(n)$ （T = 7n+1）', '判定'], [
          ['1', '∞', '<span class="rose">NG</span>'],
          ['n', '7', '<span class="lime">OK → T(n) = O(n)</span>'],
          ['n²', '0', '<span class="lime">OK → T(n) = O(n²)</span>'],
        ])),
        talk(`R: 待ってください。T(n) = O(n) で、T(n) = O(n²) でもあるなら… O(n) = O(n²) ですか？
S: そこが一番の落とし穴！ <b>答えは NO</b>。<b>O(g(n)) は「集合」</b>で、T(n) = O(g(n)) は本当は T(n) ∈ O(g(n)) っていう意味なんだ。
R: 「=」は便利な書き方なだけ、ってことか。
S: そう。O(n) と O(n²) は違う集合だから、正しくは <b>O(n) ⊂ O(n²)</b>。図で見るとわかりやすいよ。`),
        setLab(),
        point('<b>T(n) ≤ c·g(n)（n ≥ n₀）</b> ⇔ <b>lim T/g < ∞</b>。O(g(n)) は集合。<b>O(n) ⊂ O(n²)</b> であって O(n) = O(n²) ではない。'),
      ),
    },
    {
      id: 'props', k: 'PROPERTIES', title: 'O の性質 A・B — コードを見積もる道具',
      build: (el) => el.append(
        talk(`R: 実際のコードの計算量って、どうやって O で表すんですか？ 毎回極限を計算するのは大変そう…。
S: そこで使うのが 2 つの性質。T₁ = O(f)、T₂ = O(g) のとき——
S: <b>性質 A（和）</b>: T₁ + T₂ = O(max(f, g))。<b>性質 B（積）</b>: T₁·T₂ = O(f·g)。`),
        formula('\\textbf{A: } T_1+T_2=O(\\max(f,g)) \\qquad \\textbf{B: } T_1T_2=O(f\\,g)'),
        talk(`R: 足し算は大きい方だけ残って、掛け算はそのまま掛ける…。
S: そう。つまり<b>順番に並んだ処理は一番重いものが支配して、入れ子になった処理は掛け算</b>。証明も極限で簡単にできる（f ≤ g とする）。`),
        prose('<p><strong>性質 A</strong>: $\\lim \\frac{T_1+T_2}{g} = \\lim\\left(\\frac{T_1}{g}+\\frac{T_2}{g}\\right) \\le \\lim\\left(\\frac{T_1}{f}+\\frac{T_2}{g}\\right) < \\infty$<br><strong>性質 B</strong>: $\\lim \\frac{T_1T_2}{fg} = \\lim\\frac{T_1}{f}\\cdot\\lim\\frac{T_2}{g} < \\infty$</p>'),
        talk(`S: スライドのアルゴリズム A と B で実際にやってみよう。← → で 1 段ずつ進めて。`),
        propLab(),
        talk(`R: B は関数の中にループがあって、それをループで呼ぶから O(n) × n = O(n²) なんですね。
S: そういうこと。全体のオーダは<b>n に対して一番増加が大きい部分</b>で決まる。じゃあ関数の「増加の大きさ」の順番を体で覚えよう。まずはノートに表を書いてから、答えを開いてね。`),
        growthTable(),
        raceLab(),
        talk(`R: 2ⁿ、n = 64 くらいで他が全部ぺしゃんこ…。
S: 指数関数は別格。<b>1 < log n < n < n log n < n² < n³ < 2ⁿ < 10ⁿ</b> の順番は、この先ずっと使うよ。`),
        point('<b>和は max、積は掛け算</b>。並んだ処理は最も重いものが支配し、入れ子は掛け算。増加の順序は <b>1 < log n < n < n log n < n² < n³ < 2ⁿ</b>。'),
      ),
    },
    {
      id: 'omega', k: 'DEFINITION', title: 'Ω(g(n)) — 下から抑える',
      build: (el) => el.append(
        talk(`S: Ω は O の<b>不等号を逆</b>にしたもの。ある正の定数 c, n₀ が存在して、n ≥ n₀ で <b>T(n) ≥ c·g(n)</b>。極限なら <b>lim T(n)/g(n) > 0</b>。
R: 今度は「下から」ですね。`),
        formula('T(n)=\\Omega(g(n)) \\iff \\exists\\, c>0,\\, n_0:\\; \\forall n\\ge n_0:\\; T(n)\\ge c\\,g(n) \\quad\\text{or}\\quad \\lim_{n\\to\\infty}\\frac{T(n)}{g(n)}>0'),
        talk(`R: 7n + 1 だと、g = 1 なら ∞ > 0 で OK、g = n なら 7 > 0 で OK、g = n² なら 0 でダメ？
S: 完璧。O とちょうど逆になってるでしょ。`),
        h('div.reveal', table(['g(n)', '$\\lim T(n)/g(n)$ （T = 7n+1）', '判定'], [
          ['1', '∞ > 0', '<span class="lime">OK → Ω(1)</span>'],
          ['n', '7 > 0', '<span class="lime">OK → Ω(n)</span>'],
          ['n²', '0', '<span class="rose">NG</span>'],
        ])),
        talk(`S: Ω も集合だよ。性質も O と同じように成り立つ。性質 A は T₁+T₂ = Ω(max(f, g))。Ω(min(f, g)) も成り立つけど、max の方が<b>タイト</b>（きつい評価）。性質 B は T₁T₂ = Ω(f·g)。
R: 証明は O と同じようにできる、って宿題になってましたね。
S: それともう 1 つ。<b>講義の Ω の定義は教科書と違う</b>んだ。どっちの条件が厳しいか、教科書 p.16 と見比べておいて。課題で聞かれるよ。`),
        point('Ω は <b>T(n) ≥ c·g(n)</b> ⇔ <b>lim T/g > 0</b>。包含の向きは O と逆で <b>Ω(n²) ⊂ Ω(n) ⊂ Ω(1)</b>。'),
      ),
    },
    {
      id: 'theta', k: 'DEFINITION', title: 'Θ(g(n)) — 上と下から挟む',
      build: (el) => el.append(
        talk(`S: 最後が Θ。正の定数 c₁, c₂, n₀ が存在して、n ≥ n₀ で <b>c₁·g(n) ≤ T(n) ≤ c₂·g(n)</b>。極限なら <b>0 < lim T(n)/g(n) < ∞</b>。
R: O と Ω の両方を満たす、ってことですね。
S: そう。T(n) = O(g(n)) かつ T(n) = Ω(g(n)) なら Θ(g(n))。逆が成り立つかは、定義を見比べて考えてみて。`),
        formula('T(n)=\\Theta(g(n)) \\iff 0<\\lim_{n\\to\\infty}\\frac{T(n)}{g(n)}<\\infty'),
        h('div.reveal', table(['g(n)', '$\\lim T(n)/g(n)$ （T = 7n+1）', '判定'], [
          ['1', '∞', '<span class="rose">NG（Ω(1) のみ）</span>'],
          ['n', '7', '<span class="lime">OK → Θ(n)</span>'],
          ['n²', '0', '<span class="rose">NG（O(n²) のみ）</span>'],
        ])),
        talk(`R: O だと O(n) も O(n²) も正しかったけど、Θ だと Θ(n) しか残らない…。
S: それが Θ のいいところ。<b>g(n) が一意に定まりやすい</b>。LAB 2-2 で「Θ」を選んで、2 本の線の間に T(n) を閉じ込めてみるといいよ。
R: 多項式だったら、一番次数の高い項で決まるんですよね？
S: そう。$T(n)=\\sum_{i=0}^{d} a_i n^i$（$a_i>0$）なら主要項は $n^d$。lim T(n)/n^k が有限か、正かは、<b>k と d の大小だけ</b>で決まる。課題に出るから、どの条件で O・Ω・Θ になるか自分で整理しておいて。`),
        talk(`R: あと課題に、フィボナッチ数を求める 2 つの書き方が出てきますよね。
S: ループ版と再帰版ね。再帰版は呼び出しが<b>木</b>みたいに枝分かれする。描いてみると、計算量のオーダがどうなるか一目でわかるよ。`),
        fibLab(),
        point('Θ は <b>0 < lim T/g < ∞</b>。O と Ω の両方を満たし、g(n) が一意に定まりやすい。講義・教科書では主に O を使う。'),
      ),
    },
  ],
  quiz: [
    { kind: 'multi', tag: '概念', q: '漸近記法を使う理由として<strong>適切なもの</strong>をすべて選べ。', opts: ['操作の僅かな違いも含めた詳細な計算量を議論できるから', '操作が僅かに違うだけで詳細な計算量は変わるため、詳細な議論は無意味だから', '主要項に着目し、おおまかな計算量を議論できるから'], answer: [1, 2], explain: '漸近記法は詳細を「捨てる」ための道具。A は逆のことを言っている。' },
    { kind: 'input', tag: '計算', q: '$T(n) = 4n^2 + 100n + 7$ のとき、$\\lim_{n\\to\\infty} T(n)/n^2$ の値は？', answer: '4', explain: '主要項 4n² 以外は n² で割ると 0 に行く。よって 4（有限かつ正なので Θ(n²)）。' },
    { kind: 'multi', tag: '集合', q: '$T(n) = 3n\\log n + 5$ が属するものをすべて選べ。', opts: ['$O(n)$', '$O(n^2)$', '$\\Omega(n)$', '$\\Theta(n\\log n)$', '$\\Omega(n^2)$'], answer: [1, 2, 3], explain: 'n < n log n < n² の順。上界は n log n 以上、下界は n log n 以下の関数ならよい。' },
    { kind: 'choice', tag: '性質', q: '$T_1(n)=O(n^2)$, $T_2(n)=O(n\\log n)$ のとき $T_1(n)+T_2(n)$ は？', opts: ['$O(n^2\\log n)$', '$O(n^2)$', '$O(n\\log n)$', '$O(n^3\\log n)$'], answer: 1, explain: '性質 A: 和は max。max(n², n log n) = n²。' },
    { kind: 'choice', tag: '性質', q: '$O(n)$ の処理を行う関数を、$n^2$ 回まわる二重ループの中で呼ぶ。全体の時間計算量は？', opts: ['$O(n^2)$', '$O(n^3)$', '$O(n^4)$', '$O(2^n)$'], answer: 1, explain: '性質 B: O(n) × n² = O(n³)。' },
    { kind: 'choice', tag: '誤用', q: '次のうち<strong>正しい</strong>記述はどれか？', opts: ['$O(n)=O(n^2)$', '$O(n)\\subset O(n^2)$', '$O(n^2)\\subset O(n)$', '$\\Omega(n)\\subset\\Omega(n^2)$'], answer: 1, explain: 'O(n) の要素は必ず O(n²) の要素。Ω は向きが逆で Ω(n²) ⊂ Ω(n)。' },
    { kind: 'input', tag: '計算', q: '$T(n)=7n+1$ が $T(n)\\le c\\cdot n$ を $n\\ge1$ で常に満たす最小の整数 c は？', answer: '8', explain: 'n = 1 で T = 8 なので c ≥ 8 が必要。c = 8 なら 7n+1 ≤ 8n ⇔ n ≥ 1 で成立。' },
    { kind: 'choice', tag: '並び', q: '増加の小さい順に正しく並んでいるのは？', opts: ['$\\log n < n\\log n < n < n^2$', '$n < \\log n < n^2 < 2^n$', '$\\log n < n < n\\log n < 2^n$', '$n^3 < 2^n < n^2 < 10^n$'], answer: 2, explain: '1 < log n < n < n log n < n² < n³ < 2ⁿ < 10ⁿ。' },
  ],
}
