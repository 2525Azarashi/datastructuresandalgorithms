import { h, s, svgRoot, lab, Player, stat, callout, tldr, prose, card, cols, formula, table, seg, parseNums, $$, range, toast , talk, point } from '../lib/ui.js'
import { codeView } from '../lib/code.js'

/* ---------------------------------------------------------
   第3回  基本的なデータ構造(1): リスト・スタック・待ち行列
   --------------------------------------------------------- */

const CW = 52, GAP = 6

/* ========== LAB 3-1: Array list vs Linked list, side by side ========== */
function listLab() {
  const K = 8
  let arr = [1, 5, 2, 8, 9]
  const W = 560
  const arrStage = h('div.stage', { style: { padding: '26px 8px 10px' } })
  const linkStage = h('div.stage', { style: { padding: '26px 8px 10px' } })
  const narrA = h('div.narr'), narrL = h('div.narr')
  const costA = stat('配列リスト: 操作回数', '0', 'hl'), costL = stat('連結リスト: 操作回数', '0', 'cy')
  const ix = h('input.num', { type: 'number', value: 1, min: 0, 'aria-label': 'i' })
  const xv = h('input.num', { type: 'number', value: 11, 'aria-label': 'x' })
  let busy = false

  function drawArray(a, cls = {}, ghost = null) {
    const svg = svgRoot(W, 100)
    const x0 = (W - (K * CW + (K - 1) * GAP)) / 2
    range(K).forEach((i) => {
      const empty = i >= a.length
      const c = cls[i] || ''
      svg.appendChild(s('g', { class: `cell ${empty ? 'empty' : ''} ${c}`, transform: `translate(${x0 + i * (CW + GAP)},20)` },
        s('rect', { width: CW, height: CW, rx: 9 }),
        s('text', { x: CW / 2, y: CW / 2, class: 'v', text: empty ? '' : a[i] }),
        s('text', { x: CW / 2, y: CW + 14, class: 'idx', text: `a[${i}]` })))
    })
    if (ghost) svg.appendChild(s('text', { x: x0 + ghost.i * (CW + GAP) + CW / 2, y: 10, 'text-anchor': 'middle', class: 'lbl ' + (ghost.c || 'am'), text: ghost.t }))
    arrStage.innerHTML = ''; arrStage.appendChild(svg)
  }
  function drawLinked(a, cls = {}, opts = {}) {
    // cells scattered vertically to emphasize "離れた位置"
    const n = a.length + (opts.newAt != null ? 1 : 0)
    const cw = 64, gap = Math.min(34, (W - 70 - n * cw) / Math.max(1, n)), y0 = 36
    const svg = svgRoot(W, 116)
    svg.appendChild(s('text', { x: 6, y: y0 + 22, class: 'lbl am', text: 'head' }))
    const order = []
    a.forEach((v, i) => { order.push({ v, i }); if (opts.newAt === i) order.push({ v: opts.newV, i: 'new' }) })
    let x = 46
    const pos = order.map((o, k) => { const p = { x, y: y0 + (o.i === 'new' ? 34 : ((k * 37) % 3) * 4 - 4) }; x += cw + gap; return p })
    // pointer from head
    if (order.length) svg.appendChild(s('path', { d: `M38 ${y0 + 18} L${pos[0].x - 3} ${pos[0].y + 18}`, class: 'ptr', 'marker-end': 'url(#ah)' }))
    svg.appendChild(s('defs', {}, s('marker', { id: 'ah', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto' }, s('path', { d: 'M0 0 10 5 0 10z', fill: '#ff8a3d' })),
      s('marker', { id: 'ag', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto' }, s('path', { d: 'M0 0 10 5 0 10z', fill: 'rgba(61,46,84,.5)' }))))
    order.forEach((o, k) => {
      const p = pos[k]
      const c = o.i === 'new' ? 'ok' : cls[o.i] || ''
      const removed = opts.removed === o.i
      svg.appendChild(s('g', { class: `cell ${c} ${removed ? 'bad' : ''}`, transform: `translate(${p.x},${p.y})`, opacity: removed ? .5 : 1 },
        s('rect', { width: cw - 18, height: 36, rx: 7 }),
        s('rect', { x: cw - 18, width: 18, height: 36, rx: 4, style: 'fill: rgba(61,46,84,.04)' }),
        s('circle', { cx: cw - 9, cy: 18, r: 3, fill: '#3d2e54' }),
        s('text', { x: (cw - 18) / 2, y: 18, class: 'v', text: o.v }),
        s('text', { x: (cw - 18) / 2, y: 52, class: 'idx', text: o.i === 'new' ? 'new' : `a${o.i}` })))
      // pointer to next
      let nk = k + 1
      if (opts.skip === k) nk = k + 2
      const nxt = pos[nk]
      const from = { x: p.x + cw - 9, y: p.y + 18 }
      if (nxt) {
        const changed = opts.changed?.includes(k)
        svg.appendChild(s('path', { d: `M${from.x} ${from.y} C${from.x + gap / 2 + 8} ${from.y}, ${nxt.x - gap / 2 - 8} ${nxt.y + 18}, ${nxt.x - 3} ${nxt.y + 18}`, class: 'ptr', style: changed ? '' : 'stroke: rgba(61,46,84,.4)', 'marker-end': changed ? 'url(#ah)' : 'url(#ag)', fill: 'none' }))
      } else {
        svg.appendChild(s('text', { x: from.x + 10, y: from.y + 4, class: 'lbl ro', text: 'null' }))
      }
    })
    if (opts.ptr != null) {
      const k = order.findIndex((o) => o.i === opts.ptr)
      if (k >= 0) svg.appendChild(s('text', { x: pos[k].x + (cw - 18) / 2, y: pos[k].y - 8, 'text-anchor': 'middle', class: 'lbl am', text: 'p' }))
    }
    linkStage.innerHTML = ''; linkStage.appendChild(svg)
  }
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const reset = () => { drawArray(arr); drawLinked(arr); narrA.innerHTML = '待機中'; narrL.innerHTML = '待機中'; costA.set('0'); costL.set('0') }

  async function find() {
    const i = Math.min(+ix.value, arr.length - 1)
    if (i < 0) return
    let cl = 0
    drawArray(arr, { [i]: 'cur' }, { i, t: `a[${i}]` }); costA.set('1')
    narrA.innerHTML = `a[${i}] の位置は番号から<b>直接計算</b>できる → 1 回で <b class="l">${arr[i]}</b>。<b>O(1)</b>`
    narrL.innerHTML = '先頭から順にポインタを辿る…'
    for (let k = 0; k <= i; k++) {
      const cls = {}; for (let j = 0; j < k; j++) cls[j] = 'vis'; cls[k] = 'cur'
      drawLinked(arr, cls, { ptr: k }); costL.set(String(++cl)); await sleep(450)
    }
    narrL.innerHTML = `${i + 1} 個のセルを辿って <b class="l">${arr[i]}</b>。最悪 n 回 → <b>O(n)</b>`
  }
  async function insert() {
    if (arr.length >= K) { toast('配列が一杯（K = 8 個まで）'); return }
    const i = Math.min(+ix.value, arr.length - 1), x = +xv.value
    let ca = 0, cl = 0
    narrA.innerHTML = `a<sub>${i}</sub> の後ろに入れるため、後ろの要素を 1 つずつ右へずらす…`
    narrL.innerHTML = `まず a<sub>${i}</sub> の位置 p を探す…`
    const a2 = arr.slice()
    const tasks = []
    // array shifting animation
    tasks.push((async () => {
      for (let j = a2.length - 1; j > i; j--) {
        a2[j + 1] = a2[j]; drawArray(a2, { [j + 1]: 'cur', [j]: 'vis' }, { i: j + 1, t: '→' }); costA.set(String(++ca)); await sleep(380)
      }
      a2[i + 1] = x; drawArray(a2, { [i + 1]: 'ok' }); costA.set(String(++ca))
      narrA.innerHTML = `${a2.length - 2 - i} 個ずらして挿入。最悪 n 回 → <b>O(n)</b>`
    })())
    tasks.push((async () => {
      for (let k = 0; k <= i; k++) { const c = {}; for (let j = 0; j < k; j++) c[j] = 'vis'; c[k] = 'cur'; drawLinked(arr, c, { ptr: k }); costL.set(String(++cl)); await sleep(380) }
      await sleep(250)
      drawLinked(arr, { [i]: 'cur' }, { newAt: i, newV: x, ptr: i, changed: [i, i + 1] }); cl += 2; costL.set(String(cl))
      narrL.innerHTML = `セルを作り、<b>ポインタを 2 本付け替える</b>だけ（ずらし不要）。探索 O(n) + 付替え O(1)。<span class="c">p が既知なら O(1)</span>`
    })())
    await Promise.all(tasks)
    arr = a2.filter((v) => v !== undefined)
    await sleep(900); drawLinked(arr)
  }
  async function del() {
    const i = Math.min(+ix.value, arr.length - 2)
    if (i < 0 || arr.length < 2) { toast('a(i+1) が存在しない'); return }
    let ca = 0, cl = 0
    narrA.innerHTML = `a<sub>${i + 1}</sub> を消して、後ろを左へ詰める…`
    narrL.innerHTML = `a<sub>${i}</sub> の位置 p を探す…`
    const a2 = arr.slice()
    await Promise.all([
      (async () => {
        drawArray(a2, { [i + 1]: 'bad' }); await sleep(380)
        for (let j = i + 1; j < a2.length - 1; j++) { a2[j] = a2[j + 1]; const t = a2.slice(0, a2.length); t[a2.length - 1] = a2[a2.length - 1]; drawArray(a2.slice(0, a2.length), { [j]: 'cur', [j + 1]: 'vis' }, { i: j, t: '←' }); costA.set(String(++ca)); await sleep(380) }
        a2.pop(); drawArray(a2); narrA.innerHTML = `${ca} 個ずらした。最悪 n−1 回 → <b>O(n)</b>`
      })(),
      (async () => {
        for (let k = 0; k <= i; k++) { const c = {}; for (let j = 0; j < k; j++) c[j] = 'vis'; c[k] = 'cur'; drawLinked(arr, c, { ptr: k }); costL.set(String(++cl)); await sleep(380) }
        drawLinked(arr, { [i]: 'cur' }, { ptr: i, removed: i + 1, skip: i, changed: [i] }); costL.set(String(++cl))
        narrL.innerHTML = `a<sub>${i}</sub> のポインタを<b>1 本付け替えて</b>セルを削除。<span class="c">p が既知なら O(1)</span>`
      })(),
    ])
    arr = a2
    await sleep(900); drawLinked(arr)
  }
  const guard = (fn) => async () => { if (busy) return; busy = true; $$('.op', root).forEach((b) => (b.disabled = true)); try { await fn() } finally { busy = false; $$('.op', root).forEach((b) => (b.disabled = false)) } }
  const root = h('div', lab({
    title: 'LAB 3-1 — 配列リスト vs 連結リスト: 同じ操作を同時に実行',
    hint: '得意・苦手が逆になるのを見る',
    body: h('div',
      h('div.ctrl-row',
        h('div.field', h('label', 'i ='), ix), h('div.field', h('label', 'x ='), xv),
        h('button.op', { onclick: guard(find) }, 'FIND(i, L)'),
        h('button.op', { onclick: guard(insert) }, 'INSERT(x, i, L)'),
        h('button.op', { onclick: guard(del) }, 'DELETE_N(i, L)'),
        h('button.op.ghost', { onclick: () => { arr = [1, 5, 2, 8, 9]; reset() } }, 'リセット')),
      h('div.sep'),
      h('div.lab-grid.even',
        h('div', { style: { display: 'grid', gap: '10px', alignContent: 'start' } }, h('div.eyebrow', '配列リスト（K = 8）'), h('div', { style: { position: 'relative' } }, arrStage), narrA, costA),
        h('div', { style: { display: 'grid', gap: '10px', alignContent: 'start' } }, h('div.eyebrow', '連結リスト'), linkStage, narrL, costL))),
  }))
  reset()
  return root
}

/* ========== LAB 3-2: Stack ========== */
function stackLab() {
  const K = 8
  let a = [1, 5, 2, 8], top = 4
  const W = 560
  const stage = h('div.stage', { style: { padding: '14px' } })
  const xv = h('input.num', { type: 'number', value: 11, 'aria-label': 'x' })
  const log = h('div.log')
  const sTop = stat('top', '4', 'hl')
  const popped = h('div.chips')
  const draw = (flash, popVal) => {
    const svg = svgRoot(W, 120)
    const x0 = (W - (K * CW + (K - 1) * GAP)) / 2
    range(K).forEach((i) => {
      const empty = i >= top
      svg.appendChild(s('g', { class: `cell ${empty ? 'empty' : ''} ${flash === i ? (popVal != null ? 'bad' : 'ok') : ''}`, transform: `translate(${x0 + i * (CW + GAP)},40)` },
        s('rect', { width: CW, height: CW, rx: 9 }),
        s('text', { x: CW / 2, y: CW / 2, class: 'v', text: empty ? (popVal != null && flash === i ? popVal : '') : a[i] }),
        s('text', { x: CW / 2, y: CW + 14, class: 'idx', text: `a[${i}]` })))
    })
    const tx = x0 + Math.min(top, K - 0.5) * (CW + GAP) + CW / 2 - (top === K ? CW / 2 + GAP : 0)
    svg.appendChild(s('g', { style: 'transition: transform .35s', transform: `translate(${tx},0)` },
      s('text', { x: 0, y: 14, 'text-anchor': 'middle', class: 'lbl am', text: `top=${top}` }),
      s('path', { d: 'M-6 22 L0 32 L6 22', fill: '#ff8a3d' })))
    stage.innerHTML = ''; stage.appendChild(svg); sTop.set(String(top))
  }
  const addLog = (html) => { log.prepend(h('div', { html })) }
  const push = () => {
    if (top === K) { addLog('<span class="ng">PUSH: エラー（top = K, 一杯）</span>'); return }
    const x = +xv.value; a[top] = x; top++; draw(top - 1); addLog(`<b>PUSH(${x}, S)</b> → a[${top - 1}] ← ${x}, top ← ${top}  <span class="am">O(1)</span>`)
    xv.value = Math.floor(Math.random() * 30) + 1
  }
  const pop = () => {
    if (top === 0) { addLog('<span class="ng">POP: エラー（top = 0, 空）</span>'); return }
    top--; const v = a[top]; draw(top, v); addLog(`<b>POP(S)</b> → top ← ${top}, a[${top}] = <span class="ok">${v}</span> を返す  <span class="am">O(1)</span>`)
    popped.appendChild(h('span.chip.ro', v))
  }
  const root = h('div', lab({
    title: 'LAB 3-2 — スタック（LIFO）を配列で実現',
    hint: '頂点の位置 = 次に格納するセルの位置',
    body: h('div',
      h('div.ctrl-row', h('div.field', h('label', 'x ='), xv),
        h('button.op', { onclick: push }, 'PUSH(x, S)'), h('button.op', { onclick: pop }, 'POP(S)'),
        h('button.op', { onclick: () => addLog(`<b>EMPTY(S)</b> → ${top === 0 ? '<span class="ok">true</span>' : '<span class="ng">false</span>'}`) }, 'EMPTY(S)'),
        h('button.op', { onclick: () => addLog(`<b>TOP(S)</b> → ${top}`) }, 'TOP(S)'),
        h('button.op.ghost', { onclick: () => { top = 0; a = []; popped.innerHTML = ''; draw(); addLog('<b>CREATE(S)</b> → top ← 0') } }, 'CREATE(S)')),
      h('div.sep'), stage,
      h('div.lab-grid.even', { style: { marginTop: '12px' } },
        h('div', { style: { display: 'grid', gap: '10px', alignContent: 'start' } }, sTop, h('div.kv-row', h('span.row-label', 'POP 履歴'), popped)), log)),
  }))
  draw()
  return root
}

/* ========== LAB 3-3: recursion = stack ========== */
const FACT_SRC = `
int fact(int n)
{
  if (n == 1 || n == 0)
    return 1;          // 0! = 1! = 1
  else
    return n*fact(n-1); // n! = n*(n-1)!
}`
function factLab() {
  const sl = h('input', { type: 'range', min: 1, max: 6, value: 3, style: { width: '140px' }, 'aria-label': 'n' })
  const nv = h('span.mono.amber', '3')
  const frames = h('div', { style: { display: 'flex', flexDirection: 'column-reverse', gap: '6px', minHeight: '240px', justifyContent: 'flex-start' } })
  const narr = h('div.narr')
  const code = codeView(FACT_SRC)
  const build = () => {
    const n = +sl.value; nv.textContent = n
    const st = []
    const stack = []
    const rec = (k) => {
      stack.push({ k, ret: null })
      st.push({ stack: stack.map((x) => ({ ...x })), line: 4, msg: `fact(${k}) を<b>呼出</b> → 引数 ${k} を <b>PUSH</b>` })
      if (k <= 1) { stack[stack.length - 1].ret = 1; st.push({ stack: stack.map((x) => ({ ...x })), line: 5, msg: `fact(${k}) = 1（基底）` }); stack.pop(); st.push({ stack: stack.map((x) => ({ ...x })), line: 5, msg: `<b>復帰</b> → ${k} を <b>POP</b>、呼び出し元へ 1 を返す`, ret: 1 }); return 1 }
      st.push({ stack: stack.map((x) => ({ ...x })), line: 7, msg: `${k} × fact(${k - 1}) を計算するため fact(${k - 1}) を呼ぶ` })
      const r = rec(k - 1)
      const v = k * r
      stack[stack.length - 1].ret = v
      st.push({ stack: stack.map((x) => ({ ...x })), line: 7, msg: `fact(${k}) = ${k} × ${r} = <b class="l">${v}</b>` })
      stack.pop()
      st.push({ stack: stack.map((x) => ({ ...x })), line: 7, msg: `<b>復帰</b> → ${k} を <b>POP</b>`, ret: v })
      return v
    }
    st.unshift({ stack: [], line: 0, msg: `main から fact(${n}) を呼ぶ` })
    const ans = rec(n)
    st.push({ stack: [], line: 0, msg: `result = <b class="l">${ans}</b>。最後に積んだもの（一番深い呼出）から先に片付く = <b>LIFO</b>` })
    player.load(st)
  }
  const render = (f) => {
    code.cur(f.line)
    narr.innerHTML = f.msg
    frames.innerHTML = ''
    f.stack.forEach((fr, i) => frames.appendChild(h('div.mono', { style: { border: '1px solid ' + (i === f.stack.length - 1 ? 'var(--amber)' : 'var(--line-2)'), background: i === f.stack.length - 1 ? 'var(--amber-soft)' : 'var(--bg)', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', animation: 'chipIn .3s both' } },
      h('span', `a[${i}] = ${fr.k}`, h('span.muted', `   fact(${fr.k})`)), fr.ret != null ? h('span.lime', `= ${fr.ret}`) : h('span.muted', '…'))))
    if (!f.stack.length) frames.appendChild(h('div.small.center', { style: { padding: '20px' } }, '（スタックは空）'))
  }
  const root = h('div')
  const player = new Player({ render, interval: 1000, keyTarget: root })
  sl.addEventListener('input', build)
  root.append(lab({ title: 'LAB 3-3 — 再帰呼び出しの裏ではスタックが動いている', hint: '呼出で PUSH、復帰で POP',
    body: h('div', h('div.ctrl-row', h('div.field', h('label', 'n ='), sl, nv)), h('div.sep'),
      h('div.lab-grid.even', h('div', { style: { display: 'grid', gap: '12px', alignContent: 'start' } }, h('div.eyebrow', 'コールスタック（下が底）'), frames, narr), code)),
    foot: player.el }))
  build()
  return root
}

/* ========== LAB 3-4: circular queue ========== */
function queueLab() {
  const K = 8
  let a = Array(K).fill(null), head = 1, tail = 6
  ;[1, 5, 2, 8, 9].forEach((v, i) => (a[1 + i] = v))
  const xv = h('input.num', { type: 'number', value: 11, 'aria-label': 'x' })
  const log = h('div.log')
  const sH = stat('head', '', 'hl'), sT = stat('tail', '', 'cy'), sN = stat('要素数', '')
  const ring = h('div.stage', { style: { display: 'grid', placeItems: 'center', padding: '10px' } })
  const lin = h('div.stage', { style: { padding: '18px 8px 8px' } })
  const draw = (flash, kind) => {
    const S = 320, C = S / 2, R1 = 132, R0 = 78
    const svg = svgRoot(S, S, { style: { maxWidth: '340px' } })
    const ang = (i) => (i / K) * Math.PI * 2 - Math.PI / 2 - Math.PI / K
    const arc = (i) => {
      const a0 = ang(i) + 0.02, a1 = ang(i + 1) - 0.02
      const p = (r, t) => `${C + r * Math.cos(t)} ${C + r * Math.sin(t)}`
      return `M${p(R1, a0)} A${R1} ${R1} 0 0 1 ${p(R1, a1)} L${p(R0, a1)} A${R0} ${R0} 0 0 0 ${p(R0, a0)} Z`
    }
    const inQ = (i) => (head <= tail ? i >= head && i < tail : i >= head || i < tail)
    range(K).forEach((i) => {
      const filled = inQ(i)
      const fl = flash === i
      const col = fl ? (kind === 'out' ? '#ff5c8a' : '#2fbf71') : filled ? '#3fa9f5' : 'rgba(61,46,84,.18)'
      svg.appendChild(s('path', { d: arc(i), fill: fl ? (kind === 'out' ? 'rgba(255,92,138,.16)' : 'rgba(47,191,113,.16)') : filled ? 'rgba(63,169,245,.1)' : 'transparent', stroke: col, 'stroke-width': 1.2, 'stroke-dasharray': filled || fl ? '' : '3 4', style: 'transition: all .35s' }))
      const tm = (ang(i) + ang(i + 1)) / 2
      svg.appendChild(s('text', { x: C + (R0 + R1) / 2 * Math.cos(tm), y: C + (R0 + R1) / 2 * Math.sin(tm), 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: filled || fl ? '#3d2e54' : '#c3b9d1', 'font-size': 16, 'font-family': 'JetBrains Mono', text: filled || (fl && kind === 'out') ? a[i] : '' }))
      svg.appendChild(s('text', { x: C + (R1 + 14) * Math.cos(tm), y: C + (R1 + 14) * Math.sin(tm), 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'lbl', text: `a[${i}]` }))
    })
    const marker = (i, txt, col, r) => {
      const tm = (ang(i) + ang(i + 1)) / 2
      svg.appendChild(s('line', { x1: C + 22 * Math.cos(tm), y1: C + 22 * Math.sin(tm), x2: C + (R0 - 6) * Math.cos(tm), y2: C + (R0 - 6) * Math.sin(tm), stroke: col, 'stroke-width': 2 }))
      svg.appendChild(s('text', { x: C + r * Math.cos(tm), y: C + r * Math.sin(tm) + (txt === 'tail' && head === tail ? 12 : 0), 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: col, 'font-size': 11, 'font-family': 'JetBrains Mono', 'font-weight': 700, text: txt }))
    }
    marker(head, 'head', '#ff8a3d', 42)
    marker(tail, 'tail', '#3fa9f5', head === tail ? 52 : 42)
    svg.appendChild(s('circle', { cx: C, cy: C, r: 18, fill: '#ffffff', stroke: 'rgba(61,46,84,.15)' }))
    ring.innerHTML = ''; ring.appendChild(svg)
    // linear view
    const W2 = 560, svg2 = svgRoot(W2, 104)
    const x0 = (W2 - (K * CW + (K - 1) * GAP)) / 2
    range(K).forEach((i) => {
      const f = inQ(i)
      svg2.appendChild(s('g', { class: `cell ${f ? 'vis' : 'empty'} ${flash === i ? (kind === 'out' ? 'bad' : 'ok') : ''}`, transform: `translate(${x0 + i * (CW + GAP)},28)` },
        s('rect', { width: CW, height: CW, rx: 9 }), s('text', { x: CW / 2, y: CW / 2, class: 'v', text: f ? a[i] : '' }), s('text', { x: CW / 2, y: CW + 13, class: 'idx', text: `a[${i}]` })))
    })
    const lx = (i) => x0 + i * (CW + GAP) + CW / 2
    svg2.appendChild(s('text', { x: lx(head), y: 12, 'text-anchor': 'middle', class: 'lbl am', text: 'head' }))
    svg2.appendChild(s('text', { x: lx(tail), y: head === tail ? 24 : 12, 'text-anchor': 'middle', class: 'lbl cy', text: 'tail' }))
    lin.innerHTML = ''; lin.appendChild(svg2)
    sH.set(String(head)); sT.set(String(tail)); sN.set(`${(tail - head + K) % K} <small>/ 最大 ${K - 1}</small>`)
  }
  const addLog = (x) => log.prepend(h('div', { html: x }))
  const enq = () => {
    if (head === (tail + 1) % K) { addLog(`<span class="ng">ENQUEUE: エラー — head = (tail+1) % K（一杯）。a[${tail}] に入れると head = tail になり「空」と区別できない</span>`); draw(); return }
    const x = +xv.value; a[tail] = x; const at = tail; tail = (tail + 1) % K
    draw(at, 'in'); addLog(`<b>ENQUEUE(${x}, Q)</b> → a[${at}] ← ${x}, tail ← ${tail}${at === K - 1 ? ' <span class="am">（K に達したので 0 へ巡回）</span>' : ''}`)
    xv.value = Math.floor(Math.random() * 30) + 1
  }
  const deq = () => {
    if (head === tail) { addLog('<span class="ng">DEQUEUE: エラー — head = tail（空）</span>'); return }
    const v = a[head], at = head; head = (head + 1) % K
    draw(at, 'out'); addLog(`<b>DEQUEUE(Q)</b> → <span class="ok">${v}</span> を返す, head ← ${head}${at === K - 1 ? ' <span class="am">（0 へ巡回）</span>' : ''}`)
  }
  const root = h('div', lab({
    title: 'LAB 3-4 — 待ち行列（FIFO）: 配列を「輪」にして使う',
    hint: 'head・tail は 0〜K−1 を巡回する',
    body: h('div',
      h('div.ctrl-row', h('div.field', h('label', 'x ='), xv),
        h('button.op', { onclick: enq }, 'ENQUEUE(x, Q)'), h('button.op', { onclick: deq }, 'DEQUEUE(Q)'),
        h('button.op', { onclick: () => addLog(`<b>EMPTY(Q)</b> → ${head === tail ? '<span class="ok">true</span>' : '<span class="ng">false</span>'}`) }, 'EMPTY(Q)'),
        h('button.op.ghost', { onclick: () => { head = tail = 0; draw(); addLog('<b>CREATE(Q)</b> → head ← 0, tail ← 0') } }, 'CREATE(Q)'),
        h('button.op.ghost', { onclick: () => { a = Array(K).fill(null); head = 1; tail = 6; [1, 5, 2, 8, 9].forEach((v, i) => (a[1 + i] = v)); draw(); log.innerHTML = '' } }, 'リセット')),
      h('div.sep'),
      h('div.lab-grid.even', ring, h('div', { style: { display: 'grid', gap: '10px', alignContent: 'start' } }, h('div.stats', sH, sT, sN), log)),
      h('div', { style: { marginTop: '12px' } }, h('div.eyebrow', '同じ配列を一直線に並べると'), lin)),
  }))
  draw()
  return root
}

/* ========== LAB 3-5: operation simulator (exam-style) ========== */
function simLab() {
  let kind = 'stack'
  const init = h('input.txt', { value: '6 3 12', 'aria-label': '初期状態' })
  const hIn = h('input.num', { type: 'number', value: 1, 'aria-label': 'head' })
  const ops = h('input.txt', { value: 'PUSH 4, POP, PUSH 8, PUSH 2, POP, POP, PUSH 20', style: { width: '100%' }, 'aria-label': '操作列' })
  const out = h('div')
  const hRow = h('div.field', { style: { display: 'none' } }, h('label', 'head ='), hIn)
  const run = () => {
    const K = 8
    const vals = parseNums(init.value)
    const a = Array(K).fill('')
    let top = 0, head = +hIn.value || 0, tail
    if (kind === 'stack') { vals.slice(0, K).forEach((v, i) => (a[i] = v)); top = Math.min(vals.length, K) }
    else { vals.slice(0, K - 1).forEach((v, i) => (a[(head + i) % K] = v)); tail = (head + Math.min(vals.length, K - 1)) % K }
    const rows = [], rets = []
    let maxTop = top
    const snap = (op, note) => rows.push({ op, a: a.slice(), top, head, tail, note })
    snap('初期状態', '')
    ops.value.split(/[,，、\n]+/).map((x) => x.trim()).filter(Boolean).forEach((o) => {
      const m = o.match(/^(PUSH|ENQUEUE|POP|DEQUEUE)\s*\(?\s*(-?\d+)?/i)
      if (!m) return
      const op = m[1].toUpperCase(), x = m[2] != null ? +m[2] : null
      if (kind === 'stack') {
        if (op === 'PUSH' || op === 'ENQUEUE') { if (top === K) snap(`PUSH(${x})`, 'エラー: 一杯'); else { a[top] = x; top++; maxTop = Math.max(maxTop, top); snap(`PUSH(${x}, S)`, '') } }
        else { if (top === 0) snap('POP(S)', 'エラー: 空'); else { top--; const v = a[top]; rets.push(v); snap('POP(S)', `→ ${v}`) } }
      } else {
        if (op === 'PUSH' || op === 'ENQUEUE') { if (head === (tail + 1) % K) snap(`ENQUEUE(${x})`, 'エラー: 一杯'); else { a[tail] = x; tail = (tail + 1) % K; snap(`ENQUEUE(${x}, Q)`, '') } }
        else { if (head === tail) snap('DEQUEUE(Q)', 'エラー: 空'); else { const v = a[head]; rets.push(v); head = (head + 1) % K; snap('DEQUEUE(Q)', `→ ${v}`) } }
      }
    })
    out.innerHTML = ''
    const head_ = ['操作', ...range(K).map((i) => `a[${i}]`), kind === 'stack' ? 'top' : 'head / tail', '返り値']
    const live = (r, i) => (kind === 'stack' ? i < r.top : r.head <= r.tail ? i >= r.head && i < r.tail : i >= r.head || i < r.tail)
    out.append(table(head_, rows.map((r) => [r.op, ...r.a.map((v, i) => (live(r, i) ? `<b>${v}</b>` : `<span style="color:var(--mute-2)">${v === '' ? '·' : v}</span>`)), kind === 'stack' ? r.top : `${r.head} / ${r.tail}`, r.note ? `<span class="${r.note.startsWith('エ') ? 'rose' : 'lime'}">${r.note}</span>` : ''])),
      h('div.stats', stat('最終配列（中身はそのまま残る）', `<span class="mono" style="font-size:18px">${rows[rows.length - 1].a.map((v) => (v === '' ? '·' : v)).join(' ')}</span>`), stat('返り値の列', `<span class="mono" style="font-size:18px">${rets.join(' ') || '—'}</span>`, 'li'), kind === 'stack' ? stat('top の最大値', String(maxTop), 'hl') : stat('最終 head / tail', `${head} / ${tail}`, 'hl')),
      h('p.small', { style: { marginTop: '10px' } }, '※ POP / DEQUEUE は top・head を動かすだけで、配列の値は消さない（講義の「必要があれば空にする」をしない場合）。太字が「論理的に入っている」要素。'))
  }
  const kindSeg = seg([['stack', 'スタック'], ['queue', '待ち行列']], 'stack', (v) => {
    kind = v; hRow.style.display = v === 'queue' ? '' : 'none'
    if (v === 'queue') { init.value = '7 3 14 5'; hIn.value = 5; ops.value = 'ENQUEUE 9, DEQUEUE, ENQUEUE 1, ENQUEUE 6, DEQUEUE, DEQUEUE' }
    else { init.value = '6 3 12'; ops.value = 'PUSH 4, POP, PUSH 8, PUSH 2, POP, POP, PUSH 20' }
    run()
  })
  ;[init, hIn, ops].forEach((x) => x.addEventListener('change', run))
  run()
  return lab({ title: 'LAB 3-5 — 操作列シミュレータ（K = 8）', hint: '自分で手計算した結果の検算に',
    body: h('div', h('div.ctrl-row', kindSeg, h('div.field', h('label', '初期要素 ='), init), hRow), h('div.ctrl-row', h('div.field.w-full', h('label', '操作 ='), ops), h('button.op', { onclick: run }, '実行')), h('div.sep'), out) })
}

export default {
  n: 3,
  title: 'リスト・スタック・待ち行列',
  sub: '基本的なデータ構造 (1) と、その配列／ポインタによる実現',
  en: 'List, Stack & Queue',
  tags: ['配列リスト', '連結リスト', 'LIFO', 'FIFO', '循環バッファ'],
  mini: '<svg viewBox="0 0 120 60"><g fill="none" stroke="#3d2e54" stroke-opacity=".5"><rect x="4" y="22" width="20" height="16" rx="3"/><rect x="34" y="22" width="20" height="16" rx="3"/><rect x="64" y="22" width="20" height="16" rx="3"/></g><rect x="94" y="22" width="20" height="16" rx="3" fill="rgba(255,138,61,.2)" stroke="#ff8a3d"/><path d="M24 30h10M54 30h10M84 30h10" stroke="#ff8a3d"/></svg>',
  goals: [
    'データ構造が「データの集まり・規則・操作」から成ることを説明できる',
    'リストの配列による実現と連結リスト（ポインタ）による実現を説明できる',
    'スタック（LIFO）の配列による実現を説明できる',
    '待ち行列（FIFO）の配列による実現（循環）を説明できる',
  ],
  chapters: [
    {
      id: 'ds', k: 'CONCEPT', title: 'データ構造 ＝ データ ＋ 規則 ＋ 操作',
      build: (el) => el.append(
        talk(`S: 今回から具体的なデータ構造に入るよ。まず、データ構造をちゃんと定義し直そう。
R: 第 1 回は「データを組織化して格納したもの」でしたよね。
S: そう。もっと細かく言うと、<b>データの集まり</b>、それを正しく扱うための決まりごとである<b>規則</b>、そしてデータに対する<b>操作</b>の 3 つから成るんだ。`),
        cols(3,
          card('データの集まり', '例: 3, 5, 8, 11, 12', '01'),
          card('規則', 'データを正しく操作・管理・保持するための決まりごと（例: 1 列に並べる、頂点からだけ出し入れする）', '02', 'accent'),
          card('操作', 'INSERT, DELETE, FIND, NEXT, PUSH, POP, ENQUEUE, DEQUEUE …', '03')),
        talk(`R: 箱が「セル」でしたっけ？
S: うん。データ構造を作る基本単位が<b>セル</b>で、1 つのデータは 1 つのセルに入る。
S: 先に結論を言っておくと、<b>全部の操作を効率よくするのは難しい</b>。だから「どの操作を速くしたいか」で実現方法を選ぶ。今回はずっとこの話。`),
        point('データ構造 ＝ <b>データの集まり ＋ 規則 ＋ 操作</b>。基本単位は<b>セル</b>。何を速くしたいかで実現方法を選ぶ。'),
      ),
    },
    {
      id: 'list', k: 'STRUCTURE', title: 'リスト — 配列で作るか、ポインタで作るか',
      build: (el) => el.append(
        talk(`S: 最初は<b>リスト</b>。規則は「<b>0 個以上の要素を 1 列に並べる</b>」だけ。a₀, a₁, …, aₙ₋₁ って書く。
R: シンプルですね。
S: 中身は動的に変わるから、挿入・削除・参照みたいな操作が要る。で、実現方法が 2 つある。<b>配列リスト</b>と<b>連結リスト</b>。`),
        cols(2,
          card('配列リスト', 'aᵢ を配列のセル a[i] に格納。配列は記憶領域の中で<strong>ひとまとまり</strong>なので、a[i] の位置は番号から計算できる。', 'ARRAY LIST'),
          card('連結リスト', '各セル ＝ 要素を入れる箱 ＋ <strong>次のセルの位置</strong>を持つポインタ。セルは記憶領域の中で<strong>離れた位置</strong>にある。', 'LINKED LIST')),
        talk(`R: 何が違ってくるんですか？
S: 百聞は一見にしかず。同じ操作を 2 つ同時に実行してみよう。まずは FIND、次に INSERT を押してみて。`),
        listLab(),
        talk(`R: FIND は配列が一発で、連結リストは先頭から順番にたどってる…！
S: 配列は番号から場所を計算できるから <b>O(1)</b>。連結リストのセルは「次のセルの場所」しか知らないから、先頭からたどるしかなくて <b>O(n)</b>。
R: でも INSERT だと、配列は後ろの要素を全部ずらしてますね。
S: そう、それが配列の弱点で <b>O(n)</b>。連結リストは<b>セルを作ってポインタを 2 本付け替えるだけ</b>。挿入位置 p がわかっていれば <b>O(1)</b> で済む。
R: 得意なことが真逆なんですね。
S: まとめるとこう。表の中の O(n) は、探索込みの話だよ。`),
        h('div.reveal', table(['操作', '配列リスト', '連結リスト', 'メモ'], [
          ['FIND(i, L) — aᵢ の参照', 'O(1)', 'O(n)', '連結は先頭から i 個たどる'],
          ['INSERT(x, i, L) — aᵢ の後に挿入', 'O(n)', 'O(n)', '連結: 位置 p が既知なら O(1)'],
          ['DELETE_N(i, L) — aᵢ₊₁ を削除', 'O(n)', 'O(n)', '連結: 位置 p が既知なら O(1)'],
          ['LOCATE(x, L) — x の位置', 'O(n)', 'O(n)', ''],
          ['TOP(L) / LAST(L)', 'O(1) / O(1)', 'O(1) / O(n)', ''],
          ['NEXT(p, L)', 'O(1)', 'O(1)', ''],
          ['PREVIOUS(p, L)', 'O(1)', 'O(n)', '連結は前のセルを知らない'],
          ['DELETE(i, L) — aᵢ を削除', 'O(n)', 'O(n)', ''],
          ['空間計算量', 'O(K)', 'O(n)', 'K ≫ n なら連結が有利'],
        ], (c, r, ci) => (ci === 1 || ci === 2 ? (c.startsWith('O(1)') && !c.includes('O(n)') ? 'o1' : c.includes('O(n)') && !c.includes('O(1)') ? 'on' : 'mid') : ''))),
        talk(`R: 空間計算量も違うんですか？
S: 配列は長さ K を最初に確保するから、要素数 n よりずっと大きい K を用意すると無駄が多い（<b>O(K)</b>）。それに K 個までしか入らない。連結リストは要素の分だけセルがあればいいから <b>O(n)</b>。
R: 連結リストの PREVIOUS や LAST が遅いのは、なんとかならないんですか？
S: 各セルに<b>前と後ろ両方</b>のポインタを持たせた<b>双方向リスト（双連結リスト）</b>にすれば、LAST と PREVIOUS は <b>O(1)</b> になるよ。`),
        point('<b>配列リスト</b>: 参照 O(1)・挿入削除 O(n)・上限 K。<b>連結リスト</b>: 参照 O(n)・位置が既知なら挿入削除 O(1)・空間 O(n)。'),
      ),
    },
    {
      id: 'stack', k: 'STRUCTURE', title: 'スタック — 後入れ先出し（LIFO）',
      build: (el) => el.append(
        talk(`S: 次は<b>スタック</b>。規則は「<b>挿入も削除も、いつも頂点から</b>」。
R: 頂点だけ…？
S: 食器棚のお皿を想像して。洗ったお皿は一番上に置く（PUSH）、使うときも一番上から取る（POP）。<b>最後に入れたものが最初に出る</b>から、<b>LIFO（Last-In-First-Out）</b>リストとも呼ぶ。
R: 途中に入れることがないなら、配列でも遅くならなそうですね。
S: 鋭い。途中に挿入しないから、配列でも連結でもオーダは変わらない。講義では配列で作る。頂点の位置を変数 <span class="inline-code">top</span> で管理するんだけど、<b>top ＝ 次に要素を入れるセルの位置</b>ってところに注意。`),
        h('div.reveal', table(['操作', '動作', '計算量'], [
          ['CREATE(S)', 'top ← 0', 'O(1)'],
          ['EMPTY(S)', 'top = 0 か？', 'O(1)'],
          ['TOP(S)', 'top を返す', 'O(1)'],
          ['PUSH(x, S)', 'top = K ならエラー。a[top] ← x; top ← top + 1', 'O(1)'],
          ['POP(S)', 'top = 0 ならエラー。top ← top − 1; a[top] を返す', 'O(1)'],
        ], (c, r, ci) => (ci === 2 ? 'o1' : ''))),
        stackLab(),
        talk(`R: スタックって、実際どこで使われてるんですか？
S: 実は毎日使ってるよ。<b>関数の再帰呼び出し</b>。呼び出すたびに引数を PUSH して、戻るたびに POP してるんだ。階乗 fact(n) で見てみよう。`),
        factLab(),
        talk(`R: 一番深い fact(1) から順に片付いていく…。まさに後入れ先出しだ。
S: 第 4 回の木の探索でも、このスタックがまた出てくるからね。`),
        point('スタック ＝ <b>頂点からだけ</b>出し入れ ＝ <b>LIFO</b>。配列で top を管理し、全操作 <b>O(1)</b>。再帰呼び出しの裏で動いている。'),
      ),
    },
    {
      id: 'queue', k: 'STRUCTURE', title: '待ち行列 — 先入れ先出し（FIFO）',
      build: (el) => el.append(
        talk(`S: 最後は<b>待ち行列（キュー）</b>。挿入は<b>最後尾</b>から、削除は<b>先頭</b>から。
R: レジの行列ですね。先に並んだ人から抜けていく。
S: そう、<b>FIFO（First-In-First-Out）</b>リスト。これも配列で作るんだけど、ちょっと工夫が要る。
R: 先頭から抜けると、前が空いちゃいますもんね。毎回詰めるんですか？
S: それだと O(n) になっちゃう。だから<b>配列を輪っかみたいにつなげて</b>使うんだ。先頭の位置 <span class="inline-code">head</span>（要素が入っている最初の位置）と、最後尾の位置 <span class="inline-code">tail</span>（要素が入っている<b>次の</b>位置）を管理して、K に達したら 0 に戻す。`),
        h('div.reveal', table(['操作', '動作', '計算量'], [
          ['CREATE(Q)', 'head ← 0, tail ← 0', 'O(1)'],
          ['EMPTY(Q)', 'head = tail か？', 'O(1)'],
          ['ENQUEUE(x, Q)', 'head = (tail+1) % K ならエラー。a[tail] ← x; tail ← (tail+1) % K', 'O(1)'],
          ['DEQUEUE(Q)', 'head = tail ならエラー。a[head] を返し head ← (head+1) % K', 'O(1)'],
        ], (c, r, ci) => (ci === 2 ? 'o1' : ''))),
        queueLab(),
        talk(`R: あれ、7 個入れたところで ENQUEUE がエラーになりました。K = 8 なのに？
S: いいところに気づいたね。もし 8 個全部埋めたら、tail が一周して head に追いついて <b>head = tail</b> になる。
R: head = tail って…「空」の条件と同じだ！
S: そう、<b>空と満杯の区別がつかなくなる</b>。だから先頭と最後尾の間に<b>空きセルを 1 つ</b>必ず残す。格納できるのは最大 <b>K − 1 個</b>。これはよく問われるよ。
R: 課題みたいに操作を何回も続けると、手計算がこんがらがりそう…。
S: 自分で手計算してから、下のシミュレータで検算するといい。<b>POP や DEQUEUE は top や head を動かすだけで、配列の中の値は消さない</b>ってことも確認しておいて。`),
        simLab(),
        point('待ち行列 ＝ <b>最後尾から入れて先頭から出す</b> ＝ <b>FIFO</b>。配列を<b>循環</b>させ全操作 O(1)。空と満杯を区別するため最大 <b>K−1 個</b>。'),
      ),
    },
  ],
  quiz: [
    { kind: 'input', tag: 'トレース', q: '長さ K = 8 の配列リスト L に 4, 9, 1, 7, 3 が a[0]〜a[4] に入っている。INSERT(6, 2, L) を実行した後の a[0]〜a[5] を空白区切りで答えよ。', answer: '4 9 1 6 7 3', placeholder: '例: 1 2 3', explain: 'INSERT(x, i, L) は a<sub>i</sub> の<strong>後</strong>に挿入。a₂ = 1 の後ろに 6 が入り、7, 3 が右にずれる。' },
    { kind: 'multi', tag: '配列リスト', q: '配列リストについて正しいものをすべて選べ。', opts: ['要素 aᵢ の参照は O(1)', 'リストの各要素は連続した記憶領域に格納される', '先頭への挿入は O(1) でできる', '格納できる要素数には上限がある'], answer: [0, 1, 3], explain: '先頭に挿入するには全要素をずらす必要があるので O(n)。' },
    { kind: 'choice', tag: '連結リスト', q: '要素数 6 の連結リストで DELETE_N(2, L) を実行するとき、付け替えるポインタを持つセルはどれか？', opts: ['a₁ のセル', 'a₂ のセル', 'a₃ のセル', 'a₄ のセル'], answer: 1, explain: 'DELETE_N(i, L) は a<sub>i+1</sub> を削除。a₂ のポインタを a₄ に付け替え、a₃ のセルを削除する。' },
    { kind: 'multi', tag: '連結リスト', q: '（片方向）連結リストについて正しいものをすべて選べ。', opts: ['PREVIOUS(p, L) は O(1)', 'LAST(L) は O(n)', '空間計算量は O(n)', '位置 p が与えられれば p の後ろへの挿入は O(1)'], answer: [1, 2, 3], explain: '前のセルへのポインタがないので PREVIOUS は O(n)。双連結リストにすると O(1)。' },
    { kind: 'input', tag: 'トレース', q: 'K = 8 の配列スタックに 3, 7 が a[0], a[1] に入っている（top = 2）。PUSH(5), PUSH(1), POP, PUSH(4), POP, POP を順に実行したとき、POP が返す値を順に空白区切りで答えよ。', answer: '1 4 5', explain: 'PUSH 後 [3,7,5,1] → POP=1 → PUSH4 [3,7,5,4] → POP=4 → POP=5。LAB 3-5 で検算できる。' },
    { kind: 'input', tag: 'トレース', q: '前問の操作中、top の最大値は？', answer: '4', explain: '[3,7,5,1] の時点で top = 4。PUSH(4) の後も 4。' },
    { kind: 'input', tag: 'トレース', q: 'K = 8 の待ち行列で head = 6, tail = 1（a[6], a[7], a[0] に要素）。ENQUEUE を 2 回、DEQUEUE を 4 回行った後の head と tail を空白区切りで答えよ。', answer: '2 3', explain: 'ENQUEUE ×2 で tail = 3。DEQUEUE ×4 で head = 6→7→0→1→2。巡回に注意。' },
    { kind: 'choice', tag: '概念', q: 'K = 8 の配列で実現した待ち行列に同時に格納できる要素数の最大は？', opts: ['6', '7', '8', '9'], answer: 1, explain: 'head = tail を「空」と区別するため、空セルを 1 つ残す必要がある → K − 1 = 7。' },
    { kind: 'input', tag: '用語', q: '待ち行列は別名何リストと呼ばれるか？（英字 4 文字）', answer: ['FIFO', 'fifo'], explain: 'First-In-First-Out。スタックは LIFO。' },
  ],
}
