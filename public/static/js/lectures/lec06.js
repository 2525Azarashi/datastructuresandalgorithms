import { h, s, svgRoot, lab, Player, stat, callout, card, cols, formula, table, seg, parseNums, range, toast, talk, point } from '../lib/ui.js'

/* ---------------------------------------------------------
   第6回  順序付き集合(1): 優先度付き待ち行列・ヒープ
   --------------------------------------------------------- */

const par = (i) => Math.floor((i - 1) / 2)
const depthOf = (i) => Math.floor(Math.log2(i + 1))

/** 完全二分木（配列 index）を SVG で描く。cls(i) → クラス, edgeCls(i) → 親との辺のクラス */
function heapTree(a, { cls = () => '', edgeCls = () => '', W = 560, r = 18, dy = 62, showIdx = true, minLevels = 1 } = {}) {
  const n = a.length
  const levels = Math.max(minLevels, n ? depthOf(n - 1) + 1 : 1)
  const H = (levels - 1) * dy + 2 * (r + 16)
  const pos = (i) => { const d = depthOf(i), k = i - (2 ** d - 1); return { x: ((k + 0.5) / 2 ** d) * W, y: r + 14 + d * dy } }
  const svg = svgRoot(W, H, { class: 'heap-svg', role: 'img', 'aria-label': 'ヒープ（二分木）' })
  for (let i = 1; i < n; i++) { const A = pos(par(i)), B = pos(i); svg.append(s('line', { x1: A.x, y1: A.y, x2: B.x, y2: B.y, class: 'edge ' + (edgeCls(i) || '') })) }
  for (let i = 0; i < n; i++) {
    const p = pos(i)
    svg.append(s('g', { class: 'node ' + (cls(i) || ''), transform: `translate(${p.x},${p.y})` }, s('circle', { r }), s('text', { text: a[i] }), showIdx ? s('text', { class: 'hidx', y: r + 11, text: i }) : null))
  }
  return svg
}
/** 配列の行 */
function heapArr(a, L, cls = () => '') {
  return h('div.harr', range(L).map((i) => h('div.hc', { class: (i >= a.length ? 'empty ' : '') + (cls(i) || '') }, h('i', i), h('b', i < a.length ? String(a[i]) : ''))))
}

/* ========== LAB 6-1: 待ち行列 vs 優先度付き待ち行列 ========== */
function pqLab() {
  let items = [3, 1, 3, 2, 5], log = []
  const qBox = h('div.pq-row'), pBox = h('div.pq-row'), out = h('div.narr'), inp = h('input.num', { type: 'number', value: 4, 'aria-label': '挿入する値' })
  const draw = (gone) => {
    const mi = items.length ? items.indexOf(Math.min(...items)) : -1
    qBox.innerHTML = ''; pBox.innerHTML = ''
    qBox.append(h('span.pq-end', '最後尾'), ...items.map((v, i) => h('span.pq-el', { class: i === items.length - 1 ? 'next' : '' }, v)), h('span.pq-end', '先頭'))
    pBox.append(...items.map((v, i) => h('span.pq-el', { class: i === mi ? 'min' : '' }, v)))
    if (!items.length) { qBox.appendChild(h('span.chip.empty', '空')); pBox.appendChild(h('span.chip.empty', '空')) }
    out.innerHTML = log.length ? log.slice(-3).join('<br>') : '同じ集合 {3, 1, 3, 2, 5} でも、取り出す要素が違う。ボタンで比べてみよう。'
  }
  const deq = () => { if (!items.length) return toast('空です', 'warn'); const v = items.pop(); log.push(`DEQUEUE → <b>${v}</b>（いちばん<b>先に入れた</b>もの）`); draw() }
  const delmin = () => { if (!items.length) return toast('空です', 'warn'); const m = Math.min(...items); items.splice(items.indexOf(m), 1); log.push(`DELETEMIN → <b class="l">${m}</b>（いちばん<b>小さい</b>もの）`); draw() }
  const ins = () => { const v = +inp.value; if (!Number.isFinite(v)) return; items.unshift(v); log.push(`INSERT(${v}) → 最後尾（左端）に追加`); draw() }
  const sort = () => {
    if (!items.length) return
    const outv = []; const c = items.slice()
    while (c.length) { const m = Math.min(...c); c.splice(c.indexOf(m), 1); outv.push(m) }
    log.push(`DELETEMIN を空になるまで繰り返すと → <b class="l">${outv.join(', ')}</b>（小さい順！ = ヒープソート）`); draw()
  }
  const root = lab({
    title: 'LAB 6-1 — 待ち行列と優先度付き待ち行列', hint: '取り出すものが違う',
    body: h('div',
      h('div.ctrl-row', h('div.field', h('label', 'x ='), inp), h('button.op', { onclick: ins }, 'INSERT(x)'), h('button.op', { onclick: deq }, 'DEQUEUE'), h('button.op', { onclick: delmin }, 'DELETEMIN'), h('button.op.ghost', { onclick: sort }, '全部 DELETEMIN'), h('button.op.ghost', { onclick: () => { items = [3, 1, 3, 2, 5]; log = []; draw() } }, 'リセット')),
      h('div.sep'),
      h('div.lab-grid.even',
        h('div', h('div.arr-name', '待ち行列（先入れ先出し）— 次に出るのはオレンジ'), qBox),
        h('div', h('div.arr-name', '優先度付き待ち行列 — 次に出るのはミント（最小）'), pBox)),
      h('div', { style: { marginTop: '12px' } }, out)),
  })
  draw()
  return root
}

