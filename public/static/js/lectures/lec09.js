import { h, s, svgRoot, lab, Player, stat, callout, card, cols, formula, table, seg, parseNums, range, toast, talk, point } from '../lib/ui.js'

/* ---------------------------------------------------------
   第9回  整列のアルゴリズム(2): ヒープソート
   --------------------------------------------------------- */

const par = (i) => Math.floor((i - 1) / 2)
const depthOf = (i) => Math.floor(Math.log2(i + 1))

/**
 * 完全二分木（配列 a）を SVG で描く
 * - activeSize: ヒープに含まれている要素数（それ以降はソート済・確定要素として点線表示）
 * - subRoot: 部分木の根 i（破線の三角形ハイライトを描く：スライド 5, 9, 12, 13）
 */
function maxHeapTree(a, {
  cls = () => '',
  edgeCls = () => '',
  activeSize = a.length,
  subRoot = null,
  W = 560,
  r = 17,
  dy = 58,
  showIdx = true,
  minLevels = 1,
} = {}) {
  const n = a.length
  const levels = Math.max(minLevels, n ? depthOf(n - 1) + 1 : 1)
  const H = (levels - 1) * dy + 2 * (r + 16)
  const pos = (i) => {
    const d = depthOf(i), k = i - (2 ** d - 1)
    return { x: ((k + 0.5) / 2 ** d) * W, y: r + 14 + d * dy, d }
  }
  const svg = svgRoot(W, H, { class: 'heap-svg', role: 'img', 'aria-label': '最大ヒープ（二分木）' })

  // 節点 subRoot を根とする部分木の破線三角形（スライド 9 の表現）
  if (subRoot != null && subRoot >= 0 && subRoot < activeSize) {
    const rootP = pos(subRoot)
    let minX = rootP.x, maxX = rootP.x, maxY = rootP.y
    const stack = [subRoot]
    while (stack.length) {
      const u = stack.pop()
      const p = pos(u)
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y)
      const l = 2 * u + 1, rc = 2 * u + 2
      if (l < activeSize) stack.push(l)
      if (rc < activeSize) stack.push(rc)
    }
    const padX = r + 15, topY = rootP.y - r - 12, botY = maxY + r + (showIdx ? 16 : 8)
    const d = minX === maxX
      ? `M${rootP.x} ${topY} L${rootP.x - padX - 8} ${botY} L${rootP.x + padX + 8} ${botY} Z`
      : `M${rootP.x} ${topY} L${minX - padX} ${botY} L${maxX + padX} ${botY} Z`
    svg.appendChild(s('path', {
      d,
      fill: 'rgba(255, 210, 63, 0.16)',
      stroke: '#3d2e54',
      'stroke-width': 1.8,
      'stroke-dasharray': '5 4',
      'stroke-linejoin': 'round',
    }))
  }

  for (let i = 1; i < n; i++) {
    const A = pos(par(i)), B = pos(i)
    const out = i >= activeSize
    svg.appendChild(s('line', {
      x1: A.x, y1: A.y, x2: B.x, y2: B.y,
      class: 'edge ' + (out ? 'dim ' : '') + (edgeCls(i) || ''),
      'stroke-dasharray': out ? '4 4' : null,
    }))
  }
  for (let i = 0; i < n; i++) {
    const p = pos(i)
    const out = i >= activeSize
    const c = cls(i) || (out ? 'ok' : '')
    const g = s('g', { class: 'node ' + c, transform: `translate(${p.x},${p.y})` })
    const circ = s('circle', { r: n > 15 ? 14 : r })
    if (out && !cls(i)) circ.setAttribute('stroke-dasharray', '3 2')
    g.append(
      circ,
      s('text', { text: a[i], style: n > 15 ? 'font-size:11px' : null }),
      showIdx ? s('text', { class: 'hidx', y: (n > 15 ? 14 : r) + 11, text: i }) : null,
    )
    svg.appendChild(g)
  }
  return svg
}

/** 配列 a の行（ヒープ範囲と整列済範囲を色分け表示） */
function heapArr9(a, L, { cls = () => '', activeSize = a.length } = {}) {
  return h('div.harr', range(L).map((i) => {
    const inA = i < a.length
    const c = cls(i) || (inA && i >= activeSize ? 'ok' : '')
    return h('div.hc', {
      class: (!inA ? 'empty ' : '') + c,
      style: inA && i === activeSize - 1 && activeSize < a.length ? { marginRight: '6px' } : null,
    }, h('i', i), h('b', inA ? String(a[i]) : ''))
  }))
}

/* ========== LAB 9-1: 最大ヒープの INSERT / DELETEMAX / DOWNMAX(k, A)（スライド 3〜5） ========== */
function maxHeapOpsLab() {
  const L = 15
  const SLIDE_INIT = [77, 73, 48, 49, 27, 42, 32, 26, 13, 11]
  let A = SLIDE_INIT.slice()
  const xIn = h('input.num', { type: 'number', value: 75, 'aria-label': '挿入する値 x' })
  const kIn = h('input.num', { type: 'number', value: 1, min: 0, max: 14, 'aria-label': '節点番号 k', style: { width: '74px' } })
  const stage = h('div.stage', { style: { display: 'grid', placeItems: 'center', padding: '8px', minHeight: '240px' } })
  const arrBox = h('div.hash-wrap'), narr = h('div.narr'), sts = h('div.stats')
  const root = h('div')

  const render = (f) => {
    stage.innerHTML = ''
    stage.appendChild(maxHeapTree(f.a, {
      cls: (i) => f.hl?.[i] || '',
      edgeCls: (i) => (f.edge === i ? 'on' : ''),
      subRoot: f.subRoot,
      minLevels: 4,
    }))
    arrBox.innerHTML = ''
    arrBox.appendChild(heapArr9(f.a, L, { cls: (i) => ({ cur: 'cur', sel: 'cur', ok: 'ok', bad: 'col', vis: 'vis' })[f.hl?.[i]] || '' }))
    const viol = range(f.a.length).filter((i) => i > 0 && f.a[i] > f.a[par(i)]).length
    sts.innerHTML = ''
    sts.append(
      stat('要素数 n', String(f.a.length), 'cy'),
      stat('根 a[0]（最大）', f.a.length ? String(f.a[0]) : '—', 'hl'),
      stat('今回の交換', `${f.sw}<small>回</small>`, 'li'),
      stat('条件違反', viol ? `${viol} 箇所` : 'なし ✓', viol ? 'hl' : 'li'),
    )
    narr.innerHTML = f.msg
  }
  const player = new Player({ interval: 800, keyTarget: root, render })
  const fr = (a, hl, msg, sw, extra = {}) => ({ a: a.slice(), hl, msg, sw, ...extra })

  const showStatic = (msg) => {
    const bad = {}
    range(A.length).forEach((i) => { if (i > 0 && A[i] > A[par(i)]) bad[i] = 'bad' })
    player.load([fr(A, Object.keys(bad).length ? bad : { 0: 'ok' }, msg, 0)])
  }

  const doInsert = () => {
    const x = +xIn.value
    if (!Number.isFinite(x)) return
    if (A.length >= L) return toast(`配列が一杯です（最大 ${L} 個）`, 'warn')
    const F = []
    let sw = 0
    A.push(x)
    let i = A.length - 1
    F.push(fr(A, { [i]: 'cur' }, `<b>INSERT(${x}, A)</b>：1. とりあえず最後尾 <code>a[${i}] = ${x}</code> に入れる（スライド 4）`, sw))
    while (i > 0) {
      const p = par(i)
      F.push(fr(A, { [i]: 'cur', [p]: 'sel' }, `2. 上に向かって最大ヒープ条件（子 ≤ 親）を確認：子 <code>a[${i}] = ${A[i]}</code> と親 <code>a[${p}] = ${A[p]}</code> を比較`, sw, { edge: i }))
      if (A[i] > A[p]) {
        ;[A[i], A[p]] = [A[p], A[i]]; sw++
        F.push(fr(A, { [p]: 'cur', [i]: 'vis' }, `<code>${A[p]} &gt; ${A[i]}</code> なので親と<b>交換</b>（${sw} 回目）`, sw, { edge: i }))
        i = p
      } else {
        F.push(fr(A, { [i]: 'ok', [p]: 'ok' }, `<code>${A[i]} ≤ ${A[p]}</code> で最大ヒープ条件を満足 → <b class="l">挿入完了</b>！`, sw))
        player.load(F); player.play(); return
      }
    }
    F.push(fr(A, { 0: 'ok' }, `根 <code>a[0]</code> に到達 → <b class="l">挿入完了</b>！`, sw))
    player.load(F); player.play()
  }

  const downmaxFrames = (startI, F, label) => {
    let i = startI, sw = 0
    F.push(fr(A, { [i]: 'cur' }, `<b>${label}</b>：節点 ${startI}（値 <b>${A[i]}</b>）を根とする部分木で下に向かって確認開始`, sw, { subRoot: startI }))
    while (2 * i + 1 < A.length) {
      const l = 2 * i + 1, r = 2 * i + 2
      const c = r < A.length && A[r] > A[l] ? r : l
      F.push(fr(A, { [i]: 'cur', [l]: 'sel', ...(r < A.length ? { [r]: 'sel' } : {}) },
        `親 <code>a[${i}] = ${A[i]}</code> と子 <code>a[${l}] = ${A[l]}</code>${r < A.length ? `, <code>a[${r}] = ${A[r]}</code>` : ''} を比較（大きい方の子は <code>a[${c}] = ${A[c]}</code>）`,
        sw, { subRoot: startI }))
      if (A[c] > A[i]) {
        ;[A[i], A[c]] = [A[c], A[i]]; sw++
        F.push(fr(A, { [c]: 'cur', [i]: 'vis' }, `子の <code>${A[i]}</code> の方が大きいので <code>a[${i}]</code> と <code>a[${c}]</code> を<b>交換</b>（${sw} 回目）`, sw, { edge: c, subRoot: startI }))
        i = c
      } else {
        F.push(fr(A, { [i]: 'ok' }, `親 <code>${A[i]} ≥</code> 子（最大 <code>${A[c]}</code>）なので最大ヒープ条件が成立 → <b class="l">終了</b>（交換 ${sw} 回）`, sw, { subRoot: startI }))
        return
      }
    }
    F.push(fr(A, { [i]: 'ok' }, `葉（節点 ${i}）まで到達 → <b class="l">${label} 終了</b>（交換 ${sw} 回）`, sw, { subRoot: startI }))
  }

  const doDeleteMax = () => {
    if (!A.length) return toast('ヒープが空です', 'warn')
    const F = []
    const mx = A[0]
    F.push(fr(A, { 0: 'ok' }, `<b>DELETEMAX(A)</b>：根の最大要素 <b class="l">${mx}</b> を取り出す（スライド 5 左）`, 0))
    const last = A.pop()
    if (!A.length) { F.push(fr(A, {}, `ヒープが空になった（取り出した最大値：<b>${mx}</b>）`, 0)); player.load(F); player.play(); return }
    A[0] = last
    F.push(fr(A, { 0: 'cur' }, `1. とりあえず最後尾にあった要素 <b>${last}</b> を根 <code>a[0]</code> に入れる`, 0))
    downmaxFrames(0, F, 'DOWNMAX(0, A)')
    player.load(F); player.play()
  }

  const doSubtreeDemo = () => {
    // スライド 5 右の DOWNMAX(1, A) デモ状態を再現
    A = [27, 11, 48, 49, 73, 42, 32, 26, 13, 75]
    kIn.value = 1
    const F = [fr(A, { 1: 'bad' }, 'スライド 5 右の例：節点 1（<code>a[1] = 11</code>）だけ小さい状態。ここに <b>DOWNMAX(1, A)</b> を実行すると…', 0, { subRoot: 1 })]
    downmaxFrames(1, F, 'DOWNMAX(1, A)')
    player.load(F); player.play()
  }

  const doDownMaxK = () => {
    const k = Math.max(0, Math.min(A.length - 1, Math.floor(+kIn.value || 0)))
    if (!A.length) return
    const F = []
    downmaxFrames(k, F, `DOWNMAX(${k}, A)`)
    player.load(F); player.play()
  }

  root.append(lab({
    title: 'LAB 9-1 — 最大ヒープの INSERT / DELETEMAX / DOWNMAX（スライド 3〜5）',
    hint: '親 ≥ 子で根に最大要素！ DOWNMAX は部分木にも使える',
    body: h('div',
      h('div.ctrl-row',
        h('div.field', h('label', 'x ='), xIn),
        h('button.op', { onclick: doInsert }, 'INSERT(x, A)'),
        h('button.op', { onclick: doDeleteMax }, 'DELETEMAX(A)'),
        h('div.field', h('label', 'k ='), kIn),
        h('button.op', { onclick: doDownMaxK }, 'DOWNMAX(k, A)'),
        h('button.op.ghost', { onclick: doSubtreeDemo }, 'スライド5右の例 DOWNMAX(1,A)'),
        h('button.op.ghost', { onclick: () => { A = SLIDE_INIT.slice(); xIn.value = 75; showStatic('スライド 3 の要素数 10 の最大ヒープに戻したよ。<code>INSERT(75, A)</code> を押すとスライド 4 と同じ動きになる！') } }, 'リセット')),
      h('div.sep'),
      h('div.lab-grid.wide-left', stage, h('div', { style: { display: 'grid', gap: '10px', alignContent: 'start' } }, sts, narr)),
      h('div.arr-name', '配列 a（a[0] = 根、節点 i の左の子 = 2i+1、右の子 = 2i+2）'), arrBox),
    foot: player.el,
  }))
  showStatic('スライド 3 の最大ヒープ（長さ n = 10）。どの節点も「<b>子の要素 ≤ 親の要素</b>」を満たし、根 <code>a[0] = 77</code> が最大要素！ <code>INSERT(75, A)</code> を押してスライド 4 を再現してみよう。')
  return root
}

