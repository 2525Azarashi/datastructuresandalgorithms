import { h, s, svgRoot, lab, Player, stat, callout, card, cols, formula, table, seg, parseNums, range, toast, talk, point } from '../lib/ui.js'
import { codeView } from '../lib/code.js'
import { layoutBinary, drawGraph, setNodeClass } from '../lib/viz.js'

/* ---------------------------------------------------------
   第10回  整列のアルゴリズム(3): クイックソート
   --------------------------------------------------------- */

const CODE_LOMUTO = `int partition(int a[], int l, int r)
{
  int i, j;
  int pivot = a[r]; // ピボットを右端にする

  i = l-1;
  for (j = l; j < r; j++) {
    if (a[j] < pivot) {
      i++; // ピボットより小さい場合に i を増やす
      swap(&a[i], &a[j]); // また，要素を入れ替え
    }
  }
  int q = i+1; // ピボットの格納位置 q が決定
  swap(&a[q], &a[r]); // ピボットを間に持ってくる

  return q; // ピボットの格納位置 q を返す
}`

const CODE_HOARE = `int partitionH(int a[], int l, int r)
{
  int i,j;
  int pivot = a[r]; // ピボットを右端にする
  i = l-1; j = r;
  while(1) {
    do {
      i++; // ピボットより小さい間，i を増やす
    } while (a[i] < pivot);

    do {
      j--; // ピボットより大きい間，j を減らす
    } while (a[j] > pivot);

    if (i > j)
      break; // ループを抜ける

    swap(&a[i], &a[j]); // 要素を入れ替え
  }
  int q = i; // ピボットの格納位置 q が決定
  swap(&a[q], &a[r]); // ピボットを間に持ってくる
  return q; // ピボットの格納位置 q を返す
}`

/**
 * 分割配列の棒グラフ＋セル＋区切り線（スライド 8, 9, 11, 12 再現用）を SVG で描画
 * - zones: 'lt' (<p, 空色), 'ge' (≥p, 薄オレンジ), 'piv' (ピボット, 黄色), 'ok' (確定済, ミント), 'dim' (範囲外)
 * - dividers: セル i と i+1 の間に縦区切り線を入れる添字リスト（-1 なら先頭左）
 * - swapArc: [idx1, idx2] 交換アーク矢印
 */
function qsBars(a, {
  zone = () => '',
  ptrs = {},
  dividers = [],
  swapArc = null,
  activeRange = null,
  W = 560,
  H = 205,
} = {}) {
  const n = a.length || 1
  const mx = Math.max(1, ...a.map((v) => Math.abs(v)))
  const padX = 24, topY = 28, barMaxH = 88, cellY = topY + barMaxH + 8, cellH = 32
  const slotW = (W - padX * 2) / n
  const bw = Math.max(14, Math.min(42, slotW - 6))
  const svg = svgRoot(W, H, { class: 'sort-svg', role: 'img', 'aria-label': '配列の分割状態' })

  // 操作対象範囲 [l, r] の背景ハイライト
  if (activeRange && activeRange[0] <= activeRange[1]) {
    const [al, ar] = activeRange
    const rx = padX + al * slotW + 1
    const rw = (ar - al + 1) * slotW - 2
    svg.appendChild(s('rect', {
      x: rx, y: topY - 6, width: Math.max(4, rw), height: barMaxH + cellH + 20,
      rx: 10, fill: 'rgba(255, 210, 63, 0.12)', stroke: 'rgba(61,46,84,0.22)', 'stroke-width': 1.5, 'stroke-dasharray': '4 3',
    }))
  }

  const COLORS = {
    lt: ['#d8eeff', '#3d2e54'],
    ge: ['#ffe0cc', '#3d2e54'],
    piv: ['#ffd23f', '#3d2e54'],
    cur: ['#ff8a3d', '#ffffff'],
    bad: ['#ff5c8a', '#ffffff'],
    ok: ['#2fbf71', '#ffffff'],
    fixed: ['#d3f5e2', '#0f7d47'],
    dim: ['#f4efe8', '#9c92ad'],
  }

  a.forEach((v, idx) => {
    const cx = padX + (idx + 0.5) * slotW
    const bh = Math.max(8, Math.round((Math.abs(v) / mx) * (barMaxH - 10)))
    const by = topY + barMaxH - bh
    const z = zone(idx) || ''
    const [fill, txtFill] = COLORS[z] || ['#ffffff', '#3d2e54']
    const strokeOp = z === 'dim' ? 0.35 : 1
    svg.appendChild(s('rect', { x: cx - bw / 2, y: by, width: bw, height: bh, rx: 6, fill, stroke: '#3d2e54', 'stroke-width': 2, 'stroke-opacity': strokeOp }))
    svg.appendChild(s('rect', { x: cx - bw / 2, y: cellY, width: bw, height: cellH, rx: 8, fill, stroke: '#3d2e54', 'stroke-width': 2, 'stroke-opacity': strokeOp }))
    svg.appendChild(s('text', { x: cx, y: cellY + cellH / 2 + 1, fill: txtFill, 'font-family': 'var(--f-mono)', 'font-size': bw < 26 ? 11 : 13, 'font-weight': 700, 'text-anchor': 'middle', 'dominant-baseline': 'central', text: String(v) }))
    svg.appendChild(s('text', { x: cx, y: cellY + cellH + 13, fill: '#8a7f9e', 'font-family': 'var(--f-mono)', 'font-size': 10, 'text-anchor': 'middle', text: String(idx) }))
  })

  // スライド 9 / 12 の縦区切りバー `|`（セル d の右端、d=-1 なら先頭左端）
  dividers.forEach((d) => {
    const x = padX + (d + 1) * slotW
    svg.appendChild(s('line', {
      x1: x, y1: cellY - 6, x2: x, y2: cellY + cellH + 6,
      stroke: '#cf2560', 'stroke-width': 3, 'stroke-linecap': 'round',
    }))
  })

  // swap アーク矢印
  if (swapArc && swapArc[0] !== swapArc[1]) {
    const [u, v] = swapArc
    const x1 = padX + (Math.min(u, v) + 0.5) * slotW
    const x2 = padX + (Math.max(u, v) + 0.5) * slotW
    const cy = cellY + cellH + 17
    const midY = Math.min(H - 3, cy + 20)
    svg.appendChild(s('path', {
      d: `M${x1},${cy} Q${(x1 + x2) / 2},${midY} ${x2},${cy}`,
      fill: 'none', stroke: '#ff5c8a', 'stroke-width': 2.4, 'stroke-dasharray': '4 2',
    }))
  } else if (swapArc && swapArc[0] === swapArc[1]) {
    const x = padX + (swapArc[0] + 0.5) * slotW
    const cy = cellY + cellH + 18
    svg.appendChild(s('circle', { cx: x, cy, r: 5, fill: 'none', stroke: '#ff8a3d', 'stroke-width': 2 }))
  }

  // ポインタ表示 (i, j, q, p など)
  Object.entries(ptrs).forEach(([label, idx]) => {
    if (idx == null || idx < -1 || idx > n) return
    const cx = idx === -1 ? padX - 8 : idx === n ? W - padX + 8 : padX + (idx + 0.5) * slotW
    const isTop = label.includes('i') || label === 'l' || label === 'r'
    const col = label.includes('q') ? '#0f7d47' : label.includes('p') ? '#d4570e' : label.includes('j') ? '#cf2560' : '#1170b8'
    const y = isTop ? 14 : H - 6
    svg.appendChild(s('text', { x: cx, y, fill: col, 'font-family': 'var(--f-mono)', 'font-size': 11, 'font-weight': 700, 'text-anchor': 'middle', text: isTop ? `${label}↓` : `↑${label}` }))
  })

  return svg
}

/* --- 純粋な Lomuto / Hoare PARTITION ヘルパ（再帰トレーサ等と共通利用） --- */
function runLomutoPure(a, l, r) {
  const pivot = a[r]
  let i = l - 1, swaps = 0, comps = 0
  for (let j = l; j < r; j++) {
    comps++
    if (a[j] < pivot) {
      i++
      ;[a[i], a[j]] = [a[j], a[i]]
      swaps++
    }
  }
  const q = i + 1
  ;[a[q], a[r]] = [a[r], a[q]]
  swaps++
  return { q, pivot, swaps, comps }
}

function runHoarePure(a, l, r) {
  const pivot = a[r]
  let i = l - 1, j = r, swaps = 0, comps = 0
  while (true) {
    do { i++; comps++ } while (a[i] < pivot)
    do { j--; comps++ } while (j >= l && a[j] > pivot)
    if (i > j) break
    ;[a[i], a[j]] = [a[j], a[i]]
    swaps++
  }
  const q = i
  ;[a[q], a[r]] = [a[r], a[q]]
  swaps++
  return { q, pivot, swaps, comps }
}

