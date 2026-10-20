import { h, s, svgRoot, lab, Player, stat, callout, card, cols, formula, table, seg, parseNums, range, toast, talk, point } from '../lib/ui.js'

/* ---------------------------------------------------------
   第5回  基本的なデータ構造(3): 集合と辞書（ハッシュ法）
   --------------------------------------------------------- */

// 文字列は講義と同じく ASCII コードを並べた整数として扱う（Bob → 0x426f62）
const toKey = (t) => (/^-?\d+$/.test(t) ? Number(t) : [...t.slice(0, 6)].reduce((a, c) => a * 256 + (c.charCodeAt(0) & 255), 0))
const hex = (n) => n.toString(16)
const parseTokens = (str) => str.split(/[\s,，、]+/).filter(Boolean).map((t) => ({ t, x: toKey(t) }))
const label = (o) => (/^-?\d+$/.test(o.t) ? o.t : o.t)
const mod = (a, b) => ((a % b) + b) % b

/* ========== LAB 5-1: 集合演算（ベン図） ========== */
function setOpsLab() {
  const Z = range(12)
  let A = new Set([1, 2, 3, 5, 8]), B = new Set([2, 3, 4, 7, 8, 10]), op = 'union', edit = 'A'
  const stage = h('div.stage', { style: { display: 'grid', placeItems: 'center' } })
  const tokens = h('div.z-tokens')
  const out = h('div.narr'), res = h('div.chips')
  const OPS = {
    union: { f: (x) => A.has(x) || B.has(x), t: 'UNION(A, B, C)', tex: 'C = A ∪ B', d: 'A か B の<b>どちらか</b>に入っている要素' },
    inter: { f: (x) => A.has(x) && B.has(x), t: 'INTERSECTION(A, B, C)', tex: 'C = A ∩ B', d: 'A と B の<b>両方</b>に入っている要素' },
    diff: { f: (x) => A.has(x) && !B.has(x), t: 'DIFFERENCE(A, B, C)', tex: 'C = A ∖ B', d: 'A に入っていて B に<b>入っていない</b>要素' },
  }
  const region = (x) => (A.has(x) && B.has(x) ? 'ab' : A.has(x) ? 'a' : B.has(x) ? 'b' : 'z')
  const draw = () => {
    const W = 420, H = 250
    const svg = svgRoot(W, H, { class: 'venn', role: 'img', 'aria-label': 'ベン図' })
    const ca = { x: 160, y: 128 }, cb = { x: 260, y: 128 }, R = 92
    const o = OPS[op]
    svg.append(s('rect', { x: 4, y: 4, width: W - 8, height: H - 8, rx: 18, class: 'v-z' }), s('text', { x: 18, y: 26, class: 'v-lbl', text: 'Z（普遍集合）' }))
    const defs = s('defs', {}, s('clipPath', { id: 'clipA' }, s('circle', { cx: ca.x, cy: ca.y, r: R })), s('clipPath', { id: 'clipB' }, s('circle', { cx: cb.x, cy: cb.y, r: R })),
      s('mask', { id: 'notB' }, s('rect', { x: 0, y: 0, width: W, height: H, fill: '#fff' }), s('circle', { cx: cb.x, cy: cb.y, r: R, fill: '#000' })))
    svg.append(defs)
    // 結果領域の塗り
    const fill = s('g', { class: 'v-res' })
    if (op === 'union') fill.append(s('circle', { cx: ca.x, cy: ca.y, r: R }), s('circle', { cx: cb.x, cy: cb.y, r: R }))
    if (op === 'inter') fill.append(s('circle', { cx: cb.x, cy: cb.y, r: R, 'clip-path': 'url(#clipA)' }))
    if (op === 'diff') fill.append(s('circle', { cx: ca.x, cy: ca.y, r: R, mask: 'url(#notB)' }))
    svg.append(fill)
    svg.append(s('circle', { cx: ca.x, cy: ca.y, r: R, class: 'v-a' }), s('circle', { cx: cb.x, cy: cb.y, r: R, class: 'v-b' }),
      s('text', { x: ca.x - 70, y: 52, class: 'v-name a', text: 'A' }), s('text', { x: cb.x + 58, y: 52, class: 'v-name b', text: 'B' }))
    // 要素の配置
    const spots = { a: [], ab: [], b: [], z: [] }
    Z.forEach((x) => spots[region(x)].push(x))
    const place = (arr, cx, cy, cols, dx = 30, dy = 30) => arr.map((x, i) => { const r = Math.floor(i / cols), c = i % cols, n = Math.min(cols, arr.length - r * cols); return [x, cx + (c - (n - 1) / 2) * dx, cy + (r - (Math.ceil(arr.length / cols) - 1) / 2) * dy] })
    const pts = [...place(spots.a, 118, 128, 2), ...place(spots.ab, 210, 128, 1, 0, 30), ...place(spots.b, 302, 128, 2), ...place(spots.z, W / 2, 228, 10, 30, 0)]
    pts.forEach(([x, px, py]) => {
      const inC = o.f(x)
      svg.append(s('g', { transform: `translate(${px},${py})` }, s('g', { class: `v-el${inC ? ' on' : ''}`, style: `--d:${x * 30}ms` }, s('circle', { r: 12 }), s('text', { text: x }))))
    })
    stage.innerHTML = ''; stage.appendChild(svg)
    tokens.innerHTML = ''
    Z.forEach((x) => tokens.appendChild(h('button.z-tok', { class: [A.has(x) ? 'in-a' : '', B.has(x) ? 'in-b' : ''].join(' '), 'aria-pressed': (edit === 'A' ? A : B).has(x) ? 'true' : 'false', onclick: () => { const S = edit === 'A' ? A : B; S.has(x) ? S.delete(x) : S.add(x); draw() } }, x)))
    const C = Z.filter(o.f)
    res.innerHTML = ''
    C.length ? C.forEach((x) => res.appendChild(h('span.chip.li', x))) : res.appendChild(h('span.chip.empty', '空集合 ∅'))
    out.innerHTML = `<b>${o.t}</b> ： ${o.tex}　— ${o.d}。A = {${[...A].sort((a, b) => a - b).join(', ')}}、B = {${[...B].sort((a, b) => a - b).join(', ')}}`
  }
  const root = lab({
    title: 'LAB 5-1 — 集合演算をベン図で見る', hint: '下の数字を押して A・B を編集',
    body: h('div',
      h('div.ctrl-row', seg([['union', 'UNION ∪'], ['inter', 'INTERSECTION ∩'], ['diff', 'DIFFERENCE ∖']], op, (v) => { op = v; draw() }),
        h('span.small', '編集する集合:'), seg([['A', 'A'], ['B', 'B']], edit, (v) => { edit = v; draw() })),
      h('div.sep'),
      h('div.lab-grid', stage,
        h('div', { style: { display: 'grid', gap: '12px', alignContent: 'start' } },
          h('div.arr-name', '普遍集合 Z = {0, …, 11}（オレンジ枠 = A、空色 = B）'), tokens,
          h('div.arr-name', '結果 C'), res, out))),
  })
  draw()
  return root
}