/* ========== LAB 9-2: ヒープの構成（方法1: 簡易版）ステッパ（スライド 7） ========== */
function naiveBuildLab() {
  const inp = h('input.txt', { value: '14 45 77 70 73 43 80', 'aria-label': '入力配列 a', style: { width: '250px' } })
  const stage = h('div.stage', { style: { display: 'grid', placeItems: 'center', padding: '8px', minHeight: '220px' } })
  const arrBox = h('div.hash-wrap'), sts = h('div.stats'), narr = h('div.narr'), tblBox = h('div')
  const root = h('div')

  const render = (f) => {
    stage.innerHTML = ''
    stage.appendChild(maxHeapTree(f.a, {
      activeSize: f.heapLen,
      cls: (i) => (i >= f.heapLen ? 'dim' : f.hl?.[i] || ''),
      edgeCls: (i) => (f.edge === i ? 'on' : ''),
      minLevels: 3,
    }))
    arrBox.innerHTML = ''
    arrBox.appendChild(h('div.harr', f.a.map((v, idx) => {
      const inHeap = idx < f.heapLen
      const c = f.hl?.[idx] ? ({ cur: 'cur', sel: 'cur', ok: 'ok', vis: 'vis' }[f.hl[idx]] || '') : ''
      return h('div.hc', {
        class: c,
        style: !inHeap ? { opacity: '0.42', borderStyle: 'dashed' } : idx === f.heapLen - 1 ? { boxShadow: 'inset 0 -4px 0 #2fbf71' } : null,
      }, h('i', idx), h('b', String(v)))
    })))
    sts.innerHTML = ''
    sts.append(
      stat('挿入対象 i', f.i != null ? String(f.i) : '完了', 'cy'),
      stat('現在の高さ h<sub>i</sub>', String(f.hi), 'hl'),
      stat('比較回数', String(f.comp), 'cy'),
      stat('交換回数', String(f.sw), 'li'),
    )
    narr.innerHTML = f.msg
  }
  const player = new Player({ interval: 700, keyTarget: root, render })

  const build = () => {
    const a = parseNums(inp.value).slice(0, 17)
    if (a.length < 2) return toast('2 個以上の数を入力してね', 'warn')
    const n = a.length, F = [], rows = []
    let comp = 0, sw = 0
    F.push({ a: a.slice(), heapLen: 0, i: null, hi: 0, comp: 0, sw: 0, msg: `入力（n = ${n}）：<code>${a.join(' ')}</code>。簡易版では <code>i = 0, 1, …, n−1</code> の順に <code>a[i]</code> を最大ヒープへ挿入していく（<b>配列内 in-place、追加メモリ O(1)</b>）。` })

    for (let i = 0; i < n; i++) {
      const hi = depthOf(i)
      let cur = i, swStep = 0
      F.push({ a: a.slice(), heapLen: i + 1, i, hi, comp, sw, hl: { [i]: 'cur' }, msg: `<b>i = ${i}</b>（挿入時の深さ = 高さ h<sub>${i}</sub> = <b>${hi}</b>）：<code>a[${i}] = ${a[i]}</code> をヒープに追加（INSERT(${a[i]}, A) と同じ）` })
      while (cur > 0) {
        const p = par(cur)
        comp++
        const gt = a[cur] > a[p]
        F.push({
          a: a.slice(), heapLen: i + 1, i, hi, comp, sw, hl: { [cur]: 'cur', [p]: 'sel' }, edge: cur,
          msg: `子 <code>a[${cur}] = ${a[cur]}</code> と親 <code>a[${p}] = ${a[p]}</code> を比較 → ${gt ? `<b class="r">${a[cur]} &gt; ${a[p]}</b> なので交換！` : `<b class="l">${a[cur]} ≤ ${a[p]}</b> でヒープ条件成立`}`,
        })
        if (gt) {
          ;[a[cur], a[p]] = [a[p], a[cur]]; sw++; swStep++
          F.push({ a: a.slice(), heapLen: i + 1, i, hi, comp, sw, hl: { [p]: 'cur', [cur]: 'vis' }, edge: cur, msg: `交換完了 → <code>[${a.slice(0, i + 1).join(' ')}]</code>` })
          cur = p
        } else break
      }
      rows.push([`i = ${i}`, `h<sub>${i}</sub> = ${hi}`, `${swStep} 回`, `<b>${a.slice(0, i + 1).join(' ')}</b> <span class="small" style="opacity:.6">${a.slice(i + 1).join(' ')}</span>`])
    }
    F.push({ a: a.slice(), heapLen: n, i: null, hi: depthOf(n - 1), comp, sw, hl: { 0: 'ok' }, msg: `<b class="l">簡易版のヒープ構成が完了！</b> 配列：<code>${a.join(' ')}</code>（比較 ${comp} 回・交換 ${sw} 回）。後半の葉（深さ h が大きい節点）ほど沢山あるため、時間計算量は <b>O(n log₂ n)</b> かかる。` })
    tblBox.innerHTML = ''
    tblBox.appendChild(table(['段階', '挿入時の高さ h_i', '交換', '配列 a（太字が a[0..i] の最大ヒープ）'], rows))
    player.load(F)
  }

  const preset = (v) => () => { inp.value = v; build() }
  inp.addEventListener('change', build)
  root.append(lab({
    title: 'LAB 9-2 — ヒープの構成・方法1：簡易版（スライド 7〜8）',
    hint: 'i = 0 → n−1 の順に上向き INSERT。後半の深い葉が重い！',
    body: h('div',
      h('div.ctrl-row',
        h('div.field', h('label', '入力 a ='), inp),
        h('button.op', { onclick: build }, '構成開始'),
        h('button.op.ghost', { onclick: preset('14 45 77 70 73 43 80') }, '講義の例 (n=7)'),
        h('button.op.ghost', { onclick: preset('10 20 30 40 50 60 70') }, '昇順（最悪）')),
      h('div.sep'),
      h('div.lab-grid.wide-left', stage, h('div', { style: { display: 'grid', gap: '10px', alignContent: 'start' } }, sts, narr)),
      h('div.arr-name', '配列 a（点線はまだヒープに入れていない要素）'), arrBox,
      h('details', { style: { marginTop: '10px' } }, h('summary', { style: { cursor: 'pointer', fontWeight: 700, fontSize: '13px' } }, '各 i 終了後のヒープ一覧を見る'), tblBox)),
    foot: player.el,
  }))
  build()
  return root
}

