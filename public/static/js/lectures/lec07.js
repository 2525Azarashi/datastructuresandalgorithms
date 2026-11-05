import { h, s, svgRoot, lab, Player, stat, callout, card, cols, formula, table, seg, parseNums, range, toast, talk, point } from '../lib/ui.js'
import { layoutBinary } from '../lib/viz.js'

/* ---------------------------------------------------------
   第7回  順序付き集合(2): 2 分探索木・平衡探索木（AVL 木）
   --------------------------------------------------------- */

/** 節点番号＝挿入順。削除した節点は dead に入れて番号を保つ */
class BST {
  constructor() { this.v = []; this.L = []; this.R = []; this.P = []; this.root = -1; this.dead = new Set() }
  clone() { const t = new BST(); t.v = [...this.v]; t.L = [...this.L]; t.R = [...this.R]; t.P = [...this.P]; t.root = this.root; t.dead = new Set(this.dead); return t }
  get size() { return this.v.length - this.dead.size }
  ht(i = this.root) { return i < 0 ? -1 : 1 + Math.max(this.ht(this.L[i]), this.ht(this.R[i])) }
  bf(i) { return this.ht(this.L[i]) - this.ht(this.R[i]) }
  has(x) { let i = this.root; while (i >= 0 && this.v[i] !== x) i = x < this.v[i] ? this.L[i] : this.R[i]; return i >= 0 }
  add(x, p, left) {
    const k = this.v.length
    this.v.push(x); this.L.push(-1); this.R.push(-1); this.P.push(p)
    if (p < 0) this.root = k; else if (left) this.L[p] = k; else this.R[p] = k
    return k
  }
  insert(x) { // 単純な挿入（フレームなし）
    if (this.root < 0) return this.add(x, -1)
    let i = this.root
    for (;;) {
      if (x === this.v[i]) return -1
      const nx = x < this.v[i] ? this.L[i] : this.R[i]
      if (nx < 0) return this.add(x, i, x < this.v[i])
      i = nx
    }
  }
  repl(i, c) { // 節点 i の位置に c を付け替える
    const p = this.P[i]
    if (c >= 0) this.P[c] = p
    if (p < 0) this.root = c
    else if (this.L[p] === i) this.L[p] = c
    else this.R[p] = c
  }
  rotL(i) { const j = this.R[i]; this.R[i] = this.L[j]; if (this.L[j] >= 0) this.P[this.L[j]] = i; this.repl(i, j); this.L[j] = i; this.P[i] = j; return j }
  rotR(i) { const j = this.L[i]; this.L[i] = this.R[j]; if (this.R[j] >= 0) this.P[this.R[j]] = i; this.repl(i, j); this.R[j] = i; this.P[i] = j; return j }
  inorder(i = this.root, o = []) { if (i < 0) return o; this.inorder(this.L[i], o); o.push(i); this.inorder(this.R[i], o); return o }
  alive() { return range(this.v.length).filter((i) => !this.dead.has(i)) }
}

/** 木の描画。節点は id ごとに使い回し、位置の変化を CSS transition で動かす（回転が「動いて」見える） */
class TreeView {
  constructor({ r = 17, dx = 46, dy = 60, minW = 300, label = '2分探索木' } = {}) {
    Object.assign(this, { r, dx, dy, minW })
    this.svg = svgRoot(minW, 120, { class: 'bst-svg', role: 'img', 'aria-label': label })
    this.gE = s('g'); this.gN = s('g'); this.svg.append(this.gE, this.gN)
    this.nodes = {}
  }
  render(t, { cls = {}, edgeCls = {}, bf = false, showId = true } = {}) {
    const n = t.size, dx = n > 14 ? Math.max(30, this.dx - (n - 14) * 1.5) : this.dx
    const lay = t.root >= 0 ? layoutBinary(t.root, t.L, t.R, { dx, dy: this.dy, pad: this.r + 14 }) : { pos: {}, W: this.minW, H: 80 }
    const W = Math.max(lay.W, this.minW), off = (W - lay.W) / 2, top = bf ? 14 : 4
    const P = {}; Object.entries(lay.pos).forEach(([i, p]) => { P[i] = { x: p.x + off, y: p.y + top } })
    this.svg.setAttribute('viewBox', `0 0 ${W} ${lay.H + top + 14}`)
    this.svg.style.maxWidth = `${Math.round(W * 1.3)}px`
    this.gE.innerHTML = ''
    Object.keys(P).forEach((i) => {
      const p = t.P[i]
      if (p >= 0 && P[p]) this.gE.appendChild(s('line', { x1: P[p].x, y1: P[p].y, x2: P[i].x, y2: P[i].y, class: 'edge ' + (edgeCls[i] || '') }))
    })
    Object.keys(this.nodes).forEach((i) => { if (!P[i]) { this.nodes[i].remove(); delete this.nodes[i] } })
    Object.entries(P).forEach(([i, p]) => {
      let g = this.nodes[i]
      if (!g) {
        g = s('g', { class: 'node born' }, s('circle', { r: this.r }), s('text', { class: 'tv' }), s('text', { class: 'tidx', y: this.r + 11 }), s('text', { class: 'tbf', y: -this.r - 6 }))
        g.style.transform = `translate(${p.x}px,${p.y}px)`
        this.gN.appendChild(g); this.nodes[i] = g
      }
      const b = t.bf(+i)
      g.setAttribute('class', 'node ' + (cls[i] || '') + (g.classList.contains('born') ? ' born' : ''))
      requestAnimationFrame(() => g.classList.remove('born'))
      g.style.transform = `translate(${p.x}px,${p.y}px)`
      g.querySelector('.tv').textContent = t.v[i]
      g.querySelector('.tidx').textContent = showId ? i : ''
      const tb = g.querySelector('.tbf')
      tb.textContent = bf ? (b > 0 ? '+' + b : String(b)) : ''
      tb.setAttribute('class', 'tbf' + (Math.abs(b) > 1 ? ' ng' : ''))
    })
    return this.svg
  }
}

/** 親の節点番号の配列（課題の答えの形） */
function parentRow(t, cls = {}) {
  return h('div.harr', range(t.v.length).map((i) => h('div.hc', { class: t.dead.has(i) ? 'del' : cls[i] === 'ok' ? 'ok' : cls[i] ? 'cur' : '' }, h('i', `${i}:${t.v[i]}`), h('b', t.dead.has(i) ? '×' : String(t.P[i])))))
}
const parentsText = (t) => t.alive().map((i) => t.P[i]).join(' ')
const build = (xs) => { const t = new BST(); xs.forEach((x) => t.insert(x)); return t }
const side = (...k) => h('div', { style: { display: 'grid', gap: '10px', alignContent: 'start' } }, ...k)
const stageBox = () => h('div.stage', { style: { display: 'grid', placeItems: 'center', padding: '8px', minHeight: '230px', overflowX: 'auto' } })

