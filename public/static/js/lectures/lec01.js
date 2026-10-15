import { h, s, svgRoot, lab, Player, stat, callout, tldr, prose, card, cols, formula, table, parseNums, $$, range , talk, point } from '../lib/ui.js'
import { codeView } from '../lib/code.js'

/* ---------------------------------------------------------
   第1回  計算とアルゴリズム，アルゴリズムの例
   --------------------------------------------------------- */

const GCD_SRC = `
#include<stdio.h>
int main(void)
{
  int a = 110, b = 45; // 入力
  int x, y, z; // 途中計算用
  int gcd;     // 出力

  x = a;  // 大きい方
  y = b;  // 小さい方

  while (y != 0) {
    z = x % y;  // 余りを求める
    x = y;
    y = z;
  }
  gcd = x;    // 出力に書き込み

  return 0;
}`

const LS_SRC = `
#include<stdio.h>
#define n 5
int main(void)
{
  int dat[n] = {3, 8, 43, 15, 6};
  int a = 15;
  int result;

  int i = 0;
  while (i < n) {
    if (dat[i] == a) {
      break;
    }
    i++;
  }
  result = i;

  return 0;
}`

const SS_SRC = `
for (int i = 0; i < (1<<n); i++) { // 2^n回
  dec2bin(i, x);  // i を2進数に
  sum = 0;
  for (int j = 0; j < n; j++) {     // n回
    sum += a[j] * x[j];  // 部分和
  }
  if (sum == b) {
    printf("YES\\n");   // S が存在
    return 0;
  }
}
printf("NO\\n");  // S は存在しない`

/* ---------- Ch1: algorithm model diagram ---------- */
function algoDiagram() {
  const svg = svgRoot(760, 230)
  const box = (x, y, w, hh, label, sub, cls) => s('g', {},
    s('rect', { x, y, width: w, height: hh, rx: 12, fill: cls === 'am' ? 'rgba(255,138,61,.08)' : '#ffffff', stroke: cls === 'am' ? '#ff8a3d' : 'rgba(61,46,84,.18)' }),
    s('text', { x: x + w / 2, y: y + hh / 2 - (sub ? 9 : 0), 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: cls === 'am' ? '#ff8a3d' : '#3d2e54', 'font-size': 17, 'font-weight': 700, 'font-family': 'Zen Kaku Gothic New', text: label }),
    sub ? s('text', { x: x + w / 2, y: y + hh / 2 + 14, 'text-anchor': 'middle', fill: '#8a7f9e', 'font-size': 11.5, 'font-family': 'JetBrains Mono', text: sub }) : null)
  const flow = (x1, x2, y) => s('g', {},
    s('line', { x1, y1: y, x2, y2: y, stroke: 'rgba(61,46,84,.3)', 'stroke-width': 1.5, 'stroke-dasharray': '4 5' }),
    s('circle', { r: 4, fill: '#3fa9f5' }, s('animateMotion', { dur: '1.8s', repeatCount: 'indefinite', path: `M${x1},${y} L${x2},${y}` })),
    s('path', { d: `M${x2 - 8},${y - 5} L${x2},${y} L${x2 - 8},${y + 5}`, stroke: 'rgba(61,46,84,.5)', fill: 'none', 'stroke-width': 1.5 }))
  svg.append(
    s('rect', { x: 210, y: 20, width: 340, height: 190, rx: 18, fill: 'none', stroke: 'rgba(63,169,245,.35)', 'stroke-dasharray': '6 6' }),
    s('text', { x: 380, y: 196, 'text-anchor': 'middle', fill: '#3fa9f5', 'font-size': 12, 'font-family': 'JetBrains Mono', text: '計算機モデル（使える操作の集合）' }),
    box(20, 80, 150, 70, '入力', 'a = 110, b = 45'),
    box(270, 62, 220, 106, 'アルゴリズム', '有限の機械的操作', 'am'),
    box(590, 80, 150, 70, '出力', 'gcd = 5'),
    flow(172, 266, 115), flow(494, 586, 115))
  return h('div.stage', { style: { padding: '8px 4px' } }, svg)
}