/* ========== LAB 9-3: ヒープの構成（方法2: Heapify）ステッパ（スライド 9, 12, 13 / 課題 1, 2, 4, 6 対応） ========== */
function heapifyLab() {
  const inp = h('input.txt', { value: '14 45 77 70 73 43 80', 'aria-label': '入力配列 a', style: { width: '300px' } })
  const stage = h('div.stage', { style: { display: 'grid', placeItems: 'center', padding: '8px', minHeight: '240px' } })
  const arrBox = h('div.hash-wrap'), sts = h('div.stats'), narr = h('div.narr'), snapBox = h('div')
  const jumpRow = h('div.ctrl-row', { style: { marginTop: '8px' } })
  const root = h('div')

  const render = (f) => {
    stage.innerHTML = ''
    stage.appendChild(maxHeapTree(f.a, {
      cls: (i) => f.hl?.[i] || '',
      edgeCls: (i) => (f.edge === i ? 'on' : ''),
      subRoot: f.subRoot,
      minLevels: 3,
    }))
    arrBox.innerHTML = ''
    arrBox.appendChild(heapArr9(f.a, f.a.length, {
      cls: (i) => ({ cur: 'cur', sel: 'cur', ok: 'ok', vis: 'vis' })[f.hl?.[i]] || '',
    }))
    sts.innerHTML = ''
    sts.append(
      stat('対象節点 i', f.subRoot != null ? `DOWNMAX(${f.subRoot}, A)` : '完了', 'cy'),
      stat('部分木の高さ h′<sub>i</sub>', f.hPrime != null ? String(f.hPrime) : '—', 'hl'),
      stat('比較回数', String(f.comp), 'cy'),
      stat('交換回数', String(f.sw), 'li'),
    )
    narr.innerHTML = f.msg
  }
  const player = new Player({ interval: 750, keyTarget: root, render })

  const subtreeHeight = (i, n) => {
    let d = 0, u = i
    while (2 * u + 1 < n) { d++; u = 2 * u + 1 }
    return d
  }

  const build = () => {
    const a = parseNums(inp.value).slice(0, 25)
    if (a.length < 2) return toast('2 個以上の数を入力してね', 'warn')
    const n = a.length, startI = Math.floor(n / 2) - 1
    const F = [], snaps = [], jumpIdx = {}
    let comp = 0, sw = 0

    F.push({
      a: a.slice(), subRoot: null, hPrime: null, comp: 0, sw: 0,
      msg: `<b>0. 初期状態（n = ${n}）</b>：節点 ${startI + 1}〜${n - 1} はすべて<b>葉</b>（高さ 0 で既に最大ヒープ条件を満たす）。だから最後尾 <code>n−1 = ${n - 1}</code> の親である <b><code>i = ⌊${n}/2⌋ − 1 = ${startI}</code></b> から <code>0</code> まで逆順に <code>DOWNMAX(i, A)</code> を実行する！`,
    })

    for (let i = startI; i >= 0; i--) {
      const hp = subtreeHeight(i, n)
      let cur = i, swStep = 0
      F.push({
        a: a.slice(), subRoot: i, hPrime: hp, comp, sw, hl: { [i]: 'cur' },
        msg: `<b>DOWNMAX(${i}, A) 開始</b>：節点 ${i}（値 <b>${a[i]}</b>、部分木の高さ h′<sub>${i}</sub> = ${hp}）を根とする部分木をヒープ化する`,
      })
      while (2 * cur + 1 < n) {
        const l = 2 * cur + 1, r = 2 * cur + 2
        comp++
        if (r < n) comp++
        const c = r < n && a[r] > a[l] ? r : l
        const gt = a[c] > a[cur]
        F.push({
          a: a.slice(), subRoot: i, hPrime: hp, comp, sw,
          hl: { [cur]: 'cur', [l]: 'sel', ...(r < n ? { [r]: 'sel' } : {}) },
          msg: `親 <code>a[${cur}] = ${a[cur]}</code> と子 ${r < n ? `<code>a[${l}] = ${a[l]}</code>, <code>a[${r}] = ${a[r]}</code>（大きい方は <code>a[${c}] = ${a[c]}</code>）` : `<code>a[${l}] = ${a[l]}</code>`} を比較 → ${gt ? `<b class="r">${a[c]} &gt; ${a[cur]}</b> なので交換！` : `<b class="l">${a[cur]} ≥ ${a[c]}</b> で条件満足`}`,
        })
        if (gt) {
          ;[a[cur], a[c]] = [a[c], a[cur]]; sw++; swStep++
          F.push({
            a: a.slice(), subRoot: i, hPrime: hp, comp, sw, hl: { [c]: 'cur', [cur]: 'vis' }, edge: c,
            msg: `<code>a[${cur}]</code> と <code>a[${c}]</code> を<b>交換</b> → 続いて節点 ${c} で子を確認`,
          })
          cur = c
        } else break
      }
      F.push({
        a: a.slice(), subRoot: i, hPrime: hp, comp, sw, hl: { [cur]: 'ok' },
        msg: `<b class="l">DOWNMAX(${i}, A) 終了</b>（交換 ${swStep} 回） → 配列：<code>${a.join(' ')}</code>`,
      })
      jumpIdx[i] = F.length - 1
      snaps.push([
        `<b>DOWNMAX(${i}, A) 終了後</b>`,
        `h′<sub>${i}</sub> = ${hp}`,
        `${swStep} 回`,
        `<code>${a.join(' ')}</code>`,
      ])
    }

    F.push({
      a: a.slice(), subRoot: null, hPrime: subtreeHeight(0, n), comp, sw, hl: { 0: 'ok' },
      msg: `<b class="l">Heapify 完了！</b> 最大ヒープ：<code>${a.join(' ')}</code>（合計交換 ${sw} 回）。高さの低い部分木に対する操作が大半なので時間計算量は <b>O(n)</b>！`,
    })

    jumpRow.innerHTML = ''
    jumpRow.appendChild(h('span.small', { style: { fontWeight: 700 } }, '終了直後へジャンプ：'))
    for (let i = startI; i >= 0; i--) {
      jumpRow.appendChild(h('button.op.ghost', { onclick: () => { player.stop(); player.go(jumpIdx[i]) } }, `DOWNMAX(${i}, A) 後`))
    }

    snapBox.innerHTML = ''
    snapBox.appendChild(table(['段階', '部分木の高さ', '交換回数', '配列 a[0] … a[n−1]（コピー用）'], snaps))
    player.load(F)
  }

  const preset = (v) => () => { inp.value = v; build() }
  inp.addEventListener('change', build)
  root.append(lab({
    title: 'LAB 9-3 — ヒープの構成・方法2：Heapify ステッパ（スライド 9, 12, 13）',
    hint: 'i = ⌊n/2⌋−1 から 0 へ逆順に DOWNMAX(i, A)！',
    body: h('div',
      h('div.ctrl-row',
        h('div.field', h('label', '入力 a ='), inp),
        h('button.op', { onclick: build }, 'Heapify 実行'),
        h('button.op.ghost', { onclick: preset('14 45 77 70 73 43 80') }, '講義の例 (n=7)'),
        h('button.op.ghost', { onclick: preset('40 69 65 92 57 19 96 30 55 32') }, '課題1〜2 (n=10)'),
        h('button.op.ghost', { onclick: preset('55 14 38 50 5 69 41 61 79 78 82 76 65') }, '課題4 (n=13)'),
        h('button.op.ghost', { onclick: preset('0 75 67 18 20 57 62 64 25 52 65 40 35 74 96 47 3') }, '課題6 (n=17)')),
      jumpRow,
      h('div.sep'),
      h('div.lab-grid.wide-left', stage, h('div', { style: { display: 'grid', gap: '10px', alignContent: 'start' } }, sts, narr)),
      h('div.arr-name', '配列 a'), arrBox,
      h('div.arr-name', '各 DOWNMAX(i, A) 終了後の配列スナップショット'), snapBox),
    foot: player.el,
  }))
  build()
  return root
}