/* ========== LAB 7-1: 規則と中順（小さい順に出てくる） ========== */
function inorderLab() {
  const inp = h('input.txt', { value: '7 4 11 1 5 9', 'aria-label': '挿入列', style: { width: '240px' } })
  const view = new TreeView(), stage = stageBox(), chips = h('div.chips'), narr = h('div.narr')
  stage.appendChild(view.svg)
  const root = h('div')
  const render = (f) => {
    view.render(f.t, { cls: f.cls })
    chips.innerHTML = ''
    f.out.length ? f.out.forEach((v, k) => chips.appendChild(h('span.chip.li', { class: k === f.out.length - 1 ? 'new' : '' }, v))) : chips.appendChild(h('span.chip.empty', 'まだ出力なし'))
    narr.innerHTML = f.msg
  }
  const player = new Player({ interval: 700, keyTarget: root, render })
  const go = () => {
    const t = build(parseNums(inp.value).slice(0, 20))
    if (t.root < 0) return toast('数を入力してね', 'warn')
    const F = [{ t, cls: { [t.root]: 'sel' }, out: [], msg: `どの節点でも <b>左部分木 &lt; 自分 &lt; 右部分木</b>。中順（左 → 自分 → 右）でたどってみよう。` }]
    const out = []
    t.inorder().forEach((i) => {
      out.push(t.v[i])
      const cls = {}; t.inorder().forEach((j) => { if (out.length && t.inorder().indexOf(j) < out.length - 1) cls[j] = 'vis' }); cls[i] = 'cur'
      F.push({ t, cls, out: out.slice(), msg: `節点 ${i}（要素 <b>${t.v[i]}</b>）を出力。左部分木は出力済み、右部分木はこれから。` })
    })
    F.push({ t, cls: Object.fromEntries(t.inorder().map((i) => [i, 'ok'])), out, msg: `完成：<b class="l">${out.join(' ')}</b> — 中順で読むと<b>必ず小さい順</b>に並ぶ。これが 2 分探索木の規則の言い換え。` })
    player.load(F)
  }
  inp.addEventListener('change', go)
  root.append(lab({
    title: 'LAB 7-1 — 規則と中順', hint: '中順でたどると小さい順',
    body: h('div',
      h('div.ctrl-row', h('div.field', h('label', '挿入列'), inp), h('button.op', { onclick: go }, '木を作る'),
        h('button.op.ghost', { onclick: () => { inp.value = '7 4 11 1 5 9'; go() } }, '講義の例'),
        h('button.op.ghost', { onclick: () => { inp.value = range(7).map(() => 1 + Math.floor(Math.random() * 60)).join(' '); go() } }, 'ランダム')),
      h('div.sep'),
      h('div.lab-grid.wide-left', stage, side(h('div.arr-name', '中順の出力'), chips, narr))),
    foot: player.el }))
  go()
  return root
}

/* ========== LAB 7-2: MEMBER / MIN / INSERT / DELETE ステッパ ========== */
function opsLab() {
  let T = new BST()
  const seqIn = h('input.txt', { value: '10 20 24 15 12', 'aria-label': '挿入列', style: { width: '220px' } })
  const xIn = h('input.num', { type: 'number', value: 20, 'aria-label': '操作する値 x' })
  const view = new TreeView(), stage = stageBox(), sts = h('div.stats'), narr = h('div.narr'), arr = h('div.hash-wrap'), out = h('div.narr.mono-out')
  stage.appendChild(view.svg)
  const root = h('div')
  const render = (f) => {
    view.render(f.t, { cls: f.cls, edgeCls: f.ecls || {} })
    sts.innerHTML = ''
    sts.append(stat('節点数 n', String(f.t.size), 'cy'), stat('高さ h', f.t.root < 0 ? '—' : String(f.t.ht()), 'hl'), stat('比較回数', String(f.c ?? 0), 'li'))
    arr.innerHTML = ''; arr.appendChild(parentRow(f.t, f.cls))
    out.innerHTML = `親の節点番号（削除済みは飛ばす）：<b>${parentsText(f.t) || '—'}</b>`
    narr.innerHTML = f.msg
  }
  const player = new Player({ interval: 850, keyTarget: root, render })
  const fr = (msg, cls = {}, c = 0, ecls) => ({ t: T.clone(), cls, msg, c, ecls })
  const walk = (x, F, verb) => { // 探索経路
    let i = T.root, c = 0, path = []
    while (i >= 0) {
      c++
      if (x === T.v[i]) return { i, c, path }
      const go = x < T.v[i] ? 'L' : 'R', nx = go === 'L' ? T.L[i] : T.R[i]
      path.push(i)
      F.push(fr(`${verb}: x = ${x} と節点 ${i} の要素 ${T.v[i]} を比べる → ${x < T.v[i] ? `<b>${x} &lt; ${T.v[i]}</b> なので左` : `<b>${x} &gt; ${T.v[i]}</b> なので右`}${nx < 0 ? 'の子は<b>ない</b>' : `の子（節点 ${nx}）へ`}`, Object.fromEntries([...path.slice(0, -1).map((j) => [j, 'vis']), [i, 'cur']]), c))
      if (nx < 0) return { i: -1, last: i, left: go === 'L', c, path }
      i = nx
    }
    return { i: -1, last: -1, c: 0, path }
  }
  const member = (x, F) => {
    if (T.root < 0) return F.push(fr('空集合なので false'))
    const r = walk(x, F, 'MEMBER')
    if (r.i >= 0) F.push(fr(`節点 ${r.i} の要素が ${x} に一致 → <b class="l">true</b>（比較 ${r.c} 回）`, { ...Object.fromEntries(r.path.map((j) => [j, 'vis'])), [r.i]: 'ok' }, r.c))
    else F.push(fr(`たどる先がなくなった → <b class="r">false</b>（比較 ${r.c} 回）`, Object.fromEntries(r.path.map((j) => [j, 'vis'])), r.c))
  }
  const minOp = (F) => {
    if (T.root < 0) return F.push(fr('空集合なので何もしない'))
    let i = T.root, c = 0; const path = []
    while (T.L[i] >= 0) { path.push(i); F.push(fr(`MIN: 節点 ${i}（${T.v[i]}）に左の子があるので左へ`, Object.fromEntries([...path.slice(0, -1).map((j) => [j, 'vis']), [i, 'cur']]), ++c)); i = T.L[i] }
    F.push(fr(`節点 ${i} には左の子がない → 最小要素は <b class="l">${T.v[i]}</b>。左にたどるだけで見つかる。`, { ...Object.fromEntries(path.map((j) => [j, 'vis'])), [i]: 'ok' }, c))
  }
  const insert = (x, F) => {
    if (T.root < 0) { const k = T.add(x, -1); return F.push(fr(`空なので節点 ${k} を<b>根</b>として作る（親は -1）`, { [k]: 'ok' })) }
    const r = walk(x, F, 'INSERT')
    if (r.i >= 0) return F.push(fr(`${x} はすでにある（多重集合ではない）ので何もしない`, { [r.i]: 'sel' }, r.c))
    const k = T.add(x, r.last, r.left)
    F.push(fr(`節点 ${r.last} の<b>${r.left ? '左' : '右'}の子</b>として節点 ${k}（${x}）を追加。追加される節点は<b>必ず葉</b>。`, { ...Object.fromEntries(r.path.map((j) => [j, 'vis'])), [k]: 'ok' }, r.c, { [k]: 'on' }))
  }
  const del = (x, F) => {
    if (T.root < 0) return F.push(fr('空集合なので何もしない'))
    const r = walk(x, F, 'DELETE')
    if (r.i < 0) return F.push(fr(`${x} は集合にないので何もしない`, Object.fromEntries(r.path.map((j) => [j, 'vis'])), r.c))
    const i = r.i, l = T.L[i], rr = T.R[i]
    F.push(fr(`節点 ${i} の要素が ${x} に一致。子の数は <b>${(l >= 0) + (rr >= 0)}</b>`, { [i]: 'bad', ...(l >= 0 ? { [l]: 'sel' } : {}), ...(rr >= 0 ? { [rr]: 'sel' } : {}) }, r.c))
    if (l < 0 && rr < 0) { T.repl(i, -1); T.dead.add(i); F.push(fr(`<b>葉</b>なので、節点 ${i} をそのまま削除`, {}, r.c)) }
    else if (l < 0 || rr < 0) {
      const c = l >= 0 ? l : rr, p = T.P[i]
      T.repl(i, c); T.dead.add(i)
      F.push(fr(`<b>子が 1 つ</b> → 節点 ${i} を削除し、元親（${p < 0 ? 'なし：子が新しい根' : `節点 ${p}`}）と元子（節点 ${c}）を接続`, { [c]: 'ok', ...(p >= 0 ? { [p]: 'ok' } : {}) }, r.c, { [c]: 'on' }))
    } else {
      let m = rr; const path = [rr]
      F.push(fr(`<b>子が 2 つ</b> → 右部分木（節点 ${rr} から下）の<b>最小要素</b>を探す`, { [i]: 'bad', [rr]: 'cur' }, r.c))
      while (T.L[m] >= 0) { m = T.L[m]; path.push(m); F.push(fr(`左の子へ：節点 ${m}（${T.v[m]}）`, { [i]: 'bad', ...Object.fromEntries(path.slice(0, -1).map((j) => [j, 'vis'])), [m]: 'cur' }, r.c)) }
      const mc = T.R[m], mp = T.P[m]
      F.push(fr(`右部分木の最小は節点 <b>m = ${m}</b>（要素 ${T.v[m]}）。m に左の子はない（子は高々 1 つ）。`, { [i]: 'bad', [m]: 'ok', ...(mc >= 0 ? { [mc]: 'sel' } : {}) }, r.c))
      T.repl(m, mc); T.v[i] = T.v[m]; T.dead.add(m)
      F.push(fr(`① m の親（節点 ${mp}）と m の子（${mc >= 0 ? `節点 ${mc}` : 'なし'}）を接続 ② 節点 ${i} に要素 <b>${T.v[i]}</b> を入れる ③ 節点 ${m} を削除。<b>節点 ${i} の番号はそのまま</b>。`, { [i]: 'ok', ...(mc >= 0 ? { [mc]: 'ok' } : {}) }, r.c, mc >= 0 ? { [mc]: 'on' } : {}))
    }
  }
  const reset = () => {
    T = new BST()
    const F = [fr('空の 2 分探索木から始める。節点番号は<b>挿入順</b>に 0, 1, 2, …')]
    parseNums(seqIn.value).slice(0, 24).forEach((x) => insert(x, F))
    F.push(fr(`挿入完了。下の配列が「各節点の親の節点番号」（根は -1）。x を入れて操作してみよう。`))
    player.load(F, F.length - 1)
  }
  const op = (fn) => () => { const x = +xIn.value; const F = [fr('操作を開始')]; fn(x, F); player.load(F); player.play() }
  seqIn.addEventListener('change', reset)
  root.append(lab({
    title: 'LAB 7-2 — 2 分探索木の操作', hint: 'どの操作も根から 1 本道をたどる',
    body: h('div',
      h('div.ctrl-row', h('div.field', h('label', '挿入列'), seqIn), h('button.op', { onclick: reset }, '空から挿入'),
        h('button.op.ghost', { onclick: () => { seqIn.value = '10 20 24 15 12'; reset() } }, '講義の数値例'),
        h('button.op.ghost', { onclick: () => { seqIn.value = '7 4 11 1 5 9 10 3 6 8'; reset() } }, 'DELETE(4) の例')),
      h('div.ctrl-row', h('div.field', h('label', 'x ='), xIn),
        h('button.op', { onclick: op(member) }, 'MEMBER(x)'), h('button.op', { onclick: op(insert) }, 'INSERT(x)'), h('button.op', { onclick: op(del) }, 'DELETE(x)'), h('button.op', { onclick: () => { const F = [fr('MIN を開始')]; minOp(F); player.load(F); player.play() } }, 'MIN')),
      h('div.sep'),
      h('div.lab-grid.wide-left', stage, side(sts, narr)),
      h('div.arr-name', '節点 i:要素 ／ 親の節点番号'), arr, out),
    foot: player.el }))
  reset()
  return root
}