/* ========== LAB 5-2: 集合の実現 — 配列リスト vs 連結リスト ========== */
function setImplLab() {
  const ZN = 32
  const inA = h('input.txt', { value: '3 9 14 20 27', 'aria-label': '集合 A', style: { width: '200px' } })
  const inX = h('input.num', { type: 'number', value: 20, min: 0, max: ZN - 1, 'aria-label': '調べる要素 x' })
  const bits = h('div.bitarr'), list = h('div.llist'), narr = h('div.narr'), sts = h('div.stats.two')
  let A = []
  const root = h('div')
  const player = new Player({ interval: 650, keyTarget: root, render: (f) => {
    bits.innerHTML = ''
    range(ZN).forEach((i) => bits.appendChild(h('div.bit', { class: `${A.includes(i) ? 'one' : ''} ${f.bit === i ? 'cur' : ''} ${f.bit === i && f.done ? (f.found ? 'ok' : 'bad') : ''}` }, h('i', i), A.includes(i) ? '1' : '0')))
    list.innerHTML = ''
    list.appendChild(h('span.ll-init', 'init'))
    A.forEach((v, k) => { list.appendChild(h('span.ll-arrow', '→')); list.appendChild(h('span.ll-cell', { class: k === f.li ? (f.liDone ? (f.found ? 'ok' : 'bad') : 'cur') : k < f.li ? 'vis' : '' }, v)) })
    list.appendChild(h('span.ll-arrow', '→')); list.appendChild(h('span.ll-null', { class: f.li === A.length ? 'cur' : '' }, 'null'))
    sts.innerHTML = ''
    sts.append(stat('配列リスト<br>アクセス回数', String(f.bitCount), 'hl'), stat('連結リスト<br>アクセス回数', String(f.liCount), 'cy'), stat('空間（配列）', `${ZN}<small>= |Z|</small>`), stat('空間（リスト）', `${A.length}<small>= |A|</small>`))
    narr.innerHTML = f.msg
  } })
  const build = () => {
    A = [...new Set(parseNums(inA.value).filter((v) => v >= 0 && v < ZN))]
    const x = Math.max(0, Math.min(ZN - 1, +inX.value || 0))
    const found = A.includes(x)
    const F = []
    F.push({ bit: -1, li: -1, bitCount: 0, liCount: 0, msg: `MEMBER(<b>${x}</b>, A) を 2 つの方法で実行してみる。` })
    F.push({ bit: x, done: true, found, li: -1, bitCount: 1, liCount: 0, msg: `配列リスト: <b>a[${x}]</b> を 1 回見るだけ → ${found ? '<span class="l">1 なので存在する</span>' : '<span class="r">0 なので存在しない</span>'}。<b>O(1)</b>。` })
    for (let k = 0; k < A.length; k++) {
      const hit = A[k] === x
      F.push({ bit: x, done: true, found, li: k, liDone: hit, bitCount: 1, liCount: k + 1, msg: `連結リスト: ${k + 1} 番目のセル <b>${A[k]}</b> を見る → ${hit ? '<span class="l">見つかった！</span>' : 'x ではないので次へ'}` })
      if (hit) break
    }
    if (!found) F.push({ bit: x, done: true, found, li: A.length, bitCount: 1, liCount: A.length, msg: `連結リスト: null まで行っても見つからない → <span class="r">存在しない</span>。最悪 <b>O(|A|)</b>。` })
    player.load(F)
  }
  inA.addEventListener('change', build); inX.addEventListener('change', build)
  root.append(lab({
    title: 'LAB 5-2 — MEMBER の速さと空間のトレードオフ', hint: '|Z| = 32 の普遍集合で比較',
    body: h('div',
      h('div.ctrl-row', h('div.field', h('label', 'A ='), inA), h('div.field', h('label', 'x ='), inX), h('button.op', { onclick: build }, 'MEMBER(x, A)')),
      h('div.sep'),
      h('div.arr-name', '① 配列リスト（長さ |Z| の 0/1 配列）'), bits,
      h('div.arr-name', { style: { marginTop: '14px' } }, '② 連結リスト（要素だけを並べる）'), list,
      h('div', { style: { marginTop: '14px', display: 'grid', gap: '10px' } }, sts, narr)),
    foot: player.el }))
  build()
  return root
}

/* ========== LAB 5-3: ハッシュ関数の性質 ========== */
function hashFnLab() {
  const PRESET = {
    seq: { t: '連番 0〜39', v: () => range(40) },
    ten: { t: '10 の倍数', v: () => range(30).map((i) => i * 10) },
    even: { t: '偶数', v: () => range(30).map((i) => i * 2) },
    rand: { t: 'ランダム', v: () => { let s0 = 7; return range(40).map(() => (s0 = (s0 * 1103515245 + 12345) % 2147483648) % 1000) } },
  }
  let keys = PRESET.ten.v(), fn = 'mod', B = 10
  const FN = {
    mod: { t: 'x mod B', f: (x) => mod(x, B), note: '剰余（よく使う）。<b>B は素数</b>がよい。' },
    mul: { t: '⌊B (x·A mod 1)⌋', f: (x) => Math.floor(B * ((x * 0.6180339887) % 1)), note: '乗算法。A ≈ (√5 − 1)/2 = 0.618…、<b>B は 2 のべき乗</b>がよい。' },
    sq: { t: 'x² mod B', f: (x) => mod(x * x, B), note: '平方の剰余。値の範囲には収まるが、<b>出ない値</b>がある（一様でない）。' },
    sin: { t: '⌊(B−1) sin(πx / 2B)⌋', f: (x) => Math.floor((B - 1) * Math.sin((Math.PI / (2 * B)) * x)), note: 'sin は<b>負の値</b>になり 0 〜 B−1 に収まらない。しかも値が端に偏る。' },
    rnd: { t: 'random()', f: () => Math.floor(Math.random() * B), note: '毎回ちがう値 → <b>再現性がない</b>。入れた場所を二度と見つけられない！' },
  }
  const bIn = h('input.num', { type: 'number', value: B, min: 2, max: 32, 'aria-label': '配列の長さ B' })
  const chart = h('div.stage', { style: { padding: '10px' } }), sts = h('div.stats.two'), narr = h('div.narr'), probe = h('div.narr')
  const draw = () => {
    B = Math.max(2, Math.min(32, +bIn.value || 2))
    const F = FN[fn]
    const vals = keys.map(F.f)
    const out = vals.filter((v) => v < 0 || v >= B).length
    const cnt = range(B).map((i) => vals.filter((v) => v === i).length)
    const ideal = keys.length / B
    const W = 520, H = 210, P = { l: 30, r: 10, t: 14, b: 30 }
    const mx = Math.max(ideal * 2, ...cnt, 1)
    const bw = (W - P.l - P.r) / B
    const svg = svgRoot(W, H, { class: 'hist', role: 'img', 'aria-label': 'ハッシュ値の分布' })
    for (let g = 0; g <= mx; g += Math.max(1, Math.ceil(mx / 5))) { const y = H - P.b - (g / mx) * (H - P.t - P.b); svg.append(s('line', { x1: P.l, x2: W - P.r, y1: y, y2: y, class: 'h-grid' }), s('text', { x: P.l - 6, y: y + 4, class: 'h-ax', 'text-anchor': 'end', text: g })) }
    cnt.forEach((c, i) => {
      const bh = (c / mx) * (H - P.t - P.b)
      svg.append(s('rect', { x: P.l + i * bw + 2, y: H - P.b - bh, width: Math.max(2, bw - 4), height: bh, rx: 4, class: `h-bar${c === 0 ? ' zero' : c > ideal * 2 ? ' hot' : ''}`, style: `--d:${i * 25}ms` }))
      if (B <= 20 || i % 2 === 0) svg.append(s('text', { x: P.l + i * bw + bw / 2, y: H - P.b + 16, class: 'h-ax', 'text-anchor': 'middle', text: i }))
    })
    const iy = H - P.b - (ideal / mx) * (H - P.t - P.b)
    svg.append(s('line', { x1: P.l, x2: W - P.r, y1: iy, y2: iy, class: 'h-ideal' }), s('text', { x: W - P.r - 4, y: iy - 6, class: 'h-ax ideal', 'text-anchor': 'end', text: `理想 |A|/B = ${ideal.toFixed(1)}` }))
    chart.innerHTML = ''; chart.appendChild(svg)
    const used = cnt.filter((c) => c > 0).length
    sts.innerHTML = ''
    sts.append(stat('要素数 |A|', String(keys.length)), stat('使われた位置', `${used}<small>/ ${B}</small>`, used === B ? 'li' : 'hl'), stat('最長の連結リスト', String(Math.max(...cnt)), Math.max(...cnt) > ideal * 2 ? 'hl' : 'li'),
      stat('範囲外の値', String(out), out ? 'hl' : 'li'))
    narr.innerHTML = `<b>${F.t}</b>：${F.note}${out ? `<br><span class="r">${out} 個のハッシュ値が 0〜${B - 1} の外に出た（配列に入れられない）</span>` : ''}`
    const a1 = F.f(42), a2 = F.f(42)
    probe.innerHTML = `再現性チェック: h(42) を 2 回計算 → <b>${a1}</b>, <b>${a2}</b> ${a1 === a2 ? '<span class="l">同じ ✓</span>' : '<span class="r">ちがう ✗ 再現性なし</span>'}`
  }
  bIn.addEventListener('input', draw)
  const keySeg = seg(Object.entries(PRESET).map(([k, v]) => [k, v.t]), 'ten', (v) => { keys = PRESET[v].v(); draw() })
  const root = lab({
    title: 'LAB 5-3 — ハッシュ関数の「一様性」と「再現性」', hint: 'B を 10 → 11 に変えてみよう',
    body: h('div',
      h('div.ctrl-row', h('span.small', '関数'), seg(Object.entries(FN).map(([k, v]) => [k, v.t]), fn, (v) => { fn = v; draw() })),
      h('div.ctrl-row', h('span.small', '要素'), keySeg, h('div.field', h('label', 'B ='), bIn), h('button.op.ghost', { onclick: draw }, 'もう一度計算')),
      h('div.sep'),
      h('div.lab-grid.wide-left', chart, h('div', { style: { display: 'grid', gap: '10px', alignContent: 'start' } }, sts, narr, probe))),
  })
  draw()
  return root
}