/* ========== LAB 9-4: 簡易版 H(n) vs Heapify H'(n) コスト比較ビジュアライザ（スライド 8, 10） ========== */
function complexityCompareLab() {
  const sl = h('input', { type: 'range', min: 2, max: 12, value: 4, 'aria-label': '深さパラメータ' })
  const stage = h('div.stage', { style: { padding: '14px' } })
  const sts = h('div.stats'), narr = h('div.narr')

  const draw = () => {
    // スライド 8・10 の記号に完全準拠：n = 2^m - 1（スライドでは n = 2^h - 1 と表記、木の高さは m - 1）
    // 混乱を避けるため、木の実際の高さ H = m - 1（深さ 0 〜 H）と節点数 n = 2^(H+1) - 1 の両方を明示する
    const H = +sl.value // 木の最大深さ（高さ） H = 2..12 → 要素数 n = 2^(H+1) - 1 (7 〜 8191)
    const n = 2 ** (H + 1) - 1
    // 簡易版: 深さ d (0..H) にある 2^d 個の節点は、挿入時のヒープ高さ d に対して最大 d 回交換
    // Heapify: 深さ d (0..H-1) にある 2^d 個の節点は、部分木の高さ h'_i = H - d に対して最大 (H - d) 回交換（深さ H の葉 2^H 個は 0 回！）
    const rows = []
    let sumNaive = 0, sumHeapify = 0
    for (let d = 0; d <= H; d++) {
      const cnt = 2 ** d
      const wNaive = cnt * d
      const wHeap = cnt * (H - d)
      sumNaive += wNaive
      sumHeapify += wHeap
      rows.push({ d, cnt, hPrime: H - d, wNaive, wHeap })
    }

    const W = 540, SVG_H = 235, pad = { l: 58, r: 22, t: 24, b: 36 }
    const plotW = W - pad.l - pad.r, plotH = SVG_H - pad.t - pad.b
    const maxVal = Math.max(1, ...rows.map((r) => Math.max(r.wNaive, r.wHeap)))
    const svg = svgRoot(W, SVG_H, { role: 'img', 'aria-label': '深さごとの最大仕事量の比較' })

    // グリッド
    for (let g = 0; g <= 4; g++) {
      const y = pad.t + (g / 4) * plotH
      const v = Math.round(maxVal * (1 - g / 4))
      svg.append(
        s('line', { x1: pad.l, x2: W - pad.r, y1: y, y2: y, class: 'h-grid' }),
        s('text', { x: pad.l - 8, y: y + 4, class: 'h-ax', 'text-anchor': 'end', text: v.toLocaleString() }),
      )
    }
    svg.appendChild(s('line', { x1: pad.l, x2: W - pad.r, y1: pad.t + plotH, y2: pad.t + plotH, stroke: '#3d2e54', 'stroke-width': 2 }))

    const slotW = plotW / (H + 1)
    const barW = Math.max(6, Math.min(22, slotW * 0.38))
    rows.forEach((r, idx) => {
      const cx = pad.l + (idx + 0.5) * slotW
      const hN = (r.wNaive / maxVal) * (plotH - 6)
      const hH = (r.wHeap / maxVal) * (plotH - 6)
      // Naive bar (rose/orange)
      svg.appendChild(s('rect', {
        x: cx - barW - 1, y: pad.t + plotH - hN, width: barW, height: Math.max(1.5, hN),
        rx: 4, fill: '#ff8a3d', stroke: '#3d2e54', 'stroke-width': 1.6,
      }))
      // Heapify bar (mint/lime)
      svg.appendChild(s('rect', {
        x: cx + 1, y: pad.t + plotH - hH, width: barW, height: Math.max(1.5, hH),
        rx: 4, fill: '#2fbf71', stroke: '#3d2e54', 'stroke-width': 1.6,
      }))
      svg.appendChild(s('text', {
        x: cx, y: SVG_H - 12, class: 'h-ax', 'text-anchor': 'middle',
        text: H <= 8 ? `深さ${r.d}` : `${r.d}`,
      }))
    })
    // 凡例
    svg.append(
      s('rect', { x: pad.l + 8, y: 6, width: 12, height: 12, rx: 3, fill: '#ff8a3d', stroke: '#3d2e54', 'stroke-width': 1.5 }),
      s('text', { x: pad.l + 25, y: 16, class: 'h-ax', text: '簡易版：節点数 2^d × 深さ d（深い葉ほど重い！）' }),
      s('rect', { x: pad.l + 280, y: 6, width: 12, height: 12, rx: 3, fill: '#2fbf71', stroke: '#3d2e54', 'stroke-width': 1.5 }),
      s('text', { x: pad.l + 297, y: 16, class: 'h-ax', text: 'Heapify：節点数 2^d × 部分木高 (H−d)' }),
    )

    stage.innerHTML = ''
    stage.appendChild(svg)

    sts.innerHTML = ''
    sts.append(
      stat('要素数 n', n.toLocaleString(), 'cy'),
      stat('簡易版 ∑ h<sub>i</sub>', `${sumNaive.toLocaleString()}<small>O(n log n)</small>`, 'hl'),
      stat('Heapify ∑ h′<sub>i</sub>', `${sumHeapify.toLocaleString()}<small>O(n)</small>`, 'li'),
      stat('Heapify の倍率', `${(sumNaive / Math.max(1, sumHeapify)).toFixed(1)}<small>倍高速</small>`, 'li'),
    )
    const leaves = 2 ** H, h1Nodes = 2 ** (H - 1)
    narr.innerHTML = `要素数 <b>n = ${n.toLocaleString()}</b> の完全二分木では、一番下の<b>葉だけで ${leaves.toLocaleString()} 個（全体の約半分！）</b>ある。<br>` +
      `・<b>簡易版（オレンジ）</b>：その ${leaves.toLocaleString()} 個すべてが「高さ ${H}」のヒープに挿入されるため、右端の棒が爆発して <b>O(n log₂ n)</b>。<br>` +
      `・<b>Heapify（緑）</b>：葉 ${leaves.toLocaleString()} 個は<b>何もしない（0 回）</b>！ 一番多い操作は「<b>高さ 1 の部分木</b>」に対する ${h1Nodes.toLocaleString()} 回で、合計は常に <code>n − (H + 1) = ${sumHeapify.toLocaleString()} &lt; n</code>、つまり <b>O(n)</b> に収まる！`
  }

  sl.addEventListener('input', draw)
  const root = lab({
    title: 'LAB 9-4 — なぜ Heapify は O(n) なのか？ 簡易版 vs Heapify（スライド 8, 10）',
    hint: 'スライダーで木の高さ H を増やして棒グラフの左右を見比べよう',
    body: h('div',
      h('div.ctrl-row', h('div.field', h('label', '完全二分木の高さ H ='), sl)),
      h('div.sep'),
      h('div.lab-grid.wide-left', stage, h('div', { style: { display: 'grid', gap: '10px', alignContent: 'start' } }, sts, narr))),
  })
  draw()
  return root
}