/* ========== LAB 10-1: PARTITION の 3 分割シミュレータ（A: <p / B: =p / C: ≥p） ========== */
function partitionIdeaLab() {
  const inp = h('input.txt', { value: '29 15 69 64 98 84 85 28 20 34 10 7 38 97 47', 'aria-label': '配列 a', style: { width: '320px' } })
  let pivIdx = 0
  const stage = h('div.stage', { style: { padding: '14px' } })
  const sts = h('div.stats'), narr = h('div.narr')

  const draw = () => {
    const raw = parseNums(inp.value)
    const a = raw.length >= 2 ? raw.slice(0, 18) : [45, 14, 77, 43, 73, 80, 70]
    pivIdx = Math.max(0, Math.min(a.length - 1, pivIdx))
    const p = a[pivIdx]
    const partA = [], partC = []
    a.forEach((v, idx) => {
      if (idx === pivIdx) return
      if (v < p) partA.push(v)
      else partC.push(v)
    })
    const q = partA.length

    stage.innerHTML = ''
    stage.appendChild(h('div.arr-name', { style: { marginTop: 0 } }, '① 元の配列 a からピボット p = a[k] をクリックして選ぼう！'))
    const pickRow = h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' } },
      a.map((v, idx) => h('button.op', {
        class: idx === pivIdx ? '' : 'ghost',
        style: {
          minWidth: '46px', padding: '6px 8px',
          background: idx === pivIdx ? '#ffd23f' : '#fff',
          fontFamily: 'var(--f-mono)',
        },
        onclick: () => { pivIdx = idx; draw() },
      }, h('small', { style: { display: 'block', fontSize: '10px', opacity: 0.7 } }, `a[${idx}]`), String(v))))
    stage.appendChild(pickRow)

    stage.appendChild(h('div.arr-name', `② PARTITION 後の 3 つの部分（A: p より小さい ${partA.length} 個 ／ B: a[q]=p ／ C: p 以上の ${partC.length} 個）`))
    const resultRow = h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'stretch', marginTop: '6px' } })
    const makeGroup = (label, items, bg, borderCol, startIdx) => h('div', {
      style: {
        background: bg, border: `2px solid ${borderCol}`, borderRadius: '14px', padding: '8px 10px',
        display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '64px',
      },
    },
    h('div', { style: { fontSize: '11.5px', fontWeight: 800, color: '#3d2e54' } }, label),
    h('div', { style: { display: 'flex', gap: '5px', flexWrap: 'wrap' } },
      items.length
        ? items.map((v, k) => h('span', {
          style: {
            display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
            padding: '4px 8px', borderRadius: '8px', background: '#fff', border: '1.8px solid #3d2e54',
            fontFamily: 'var(--f-mono)', fontWeight: 700, fontSize: '13px',
          },
        }, h('small', { style: { fontSize: '9.5px', color: '#8a7f9e' } }, `[${startIdx + k}]`), String(v)))
        : h('span', { style: { fontSize: '12px', color: '#8a7f9e', padding: '4px 6px' } }, '空 (0個)')))

    resultRow.append(
      makeGroup(`部分 A (< ${p})`, partA, '#d8eeff', '#3d2e54', 0),
      makeGroup(`部分 B (q = ${q})`, [p], '#ffd23f', '#3d2e54', q),
      makeGroup(`部分 C (≥ ${p})`, partC, '#ffe0cc', '#3d2e54', q + 1),
    )
    stage.appendChild(resultRow)

    sts.innerHTML = ''
    sts.append(
      stat('選択ピボット p', `a[${pivIdx}] = ${p}`, 'hl'),
      stat('部分 A (< p) の要素数', `${partA.length}<small>個</small>`, 'cy'),
      stat('ピボット格納位置 q', `q = ${q}`, 'li'),
      stat('部分 C (≥ p) の要素数', `${partC.length}<small>個</small>`),
    )
    narr.innerHTML = `ピボット <code>p = a[${pivIdx}] = ${p}</code> より<b>小さい要素がちょうど ${partA.length} 個</b>あるため、どのような順序で並んでいたとしても（すべての要素が異なるとき）PARTITION 終了後のピボットの格納位置は必ず <b class="l"><code>q = ${q}</code></b>（小さい方から数えて 0 始まりで ${q} 番目）に決まる！`
  }

  const preset = (v, idx) => () => { inp.value = v; pivIdx = idx; draw() }
  inp.addEventListener('change', () => { pivIdx = 0; draw() })

  const root = lab({
    title: 'LAB 10-1 — 3分割（A・B・C）とピボット格納位置 q エクスプローラ（スライド 4・課題 7 対応）',
    hint: '任意の要素をクリックしてピボット p にすると、格納位置 q がどう決まるか確認しよう！',
    body: h('div',
      h('div.ctrl-row',
        h('div.field', h('label', '配列 a ='), inp),
        h('button.op', { onclick: () => draw() }, '反映'),
        h('button.op.ghost', { onclick: preset('45 14 77 43 73 80 70', 6) }, '講義スライド4 (n=7, p=a[6])'),
        h('button.op.ghost', { onclick: preset('29 15 69 64 98 84 85 28 20 34 10 7 38 97 47', 0) }, '課題7 (n=15, q=5 を探す)')),
      h('div.sep'),
      stage,
      h('div', { style: { display: 'grid', gap: '10px', marginTop: '12px' } }, sts, narr)),
  })
  pivIdx = 0
  draw()
  return root
}

/* ========== LAB 10-2: Lomuto 法 PARTITION(a, l, r) 完全トレーサ（スライド 8〜9） ========== */
function lomutoLab() {
  const inp = h('input.txt', { value: '45 14 77 43 73 80 70', 'aria-label': '配列 a', style: { width: '250px' } })
  const code = codeView(CODE_LOMUTO, { counts: true })
  const svgBox = h('div.stage', { style: { padding: '8px' } })
  const sts = h('div.stats'), narr = h('div.narr'), logTbl = h('div')
  const root = h('div')

  const render = (f) => {
    svgBox.innerHTML = ''
    svgBox.appendChild(qsBars(f.a, {
      zone: (k) => {
        if (f.done) return k < f.q ? 'lt' : k === f.q ? 'ok' : 'ge'
        if (k === f.r) return 'piv'
        if (f.swapArc && (k === f.swapArc[0] || k === f.swapArc[1])) return 'cur'
        if (k === f.j && f.phase === 'cmp') return 'cur'
        if (k <= f.i) return 'lt'
        if (k < f.scanEnd) return 'ge'
        return ''
      },
      ptrs: f.ptrs,
      dividers: f.dividers,
      swapArc: f.swapArc,
    }))
    code.cur(f.line)
    code.counts(f.cnts)
    sts.innerHTML = ''
    sts.append(
      stat('ピボット p = a[r]', String(f.p), 'hl'),
      stat('i / j', `i = ${f.i}, j = ${f.j ?? '—'}`, 'cy'),
      stat('要素比較 NL', `${f.comps}<small>回</small>`),
      stat('swap 実行回数', `${f.swaps}<small>回</small>`, 'li'),
    )
    narr.innerHTML = f.msg
  }
  const player = new Player({ interval: 800, keyTarget: root, render })

  const build = () => {
    const raw = parseNums(inp.value)
    const a = (raw.length >= 2 ? raw.slice(0, 16) : [45, 14, 77, 43, 73, 80, 70]).slice()
    const l = 0, r = a.length - 1
    const p = a[r]
    let i = l - 1, comps = 0, swaps = 0
    const cnts = {}
    const bump = (ln) => { cnts[ln] = (cnts[ln] || 0) + 1 }
    const F = []
    const rows = []
    const push = (extra) => F.push({ a: a.slice(), r, p, i, comps, swaps, cnts: { ...cnts }, ...extra })

    bump(4); bump(6)
    push({
      j: l, scanEnd: l, line: 6, ptrs: { i: -1, j: 0, 'p=a[r]': r }, dividers: [-1],
      msg: `<b>初期化</b>：右端 <code>pivot = a[${r}] = ${p}</code>、<code>i = l - 1 = -1</code>、<code>j = 0</code> から走査スタート！`,
    })

    for (let j = l; j < r; j++) {
      bump(7); bump(8); comps++
      const yes = a[j] < p
      push({
        j, scanEnd: j, phase: 'cmp', line: 8,
        ptrs: i === j ? { 'i,j': j, p: r } : { i, j, p: r },
        dividers: [i, j],
        msg: `<code>j = ${j}</code>：<code>a[${j}] = ${a[j]} &lt; ${p}</code> か判定 → <b>${yes ? 'Yes（小さい！）' : 'No（ピボット以上）'}</b>`,
      })
      if (yes) {
        bump(9); i++
        const beforeI = a[i], beforeJ = a[j]
        bump(10); [a[i], a[j]] = [a[j], a[i]]; swaps++
        rows.push([String(i - 1), String(j), a.map((v, k) => (k === i || k === j ? `<b>${v}</b>` : v)).join(' '), 'Yes', `<code>i++</code> → ${i}, <code>swap(a[${i}], a[${j}])</code>${i === j ? ' <small>(自分自身と交換)</small>' : ` (${beforeI}↔${beforeJ})`}`])
        push({
          j, scanEnd: j + 1, phase: 'swap', line: 10,
          ptrs: i === j ? { 'i,j': j, p: r } : { i, j, p: r },
          dividers: [i, j], swapArc: [i, j],
          msg: `<code>i</code> を <b>${i}</b> に増やし、<code>swap(a[${i}], a[${j}])</code> を実行！（<b>swap ${swaps} 回目</b>${i === j ? '：同じ位置同士でも 1 回カウント！' : ''}）`,
        })
      } else {
        rows.push([String(i), String(j), a.join(' '), 'No', '何もしない（部分 C が広がる）'])
        push({
          j, scanEnd: j + 1, phase: 'noswap', line: 7,
          ptrs: { i, j, p: r },
          dividers: [i, j],
          msg: `<code>a[${j}] = ${a[j]} ≥ ${p}</code> なので <code>i = ${i}</code> のまま次へ（部分 C に含める）。`,
        })
      }
    }

    const q = i + 1
    bump(13); bump(14); [a[q], a[r]] = [a[r], a[q]]; swaps++
    bump(16)
    rows.push([String(i), `${r} (終了)`, a.map((v, k) => (k === q ? `<b class="lime">|${v}|</b>` : v)).join(' '), '—', `<code>q = i+1 = ${q}</code>, <b>最後に <code>swap(a[${q}], a[${r}])</code></b>`])
    push({
      j: r, q, done: true, scanEnd: r, line: 14,
      ptrs: { [`q=${q}`]: q }, dividers: [q - 1, q], swapArc: [q, r],
      msg: `<b>for ループ終了！</b> <code>q = i + 1 = ${q}</code> とし、最後に <code>swap(a[${q}], a[${r}])</code> でピボット <b>${p}</b> を間に持ってくる（<b>合計 swap ${swaps} 回</b>・比較 ${comps} 回）→ <b class="l"><code>return q = ${q}</code></b>！`,
    })

    logTbl.innerHTML = ''
    logTbl.appendChild(table(['開始時 i', 'j', '操作後の配列 a', 'a[j] < p', '実行された操作'], rows))
    player.load(F)
  }

  const preset = (v) => () => { inp.value = v; build() }
  inp.addEventListener('change', build)

  root.append(lab({
    title: 'LAB 10-2 — Lomuto 法 PARTITION(a, l, r) 完全トレーサ（スライド 8〜9・課題 1〜3 対応）',
    hint: '空色 = A (<p)、薄オレンジ = C (≥p)、黄色 = ピボット p。i==j の自己 swap もカウント！',
    body: h('div',
      h('div.ctrl-row',
        h('div.field', h('label', '配列 a ='), inp),
        h('button.op', { onclick: build }, 'トレース生成'),
        h('button.op.ghost', { onclick: preset('45 14 77 43 73 80 70') }, '講義スライド9 (n=7)'),
        h('button.op.ghost', { onclick: preset('66 59 61 39 18 58 5 77 4 42') }, '課題1〜3 (n=10)'),
        h('button.op.ghost', { onclick: preset('1 1 1 1 1 1 1') }, '全要素同じ (1×7)')),
      h('div.sep'),
      h('div.lab-grid', svgBox, code),
      h('div', { style: { display: 'grid', gap: '10px', marginTop: '10px' } }, sts, narr),
      h('details', { style: { marginTop: '10px' } }, h('summary', { style: { cursor: 'pointer', fontWeight: 700, fontSize: '13px' } }, 'Lomuto 法の全ステップ実行表を開く'), logTbl)),
    foot: player.el,
  }))
  build()
  return root
}