/* ========== LAB 5-4: 外部ハッシュ法（チェイン法） ========== */
function chainLab() {
  const seqIn = h('input.txt', { value: 'Bob Dan Jim Ana', 'aria-label': '挿入する要素（数 or 文字列）', style: { width: '280px' } })
  const bIn = h('input.num', { type: 'number', value: 9, min: 2, max: 23, 'aria-label': '配列の長さ B' })
  const opIn = h('input.txt', { value: 'Ana', 'aria-label': '操作する要素', style: { width: '110px' } })
  const view = h('div.chains'), narr = h('div.narr'), sts = h('div.stats.two'), calc = h('div.log', { style: { maxHeight: '150px' } })
  const root = h('div')
  let B = 9, T = [], items = []
  const render = (f) => {
    view.innerHTML = ''
    range(B).forEach((i) => {
      const col = h('div.bucket', { class: i === f.b ? 'hot' : '' }, h('div.hc', { class: f.b === i ? 'cur' : '' }, h('i', i), h('b', f.T[i].length ? '●' : '0')))
      f.T[i].forEach((o, k) => { col.appendChild(h('span.ll-arrow.v', '↓')); col.appendChild(h('span.ll-cell', { class: f.b === i && f.k === k ? f.cls || 'cur' : f.b === i && k < f.k ? 'vis' : '', title: `${o.t} = ${o.x}` }, label(o))) })
      if (f.T[i].length) { col.appendChild(h('span.ll-arrow.v', '↓')); col.appendChild(h('span.ll-null', 'null')) }
      view.appendChild(col)
    })
    const lens = f.T.map((l) => l.length), n = lens.reduce((a, b) => a + b, 0)
    sts.innerHTML = ''
    sts.append(stat('|A|', String(n)), stat('B', String(B)), stat('平均の長さ |A|/B', (n / B).toFixed(2), 'cy'), stat('最長の連結リスト', String(Math.max(0, ...lens)), 'hl'))
    narr.innerHTML = f.msg
  }
  const player = new Player({ interval: 800, keyTarget: root, render })
  const snap = () => T.map((l) => l.slice())
  const rebuild = () => {
    B = Math.max(2, Math.min(23, +bIn.value || 9))
    items = parseTokens(seqIn.value)
    T = range(B).map(() => [])
    const F = [{ T: snap(), b: -1, msg: `空の集合 A に、<b>h(x) = x mod ${B}</b> で順に挿入していく。文字列は ASCII コードの整数として扱うよ。` }]
    calc.innerHTML = ''
    items.forEach((o) => {
      const b = mod(o.x, B)
      calc.innerHTML += `<div>${/^-?\d+$/.test(o.t) ? o.t : `${o.t} = 0x${hex(o.x)} = ${o.x}`} mod ${B} = <b>${b}</b></div>`
      const L = T[b]
      for (let k = 0; k < L.length; k++) {
        if (L[k].x === o.x) { F.push({ T: snap(), b, k, cls: 'bad', msg: `${label(o)} はすでに a[${b}] のリストにある → 集合なので<b>挿入しない</b>（重複なし）。` }); return }
        F.push({ T: snap(), b, k, msg: `INSERT(${label(o)}): h = <b>${b}</b>。リストの ${k + 1} 番目 ${label(L[k])} は違う → 次へ（<b>衝突</b>）` })
      }
      L.push(o)
      F.push({ T: snap(), b, k: L.length - 1, cls: 'ok', msg: `INSERT(${label(o)}): a[${b}] の連結リストの<b>末尾につなげた</b>。${L.length > 1 ? `このリストは長さ ${L.length}。` : ''}` })
    })
    F.push({ T: snap(), b: -1, msg: `全 ${items.length} 個の挿入が完了。<b>最長の連結リスト = ${Math.max(...T.map((l) => l.length))}</b>。B を素数に変えると分布はどう変わる？` })
    player.load(F, F.length - 1)
  }
  const doOp = (kind) => {
    const o = parseTokens(opIn.value)[0]
    if (!o) return
    const b = mod(o.x, B), L = T[b]
    const F = [{ T: snap(), b, k: -1, msg: `${kind}(${label(o)}, A): h(${label(o)}) = ${o.x} mod ${B} = <b>${b}</b> の連結リストを見る。` }]
    let idx = -1
    for (let k = 0; k < L.length; k++) { const hit = L[k].x === o.x; F.push({ T: snap(), b, k, cls: hit ? 'ok' : undefined, msg: `${k + 1} 番目: ${label(L[k])} ${hit ? '→ <span class="l">見つかった</span>' : '→ 違う'}` }); if (hit) { idx = k; break } }
    if (kind === 'MEMBER') F.push({ T: snap(), b, k: idx, cls: idx >= 0 ? 'ok' : 'bad', msg: idx >= 0 ? `<b>${label(o)} は A に含まれる</b>（${idx + 1} 回の比較）。` : `null に到達 → <b>含まれない</b>（${L.length} 回の比較）。` })
    if (kind === 'INSERT') { if (idx < 0) { L.push(o); F.push({ T: snap(), b, k: L.length - 1, cls: 'ok', msg: `含まれていないので末尾に挿入した。` }) } else F.push({ T: snap(), b, k: idx, cls: 'bad', msg: 'すでにあるので何もしない。' }) }
    if (kind === 'DELETE') { if (idx >= 0) { L.splice(idx, 1); F.push({ T: snap(), b, k: -1, msg: `セルをリストから外して<b>削除</b>した。外部ハッシュ法は削除が簡単！` }) } else F.push({ T: snap(), b, k: -1, cls: 'bad', msg: '含まれていないので何もしない。' }) }
    player.load(F)
    player.play()
  }
  seqIn.addEventListener('change', rebuild); bIn.addEventListener('change', rebuild)
  root.append(lab({
    title: 'LAB 5-4 — 外部ハッシュ法（チェイン法）', hint: '衝突した要素は連結リストでつなぐ',
    body: h('div',
      h('div.ctrl-row', h('div.field', h('label', '挿入列'), seqIn), h('div.field', h('label', 'B ='), bIn), h('button.op', { onclick: rebuild }, '最初から挿入'),
        h('button.op.ghost', { onclick: () => { seqIn.value = 'Bob Dan Jim Ana'; bIn.value = 9; rebuild() } }, '講義の例')),
      h('div.ctrl-row', h('div.field', h('label', 'x ='), opIn), h('button.op', { onclick: () => doOp('MEMBER') }, 'MEMBER'), h('button.op', { onclick: () => doOp('INSERT') }, 'INSERT'), h('button.op', { onclick: () => doOp('DELETE') }, 'DELETE')),
      h('div.sep'),
      h('div.arr-name', '配列 a（各要素が連結リストの先頭）'), h('div.chains-wrap', view),
      h('div.lab-grid', { style: { marginTop: '14px' } }, h('div', { style: { display: 'grid', gap: '10px', alignContent: 'start' } }, narr, sts), h('div', h('div.arr-name', 'ハッシュ値の計算'), calc))),
    foot: player.el }))
  rebuild()
  return root
}