/* ========== LAB 9-5: ヒープソート完全トレーサ（Heapify ＋ スライド 11 の最大要素取出 / 課題 1〜7 完全対応） ========== */
function heapSortFullLab() {
  const inp = h('input.txt', { value: '14 45 77 70 73 43 80', 'aria-label': '入力配列 a', style: { width: '300px' } })
  const stage = h('div.stage', { style: { display: 'grid', placeItems: 'center', padding: '8px', minHeight: '240px' } })
  const arrBox = h('div.hash-wrap'), sts = h('div.stats'), narr = h('div.narr'), snapBox = h('div')
  const jumpRow = h('div.ctrl-row', { style: { marginTop: '8px' } })
  const root = h('div')

  const render = (f) => {
    stage.innerHTML = ''
    stage.appendChild(maxHeapTree(f.a, {
      activeSize: f.heapSize,
      subRoot: f.subRoot,
      cls: (i) => f.hl?.[i] || (i >= f.heapSize ? 'ok' : ''),
      edgeCls: (i) => (f.edge === i ? 'on' : ''),
      minLevels: 3,
    }))
    arrBox.innerHTML = ''
    arrBox.appendChild(heapArr9(f.a, f.a.length, {
      activeSize: f.heapSize,
      cls: (i) => ({ cur: 'cur', sel: 'cur', ok: 'ok', bad: 'col', vis: 'vis' })[f.hl?.[i]] || (i >= f.heapSize ? 'ok' : ''),
    }))
    sts.innerHTML = ''
    sts.append(
      stat('フェーズ', f.phase, 'cy'),
      stat('ループ変数 i', f.loopI != null ? String(f.loopI) : '—', 'hl'),
      stat('ヒープ要素数', `${f.heapSize}<small>/ ${f.a.length}</small>`, 'cy'),
      stat('確定（昇順）', `${f.a.length - f.heapSize}<small>個</small>`, 'li'),
    )
    narr.innerHTML = f.msg
  }
  const player = new Player({ interval: 700, keyTarget: root, render })

  const build = () => {
    const a = parseNums(inp.value).slice(0, 25)
    if (a.length < 2) return toast('2 個以上の数を入力してね', 'warn')
    const n = a.length, startI = Math.floor(n / 2) - 1
    const F = [], snaps = [], jumps = {}

    F.push({
      a: a.slice(), heapSize: n, phase: '0. 初期', loopI: null,
      msg: `<b>入力（n = ${n}）</b>：<code>${a.join(' ')}</code>。まず<b>手順 1（スライド 9：Heapify）</b>で最大ヒープを構成し、続けて<b>手順 2（スライド 11）</b>で <code>i = n−1</code> から <code>1</code> まで最大要素を取り出して後ろから並べる！`,
    })

    // Phase 1: Heapify
    for (let i = startI; i >= 0; i--) {
      let cur = i
      while (2 * cur + 1 < n) {
        const l = 2 * cur + 1, r = 2 * cur + 2
        const c = r < n && a[r] > a[l] ? r : l
        if (a[c] > a[cur]) { ;[a[cur], a[c]] = [a[c], a[cur]]; cur = c } else break
      }
      F.push({
        a: a.slice(), heapSize: n, phase: '1. Heapify', loopI: i, subRoot: i, hl: { [cur]: 'cur' },
        msg: `<b>Heapify：DOWNMAX(${i}, A) 終了</b> → <code>${a.join(' ')}</code>`,
      })
      if (i === 2) jumps.dm2 = F.length - 1
      if (i === 0) jumps.dm0 = F.length - 1
    }
    snaps.push(['<b>Heapify 完了（DOWNMAX(0, A) 後）</b>', `0〜${n - 1}`, `<code>${a.join(' ')}</code>`])

    // Phase 2: Extract Max (Slide 11)
    for (let i = n - 1; i >= 1; i--) {
      const mx = a[0], other = a[i]
      ;[a[0], a[i]] = [a[i], a[0]]
      F.push({
        a: a.slice(), heapSize: i, phase: '2. 最大取出', loopI: i, hl: { 0: 'cur', [i]: 'ok' },
        msg: `<b>i = ${i}（手順 2〜3）</b>：最大要素 <code>a[0] = ${mx}</code> と <code>a[${i}] = ${other}</code> を<b>交換</b>し、節点 ${i}（<b class="l">${mx}</b>）をヒープから切り離して確定！`,
      })

      // Step 4: DOWNMAX(0, A) on a[0 .. i-1]
      let cur = 0
      while (2 * cur + 1 < i) {
        const l = 2 * cur + 1, r = 2 * cur + 2
        const c = r < i && a[r] > a[l] ? r : l
        if (a[c] > a[cur]) {
          F.push({
            a: a.slice(), heapSize: i, phase: '2. DOWNMAX', loopI: i, hl: { [cur]: 'cur', [c]: 'sel' }, edge: c,
            msg: `<b>i = ${i}（手順 4：DOWNMAX(0, A)）</b>：<code>a[${cur}] = ${a[cur]}</code> と大きい方の子 <code>a[${c}] = ${a[c]}</code>（&lt; i = ${i} の範囲内）を交換`,
          })
          ;[a[cur], a[c]] = [a[c], a[cur]]
          cur = c
        } else break
      }
      F.push({
        a: a.slice(), heapSize: i, phase: '2. 周回終了', loopI: i, hl: { [cur]: 'vis' },
        msg: `<b class="l">i = ${i} の処理が終了</b>（<code>a[0..${i - 1}]</code> が最大ヒープ、<code>a[${i}..${n - 1}]</code> が昇順確定） → <code>${a.join(' ')}</code>`,
      })
      if (i === 5) jumps.i5 = F.length - 1
      snaps.push([
        i === 5 ? `<b class="amber">i = 5 終了後</b>` : `i = ${i} 終了後`,
        `0〜${i - 1}`,
        `<code>${a.slice(0, i).join(' ')} <b class="lime">${a.slice(i).join(' ')}</b></code>`,
      ])
    }

    F.push({
      a: a.slice(), heapSize: 0, phase: '整列完了', loopI: null,
      msg: `<b class="l">整列完了！</b> 昇順の配列：<code>${a.join(' ')}</code> — Heapify が $O(n)$、最大要素の取出が $O(n \\log_2 n)$ なので、ヒープソート全体の時間計算量は最悪・平均・最良すべて <b>$O(n \\log_2 n)$</b>！`,
    })
    jumps.done = F.length - 1

    jumpRow.innerHTML = ''
    jumpRow.appendChild(h('span.small', { style: { fontWeight: 700 } }, '一発ジャンプ：'))
    if (jumps.dm2 != null) jumpRow.appendChild(h('button.op.ghost', { onclick: () => { player.stop(); player.go(jumps.dm2) } }, 'DOWNMAX(2,A) 後'))
    if (jumps.dm0 != null) jumpRow.appendChild(h('button.op.ghost', { onclick: () => { player.stop(); player.go(jumps.dm0) } }, 'Heapify 完了後'))
    if (jumps.i5 != null) jumpRow.appendChild(h('button.op.ghost', { onclick: () => { player.stop(); player.go(jumps.i5) } }, 'i = 5 終了後'))
    jumpRow.appendChild(h('button.op.ghost', { onclick: () => { player.stop(); player.go(jumps.done) } }, '整列完了'))

    snapBox.innerHTML = ''
    snapBox.appendChild(table(['段階', 'ヒープ範囲', '配列 a（緑太字は確定した昇順部分）'], snaps))
    player.load(F)
  }

  const preset = (v) => () => { inp.value = v; build() }
  inp.addEventListener('change', build)
  root.append(lab({
    title: 'LAB 9-5 — ヒープソート完全トレーサ（スライド 11〜19）',
    hint: '最大要素 a[0] を末尾 a[i] と交換 → ヒープを縮めて DOWNMAX(0, A)！',
    body: h('div',
      h('div.ctrl-row',
        h('div.field', h('label', '配列 a ='), inp),
        h('button.op', { onclick: build }, 'トレース生成'),
        h('button.op.ghost', { onclick: preset('14 45 77 70 73 43 80') }, '講義の例 (n=7)'),
        h('button.op.ghost', { onclick: preset('40 69 65 92 57 19 96 30 55 32') }, '課題1〜3 (n=10)'),
        h('button.op.ghost', { onclick: preset('55 14 38 50 5 69 41 61 79 78 82 76 65') }, '課題4〜5 (n=13)'),
        h('button.op.ghost', { onclick: preset('0 75 67 18 20 57 62 64 25 52 65 40 35 74 96 47 3') }, '課題6〜7 (n=17)')),
      jumpRow,
      h('div.sep'),
      h('div.lab-grid.wide-left', stage, h('div', { style: { display: 'grid', gap: '10px', alignContent: 'start' } }, sts, narr)),
      h('div.arr-name', '配列 a（緑セルはヒープから切り離されて昇順に確定した要素）'), arrBox,
      h('details', { style: { marginTop: '10px' } }, h('summary', { style: { cursor: 'pointer', fontWeight: 700, fontSize: '13px' } }, '全ステップ（Heapify 完了〜 i = 1 終了）の配列一覧表を開く'), snapBox)),
    foot: player.el,
  }))
  build()
  return root
}