/* ========== LAB 10-3: Hoare 法 PARTITION(a, l, r) 完全トレーサ（スライド 10〜12） ========== */
function hoareLab() {
  const inp = h('input.txt', { value: '45 14 77 43 73 80 70', 'aria-label': '配列 a', style: { width: '250px' } })
  const code = codeView(CODE_HOARE, { counts: true })
  const svgBox = h('div.stage', { style: { padding: '8px' } })
  const sts = h('div.stats'), narr = h('div.narr'), logTbl = h('div')
  const root = h('div')

  const render = (f) => {
    svgBox.innerHTML = ''
    svgBox.appendChild(qsBars(f.a, {
      zone: (k) => {
        if (f.done) return k < f.q ? 'lt' : k === f.q ? 'ok' : 'ge'
        if (k === f.r) return 'piv'
        if (f.swapArc && (k === f.swapArc[0] || k === f.swapArc[1])) return 'cur'
        if (k === f.i || k === f.j) return 'cur'
        if (k < f.i) return 'lt'
        if (k > f.j && k < f.r) return 'ge'
        return ''
      },
      ptrs: f.ptrs,
      dividers: f.dividers,
      swapArc: f.swapArc,
    }))
    code.cur(f.line)
    code.counts(f.cnts)
    sts.innerHTML = ''
    sts.append(
      stat('ピボット p = a[r]', String(f.p), 'hl'),
      stat('i / j', `i = ${f.i}, j = ${f.j}`, 'cy'),
      stat('要素比較 NL (9,13行目)', `${f.comps}<small>回</small>`),
      stat('swap 実行回数', `${f.swaps}<small>回</small>`, 'li'),
    )
    narr.innerHTML = f.msg
  }
  const player = new Player({ interval: 850, keyTarget: root, render })

  const build = () => {
    const raw = parseNums(inp.value)
    const a = (raw.length >= 2 ? raw.slice(0, 16) : [45, 14, 77, 43, 73, 80, 70]).slice()
    const l = 0, r = a.length - 1
    const p = a[r]
    let i = l - 1, j = r, comps = 0, swaps = 0
    const cnts = {}
    const bump = (ln) => { cnts[ln] = (cnts[ln] || 0) + 1 }
    const F = []
    const rows = []
    const push = (extra) => F.push({ a: a.slice(), r, p, i, j, comps, swaps, cnts: { ...cnts }, ...extra })

    bump(4); bump(5)
    push({
      line: 5, ptrs: { i: -1, 'j,p': r }, dividers: [-1, r],
      msg: `<b>初期化</b>：<code>pivot = a[${r}] = ${p}</code>、左ポインタ <code>i = -1</code>、右ポインタ <code>j = ${r}</code> から両端はさみうち開始！`,
    })

    while (true) {
      bump(6)
      do {
        bump(8); i++; bump(9); comps++
      } while (a[i] < p)
      push({
        line: 9, ptrs: i === j ? { 'i,j': i, p: r } : { i, j, p: r }, dividers: [i - 1],
        msg: `左から <code>a[i] &lt; ${p}</code> の間 <code>i++</code> を進め、<b><code>a[${i}] = ${a[i]} ≥ ${p}</code></b> で停止（<code>i = ${i}</code>）。`,
      })

      do {
        bump(12); j--; bump(13); comps++
      } while (j >= l && a[j] > p)
      push({
        line: 13, ptrs: i === j ? { 'i,j': i, p: r } : { i, j, p: r }, dividers: [i - 1, j],
        msg: `右から <code>a[j] &gt; ${p}</code> の間 <code>j--</code> を進め、<b><code>${j >= l ? `a[${j}] = ${a[j]} ≤ ${p}` : `j = ${j} (左端到達)`}</code></b> で停止（<code>j = ${j}</code>）。`,
      })

      bump(15)
      if (i > j) {
        bump(16)
        rows.push([`${i}`, `${j}`, a.join(' '), `<code>i &gt; j</code> (${i} &gt; ${j}) で <code>break</code>`])
        push({
          line: 16, ptrs: { j, i, p: r }, dividers: [j],
          msg: `<code>i = ${i} &gt; j = ${j}</code> とポインタが交差したので <b>while ループを脱出（break）</b>！`,
        })
        break
      }

      const bi = a[i], bj = a[j]
      bump(18); [a[i], a[j]] = [a[j], a[i]]; swaps++
      rows.push([`${i}`, `${j}`, a.map((v, k) => (k === i || k === j ? `<b>${v}</b>` : v)).join(' '), `<code>swap(a[${i}], a[${j}])</code> (${bi}↔${bj})`])
      push({
        line: 18, ptrs: i === j ? { 'i,j': i, p: r } : { i, j, p: r }, dividers: [i, j - 1], swapArc: [i, j],
        msg: `<code>i ≤ j</code> なので <code>swap(a[${i}], a[${j}])</code>（${bi} ↔ ${bj}）を実行！（<b>swap ${swaps} 回目</b>）`,
      })
    }

    const q = i
    bump(20); bump(21); [a[q], a[r]] = [a[r], a[q]]; swaps++
    bump(22)
    rows.push([`${q}`, `${j}`, a.map((v, k) => (k === q ? `<b class="lime">|${v}|</b>` : v)).join(' '), `<code>q = i = ${q}</code>, <b>最後に <code>swap(a[${q}], a[${r}])</code></b>`])
    push({
      q, done: true, line: 21, ptrs: { [`q=${q}`]: q }, dividers: [q - 1, q], swapArc: [q, r],
      msg: `<code>q = i = ${q}</code> とし、21行目で <code>swap(a[${q}], a[${r}])</code> を実行してピボット <b>${p}</b> を間に配置！（<b>合計 swap ${swaps} 回</b>・比較 ${comps} 回）→ <b class="l"><code>return q = ${q}</code></b>！`,
    })

    logTbl.innerHTML = ''
    logTbl.appendChild(table(['i', 'j', '配列 a の状態', '操作'], rows))
    player.load(F)
  }

  const preset = (v) => () => { inp.value = v; build() }
  inp.addEventListener('change', build)

  root.append(lab({
    title: 'LAB 10-3 — Hoare 法 PARTITION(a, l, r) 完全トレーサ（スライド 10〜12・課題 4〜6 対応）',
    hint: '左右から i++, j-- で挟み撃ち！ 最後に swap(a[q], a[r]) を行う講義版疑似コード完全準拠',
    body: h('div',
      h('div.ctrl-row',
        h('div.field', h('label', '配列 a ='), inp),
        h('button.op', { onclick: build }, 'トレース生成'),
        h('button.op.ghost', { onclick: preset('45 14 77 43 73 80 70') }, '講義スライド12 (n=7)'),
        h('button.op.ghost', { onclick: preset('66 59 61 39 18 58 5 77 4 42') }, '課題4〜6 (n=10)'),
        h('button.op.ghost', { onclick: preset('1 1 1 1 1 1 1') }, '全要素同じ (1×7)')),
      h('div.sep'),
      h('div.lab-grid', svgBox, code),
      h('div', { style: { display: 'grid', gap: '10px', marginTop: '10px' } }, sts, narr),
      h('details', { style: { marginTop: '10px' } }, h('summary', { style: { cursor: 'pointer', fontWeight: 700, fontSize: '13px' } }, 'Hoare 法のステップ一覧表を開く'), logTbl)),
    foot: player.el,
  }))
  build()
  return root
}