/* ---------- Ch2: Euclid ---------- */
function euclidSteps(a, b) {
  const st = []
  const cnt = {}
  const push = (line, v, msg, extra = {}) => { cnt[line] = (cnt[line] || 0) + 1; st.push({ line, v: { ...v }, msg, cnt: { ...cnt }, ...extra }) }
  let v = { a, b, x: '?', y: '?', z: '?', gcd: '?' }
  push(4, v, `入力 <b>a = ${a}</b>, <b>b = ${b}</b> を読み込む`)
  v.x = a; push(8, v, `x ← a（大きい方）。x = <b>${a}</b>`)
  v.y = b; push(9, v, `y ← b（小さい方）。y = <b>${b}</b>`)
  const pairs = [[a, b]]
  let k = 0
  while (true) {
    push(11, v, v.y !== 0 ? `y = ${v.y} ≠ 0 なのでループを続ける` : `y = 0 になった → ループ終了`, { pairs: pairs.slice(), k })
    if (v.y === 0) break
    const q = Math.floor(v.x / v.y)
    v.z = v.x % v.y; push(12, v, `z ← x % y = ${v.x} % ${v.y} = <b>${v.z}</b>（${v.x} = ${q}×${v.y} + ${v.z}）`, { pairs: pairs.slice(), k, cut: true })
    v.x = v.y; push(13, v, `x ← y。<span class="c">gcd(${pairs[k][0]}, ${pairs[k][1]}) = gcd(${v.y}, ${v.z})</span> に問題が縮んだ`, { pairs: pairs.slice(), k: k + 1 })
    v.y = v.z; pairs.push([v.x, v.y]); k++
    push(14, v, `y ← z。次は x = ${v.x}, y = ${v.y} で同じことを繰り返す`, { pairs: pairs.slice(), k })
  }
  v.gcd = v.x; push(16, v, `gcd ← x。答えは <b class="l">${v.x}</b>`, { pairs: pairs.slice(), k, done: true })
  return st
}
function euclidTiles(a, b) {
  // 長方形 a×b から正方形を切り出していく
  const tiles = []
  let x = 0, y = 0, w = a, hh = b, step = 0
  while (w > 0 && hh > 0) {
    if (w >= hh) { const q = Math.floor(w / hh); for (let i = 0; i < q; i++) tiles.push({ x: x + i * hh, y, s: hh, step }); x += q * hh; w -= q * hh }
    else { const q = Math.floor(hh / w); for (let i = 0; i < q; i++) tiles.push({ x, y: y + i * w, s: w, step }); y += q * w; hh -= q * w }
    step++
  }
  return tiles
}
function euclidLab() {
  const ia = h('input.num', { type: 'number', value: 110, min: 1, 'aria-label': 'a' })
  const ib = h('input.num', { type: 'number', value: 45, min: 1, 'aria-label': 'b' })
  const code = codeView(GCD_SRC, { counts: true })
  code.style.maxHeight = '430px'
  const narr = h('div.narr')
  const varsEl = h('div.vars')
  const stage = h('div.stage', { style: { aspectRatio: '1.6', display: 'grid', placeItems: 'center', padding: '14px' } })
  const chain = h('div.chips', { style: { marginTop: '10px' } })
  const sL12 = stat('12行目の実行回数', '0', 'hl')
  let tiles = [], A = 110, B = 45, svg, rects = []
  let prevV = {}
  const build = () => {
    let a = Math.max(1, Math.floor(+ia.value || 1)), b = Math.max(1, Math.floor(+ib.value || 1))
    if (b > a) [a, b] = [b, a]
    A = a; B = b
    tiles = euclidTiles(a, b)
    const W = 400, sc = W / a, Hh = b * sc
    svg = svgRoot(W + 2, Hh + 2, { style: { maxHeight: '300px', width: '100%' } })
    svg.appendChild(s('rect', { x: 1, y: 1, width: W, height: Hh, fill: 'none', stroke: 'rgba(61,46,84,.35)', 'stroke-dasharray': '3 4' }))
    const pal = ['#ff8a3d', '#3fa9f5', '#2fbf71', '#9b7bff', '#ff5c8a', '#ffd23f', '#8fd0ff']
    rects = tiles.map((t) => {
      const r = s('rect', { x: 1 + t.x * sc, y: 1 + t.y * sc, width: Math.max(.6, t.s * sc), height: Math.max(.6, t.s * sc), fill: pal[t.step % pal.length], 'fill-opacity': .16, stroke: pal[t.step % pal.length], 'stroke-width': 1, opacity: 0, style: 'transition: opacity .45s' })
      svg.appendChild(r)
      if (t.s * sc > 26) svg.appendChild(s('text', { x: 1 + (t.x + t.s / 2) * sc, y: 1 + (t.y + t.s / 2) * sc, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: pal[t.step % pal.length], 'font-size': Math.min(14, t.s * sc / 3), 'font-family': 'JetBrains Mono', opacity: 0, 'data-step': t.step, class: 'tlabel', text: t.s, style: 'transition: opacity .45s' }))
      return r
    })
    stage.innerHTML = ''
    stage.appendChild(svg)
    prevV = {}
    player.load(euclidSteps(a, b))
  }
  const render = (f) => {
    code.cur(f.line)
    code.counts(f.cnt)
    narr.innerHTML = f.msg
    varsEl.innerHTML = ''
    Object.entries(f.v).forEach(([k, v]) => varsEl.appendChild(h('div.var', { class: prevV[k] !== undefined && prevV[k] !== v ? 'var changed' : 'var' }, h('span.n', k), h('span.v', v))))
    prevV = f.v
    const shown = f.k == null ? -1 : f.cut ? f.k : f.k - 1
    rects.forEach((r, i) => r.setAttribute('opacity', tiles[i].step <= shown ? 1 : 0))
    $$('.tlabel', svg).forEach((t) => t.setAttribute('opacity', +t.dataset.step <= shown ? 1 : 0))
    sL12.set(String(f.cnt[12] || 0))
    chain.innerHTML = ''
    ;(f.pairs || [[A, B]]).forEach(([x, y], i, arr) => {
      chain.appendChild(h('span.chip', { class: i === arr.length - 1 ? (f.done ? 'chip li' : 'chip am') : 'chip' }, `gcd(${x}, ${y})`))
      if (i < arr.length - 1) chain.appendChild(h('span.muted.mono', '='))
    })
    if (f.done) chain.append(h('span.muted.mono', '='), h('span.chip.li', String(f.v.gcd)))
  }
  const root = h('div')
  const player = new Player({ render, interval: 1000, keyTarget: root })
  ia.addEventListener('change', build); ib.addEventListener('change', build)
  const presets = h('div.ctrl-row', h('span.small', '例:'), [[110, 45], [252, 105], [89, 55], [1071, 1029]].map(([x, y]) => h('button.op', { onclick: () => { ia.value = x; ib.value = y; build() } }, `${x}, ${y}`)))
  root.append(lab({
    title: 'LAB 1-1 — ユークリッドの互除法をステップ実行',
    hint: '← → で1行ずつ / Space で再生',
    body: h('div',
      h('div.ctrl-row', h('div.field', h('label', 'a ='), ia), h('div.field', h('label', 'b ='), ib), presets),
      h('div.sep'),
      h('div.lab-grid',
        h('div', { style: { display: 'grid', gap: '12px', alignContent: 'start' } },
          h('div', { style: { position: 'relative' } }, stage, h('span.stage-label', `長方形 a × b から正方形を切り出す`)),
          chain, narr, varsEl, h('div.stats', sL12)),
        code)),
    foot: player.el,
  }))
  build()
  return root
}