/* ========== LAB 9-6: ヒープソートの安定性検証（簡易版も Heapify も不安定！） ========== */
function heapStabilityLab() {
  let mode = 'heapify'
  const stage = h('div.stage', { style: { padding: '16px' } })
  const narr = h('div.narr')

  // 同じ値 20 を区別するためにラベル A, B を付けた 3 要素 [20_A, 20_B, 10] や [10, 20_A, 20_B] を追跡
  const CASES = {
    heapify: {
      title: 'Heapify を使ったヒープソートの反例：入力 [20(A), 20(B), 10]',
      steps: [
        ['0. 初期配列', [{ v: 20, id: 'A', bg: '#ffe0cc' }, { v: 20, id: 'B', bg: '#d8eeff' }, { v: 10, id: '', bg: '#fff' }], '同じ値 <code>20</code> が <b>20(A) → 20(B)</b> の順に並んでいる。'],
        ['1. Heapify（DOWNMAX(0, A)）', [{ v: 20, id: 'A', bg: '#ffe0cc' }, { v: 20, id: 'B', bg: '#d8eeff' }, { v: 10, id: '', bg: '#fff' }], '親 <code>a[0]=20(A)</code> は子 <code>20(B), 10</code> 以上なので交換なし。すでに最大ヒープ！'],
        ['2. i = 2：a[0] と a[2] を交換 → DOWNMAX(0, A)', [{ v: 20, id: 'B', bg: '#d8eeff' }, { v: 10, id: '', bg: '#fff' }, { v: 20, id: 'A', bg: '#ffe0cc', sorted: true }], '根の先頭 <b>20(A)</b> が一番後ろの <code>a[2]</code> へ飛ばされ、残った <b>20(B)</b> が新しい根 <code>a[0]</code> になる！'],
        ['3. i = 1：a[0] と a[1] を交換 → 整列完了', [{ v: 10, id: '', bg: '#fff', sorted: true }, { v: 20, id: 'B', bg: '#d8eeff', sorted: true }, { v: 20, id: 'A', bg: '#ffe0cc', sorted: true }], '<b class="r">結果：10, 20(B), 20(A)</b>。元の順序 <b>A → B</b> が <b>B → A</b> に逆転した！（<b>安定性：無</b>）'],
      ],
    },
    naive: {
      title: '簡易版を使ったヒープソートの反例：入力 [20(A), 20(B), 10]',
      steps: [
        ['0. 初期配列', [{ v: 20, id: 'A', bg: '#ffe0cc' }, { v: 20, id: 'B', bg: '#d8eeff' }, { v: 10, id: '', bg: '#fff' }], '同じく <b>20(A) → 20(B)</b> の順に並んだ配列を入力とする。'],
        ['1. 簡易版で i=0,1,2 を順に INSERT', [{ v: 20, id: 'A', bg: '#ffe0cc' }, { v: 20, id: 'B', bg: '#d8eeff' }, { v: 10, id: '', bg: '#fff' }], '<code>20(B) ≤ 20(A)</code>、<code>10 ≤ 20(A)</code> なので一度も交換せず、Heapify と全く同じ最大ヒープができる。'],
        ['2. i = 2, 1 で最大要素を取り出して末尾へ交換', [{ v: 10, id: '', bg: '#fff', sorted: true }, { v: 20, id: 'B', bg: '#d8eeff', sorted: true }, { v: 20, id: 'A', bg: '#ffe0cc', sorted: true }], '先頭の <b>20(A)</b> が先に右端 <code>a[2]</code> に置かれ、<b>20(B)</b> が <code>a[1]</code> に置かれるため、<b class="r">やはり B → A に逆転する（安定性：無）</b>！'],
      ],
    },
  }

  const draw = () => {
    const c = CASES[mode]
    stage.innerHTML = ''
    stage.appendChild(h('div.arr-name', { style: { marginTop: 0 } }, c.title))
    const list = h('div', { style: { display: 'grid', gap: '10px', marginTop: '8px' } })
    c.steps.forEach(([lbl, arr, desc]) => {
      list.appendChild(h('div', { style: { background: '#fff', border: '2px solid #3d2e54', borderRadius: '14px', padding: '10px 14px' } },
        h('div', { style: { fontWeight: 900, fontSize: '12.5px', marginBottom: '6px', color: '#5b4c72' } }, lbl),
        h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '6px' } },
          arr.map((it, idx) => h('span', {
            style: {
              display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 12px',
              borderRadius: '10px', border: '2px solid #3d2e54', background: it.bg,
              fontFamily: 'var(--f-mono)', fontWeight: 700, fontSize: '14px',
              boxShadow: it.sorted ? '0 3px 0 #2fbf71' : '0 2px 0 #3d2e54',
            },
          }, `a[${idx}]: ${it.v}`, it.id ? h('small', { style: { background: '#fff', padding: '0 5px', borderRadius: '99px', border: '1.5px solid #3d2e54', fontSize: '11px' } }, it.id) : null))),
        h('div', { style: { fontSize: '13.5px', lineHeight: 1.6 }, html: desc }),
      ))
    })
    stage.appendChild(list)
    narr.innerHTML = 'ヒープソートは「根 <code>a[0]</code> の最大要素を末尾 <code>a[i]</code> と一気に飛び越えて交換する」ため、<b>Heapify を使っても簡易版を使っても安定性はない（無）</b>。また、どちらも配列 <code>a</code> の中で要素を入れ替えるだけなので、<b>追加の空間計算量は同じ $O(1)$（配列全体を含めても $O(n)$）</b>だよ。'
  }

  const sel = seg([['heapify', 'Heapify 版の反例'], ['naive', '簡易版の反例']], 'heapify', (v) => { mode = v; draw() })
  const root = lab({
    title: 'LAB 9-6 — ヒープソートの安定性と空間計算量の検証（スライド 6・課題 8 対策）',
    hint: '同じ値 20(A), 20(B) がどう入れ替わるか確認しよう',
    body: h('div',
      h('div.ctrl-row', sel),
      h('div.sep'),
      stage,
      h('div', { style: { marginTop: '12px' } }, narr)),
  })
  draw()
  return root
}