/* ========== LAB 10-4: 全要素等しいときの Lomuto 法 vs Hoare 法 同時比較（スライド 13〜14） ========== */
function equalElementsCompareLab() {
  let presetKey = 'equal7'
  const stage = h('div.stage', { style: { padding: '14px' } })
  const narr = h('div.narr')

  const PRESETS = {
    equal7: { label: '全要素が等しい [1, 1, 1, 1, 1, 1, 1]（スライド 13〜14）', arr: [1, 1, 1, 1, 1, 1, 1] },
    equal10: { label: '全要素が等しい（要素数 10）', arr: Array(10).fill(5) },
    hw10: { label: '課題 1〜6 の配列 [66, 59, 61, 39, 18, 58, 5, 77, 4, 42]', arr: [66, 59, 61, 39, 18, 58, 5, 77, 4, 42] },
  }

  const runQS = (orig, useHoare) => {
    const a = orig.slice()
    const calls = []
    let maxDepth = 0, totalComps = 0, totalSwaps = 0
    const qs = (l, r, d) => {
      const callNo = calls.length + 1
      if (l < r) {
        maxDepth = Math.max(maxDepth, d)
        const res = useHoare ? runHoarePure(a, l, r) : runLomutoPure(a, l, r)
        totalComps += res.comps
        totalSwaps += res.swaps
        calls.push({ callNo, l, r, q: res.q, snap: a.slice(), active: true })
        qs(l, res.q - 1, d + 1)
        qs(res.q + 1, r, d + 1)
      } else {
        calls.push({ callNo, l, r, q: l === r ? l : null, snap: a.slice(), active: false })
      }
    }
    qs(0, a.length - 1, 1)
    return { calls, maxDepth, totalComps, totalSwaps }
  }

  const draw = () => {
    const { arr } = PRESETS[presetKey]
    const lom = runQS(arr, false)
    const hoa = runQS(arr, true)

    const cardFor = (title, res, accent) => h('div', {
      style: { background: '#fff', border: '2px solid #3d2e54', borderRadius: '16px', padding: '12px 14px', boxShadow: '0 4px 0 #3d2e54' },
    },
    h('div', { style: { fontWeight: 900, fontSize: '14px', marginBottom: '8px', color: accent } }, title),
    h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px', marginBottom: '10px' } },
      stat('QS 呼出回数', `${res.calls.length}<small>回</small>`),
      stat('最大再帰深さ', `${res.maxDepth}`),
      stat('総比較 / swap', `${res.totalComps} / ${res.totalSwaps}`)),
    h('div', { style: { maxHeight: '260px', overflowY: 'auto', fontSize: '12px', fontFamily: 'var(--f-mono)', display: 'grid', gap: '4px' } },
      res.calls.map((c) => h('div', {
        style: {
          padding: '4px 8px', borderRadius: '8px',
          background: c.q != null && c.active ? '#fff8ef' : '#f6f3fb',
          border: '1px solid rgba(61,46,84,.18)',
        },
      },
      `${String(c.callNo).padStart(2, ' ')}. QS(a, ${c.l}, ${c.r}) `,
      c.active
        ? h('span', { html: `→ q=<b>${c.q}</b> : [${c.snap.map((v, k) => (k === c.q ? `<b style="color:#0f7d47">|${v}|</b>` : k >= c.l && k <= c.r ? v : '·')).join(' ')}]` })
        : h('span', { style: { color: '#8a7f9e' } }, c.l === c.r ? `→ |${c.snap[c.l]}| (要素1個)` : '→ 空範囲 (終了)')))))

    stage.innerHTML = ''
    stage.appendChild(cols(2, cardFor('Lomuto 法を用いた QS', lom, '#cf2560'), cardFor('Hoare 法を用いた QS', hoa, '#0f7d47')))
    narr.innerHTML = presetKey.startsWith('equal')
      ? `<b>全要素が等しい場合</b>：Lomuto 法では <code>a[j] &lt; pivot</code> が一度も成り立たないため <code>i</code> が左端（<code>l-1</code>）のまま動かず、毎回 <code>q = l</code> と<b>極端に偏った分割（$0$ 個と $L-1$ 個）</b>になって <b>$O(n^2)$</b> に悪化する！ 一方 Hoare 法では <code>a[i] == p</code> でも止まって交換するため、<code>i</code> と <code>j</code> が<b>ちょうど真ん中で交差して均等分割</b>され、<b>$O(n \\log_2 n)$</b> をキープできる！`
      : `課題の配列（すべて異なる要素）では、Lomuto 法も Hoare 法も 1 回目の PARTITION で同じ <code>q = 4</code> にピボット <code>42</code> を置くが、<b>部分 A・C の内部の並び順や swap 回数（Lomuto: 5 回, Hoare: 4 回）が異なる</b>ことに注目！`
  }

  const sel = seg([
    ['equal7', '全要素同じ (n=7・スライド13-14)'],
    ['equal10', '全要素同じ (n=10)'],
    ['hw10', '課題1〜6の配列 (n=10)'],
  ], presetKey, (v) => { presetKey = v; draw() })

  const root = lab({
    title: 'LAB 10-4 — Lomuto 法 vs Hoare 法：分割の偏りと QS 呼び出し比較（スライド 13〜14）',
    hint: '全要素が等しい配列で Lomuto 法がどう偏るか、Hoare 法がどう均等分割するか並べて確認！',
    body: h('div',
      h('div.ctrl-row', sel),
      h('div.sep'),
      stage,
      h('div', { style: { marginTop: '12px' } }, narr)),
  })
  draw()
  return root
}