/* ---------- Ch4: linear search ---------- */
function lsSteps(arr, a) {
  const st = []
  let ops = 0
  const br = { assign: 0, read: 0, cmp: 0, add: 0, jump: 0, out: 0 }
  const push = (line, i, msg, cls = {}, add = {}) => {
    Object.entries(add).forEach(([k, v]) => { br[k] += v; ops += v })
    st.push({ line, i, msg, cls, ops, br: { ...br } })
  }
  push(9, 0, '初期化: i ← 0（代入 1 回）', {}, { assign: 1 })
  let i = 0
  for (; i < arr.length; i++) {
    push(10, i, `i = ${i} < n = ${arr.length} を確認（比較 1 回）`, { cur: i }, { cmp: 1 })
    if (arr[i] === a) {
      push(11, i, `dat[${i}] = ${arr[i]} と a = ${a} を比較 → <b class="l">一致</b>（読込 2・比較 1）`, { cur: i, ok: i }, { read: 2, cmp: 1 })
      push(12, i, `break でループを抜ける（ジャンプ 1）`, { ok: i }, { jump: 1 })
      break
    }
    push(11, i, `dat[${i}] = ${arr[i]} ≠ a = ${a}（読込 2・比較 1）`, { cur: i, bad: i }, { read: 2, cmp: 1 })
    push(14, i, `i++（加算 1）`, { vis: i }, { add: 1 })
    push(15, i + 1, `ループ先頭へ戻る（ジャンプ 1）`, { vis: i }, { jump: 1 })
  }
  if (i === arr.length) push(10, i, `i = n なのでループ終了（a は見つからない）`, {}, { cmp: 1 })
  push(16, i, `result ← ${i}（出力書込 1 回）。答えは <b>${i}</b>`, { ok: i < arr.length ? i : -1, done: true }, { out: 1 })
  return st
}
function cellsRow(n, W, y, cw = 52) {
  const g = s('g')
  const gap = 6, total = n * cw + (n - 1) * gap, x0 = (W - total) / 2
  const cells = range(n).map((i) => {
    const c = s('g', { class: 'cell', transform: `translate(${x0 + i * (cw + gap)},${y})` },
      s('rect', { width: cw, height: cw, rx: 9 }),
      s('text', { x: cw / 2, y: cw / 2, class: 'v' }),
      s('text', { x: cw / 2, y: cw + 14, class: 'idx' }, String(i)))
    g.appendChild(c)
    return c
  })
  return { g, cells, x0, cw, gap }
}
function linearLab() {
  const inp = h('input.txt', { value: '3, 8, 43, 15, 6', 'aria-label': '数列' })
  const ia = h('input.num', { type: 'number', value: 15, 'aria-label': 'a' })
  const code = codeView(LS_SRC, { counts: false })
  const stage = h('div.stage', { style: { padding: '30px 10px 16px' } })
  const narr = h('div.narr')
  const sOps = stat('操作回数（累計）', '0', 'hl')
  const sI = stat('i', '0', 'cy')
  const brk = h('div.small.mono', { style: { lineHeight: '1.9' } })
  let row, ptr, arr = [], A
  const build = () => {
    arr = parseNums(inp.value).slice(0, 12)
    if (!arr.length) arr = [3, 8, 43, 15, 6]
    A = +ia.value
    const W = Math.max(380, arr.length * 58 + 40)
    const svg = svgRoot(W, 108)
    row = cellsRow(arr.length, W, 34)
    row.cells.forEach((c, i) => (c.querySelector('.v').textContent = arr[i]))
    ptr = s('g', { style: 'transition: transform .35s cubic-bezier(.2,.8,.2,1)' },
      s('text', { x: row.cw / 2, y: 8, 'text-anchor': 'middle', class: 'lbl am', text: 'i' }),
      s('path', { d: `M${row.cw / 2 - 6},14 L${row.cw / 2},24 L${row.cw / 2 + 6},14`, fill: '#ff8a3d' }))
    svg.append(row.g, ptr)
    stage.innerHTML = ''
    stage.appendChild(svg)
    const src = LS_SRC.replace('#define n 5', `#define n ${arr.length}`).replace('{3, 8, 43, 15, 6}', `{${arr.join(', ')}}`).replace('int a = 15', `int a = ${A}`)
    const nc = codeView(src)
    codeRef.replaceWith(nc)
    codeRef = nc
    player.load(lsSteps(arr, A))
  }
  let codeRef = code
  const render = (f) => {
    codeRef.cur(f.line)
    narr.innerHTML = f.msg
    row.cells.forEach((c, i) => {
      const st = f.cls.ok === i ? 'ok' : f.cls.cur === i ? 'cur' : f.cls.bad === i ? 'bad' : i < f.i || f.cls.vis === i ? 'vis' : ''
      c.setAttribute('class', 'cell ' + st)
    })
    const pi = Math.min(f.i, arr.length - 1)
    ptr.setAttribute('transform', `translate(${row.x0 + pi * (row.cw + row.gap)},0)`)
    ptr.style.opacity = f.i >= arr.length ? .3 : 1
    sOps.set(String(f.ops)); sI.set(String(f.i))
    const b = f.br
    brk.innerHTML = `代入 ${b.assign} ・ 読込 ${b.read} ・ 比較 ${b.cmp} ・ 加算 ${b.add} ・ ジャンプ ${b.jump} ・ 出力 ${b.out}`
  }
  const root = h('div')
  const player = new Player({ render, interval: 650, keyTarget: root })
  inp.addEventListener('change', build); ia.addEventListener('change', build)
  root.append(lab({
    title: 'LAB 1-2 — 線形探索の「操作回数」を数える',
    hint: '数列と a を変えてみよう',
    body: h('div',
      h('div.ctrl-row', h('div.field', h('label', 'dat ='), inp), h('div.field', h('label', 'a ='), ia),
        h('button.op', { onclick: () => { ia.value = arr[0]; build() } }, '最良の場合'),
        h('button.op', { onclick: () => { ia.value = arr[arr.length - 1]; if (arr.indexOf(arr[arr.length - 1]) !== arr.length - 1) ia.value = arr[arr.length - 1]; build() } }, '最悪の場合')),
      h('div.sep'),
      h('div.lab-grid',
        h('div', { style: { display: 'grid', gap: '12px', alignContent: 'start' } }, stage, narr, h('div.stats', sOps, sI), brk),
        code)),
    foot: player.el,
  }))
  build()
  return root
}