export default {
  n: 9,
  title: '整列のアルゴリズム (2)',
  sub: 'ヒープソート — 最大ヒープと O(n) の Heapify による高速整列',
  en: 'Heapsort & Heapify',
  tags: ['ヒープソート', '最大ヒープ', 'DOWNMAX', 'Heapify', 'O(n)', 'O(n log n)'],
  mini: '<svg viewBox="0 0 120 60"><g stroke="#3d2e54" stroke-width="1.6"><path d="M60 11 36 30M60 11 84 30M36 30 22 48M36 30 50 48M84 30 70 48M84 30 98 48" fill="none" stroke-opacity=".45"/><path d="M84 18 L66 53 L102 53 Z" fill="rgba(255,210,63,.35)" stroke="#3d2e54" stroke-width="1.3" stroke-dasharray="3 2"/><circle cx="60" cy="11" r="7" fill="#ff8a3d"/><circle cx="36" cy="30" r="6" fill="#fff"/><circle cx="84" cy="30" r="6" fill="#ffd23f"/><circle cx="22" cy="48" r="5" fill="#fff"/><circle cx="50" cy="48" r="5" fill="#fff"/><circle cx="70" cy="48" r="5" fill="#2fbf71"/><circle cx="98" cy="48" r="5" fill="#2fbf71"/></g></svg>',
  goals: [
    '最大ヒープの条件（子の要素 ≤ 親の要素）と INSERT・DELETEMAX・DOWNMAX の動作を説明できる',
    'ヒープを構成する 2 つの方法（簡易版 O(n log₂ n) と Heapify O(n)）の手順と違いを説明できる',
    'なぜ Heapify が簡易版より高速な O(n) になるのか、部分木の高さ h′_i から説明できる',
    'ヒープから最大要素を取り出して昇順に並べる手順（スライド 11）を正確にトレースできる',
    'ヒープソート全体の時間計算量（最悪・平均・最良すべて O(n log₂ n)）と安定性（無）を説明できる',
  ],
  chapters: [
    {
      id: 'maxheap', k: 'REVIEW', title: '復習：最大ヒープと DOWNMAX',
      build: (el) => el.append(
        talk(`S: 第9回からは<b>高等な整列アルゴリズム（$O(n \\log_2 n)$）</b>に入るよ！ 第1弾は、第8回の最後にも選択ソートの改良として登場した<b>ヒープソート（heapsort）</b>。
R: 第6回でヒープをやったときは「根に最小要素がある最小ヒープ」でしたよね？
S: よく覚えてるね！ でも今回は<b>配列 <code>a</code> の中だけで昇順（小さい順）に並べ替えたい</b>んだ。そこで第9回の講義では、根に<b>最大要素</b>が来る<b>「最大ヒープ（max heap）」</b>を使うよ（スライド 3）。`),
        cols(2,
          card('最小ヒープ条件（第6回）', '<strong>子の要素 ≥ 親の要素</strong><br>⇒ 根 <code>a[0]</code> に<strong>最小要素</strong>が来る', 'MIN HEAP'),
          card('最大ヒープ条件（今回・第9回）', '<strong>子の要素 ≤ 親の要素</strong><br>⇒ 根 <code>a[0]</code> に<strong>最大要素</strong>が来る', 'MAX HEAP')),
        talk(`R: 配列 <code>a</code> での親子関係の添字は第6回と同じですか？
S: まったく同じ！
・<code>a[0]</code> ← 根の要素
・<code>a[2i + 1]</code> ← 節点 $i$ の<b>左の子</b>の要素
・<code>a[2i + 2]</code> ← 節点 $i$ の<b>右の子</b>の要素
・節点 $i$ の<b>親</b>は $\\lfloor(i - 1)/2\\rfloor$（特に最後尾 $n-1$ の親は $\\lfloor n/2 \\rfloor - 1$）
R: 最大ヒープへの挿入 <code>INSERT(x, A)</code> と削除 <code>DELETEMAX(A)</code> はどう動くんですか？
S: 不等号の向きが逆になるだけだよ（スライド 4〜5）：
・<b>INSERT(x, A)</b>：とりあえず最後尾に入れ、<b>上に向かって</b>親と比較し、親より大きければ交換する。
・<b>DELETEMAX(A)</b>：根（最大）を取り出し、最後尾の要素をとりあえず根に入れ、<b>下に向かって</b>最大ヒープ条件を確認する。この「下に向かって大きい方の子と交換していく操作」を <b><code>DOWNMAX</code></b> と呼ぶ！
S: そして超重要なポイント（スライド 5 右）：<b><code>DOWNMAX(i, A)</code> は根（$i=0$）だけでなく、ある節点 $i$ を根とする部分木に対しても実行できる</b>んだ。下のラボで両方試してみよう！`),
        maxHeapOpsLab(),
        point('<b>最大ヒープ条件：子の要素 ≤ 親の要素</b>（根 <code>a[0]</code> が最大）。<b>DOWNMAX(i, A)</b> は節点 $i$ を根とする部分木で、親と<b>大きい方の子</b>を比較・交換しながら下へたどって最大ヒープ条件を回復する操作。'),
      ),
    },
    {
      id: 'naive-build', k: 'BUILD 1', title: 'ヒープソートの全体像と簡易版のヒープ構成',
      build: (el) => el.append(
        talk(`S: ヒープソートの全体像（スライド 6）を確認しよう。入力は $n$ 個の要素を格納した配列 <code>a</code>、出力は各要素が<b>昇順</b>に格納された配列 <code>a</code>。<b>安定性は「無」</b>で、手順は次の 2 段階に分かれるよ。`),
        cols(2,
          card('手順 1：配列 a から最大ヒープを構成', '・方法1：各要素を順番に挿入（<strong>簡易版</strong>）→ <strong>O(n log₂ n)</strong><br>・方法2：配列全体をヒープ化（<strong>Heapify</strong>）→ <strong>O(n)</strong>', 'STEP 1'),
          card('手順 2：最大要素を取出して並べていく', '根の最大要素 <code>a[0]</code> を末尾 <code>a[i]</code> と交換し、ヒープを縮めて <code>DOWNMAX(0, A)</code> を繰り返す → <strong>O(n log₂ n)</strong>', 'STEP 2')),
        talk(`R: 手順 1 に「方法 1（簡易版）」と「方法 2（Heapify）」の 2 種類があるんですね！ まずは<b>方法 1：簡易版（スライド 7）</b>から教えてください。
S: 簡易版はすごく素直だよ。別の配列を用意するわけではなく、同じ配列 <code>a</code> の先頭から順番にヒープの範囲を広げていく：
1. $i \\leftarrow 0$ とする
2. <code>a[i]</code> をヒープに挿入（<code>a[0]</code>〜<code>a[i]</code> で最大ヒープ条件が満たされるように、上に向かって <code>INSERT</code> と同じ並び換えを行う）
3. $i \\leftarrow i + 1$ とし、$i = n$ となるまで手順 2 と 3 を繰り返す`),
        naiveBuildLab(),
        talk(`R: 簡易版の時間計算量 $T(n)$ はどう導出するんですか？（スライド 8）
S: 簡単のため、すべて挿入すると完全二分木になる $n = 2^h - 1$ の場合を考えるよ（スライド 8 の記号）。各 <code>a[i]</code> を挿入するときの<b>ヒープの高さ $h_i$</b> に強く依存するから：`),
        formula('T(n) = \\sum_{i=0}^{n-1} O(h_i) = O\\!\\left(\\sum_{i=0}^{n-1} h_i\\right) = O(H(n))'),
        formula('H(n) = 0 + \\underbrace{1 + 1}_{2\\text{個}} + \\underbrace{2 + \\dots + 2}_{4\\text{個}} + \\dots + \\underbrace{h + \\dots + h}_{2^h\\text{個}} = \\sum_{k=1}^{h} 2^k k < \\int_0^h 2^x x\\,\\mathrm{d}x \\le \\frac{2\\cdot 2^h h}{\\log 2} = O(n \\log_2 n)'),
        talk(`R[oops]: 下の段に行くほど節点の数が $2, 4, 8, \\dots, 2^h$ 個と倍々に増えるから、<b>「高さ $h$ が一番高いときの挿入」が一番多く実行される</b>んですね…！
S: まさにそこが簡易版の欠点（スライド 8）！ 「だったら逆に、下の低い部分木から順番に作ればいいじゃないか」と考えたのが次の <b>Heapify</b> なんだ。`),
        point('ヒープ構成の<b>簡易版</b>：<code>i = 0 → n−1</code> の順に上向き挿入を行う。時間計算量は挿入時のヒープの高さ $h_i$ に依存し、<b>高さが高いときの操作が多い</b>ため <b>$O(n \\log_2 n)$</b>（一般に実用では使わない）。'),
      ),
    },
    {
      id: 'heapify', k: 'BUILD 2', title: '効率的なヒープ構成：Heapify と O(n) の秘密',
      build: (el) => el.append(
        talk(`S: ここからが第9回の最重要テーマ、<b>方法 2：Heapify（スライド 9）</b>！ 課題レポートの問題 1・2・4・6・8 でも直接問われるよ。
R: Heapify はどういう順番で動かすんですか？
S: 手順は次の通り（スライド 9）：
1. <b>$i \\leftarrow \\lfloor n/2 \\rfloor - 1$</b> とする（$i$ は最後尾の節点 $n-1$ の<b>親の節点番号</b>！）
2. <b><code>DOWNMAX(i, A)</code></b> を実行（節点 $i$ を根とする部分木に対して、最大ヒープ条件を満たすように下向きに並び換え。時間計算量は節点 $i$ 以下の部分木の高さ $h'_i$ を用いて $O(h'_i)$）
3. $i \\leftarrow i - 1$ とする
4. $i = 0$ の処理が終わるまで手順 2 と 3 を繰り返す
R[wow]: なんで途中の $\\lfloor n/2 \\rfloor - 1$ から始めていいんですか！？ 後ろ半分の節点 $\\lfloor n/2 \\rfloor \\sim n-1$ は放置でいいんですか？
S: 後ろ半分の節点は<b>すべて「子を持たない葉」</b>だから！ 葉 1 個だけの部分木は、何もしなくても最初から最大ヒープ条件を満たしているよね。だから葉の 1 段上（最後尾の親 $i = \\lfloor n/2 \\rfloor - 1$）から $i = 0$ へ向かって逆順に <code>DOWNMAX(i, A)</code> をかけるだけで、ボトムアップに木全体が最大ヒープになるんだ！`),
        heapifyLab(),
        talk(`R: すごい…！ $n = 10$ なら $\\lfloor 10/2 \\rfloor - 1 = 4$ から、$n = 13$ なら $\\lfloor 13/2 \\rfloor - 1 = 5$ から、$n = 17$ なら $\\lfloor 17/2 \\rfloor - 1 = 7$ からスタートするんですね。
S: そう！ そして Heapify の時間計算量 $T'(n)$ がなぜ <b>$O(n)$</b> になるのか、スライド 10 の式を見てみよう。節点 $0$ から $\\lfloor n/2 \\rfloor - 1$ までを根とする<b>部分木の高さ $h'_i$ に大きく依存</b>する：`),
        formula("T'(n) = \\sum_{i=0}^{\\lfloor n/2 \\rfloor - 1} O(h'_i) = O\\!\\left(\\sum_{i=0}^{\\lfloor n/2 \\rfloor - 1} h'_i\\right) = O(H'(n))"),
        formula("H'(n) = \\underbrace{h}_{1\\text{個}} + \\underbrace{(h-1) + (h-1)}_{2\\text{個}} + \\dots + \\underbrace{1 + \\dots + 1}_{2^{h-1}\\text{個}} = \\sum_{k=1}^{h} 2^{h-k} k < \\int_0^h 2^{h-x+1} x\\,\\mathrm{d}x \\le \\frac{2\\cdot 2^h}{(\\log 2)^2} = \\frac{2(n+1)}{(\\log 2)^2} = O(n)"),
        talk(`R[happy]: 簡易版の式と真逆になってる！！
・高さ $h$ の操作は根の<b>たった 1 個</b>だけ
・逆に一番個数が多い $2^{h-1}$ 個の節点は<b>「高さ 1 の低い部分木」</b>に対する操作！
だから合計しても $O(n)$ で済むんですね！ 下のラボでスライダーを動かして見比べてみよう。`),
        complexityCompareLab(),
        callout('warn', '課題 8 の引っかけポイント整理！', '<p>・<b>空間計算量</b>：簡易版も Heapify も同じ配列 <code>a</code> 内で要素を交換するだけなので、空間計算量のオーダは<b>同じ</b>（Heapify の方が大きいというのは<b>誤り</b>）。<br>・<b>高さへの依存</b>：簡易版は挿入時のヒープ高さ $h_i$ に依存し、Heapify も部分木の高さ $h\'_i$ に大きく依存する（「Heapify の時間計算量はヒープの高さに依存しない」は<b>誤り</b>）。<br>・<b>正しい特徴</b>：<b>Heapify は簡易版に比べて、高さの低いヒープ（部分木）に対する操作が多い</b>！</p>'),
        point('<b>Heapify</b> は $i = \\lfloor n/2 \\rfloor - 1$ から $0$ へ逆順に <code>DOWNMAX(i, A)</code> を実行する。<b>高さの低い部分木に対する実行が多い</b>ため、時間計算量は簡易版より小さい <b>$O(n)$</b>！'),
      ),
    },
    {
      id: 'extract', k: 'SORTING', title: '最大要素を取出して並べる手順（ヒープソートの完成）',
      build: (el) => el.append(
        talk(`S: 最大ヒープが完成したら、いよいよ<b>手順 2：ヒープから最大要素を取出して並べる（スライド 11）</b>だよ！ 課題レポートの問題 3・5・7 で「<b>$i = 5$ までの処理が終わった後の配列</b>」が聞かれているから、1 ステップの定義を完璧に押さえよう。`),
        callout('def', 'スライド 11：ヒープ構成後の手順', '<p>1. <b><code>i ← n − 1</code></b> とする<br>2. <b>最大要素 <code>a[0]</code> と <code>a[i]</code> を交換</b><br>3. <b>節点 <code>i</code> をヒープから削除</b>（これ以降 <code>a[i]</code> は確定した昇順部分になり、ヒープの範囲は <code>a[0]</code>〜<code>a[i−1]</code> になる）<br>4. <b><code>DOWNMAX(0, A)</code> を実行</b>（最大ヒープ条件が <code>a[0]</code> から <code>a[i−1]</code> で満たされるように並び換え）<br>5. <b><code>i ← i − 1</code></b> とする<br>6. <b><code>i = 1</code> の処理が終わるまで</b>手順 2〜5 を繰り返す</p>'),
        talk(`R: なぜ最大ヒープを使うと<b>昇順（小さい順）</b>に並ぶんですか？
S: 最大要素 <code>a[0]</code> を取り出して、まず一番右端 <code>a[n−1]</code> に置く。次に 2 番目に大きい要素を <code>a[n−2]</code> に置く…と<b>後ろ（右端）から大きい順に詰めていく</b>から、全部終わると左から右へ<b>昇順</b>に並んでいる！ 余分な出力配列もいらない一石二鳥のアイデアなんだ。
R[think]: 「<b>$i = 5$ までの処理が終わった後</b>」というのは、どの時点のことですか？
S: <code>i = n−1, n−2, …, 5</code> の各回について、<b>「② <code>a[0]</code> と <code>a[i]</code> を交換 → ③ 節点 <code>i</code> をヒープから削除 → ④ <code>a[0..i−1]</code> に対する <code>DOWNMAX(0, A)</code>」までが完了した直後</b>（次に $i = 4$ に入る直前）の状態だよ！
S: この時点で <code>a[5], a[6], …, a[n−1]</code> には大きい方から $n - 5$ 個の要素が昇順に確定していて、残りの <code>a[0]〜a[4]</code>（5 個）は最大ヒープになっている。下のトレーサの「<b>i = 5 終了後</b>」ボタンで一発で確認できるよ！`),
        heapSortFullLab(),
        point('最大要素取出フェーズ（スライド 11）：各 $i = n-1, \\dots, 1$ で「<b><code>a[0]</code> と <code>a[i]</code> を交換 → 節点 $i$ をヒープから除外 → <code>a[0..i-1]</code> で <code>DOWNMAX(0, A)</code></b>」を行う。時間計算量は <b>$O(n \\log_2 n)$</b>。'),
      ),
    },
    {
      id: 'summary', k: 'SUMMARY', title: 'ヒープソートの特性・安定性・まとめ',
      build: (el) => el.append(
        talk(`S: 最後に、ヒープソート全体の時間計算量と特性をまとめよう（スライド 6, 20）。
R: Heapify でヒープ構成を $O(n)$ に速くしたのに、ヒープソート全体の時間計算量は $O(n \\log_2 n)$ のままなんですか？
S: そう。第2回で習った<b>性質 A（和のオーダは大きい方で決まる）</b>を思い出そう：
・手順 1（Heapify）：$O(n)$
・手順 2（最大要素の取出 $n-1$ 回）：$O(n \\log_2 n)$
だから全体は $O(n) + O(n \\log_2 n) = \\mathbf{O(n \\log_2 n)}$ になる。それでも手順 1 の定数・実測コストが大幅に減るから、実用上は簡易版ではなく<b>必ず Heapify を使う</b>よ（スライド 20 でも簡易版には取消線が引かれているね）。
R: 最悪・平均・最良でオーダは変わりますか？
S: ヒープは常に完全二分木に近い形を保つから、どんな入力が来ても<b>最悪・平均・最良すべて同じ $O(n \\log_2 n)$</b>！ これは次回以降やるクイックソート（最悪 $O(n^2)$）にはない大きな強みなんだ。
R: 安定性については「Heapify なら安定になる」ということはないんですか？
S: <b>ない！</b> 簡易版でも Heapify でも、手順 2 で根 <code>a[0]</code> と末尾 <code>a[i]</code> を長距離交換した瞬間に同じ値の前後関係が壊れる。下のラボで反例を確かめておこう！`),
        heapStabilityLab(),
        h('div.reveal', table(
          ['項目', '簡易版を用いたヒープソート', 'Heapify を用いたヒープソート（標準）'],
          [
            ['手順 1：ヒープ構成', '<code>i = 0 → n−1</code> に <code>INSERT</code>：<b>O(n log₂ n)</b><br><small>※高さが高いときの挿入が多い</small>', '<code>i = ⌊n/2⌋−1 → 0</code> に <code>DOWNMAX</code>：<b class="lime">O(n)</b><br><small>※高さの低い部分木への操作が多い</small>'],
            ['手順 2：最大要素の取出', '<code>i = n−1 → 1</code> に交換＋<code>DOWNMAX(0, A)</code>：<b>O(n log₂ n)</b>', '同じ：<b>O(n log₂ n)</b>'],
            ['全体の時間計算量', '最悪・平均・最良 <b>O(n log₂ n)</b>', '最悪・平均・最良 <b>O(n log₂ n)</b>'],
            ['追加の空間計算量', '<b>O(1)</b>（配列 a 内で完結）', '<b>O(1)</b>（配列 a 内で完結）'],
            ['安定性', '<b class="rose">無</b>', '<b class="rose">無</b>'],
          ],
        )),
        point('ヒープソートまとめ：<b>Heapify は $O(n)$</b>、<b>最大要素取出は $O(n \\log_2 n)$</b> で、全体の時間計算量は<b>最悪・平均・最良すべて $O(n \\log_2 n)$</b>。安定性は<b>「無」</b>。'),
      ),
    },
  ],
  quiz: [
    {
      kind: 'choice', tag: '最大ヒープ',
      q: 'ヒープソート（昇順整列）で用いる「最大ヒープ」が満たすべき大小条件と、根 a[0] に入る要素の組み合わせとして正しいものは？',
      opts: [
        '子の要素 ≤ 親の要素 ／ 根 a[0] に最大要素が入る',
        '子の要素 ≥ 親の要素 ／ 根 a[0] に最小要素が入る',
        '左の子 < 親 < 右の子 ／ 根 a[0] に中央値が入る',
        '左の子 ≤ 右の子 ／ 根 a[0] に最小要素が入る',
      ],
      answer: 0,
      explain: '最大ヒープ条件は「子の要素 ≤ 親の要素」であり、根 a[0] に最大要素が格納される（スライド 3）。これを末尾 a[i] と交換していくことで配列全体を昇順に整列できる。',
    },
    {
      kind: 'input', tag: 'Heapify',
      q: '要素数 n = 17 の配列 a に対して Heapify（スライド 9）を実行するとき、最初に DOWNMAX(i, A) を実行する節点番号 i はいくつか？（数字のみ）',
      answer: '7',
      explain: '最後尾 n−1 = 16 の親である i = ⌊17 / 2⌋ − 1 = 8 − 1 = 7 から開始し、7, 6, 5, …, 0 の順に DOWNMAX(i, A) を実行する。',
    },
    {
      kind: 'input', tag: 'Heapify',
      q: '配列 a = (14, 45, 77, 70, 73, 43, 80) に対して Heapify を実行し、DOWNMAX(0, A) まで完了した直後の配列を空白区切りで答えよ。',
      answer: '80 73 77 70 45 43 14',
      explain: 'i=2 で 77 と 80 を交換 → [14 45 80 70 73 43 77]、i=1 で 45 と 73 を交換 → [14 73 80 70 45 43 77]、i=0 で 14→80→77 と交換 → [80 73 77 70 45 43 14]（スライド 12〜13）。',
    },
    {
      kind: 'input', tag: '最大要素取出',
      q: '最大ヒープ a = (80, 73, 77, 70, 45, 43, 14) に対してスライド 11 の最大要素取出を 1 回（i = 6 の処理）実行した直後の配列を空白区切りで答えよ。',
      answer: '77 73 43 70 45 14 80',
      explain: 'a[0]=80 と a[6]=14 を交換して 80 を確定させた後、a[0..5] で DOWNMAX(0, A) を実行すると 14 が 77（節点2）、43（節点5）と順に交換されて [77 73 43 70 45 14 80] になる（スライド 14）。',
    },
    {
      kind: 'choice', tag: '計算量',
      q: '要素数 n の配列に対する「ヒープ構成（簡易版）」「ヒープ構成（Heapify）」「ヒープソート全体」の時間計算量の組み合わせとして正しいものは？',
      opts: [
        '簡易版: O(n log₂ n) ／ Heapify: O(n) ／ ヒープソート全体: O(n log₂ n)',
        '簡易版: O(n²) ／ Heapify: O(n log₂ n) ／ ヒープソート全体: O(n log₂ n)',
        '簡易版: O(n log₂ n) ／ Heapify: O(n) ／ ヒープソート全体: O(n)',
        '簡易版: O(n) ／ Heapify: O(log₂ n) ／ ヒープソート全体: O(n log₂ n)',
      ],
      answer: 0,
      explain: '簡易版は O(n log₂ n)、Heapify は O(n)。手順 2 の最大要素取出に O(n log₂ n) かかるため、ヒープソート全体は O(n log₂ n) となる（スライド 6, 20）。',
    },
    {
      kind: 'multi', tag: '比較・特性',
      q: 'ヒープを構成する 2 つの方法（簡易版と Heapify）およびヒープソートの性質として【正しいもの】をすべて選べ。',
      opts: [
        'Heapify は簡易版に比べて、高さの低い部分木（ヒープ）に対する操作が多い',
        'ヒープソートの時間計算量は、最悪・平均・最良のどの場合でも O(n log₂ n) である',
        'Heapify は簡易版に比べて空間計算量のオーダが大きい',
        'Heapify を用いたヒープソートは安定性がある',
      ],
      answer: [0, 1],
      explain: '1 と 2 が正しい。両方とも配列内で in-place に動作するため空間計算量のオーダは同じであり（3 は誤り）、どちらの方法でもヒープソートに安定性はない（4 は誤り）。',
    },
  ],
}