/* ========== LAB 6-2: 実現方法の比較（配列リスト / 連結リスト / ヒープ） ========== */
function implLab() {
  const sl = h('input', { type: 'range', min: 1, max: 20, value: 10, 'aria-label': 'log2 n' })
  const chart = h('div.stage', { style: { padding: '10px' } }), sts = h('div.stats'), narr = h('div.narr')
  const draw = () => {
    const k = +sl.value, n = 2 ** k
    const W = 520, H = 220, P = { l: 40, r: 120, t: 14, b: 30 }
    const X = (t) => P.l + (t / 20) * (W - P.l - P.r)
    const ymax = 2 ** 20, Y = (v) => H - P.b - (Math.log2(Math.max(1, v)) / 20) * (H - P.t - P.b)
    const svg = svgRoot(W, H, { class: 'achart', role: 'img', 'aria-label': 'INSERT の操作回数' })
    for (let g = 0; g <= 20; g += 5) svg.append(s('line', { x1: P.l, x2: W - P.r, y1: Y(2 ** g), y2: Y(2 ** g), class: 'h-grid' }), s('text', { x: P.l - 6, y: Y(2 ** g) + 4, class: 'h-ax', 'text-anchor': 'end', text: `2^${g}` }), s('text', { x: X(g), y: H - P.b + 16, class: 'h-ax', 'text-anchor': 'middle', text: `2^${g}` }))
    svg.append(s('text', { x: W - P.r, y: H - 4, class: 'h-ax', 'text-anchor': 'end', text: 'n = |A|' }))
    let dl = '', dh = ''
    for (let t = 0; t <= 20; t += 0.25) { dl += `${dl ? 'L' : 'M'}${X(t)},${Y(2 ** t)}`; dh += `${dh ? 'L' : 'M'}${X(t)},${Y(Math.max(1, Math.floor(t)))}` }
    svg.append(s('path', { d: dl, class: 'ic-lin' }), s('path', { d: dh, class: 'ic-log' }),
      s('text', { x: X(20) + 6, y: Y(ymax) + 4, class: 'h-ax lin', text: '配列・連結 O(n)' }), s('text', { x: X(20) + 6, y: Y(20) + 4, class: 'h-ax log', text: 'ヒープ O(log n)' }),
      s('line', { x1: X(k), x2: X(k), y1: P.t, y2: H - P.b, class: 'a-cur' }), s('circle', { cx: X(k), cy: Y(n), r: 6, class: 'a-pt lin' }), s('circle', { cx: X(k), cy: Y(Math.max(1, k)), r: 6, class: 'a-pt ideal' }))
    chart.innerHTML = ''; chart.appendChild(svg)
    sts.innerHTML = ''
    sts.append(stat('要素数 n', n.toLocaleString(), 'cy'), stat('配列リスト / 連結リスト<br>INSERT（最悪）', `${n.toLocaleString()}<small>回</small>`, 'hl'), stat('ヒープ INSERT（最悪）', `${k}<small>回 = 高さ</small>`, 'li'))
    narr.innerHTML = `n = 2<sup>${k}</sup> = ${n.toLocaleString()} 個のとき、整列したリストへの挿入は最悪 ${n.toLocaleString()} 回ずらす／たどる。ヒープなら木の高さ <b>${k}</b> 回の入れ替えで済む。${k >= 20 ? '<b>約 5 万倍</b>の差！' : ''}`
  }
  sl.addEventListener('input', draw)
  const root = lab({
    title: 'LAB 6-2 — INSERT の速さ比べ', hint: 'スライダーで n を変える',
    body: h('div',
      h('div.ctrl-row', h('div.field', h('label', 'n = 2^'), sl)),
      h('div.sep'),
      h('div.lab-grid.wide-left', chart, h('div', { style: { display: 'grid', gap: '10px', alignContent: 'start' } }, sts, narr))),
  })
  draw()
  return root
}