/* growth comparison */
function growthLab() {
  const sl = h('input', { type: 'range', min: 1, max: 6, step: 0.01, value: 2, style: { width: '260px' }, 'aria-label': 'n（対数スケール）' })
  const nOut = h('span.mono.amber', { style: { fontSize: '20px' } })
  const bars = h('div', { style: { display: 'grid', gap: '12px' } })
  const rows = [
    ['最悪 6n+1', (n) => 6 * n + 1, '#ff5c8a', '最後に一致'],
    ['平均 ≈ 3n', (n) => 3 * n, '#ff8a3d', '等確率で一致'],
    ['最良 7', () => 7, '#2fbf71', '先頭で一致'],
    ['二分探索 ≈ log₂n', (n) => Math.max(1, Math.ceil(Math.log2(n))), '#3fa9f5', '整列済みの数列なら'],
  ]
  const els = rows.map(([k, , c, note]) => {
    const fill = h('div', { style: { height: '100%', width: '0%', background: c, borderRadius: '4px', transition: 'width .25s', minWidth: '2px' } })
    const val = h('span.mono', { style: { color: c } })
    bars.appendChild(h('div', { style: { display: 'grid', gridTemplateColumns: '150px 1fr 120px', gap: '14px', alignItems: 'center' } },
      h('div', h('div.mono', { style: { fontSize: '13px' } }, k), h('div.small', note)),
      h('div', { style: { height: '14px', background: 'var(--bg)', borderRadius: '4px', border: '1px solid var(--line)' } }, fill), val))
    return { fill, val }
  })
  const upd = () => {
    const n = Math.round(10 ** +sl.value)
    nOut.textContent = 'n = ' + n.toLocaleString()
    const mx = 6 * n + 1
    rows.forEach(([, f], i) => { const v = f(n); els[i].fill.style.width = (v / mx) * 100 + '%'; els[i].val.textContent = v.toLocaleString() + ' 回' })
  }
  sl.addEventListener('input', upd)
  upd()
  return lab({ title: 'LAB 1-3 — n を大きくすると何が効いてくる？', hint: 'スライダーは対数目盛（10 〜 1,000,000）',
    body: h('div', h('div.ctrl-row', { style: { marginBottom: '18px' } }, sl, nOut), bars,
      h('p.small', { style: { margin: '16px 0 0' } }, '最良計算量はいつも 7 回。でも「たまたま先頭にあった」幸運に頼った評価は役に立たない。だから普通は最悪（と平均）で語る。そして整列というデータ構造を使うと、二分探索の棒はほぼ見えないほど短くなる。')) })
}