/* ========== LAB 7-3: 挿入順と高さ ========== */
function heightLab() {
  const inp = h('input.txt', { value: '1 2 3 4 5 6 7', 'aria-label': '挿入列', style: { width: '200px' } })
  const view = new TreeView({ dx: 42 }), stage = stageBox(), sts = h('div.stats'), narr = h('div.narr')
  stage.appendChild(view.svg)
  const nSl = h('input', { type: 'range', min: 3, max: 11, value: 7, 'aria-label': 'log2 n' }), chart = h('div.stage', { style: { padding: '10px' } }), out2 = h('div.narr')
  const draw = () => {
    const xs = [...new Set(parseNums(inp.value))].slice(0, 20), t = build(xs)
    view.render(t, { cls: Object.fromEntries(t.alive().map((i) => [i, t.ht() === 0 ? '' : depthOf(t, i) === t.ht() ? 'cur' : ''])) })
    const n = t.size, hh = t.ht(), lo = Math.floor(Math.log2(n || 1))
    sts.innerHTML = ''
    sts.append(stat('節点数 n', String(n), 'cy'), stat('高さ h', n ? String(hh) : '—', 'hl'), stat('最大 n−1 ／ 最小 ⌊log₂ n⌋', `${Math.max(0, n - 1)} ／ ${lo}`, 'li'))
    narr.innerHTML = !n ? '数を入力してね。' : hh === n - 1 && n > 2 ? `一直線！ 高さ <b class="r">${hh} = n − 1</b>。<b>連結リストと同じ</b>で、探索は O(n)。小さい順（大きい順）に入れるとこうなる。`
      : hh === lo ? `高さ <b class="l">${hh} = ⌊log₂ n⌋</b>、これ以上低くできない最良の形。真ん中の値から先に入れるとこうなる。`
        : `高さ ${hh}。最悪 ${n - 1} と最良 ${lo} の間。`
  }
  const sim = () => {
    const k = +nSl.value, N = 2 ** k, trials = 60
    let sum = 0
    for (let tr = 0; tr < trials; tr++) {
      const a = range(N); for (let i = N - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
      const Lc = new Int32Array(N).fill(-1), Rc = new Int32Array(N).fill(-1); let mx = 0
      for (let q = 1; q < N; q++) { let i = a[0], d = 0; const x = a[q]; for (;;) { d++; const nx = x < i ? Lc[i] : Rc[i]; if (nx < 0) { if (x < i) Lc[i] = x; else Rc[i] = x; break } i = nx } mx = Math.max(mx, d) }
      sum += mx
    }
    const avg = sum / trials
    chart.innerHTML = ''
    const W = 520, H = 150, bars = [['最悪 n − 1', N - 1, 'lin'], [`ランダム平均（${trials} 回）`, avg, 'mid'], ['最良 ⌊log₂ n⌋', k, 'log']], mx = N - 1
    const svg = svgRoot(W, H, { class: 'achart', role: 'img', 'aria-label': '高さの比較' })
    bars.forEach(([lb, v, c], j) => {
      const y = 14 + j * 44, w = Math.max(4, Math.sqrt(v / mx) * (W - 200))
      svg.append(s('text', { x: 4, y: y + 18, class: 'h-ax ' + c, text: lb }), s('rect', { x: 160, y, width: w, height: 26, rx: 8, class: 'hbar ' + c }), s('text', { x: 168 + w, y: y + 18, class: 'h-ax', text: v.toFixed(c === 'mid' ? 1 : 0) }))
    })
    chart.appendChild(svg)
    out2.innerHTML = `n = 2<sup>${k}</sup> = ${N} 個をランダムな順に挿入すると、高さの平均は約 <b class="l">${avg.toFixed(1)}</b>（log₂ n = ${k} の数倍程度 = <b>O(log₂ n)</b>）。最悪の ${N - 1} とは段違い。ただし「全要素が事前に揃っていて並べ替えられる」ことが前提。<small>（棒の長さは平方根スケール）</small>`
  }
  inp.addEventListener('input', draw); nSl.addEventListener('input', sim)
  const pre = (v) => () => { inp.value = v; draw() }
  const shuffle = () => { const a = range(7).map((i) => i + 1); for (let i = 6; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } inp.value = a.join(' '); draw() }
  const root = lab({
    title: 'LAB 7-3 — 挿入順で高さが変わる', hint: '同じ 1〜7 でも形は別物',
    body: h('div',
      h('div.ctrl-row', h('div.field', h('label', '挿入列'), inp), h('button.op.ghost', { onclick: pre('1 2 3 4 5 6 7') }, '昇順'), h('button.op.ghost', { onclick: pre('7 6 5 4 3 2 1') }, '降順'),
        h('button.op.ghost', { onclick: pre('4 2 6 1 3 5 7') }, '真ん中から'), h('button.op.ghost', { onclick: pre('1 7 2 6 3 5 4') }, 'ジグザグ'), h('button.op', { onclick: shuffle }, 'シャッフル')),
      h('div.sep'),
      h('div.lab-grid.wide-left', stage, side(sts, narr)),
      h('div.sep'),
      h('div.ctrl-row', h('div.field', h('label', 'ランダム実験 n = 2^'), nSl), h('button.op.ghost', { onclick: sim }, 'もう一度')),
      chart, out2),
  })
  draw(); sim()
  return root
}
function depthOf(t, i) { let d = 0; while (t.P[i] >= 0) { i = t.P[i]; d++ } return d }

/* ========== LAB 7-4: AVL 木チェッカー（高さの差） ========== */
function avlCheckLab() {
  const inp = h('input.txt', { value: '7 4 11 2 5 9 1', 'aria-label': '挿入列', style: { width: '220px' } })
  const view = new TreeView({ label: 'AVL 木チェッカー' }), stage = stageBox(), verdict = h('div.verdict'), narr = h('div.narr')
  stage.appendChild(view.svg)
  const draw = () => {
    const t = build(parseNums(inp.value).slice(0, 20))
    const bad = t.alive().filter((i) => Math.abs(t.bf(i)) > 1)
    view.render(t, { bf: true, cls: Object.fromEntries(bad.map((i) => [i, 'bad'])) })
    verdict.className = 'verdict ' + (bad.length ? 'ng' : 'ok')
    verdict.innerHTML = !t.size ? '—' : bad.length ? '✗ AVL 木ではない' : '✓ AVL 木（平衡）'
    narr.innerHTML = !t.size ? '数を入力してね。' : (bad.length ? bad.map((i) => `節点 ${i}（${t.v[i]}）：左の高さ ${t.ht(t.L[i])}、右の高さ ${t.ht(t.R[i])} → 差 <b class="r">${t.bf(i)}</b>`).join('<br>')
      : 'すべての節点で 高さの差 が −1, 0, +1 のどれか。') + `<br><small>節点の上の数 = 左部分木の高さ − 右部分木の高さ（空の部分木の高さは −1）。左が高いと<b>正</b>、右が高いと<b>負</b>。</small>`
  }
  inp.addEventListener('input', draw)
  const pre = (v) => () => { inp.value = v; draw() }
  const root = lab({
    title: 'LAB 7-4 — AVL 木チェッカー', hint: '各節点の上に「高さの差」',
    body: h('div',
      h('div.ctrl-row', h('div.field', h('label', '挿入列'), inp), h('button.op.ghost', { onclick: pre('7 4 11 2 5 9 1') }, 'AVL 木の例'),
        h('button.op.ghost', { onclick: pre('7 4 11 2 5 1') }, 'AVL 木でない例'), h('button.op.ghost', { onclick: pre('10 20 24') }, '10 20 24'), h('button.op.ghost', { onclick: pre('20 10 24 15 12') }, '20 10 24 15 12')),
      h('div.sep'),
      h('div.lab-grid.wide-left', stage, side(verdict, narr))),
  })
  draw()
  return root
}

/* ========== LAB 7-5: 4 つの回転パターン ========== */
const PAT = {
  LL: { seq: [30, 20, 10], desc: '左の子の左に挿入', how: '節点 k（30）で<b>右回転</b>' },
  LR: { seq: [30, 10, 20], desc: '左の子の右に挿入', how: '左の子（10）で<b>左回転</b> → 節点（30）で<b>右回転</b>' },
  RL: { seq: [10, 30, 20], desc: '右の子の左に挿入', how: '右の子（30）で<b>右回転</b> → 節点（10）で<b>左回転</b>' },
  RR: { seq: [10, 20, 30], desc: '右の子の右に挿入', how: '節点 i（10）で<b>左回転</b>' },
}
function rotateLab() {
  let cur = 'LR'
  const view = new TreeView({ dx: 64, minW: 280, label: '回転パターン' }), stage = stageBox(), narr = h('div.narr'), badge = h('div.pat-badge')
  stage.appendChild(view.svg)
  const root = h('div')
  const render = (f) => { view.render(f.t, { bf: true, cls: f.cls }); narr.innerHTML = f.msg; badge.textContent = f.badge || cur }
  const player = new Player({ interval: 1100, keyTarget: root, render })
  const load = () => {
    const p = PAT[cur], t = new BST(), F = []
    p.seq.forEach((x, k) => { t.insert(x); F.push({ t: t.clone(), cls: { [k]: 'ok' }, msg: `INSERT(${x})` }) })
    F.push({ t: t.clone(), cls: { 0: 'bad', 1: 'sel', 2: 'cur' }, msg: `根の高さの差が <b class="r">${t.bf(0) > 0 ? '+' : ''}${t.bf(0)}</b> → 規則違反！ ${p.desc}したので <b>${cur} パターン</b>。直し方：${p.how}` })
    if (cur === 'LR') { t.rotL(1); F.push({ t: t.clone(), cls: { 2: 'cur', 1: 'vis' }, msg: '① 節点 1（10）を中心に<b>左回転</b>：20 が上がり、10 がその左の子へ。形が LL パターンになった。' }) }
    if (cur === 'RL') { t.rotR(1); F.push({ t: t.clone(), cls: { 2: 'cur', 1: 'vis' }, msg: '① 節点 1（30）を中心に<b>右回転</b>：20 が上がり、30 がその右の子へ。形が RR パターンになった。' }) }
    if (cur === 'LL' || cur === 'LR') t.rotR(0); else t.rotL(0)
    F.push({ t: t.clone(), cls: { [t.root]: 'ok' }, msg: `${cur.length && (cur === 'LL' || cur === 'RR') ? '' : '② '}節点 0 を中心に<b>${cur[0] === 'L' ? '右' : '左'}回転</b>：真ん中の値 <b>20</b> が根になり、全節点の高さの差が 0 に。中順（10 → 20 → 30）は<b>回転の前後で変わらない</b>。`, badge: '✓ 平衡' })
    player.load(F); player.play()
  }
  const sel = seg(Object.keys(PAT).map((k) => [k, `${k} パターン`]), cur, (v) => { cur = v; load() })
  root.append(lab({
    title: 'LAB 7-5 — 4 つの回転パターン', hint: '節点がスライドして入れ替わる',
    body: h('div',
      h('div.ctrl-row', sel, h('button.op.ghost', { onclick: load }, 'もう一度')),
      h('div.sep'),
      h('div.lab-grid.wide-left', stage, side(badge, narr)),
      table(['パターン', '挿入順（a &lt; b &lt; c）', '回転'], [['LL', 'c, b, a', '右回転'], ['LR', 'c, a, b', '左回転 → 右回転'], ['RL', 'a, c, b', '右回転 → 左回転'], ['RR', 'a, b, c', '左回転']])),
    foot: player.el }))
  load()
  return root
}

/* ========== LAB 7-6: AVL 木への挿入（2 分探索木と比較） ========== */
function avlLab() {
  let T = new BST(), B = new BST(), rots = 0
  const seqIn = h('input.txt', { value: '10 20 24 15 12', 'aria-label': '挿入列', style: { width: '240px' } })
  const xIn = h('input.num', { type: 'number', value: 11, 'aria-label': '挿入する値' })
  const view = new TreeView({ label: 'AVL 木' }), stage = stageBox(), sts = h('div.stats'), narr = h('div.narr'), arr = h('div.hash-wrap'), out = h('div.narr'), hist = h('div.log', { style: { maxHeight: '140px' } })
  stage.appendChild(view.svg)
  const root = h('div')
  const render = (f) => {
    view.render(f.t, { bf: true, cls: f.cls })
    sts.innerHTML = ''
    sts.append(stat('AVL 木の高さ', f.t.root < 0 ? '—' : String(f.t.ht()), 'li'), stat('普通の 2 分探索木なら', f.bh < 0 ? '—' : String(f.bh), 'hl'), stat('回転の回数', String(f.rots), 'cy'))
    arr.innerHTML = ''; arr.appendChild(parentRow(f.t, f.cls))
    out.innerHTML = `親の節点番号：<b>${parentsText(f.t) || '—'}</b>`
    narr.innerHTML = f.msg
  }
  const player = new Player({ interval: 900, keyTarget: root, render })
  const fr = (msg, cls = {}) => ({ t: T.clone(), cls, msg, bh: B.ht(), rots })
  const ins = (x, F) => {
    if (T.has(x)) { F.push(fr(`${x} はすでにあるので何もしない`)); return '重複' }
    B.insert(x)
    let i = T.root, last = -1, left = false; const path = []
    while (i >= 0) { path.push(i); last = i; left = x < T.v[i]; i = left ? T.L[i] : T.R[i] }
    const k = T.add(x, last, left)
    F.push(fr(`① 2 分探索木と同じように INSERT(${x})：${last < 0 ? '根になる' : `節点 ${last} の${left ? '左' : '右'}に節点 ${k} を追加`}`, { ...Object.fromEntries(path.map((j) => [j, 'vis'])), [k]: 'ok' }))
    let j = T.P[k]
    while (j >= 0) {
      const b = T.bf(j)
      if (Math.abs(b) <= 1) { F.push(fr(`② 節点 ${j}（${T.v[j]}）の高さの差 = ${b > 0 ? '+' : ''}${b} → <b class="l">OK</b>、親へ`, { [j]: 'cur', [k]: 'ok' })); j = T.P[j]; continue }
      let pat
      if (b > 1) pat = T.bf(T.L[j]) >= 0 ? 'LL' : 'LR'; else pat = T.bf(T.R[j]) <= 0 ? 'RR' : 'RL'
      F.push(fr(`② 節点 ${j}（${T.v[j]}）の高さの差 = <b class="r">${b > 0 ? '+' : ''}${b}</b> → <b>NG！ ${pat} パターン</b>`, { [j]: 'bad', [k]: 'ok' }))
      rots++
      if (pat === 'LR') { const c = T.L[j]; T.rotL(c); F.push(fr(`③ 節点 ${c} で<b>左回転</b>`, { [T.L[j]]: 'cur' })) }
      if (pat === 'RL') { const c = T.R[j]; T.rotR(c); F.push(fr(`③ 節点 ${c} で<b>右回転</b>`, { [T.R[j]]: 'cur' })) }
      const top = pat[0] === 'L' ? T.rotR(j) : T.rotL(j)
      F.push(fr(`${pat.length === 2 && (pat === 'LL' || pat === 'RR') ? '③' : '④'} 節点 ${j} で<b>${pat[0] === 'L' ? '右' : '左'}回転</b> → 節点 ${top}（${T.v[top]}）が部分木の根に。部分木の高さが挿入前に戻るので、<b>これより上は確認不要</b>。`, { [top]: 'ok', [j]: 'vis' }))
      return pat
    }
    F.push(fr(`根まで確認して規則はすべて OK → 回転なし`, { [k]: 'ok' }))
    return '回転なし'
  }
  const logLine = (t) => { hist.innerHTML += `<div>${t}</div>`; hist.scrollTop = 1e9 }
  const reset = () => {
    T = new BST(); B = new BST(); rots = 0; hist.innerHTML = ''
    const F = [fr('空の AVL 木から始める。各節点の上の数は「左の高さ − 右の高さ」。')]
    parseNums(seqIn.value).slice(0, 24).forEach((x) => { const r = ins(x, F); logLine(`INSERT(${x}) — ${r}`) })
    F.push(fr(`挿入完了。普通の 2 分探索木だと高さ ${B.ht()}、AVL 木だと <b class="l">${T.ht()}</b>。`))
    player.load(F, F.length - 1)
  }
  const one = () => { const x = +xIn.value; if (!Number.isFinite(x)) return; const F = [fr(`INSERT(${x}) を実行`)]; const r = ins(x, F); logLine(`INSERT(${x}) — ${r}`); player.load(F); player.play() }
  seqIn.addEventListener('change', reset)
  root.append(lab({
    title: 'LAB 7-6 — AVL 木への挿入', hint: '下から上にチェックして、最初の NG で回転',
    body: h('div',
      h('div.ctrl-row', h('div.field', h('label', '挿入列'), seqIn), h('button.op', { onclick: reset }, '空から挿入'),
        h('button.op.ghost', { onclick: () => { seqIn.value = '10 20 24 15 12'; reset() } }, '講義の数値例'),
        h('button.op.ghost', { onclick: () => { seqIn.value = '1 2 3 4 5 6 7 8 9 10 11 12 13 14 15'; reset() } }, '昇順 1〜15')),
      h('div.ctrl-row', h('div.field', h('label', 'x ='), xIn), h('button.op', { onclick: one }, 'INSERT(x)')),
      h('div.sep'),
      h('div.lab-grid.wide-left', stage, side(sts, narr)),
      h('div.arr-name', '節点 i:要素 ／ 親の節点番号（回転しても節点番号は変わらない）'), arr, out,
      h('div.arr-name', '操作の記録'), hist),
    foot: player.el }))
  reset()
  return root
}

/* ========== LAB 7-7: AVL 木の高さの範囲 ========== */
function boundLab() {
  const hSl = h('input', { type: 'range', min: 0, max: 5, value: 3, 'aria-label': '高さ h' })
  const nIn = h('input.num', { type: 'number', value: 1000, min: 1, 'aria-label': '節点数 n', style: { width: '130px' } })
  const view = new TreeView({ dx: 34, r: 14, dy: 50, label: '節点数が最小の AVL 木' }), stage = stageBox(), sts = h('div.stats'), narr = h('div.narr'), out = h('div.narr')
  stage.appendChild(view.svg)
  const nL = (k) => (k < 0 ? 0 : k === 0 ? 1 : 1 + nL(k - 1) + nL(k - 2))
  const fib = (k) => {
    const t = new BST()
    const mk = (d) => { if (d < 0) return -1; const id = t.add(0, -2); const l = mk(d - 1), r = mk(d - 2); t.L[id] = l; t.R[id] = r; if (l >= 0) t.P[l] = id; if (r >= 0) t.P[r] = id; return id }
    t.root = mk(k); t.P[t.root] = -1
    t.inorder().forEach((i, q) => { t.v[i] = q + 1 })
    return t
  }
  const draw = () => {
    const k = +hSl.value, t = fib(k)
    view.render(t, { bf: true, showId: false, cls: Object.fromEntries(t.alive().map((i) => [i, t.bf(i) !== 0 ? 'hl2' : ''])) })
    sts.innerHTML = ''
    sts.append(stat(`最小 n<sub>L</sub>(${k})`, String(nL(k)), 'li'), stat(`最大 n<sub>U</sub>(${k}) = 2<sup>${k + 1}</sup>−1`, String(2 ** (k + 1) - 1), 'hl'), stat(`下限式 2<sup>h/2+1</sup>−1`, (2 ** (k / 2 + 1) - 1).toFixed(2), 'cy'))
    narr.innerHTML = `高さ ${k} で<b>節点数が最小</b>の AVL 木（葉以外の全節点で高さの差が ±1）。左に高さ ${k - 1}、右に高さ ${k - 2} の最小 AVL 木をぶら下げた形：n<sub>L</sub>(h) = 1 + n<sub>L</sub>(h−1) + n<sub>L</sub>(h−2)。数列 ${range(6).map((q) => nL(q)).join(', ')}, … は<b>フィボナッチ数 − 1</b>。`
    const n = Math.max(1, Math.floor(+nIn.value || 1)), lg = Math.log2(n + 1)
    let hmax = 0; while (nL(hmax + 1) <= n) hmax++
    out.innerHTML = `n = <b>${n.toLocaleString()}</b> のとき <b>${(lg - 1).toFixed(2)} &lt; h &lt; ${(2 * lg - 2).toFixed(2)}</b>（log₂(n+1) − 1 &lt; h &lt; 2 log₂(n+1) − 2）。実際に作れる最大の高さは ${hmax}。普通の 2 分探索木なら最悪 <b class="r">${(n - 1).toLocaleString()}</b>。`
  }
  hSl.addEventListener('input', draw); nIn.addEventListener('input', draw)
  const root = lab({
    title: 'LAB 7-7 — AVL 木の高さは O(log n)', hint: '最も「やせた」AVL 木を見る',
    body: h('div',
      h('div.ctrl-row', h('div.field', h('label', '高さ h ='), hSl)),
      h('div.sep'),
      h('div.lab-grid.wide-left', stage, side(sts, narr)),
      h('div.sep'),
      h('div.ctrl-row', h('div.field', h('label', '節点数 n ='), nIn), ...[7, 100, 1000, 1000000].map((v) => h('button.op.ghost', { onclick: () => { nIn.value = v; draw() } }, v.toLocaleString()))),
      h('div', { style: { marginTop: '10px' } }, out)),
  })
  draw()
  return root
}

export default {
  n: 7,
  title: '2 分探索木と平衡探索木',
  sub: '順序付き集合 (2) — 探索の速さは木の高さで決まる',
  en: 'Binary Search Tree & AVL Tree',
  tags: ['2分探索木', 'MEMBER / INSERT / DELETE / MIN', 'O(h)', '平衡探索木', 'AVL木', '回転'],
  mini: '<svg viewBox="0 0 120 60"><g stroke="#3d2e54" stroke-width="1.5"><path d="M60 12 36 32M60 12 84 32M36 32 24 50M36 32 48 50M84 32 96 50" fill="none" stroke-opacity=".5"/><circle cx="60" cy="12" r="7" fill="#ff8a3d"/><circle cx="36" cy="32" r="6" fill="#3fa9f5"/><circle cx="84" cy="32" r="6" fill="#2fbf71"/><circle cx="24" cy="50" r="5" fill="#fff"/><circle cx="48" cy="50" r="5" fill="#fff"/><circle cx="96" cy="50" r="5" fill="#fff"/></g></svg>',
  goals: [
    '2 分探索木の規則（左部分木 < x<sub>i</sub> < 右部分木）を説明できる',
    'MEMBER・MIN・INSERT・DELETE の手順を、木をたどりながら実行できる（計算量 O(h)）',
    '挿入順によって木の高さが n − 1 から ⌊log₂ n⌋ まで変わることを説明できる',
    'AVL 木の規則と 4 つの回転パターン（LL・LR・RL・RR）を説明できる',
    'AVL 木への挿入を手で実行でき、高さが O(log₂ n) になる理由を説明できる',
  ],
  chapters: [
    {
      id: 'bst', k: 'STRUCTURE', title: '2 分探索木とは',
      build: (el) => el.append(
        talk(`S: 今回は順序付き集合シリーズの 2 回目、<b>2 分探索木</b>。
R: ヒープも 2 分木でしたよね。何が違うんですか？
S: 規則が違う。2 分探索木は、どの節点 i についても<b>左部分木の要素はすべて x<sub>i</sub> より小さく、右部分木の要素はすべて x<sub>i</sub> より大きい</b>。
R: ヒープは「親 ≤ 子」で、兄弟の大小は決まってなかった。こっちは左右で決まるんだ。
S: そう。ちなみに講義では簡単のため<b>多重集合じゃない</b>（同じ要素は入れない）とするよ。`),
        cols(2,
          card('規則', '節点 i の<strong>左部分木の要素 &lt; x<sub>i</sub> &lt; 右部分木の要素</strong>。すべての節点で成り立つ。', 'RULE'),
          card('操作', '<strong>MEMBER・INSERT・DELETE・MIN</strong>。全部「根から 1 本道をたどる」だけで実行できる。', 'OPS')),
        talk(`S: 実現は 2 分木の回で習った<b>連結リスト</b>。各節点に要素・左の子・右の子（必要なら親）へのポインタを持たせる。
R: 規則があると何がうれしいんですか？
S: 下のラボで<b>中順</b>（左 → 自分 → 右）にたどってみて。`),
        inorderLab(),
        talk(`R[happy]: 小さい順に出てきた！
S: 左部分木は全部小さく、右部分木は全部大きいから、「左を全部 → 自分 → 右を全部」で読むと必ず昇順になる。課題でもよく聞かれるよ。`),
        point('2 分探索木 ＝ <b>左部分木 &lt; 自分 &lt; 右部分木</b>。中順でたどると<b>小さい順</b>に並ぶ。'),
      ),
    },
    {
      id: 'ops', k: 'ALGORITHM', title: 'MEMBER・MIN・INSERT・DELETE',
      build: (el) => el.append(
        talk(`S: <b>MEMBER(x, A)</b>：根から始めて、x が節点の要素より小さければ左、大きければ右へ。一致したら true、たどる先がなくなったら false。
S: <b>MIN(A)</b>：根から<b>左の子をたどり続ける</b>だけ。左の子がない節点が最小。
R: 最小の節点は左の子を持たないから、子の数は<b>高々 1 つ</b>（右の子だけ）なんですね。
S: <b>INSERT(x, A)</b>：MEMBER と同じように下っていって、子がなかった場所に新しい節点を付ける。だから<b>追加される節点は必ず葉</b>。`),
        talk(`S: いちばん難しいのが <b>DELETE(x, A)</b>。消す節点 i の子の数で 3 通り。
S: ① <b>葉</b> → そのまま削除。② <b>子が 1 つ</b> → 節点 i を削除して、<b>元親と元子をつなぐ</b>。
S: ③ <b>子が 2 つ</b> → <b>右部分木の最小要素</b>を持つ節点 m を探して、m の親と m の子をつなぎ、節点 i に m の要素を入れて、<b>節点 m を削除</b>。
R[think]: なんで右部分木の最小？
S: 右部分木の最小は「x<sub>i</sub> の次に大きい値」。それを i の位置に置けば、左部分木より大きく、残りの右部分木より小さいから規則が保たれる。m は最小だから左の子がなく、子は高々 1 つで、つなぎ直しも簡単。（左部分木の最大でも可）
R: 消えるのは<b>節点 m</b> で、<b>節点 i の番号は残る</b>んですね。課題で「削除した節点は飛ばす」ってあるのはこれか。`),
        opsLab(),
        talk(`S: 講義の例：10, 20, 24, 15, 12 を入れると親は <b>-1 0 1 1 3</b>。そこで DELETE(20) は子が 2 つのパターン。右部分木の最小は節点 2（24）だから、節点 1 に 24 を入れて節点 2 を削除。
R: ラボで x = 20 にして DELETE したら同じになりました！
S: どの操作も根から下に 1 本たどるだけだから、計算量は木の<b>高さ h</b> に比例して <b>O(h)</b>。`),
        point('MEMBER・INSERT・MIN は<b>根から 1 本道</b>。DELETE は <b>葉／子 1 つ（元親と元子を接続）／子 2 つ（右部分木の最小 m を移して m を削除）</b>。全部 <b>O(h)</b>。'),
      ),
    },
    {
      id: 'height', k: 'COMPLEXITY', title: '木の高さ h',
      build: (el) => el.append(
        talk(`R: O(h) の h って、n とどういう関係なんですか？
S: そこが 2 分探索木の弱点。<b>挿入順で形が全然変わる</b>。小さい順に入れると右へ右へ一直線になって、<b>h = n − 1</b>。
R: それって連結リストと同じじゃないですか！
S: そう、最悪 O(n)。逆に、うまい順に入れれば h = ⌊log₂ n⌋ まで低くできる。`),
        heightLab(),
        talk(`S: 要素をランダムに並べ替えてから入れれば、平均的な高さは <b>O(log₂ n)</b>。
R: じゃあシャッフルすればいいのでは？
S: それには<b>挿入する要素が事前に全部揃っている</b>必要がある。実際は次々に来ることが多いから難しい。
S: そこで、挿入や削除のたびに木を組み替えて高さを抑えるのが<b>平衡探索木</b>。`),
        h('div.reveal', table(['挿入順', '高さ h', '計算量'], [['小さい順・大きい順', '<b>n − 1</b>（最大）', 'O(n)'], ['ランダム', '平均 O(log₂ n)', '平均 O(log n)'], ['真ん中から（4 2 6 1 3 5 7 など）', '<b>⌊log₂ n⌋</b>（最小）', 'O(log n)']])),
        point('高さの最大は <b>n − 1</b>（昇順に挿入）、最小は <b>⌊log₂ n⌋</b>。ランダムなら平均 O(log₂ n) だが、要素が揃っている必要がある → <b>平衡探索木</b>へ。'),
      ),
    },
    {
      id: 'avl', k: 'STRUCTURE', title: '平衡探索木と AVL 木',
      build: (el) => el.append(
        talk(`S: <b>平衡探索木</b>は、高さが常に <b>O(log₂ n)</b> に保たれる 2 分探索木のこと。AVL 木、赤黒木（二色木）、スプレー木などがある。講義では <b>AVL 木</b>を詳しくやる。
R: AVL 木の規則は？
S: 2 分探索木の規則に加えて、<b>各節点で左部分木と右部分木の高さの差が −1 以上 1 以下</b>。
R: 高さの差の符号は？
S: <b>左 − 右</b>。左が高ければ正、右が高ければ負。空の部分木の高さは −1 として数える。`),
        avlCheckLab(),
        talk(`R: 「AVL 木でない例」は節点 0 じゃなくて節点 1 が赤くなってる。
S: 規則は<b>すべての節点</b>で見るからね。根だけバランスが取れていてもダメ。
R: 10 20 24 は根の差が −2 で NG。20 10 24 15 12 は全部 OK。`),
        point('AVL 木 ＝ 2 分探索木 ＋ <b>すべての節点で |左の高さ − 右の高さ| ≤ 1</b>。差は「左 − 右」（右が高いと負）。'),
      ),
    },
    {
      id: 'rotate', k: 'ALGORITHM', title: '部分木の回転',
      build: (el) => el.append(
        talk(`S: AVL 木に INSERT や DELETE をすると、場所によっては規則が崩れる。そうしたら<b>部分木の回転</b>で組み替える。
S: 崩れ方は 4 つ。差が +2 になった節点の<b>左の子の左</b>が重いのが <b>LL</b>、<b>左の子の右</b>が <b>LR</b>。差が −2 で<b>右の子の右</b>が <b>RR</b>、<b>右の子の左</b>が <b>RL</b>。
R: 回し方は？
S: LL は<b>右回転</b> 1 回、RR は<b>左回転</b> 1 回。LR は子で左回転してから右回転、RL は子で右回転してから左回転の 2 回。`),
        rotateLab(),
        talk(`R: どのパターンでも最後は<b>真ん中の値 b が根</b>になってる。
S: そこがポイント。回転しても<b>中順は変わらない</b>から、2 分探索木の規則は壊れない。一般の場合も、部分木 α, β, γ, δ を付け替えるだけで同じ形になる。`),
        point('4 パターン：<b>LL → 右回転</b>、<b>RR → 左回転</b>、<b>LR → 左回転＋右回転</b>、<b>RL → 右回転＋左回転</b>。結果は真ん中の値が根。中順は不変。'),
      ),
    },
    {
      id: 'avl-insert', k: 'ALGORITHM', title: 'AVL 木への挿入',
      build: (el) => el.append(
        talk(`S: AVL 木の INSERT の手順。
S: ① 2 分探索木の手順で挿入。② i ← <b>挿入位置の親</b>。③ 節点 i で規則を確認。OK なら何もしない、NG なら<b>節点 i を根とする部分木を回転</b>。④ i ← i の親。⑤ 根まで ③④ を繰り返す。
R: <b>下から上に</b>チェックするんですね。
S: そう。しかも挿入の場合、1 回回転すれば部分木の高さが挿入前に戻るから、<b>実はそれより上は確認しなくていい</b>。計算量は O(h) + O(h) = <b>O(h)</b> で、h = O(log n)。`),
        avlLab(),
        talk(`S: 講義の例：10, 20 を入れて、24 を入れると根の 10 が −2 → <b>RR パターン</b>で左回転、20 が根に。15 を入れても OK。12 を入れると節点 0（10）が −2 で、右の子 15 の左に入ったから <b>RL パターン</b>。
R: 結果は根 20、左に 12（子 10, 15）、右に 24。親は <b>4 -1 1 4 1</b>！
S: <b>回転しても節点番号は変わらない</b>ことに注意。課題で親の番号を答えるときに大事。
R: 昇順 1〜15 を入れても、AVL 木だと高さ 3 で済むんだ。普通の 2 分探索木だと 14…。`),
        point('AVL の INSERT ＝ <b>普通に挿入 → 親から上へ高さの差を確認 → 最初の NG の節点で回転</b>。節点番号は回転しても不変。'),
      ),
    },
    {
      id: 'avl-height', k: 'COMPLEXITY', title: 'AVL 木の高さ O(log n)',
      build: (el) => el.append(
        talk(`R: AVL 木の高さが O(log n) になるのはなぜですか？
S: 高さ h の AVL 木の節点数 n の範囲 [n<sub>L</sub>(h), n<sub>U</sub>(h)] を考える。
S: <b>最大</b>は完全 2 分木のとき：n<sub>U</sub>(h) = 1 + 2 n<sub>U</sub>(h−1) から <b>n<sub>U</sub>(h) = 2<sup>h+1</sup> − 1</b>。
S: <b>最小</b>は葉以外の全節点で差が ±1 のとき：<b>n<sub>L</sub>(h) = 1 + n<sub>L</sub>(h−1) + n<sub>L</sub>(h−2)</b>。N(h) = n<sub>L</sub>(h) + 1 と置くとフィボナッチ数列の漸化式になる。`),
        formula('N(h) > 2N(h-2) > 4N(h-4) > \\cdots > 2^{h/2} N(0) = 2^{h/2+1} \\;\\Rightarrow\\; n_L(h) > 2^{h/2+1}-1'),
        boundLab(),
        formula('2^{h/2+1}-1 < n < 2^{h+1}-1 \\;\\Longrightarrow\\; \\log_2(n+1)-1 < h < 2\\log_2(n+1)-2'),
        talk(`R: 上限が 2 log₂(n+1) なので、<b>h = O(log₂ n)</b>！
S: だから AVL 木の MEMBER・INSERT・DELETE・MIN は全部 <b>O(log n)</b>。実用では<b>赤黒木</b>もよく使われるよ（C++ の std::map など）。`),
        h('div.reveal', table(['', '2 分探索木', 'AVL 木'], [['高さ h（最悪）', 'n − 1', '&lt; 2 log₂(n+1) − 2'], ['MEMBER / INSERT / DELETE / MIN', 'O(h) = 最悪 O(n)', '<b>O(log n)</b>']])),
        point('高さ h の AVL 木の節点数は <b>2<sup>h/2+1</sup> − 1 &lt; n &lt; 2<sup>h+1</sup> − 1</b>。よって <b>h = O(log₂ n)</b>、各操作 O(log n)。'),
      ),
    },
  ],
  quiz: [
    { kind: 'choice', tag: '規則', q: '2 分探索木の規則として正しいものは？', opts: ['左部分木の要素はすべて x_i より小さく、右部分木の要素はすべて x_i より大きい', '親の要素は子の要素以下', '左の子は右の子より大きい', '深さ h − 1 までは完全 2 分木'], answer: 0, explain: '2 は（最小）ヒープの条件 2、4 はヒープの条件 1。' },
    { kind: 'multi', tag: '性質', q: '2 分探索木について正しいものをすべて選べ。', opts: ['最小要素を持つ節点の子の数は高々 1 つ', 'INSERT で追加される節点は必ず葉', 'DELETE で削除される節点は必ず葉', '2 つの子を持つ節点では、右の子の要素は左の子の要素より小さい'], answer: [0, 1], explain: '最小の節点は左の子を持たない。DELETE で子を持つ節点を消すこともある。右の子は左の子より大きい。' },
    { kind: 'input', tag: 'INSERT', q: '空の 2 分探索木に 50, 30, 70, 20, 40 を挿入。節点 0〜4 の親の番号を空白区切りで（根は -1）。', answer: '-1 0 0 1 1', explain: '30, 70 は根の左右。20, 40 は 30（節点 1）の左右。LAB 7-2 で確認。' },
    { kind: 'input', tag: '中順', q: '前問の木を中順でたどった結果は？（空白区切り）', answer: '20 30 40 50 70', explain: '2 分探索木の中順は必ず昇順。' },
    { kind: 'input', tag: 'DELETE', q: '10, 20, 24, 15, 12 を挿入した木から DELETE(20)。節点 0, 1, 3, 4 の親の番号は？（空白区切り）', answer: '-1 0 1 3', explain: '子が 2 つなので右部分木の最小（節点 2 の 24）を節点 1 に入れて節点 2 を削除。' },
    { kind: 'input', tag: '高さ', q: '1〜7 を小さい順に 2 分探索木へ挿入したときの高さは？', answer: '6', explain: '一直線になり h = n − 1 = 6。' },
    { kind: 'input', tag: '高さ', q: '1〜7 を挿入したときの高さの最小値は？', answer: '2', explain: '4 2 6 1 3 5 7 の順など。⌊log₂ 7⌋ = 2。' },
    { kind: 'choice', tag: '回転', q: '空の AVL 木に 30, 10, 20 の順に挿入した。必要な回転は？', opts: ['LR パターン：左回転 → 右回転', 'LL パターン：右回転', 'RL パターン：右回転 → 左回転', 'RR パターン：左回転'], answer: 0, explain: '根の左の子（10）の右に 20 が入る → LR。節点 10 で左回転してから根で右回転。LAB 7-5。' },
    { kind: 'input', tag: 'AVL', q: '空の AVL 木に 10, 20, 24, 15, 12 を挿入。節点 0〜4 の親の番号は？', answer: '4 -1 1 4 1', explain: '24 で RR（20 が根）、12 で RL。根 20、左 12（子 10, 15）、右 24。' },
    { kind: 'input', tag: 'AVL高さ', q: '高さ 3 の AVL 木の節点数の最小値は？', answer: '7', explain: 'n_L(0)=1, n_L(1)=2, n_L(2)=1+2+1=4, n_L(3)=1+4+2=7。LAB 7-7。' },
  ],
}