/* ========== LAB 6-3: ヒープ条件チェッカー ========== */
function checkLab() {
  const inp = h('input.txt', { value: '2 7 4 9 7 4 12 10 13 11', 'aria-label': '配列 a', style: { width: '320px' } })
  const stage = h('div.stage', { style: { display: 'grid', placeItems: 'center', padding: '8px' } }), arrBox = h('div.hash-wrap'), narr = h('div.narr'), verdict = h('div.verdict')
  const draw = () => {
    const a = parseNums(inp.value).slice(0, 31)
    const bad = new Set(range(a.length).filter((i) => i > 0 && a[i] < a[par(i)]))
    stage.innerHTML = ''
    stage.appendChild(heapTree(a, { cls: (i) => (bad.has(i) ? 'bad' : bad.has(2 * i + 1) || bad.has(2 * i + 2) ? 'sel' : i === 0 ? 'ok' : ''), edgeCls: (i) => (bad.has(i) ? 'bad' : '') }))
    arrBox.innerHTML = ''; arrBox.appendChild(heapArr(a, a.length, (i) => (bad.has(i) ? 'bad' : '')))
    verdict.className = 'verdict ' + (bad.size ? 'ng' : 'ok')
    verdict.innerHTML = bad.size ? '✗ ヒープではない' : '✓ ヒープの条件を満たす'
    narr.innerHTML = !a.length ? '数を入力してね。'
      : bad.size ? [...bad].map((i) => `節点 ${i}（<b class="r">${a[i]}</b>）が親の節点 ${par(i)}（${a[par(i)]}）より小さい → <b>条件 2 違反</b>`).join('<br>')
        : `どの節点も親以上（条件 2 OK）。配列に左から詰めて並べているので<b>条件 1 は自動的に満たされる</b>。根 a[0] = <b class="l">${a[0]}</b> が最小。`
  }
  inp.addEventListener('input', draw)
  const preset = (v) => () => { inp.value = v; draw() }
  const root = lab({
    title: 'LAB 6-3 — ヒープ条件チェッカー', hint: '配列を入れると木になる',
    body: h('div',
      h('div.ctrl-row', h('div.field', h('label', 'a ='), inp),
        h('button.op.ghost', { onclick: preset('2 7 4 9 7 4 12 10 13 11') }, '講義の例'),
        h('button.op.ghost', { onclick: preset('1 2 3 4 5 6 7 8 9 10') }, '昇順の配列'),
        h('button.op.ghost', { onclick: preset('1 3 2 7 6 5 4') }, '左＞右の例')),
      h('div.sep'),
      h('div.lab-grid.wide-left', stage, h('div', { style: { display: 'grid', gap: '10px', alignContent: 'start' } }, verdict, narr)),
      h('div.arr-name', '配列 a（節点 i の子は 2i+1, 2i+2、親は ⌊(i−1)/2⌋）'), arrBox),
  })
  draw()
  return root
}