/* ---------- Ch5: subset sum ---------- */
function subsetLab() {
  const inp = h('input.txt', { value: '8, 2, 13, 9, 5', 'aria-label': '正整数の列' })
  const ib = h('input.num', { type: 'number', value: 19, 'aria-label': 'b' })
  const grid = h('div', { style: { display: 'grid', gap: '4px' } })
  const narr = h('div.narr')
  const sI = stat('i（今の組合せ番号）', '0', 'hl')
  const s18 = stat('加算の実行回数（スライド20の18行目）', '0', 'cy')
  const sAns = stat('出力', '—', 'li')
  const bitsView = h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' } })
  const code = codeView(SS_SRC)
  let a = [], B = 0, tiles = []
  const build = () => {
    a = parseNums(inp.value).filter((x) => x > 0).slice(0, 7)
    if (!a.length) a = [8, 2, 13, 9, 5]
    B = +ib.value
    const n = a.length, N = 1 << n
    grid.style.gridTemplateColumns = `repeat(${n <= 4 ? 8 : n === 5 ? 8 : 16}, 1fr)`
    grid.innerHTML = ''
    tiles = range(N).map((i) => {
      let sum = 0; for (let j = 0; j < n; j++) if ((i >> j) & 1) sum += a[j]
      const t = h('div.mono', { title: `i=${i}: sum=${sum}`, style: { aspectRatio: '1', borderRadius: '5px', border: '1px solid var(--line)', background: 'var(--bg)', fontSize: n > 5 ? '9px' : '11px', display: 'grid', placeItems: 'center', color: 'var(--mute-2)', transition: 'all .25s' } }, sum)
      grid.appendChild(t)
      return { el: t, sum }
    })
    const steps = []
    let c18 = 0, found = -1
    for (let i = 0; i < N; i++) {
      c18 += n
      steps.push({ i, c18, sum: tiles[i].sum, hit: tiles[i].sum === B })
      if (tiles[i].sum === B) { found = i; break }
    }
    steps.push({ i: found >= 0 ? found : N - 1, c18, done: true, found })
    player.load(steps)
  }
  const render = (f) => {
    const n = a.length
    tiles.forEach((t, i) => {
      const st = t.el.style
      if (i < f.i || (f.done && i <= f.i)) { st.background = 'var(--cyan-soft)'; st.borderColor = 'rgba(63,169,245,.35)'; st.color = 'var(--cyan-t)' }
      else if (i === f.i) { st.background = 'var(--amber-soft)'; st.borderColor = 'var(--amber)'; st.color = 'var(--amber-t)' }
      else { st.background = 'var(--bg)'; st.borderColor = 'var(--line)'; st.color = 'var(--mute-2)' }
      if (f.done && f.found === i) { st.background = 'var(--lime-soft)'; st.borderColor = 'var(--lime)'; st.color = 'var(--lime-t)' }
    })
    bitsView.innerHTML = ''
    range(n).forEach((j) => {
      const on = (f.i >> j) & 1
      bitsView.appendChild(h('div', { style: { textAlign: 'center' } },
        h('div.mono', { style: { fontSize: '10px', color: 'var(--mute-2)' } }, `x[${j}]=${on}`),
        h('div.chip', { class: on ? 'chip am' : 'chip', style: { opacity: on ? 1 : .35, animation: 'none' } }, a[j])))
    })
    sI.set(String(f.i)); s18.set(String(f.c18))
    if (f.done) {
      sAns.set(f.found >= 0 ? 'YES' : 'NO')
      const S = f.found >= 0 ? range(n).filter((j) => (f.found >> j) & 1) : []
      narr.innerHTML = f.found >= 0 ? `<b class="l">YES</b> — S = {${S.join(', ')}}（${S.map((j) => a[j]).join(' + ')} = ${B}）。i = ${f.found} まで ${f.found + 1} 通り試し、18 行目は ${f.found + 1} × ${n} = <b>${f.c18}</b> 回` : `<b class="r">NO</b> — 全 2<sup>${n}</sup> = ${1 << n} 通りを試しても和が ${B} にならない。18 行目は ${1 << n} × ${n} = <b>${f.c18}</b> 回`
      code.cur(f.found >= 0 ? 8 : 12)
    } else {
      sAns.set('—')
      narr.innerHTML = `i = ${f.i} = (${f.i.toString(2).padStart(n, '0').split('').reverse().join('')})₂ ※x[0]が左 → 選んだ数の和 = <b>${f.sum}</b> ${f.hit ? '= b !' : '≠ ' + B}`
      code.cur(f.hit ? 7 : 5)
    }
  }
  const root = h('div')
  const player = new Player({ render, interval: 420, keyTarget: root })
  inp.addEventListener('change', build); ib.addEventListener('change', build)
  root.append(lab({
    title: 'LAB 1-4 — 部分和問題を総当たりで解く',
    hint: '各マス = 1つの組合せ（中の数字はその和）',
    body: h('div',
      h('div.ctrl-row', h('div.field', h('label', 'a ='), inp), h('div.field', h('label', 'b ='), ib), h('span.small', '最大 7 個まで')),
      h('div.sep'),
      h('div.lab-grid',
        h('div', { style: { display: 'grid', gap: '12px', alignContent: 'start' } }, bitsView, grid, narr, h('div.stats', sI, s18, sAns)),
        code)),
    foot: player.el,
  }))
  build()
  return root
}

function explosionLab() {
  const sl = h('input', { type: 'range', min: 1, max: 60, value: 20, style: { width: '260px' }, 'aria-label': 'n' })
  const out = h('div.stats')
  const a1 = stat('n', ''), a2 = stat('組合せ 2ⁿ', '', 'hl'), a3 = stat('n × 2ⁿ 回', '', 'cy'), a4 = stat('1 秒に 10⁹ 回なら', '', 'li')
  out.append(a1, a2, a3, a4)
  const fmt = (x) => { if (x < 1e6) return Math.round(x).toLocaleString(); const [m, e] = x.toExponential(2).split('e+'); return `${m} × 10<sup>${e}</sup>` }
  const tm = (sec) => sec < 1e-3 ? (sec * 1e6).toFixed(1) + ' µs' : sec < 1 ? (sec * 1e3).toFixed(1) + ' ms' : sec < 60 ? sec.toFixed(1) + ' 秒' : sec < 3600 ? (sec / 60).toFixed(1) + ' 分' : sec < 86400 * 365 ? (sec / 3600 / 24).toFixed(1) + ' 日' : fmt(sec / 86400 / 365) + ' 年'
  const upd = () => { const n = +sl.value; const t = n * 2 ** n; a1.set(String(n)); a2.set(fmt(2 ** n)); a3.set(fmt(t)); a4.set(tm(t / 1e9)) }
  sl.addEventListener('input', upd); upd()
  return lab({ title: 'LAB 1-5 — 指数時間の爆発', hint: 'n を 1 増やすたびに 2 倍以上', body: h('div', h('div.ctrl-row', { style: { marginBottom: '14px' } }, sl), out,
    h('p.small', { style: { margin: '14px 0 0' } }, 'n = 60 でも宇宙の年齢を超える。総当たりは正しいが遅い — 動的計画法（教科書 5.3.1 節）でもっと速く解ける。')) })
}