/* ========== LAB 5-5: 内部ハッシュ法（線形・二次関数・ダブルハッシュ） ========== */
function openLab() {
  const M = {
    lin: { t: '線形探査法', f: (x, k, B) => mod(x + k, B), tex: 'h_k(x) = (x + k) mod B' },
    quad: { t: '二次関数探査法', f: (x, k, B) => mod(x + k + k * k, B), tex: 'h_k(x) = (x + k + k²) mod B' },
    dbl: { t: 'ダブルハッシュ法', f: (x, k, B, C) => mod(mod(x, B) + k * (C - mod(x, C)), B), tex: 'h_k(x) = (x mod B + k·(C − x mod C)) mod B' },
  }
  let m = 'lin', B = 11, C = 7, a = [], badDelete = false
  const seqIn = h('input.txt', { value: '59 34 84 70 85 44 18', 'aria-label': '挿入列', style: { width: '240px' } })
  const bIn = h('input.num', { type: 'number', value: B, min: 3, max: 23, 'aria-label': 'B' })
  const cIn = h('input.num', { type: 'number', value: C, min: 2, max: 22, 'aria-label': 'C' })
  const opIn = h('input.num', { type: 'number', value: 44, 'aria-label': '操作する要素' })
  const arr = h('div.hash-arr'), narr = h('div.narr'), sts = h('div.stats.two'), logEl = h('div.probe-log'), fx = h('div.mono.small.fx')
  const root = h('div')
  const D = 'D'
  const render = (f) => {
    arr.innerHTML = ''
    const clusters = []
    let run = []
    f.a.forEach((v, i) => { if (v !== null) run.push(i); else { if (run.length >= 2) clusters.push(run); run = [] } })
    if (run.length >= 2) clusters.push(run)
    const inCl = new Set(clusters.flat())
    f.a.forEach((v, i) => arr.appendChild(h('div.hc', { class: [v === null ? 'empty' : '', v === D ? 'del' : '', f.pos === i ? f.st || 'cur' : '', f.seen?.includes(i) && f.pos !== i ? 'vis' : '', inCl.has(i) ? 'cl' : ''].join(' ') },
      h('i', i), h('b', v === null ? '0' : String(v)))))
    logEl.innerHTML = ''
    f.log.forEach((r) => logEl.appendChild(h('div.pl-row', { class: r.cur ? 'cur' : '' }, h('span.pl-x', r.x), ...r.p.map((p, k) => h('span.pl-p', { class: p.c ? 'col' : 'ok' }, h('small', `k=${k}`), p.v)))))
    const n = f.a.filter((v) => v !== null && v !== D).length, nd = f.a.filter((v) => v === D).length
    sts.innerHTML = ''
    sts.append(stat('衝突の総回数', String(f.col), 'hl'), stat('占有率 α', `${((n + nd) / B).toFixed(2)}<small>(${n}${nd ? '+' + nd : ''})/${B}</small>`, 'cy'), stat('最長クラスタ', String(Math.max(0, ...clusters.map((c) => c.length)))), stat('平均アクセス目安', (1 / (1 - Math.min(0.99, (n + nd) / B))).toFixed(2) + '<small>1/(1−α)</small>', 'li'))
    narr.innerHTML = f.msg
  }
  const player = new Player({ interval: 750, keyTarget: root, render })
  let col = 0, log = []
  const snapLog = (curX) => log.map((r) => ({ ...r, cur: r.x === curX, p: r.p.slice() }))
  const rebuild = () => {
    B = Math.max(3, Math.min(23, +bIn.value || 11)); C = Math.max(2, Math.min(B - 1, +cIn.value || 7))
    fx.textContent = M[m].tex + (m === 'dbl' ? `　（B = ${B}, C = ${C}）` : `　（B = ${B}）`)
    a = Array(B).fill(null); col = 0; log = []
    const xs = parseNums(seqIn.value)
    const F = [{ a: a.slice(), pos: -1, col: 0, log: [], msg: `<b>${M[m].t}</b>で、空の配列（長さ ${B}）に ${xs.length} 個を順に挿入する。0 は空きセル。` }]
    xs.forEach((x) => {
      const row = { x, p: [] }; log.push(row)
      const seen = []
      for (let k = 0; k <= 2 * B; k++) {
        const p = M[m].f(x, k, B, C)
        if (a[p] === null) {
          a[p] = x; row.p.push({ v: p, c: false })
          F.push({ a: a.slice(), pos: p, st: 'ok', seen, col, log: snapLog(x), msg: `x = <b>${x}</b>: h<sub>${k}</sub>(${x}) = <b>${p}</b> は空き → <span class="l">ここに格納</span>${k ? `（衝突 ${k} 回のあと）` : ''}` })
          return
        }
        col++; row.p.push({ v: p, c: true }); seen.push(p)
        F.push({ a: a.slice(), pos: p, st: 'col', seen: seen.slice(), col, log: snapLog(x), msg: `x = <b>${x}</b>: h<sub>${k}</sub>(${x}) = <b>${p}</b> には ${a[p]} がある → <span class="r">衝突</span>（k を 1 増やす）` })
      }
      F.push({ a: a.slice(), pos: -1, col, log: snapLog(x), msg: `<span class="r">${x} を入れる場所が見つからない！</span>${m === 'quad' ? '二次関数探査法は全セルを参照できないことがある。' : ''}` })
    })
    F.push({ a: a.slice(), pos: -1, col, log: snapLog(null), msg: `挿入完了。<b>衝突の総回数 = ${col}</b>。オレンジの下線は<b>クラスタ</b>（埋まったセルの塊）。方法を切り替えて比べてみよう。` })
    player.load(F, F.length - 1)
  }
  const doOp = (kind) => {
    const x = +opIn.value
    const F = []
    const seen = []
    for (let k = 0; k <= B; k++) {
      const p = M[m].f(x, k, B, C)
      if (a[p] === null) { F.push({ a: a.slice(), pos: p, st: 'bad', seen: seen.slice(), col, log: snapLog(null), msg: `h<sub>${k}</sub>(${x}) = ${p} が <b>0（空き）</b> → ここで探索終了。<span class="r">${x} は存在しない</span>${badDelete && a.includes(0) ? '' : ''}` }); break }
      if (a[p] === x) {
        if (kind === 'MEMBER') F.push({ a: a.slice(), pos: p, st: 'ok', seen: seen.slice(), col, log: snapLog(null), msg: `h<sub>${k}</sub>(${x}) = ${p} に ${x} があった → <span class="l">存在する</span>（${k + 1} 回のアクセス）` })
        else {
          a[p] = badDelete ? null : D
          F.push({ a: a.slice(), pos: p, st: 'ok', seen: seen.slice(), col, log: snapLog(null), msg: badDelete ? `a[${p}] に <b>0</b> を入れた（<span class="r">やってはいけない例</span>）。この先にある要素を MEMBER で探してみよう。` : `a[${p}] に削除記号 <b>D</b> を入れた。0 にすると、この後ろに並んだ要素が見つからなくなるからね。` })
        }
        break
      }
      seen.push(p)
      F.push({ a: a.slice(), pos: p, st: 'col', seen: seen.slice(), col, log: snapLog(null), msg: `h<sub>${k}</sub>(${x}) = ${p} は ${a[p] === D ? '<b>D</b>（削除済み。止まらずに次へ）' : a[p]} → 次へ` })
    }
    if (!F.length) return
    player.load(F); player.play()
  }
  const mSeg = seg(Object.entries(M).map(([k, v]) => [k, v.t]), m, (v) => { m = v; cIn.closest('.field').style.display = v === 'dbl' ? '' : 'none'; rebuild() })
  seqIn.addEventListener('change', rebuild); bIn.addEventListener('change', rebuild); cIn.addEventListener('change', rebuild)
  const badChk = h('label.chk', h('input', { type: 'checkbox', onchange: (e) => { badDelete = e.target.checked; toast(badDelete ? 'DELETE で 0 を入れるモード（わざと間違える）' : 'DELETE で D を入れるモード', badDelete ? 'warn' : 'info') } }), h('span', 'DELETE で 0 を入れる（誤り）'))
  root.append(lab({
    title: 'LAB 5-5 — 内部ハッシュ法の 3 つの探査', hint: '衝突したら別の場所を探す',
    body: h('div',
      h('div.ctrl-row', mSeg),
      h('div.ctrl-row', h('div.field', h('label', '挿入列'), seqIn), h('div.field', h('label', 'B ='), bIn), h('div.field', { style: { display: 'none' } }, h('label', 'C ='), cIn), h('button.op', { onclick: rebuild }, '最初から挿入')),
      h('div.ctrl-row', h('div.field', h('label', 'x ='), opIn), h('button.op', { onclick: () => doOp('MEMBER') }, 'MEMBER'), h('button.op', { onclick: () => doOp('DELETE') }, 'DELETE'), badChk),
      h('div.sep'),
      fx,
      h('div.hash-wrap', arr),
      h('div.lab-grid', { style: { marginTop: '14px' } }, h('div', { style: { display: 'grid', gap: '10px', alignContent: 'start' } }, narr, sts),
        h('div', h('div.arr-name', '探査の記録（ピンク = 衝突、ミント = 格納）'), logEl))),
    foot: player.el }))
  rebuild()
  return root
}