/* ========== LAB 6-4: ヒープの INSERT / DELETEMIN ステッパ ========== */
function heapLab() {
  const L = 15
  let A = [], total = 0
  const seqIn = h('input.txt', { value: '7 2 13 5', 'aria-label': '挿入列', style: { width: '220px' } })
  const xIn = h('input.num', { type: 'number', value: 4, 'aria-label': '挿入する値' })
  const stage = h('div.stage', { style: { display: 'grid', placeItems: 'center', padding: '8px', minHeight: '250px' } }), arrBox = h('div.hash-wrap'), narr = h('div.narr'), sts = h('div.stats'), hist = h('div.log', { style: { maxHeight: '150px' } })
  const root = h('div')
  const render = (f) => {
    stage.innerHTML = ''
    stage.appendChild(heapTree(f.a, { cls: (i) => f.hl?.[i] || '', edgeCls: (i) => (f.edge === i ? 'on' : ''), minLevels: 4 }))
    arrBox.innerHTML = ''; arrBox.appendChild(heapArr(f.a, L, (i) => ({ cur: 'cur', sel: 'cur', ok: 'ok', bad: 'col', vis: 'vis' })[f.hl?.[i]] || ''))
    sts.innerHTML = ''
    sts.append(stat('要素数 n', String(f.a.length), 'cy'), stat('高さ h', f.a.length ? String(depthOf(f.a.length - 1)) : '—'), stat('今回の入替', String(f.sw), 'hl'), stat('入替の合計', String(f.tot), 'li'))
    narr.innerHTML = f.msg
  }
  const player = new Player({ interval: 850, keyTarget: root, render })
  const fr = (a, hl, msg, sw, tot, edge) => ({ a: a.slice(), hl, msg, sw, tot, edge })
  const insertFrames = (x, F) => {
    if (A.length >= L) { F.push(fr(A, {}, `配列が一杯（L = ${L}）`, 0, total)); return }
    let sw = 0
    A.push(x); let i = A.length - 1
    F.push(fr(A, { [i]: 'cur' }, `INSERT(${x}): ① a[n] = a[${i}] に ${x} を入れ、n ← ${A.length}`, sw, total))
    while (i > 0) {
      const p = par(i)
      F.push(fr(A, { [i]: 'cur', [p]: 'sel' }, `子 a[${i}] = ${A[i]} と親 a[${p}] = ${A[p]}（⌊(${i}−1)/2⌋ = ${p}）を比べる`, sw, total, i))
      if (A[i] < A[p]) {
        ;[A[i], A[p]] = [A[p], A[i]]; sw++; total++
        F.push(fr(A, { [p]: 'cur', [i]: 'vis' }, `${A[p]} < ${A[i]} → 条件 2 不成立 → <b>入れ替え</b>（${sw} 回目）`, sw, total, i))
        i = p
      } else { F.push(fr(A, { [i]: 'ok', [p]: 'ok' }, `${A[i]} ≥ ${A[p]} → 条件 2 成立 → <b class="l">挿入終了</b>（入替 ${sw} 回）`, sw, total)); return sw }
    }
    F.push(fr(A, { 0: 'ok' }, `根まで到達 → <b class="l">挿入終了</b>（入替 ${sw} 回）`, sw, total))
    return sw
  }
  const delFrames = (F) => {
    if (!A.length) { F.push(fr(A, {}, 'ヒープが空です', 0, total)); return }
    let sw = 0
    const m = A[0]
    F.push(fr(A, { 0: 'ok' }, `DELETEMIN: ① 最小要素 a[0] = <b class="l">${m}</b> を取り出す`, sw, total))
    const last = A.pop()
    if (!A.length) { F.push(fr(A, {}, `空になった。返り値 ${m}`, sw, total)); return }
    A[0] = last
    F.push(fr(A, { 0: 'cur' }, `② 最後の要素 a[n] = ${last} を a[0] に移動（n ← ${A.length}）`, sw, total))
    let i = 0
    while (2 * i + 1 < A.length) {
      const l = 2 * i + 1, r = 2 * i + 2
      const c = r < A.length && A[r] < A[l] ? r : l
      F.push(fr(A, { [i]: 'cur', [l]: 'sel', ...(r < A.length ? { [r]: 'sel' } : {}) }, `親 a[${i}] = ${A[i]} と子 a[${l}] = ${A[l]}${r < A.length ? `, a[${r}] = ${A[r]}` : ''} を比べる（小さい方は ${A[c]}）`, sw, total))
      if (A[c] < A[i]) {
        ;[A[i], A[c]] = [A[c], A[i]]; sw++; total++
        F.push(fr(A, { [c]: 'cur', [i]: 'vis' }, `${A[i]} < ${A[c]} → 条件 2 不成立 → 小さい方の子と<b>入れ替え</b>（${sw} 回目）`, sw, total, c))
        i = c
      } else { F.push(fr(A, { [i]: 'ok' }, `子はどちらも ${A[i]} 以上 → 条件 2 成立 → <b class="l">取出終了</b>（入替 ${sw} 回）。返り値 ${m}`, sw, total)); return sw }
    }
    F.push(fr(A, { [i]: 'ok' }, `葉に到達 → <b class="l">取出終了</b>（入替 ${sw} 回）。返り値 ${m}`, sw, total))
    return sw
  }
  const logLine = (t) => { hist.innerHTML += `<div>${t}</div>`; hist.scrollTop = 1e9 }
  const build = () => {
    A = []; total = 0; hist.innerHTML = ''
    const F = [fr(A, {}, '空のヒープから始める（長さ 15 の配列）。', 0, 0)]
    parseNums(seqIn.value).forEach((x) => { const sw = insertFrames(x, F); logLine(`INSERT(${x}) — 入替 ${sw ?? 0} 回 → [${A.join(' ')}]`) })
    F.push(fr(A, {}, `挿入列の処理が完了。入替の合計 <b>${total}</b> 回。下のボタンで続きの操作をしてみよう。`, 0, total))
    player.load(F, F.length - 1)
  }
  const doIns = () => { const x = +xIn.value; if (!Number.isFinite(x)) return; const F = [fr(A, {}, `INSERT(${x}) を実行する`, 0, total)]; const sw = insertFrames(x, F); logLine(`INSERT(${x}) — 入替 ${sw ?? 0} 回 → [${A.join(' ')}]`); player.load(F); player.play() }
  const doDel = () => { const F = [fr(A, {}, 'DELETEMIN を実行する', 0, total)]; const sw = delFrames(F); logLine(`DELETEMIN — 入替 ${sw ?? 0} 回 → [${A.join(' ')}]`); player.load(F); player.play() }
  seqIn.addEventListener('change', build)
  root.append(lab({
    title: 'LAB 6-4 — ヒープの INSERT と DELETEMIN', hint: '木と配列が同時に動く',
    body: h('div',
      h('div.ctrl-row', h('div.field', h('label', '挿入列'), seqIn), h('button.op', { onclick: build }, '空から挿入'),
        h('button.op.ghost', { onclick: () => { seqIn.value = '7 2 13 5'; build() } }, '講義の数値例')),
      h('div.ctrl-row', h('div.field', h('label', 'x ='), xIn), h('button.op', { onclick: doIns }, 'INSERT(x)'), h('button.op', { onclick: doDel }, 'DELETEMIN')),
      h('div.sep'),
      h('div.lab-grid.wide-left', stage, h('div', { style: { display: 'grid', gap: '10px', alignContent: 'start' } }, sts, narr)),
      h('div.arr-name', '配列 a（長さ L = 15）'), arrBox,
      h('div.arr-name', '操作の記録'), hist),
    foot: player.el }))
  build()
  return root
}