/* ========== LAB 10-5: クイックソート QS(a, l, r) 完全トレーサ＋対応する二分探索木（スライド 5〜7・課題 8 対応） ========== */
function quickSortTreeLab() {
  const inp = h('input.txt', { value: '45 14 77 43 73 80 70', 'aria-label': '配列 a', style: { width: '250px' } })
  const arrStage = h('div.stage', { style: { padding: '8px' } })
  const treeStage = h('div.stage', { style: { padding: '8px', display: 'grid', placeItems: 'center', minHeight: '210px' } })
  const sts = h('div.stats'), narr = h('div.narr'), callTbl = h('div')
  const root = h('div')

  const render = (f) => {
    arrStage.innerHTML = ''
    arrStage.appendChild(qsBars(f.a, {
      activeRange: f.l <= f.r ? [f.l, f.r] : null,
      zone: (k) => {
        if (f.fixed.includes(k)) return k === f.justFixed ? 'ok' : 'fixed'
        if (f.l <= f.r && k >= f.l && k <= f.r) {
          if (f.q != null) return k < f.q ? 'lt' : k === f.q ? 'ok' : 'ge'
          return k === f.r ? 'piv' : ''
        }
        return 'dim'
      },
      ptrs: f.q != null ? { [`q=${f.q}`]: f.q } : (f.l <= f.r ? { l: f.l, 'r(p)': f.r } : {}),
      dividers: f.q != null ? [f.q - 1, f.q] : [],
    }))

    // 二分探索木の描画（スライド 7）
    treeStage.innerHTML = ''
    if (!f.bstNodes.length) {
      treeStage.appendChild(h('div.muted', { style: { fontSize: '13px' } }, 'ピボットが選択されると、対応する二分探索木がここに育ちます'))
    } else {
      const L = {}, R = {}, valOf = {}, ordOf = {}
      f.bstNodes.forEach((nd) => { L[nd.id] = nd.left; R[nd.id] = nd.right; valOf[nd.id] = nd.val; ordOf[nd.id] = nd.ord })
      const lay = layoutBinary(0, L, R, { dx: 44, dy: 58, pad: 28 })
      const edges = []
      f.bstNodes.forEach((nd) => {
        if (nd.left != null) edges.push([nd.id, nd.left])
        if (nd.right != null) edges.push([nd.id, nd.right])
      })
      const g = drawGraph({
        pos: lay.pos, edges, W: Math.max(240, lay.W), H: Math.max(150, lay.H), r: 16, directed: true,
        labels: (id) => String(valOf[id]),
      })
      // 挿入順番号（スライド 7 の 1, 2, ...）を節点の左上に添える
      Object.entries(lay.pos).forEach(([id, p]) => {
        g.gN.appendChild(s('text', {
          x: p.x - 18, y: p.y - 14, fill: '#5b4c72', 'font-family': 'var(--f-mono)', 'font-size': 10, 'font-weight': 700,
          text: String(ordOf[id]),
        }))
      })
      setNodeClass(g.nodeEl, (id) => (id === f.curNodeId ? 'cur' : 'ok'))
      treeStage.appendChild(g.svg)
    }

    sts.innerHTML = ''
    sts.append(
      stat('現在の呼出番号', `${f.callNo} 番目`, 'hl'),
      stat('引数 (l, r)', `l = ${f.l}, r = ${f.r}`, 'cy'),
      stat('再帰の深さ / 木の高さ', `${f.depth} / ${f.treeHeight}`, 'li'),
      stat('累積比較回数 Q', `${f.totalComps}<small>回</small>`),
    )
    narr.innerHTML = f.msg
  }
  const player = new Player({ interval: 900, keyTarget: root, render })

  const build = () => {
    const raw = parseNums(inp.value)
    const a = (raw.length >= 2 ? raw.slice(0, 14) : [45, 14, 77, 43, 73, 80, 70]).slice()
    const F = []
    const rows = []
    const fixed = []
    const bstNodes = []
    let callSeq = 0, pivOrd = 0, totalComps = 0, treeHeight = 0

    const cloneNodes = () => bstNodes.map((n) => ({ ...n }))

    const qs = (l, r, depth, parentId, side) => {
      const myCall = ++callSeq
      if (l > r) {
        rows.push([`<b>${myCall}</b>`, `<code>QS(a, ${l}, ${r})</code>`, `${l} ${r}`, '<code>l &gt; r</code>（空範囲 → 何もしない）', a.join(' ')])
        F.push({
          a: a.slice(), l, r, q: null, callNo: myCall, depth, treeHeight, totalComps,
          fixed: fixed.slice(), justFixed: null, bstNodes: cloneNodes(), curNodeId: null,
          msg: `<b>${myCall} 番目の呼び出し <code>QS(a, ${l}, ${r})</code></b>：<code>l &gt; r</code>（要素数 0 の空範囲）なのでそのまま戻る！`,
        })
        return
      }
      if (l === r) {
        fixed.push(l)
        pivOrd++
        const nodeId = bstNodes.length
        bstNodes.push({ id: nodeId, val: a[l], ord: pivOrd, left: null, right: null, depth })
        if (parentId != null) bstNodes[parentId][side] = nodeId
        treeHeight = Math.max(treeHeight, depth)
        rows.push([`<b>${myCall}</b>`, `<code>QS(a, ${l}, ${r})</code>`, `${l} ${r}`, `<code>l == r</code>（要素 1 個 <code>|${a[l]}|</code> 確定）`, a.map((v, k) => (k === l ? `<b>|${v}|</b>` : v)).join(' ')])
        F.push({
          a: a.slice(), l, r, q: l, callNo: myCall, depth, treeHeight, totalComps,
          fixed: fixed.slice(), justFixed: l, bstNodes: cloneNodes(), curNodeId: nodeId,
          msg: `<b>${myCall} 番目の呼び出し <code>QS(a, ${l}, ${r})</code></b>：<code>l == r</code>（要素 1 個 <b>${a[l]}</b>）なので確定！ 二分探索木の葉（頂点 ${pivOrd}）に対応するよ。`,
        })
        return
      }

      const piv = a[r]
      const res = runLomutoPure(a, l, r)
      totalComps += res.comps
      fixed.push(res.q)
      pivOrd++
      const nodeId = bstNodes.length
      bstNodes.push({ id: nodeId, val: piv, ord: pivOrd, left: null, right: null, depth })
      if (parentId != null) bstNodes[parentId][side] = nodeId
      treeHeight = Math.max(treeHeight, depth)

      rows.push([
        `<b>${myCall}</b>`,
        `<code>QS(a, ${l}, ${r})</code>`,
        `${l} ${r}`,
        `p=${piv} → <code>q=${res.q}</code>（次: 左 <code>(${l},${res.q - 1})</code>, 右 <code>(${res.q + 1},${r})</code>）`,
        a.map((v, k) => (k === res.q ? `<b class="lime">|${v}|</b>` : k >= l && k <= r ? v : `<span class="muted">${v}</span>`)).join(' '),
      ])
      F.push({
        a: a.slice(), l, r, q: res.q, callNo: myCall, depth, treeHeight, totalComps,
        fixed: fixed.slice(), justFixed: res.q, bstNodes: cloneNodes(), curNodeId: nodeId,
        msg: `<b>${myCall} 番目の呼び出し <code>QS(a, ${l}, ${r})</code></b>：ピボット <code>p = ${piv}</code> で PARTITION → <code>a[${res.q}] = ${piv}</code> が確定（二分探索木に頂点 ${pivOrd} として追加）！ 次に左部分 <code>QS(a, ${l}, ${res.q - 1})</code> と右部分 <code>QS(a, ${res.q + 1}, ${r})</code> を再帰呼び出し！`,
      })

      qs(l, res.q - 1, depth + 1, nodeId, 'left')
      qs(res.q + 1, r, depth + 1, nodeId, 'right')
    }

    qs(0, a.length - 1, 0, null, null)

    callTbl.innerHTML = ''
    callTbl.appendChild(table(['呼出順', '関数呼出', 'l r', '処理内容', '手順1終了後の配列 a'], rows))
    player.load(F)
  }

  const preset = (v) => () => { inp.value = v; build() }
  inp.addEventListener('change', build)

  root.append(lab({
    title: 'LAB 10-5 — クイックソート QS(a, l, r) 再帰トレーサ ＆ 二分探索木との対応（スライド 5〜7・課題 8 対応）',
    hint: '空範囲 (l > r) の呼び出しも含めて何番目にどの QS(a, l, r) が呼ばれるか完全追跡！',
    body: h('div',
      h('div.ctrl-row',
        h('div.field', h('label', '配列 a ='), inp),
        h('button.op', { onclick: build }, 'トレース生成'),
        h('button.op.ghost', { onclick: preset('45 14 77 43 73 80 70') }, '講義スライド5・7 (n=7)'),
        h('button.op.ghost', { onclick: preset('3 89 45 67 88 87 70 8 25 68') }, '講義スライド6 (n=10)'),
        h('button.op.ghost', { onclick: preset('66 59 61 39 18 58 5 77 4 42') }, '課題8 (n=10)'),
        h('button.op.ghost', { onclick: preset('11 12 13 14 15') }, '最悪例：昇順 (n=5)')),
      h('div.sep'),
      h('div.lab-grid',
        h('div', h('div.arr-name', { style: { marginTop: 0 } }, '配列 a（黄枠 = 現在の操作範囲 [l..r]、緑 = 確定したピボット）'), arrStage),
        h('div', h('div.arr-name', { style: { marginTop: 0 } }, '対応する二分探索木（左上番号 = ピボット選択順）'), treeStage)),
      h('div', { style: { display: 'grid', gap: '10px', marginTop: '10px' } }, sts, narr),
      h('details', { style: { marginTop: '10px' } }, h('summary', { style: { cursor: 'pointer', fontWeight: 700, fontSize: '13px' } }, '全 QS(a, l, r) 呼び出し順序の一覧表を開く（スライド 6 形式）'), callTbl)),
    foot: player.el,
  }))
  build()
  return root
}

/* ========== LAB 10-6: ピボットの選び方と時間計算量ラボ（スライド 15〜18・課題 9〜10 対応） ========== */
function pivotStrategyLab() {
  let inputKind = 'asc'
  const stage = h('div.stage', { style: { padding: '14px' } })
  const narr = h('div.narr')

  const CASES = {
    asc: { label: '昇順（整列済み）[1, 2, 3, 4, 5, 6, 7]（課題9の選択肢3）', arr: [1, 2, 3, 4, 5, 6, 7] },
    desc: { label: '降順 [7, 6, 5, 4, 3, 2, 1]', arr: [7, 6, 5, 4, 3, 2, 1] },
    opt1: { label: '課題9 選択肢1 [6, 7, 5, 4, 3, 2, 1]', arr: [6, 7, 5, 4, 3, 2, 1] },
    opt2: { label: '課題9 選択肢2 [4, 2, 3, 1, 6, 5, 7]', arr: [4, 2, 3, 1, 6, 5, 7] },
    opt4: { label: '課題9 選択肢4 [3, 2, 4, 5, 6, 7, 1]', arr: [3, 2, 4, 5, 6, 7, 1] },
    best7: { label: '最良入力例 [6, 5, 7, 3, 1, 2, 4]（スライド 16）', arr: [6, 5, 7, 3, 1, 2, 4] },
    killerMid: { label: '「中心要素ピボット」が最悪 O(n²) になる入力例', arr: [1, 3, 5, 7, 6, 4, 2] },
  }

  const simWithPivot = (orig, rule) => {
    const a = orig.slice()
    let comps = 0, maxDepth = 0
    const pivots = []
    const qs = (l, r, d) => {
      if (l >= r) { maxDepth = Math.max(maxDepth, d); return }
      maxDepth = Math.max(maxDepth, d)
      let pIdx = r
      if (rule === 'left') pIdx = l
      else if (rule === 'mid') pIdx = Math.floor((l + r) / 2)
      else if (rule === 'med3') {
        const m = Math.floor((l + r) / 2)
        const tri = [[a[l], l], [a[m], m], [a[r], r]].sort((x, y) => x[0] - y[0])
        pIdx = tri[1][1]
      } else if (rule === 'rand') {
        pIdx = l + Math.floor(Math.random() * (r - l + 1))
      }
      // 選んだピボットを右端 a[r] に置いてから Lomuto PARTITION
      if (pIdx !== r) [a[pIdx], a[r]] = [a[r], a[pIdx]]
      pivots.push(a[r])
      const res = runLomutoPure(a, l, r)
      comps += res.comps
      qs(l, res.q - 1, d + 1)
      qs(res.q + 1, r, d + 1)
    }
    qs(0, a.length - 1, 0)
    return { comps, maxDepth, pivots }
  }

  const draw = () => {
    const { label, arr } = CASES[inputKind]
    const n = arr.length
    const worstBound = (n * (n - 1)) / 2

    const rules = [
      ['right', '右端 a[r]（講義の基本）', '整列済み（昇順・降順）で毎回最大・最小を引き O(n²)！'],
      ['left', '左端 a[l]（選択肢 1）', '昇順入力で毎回「最小要素」を引き、右端と同じく最悪 O(n²) のまま！'],
      ['mid', '左端と右端の中心（選択肢 2）', '昇順 [1..7] では毎回ちょうど中央値を引き最良になる！（※別の特定入力では最悪あり）'],
      ['med3', '左・中・右 3要素の中央値（スライド 18）', '整列済みでも最良になり、最悪入力を意図的に作るのも非常に大変！'],
      ['rand', 'ランダムに1つ選択（乱択・選択肢 3）', '期待値は O(n log₂ n) で意図的な最悪入力は作れないが、運が悪いと最悪 O(n²) になり得る'],
    ]

    const rows = rules.map(([key, name, desc]) => {
      if (key === 'rand') {
        const runs = range(40).map(() => simWithPivot(arr, 'rand').comps)
        const avg = (runs.reduce((x, y) => x + y, 0) / runs.length).toFixed(1)
        const mn = Math.min(...runs), mx = Math.max(...runs)
        return [
          `<b>${name}</b>`,
          `平均 <b>${avg}</b> 回<br><small>(40回試行: 最小 ${mn} 〜 最大 ${mx})</small>`,
          '乱数次第（運が悪いと n−1）',
          desc,
        ]
      }
      const r = simWithPivot(arr, key)
      const isWorst = r.comps === worstBound
      return [
        `<b>${name}</b>`,
        isWorst ? `<b class="rose">${r.comps} 回（最悪 n(n−1)/2）</b>` : `<b class="lime">${r.comps} 回</b>`,
        `深さ ${r.maxDepth}（ピボット順: <code>${r.pivots.join('→')}</code>）`,
        desc,
      ]
    })

    stage.innerHTML = ''
    stage.appendChild(h('div.arr-name', { style: { marginTop: 0 } }, `入力配列（n = ${n}）：${label} ／ 最悪比較回数 n(n−1)/2 = ${worstBound} 回`))
    stage.appendChild(table(['ピボット選択法', '要素の比較回数 Q_n', '再帰の深さとピボット列', '特徴・評価'], rows))

    narr.innerHTML = inputKind === 'asc'
      ? `<b>注目（課題 9・10 のポイント）</b>：昇順入力 <code>1 2 3 4 5 6 7</code> に対して右端ピボットだと毎回最大要素を選んでしまい <b>21 回（最悪 $n(n-1)/2$）</b>かかる。これを「左端」に変えても毎回最小要素を選ぶので <b>21 回のまま改善しない</b>！ ランダム選択は運が悪いと最悪 $O(n^2)$ になり得るのに対し、<b>「既に昇順に並んでいる入力」に対して「左端と右端の中心」を選べば 100% 確実に毎回中央値が選ばれ、比較 10 回（最良 $O(n \\log_2 n)$）に減らせる</b>！`
      : `入力の並びとピボット選択法の相性を見比べてみよう。「ランダムに再試行」は下のボタンをもう一度押すと乱数が振り直されるよ。`
  }

  const sel = seg([
    ['asc', '昇順 1..7 (課題9-③)'],
    ['opt1', '6 7 5 4 3 2 1 (①)'],
    ['opt2', '4 2 3 1 6 5 7 (②)'],
    ['opt4', '3 2 4 5 6 7 1 (④)'],
    ['best7', '最良例 (スライド16)'],
  ], inputKind, (v) => { inputKind = v; draw() })

  const root = lab({
    title: 'LAB 10-6 — ピボットの選び方と最悪・最良・乱択の比較シミュレータ（スライド 15〜18・課題 9〜10 対応）',
    hint: '同じ入力でもピボットの選び方ひとつで比較回数と再帰の深さが劇的に変わる！',
    body: h('div',
      h('div.ctrl-row', sel, h('button.op.ghost', { onclick: draw }, '乱数を振り直す')),
      h('div.sep'),
      stage,
      h('div', { style: { marginTop: '12px' } }, narr)),
  })
  draw()
  return root
}