/* ---------- module ---------- */
export default {
  n: 1,
  title: '計算とアルゴリズム',
  sub: 'アルゴリズム・データ構造・計算機モデル・時間計算量',
  en: 'Computation & Algorithms',
  tags: ['gcd', 'RAM', '線形探索', '部分和', '時間計算量'],
  mini: '<svg viewBox="0 0 120 60"><rect x="4" y="10" width="72" height="40" fill="none" stroke="#ff8a3d"/><rect x="4" y="10" width="40" height="40" fill="rgba(255,138,61,.15)" stroke="#ff8a3d"/><rect x="44" y="10" width="32" height="32" fill="rgba(63,169,245,.15)" stroke="#3fa9f5"/></svg>',
  goals: [
    'アルゴリズム・データ構造・計算機モデル・時間計算量を人に説明できる',
    '最大公約数を求めるアルゴリズム（互除法）を説明できる',
    '数列の中から数を探すアルゴリズム（線形探索）を説明できる',
    '部分和問題を解くアルゴリズム（総当たり）を説明できる',
  ],
  chapters: [
    {
      id: 'what', k: 'CONCEPT', title: 'アルゴリズムとは',
      build: (el) => el.append(
        talk(`R: サカイさん、そもそも「アルゴリズム」って何なんですか？ プログラムとは違うんですか？
S: 一言でいうと、<b>与えられた問題を解くための、機械的な操作からなる有限の手続き</b>。料理のレシピに近いよ。
R: レシピ…。じゃあ「機械的な操作」っていうのは？
S: 四則演算とか、比較とか、代入とか。で、大事なのは<b>どんな操作が使えるかは「計算機モデル」が決める</b>ってこと。
R: 道具が決まらないとレシピは書けない、みたいな？
S: そう。だから <b>入力・出力・計算機モデル</b>の 3 つが揃って、初めて 1 つのアルゴリズムを考えられるんだ。図にするとこう。`),
        algoDiagram(),
        talk(`R: なるほど。他に条件はあります？
S: 満たすべき性質が 2 つ。1 つは<b>停止性</b> —— 必ず止まること。無限に続くものはアルゴリズムじゃない。
S: もう 1 つは<b>厳密性</b> —— 実行の順番に曖昧さがないこと。「気分が乗らないから大学に行かない」みたいな分岐はダメ（笑）。`),
        cols(2,
          card('停止性 <span class="mono muted" style="font-size:12px">— halting</span>', '手続きの実行は<strong>必ず停止する</strong>。', 'PROPERTY 1', 'accent'),
          card('厳密性 <span class="mono muted" style="font-size:12px">— rigor</span>', '実行の順序に<strong>曖昧性がない</strong>。', 'PROPERTY 2', 'accent')),
        talk(`R: で、プログラムとの違いは？
S: 線引きは難しいけど、プログラムは<b>停止性がなくてもいい</b>んだ。サーバーなんかは止まらないのが正常でしょ？`),
        table(['', 'アルゴリズム', 'プログラム'], [
          ['書く道具', '計算機モデルで実行できる操作（抽象言語）', 'プログラミング言語（C/C++, Java…）'],
          ['入力と出力', 'ある', 'ある'],
          ['厳密性', '必要', 'ある'],
          ['停止性', '<b class="amber">必要</b>', 'なくてもよい'],
        ]),
        talk(`R: でも講義のスライド、思いっきり C 言語で書いてありますよね？
S: 簡単のために C で<b>記述している</b>だけ。見た目はプログラムでも、中身は「アルゴリズム」として読んでね。`),
        point('アルゴリズム ＝ <b>機械的操作からなる有限の手続き</b>。<b>入力・出力・計算機モデル</b>の 3 つで決まり、<b>停止性</b>と<b>厳密性</b>を満たす。'),
      ),
    },
    {
      id: 'gcd', k: 'EXAMPLE 1', title: '最大公約数 — ユークリッドの互除法',
      build: (el) => el.append(
        talk(`S: 最初の例は最大公約数。a = 110, b = 45 の gcd、どう求める？
R: 約数を全部書き出して…ですかね。
S: 数が大きいと大変でしょ。そこで<b>ユークリッドの互除法</b>。<b>x = m·y + z のとき gcd(x, y) = gcd(y, z)</b> が成り立つ、っていう性質を使うんだ。
R: 余りに置き換えても答えが変わらない、ってことですか。
S: そう。問題をどんどん小さくして、<b>小さい方が 0 になったら、残った大きい方が答え</b>。`),
        formula('\\gcd(110,45)=\\gcd(45,20)=\\gcd(20,5)=\\gcd(5,0)=5'),
        talk(`R: 式だけだと、なんで成り立つのかピンとこないです…。
S: じゃあ図で見よう。<b>a × b の長方形から、できるだけ大きい正方形を切り取り続ける</b>。最後に余りなく敷き詰められた正方形の一辺が最大公約数だよ。
R: 長方形全体をぴったりタイル張りできる、一番大きい正方形ってことか！
S: その通り。下のラボで再生してみて。右のコードの <span class="mono">×k</span> は、各行が何回実行されたかだよ。`),
        euclidLab(),
        talk(`R: 12 行目の <span class="inline-code">z = x % y</span> の回数って、課題で聞かれそうですね。
S: いい勘。<b>12 行目の回数 ＝ 剰余を取った回数 ＝ gcd の連鎖に出てくる「=」の数</b>。手計算と一致するか、ラボで確かめるのがおすすめ。`),
        point('<b>gcd(x, y) = gcd(y, x mod y)</b> を y = 0 になるまで繰り返す。図にすると「長方形から正方形を切り出す」操作。'),
      ),
    },
    {
      id: 'model', k: 'CONCEPT', title: '計算機モデル — Turing 機械と RAM',
      build: (el) => el.append(
        talk(`R: さっき出てきた「計算機モデル」って、具体的には何があるんですか？
S: 代表的なのは 3 つ。<b>Turing 機械</b>、<b>RAM</b>、<b>オートマトン</b>。`),
        cols(3,
          card('Turing 機械', '制御部＋ヘッド＋テープ。操作を極限まで単純化。計算能力は最強だが、記述が煩雑。停止性問題のように<strong>解けない問題もある</strong>。', 'MODEL'),
          card('RAM', '<strong>任意のレジスタにアドレスで自由にアクセス</strong>できる。Turing 機械と計算能力は<strong>等価</strong>。', 'MODEL', 'accent'),
          card('オートマトン', '使える操作が少なく、計算能力は低い。', 'MODEL')),
        talk(`R: Turing 機械が最強なら、それを使えばいいんじゃ…？
S: 能力は最強でも、アルゴリズムを書くのがすごく<b>煩雑</b>なんだよね。だから講義では <b>RAM（Random Access Machine）</b>を仮定する。
R: RAM を選ぶ理由は？
S: 2 つ。<b>今ある計算機に近い</b>こと、そして<b>機械語に似た操作ができる</b>こと。しかも計算能力は Turing 機械と<b>等価</b>だから、RAM でできることは Turing 機械でもできる。`),
        formula('\\text{Turing 機械} \\;=\\; \\text{RAM} \\;\\gg\\; \\text{オートマトン} \\quad(\\text{計算能力})'),
        h('div.reveal', table(['RAM が行える操作', '例'], [
          ['入力テープから値を読み込む', '<span class="mono">a</span> を読む'],
          ['出力テープに値を書き込む', '<span class="mono">gcd = x</span>'],
          ['累算器による演算', '四則演算・比較演算・剰余演算'],
          ['レジスタへの格納・参照', 'アドレスで任意のレジスタへ'],
          ['制御カウンタをずらす（ジャンプ）', '条件分岐・繰り返し・関数呼び出し'],
        ])),
        talk(`R: じゃあ、なんで RAM の操作そのものじゃなくて C で書くんですか？
S: RAM の操作で書くと「入力 a を読み込んで変数 x に格納 → … → 制御カウンタを 11 行目にずらす」みたいに<b>説明が煩雑</b>になるから。C の一部の操作は RAM の操作とよく似てるんだ。`),
        point('講義では計算機モデルとして <b>RAM（Random Access Machine）</b>を仮定し、C 言語で記述する。<b>Turing 機械 = RAM ≫ オートマトン</b>。'),
      ),
    },
    {
      id: 'ds', k: 'CONCEPT', title: 'データ構造とは',
      build: (el) => el.append(
        talk(`S: 科目名のもう半分、「データ構造」の話もしておこう。定義は<b>データを記憶領域で組織化して格納したもの</b>。
R: 組織化…？
S: たとえば<b>小さい順に並べて格納する</b>（1, 3, 4, 7, 14, 21）。それだけで<b>探しやすく</b>なるし、<b>最大値・最小値も取り出しやすく</b>なる。
R: 部屋の片付けとか、トランプの手札を並べるのと同じですね。
S: そう、考え方自体はありふれたもの。先人たちはもっと高度なもの —— リスト、スタック、待ち行列、ヒープ、ZDD… —— を考えてきた。<b>良いアルゴリズムを考えるときは、良いデータ構造を考える</b>んだ。`),
        point('データ構造 ＝ データを記憶領域で <b>組織化</b> して格納したもの。この「<b>組織化</b>」の 3 文字が定義の核。'),
      ),
    },
    {
      id: 'time', k: 'MEASURE', title: '時間計算量 — 線形探索で数えてみる',
      build: (el) => el.append(
        talk(`R: 「良いアルゴリズム」って、どうやって比べるんですか？
S: 代表的な指標が<b>時間計算量</b>。アルゴリズムが<b>操作を行う回数</b>のこと。
R: 速さじゃなくて回数なんですね。
S: 実際の秒数はマシン次第だからね。回数なら RAM の上で公平に比べられる。しかも 3 種類ある。`),
        cols(3,
          card('最悪時間計算量', '最悪のパターンでの回数', 'WORST'),
          card('平均時間計算量', '各入力の発生頻度に基づく平均。一般に導出が難しい', 'AVERAGE'),
          card('最良時間計算量', '最良パターンでの回数', 'BEST')),
        talk(`S: 実際に数えてみよう。問題は「長さ n の、並びがバラバラな数列の中から、整数 a が<b>初めて出てくる位置</b>を出力する」。a は必ず含まれるとする。
R: 先頭から順番に見ていけばいいですよね。
S: それが<b>線形探索</b>。下のラボで、代入・読込・比較・加算・ジャンプを 1 回ずつ数えていくよ。`),
        linearLab(),
        talk(`R: 不一致のときは 1 周で 6 回、一致したときは 5 回…。最悪は最後に見つかるときだから——
S: 初期化 1 ＋ 不一致 6(n−1) ＋ 一致 5 ＋ 出力 1 で <b>6n + 1</b>。先頭で見つかる最良なら 1 + 5 + 1 = <b>7</b>。平均は等確率で一致するとして <b>≈ 3n</b>。`),
        formula('\\underbrace{1}_{\\text{初期化}} + \\underbrace{6(n-1)}_{\\text{不一致}} + \\underbrace{5}_{\\text{一致}} + \\underbrace{1}_{\\text{出力}} = 6n+1'),
        talk(`R: 最良が 7 回なら、それで評価すればすごく速いことになりません？
S: それは「たまたま先頭にあった」っていう幸運頼み。だから普通は<b>最悪（と平均）</b>で語るんだ。n を大きくして比べてみて。`),
        growthLab(),
        talk(`R: 二分探索の棒、ほとんど見えないですね！
S: 数列が<b>整列済み</b>なら二分探索が使えて、計算量は <b>log₂ n</b> に比例する。つまり<b>良いデータ構造は時間計算量を減らす</b>。これがこの科目の一番大事なメッセージだよ。`),
        point('線形探索は最悪 <b>6n+1</b>・平均 <b>≈3n</b>（n に比例）、最良 <b>7</b>（n に依らない）。整列済みなら二分探索で <b>log₂n</b> に比例。'),
      ),
    },
    {
      id: 'subset', k: 'EXAMPLE 3', title: '部分和問題 — 総当たり法',
      build: (el) => el.append(
        talk(`S: 最後は<b>部分和問題</b>。n 個の正整数から何個か選んで、和をちょうど b にできるか？ YES か NO で答える。
R: 8, 2, 13, 9, 5 で b = 19 なら… 8 + 2 + 9 = 19 で YES ですね。
S: 正解。じゃあ機械的に解くにはどうする？
R: 全部の組み合わせを試す…？
S: そう、<b>総当たり</b>。各数を「選ぶ(1) / 選ばない(0)」の 2 択にすると、組み合わせは <b>2ⁿ 通り</b>。それを i = 0, 1, …, 2ⁿ−1 の <b>2 進数</b>で全部表すんだ。`),
        formula('\\sum_{j\\in S} a_j = \\sum_{j=0}^{n-1} a_j x_j = b,\\qquad x_j\\in\\{0,1\\}'),
        talk(`R: i を 2 進数にするのが <span class="inline-code">dec2bin(i, x)</span> ですね。
S: うん。<b>最下位の桁が x[0]</b> に入るのに注意。i = 5 なら x = 1,0,1,0,0。i = 25 なら x = 1,0,0,1,1。下のマス 1 つが 1 つの組み合わせで、中の数字はその和だよ。`),
        subsetLab(),
        talk(`R: 5 個なら 32 通りだからすぐ終わりますけど…。
S: n が増えるとどうなるか、見てみよう。`),
        explosionLab(),
        talk(`R: n = 60 で宇宙の年齢超え…！
S: 最悪・平均時間計算量は <b>n × 2ⁿ</b> に比例する。2ⁿ 回の繰り返しの中で、毎回 n 回足し算するからね。総当たりは<b>正しいけど遅い</b>。教科書 5.3.1 節の<b>動的計画法</b>を使えば、もっと効率よく解けるよ。
R: 加算の行の実行回数も、課題に出そうですね。
S: YES なら見つかった i で打ち切るから <span class="mono">(i+1) × n</span> 回。NO なら <span class="mono">2ⁿ × n</span> 回。ラボで答え合わせしてね。`),
        point('総当たりは <b>2ⁿ</b> 通り × 各 <b>n</b> 回の加算 ＝ <b>n·2ⁿ</b> に比例。YES なら (i+1)·n 回で打ち切り。'),
      ),
    },
  ],
  quiz: [
    { kind: 'choice', tag: '概念', q: 'アルゴリズムが満たすべき性質のうち「実行の順序に曖昧性がない」ことを何と呼ぶか？', opts: ['停止性', '厳密性', '完全性', '決定性'], answer: 1, explain: '停止性＝必ず止まる、厳密性＝順序に曖昧さがない。プログラムは厳密性はあるが停止性はなくてもよい。' },
    { kind: 'input', tag: '計算', q: 'gcd(252, 105) の値を答えよ。', answer: '21', explain: '252 = 2×105 + 42 → gcd(105, 42)。105 = 2×42 + 21 → gcd(42, 21)。42 = 2×21 + 0 → gcd(21, 0) = 21。' },
    { kind: 'input', tag: 'トレース', q: 'gcd(252, 105) を互除法のコード（LAB 1-1）で計算したとき、<span class="inline-code">z = x % y</span> の行は何回実行されるか？', answer: '3', explain: '剰余は 252%105=42, 105%42=21, 42%21=0 の 3 回。LAB 1-1 に 252, 105 を入れて ×3 になるのを確認しよう。' },
    { kind: 'choice', tag: '概念', q: '計算機モデルについて正しいものはどれか？', opts: ['RAM は Turing 機械より計算能力が高い', 'RAM と Turing 機械の計算能力は等価である', 'オートマトンは RAM と計算能力が等価である', 'Turing 機械はどんな問題でも解ける'], answer: 1, explain: 'Turing 機械 = RAM ≫ オートマトン。Turing 機械にも停止性問題のように解けない問題がある。' },
    { kind: 'input', tag: 'トレース', q: '線形探索に数列 (7, 2, 9, 2, 5) と a = 2 を与えたときの出力は？（先頭の位置は 0）', answer: '1', explain: '「初めて出現する位置」を返すので、2 回目の 2（位置 3）ではなく位置 1。' },
    { kind: 'input', tag: '計算', q: '講義の数え方で、長さ n = 10 の数列に対する線形探索の最悪時間計算量は何回か？', answer: '61', explain: '6n + 1 = 61。内訳は初期化 1 + 不一致 6×9 + 一致 5 + 出力 1。' },
    { kind: 'multi', tag: '概念', q: '線形探索について、n が十分大きいとき n に比例するものをすべて選べ。', opts: ['最悪時間計算量', '平均時間計算量', '最良時間計算量'], answer: [0, 1], explain: '最悪 6n+1、平均 ≈ 3n は n に比例。最良は常に 7 で n によらない。' },
    { kind: 'input', tag: 'トレース', q: '部分和問題: 正整数 (4, 7, 1, 6) と b = 11 を総当たりアルゴリズムに与えたときの出力は？（YES / NO）', answer: ['YES', 'yes'], explain: '4 + 7 = 11（S = {0,1}）や 4 + 1 + 6 = 11 がある。LAB 1-4 で i = 3 で見つかるのを確認しよう。' },
    { kind: 'input', tag: 'トレース', q: '前問の入力で、加算の行（sum += a[j]*x[j]）は何回実行されるか？', answer: '16', explain: 'i = 0, 1, 2, 3 の 4 通りを試して i = 3（x = 1,1,0,0 → 4+7=11）で YES。各回 n = 4 回の加算なので 4 × 4 = 16 回。' },
    { kind: 'choice', tag: '計算量', q: '部分和問題の総当たりアルゴリズムの最悪時間計算量は何に比例するか？', opts: ['n', 'n²', '2ⁿ', 'n × 2ⁿ'], answer: 3, explain: '2ⁿ 通りの組合せそれぞれで n 回の加算。dec2bin も n に比例するので全体で n × 2ⁿ。' },
  ],
}