/* ========== LAB 5-6: 占有率と平均アクセス回数 ========== */
function alphaLab() {
  const sl = h('input', { type: 'range', min: 0, max: 95, value: 50, 'aria-label': '占有率 α (%)' })
  const chart = h('div.stage', { style: { padding: '10px' } }), sts = h('div.stats.two'), narr = h('div.narr')
  // シミュレーション: 理想（一様な h_k）と線形探査、B = 997
  const simulate = () => {
    const B = 997, pts = { ideal: [], lin: [] }
    let seed = 12345
    const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648
    ;['ideal', 'lin'].forEach((kind) => {
      for (let pct = 5; pct <= 90; pct += 5) {
        let total = 0, trials = 0
        for (let rep = 0; rep < 6; rep++) {
          const a = new Uint8Array(B)
          const fill = Math.floor((B * pct) / 100)
          for (let i = 0; i < fill; i++) { let p = Math.floor(rnd() * B); while (a[p]) p = kind === 'lin' ? (p + 1) % B : Math.floor(rnd() * B); a[p] = 1 }
          for (let t = 0; t < 60; t++) { let p = Math.floor(rnd() * B), c = 1; while (a[p]) { p = kind === 'lin' ? (p + 1) % B : Math.floor(rnd() * B); c++ } total += c; trials++ }
        }
        pts[kind].push([pct / 100, total / trials])
      }
    })
    return pts
  }
  const sim = simulate()
  const draw = () => {
    const al = +sl.value / 100
    const W = 520, H = 260, P = { l: 40, r: 16, t: 14, b: 34 }, YM = 12
    const X = (v) => P.l + v * (W - P.l - P.r), Y = (v) => H - P.b - (Math.min(v, YM) / YM) * (H - P.t - P.b)
    const svg = svgRoot(W, H, { class: 'achart', role: 'img', 'aria-label': '占有率と平均アクセス回数' })
    for (let g = 0; g <= YM; g += 2) svg.append(s('line', { x1: P.l, x2: W - P.r, y1: Y(g), y2: Y(g), class: 'h-grid' }), s('text', { x: P.l - 8, y: Y(g) + 4, class: 'h-ax', 'text-anchor': 'end', text: g }))
    for (let g = 0; g <= 10; g += 2) svg.append(s('text', { x: X(g / 10), y: H - P.b + 18, class: 'h-ax', 'text-anchor': 'middle', text: (g / 10).toFixed(1) }))
    svg.append(s('text', { x: W - P.r, y: H - 4, class: 'h-ax', 'text-anchor': 'end', text: '占有率 α' }))
    svg.append(s('rect', { x: X(0), y: P.t, width: X(0.5) - X(0), height: H - P.t - P.b, class: 'a-safe' }), s('text', { x: X(0.25), y: P.t + 16, class: 'h-ax safe', 'text-anchor': 'middle', text: 'α ≤ 0.5 なら 2 回以下' }))
    let d = ''
    for (let v = 0; v <= 0.955; v += 0.005) d += `${d ? 'L' : 'M'}${X(v).toFixed(1)},${Y(1 / (1 - v)).toFixed(1)}`
    svg.append(s('path', { d, class: 'a-curve' }))
    sim.ideal.forEach(([x, y]) => svg.append(s('circle', { cx: X(x), cy: Y(y), r: 4, class: 'a-pt ideal' })))
    sim.lin.forEach(([x, y]) => svg.append(s('circle', { cx: X(x), cy: Y(y), r: 4, class: 'a-pt lin' })))
    const yv = 1 / (1 - al)
    svg.append(s('line', { x1: X(al), x2: X(al), y1: P.t, y2: H - P.b, class: 'a-cur' }), s('circle', { cx: X(al), cy: Y(yv), r: 8, class: 'a-dot' }),
      s('text', { x: X(al) + (al > 0.7 ? -12 : 12), y: Math.max(P.t + 14, Y(yv) - 10), class: 'a-lbl', 'text-anchor': al > 0.7 ? 'end' : 'start', text: `1/(1−α) = ${yv.toFixed(2)}` }))
    chart.innerHTML = ''; chart.appendChild(svg)
    const near = sim.lin.reduce((b, p) => (Math.abs(p[0] - al) < Math.abs(b[0] - al) ? p : b))
    sts.innerHTML = ''
    sts.append(stat('占有率 α', al.toFixed(2), 'cy'), stat('理論値 1/(1−α)', yv.toFixed(2), 'hl'), stat(`線形探査（実測, α≈${near[0].toFixed(2)}）`, near[1].toFixed(2)))
    narr.innerHTML = al <= 0.5 ? `α = ${al.toFixed(2)} なら、空きセルを見つけるまで<b>平均 ${yv.toFixed(2)} 回</b>のアクセス。まだ余裕。` : al < 0.8 ? `α = ${al.toFixed(2)}。平均 ${yv.toFixed(2)} 回。だんだん苦しくなってきた。` : `α = ${al.toFixed(2)} で平均 <b>${yv.toFixed(1)} 回</b>。満杯に近づくと急に悪化する（α → 1 で発散）。`
  }
  sl.addEventListener('input', draw)
  const root = lab({
    title: 'LAB 5-6 — 占有率 α と平均アクセス回数', hint: 'スライダーで α を動かす',
    body: h('div',
      h('div.ctrl-row', h('div.field', h('label', 'α ='), sl), h('span.legend', h('span', h('i', { style: { background: 'var(--amber)' } }), '理論 1/(1−α)'), h('span', h('i', { style: { background: 'var(--cyan)' } }), '理想的な h_k（実測）'), h('span', h('i', { style: { background: 'var(--rose)' } }), '線形探査（実測）'))),
      h('div.sep'),
      h('div.lab-grid.wide-left', chart, h('div', { style: { display: 'grid', gap: '10px', alignContent: 'start' } }, sts, narr))),
  })
  draw()
  return root
}