/* ========== LAB 6-5: 要素数と高さ ========== */
function heightLab() {
  const nIn = h('input.num', { type: 'number', value: 10, min: 1, max: 100000000, 'aria-label': '要素数 n', style: { width: '130px' } })
  const hIn = h('input.num', { type: 'number', value: 3, min: 0, max: 30, 'aria-label': '高さ h' })
  const stage = h('div.stage', { style: { display: 'grid', placeItems: 'center', padding: '8px' } }), outN = h('div.narr'), outH = h('div.narr'), sts = h('div.stats')
  const draw = () => {
    const n = Math.max(1, Math.floor(+nIn.value || 1)), hh = Math.floor(Math.log2(n))
    const show = Math.min(n, 31)
    stage.innerHTML = ''
    stage.appendChild(heapTree(range(show).map((i) => i), { cls: (i) => (depthOf(i) === hh ? 'cur' : ''), showIdx: false, r: 13, dy: 46, W: 520 }))
    outN.innerHTML = `n = <b>${n.toLocaleString()}</b> → 2<sup>${hh}</sup> = ${(2 ** hh).toLocaleString()} ≤ n < 2<sup>${hh + 1}</sup> = ${(2 ** (hh + 1)).toLocaleString()} → 高さ <b class="l">h = ⌊log₂ n⌋ = ${hh}</b>${n > 31 ? '（図は最初の 31 個だけ）' : ''}`
    const H = Math.max(0, Math.floor(+hIn.value || 0))
    outH.innerHTML = `高さ h = <b>${H}</b> のヒープ：最小は深さ h に葉が 1 個だけ → <b class="l">2<sup>${H}</sup> = ${(2 ** H).toLocaleString()}</b> 個、最大は深さ h が満杯 → <b class="l">2<sup>${H + 1}</sup> − 1 = ${(2 ** (H + 1) - 1).toLocaleString()}</b> 個`
    sts.innerHTML = ''
    sts.append(stat('log₂ n', Math.log2(n).toFixed(3), 'cy'), stat('高さ h = ⌊log₂ n⌋', String(hh), 'hl'), stat('INSERT 最大入替', `${hh}<small>回</small>`, 'li'))
  }
  nIn.addEventListener('input', draw); hIn.addEventListener('input', draw)
  const root = lab({
    title: 'LAB 6-5 — 要素数 n と高さ h', hint: '2^h ≤ n < 2^(h+1)',
    body: h('div',
      h('div.ctrl-row', h('div.field', h('label', 'n ='), nIn), ...[1, 2, 4, 7, 8, 15, 16].map((v) => h('button.op.ghost', { onclick: () => { nIn.value = v; draw() } }, String(v)))),
      h('div.sep'),
      h('div.lab-grid.wide-left', stage, h('div', { style: { display: 'grid', gap: '10px', alignContent: 'start' } }, sts, outN)),
      h('div.sep'),
      h('div.ctrl-row', h('div.field', h('label', '逆に h ='), hIn)), h('div', { style: { marginTop: '10px' } }, outH)),
  })
  draw()
  return root
}

/* ========== LAB 6-6: ヒープソート ========== */
function sortLab() {
  const inp = h('input.txt', { value: '3 1 3 2 5 9 4 7', 'aria-label': '整列する数', style: { width: '220px' } })
  const stage = h('div.stage', { style: { display: 'grid', placeItems: 'center', padding: '8px', minHeight: '200px' } }), outBox = h('div.chips'), narr = h('div.narr')
  const root = h('div')
  const render = (f) => {
    stage.innerHTML = ''; stage.appendChild(heapTree(f.a, { cls: (i) => (i === 0 && f.phase === 'out' ? 'ok' : f.cur === i ? 'cur' : ''), showIdx: false, minLevels: 3 }))
    outBox.innerHTML = ''
    f.out.length ? f.out.forEach((v, k) => outBox.appendChild(h('span.chip.li', { style: { animationDelay: '0s' }, class: k === f.out.length - 1 && f.phase === 'pop' ? 'chip li new' : 'chip li' }, v))) : outBox.appendChild(h('span.chip.empty', 'まだ出力なし'))
    narr.innerHTML = f.msg
  }
  const player = new Player({ interval: 700, keyTarget: root, render })
  const build = () => {
    const xs = parseNums(inp.value).slice(0, 15)
    const a = [], out = [], F = []
    const snap = (msg, extra = {}) => F.push({ a: a.slice(), out: out.slice(), msg, ...extra })
    snap('まず全部をヒープに INSERT する。')
    xs.forEach((x) => { a.push(x); let i = a.length - 1; while (i > 0 && a[i] < a[par(i)]) { [a[i], a[par(i)]] = [a[par(i)], a[i]]; i = par(i) } snap(`INSERT(${x})`, { cur: i }) })
    snap('次に、空になるまで DELETEMIN を繰り返す。根（ミント）がいつも最小。', { phase: 'out' })
    while (a.length) {
      const m = a[0]; const last = a.pop()
      if (a.length) { a[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; if (l >= a.length) break; const c = r < a.length && a[r] < a[l] ? r : l; if (a[c] < a[i]) { [a[c], a[i]] = [a[i], a[c]]; i = c } else break } }
      out.push(m)
      snap(`DELETEMIN → <b class="l">${m}</b> を出力`, { phase: 'pop' })
    }
    snap(`完成！ 出力は<b>小さい順</b>：${out.join(' ≤ ')}。各操作が O(log n) なので全体で <b>O(n log n)</b>。`)
    player.load(F)
  }
  inp.addEventListener('change', build)
  root.append(lab({
    title: 'LAB 6-6 — ヒープソート', hint: 'INSERT して DELETEMIN を繰り返すだけ',
    body: h('div',
      h('div.ctrl-row', h('div.field', h('label', 'A ='), inp), h('button.op', { onclick: build }, '準備')),
      h('div.sep'),
      h('div.lab-grid.wide-left', stage, h('div', { style: { display: 'grid', gap: '10px', alignContent: 'start' } }, h('div.arr-name', '出力（DELETEMIN の返り値）'), outBox, narr))),
    foot: player.el }))
  build()
  return root
}