export default {
  n: 10,
  title: '整列のアルゴリズム (3)',
  sub: 'クイックソート — PARTITION（Lomuto法・Hoare法）とピボット選択',
  en: 'Quicksort & Partitioning',
  tags: ['クイックソート', 'PARTITION', 'Lomuto法', 'Hoare法', 'ピボット', '乱択'],
  mini: '<svg viewBox="0 0 120 60"><g stroke="#3d2e54" stroke-width="1.8"><rect x="10" y="28" width="12" height="22" rx="3" fill="#d8eeff"/><rect x="26" y="34" width="12" height="16" rx="3" fill="#d8eeff"/><rect x="42" y="25" width="12" height="25" rx="3" fill="#d8eeff"/><line x1="57" y1="10" x2="57" y2="54" stroke="#cf2560" stroke-width="2.2" stroke-dasharray="3 2"/><rect x="60" y="18" width="13" height="32" rx="3" fill="#ffd23f"/><line x1="76" y1="10" x2="76" y2="54" stroke="#cf2560" stroke-width="2.2" stroke-dasharray="3 2"/><rect x="79" y="13" width="12" height="37" rx="3" fill="#ffe0cc"/><rect x="95" y="8" width="12" height="42" rx="3" fill="#ffe0cc"/></g></svg>',
  goals: [
    'クイックソートの基本アイデア（3つの部分 A, B, C への分割と再帰呼び出し）を説明できる',
    'PARTITION 操作の Lomuto 法と Hoare 法それぞれの手順・swap 回数・違いをトレースして説明できる',
    'すべての要素が等しい配列に対して Lomuto 法が非効率になり Hoare 法が均等分割になる理由を説明できる',
    'クイックソートと二分探索木の構築の対応関係から、再帰の深さと計算量の関係を説明できる',
    'クイックソートの最悪 O(n²)・最良 O(n log₂ n)・平均 O(n log₂ n) の導出と、ピボットの選び方の工夫を説明できる',
  ],
  chapters: [
    {
      id: 'intro', k: 'IDEA', title: 'クイックソートの概要と 3 分割アイデア',
      build: (el) => el.append(
        talk(`S: 第10回は、高等な整列アルゴリズムの第2弾にして実用上もっとも広く使われている<b>クイックソート（quicksort）</b>だよ！
R: 前回のヒープソートは最悪・平均・最良すべて $O(n \\log_2 n)$ でしたよね。クイックソートはどう違うんですか？
S: まずスライド 2 の比較表を見てみよう！`),
        h('div.reveal', table(
          ['アルゴリズム', '最悪時間計算量', '平均時間計算量', '最良時間計算量', '安定性'],
          [
            ['<b>ヒープソート</b>（第9回）', '<b class="lime">O(n log₂ n)</b>', '<b class="lime">O(n log₂ n)</b>', '<b class="lime">O(n log₂ n)</b>', '<b class="rose">無</b>'],
            ['<b>クイックソート</b>（今回）', '<b class="rose">O(n²)</b>', '<b class="lime">O(n log₂ n)</b>', '<b class="lime">O(n log₂ n)</b>', '<b class="rose">無</b>'],
          ],
        )),
        talk(`R[oops]: えっ、最悪計算量が $O(n^2)$ に悪くなってるじゃないですか！？ なのに「クイック（速い）」なんですか？
S: いいツッコミ！ 最悪ケースは確かに $O(n^2)$ なんだけど、<b>平均では $O(n \\log_2 n)$ で、しかも 1 ループあたりの処理がとても単純だから実測ではヒープソートより速いことが多い</b>んだ。そして最悪ケースが起きる原因と回避策も今日の後半できっちり学ぶよ。
R: どんなアイデアで整列するんですか？
S: バブル・挿入・選択ソートは「いきなり端から整列しようとして $O(n^2)$ になった」のに対し、クイックソートはヒープソートと同様<b>「いきなり整列しようとしない（非直感的だけど効率が良い）」</b>アプローチをとる（スライド 3〜4）。
S: 主役になる操作は <b><code>PARTITION(a, l, r)</code></b>！ 配列の左端 $l$ から右端 $r$ までの中から適当な基準要素<b>ピボット（pivot）$p$</b> を 1 つ選び、次の <b>3 つの部分 A・B・C</b> に大まかに分けるんだ：`),
        cols(3,
          card('部分 A（左）', '<code>a[l]</code> 〜 <code>a[q−1]</code><br><strong>p より小さい</strong>要素の集まり（<code>&lt; p</code>）', 'PART A'),
          card('部分 B（中央）', '<code>a[q] = p</code><br><strong>ピボット p だけ</strong>の部分<br><small>※位置 q は分割完了時に確定！</small>', 'PART B'),
          card('部分 C（右）', '<code>a[q+1]</code> 〜 <code>a[r]</code><br><strong>p 以上</strong>の要素の集まり（<code>≥ p</code>）', 'PART C')),
        talk(`R[wow]: あっ！ この 3 つに分けた瞬間、<b>ピボット $p$ 自身の最終位置 <code>a[q]</code> はもう確定</b>して動かないんですね！
S: その通り！ しかも「A の中はまだバラバラ」「C の中もまだバラバラ」で構わない。あとは<b>部分 A に対して同じ操作を再帰呼び出しし、部分 C に対しても再帰呼び出し</b>すれば、全体が自然に昇順に並び切るんだ（分割統治法）！
S: 下のラボで好きな要素をピボットに選んで、「A の個数＝ピボットの格納位置 $q$」になる感覚をつかもう！`),
        partitionIdeaLab(),
        point('クイックソートは基準要素<b>ピボット $p$</b> を選び、配列を <b>A（$&lt; p$）・B（$= p$）・C（$\\ge p$）の 3 部分に分割する <code>PARTITION(a, l, r)</code></b> を再帰的に繰り返す整列法。安定性は<b>「無」</b>。'),
      ),
    },
    {
      id: 'lomuto', k: 'PARTITION 1', title: 'PARTITION(a, l, r) の実現①：Lomuto 法',
      build: (el) => el.append(
        talk(`S: では「どうやって追加配列を使わずに配列 <code>a</code> の中だけで A・B・C の 3 つに分けるのか？」を見ていこう！ 講義では <b>Lomuto 法</b>と <b>Hoare 法</b>の 2 種類が登場するよ。特に断りがなければ <b>Lomuto 法</b>が標準だ（スライド 8〜9）。
R: Lomuto 法の疑似コードはどうなっていますか？
S: 右端の要素 <code>p = a[r]</code> をピボットに選び、2 つの添字 <code>i</code> と <code>j</code> を左から右へ進めていくよ：
・<code>i</code>：<b>「ピボット $p$ より小さい部分 A」の右端</b>を指す（最初はまだ 0 個なので <code>i = l - 1</code>）
・<code>j</code>：未調査の要素を <code>l</code> から <code>r - 1</code> まで順番に見ていくスキャン用ポインタ
・もし <code>a[j] &lt; pivot</code> なら、<code>i++</code> して <code>swap(&amp;a[i], &amp;a[j])</code> で部分 A の末尾に取り込む！
・<code>for</code> ループが終わったら、<code>q = i + 1</code> として<b>最後に <code>swap(&amp;a[q], &amp;a[r])</code></b> で右端に待機していたピボットを A と C の間に持ってくる！`),
        callout('warn', '課題 3 対策：Lomuto 法の swap 回数の数え方！', '<p>疑似コード 10 行目の <code>swap(&amp;a[i], &amp;a[j])</code> は、<b><code>i == j</code>（自分自身との入れ替え）のときもそのまま実行される</b>（スライド 9 の 1 行目 <code>swap(a[0], a[0])</code>・3 行目 <code>swap(a[1], a[1])</code> 参照）！<br>したがって Lomuto 法の 1 回の PARTITION で行われる <code>swap</code> の合計回数は：<br><b>（<code>a[j] &lt; pivot</code> を満たした要素の個数）＋ 1 回（14行目の最後の <code>swap(a[q], a[r])</code>）＝ $q - l + 1$ 回</b>（$l=0$ なら <b>$q + 1$ 回</b>）になるよ！</p>'),
        lomutoLab(),
        talk(`R: 要素数 $L = (r - l) + 1$ に対する Lomuto 法の時間計算量はどうなりますか？（スライド 8）
S: 8 行目の <code>if (a[j] &lt; pivot)</code> で <code>j = l</code> から <code>r - 1</code> までちょうど <b>$N_L = L - 1$ 回</b>（$L \\le 1$ なら $0$ 回）比較するだけだから、時間計算量は <b>$O(N_L) = O(L)$</b> だよ！`),
        point('<b>Lomuto 法</b>：<code>pivot = a[r]</code>, <code>i = l - 1</code> とし、<code>j = l .. r-1</code> で <code>a[j] &lt; pivot</code> のとき <code>i++; swap(a[i], a[j])</code>。ループ後に <code>q = i + 1; swap(a[q], a[r])</code>。要素数 $L$ での比較回数は <b>$N_L = L - 1$</b>。'),
      ),
    },
    {
      id: 'hoare', k: 'PARTITION 2', title: 'PARTITION(a, l, r) の別法②：Hoare 法と全要素等しい場合',
      build: (el) => el.append(
        talk(`S: 次はクイックソートの提案者 C. A. R. Hoare 氏による別法、<b>Hoare 法（<code>partitionH</code>）</b>だよ（スライド 10〜12）！
R: なぜ Lomuto 法があるのに別の方法が必要なんですか？
S: Lomuto 法には<b>「配列 <code>a</code> の要素がすべて等しい場合に分割が極端に偏って $O(n^2)$ になる」</b>という弱点があるんだ（スライド 13）。Hoare 法は少しコードが複雑になる代わりに、この問題が起きない！
R: Hoare 法はどうやって分割するんですか？
S: 同じく右端 <code>pivot = a[r]</code> をピボットにした上で、<b>左端の外 <code>i = l - 1</code> と右端 <code>j = r</code> から中央に向かって挟み撃ち</b>にする（スライド 10〜11）：
1. 左から <code>do { i++; } while (a[i] &lt; pivot);</code> → <b>$p$ 以上（$\\ge p$）</b>の要素を見つけたら止まる
2. 右から <code>do { j--; } while (a[j] &gt; pivot);</code> → <b>$p$ 以下（$\\le p$）</b>の要素を見つけたら止まる
3. もし <b><code>i &gt; j</code></b> と交差していたら <code>break</code> でループを抜ける！ まだ <code>i &lt;= j</code> なら <code>swap(&amp;a[i], &amp;a[j])</code> で左右の置き違いを入れ替えて繰り返す
4. ループを抜けた後、講義の疑似コードでは <b><code>q = i; swap(&amp;a[q], &amp;a[r]); return q;</code></b> でピボットを間に持ってくる！（※オリジナルの Hoare 法は最後の交換をしない流儀もあるけど、<b>講義と課題では必ずスライド 10〜11 の疑似コード通り最後に <code>swap(a[q], a[r])</code> を行う</b>よ！）`),
        hoareLab(),
        talk(`R[wow]: なるほど！ 9 行目が <code>&lt; pivot</code> で 13 行目が <code>&gt; pivot</code>（どちらも等号を含まない）だから、<b><code>p</code> と等しい要素でも毎回ちゃんと立ち止まって交換してくれる</b>んですね！
S: 大正解！ スライド 10 にも「<code>p = a[i]</code> が A と C のどっちに入っても良いようになっているのがポイント」と書かれているね。では実際に「すべての要素が <code>1</code> の配列」で Lomuto 法と Hoare 法がどう違うか、下のラボで見比べてみよう！`),
        equalElementsCompareLab(),
        point('<b>Hoare 法</b>：左から <code>a[i] &lt; p</code> の間 <code>i++</code>、右から <code>a[j] &gt; p</code> の間 <code>j--</code> で挟み撃ちにし、<code>i &gt; j</code> で抜けて最後に <code>q = i; swap(a[q], a[r])</code>。<b>全要素が等しい配列でも中央で均等分割され $O(n \\log_2 n)$ になる</b>！'),
      ),
    },
    {
      id: 'qstree', k: 'RECURSION & BST', title: 'クイックソート QS(a, l, r) の再帰動作と二分探索木',
      build: (el) => el.append(
        talk(`S: PARTITION が分かれば、クイックソート本体 <b><code>QS(a, l, r)</code></b> は驚くほどシンプルだよ（スライド 5）！`),
        callout('def', 'スライド 5：クイックソート QS(a, l, r) の手順', '<p>配列 <code>a</code> の要素 <code>a[l]</code> から <code>a[r]</code> を昇順に並べる。<b><code>l &lt; r</code> なら以下を実行</b>（<code>l ≥ r</code> なら何もしないで終了）：<br>1. <b><code>q = PARTITION(a, l, r)</code></b> を実行（ピボット <code>p ← a[r]</code> により A: <code>a[l..q-1] &lt; p</code>, B: <code>a[q] = p</code>, C: <code>a[q+1..r] ≥ p</code> に分割）<br>2. 部分 A と C に対して <code>QS</code> を再帰的に実行：<br>&emsp;2.1. <b><code>QS(a, l, q - 1)</code></b> を実行<br>&emsp;2.2. <b><code>QS(a, q + 1, r)</code></b> を実行</p>'),
        talk(`R[think]: スライド 6 や課題 8 を見ると、<code>QS(a, 0, -1)</code> や <code>QS(a, 2, 1)</code> のような <b><code>l &gt; r</code> の呼び出しも「1 回の呼び出し」として順番に数えています</b>よね！？
S: そこが超重要ポイント！ <code>q == l</code>（左の部分 A が空）のときでも、コード上は必ず手順 2.1 の <b><code>QS(a, l, l - 1)</code> が一度呼び出され</b>、入った直後に <code>l &lt; r</code> を満たさないので何もせず戻る。だから「3 番目に呼び出される <code>QS</code> の引数」を数えるときは、<b><code>l == r</code>（要素 1 個）や <code>l &gt; r</code>（要素 0 個）の呼び出しも飛ばさずにカウントする</b>んだ！
R: そしてスライド 7 の「<b>クイックソートと二分探索木の関係</b>」ってどういう意味ですか？
S: クイックソートの動きは、第7回で学んだ<b>二分探索木（BST）を根から順番に作っていく操作と 1 対 1 に対応</b>しているんだ！
・ピボット $p$ の選択 $\\iff$ 二分探索木に節点 $p$ を挿入
・PARTITION 操作 $\\iff$ 左部分木に入る要素集合（$&lt; p$）と右部分木に入る要素集合（$\\ge p$）に振り分ける
S: だから<b>クイックソートの再帰の深さは「対応する二分探索木の高さ」そのもの</b>になり、計算量も木の高さに強く依存する！ 下のラボで配列と二分探索木が同時に育つ様子を見てみよう。`),
        quickSortTreeLab(),
        point('<code>QS(a, l, r)</code> の手順は<b>二分探索木の構築に対応</b>し、計算量は再帰の深さ（二分探索木の高さ）に強く依存する。呼び出し順を数える際は <code>l ≥ r</code> のベースケース呼び出しも 1 回に含めることに注意！'),
      ),
    },
    {
      id: 'complexity', k: 'COMPLEXITY & PIVOT', title: '時間計算量（最悪・最良・平均）とピボットの選び方',
      build: (el) => el.append(
        talk(`S: いよいよ最後の章！ Lomuto 法を想定して、要素数 $n$ に対する <code>QS(a, 0, n-1)</code> の<b>比較回数 $Q_n$</b> から最悪・最良・平均の時間計算量を導出しよう（スライド 15〜17）。
R: まず漸化式はどう立てるんですか？
S: 要素数 $L$ の範囲を PARTITION すると比較が $N_L = L - 1$ 回（$N_0 = N_1 = 0$）行われ、要素数 $a$ の部分 A と要素数 $c$ の部分 C（ただし $a + c = L - 1$）に分かれて再帰するから、次の漸化式が成り立つよ：`),
        formula('Q_L = N_L + Q_a + Q_c \\qquad (a + c = L - 1,\\; N_L = L - 1)'),
        cols(3,
          card('① 最悪時間計算量：O(n²)', '毎回<strong>最小要素または最大要素</strong>がピボットに選ばれる場合（例：昇順入力で右端ピボット）。<br>$a = n-1, c = 0$ となり<br>$Q_n = \\sum_{k=1}^{n-1} k = \\frac{n(n-1)}{2}$', 'WORST — SLIDE 15'),
          card('② 最良時間計算量：O(n log₂ n)', '毎回<strong>中央値</strong>がピボットに選ばれる場合（$a = c = (L-1)/2$）。<br>$n = 2^k - 1$ とすると<br>$Q_n < (n+1)\\log_2(n+1)$', 'BEST — SLIDE 16'),
          card('③ 平均時間計算量：O(n log₂ n)', '$(a, c)$ の $n$ 通りの組合せが等確率 $1/n$ で出現すると仮定すると<br>$Q_n < 2(n+1)\\left(\\frac{\\log_2(n+1)}{\\log_2 e} - \\frac{1}{2}\\right)$', 'AVERAGE — SLIDE 17')),
        talk(`R: スライド 15〜17 の数式の流れも確認したいです！
S: それぞれ順番に見ておこう。まず<b>最悪ケース</b>（毎回片方が $0$ 個、もう片方が $L-1$ 個）：`),
        formula('Q_n = (n - 1) + Q_{n-1} + Q_0 = (n - 1) + (n - 2) + \\dots + 1 = \\sum_{k=1}^{n-1} k = \\frac{n(n-1)}{2} = O(n^2)'),
        talk(`S: 次に<b>最良ケース</b>（$n = 2^k - 1$ で毎回ちょうど半分 $2^{k-1}-1$ 個ずつに分かれるとき）：`),
        formula('Q_{2^k-1} = (2^k - 2) + 2 Q_{2^{k-1}-1} = (k - 1)\\cdot 2^k - (2^k - 2) < k \\cdot 2^k = (n + 1)\\log_2(n + 1) = O(n \\log_2 n)'),
        talk(`S: そして<b>平均ケース</b>（すべての分割位置 $i = 0, \\dots, n-1$ が確率 $1/n$ で起きるとき）：`),
        formula('Q_n = (n - 1) + \\frac{2}{n}\\sum_{i=0}^{n-1} Q_i \\implies \\frac{Q_n}{n+1} < 2\\sum_{k=3}^{n+1}\\frac{1}{k} < 2\\left(\\frac{\\log_2(n+1)}{\\log_2 e} - \\frac{1}{2}\\right) \\implies Q_n = O(n \\log_2 n)'),
        talk(`R[wow]: 平均でも定数倍が $2 / \\log_2 e \\approx 1.39$ くらいしか付かないんですね！ だから平均的にすごく速いのか！
S: そう！ ただし「右端 <code>a[r]</code> をピボットにする」単純な方法だと、<b>実世界でよく出会う「すでに昇順に整列済みのデータ」がいきなり最悪ケース $O(n^2)$ を引き当ててしまう</b>（スライド 18）。そこでピボットの選び方を工夫するよ！`),
        cols(3,
          card('右端の要素 a[r]', '実装は一番簡単だが、<strong>整列済み（昇順・降順）の入力で O(n²)</strong> になってしまう。<small>（※左端 a[l] にしても同じく整列済みで O(n²)！）</small>', 'METHOD 1'),
          card('中心要素 ／ 3要素の中央値', '左端・右端・真中の<strong>中心</strong>や<strong>3要素の中央値（median-of-three）</strong>を選ぶと、整列済み入力が最悪になるのを確実に回避できる！', 'METHOD 2'),
          card('ランダムに1要素を選択', '<strong>乱択アルゴリズム</strong>の一種。どんな入力に対しても意図的に最悪ケースを作ることは事実上不可能になるが、<strong>運が悪ければ O(n²)</strong> になり得る。', 'METHOD 3')),
        pivotStrategyLab(),
        point('クイックソートの時間計算量は<b>最悪 $O(n^2)$</b>（毎回最小/最大をピボット選択）、<b>最良・平均 $O(n \\log_2 n)$</b>。整列済み入力での最悪化を防ぐには<b>中心要素や左・中・右 3 要素の中央値</b>、あるいは<b>ランダム選択（乱択）</b>を用いる。'),
      ),
    },
  ],
  quiz: [
    {
      kind: 'choice', tag: '特性・計算量',
      q: 'クイックソートの最悪・平均・最良時間計算量と安定性の組み合わせとして正しいものはどれか？',
      opts: [
        '最悪: O(n²) ／ 平均: O(n log₂ n) ／ 最良: O(n log₂ n) ／ 安定性: 無',
        '最悪: O(n log₂ n) ／ 平均: O(n log₂ n) ／ 最良: O(n log₂ n) ／ 安定性: 無',
        '最悪: O(n²) ／ 平均: O(n log₂ n) ／ 最良: O(n) ／ 安定性: 有',
        '最悪: O(n²) ／ 平均: O(n²) ／ 最良: O(n log₂ n) ／ 安定性: 無',
      ],
      answer: 0,
      explain: 'クイックソートはピボットが毎回最小または最大に偏ると最悪 O(n²) になるが、平均と最良は O(n log₂ n) である。また PARTITION の swap で長距離交換が起きるため安定性は「無」（スライド 2, 4, 19）。',
    },
    {
      kind: 'input', tag: 'Lomuto法',
      q: '配列 a = (45, 14, 77, 43, 73, 80, 70) に対して Lomuto 法の PARTITION(a, 0, 6)（ピボット p = a[6] = 70）を実行したとき、返される格納位置 q と swap の合計実行回数を空白区切り（例：「2 5」）で答えよ。',
      answer: '3 4',
      explain: '70 より小さい要素は 45(j=0), 14(j=1), 43(j=3) の 3 個なので q = 3。Lomuto 法では j=0, 1, 3 で 3 回 swap し、最後に swap(a[3], a[6]) を 1 回行うので合計 4 回（スライド 9）。',
    },
    {
      kind: 'input', tag: 'Hoare法',
      q: '同じく配列 a = (45, 14, 77, 43, 73, 80, 70) に対して講義の Hoare 法 partitionH(a, 0, 6) を実行したとき、swap の合計実行回数は何回か？（数字のみ）',
      answer: '2',
      explain: '1 周目で i=2(77), j=3(43) が止まり swap(a[2], a[3])（1回目）。2 周目で i=3, j=2 となり i > j で break し、最後に swap(a[3], a[6])（2回目）を実行するので合計 2 回（スライド 12）。',
    },
    {
      kind: 'input', tag: 'ピボット逆算',
      q: '互いに異なる 7 個の要素 a = (50, 12, 84, 31, 95, 27, 63) に対してある要素 p をピボットとして PARTITION(a, 0, 6) を実行したところ、ピボットの格納位置 q は 4 であった。選択されたピボット p の値を答えよ。',
      answer: '63',
      explain: 'q = 4 に格納されたということは、p より小さい要素がちょうど 4 個ある（昇順で 0 始まり 4 番目）。昇順に並べると (12, 27, 31, 50, 63, 84, 95) なので 4 番目は 63！',
    },
    {
      kind: 'choice', tag: 'Lomuto vs Hoare',
      q: 'すべての要素が等しい配列（例：1, 1, 1, 1, 1, 1, 1）を入力としてクイックソートを実行したときの振る舞いとして正しいものはどれか？',
      opts: [
        'Lomuto 法では分割が極端に偏り O(n²) になるが、Hoare 法では均等に分割され O(n log₂ n) になる',
        'Lomuto 法では均等に分割され O(n log₂ n) になるが、Hoare 法では分割が偏り O(n²) になる',
        'Lomuto 法・Hoare 法ともに比較回数が 0 回になり O(1) で終了する',
        'Lomuto 法・Hoare 法ともに分割が極端に偏り O(n²) になる',
      ],
      answer: 0,
      explain: 'Lomuto 法では a[j] < p が一度も成立せず毎回 q = l となって O(n²) に退化する（スライド 13）。一方 Hoare 法は a[i] == p, a[j] == p でも止まるため中央付近で交差し、均等分割されて O(n log₂ n) となる（スライド 14）。',
    },
    {
      kind: 'multi', tag: 'ピボットとBST',
      q: 'クイックソートと二分探索木・ピボット選択に関する記述として【正しいもの】をすべて選べ。',
      opts: [
        'クイックソートの手順は二分探索木の構築に対応し、計算量は再帰の深さ（二分探索木の高さ）に強く依存する',
        '右端の要素をピボットとするクイックソートに、すでに昇順に整列済みの配列を与えると最悪時間計算量 O(n²) となる',
        'ピボットをランダムに 1 つ選ぶ乱択アルゴリズムにすれば、どんな運の悪い乱数列が出ても最悪時間計算量は必ず O(n log₂ n) になる',
        '左端・右端・真中の 3 要素の中央値をピボットに選べば、昇順に整列済みの入力が最悪になることを回避できる',
      ],
      answer: [0, 1, 3],
      explain: '1・2・4 が正しい（スライド 7, 15, 18）。ランダム選択では意図的に最悪入力を作ることは事実上不可能になるが、運が悪く毎回最小・最大要素ばかり引けば時間計算量は O(n²) になり得る（スライド 18）ため 3 は誤り。',
    },
  ],
}