export default {
  n: 5,
  title: '集合と辞書',
  sub: '基本的なデータ構造 (3) — 外部ハッシュ法と内部ハッシュ法',
  en: 'Set, Dictionary & Hashing',
  tags: ['集合', '辞書', 'ハッシュ関数', '外部ハッシュ', '内部ハッシュ'],
  mini: '<svg viewBox="0 0 120 60"><g stroke="#3d2e54" stroke-width="1.6"><rect x="8" y="8" width="16" height="16" rx="4" fill="#fff"/><rect x="28" y="8" width="16" height="16" rx="4" fill="#ff8a3d"/><rect x="48" y="8" width="16" height="16" rx="4" fill="#fff"/><rect x="68" y="8" width="16" height="16" rx="4" fill="#3fa9f5" fill-opacity=".5"/><rect x="88" y="8" width="16" height="16" rx="4" fill="#fff"/><rect x="28" y="36" width="16" height="14" rx="4" fill="#ffd23f"/></g><path d="M36 24v12" stroke="#3d2e54" stroke-width="1.6"/></svg>',
  goals: [
    '集合（重複のない要素の集まり）と代表的な操作を説明できる',
    '集合の実現方法（配列リスト・連結リスト）と計算量の違いを説明できる',
    '辞書と、ハッシュ関数に求められる性質（再現性・高速性・一様性）を説明できる',
    '外部ハッシュ法と内部ハッシュ法（線形・二次関数・ダブルハッシュ）の動作と計算量を説明できる',
  ],
  chapters: [
    {
      id: 'set', k: 'STRUCTURE', title: '集合 — 重複のない要素の集まり',
      build: (el) => el.append(
        talk(`S: 今回は<b>集合</b>と<b>辞書</b>。最後には、Python の dict の中身にあたる<b>ハッシュ法</b>までいくよ。
R: 集合って、数学の {1, 2, 3} みたいなやつですか？
S: そう。規則はひとつだけ。<b>重複のない要素 x の集まり</b>。
R: リストと何が違うんですか？
S: リストは同じ値が何個あってもよかったよね。集合は<b>同じ要素は 1 つまで</b>。それと、集合の要素はもっと大きな<b>普遍集合 Z</b> の要素でもある（x ∈ Z、A ⊆ Z）。`),
        talk(`S: 例えば「3 文字の名前の人」全体が Z で、その中の友人の集合が A。Bob・Dan・Jim みたいにね。要素には電話番号みたいな<b>付属データ d</b> がくっついていることもある（講義では省略）。
R: 名前って数じゃないですよね？
S: 文字を ASCII コードで並べると整数になる。Bob は 0x42, 0x6f, 0x62 → <b>0x426f62</b>。3 文字なら Z は 0 〜 2<sup>24</sup>−1 の整数の集合と考えられる。`),
        cols(3,
          card('MEMBER(x, A)', '集合 A に x が含まれているかを確認。', 'CHECK'),
          card('INSERT(x, A)', 'x が含まれて<strong>いなければ</strong> A に挿入。', 'ADD'),
          card('DELETE(x, A)', 'x が含まれて<strong>いれば</strong> A から削除。', 'REMOVE')),
        talk(`R: 他にも操作はあるんですか？
S: 2 つの集合から新しい集合を作る <b>UNION</b>（和集合）、<b>INTERSECTION</b>（共通部分）、<b>DIFFERENCE</b>（差集合）、それと空集合を作る <b>EMPTY</b>。下のベン図で動かしてみよう。`),
        setOpsLab(),
        point('集合 ＝ <b>重複のない要素の集まり</b>（A ⊆ Z）。基本操作は <b>MEMBER・INSERT・DELETE</b>、ほかに UNION・INTERSECTION・DIFFERENCE・EMPTY。'),
      ),
    },
    {
      id: 'set-impl', k: 'IMPLEMENTATION', title: '集合の実現方法 — 配列リストと連結リスト',
      build: (el) => el.append(
        talk(`R: 集合はどうやってコンピュータに入れるんですか？
S: 方法 1 は<b>配列リスト</b>。長さ |Z| の配列 a を用意して、x が A に入っていれば <b>a[x] = 1</b>、なければ 0。
R: じゃあ MEMBER は a[x] を見るだけ？
S: そう、<b>O(1)</b>。INSERT は a[x] = 1、DELETE は a[x] = 0 で、これも O(1)。
R: 最強じゃないですか。
S: ところが空間が <b>O(|Z|)</b>。3 文字の名前なら 2<sup>24</sup> ≈ 1677 万個の配列で、友達 3 人を管理することになる。`),
        talk(`R[oops]: 1677 万個のうち 1 が 3 個…。もったいなさすぎる。
S: そこで方法 2 の<b>連結リスト</b>。要素だけをつなぐから空間は <b>O(|A|)</b>。その代わり MEMBER は先頭から走査するので <b>O(|A|)</b>。
S: UNION などは、A の各要素について B を走査するから <b>O(|A||B|)</b>。下で同じ MEMBER を比べてみて。`),
        setImplLab(),
        h('div.reveal', table(['', '配列リスト', '連結リスト'], [
          ['MEMBER / INSERT / DELETE', '<b>O(1)</b>', 'O(|A|)'],
          ['UNION / INTERSECTION / DIFFERENCE', 'O(|Z|)', 'O(|A||B|)'],
          ['空間計算量', 'O(|Z|)（|A| ≪ |Z| だと非効率）', '<b>O(|A|)</b>'],
        ])),
        talk(`R: 速い配列は大きすぎて、小さいリストは遅い…。いいとこ取りはできないんですか？
S[happy]: それが次の<b>ハッシュ法</b>。長さ |Z| じゃなくて、|A| より少し大きいくらいの配列で、ほぼ O(1) を目指す。`),
        point('配列リスト：操作 <b>O(1)</b> だが空間 <b>O(|Z|)</b>。連結リスト：空間 <b>O(|A|)</b> だが操作 <b>O(|A|)</b>。'),
      ),
    },
    {
      id: 'hash', k: 'IDEA', title: '辞書とハッシュ関数',
      build: (el) => el.append(
        talk(`S: まず<b>辞書</b>の定義。<b>MEMBER・INSERT・DELETE の 3 つだけ</b>を行う集合のこと。
R: 操作を減らした集合なんですね。
S: 一般には<b>連想配列</b>とも呼ばれる。key → value の対応を持つもので、key が要素 x、value が付属データ d。Python の dict がまさにそれ。実現方法は<b>平衡二分探索木</b>（後の回）と<b>ハッシュ法</b>。`),
        h('div.reveal.code-mini', { html: '<pre class="mono">d = dict()\nd[<span class="s">\'Bob\'</span>] = <span class="s">\'090-XXXX-XXXX\'</span>\nd[<span class="s">\'Dan\'</span>] = <span class="s">\'090-YYYY-YYYY\'</span>\nd[<span class="s">\'Jim\'</span>] = <span class="s">\'090-ZZZZ-ZZZZ\'</span></pre>' }),
        talk(`S: ハッシュ法のアイデアはシンプル。長さ <b>B</b> の配列 a（|A| < B ≪ |Z|）を用意して、要素 x を <b>a[h(x)]</b> に入れる。h を<b>ハッシュ関数</b>、h(x) を<b>ハッシュ値</b>と呼ぶ。0 ≤ h(x) ≤ B − 1。
R: 例えば？
S: h(x) = x mod B。B = 9 なら Bob = 0x426f62 は 5、Dan は 2、Jim は 3。
R: Ana も 2 になったら？
S[oops]: それが<b>衝突</b>。x ≠ y なのに h(x) = h(y)。Z の方がずっと大きいから衝突は避けられない。対処法が<b>外部ハッシュ法</b>と<b>内部ハッシュ法</b>。`),
        cols(3,
          card('再現性（必須）', 'h(x) は<strong>毎回同じ値</strong>。乱数を返す関数はダメ。入れた場所を探せなくなる。', '1'),
          card('高速性', 'h(x) を高速に計算できる。少なくとも <strong>O(1)</strong>。', '2'),
          card('一様性', 'h(x) がなるべく<strong>一様に分布</strong>する。高速性との両立が難しい。', '3')),
        talk(`R: 「周期性」は要らないんですか？
S: 要らないどころか邪魔。例えば 10 の倍数ばかりを <b>x mod 10</b> に入れると全部 0 に集まる。要素の規則性と B が噛み合うと偏るんだ。だから<b>剰余法では B を素数</b>にする。
S: もうひとつの代表が<b>乗算法</b> h(x) = ⌊B (xA mod 1)⌋。xA の小数部分に B を掛けて切り捨てる。A ≈ (√5 − 1)/2 = 0.618…、B は 2 のべき乗がよい（Knuth）。`),
        hashFnLab(),
        callout('tip', 'ちなみに', '集合の要素があらかじめ全部わかっているなら、衝突が一切起きないハッシュ関数を作れる。これを<b>完全ハッシュ法</b>という。'),
        point('辞書 ＝ <b>MEMBER・INSERT・DELETE だけ</b>の集合。ハッシュ関数に必要なのは <b>再現性（必須）・高速性・一様性</b>。剰余法 x mod B は <b>B を素数</b>に。'),
      ),
    },
    {
      id: 'chain', k: 'METHOD 1', title: '外部ハッシュ法（チェイン法）',
      build: (el) => el.append(
        talk(`S: 外部ハッシュ法は、別名<b>チェイン法</b>とか<b>オープンハッシュ法</b>。衝突した要素を<b>連結リストでつなげていく</b>。
R: 配列の各マスが連結リストの先頭になってるんですね。
S: そう。MEMBER は h(x) の連結リストを走査、INSERT は「なければ h(x) のリストに挿入」、DELETE は「あればリストから外す」。下のラボの初期値は講義の Bob・Dan・Jim・Ana だよ。`),
        chainLab(),
        talk(`R: 時間計算量は連結リストの長さで決まりそう。
S: 正解。<b>最悪</b>は全要素のハッシュ値が同じになって長さ |A| の 1 本のリストになるとき → <b>O(|A|)</b>。ただの連結リストと同じ。
S: <b>平均</b>では、ハッシュ値が一様に分布する（h(x) = i となる割合が 1/B）と仮定すると、どのリストも長さは平均 |A|/B。|A| < B だから <b>O(|A|/B) = O(1)</b>。
R: だからハッシュ関数の一様性が大事なんですね。`),
        formula('\\text{平均の長さ} = \\frac{|A|}{B} \\;\\Rightarrow\\; O\\!\\left(\\frac{|A|}{B}\\right) = O(1) \\quad (|A| < B)'),
        point('外部ハッシュ法 ＝ 衝突したら<b>連結リストでつなぐ</b>。最悪 <b>O(|A|)</b>、一様なら平均 <b>O(1)</b>。計算量は<b>ハッシュ関数の一様性</b>しだい。'),
      ),
    },
    {
      id: 'open', k: 'METHOD 2', title: '内部ハッシュ法（オープンアドレス法）',
      build: (el) => el.append(
        talk(`S: 内部ハッシュ法は、別名<b>クローズドハッシュ法</b>・<b>オープンアドレス法</b>。連結リストを使わず、衝突したら<b>別のハッシュ関数 h<sub>k</sub>(x)</b> で別の場所を探す。k は衝突した回数で、h<sub>0</sub>(x) = h(x)。
R: 「外部がオープン」で「内部がクローズド」なのに、内部の別名に「オープン」アドレス法がある…ややこしい！
S[oops]: そこはみんな混乱する（笑）。「配列の<b>外</b>に連結リストを伸ばす = 外部」「配列の<b>内</b>側だけで何とかする = 内部」で覚えよう。`),
        talk(`S: MEMBER は a[h<sub>0</sub>(x)], a[h<sub>1</sub>(x)], a[h<sub>2</sub>(x)], … と順に調べて、<b>0（空き）に出会う前に x が見つかれば</b>存在する。INSERT は 0 の場所に x を入れる。
R: DELETE は 0 に戻せばいい？
S: それをやると壊れる。Ana が Dan と衝突して後ろにずれていたとして、Dan のマスを 0 にしたら、Ana を探すときに 0 で止まって「ない」と判断しちゃう。だから<b>削除記号 D</b> を入れる。D は探索では止まらず、他の要素は入れない。
R: D が増えたら？
S: D だらけになったら<b>ゴミ処理</b>（D のセルを整理）が必要。下のラボで「DELETE で 0 を入れる」にチェックして、わざと壊してみて。`),
        cols(3,
          card('線形探査法', 'h<sub>k</sub>(x) = (x + k) mod B。衝突すると<strong>隣</strong>へ。要素が固まった<strong>クラスタ</strong>ができやすく、クラスタに入ると衝突が続く。', 'LINEAR'),
          card('二次関数探査法', 'h<sub>k</sub>(x) = (x + k + k²) mod B。k + k² だけ<strong>離れた</strong>セルへ。連続した衝突は避けやすいが、<strong>全セルを参照できない</strong> → B > 要素数 × 2 が望ましい。', 'QUADRATIC'),
          card('ダブルハッシュ法', 'h<sub>k</sub>(x) = (ĥ<sub>1</sub>(x) + k·ĥ<sub>2</sub>(x)) mod B。飛ぶ幅が<strong>要素ごとに違う</strong>のでクラスタができにくい。ĥ<sub>1</sub>(x) = x mod B、ĥ<sub>2</sub>(x) = C − (x mod C)。', 'DOUBLE')),
        talk(`R: 線形と二次関数は、h<sub>0</sub>(x) = h<sub>0</sub>(y) だとずっと同じ場所を追いかけっこするんですね。
S: そう。ダブルハッシュ法は ĥ<sub>1</sub> と ĥ<sub>2</sub> の両方が一致しない限り違う道をたどる。C は B 未満で B に近い数がよくて、ĥ<sub>2</sub>(x) ≠ 0 になるよう C − (x mod C) の形にしてある。B と飛ぶ幅が<b>互いに素</b>なら全セルを回れる。
S: 初期値は講義の例（B = 11, C = 7、挿入列 59 34 84 70 85 44 18）。3 つを切り替えて、配置と衝突の回数を比べてみよう。`),
        openLab(),
        talk(`R: 数えるとき、「衝突の回数」は何を数えればいいんですか？
S: 1 つの要素を入れるとき、<b>埋まっているセルに当たった回数</b>がその要素の衝突回数 k。全要素で足したのが総回数。ラボの右側の記録でピンクの数を数えればいい。`),
        point('内部ハッシュ法 ＝ 衝突したら <b>h<sub>k</sub>(x)</b> で別のセルへ。削除は <b>D</b>（0 にすると後ろの要素を見失う）。線形 → <b>クラスタ</b>、二次関数 → 全セルを回れないことがある、ダブル → クラスタができにくい。'),
      ),
    },
    {
      id: 'alpha', k: 'COMPLEXITY', title: '内部ハッシュ法の平均時間計算量',
      build: (el) => el.append(
        talk(`R: 内部ハッシュ法の計算量は？
S: 最悪は O(|A|)。平均を考えるときは<b>占有率</b> α = (|A| + N<sub>D</sub>)/B を使う。N<sub>D</sub> は D のセル数で、α は「0 でないセルの割合」。
S: h<sub>k</sub>(x) が常に一様な値を返すという理想的な前提を置くと、INSERT の平均時間計算量は <b>O(1/(1 − α))</b>。MEMBER と DELETE も同じ。
R: どうやって出すんですか？`),
        talk(`S: 1 回目のアクセスで 0 が見つかる確率は 1 − α。2 回目で見つかるのは「1 回目は外れ、2 回目で当たり」だから α(1 − α)。k + 1 回目なら α<sup>k</sup>(1 − α)。あとは期待値を計算するだけ。`),
        formula('\\sum_{k=0}^{\\infty}(k+1)\\alpha^k(1-\\alpha) = \\frac{1}{(1-\\alpha)^2} - \\frac{\\alpha}{(1-\\alpha)^2} = \\frac{1}{1-\\alpha}'),
        talk(`R: α = 0.5 なら 2 回、α = 0.9 なら 10 回…。
S: そう。α が 0.5 以下ならそこまで大きくない。でも満杯に近づくと急に悪化する。下のグラフでは、理想的な h<sub>k</sub> と線形探査を実際にシミュレーションした値も重ねてある。
R[think]: 線形探査は理論より悪い…。クラスタのせいですね！
S[happy]: その通り。講義の 1/(1 − α) は理想的な h<sub>k</sub> の話で、(x + k) mod B みたいな簡単なものでは成り立たない。`),
        alphaLab(),
        h('div.reveal', table(['', '外部ハッシュ法', '内部ハッシュ法'], [
          ['衝突の扱い', '連結リストでつなぐ', '別のセル h<sub>k</sub>(x) を探す'],
          ['最悪時間計算量', 'O(|A|)', 'O(|A|)'],
          ['平均時間計算量（一様と仮定）', '<b>O(|A|/B) = O(1)</b>', '<b>O(1/(1 − α))</b>'],
          ['削除', 'リストから外すだけ', '<b>D</b> を入れる（ゴミ処理が必要）'],
          ['配列がいっぱいのとき', 'リストが伸びるだけ', 'α → 1 で急激に遅くなる'],
        ])),
        point('内部ハッシュ法の平均は <b>O(1/(1 − α))</b>（α ＝ 占有率）。<b>α ≤ 0.5</b> なら平均 2 回以下。ハッシュ関数が一様なら、どちらの方法も実用上は<b>定数時間</b>。'),
      ),
    },
  ],
  quiz: [
    { kind: 'choice', tag: '集合', q: '集合とリストの違いとして正しいものは？', opts: ['集合は要素の重複を認めない', '集合は要素の順序が必ず昇順である', 'リストは要素の重複を認めない', '集合は配列でしか実現できない'], answer: 0, explain: '集合は<b>重複のない</b>要素の集まり。リストは重複を認めていた。' },
    { kind: 'choice', tag: '集合', q: '普遍集合 Z の要素数が |Z|、集合 A の要素数が |A| のとき、<b>配列リスト</b>で実現した集合の MEMBER の時間計算量と空間計算量の組は？', opts: ['O(1) と O(|Z|)', 'O(|A|) と O(|A|)', 'O(1) と O(|A|)', 'O(|Z|) と O(|Z|)'], answer: 0, explain: 'a[x] を見るだけなので O(1)。配列の長さは |Z|。' },
    { kind: 'input', tag: '外部', q: 'h(x) = x mod 7 の外部ハッシュ法で、空の集合に 10, 3, 17, 24, 5, 31 を順に挿入した。a[3] の連結リストの要素を先頭から空白区切りで。', answer: '10 3 17 24 31', explain: '10, 3, 17, 24, 31 はすべて mod 7 が 3。末尾につなげるので挿入順。LAB 5-4 で確認できる。' },
    { kind: 'input', tag: '外部', q: '前問の挿入後、連結リストの長さの最大値は？', answer: '5', explain: 'a[3] に 5 個、a[5] に 1 個。B = 7 なのに偏っている → 要素の規則性（7 ずつ違う）とハッシュ関数が噛み合った例。' },
    { kind: 'input', tag: '内部', q: '線形探査法 h<sub>k</sub>(x) = (x + k) mod 7 で、空の配列に 3, 10, 17, 4 を順に挿入したとき、衝突の総回数は？', answer: '5', explain: '3 → a[3]（0 回）。10 → 3 で衝突 → a[4]（1 回）。17 → 3, 4 で衝突 → a[5]（2 回）。4 → 4, 5 で衝突 → a[6]（2 回）。合計 0 + 1 + 2 + 2 = 5。クラスタ 3〜6 ができている。' },
    { kind: 'multi', tag: 'ハッシュ関数', q: 'ハッシュ関数に求められる性質をすべて選べ。', opts: ['再現性', '高速性', '周期性', '一様性'], answer: [0, 1, 3], explain: '再現性（必須）・高速性・一様性。周期性はむしろ偏りの原因になる。' },
    { kind: 'choice', tag: 'ハッシュ関数', q: '剰余法 h(x) = x mod B で、B として望ましいのは？', opts: ['素数', '2 のべき乗', '10 の倍数', '要素数と同じ数'], answer: 0, explain: '剰余法は B を<b>素数</b>に。2 のべき乗が望ましいのは乗算法。' },
    { kind: 'choice', tag: '内部', q: '内部ハッシュ法で DELETE するときにセルへ 0 ではなく削除記号 D を入れる理由は？', opts: ['0 にすると、その後ろに衝突して格納された要素を MEMBER で見つけられなくなるから', 'D の方がメモリを節約できるから', '0 は要素として使われる可能性があるから', 'D を入れると占有率が下がるから'], answer: 0, explain: 'MEMBER は 0 に出会うと探索を終える。途中を 0 にすると、そこを越えて格納された要素が見えなくなる。' },
    { kind: 'choice', tag: '内部', q: 'クラスタ（要素が固まって配置される現象）が最もできやすい探査方法は？', opts: ['線形探査法', '二次関数探査法', 'ダブルハッシュ法'], answer: 0, explain: '線形探査は衝突すると隣を見るので、埋まったセルが連なりやすい。' },
    { kind: 'input', tag: '計算量', q: '内部ハッシュ法で、ハッシュ関数が理想的に一様なとき、占有率 α = 0.75 での INSERT の平均アクセス回数は？', answer: '4', explain: '1/(1 − α) = 1/0.25 = 4。' },
  ],
}