export default {
  n: 6,
  title: '優先度付き待ち行列とヒープ',
  sub: '順序付き集合 (1) — 最小を素早く取り出すデータ構造',
  en: 'Priority Queue & Heap',
  tags: ['順序付き多重集合', '優先度付き待ち行列', 'ヒープ', 'O(log n)', 'ヒープソート'],
  mini: '<svg viewBox="0 0 120 60"><g stroke="#3d2e54" stroke-width="1.5"><path d="M60 12 36 32M60 12 84 32M36 32 24 50M36 32 48 50M84 32 72 50" fill="none" stroke-opacity=".5"/><circle cx="60" cy="12" r="7" fill="#2fbf71"/><circle cx="36" cy="32" r="6" fill="#fff"/><circle cx="84" cy="32" r="6" fill="#fff"/><circle cx="24" cy="50" r="5" fill="#fff"/><circle cx="48" cy="50" r="5" fill="#fff"/><circle cx="72" cy="50" r="5" fill="#ff8a3d"/></g></svg>',
  goals: [
    '順序付き多重集合と、MIN・DELETEMIN の意味を説明できる',
    '優先度付き待ち行列と、その使用例（ヒープソート・プロセスの優先処理）を説明できる',
    'ヒープの 2 つの条件と、配列による実現（子 2i+1, 2i+2）を説明できる',
    'ヒープの INSERT・DELETEMIN の動作と、時間計算量 O(log n) を説明できる',
  ],
  chapters: [
    {
      id: 'ordered', k: 'STRUCTURE', title: '順序付き多重集合と優先度付き待ち行列',
      build: (el) => el.append(
        talk(`S: 今回から「<b>順序付き集合</b>」シリーズ。まずは<b>順序付き多重集合</b>。
R: 多重集合って？
S: 前回の集合は重複なしだったけど、<b>多重集合は同じ要素を複数含んでもいい</b>。{3, 1, 3, 2, 5} みたいに 3 が 2 個あってもOK。
R: 「順序付き」は？
S: <b>任意の 2 つの要素で大小比較ができる</b>こと。数の 13 < 15、文字列の 'apple' < 'orange'（辞書順）、なんなら「友人を仲の良さで比べる」でもいい。
R[think]: 数値になってなくてもいいんですか？
S: そう、<b>比べられさえすれば定量化されている必要はない</b>。`),
        cols(2,
          card('MIN(A)', 'A ≠ ∅ のとき、A の<strong>最小要素を返す</strong>。例：MIN({3,1,3,2,5}) = 1', 'PEEK'),
          card('DELETEMIN(A)', 'A ≠ ∅ のとき、最小要素を<strong>削除して返す</strong>。最小が複数あればそのうちの 1 つ。', 'POP MIN')),
        talk(`S: そして<b>優先度付き待ち行列</b>は、<b>INSERT と DELETEMIN だけ</b>に着目した順序付き多重集合。
R: 普通の待ち行列と何が違うんですか？
S: 普通の待ち行列は「先に入れたもの」が出る（FIFO）。優先度付きは「<b>いちばん小さいもの</b>」が出る。下で比べてみて。`),
        pqLab(),
        talk(`R: 何に使うんですか？
S: 例えば <b>OS のプロセス管理</b>。各プロセスに優先度（小さいほど先）を付けて、優先度付き待ち行列で管理すれば、次に実行すべきものが DELETEMIN で一発。
S: それと<b>ヒープソート</b>。全部入れて空になるまで DELETEMIN を繰り返すと、<b>小さい順</b>に出てくる。ラボの「全部 DELETEMIN」がまさにそれ。
S: ちなみに最大要素を取り出す版もあって、そっちは<b>最大ヒープ</b>で実現する。`),
        point('順序付き多重集合 ＝ <b>重複OK＋大小比較できる</b>集合。優先度付き待ち行列 ＝ <b>INSERT と DELETEMIN だけ</b>を考えるもの。最小が出てくる。'),
      ),
    },
    {
      id: 'naive', k: 'IMPLEMENTATION', title: 'リストを使った素直な実現',
      build: (el) => el.append(
        talk(`R: 前回までのリストで作れないんですか？
S: 作れるよ。① <b>配列リスト</b>：要素を<b>大きい順</b>に並べておく。最小は末尾 a[n−1] にあるから DELETEMIN は末尾を消すだけで <b>O(1)</b>。
R: INSERT は？
S: a[j] ≤ x となる最小の j を探して、a[j] 〜 a[n−1] を 1 つ後ろにずらしてから入れる。ずらしが最悪 n 回で <b>O(|A|)</b>。
S: ② <b>連結リスト</b>：<b>小さい順</b>に並べる。最小は先頭だから DELETEMIN は <b>O(1)</b>。INSERT は y ≥ x となる最初のセルの前に入れるので、走査が <b>O(|A|)</b>。`),
        h('div.reveal', table(['', '配列リスト（大きい順）', '連結リスト（小さい順）', 'ヒープ'], [
          ['INSERT', 'O(|A|)', 'O(|A|)', '<b>O(log₂ |A|)</b>'],
          ['DELETEMIN', '<b>O(1)</b>', '<b>O(1)</b>', 'O(log₂ |A|)'],
        ])),
        talk(`R[oops]: INSERT が重い…。全部きれいに並べておくからですね。
S: そう。発想を変えて、「<b>最小だけ</b>すぐわかればよくて、残りは<b>ゆるく</b>並んでいればいい」と考えたのが<b>ヒープ</b>。両方 O(log n) にできる。`),
        implLab(),
        point('リストで素直に作ると <b>INSERT O(|A|)・DELETEMIN O(1)</b>。全部を整列させるのが重い。'),
      ),
    },
    {
      id: 'heap', k: 'STRUCTURE', title: 'ヒープ — 2 つの条件',
      build: (el) => el.append(
        talk(`S: ヒープ（最小ヒープ）は、次の 2 つの条件を満たす<b>二分木</b>。各節点に集合の要素を 1 つずつ入れる。`),
        cols(2,
          card('条件 1（形）', '高さを h とする。<strong>深さ h − 1 までは完全二分木</strong>（葉以外の全節点の子が 2 個）。<strong>深さ h の葉は左に詰める</strong>。', 'SHAPE'),
          card('条件 2（大小）', '節点 v の親を u とすると <strong>x<sub>v</sub> ≥ x<sub>u</sub></strong>。親は子以下。', 'ORDER')),
        talk(`R: 条件 2 から、根から葉に向かうほど大きくなるんですね。
S: だから<b>根に最小要素</b>がある。DELETEMIN は根を取り出すだけ。
R: 左の子は右の子より小さい、とかは？
S: <b>決まってない</b>。条件 2 は「親と子」の関係だけ。兄弟同士はどっちが大きくてもいい。ここ、課題で狙われるよ。`),
        talk(`S: ヒープは<b>配列で実現</b>できる。根を節点 0 にして、上の段から左→右へ番号を振る。
S: <b>節点 i の左の子 = 2i + 1、右の子 = 2i + 2、親 = ⌊(i − 1)/2⌋</b>。節点 i の要素を a[i] に入れて、要素数は n で覚える。
R: ポインタがいらない！ 条件 1 で左に詰めてあるから、配列に隙間ができないんですね。
S: その通り。下のラボに配列を入れると木になって、条件 2 の違反を赤で教えてくれる。`),
        checkLab(),
        talk(`R: 「昇順の配列」はヒープでした。
S: 小さい順に並んでいれば、親（番号が小さい）≤ 子（番号が大きい）になるから、<b>昇順の配列は必ず条件 2 を満たす</b>。でも逆に、ヒープの配列が昇順とは限らない。講義の例 2 7 4 9 … も昇順じゃないよね。
R: 最大要素はどこに？
S: 子がいたら子のほうが大きいから、最大要素は子を持たない節点、つまり<b>葉</b>にある。`),
        point('ヒープ ＝ <b>条件 1（左詰めのほぼ完全二分木）＋ 条件 2（親 ≤ 子）</b>。根が最小、最大は葉。兄弟の大小は決まらない。配列で <b>子 2i+1, 2i+2、親 ⌊(i−1)/2⌋</b>。'),
      ),
    },
    {
      id: 'ops', k: 'ALGORITHM', title: 'INSERT と DELETEMIN',
      build: (el) => el.append(
        talk(`S: <b>INSERT(x, A)</b> の手順。
S: ① a[n] に x を入れて n ← n + 1。（条件 1 を守るため、いちばん下の段の左詰めの位置に置く）
S: ② i ← n − 1。③ 子 i と親 ⌊(i − 1)/2⌋ を比べて、<b>a[子] < a[親]</b> なら入れ替え、成立していたら終了。④ i を親に移して、i = 0 まで繰り返す。
R: 小さい値が泡みたいに上がっていくんですね。`),
        talk(`S: <b>DELETEMIN(A)</b> の手順。
S: ① 最小の a[0] を取り出して n ← n − 1。② a[0] に<b>最後の要素</b> a[n] を移す。
S: ③ i ← 0。④ 親 i と子 2i+1, 2i+2 を比べて、どちらかの子のほうが小さければ、<b>小さい方の子</b>と入れ替える。⑤ i が葉になるまで繰り返す。
R: なんで小さい方の子なんですか？
S: 大きい方と入れ替えると、新しい親がもう一方の子より大きくなって条件 2 が壊れるから。`),
        heapLab(),
        talk(`R: 入れ替えの回数を数える問題がありそう。
S: ラボの「今回の入替」と「入替の合計」を見ればいい。比べたけど入れ替えなかった回は<b>数えない</b>ことに注意。
S: 講義の数値例（7, 2, 13, 5 を入れる → DELETEMIN → 4 → 3 → DELETEMIN）も、x と DELETEMIN のボタンで再現できるよ。`),
        point('INSERT ＝ <b>末尾に置いて親と比べながら上へ</b>。DELETEMIN ＝ <b>根を取り、末尾を根に移して、小さい方の子と比べながら下へ</b>。'),
      ),
    },
    {
      id: 'height', k: 'COMPLEXITY', title: '時間計算量 O(log n)',
      build: (el) => el.append(
        talk(`S: INSERT も DELETEMIN も、入れ替えは最大で木の高さ h 回。だから計算量は <b>O(h)</b>。
R: 高さは要素数 n とどういう関係？
S: 深さ h − 1 までは満杯（2<sup>h</sup> − 1 個）で、深さ h に 1 個以上 2<sup>h</sup> 個以下。だから`),
        formula('2^h \\le n < 2^{h+1} \\;\\Longrightarrow\\; \\log_2 n - 1 < h \\le \\log_2 n \\;\\Longrightarrow\\; h = \\lfloor \\log_2 n \\rfloor'),
        talk(`R: h = ⌊log₂ n⌋。だから <b>O(log₂ n)</b> なんですね。
S: n が 100 万でも高さはたった 19。
R: 逆に高さ h のヒープの要素数は？
S: 最小は深さ h に 1 個だけのとき 2<sup>h</sup>、最大は深さ h が満杯のとき 2<sup>h+1</sup> − 1。下で確かめよう。`),
        heightLab(),
        callout('tip', 'ちなみに', '<b>フィボナッチヒープ</b>を使うと、INSERT を平均的に O(1) にできる（講義では名前だけ）。'),
        point('高さ <b>h = ⌊log₂ n⌋</b>（2<sup>h</sup> ≤ n < 2<sup>h+1</sup>）。INSERT・DELETEMIN とも <b>O(log₂ n)</b>。高さ h の要素数は <b>2<sup>h</sup> 〜 2<sup>h+1</sup> − 1</b>。'),
      ),
    },
    {
      id: 'heapsort', k: 'APPLICATION', title: 'ヒープソート',
      build: (el) => el.append(
        talk(`S: 最後に応用。n 個を全部 INSERT して、空になるまで DELETEMIN すれば、小さい順に出てくる。これが<b>ヒープソート</b>。
R: INSERT が n 回、DELETEMIN が n 回、どっちも O(log n) だから…
S: 全体で <b>O(n log n)</b>。整列はまた後の回でじっくりやるよ。`),
        sortLab(),
        h('div.reveal', table(['', '配列リスト／連結リスト', 'ヒープ'], [
          ['INSERT', 'O(|A|)', '<b>O(log₂ |A|)</b>'],
          ['DELETEMIN', 'O(1)', 'O(log₂ |A|)'],
          ['n 個を入れて全部取り出す', 'O(n²)', '<b>O(n log n)</b>'],
        ])),
        point('INSERT と DELETEMIN が両方 O(log n) なので、<b>ヒープのほうが実用的</b>。ヒープソートは <b>O(n log n)</b>。'),
      ),
    },
  ],
  quiz: [
    { kind: 'choice', tag: '定義', q: '順序付き多重集合の説明として正しいものは？', opts: ['同じ要素を複数含んでよく、任意の 2 要素の大小比較ができる', '同じ要素を含まず、要素は必ず数値である', '要素は必ず小さい順に格納されている', '要素の大小比較ができなくてもよい'], answer: 0, explain: '多重集合（重複OK）＋順序（大小比較可能）。数値である必要はない。' },
    { kind: 'input', tag: '待ち行列', q: '空の優先度付き待ち行列に 5, 2, 8, 1 を INSERT したあと DELETEMIN を 2 回行った。2 回目に返る値は？', answer: '2', explain: '1 回目は 1、2 回目は 2。普通の待ち行列なら 5, 2 の順。' },
    { kind: 'choice', tag: '実現', q: '要素を大きい順に並べた配列リストで優先度付き待ち行列を実現したとき、INSERT と DELETEMIN の時間計算量は？', opts: ['O(|A|) と O(1)', 'O(1) と O(|A|)', 'O(log |A|) と O(log |A|)', 'O(1) と O(1)'], answer: 0, explain: '挿入位置以降をずらすので INSERT は O(|A|)。最小は末尾なので DELETEMIN は O(1)。' },
    { kind: 'input', tag: '配列', q: 'ヒープを配列で実現したとき、節点 6 の親の番号は？', answer: '2', explain: '⌊(6 − 1)/2⌋ = ⌊2.5⌋ = 2。節点 2 の子は 5 と 6。' },
    { kind: 'choice', tag: '条件', q: '配列 a = (3, 5, 4, 9, 6, 2) はヒープの条件を満たすか？', opts: ['満たす', '満たさない'], answer: 1, explain: 'a[5] = 2 の親は a[2] = 4。2 < 4 なので条件 2 違反。LAB 6-3 で確かめよう。' },
    { kind: 'multi', tag: '性質', q: 'ヒープについて正しいものをすべて選べ。', opts: ['根には最小要素がある', '左の子は右の子より必ず小さい', '最大要素は葉にある', '小さい順に並んだ配列はヒープになる'], answer: [0, 2, 3], explain: '兄弟の大小は決まっていない。それ以外は正しい。' },
    { kind: 'input', tag: 'INSERT', q: '空のヒープに 5, 3, 8, 1 を順に INSERT した後の配列を空白区切りで。', answer: '1 3 8 5', explain: '5 → [5]。3 → 5 と入替 → [3 5]。8 → [3 5 8]。1 → a[3]、親 a[1]=5 と入替、親 a[0]=3 と入替 → [1 3 8 5]。' },
    { kind: 'input', tag: 'DELETEMIN', q: '前問のヒープに DELETEMIN を 1 回行った後の配列は？', answer: '3 5 8', explain: '1 を取り出し、末尾の 5 を根へ → [5 3 8]。子 3, 8 の小さい方 3 と入替 → [3 5 8]。' },
    { kind: 'input', tag: '高さ', q: '要素数 n = 100 のヒープの高さ h は？', answer: '6', explain: '2⁶ = 64 ≤ 100 < 128 = 2⁷ なので h = ⌊log₂ 100⌋ = 6。' },
    { kind: 'input', tag: '高さ', q: '高さ h = 4 のヒープの要素数の最大値は？', answer: '31', explain: '深さ 0〜4 がすべて満杯：2⁵ − 1 = 31。最小値は 2⁴ = 16。' },
  ],
}
