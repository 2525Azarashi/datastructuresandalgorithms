import { h, s, svgRoot, lab, Player, stat, callout, tldr, prose, card, cols, formula, table, seg, parseNums, $$, range, toast , talk, point } from '../lib/ui.js'
import { layoutTree, layoutBinary, drawGraph, setNodeClass } from '../lib/viz.js'

/* ---------------------------------------------------------
   第4回  基本的なデータ構造(2): グラフ・木・2分木
   --------------------------------------------------------- */

const circle = (n, W, H, r) => Object.fromEntries(range(n).map((i) => { const a = (i / n) * Math.PI * 2 - Math.PI / 2; return [i, { x: W / 2 + Math.cos(a) * r, y: H / 2 + Math.sin(a) * r }] }))

/* ========== LAB 4-1: graph editor with 3 representations ========== */
function graphRepLab() {
  let n = 4
  let M = [[0, 1, 1, 0], [1, 0, 1, 1], [1, 1, 0, 0], [0, 1, 0, 0]]
  let directed = false
  let rep = 'matrix'
  let q = [0, 3]
  const gStage = h('div.stage', { style: { display: 'grid', placeItems: 'center', minHeight: '300px' } })
  const repBox = h('div')
  const info = h('div.stats')
  const qNarr = h('div.narr')
  const nSel = seg([[4, 'n=4'], [5, 'n=5'], [6, 'n=6']], 4, (v) => {
    const old = M; n = v
    M = range(n).map((i) => range(n).map((j) => (old[i]?.[j] ?? 0)))
    draw()
  })
  const toggle = (i, j) => {
    if (i === j) return
    M[i][j] = M[i][j] ? 0 : 1
    if (!directed) M[j][i] = M[i][j]
    draw([i, j])
  }
  function adjArrays() {
    const a = [], adj = []
    range(n).forEach((i) => { a.push(adj.length); range(n).forEach((j) => M[i][j] && adj.push(j)); adj.push(-1) })
    return { a, adj }
  }
  function draw(flash) {
    const W = 340, H = 300
    const pos = circle(n, W, H, 112)
    const edges = []
    range(n).forEach((i) => range(n).forEach((j) => { if (M[i][j] && (directed || i < j)) edges.push([i, j, q && ((q[0] === i && q[1] === j) || (!directed && q[0] === j && q[1] === i)) ? 'on' : '']) }))
    const G = drawGraph({ pos, edges, W, H, r: 19, directed, onNode: (i) => { q = [q[1], i]; draw() } })
    setNodeClass(G.nodeEl, (i) => (i === q[0] ? 'cur' : i === q[1] ? 'sel' : ''))
    gStage.innerHTML = ''; gStage.appendChild(G.svg)
    const m = M.flat().reduce((x, y) => x + y, 0)
    const { a, adj } = adjArrays()
    const dmax = Math.max(...M.map((r) => r.reduce((x, y) => x + y, 0)))
    info.innerHTML = ''
    info.append(stat('節点数 n', String(n)), stat('辺数 m', `${m}${directed ? '' : '<small>（線分×2）</small>'}`, 'hl'), stat('d<sub>max</sub>', String(dmax), 'cy'))
    repBox.innerHTML = ''
    const [qi, qj] = q
    if (rep === 'matrix') {
      const t = h('table.matrix', h('tr', h('th', ''), range(n).map((j) => h('th', j))),
        range(n).map((i) => h('tr', h('th', i), range(n).map((j) => {
          const td = h('td', { class: `${M[i][j] ? 'one' : ''} ${i === j ? 'diag' : ''} ${flash && ((flash[0] === i && flash[1] === j) || (!directed && flash[0] === j && flash[1] === i)) ? 'flash' : ''}`, onclick: () => toggle(i, j), title: `a[${i}][${j}]`, style: i === qi && j === qj ? { outline: '2px solid var(--amber)', outlineOffset: '1px' } : {} }, M[i][j])
          return td
        }))))
      repBox.append(h('div.scroll-x', t), h('div.stats', { style: { marginTop: '12px' } }, stat('空間計算量', `n² = ${n * n}`, 'hl'), stat('辺 (i,j) の有無', 'O(1)', 'li'), stat('隣接リスト先頭', 'O(1)', 'li')))
      qNarr.innerHTML = `辺 (${qi}, ${qj}) の有無 → <b>a[${qi}][${qj}] を 1 回見るだけ</b> = ${M[qi][qj] ? '<b class="l">ある</b>' : '<b class="r">ない</b>'}（1 回）。セルをクリックすると辺を追加／削除できる。`
    } else if (rep === 'array') {
      const start = a[qi]
      let steps = 0, found = false
      for (let k = start; adj[k] !== -1; k++) { steps++; if (adj[k] === qj) { found = true; break } }
      const hl = new Set(); for (let k = start; k < start + steps; k++) hl.add(k)
      repBox.append(
        h('div.arr-name', `配列 a（長さ n = ${n}）: a[i] = 節点 i の隣接リストの開始位置`),
        h('div.arr-block', h('div.arr-row', a.map((v, i) => h('div.c', { class: i === qi ? 'c hl' : 'c' }, h('i', i), v)))),
        h('div.arr-name', `配列 adj（長さ m + n = ${adj.length}）: −1 は番兵（隣接リストの終わり）`),
        h('div.arr-block', h('div.arr-row', adj.map((v, k) => h('div.c', { class: v === -1 ? 'c sent' : hl.has(k) ? 'c hl' : 'c' }, h('i', k), v)))),
        h('div.stats', { style: { marginTop: '12px' } }, stat('空間計算量', `m + n = ${adj.length}`, 'hl'), stat('辺 (i,j) の有無', 'O(d<sub>max</sub>)', 'cy'), stat('隣接リスト先頭', 'O(1)', 'li')))
      qNarr.innerHTML = `辺 (${qi}, ${qj}) の有無 → a[${qi}] = ${start} から番兵 −1 まで順に見る: <b>${steps} 回</b>で ${found ? '<b class="l">発見</b>' : '<b class="r">なし</b>'}。最悪 d<sub>max</sub> 回 ⊆ O(n)。`
    } else {
      let steps = 0, found = false
      const lists = range(n).map((i) => range(n).filter((j) => M[i][j]).reverse())
      for (const v of lists[qi]) { steps++; if (v === qj) { found = true; break } }
      repBox.append(h('div', { style: { display: 'grid', gap: '6px' } }, range(n).map((i) => h('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' } },
        h('div.arr-row', h('div.c', { class: i === qi ? 'c hl' : 'c' }, `a[${i}]`)), h('span.muted.mono', '→'),
        lists[i].map((v, k) => [h('span.chip', { class: i === qi && k < steps ? (v === qj ? 'chip li' : 'chip am') : 'chip', style: { animation: 'none' } }, v), h('span.muted.mono', '→')]),
        h('span.rose.mono', { style: { fontSize: '12px' } }, 'null')))),
        h('div.stats', { style: { marginTop: '12px' } }, stat('空間計算量', `O(m + n)`, 'hl'), stat('辺 (i,j) の有無', 'O(d<sub>max</sub>)', 'cy'), stat('辺の追加', '得意', 'li')))
      qNarr.innerHTML = `辺 (${qi}, ${qj}) の有無 → 連結リスト adj<sub>${qi}</sub> を先頭から辿る: <b>${steps} 回</b>で ${found ? '<b class="l">発見</b>' : '<b class="r">なし</b>'}。新しい辺はリストの先頭にセルを足すだけなので追加が得意。`
    }
  }
  const repSeg = seg([['matrix', '① 隣接行列'], ['array', '② 配列リスト改'], ['linked', '③ 連結リスト']], 'matrix', (v) => { rep = v; draw() })
  const dirSeg = seg([[false, '無向'], [true, '有向']], false, (v) => { directed = v; if (!v) range(n).forEach((i) => range(n).forEach((j) => { if (M[i][j]) M[j][i] = 1 })); draw() })
  draw()
  return lab({
    title: 'LAB 4-1 — 1 つのグラフ、3 つの覚え方',
    hint: '節点を 2 つクリック → その辺の有無を調べるコスト',
    body: h('div',
      h('div.ctrl-row', repSeg, dirSeg, nSel, h('button.op.ghost', { onclick: () => { M = range(n).map(() => range(n).fill(0)); draw() } }, '辺を全消去')),
      h('div.sep'),
      h('div.lab-grid', h('div', { style: { display: 'grid', gap: '10px', alignContent: 'start' } }, gStage, info), h('div', { style: { display: 'grid', gap: '12px', alignContent: 'start' } }, repBox, qNarr))),
  })
}

/* ========== LAB 4-2: BFS shortest path on graph ========== */
function bfsGraphLab() {
  const presets = {
    lecture: { n: 5, E: [[0, 1], [0, 2], [1, 3], [2, 4], [1, 2], [3, 4]], pos: { 0: { x: 60, y: 130 }, 1: { x: 180, y: 60 }, 2: { x: 180, y: 200 }, 3: { x: 320, y: 60 }, 4: { x: 320, y: 200 } }, W: 380, H: 260 },
    hex: { n: 6, E: [[0, 1], [0, 2], [0, 3], [0, 5], [1, 2], [1, 4], [2, 3], [3, 5], [4, 5]], W: 380, H: 280 },
    grid: { n: 9, E: [[0, 1], [1, 2], [3, 4], [4, 5], [6, 7], [7, 8], [0, 3], [3, 6], [1, 4], [4, 7], [2, 5], [5, 8]], pos: Object.fromEntries(range(9).map((i) => [i, { x: 70 + (i % 3) * 120, y: 50 + Math.floor(i / 3) * 90 }])), W: 380, H: 280 },
  }
  let P = presets.lecture, src = 0
  const stage = h('div.stage', { style: { display: 'grid', placeItems: 'center' } })
  const qChips = h('div.chips'), outChips = h('div.chips')
  const narr = h('div.narr')
  const paths = h('div', { style: { display: 'grid', gap: '4px' } })
  let G
  const build = () => {
    const pos = P.pos || circle(P.n, P.W, P.H, 108)
    G = drawGraph({ pos, edges: P.E.map(([u, v]) => [u, v]), W: P.W, H: P.H, r: 18, onNode: (i) => { src = i; build() } })
    stage.innerHTML = ''; stage.appendChild(G.svg)
    // dist labels
    G.labels = {}
    Object.entries(pos).forEach(([i, p]) => { const t = s('text', { x: p.x, y: p.y - 28, 'text-anchor': 'middle', class: 'lbl cy', text: '' }); G.svg.appendChild(t); G.labels[i] = t })
    const adj = range(P.n).map(() => [])
    P.E.forEach(([u, v]) => { adj[u].push(v); adj[v].push(u) })
    adj.forEach((l) => l.sort((a, b) => a - b))
    const st = [], dist = Array(P.n).fill(null), par = Array(P.n).fill(null), Q = [], out = []
    dist[src] = 0; Q.push(src)
    st.push({ dist: dist.slice(), par: par.slice(), Q: Q.slice(), out: out.slice(), cur: null, msg: `始点 s = ${src} を待ち行列に ENQUEUE。d(${src}) = 0` })
    while (Q.length) {
      const u = Q.shift(); out.push(u)
      st.push({ dist: dist.slice(), par: par.slice(), Q: Q.slice(), out: out.slice(), cur: u, msg: `DEQUEUE → u = ${u}（距離 ${dist[u]}）。u の隣接節点を調べる` })
      const added = []
      adj[u].forEach((v) => { if (dist[v] == null) { dist[v] = dist[u] + 1; par[v] = u; Q.push(v); added.push(v) } })
      if (added.length) st.push({ dist: dist.slice(), par: par.slice(), Q: Q.slice(), out: out.slice(), cur: u, edge: added.map((v) => [u, v]), msg: `未訪問の ${added.join(', ')} を発見 → 距離 ${dist[u] + 1} として ENQUEUE` })
    }
    st.push({ dist: dist.slice(), par: par.slice(), Q: [], out: out.slice(), cur: null, done: true, msg: `待ち行列が空 → 終了。<b>近い節点から順に</b>確定するので、最初に見つけた路が最短路` })
    player.load(st)
  }
  const render = (f) => {
    setNodeClass(G.nodeEl, (i) => (i === f.cur ? 'cur' : f.out.includes(i) ? 'vis' : f.Q.includes(i) ? 'q' : f.dist[i] != null ? 'q' : ''))
    Object.values(G.edgeEl).forEach((e) => e.setAttribute('class', 'edge'))
    f.par.forEach((p, v) => { if (p != null) G.edgeEl[`${p}-${v}`]?.setAttribute('class', 'edge vis') })
    ;(f.edge || []).forEach(([u, v]) => G.edgeEl[`${u}-${v}`]?.setAttribute('class', 'edge on'))
    Object.entries(G.labels).forEach(([i, t]) => (t.textContent = f.dist[i] != null ? `d=${f.dist[i]}` : ''))
    qChips.innerHTML = ''; f.Q.length ? f.Q.forEach((v) => qChips.appendChild(h('span.chip.am', v))) : qChips.appendChild(h('span.chip.empty', '空'))
    outChips.innerHTML = ''; f.out.forEach((v) => outChips.appendChild(h('span.chip.cy', v)))
    narr.innerHTML = f.msg
    paths.innerHTML = ''
    if (f.done) range(P.n).forEach((v) => { if (v === src) return; const pth = []; let x = v; while (x != null) { pth.unshift(x); x = f.par[x] } paths.appendChild(h('div.mono.small', f.dist[v] == null ? `${src} → ${v}: 到達不可` : h('span', `${src} → ${v}: `, h('span.amber', pth.join(' → ')), `  （長さ ${f.dist[v]}）`))) })
  }
  const root = h('div')
  const player = new Player({ render, interval: 1100, keyTarget: root })
  root.append(lab({
    title: 'LAB 4-2 — 最短路を「波紋」で求める（重み無しグラフ）',
    hint: '節点をクリックで始点を変更',
    body: h('div',
      h('div.ctrl-row', seg([['lecture', '講義の例'], ['hex', '6 節点'], ['grid', '格子']], 'lecture', (v) => { P = presets[v]; src = 0; build() })),
      h('div.sep'),
      h('div.lab-grid', stage, h('div', { style: { display: 'grid', gap: '10px', alignContent: 'start' } },
        h('div.kv-row', h('span.row-label', '待ち行列 Q'), qChips), h('div.kv-row', h('span.row-label', '確定順'), outChips), narr, paths))),
    foot: player.el,
  }))
  build()
  return root
}

/* ========== LAB 4-3: rooted tree explorer ========== */
function treeLab() {
  const inp = h('input.txt', { value: '-1 0 0 0 2 2 4', 'aria-label': '親配列 p', style: { width: '260px' } })
  const stage = h('div.stage.scroll-x', { style: { display: 'grid', placeItems: 'center', minHeight: '260px' } })
  const info = h('div', { style: { display: 'grid', gap: '6px', alignContent: 'start' } })
  const reps = h('div')
  const sum = h('div.stats')
  let sel = 2, p = []
  const build = () => {
    p = parseNums(inp.value).map((x) => Math.trunc(x))
    const n = p.length
    const roots = range(n).filter((i) => p[i] === -1)
    if (roots.length !== 1 || p.some((x, i) => x !== -1 && (x < 0 || x >= n || x === i))) { stage.innerHTML = '<div class="small" style="padding:30px">根（p[i] = −1）がちょうど 1 つの、正しい親配列を入力してください</div>'; return }
    const ch = range(n).map((i) => range(n).filter((j) => p[j] === i))
    // cycle check
    const depth = Array(n).fill(-1)
    const dfs = (u, d) => { depth[u] = d; ch[u].forEach((c) => dfs(c, d + 1)) }
    dfs(roots[0], 0)
    if (depth.some((d) => d < 0)) { stage.innerHTML = '<div class="small" style="padding:30px">閉路があるか、根につながっていない節点があります</div>'; return }
    if (sel >= n) sel = 0
    const L = layoutTree(roots[0], (u) => ch[u], { dx: 62, dy: 68, pad: 32 })
    const edges = []; range(n).forEach((i) => p[i] >= 0 && edges.push([p[i], i]))
    const G = drawGraph({ pos: L.pos, edges, W: L.W, H: L.H, r: 17, onNode: (i) => { sel = i; build() } })
    const anc = []; for (let x = sel; x !== -1; x = p[x]) anc.push(x)
    const desc = []; const dd = (u) => { desc.push(u); ch[u].forEach(dd) }; dd(sel)
    const sib = p[sel] === -1 ? [] : ch[p[sel]].filter((x) => x !== sel)
    setNodeClass(G.nodeEl, (i) => (i === sel ? 'cur' : anc.includes(i) ? 'hl2' : desc.includes(i) ? 'vis' : sib.includes(i) ? 'q' : ''))
    anc.slice(0, -1).forEach((x) => G.edgeEl[`${p[x]}-${x}`]?.setAttribute('class', 'edge on'))
    // depth guides
    for (let d = 0; d <= L.height; d++) G.svg.insertBefore(s('text', { x: 4, y: 32 + d * 68 + 4, class: 'lbl', text: `深さ${d}` }), G.svg.firstChild)
    stage.innerHTML = ''; stage.appendChild(G.svg)
    const leaves = range(n).filter((i) => !ch[i].length)
    const row = (k, v, cls) => h('div.kv-row', h('span.row-label', k), h('div.chips', v.length ? v.map((x) => h('span.chip', { class: 'chip ' + (cls || '') , style: { animation: 'none' } }, x)) : h('span.chip.empty', 'なし')))
    info.innerHTML = ''
    info.append(
      h('div.narr', { html: `節点 <b>${sel}</b> を選択中 — 深さ <b>${depth[sel]}</b>、親 <b>${p[sel] === -1 ? 'なし（根）' : p[sel]}</b>` }),
      row('子', ch[sel], 'cy'), row('兄弟', sib, 'am'), row('先祖', anc, ''), row('子孫', desc, 'cy'))
    sum.innerHTML = ''
    sum.append(stat('根', String(roots[0]), 'hl'), stat('葉', `${leaves.length}<small>{${leaves.join(',')}}</small>`, 'li'), stat('高さ', String(L.height), 'cy'), stat('節点数', String(n)))
    // representations: p / (l, r) left-child right-sibling
    const lch = range(n).map((i) => (ch[i][0] ?? -1)), rsib = range(n).map((i) => { if (p[i] === -1) return -1; const c = ch[p[i]]; const k = c.indexOf(i); return c[k + 1] ?? -1 })
    const arrRow = (name, vals, hlIdx) => h('div', h('div.arr-name', name), h('div.arr-block', h('div.arr-row', vals.map((v, i) => h('div.c', { class: hlIdx?.includes(i) ? 'c hl' : v === -1 ? 'c sent' : 'c' }, h('i', i), v)))))
    reps.innerHTML = ''
    reps.append(
      h('div.eyebrow', '実現方法 2: 配列リスト改（長男・次の兄弟）'),
      arrRow('p[i] = 親', p, [sel]),
      arrRow('l[i] = 子リストの先頭（長男）', lch, [sel]),
      arrRow('r[i] = 次の兄弟', rsib, ch[sel]),
      h('p.small', { style: { margin: '10px 0 0' } }, `節点 ${sel} の子リスト: l[${sel}] = ${lch[sel]} から r[] を辿る → ${ch[sel].join(' → ') || 'なし'} → −1。方法 1（p のみ）だと子を探すのに配列全体の走査 O(n) が必要。`))
  }
  inp.addEventListener('change', build)
  build()
  return lab({
    title: 'LAB 4-3 — 根付き木の用語を「触って」覚える',
    hint: '節点をクリック: 先祖（紫）・子孫（青）・兄弟（点線）',
    body: h('div',
      h('div.ctrl-row', h('div.field', h('label', 'p ='), inp), h('span.small', '親配列（根は −1）'),
        h('button.op', { onclick: () => { inp.value = '-1 0 0 0 2 2 4'; build() } }, '講義の例'),
        h('button.op', { onclick: () => { inp.value = '-1 0 0 1 1 2 3 3 6'; build() } }, '別の例')),
      h('div.sep'),
      h('div.lab-grid', h('div', { style: { display: 'grid', gap: '10px', alignContent: 'start' } }, stage, sum), info),
      h('div.sep'), reps),
  })
}

/* ========== LAB 4-4: tree BFS with queue ========== */
function treeBfsLab() {
  const inp = h('input.txt', { value: '-1 0 0 0 2 2', 'aria-label': '親配列 p', style: { width: '240px' } })
  const stage = h('div.stage', { style: { display: 'grid', placeItems: 'center', minHeight: '220px' } })
  const qC = h('div.chips'), oC = h('div.chips'), narr = h('div.narr')
  let G
  const build = () => {
    const p = parseNums(inp.value), n = p.length
    const root = p.indexOf(-1)
    if (root < 0) return
    const ch = range(n).map((i) => range(n).filter((j) => p[j] === i))
    const L = layoutTree(root, (u) => ch[u], { dx: 60, dy: 64, pad: 28 })
    const edges = []; range(n).forEach((i) => p[i] >= 0 && edges.push([p[i], i]))
    G = drawGraph({ pos: L.pos, edges, W: L.W, H: L.H, r: 16 })
    stage.innerHTML = ''; stage.appendChild(G.svg)
    const Q = [root], out = [], st = [{ Q: Q.slice(), out: [], cur: null, msg: `ENQUEUE(根 = ${root}, Q)` }]
    while (Q.length) {
      const u = Q.shift(); out.push(u)
      st.push({ Q: Q.slice(), out: out.slice(), cur: u, msg: `u ← DEQUEUE(Q) = ${u} を探索し out の末尾へ` })
      if (ch[u].length) { ch[u].forEach((c) => Q.push(c)); st.push({ Q: Q.slice(), out: out.slice(), cur: u, msg: `u の子 ${ch[u].join(', ')} を順に ENQUEUE` }) }
    }
    st.push({ Q: [], out, cur: null, msg: `Q が空 → 終了。浅い順: <b>${out.join(' → ')}</b>（O(n)）` })
    player.load(st)
  }
  const render = (f) => {
    setNodeClass(G.nodeEl, (i) => (i === f.cur ? 'cur' : f.out.includes(i) ? 'vis' : f.Q.includes(i) ? 'q' : ''))
    qC.innerHTML = ''; f.Q.length ? f.Q.forEach((v) => qC.appendChild(h('span.chip.am', v))) : qC.appendChild(h('span.chip.empty', '空'))
    oC.innerHTML = ''; f.out.forEach((v) => oC.appendChild(h('span.chip.cy', v)))
    narr.innerHTML = f.msg
  }
  const root = h('div')
  const player = new Player({ render, interval: 900, keyTarget: root })
  inp.addEventListener('change', build)
  root.append(lab({ title: 'LAB 4-4 — 幅優先探索: 待ち行列が「浅い順」を作る', hint: '兄弟は番号の小さい順',
    body: h('div', h('div.ctrl-row', h('div.field', h('label', 'p ='), inp)), h('div.sep'),
      h('div.lab-grid', stage, h('div', { style: { display: 'grid', gap: '10px', alignContent: 'start' } }, h('div.kv-row', h('span.row-label', '待ち行列 Q'), qC), h('div.kv-row', h('span.row-label', '出力 out'), oC), narr))),
    foot: player.el }))
  build()
  return root
}

/* ========== LAB 4-5: binary tree DFS — the Euler tour ========== */
function dfsLab() {
  const lIn = h('input.txt', { value: '1 2 -1 -1 -1', 'aria-label': 'l', style: { width: '220px' } })
  const rIn = h('input.txt', { value: '4 3 -1 -1 -1', 'aria-label': 'r', style: { width: '220px' } })
  let mode = 'pre'
  const stage = h('div.stage.scroll-x', { style: { display: 'grid', placeItems: 'center', minHeight: '260px' } })
  const narr = h('div.narr')
  const outs = { pre: h('div.chips'), in: h('div.chips'), post: h('div.chips') }
  const stackC = h('div.chips')
  const tourC = h('div.mono.small', { style: { lineHeight: '1.9', wordBreak: 'break-all' } })
  let G, Lr, steps = [], tourPath
  const build = () => {
    const L = parseNums(lIn.value), R = parseNums(rIn.value)
    const n = Math.max(L.length, R.length)
    while (L.length < n) L.push(-1); while (R.length < n) R.push(-1)
    const isChild = new Set([...L, ...R].filter((x) => x >= 0))
    const root = range(n).find((i) => !isChild.has(i)) ?? 0
    Lr = layoutBinary(root, L, R, { dx: 54, dy: 74, pad: 34 })
    const edges = []; range(n).forEach((i) => { if (L[i] >= 0) edges.push([i, L[i]]); if (R[i] >= 0) edges.push([i, R[i]]) })
    G = drawGraph({ pos: Lr.pos, edges, W: Lr.W, H: Lr.H + 16, r: 17 })
    // L/R labels
    edges.forEach(([u, v]) => { const A = Lr.pos[u], B = Lr.pos[v]; G.gE.appendChild(s('text', { x: (A.x + B.x) / 2 + (L[u] === v ? -12 : 8), y: (A.y + B.y) / 2 - 2, class: 'lbl', 'font-size': 9.5, text: L[u] === v ? 'L' : 'R' })) })
    tourPath = s('path', { fill: 'none', stroke: '#ffb547', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: .9 })
    const dot = s('circle', { r: 23, fill: 'none', stroke: '#ffb547', 'stroke-width': 2, opacity: .8 })
    G.svg.insertBefore(tourPath, G.gN); G.svg.insertBefore(dot, G.gN); G.dot = dot
    G.badges = {}
    Object.entries(Lr.pos).forEach(([i, p]) => { const t = s('text', { x: p.x, y: p.y + 37, 'text-anchor': 'middle', class: 'lbl am', 'font-size': 10, text: '' }); G.svg.appendChild(t); G.badges[i] = t })
    stage.innerHTML = ''; stage.appendChild(G.svg)
    // simulate visits
    steps = []
    const visits = {}, out = { pre: [], in: [], post: [] }, stack = [], tour = []
    const visit = (x, note) => {
      visits[x] = (visits[x] || 0) + 1
      tour.push(x)
      const v = visits[x]
      const hasL = L[x] >= 0, hasR = R[x] >= 0
      const emitted = []
      if (v === 1) { out.pre.push(x); emitted.push('pre') }
      if ((v === 2 && hasL) || (v === 1 && !hasL)) { out.in.push(x); emitted.push('in') }
      const last = 1 + (hasL ? 1 : 0) + (hasR ? 1 : 0)
      if (v === last) { out.post.push(x); emitted.push('post') }
      steps.push({ x, v, note, stack: stack.slice(), out: { pre: out.pre.slice(), in: out.in.slice(), post: out.post.slice() }, emitted, tour: tour.slice(), visits: { ...visits } })
    }
    const walk = (x) => {
      stack.push(x)
      visit(x, `節点 ${x} に到着（呼出 → PUSH）`)
      if (L[x] >= 0) { walk(L[x]); visit(x, `左の子から節点 ${x} に戻った`) }
      if (R[x] >= 0) { walk(R[x]); visit(x, `右の子から節点 ${x} に戻った`) }
      stack.pop()
    }
    walk(root)
    player.load(steps)
  }
  const lbl = { pre: '前順', in: '中順', post: '後順' }
  const render = (f, idx) => {
    const pts = f.tour.map((x) => Lr.pos[x])
    // offset path slightly so it "wraps" the tree
    tourPath.setAttribute('d', 'M' + pts.map((p) => `${p.x},${p.y}`).join('L'))
    const cp = Lr.pos[f.x]
    G.dot.setAttribute('cx', cp.x); G.dot.setAttribute('cy', cp.y)
    const emittedNow = f.emitted.includes(mode)
    setNodeClass(G.nodeEl, (i) => (i === f.x ? (emittedNow ? 'ok' : 'cur') : f.out[mode].includes(i) ? 'vis' : f.visits[i] ? 'q' : ''))
    Object.entries(G.badges).forEach(([i, t]) => (t.textContent = f.visits[i] ? `${f.visits[i]}回目` : ''))
    ;['pre', 'in', 'post'].forEach((k) => {
      outs[k].innerHTML = ''
      f.out[k].forEach((v, j) => outs[k].appendChild(h('span.chip', { class: k === mode ? (j === f.out[k].length - 1 && f.emitted.includes(k) ? 'chip li' : 'chip cy') : 'chip', style: { animation: j === f.out[k].length - 1 && f.emitted.includes(k) ? '' : 'none' } }, v)))
    })
    stackC.innerHTML = ''; f.stack.forEach((v) => stackC.appendChild(h('span.chip', { style: { animation: 'none' } }, v)))
    tourC.textContent = '巡回: ' + f.tour.join('→')
    narr.innerHTML = `${f.note}。<b>${f.v} 回目</b>の訪問` + (emittedNow ? ` → <b class="l">${lbl[mode]}ではここで探索（出力）!</b>` : '') + (f.emitted.length && !emittedNow ? `<span class="small">（${f.emitted.map((k) => lbl[k]).join('・')}ならここで出力）</span>` : '')
  }
  const root = h('div')
  const player = new Player({ render, interval: 900, keyTarget: root })
  ;[lIn, rIn].forEach((x) => x.addEventListener('change', build))
  root.append(lab({
    title: 'LAB 4-5 — 深さ優先探索: 同じ巡回、違う「出力のタイミング」',
    hint: '前順＝1回目 / 中順＝2回目（左の子がなければ1回目）/ 後順＝最後',
    body: h('div',
      h('div.ctrl-row', h('div.field', h('label', 'l ='), lIn), h('div.field', h('label', 'r ='), rIn),
        seg([['pre', '前順 preorder'], ['in', '中順 inorder'], ['post', '後順 postorder']], 'pre', (v) => { mode = v; player.go(player.i) })),
      h('div.ctrl-row',
        h('button.op', { onclick: () => { lIn.value = '1 2 -1 -1 -1'; rIn.value = '4 3 -1 -1 -1'; build() } }, 'スライド 23 の木'),
        h('button.op', { onclick: () => { lIn.value = '1 -1 3 4 -1 -1'; rIn.value = '2 -1 -1 5 -1 -1'; build() } }, 'スライド 19 の木'),
        h('button.op', { onclick: () => { lIn.value = '1 3 5 -1 -1 -1 -1'; rIn.value = '2 4 6 -1 -1 -1 -1'; build() } }, '完全2分木')),
      h('div.sep'),
      h('div.lab-grid', h('div', { style: { display: 'grid', gap: '10px', alignContent: 'start' } }, stage, tourC),
        h('div', { style: { display: 'grid', gap: '10px', alignContent: 'start' } },
          narr,
          h('div.kv-row', h('span.row-label', '前順'), outs.pre),
          h('div.kv-row', h('span.row-label', '中順'), outs.in),
          h('div.kv-row', h('span.row-label', '後順'), outs.post),
          h('div.kv-row', h('span.row-label', 'スタック'), stackC)))),
    foot: player.el,
  }))
  build()
  return root
}

/* ========== LAB 4-6: rebuild from preorder + inorder ========== */
function rebuildLab() {
  const preIn = h('input.txt', { value: '3 1 0 4 6 2 5', 'aria-label': '前順', style: { width: '220px' } })
  const inIn = h('input.txt', { value: '0 1 4 3 2 6 5', 'aria-label': '中順', style: { width: '220px' } })
  const stage = h('div.stage.scroll-x', { style: { display: 'grid', placeItems: 'center', minHeight: '240px' } })
  const narr = h('div.narr')
  const res = h('div.stats')
  const stepsBox = h('div.log', { style: { maxHeight: '220px' } })
  const run = () => {
    const pre = parseNums(preIn.value), ino = parseNums(inIn.value)
    if (pre.length !== ino.length || new Set(pre).size !== pre.length || [...pre].sort().join() !== [...ino].sort().join()) { narr.innerHTML = '<b class="r">前順と中順は同じ節点集合（重複なし）である必要があります</b>'; return }
    const L = {}, R = {}, log = []
    let bad = false
    const rec = (ps, pe, is, ie, depth) => {
      if (ps > pe) return -1
      const root = pre[ps]
      const k = ino.indexOf(root, is)
      if (k < is || k > ie) { bad = true; return -1 }
      const nl = k - is
      log.push(`${'  '.repeat(depth)}根 <b>${root}</b>（前順の先頭）。中順で左 [${ino.slice(is, k).join(' ') || '∅'}] ／ 右 [${ino.slice(k + 1, ie + 1).join(' ') || '∅'}]`)
      L[root] = rec(ps + 1, ps + nl, is, k - 1, depth + 1)
      R[root] = rec(ps + nl + 1, pe, k + 1, ie, depth + 1)
      return root
    }
    const root = rec(0, pre.length - 1, 0, ino.length - 1, 0)
    if (bad) { narr.innerHTML = '<b class="r">この前順・中順に一致する 2 分木は存在しません</b>'; return }
    const ids = pre
    const mx = Math.max(...ids) + 1
    const La = range(mx).map((i) => L[i] ?? -1), Ra = range(mx).map((i) => R[i] ?? -1)
    const Lr = layoutBinary(root, La, Ra, { dx: 50, dy: 64, pad: 30 })
    const edges = []; ids.forEach((i) => { if (La[i] >= 0) edges.push([i, La[i]]); if (Ra[i] >= 0) edges.push([i, Ra[i]]) })
    const G = drawGraph({ pos: Lr.pos, edges, W: Lr.W, H: Lr.H, r: 16 })
    setNodeClass(G.nodeEl, (i) => (i === root ? 'cur' : ''))
    stage.innerHTML = ''; stage.appendChild(G.svg)
    const post = []; const po = (x) => { if (x < 0) return; po(La[x]); po(Ra[x]); post.push(x) }; po(root)
    res.innerHTML = ''; res.append(stat('後順（答え）', `<span class="mono" style="font-size:20px">${post.join(' ')}</span>`, 'hl'))
    stepsBox.innerHTML = log.map((l) => `<div style="white-space:pre">${l}</div>`).join('')
    narr.innerHTML = '前順の<b>先頭は必ず根</b>。中順では<b>根の左に左部分木・右に右部分木</b>が並ぶ。この 2 つを再帰的に繰り返せば木が一意に決まる。'
  }
  ;[preIn, inIn].forEach((x) => x.addEventListener('change', run))
  run()
  return lab({ title: 'LAB 4-6 — 前順＋中順から 2 分木を復元する', hint: '課題の検算にも',
    body: h('div', h('div.ctrl-row', h('div.field', h('label', '前順 ='), preIn), h('div.field', h('label', '中順 ='), inIn), h('button.op', { onclick: run }, '復元')), h('div.sep'),
      h('div.lab-grid', h('div', { style: { display: 'grid', gap: '10px', alignContent: 'start' } }, stage, res), h('div', { style: { display: 'grid', gap: '10px', alignContent: 'start' } }, narr, stepsBox))) })
}

/* ========== static diagram: kinds of graphs ========== */
function kindsDiagram() {
  const mk = (directed, weighted) => {
    const pos = { 0: { x: 40, y: 90 }, 1: { x: 120, y: 30 }, 2: { x: 200, y: 90 }, 3: { x: 120, y: 140 } }
    const w = { '0-1': 3, '1-2': 1.5, '2-3': 2, '3-0': 4, '1-3': 1 }
    const G = drawGraph({ pos, edges: [[0, 1], [1, 2], [2, 3], [3, 0], [1, 3]], W: 240, H: 170, r: 14, directed, edgeLabel: weighted ? (u, v) => w[`${u}-${v}`] : null })
    return G.svg
  }
  return h('div.cols', { style: { '--c': 3 } },
    h('div.card', h('div.k', 'UNDIRECTED'), h('h4', '無向グラフ'), h('div.stage', mk(false, false)), h('p', { style: { marginTop: '10px' } }, '(u,v) と (v,u) を区別しない。辺数 = 線分の数 × 2')),
    h('div.card', h('div.k', 'DIRECTED'), h('h4', '有向グラフ'), h('div.stage', mk(true, false)), h('p', { style: { marginTop: '10px' } }, '(u,v) と (v,u) を区別する。辺数 = 矢印の数')),
    h('div.card', h('div.k', 'WEIGHTED'), h('h4', '重み付きグラフ'), h('div.stage', mk(false, true)), h('p', { style: { marginTop: '10px' } }, '辺に重み w(u,v)（非ゼロの実数）。路の長さ = 重みの総和')))
}

export default {
  n: 4,
  title: 'グラフ・木・2分木',
  sub: '基本的なデータ構造 (2) — つながりを表すデータ構造と探索',
  en: 'Graph, Tree & Binary Tree',
  tags: ['隣接行列', '隣接リスト', '最短路', '幅優先', '前順・中順・後順'],
  mini: '<svg viewBox="0 0 120 60"><g stroke="rgba(233,230,223,.4)"><path d="M60 10 30 34M60 10 90 34M30 34 16 54M30 34 44 54"/></g><circle cx="60" cy="10" r="6" fill="#ffb547"/><circle cx="30" cy="34" r="6" fill="#5ad8ff" fill-opacity=".4" stroke="#5ad8ff"/><circle cx="90" cy="34" r="6" fill="#151a22" stroke="#ece9e2"/><circle cx="16" cy="54" r="5" fill="#151a22" stroke="#ece9e2"/><circle cx="44" cy="54" r="5" fill="#151a22" stroke="#ece9e2"/></svg>',
  goals: [
    'グラフ（無向・有向・重み付き）と関連用語を説明できる',
    'グラフの 3 つの実現方法と、その計算量の違いを説明できる',
    '根付き木・順序木・2分木と、その用語（根・葉・先祖・子孫・深さ・高さ）を説明できる',
    '幅優先探索と深さ優先探索（前順・中順・後順）を説明できる',
  ],
  chapters: [
    {
      id: 'graph', k: 'STRUCTURE', title: 'グラフ — 対象と「つながり」',
      build: (el) => el.append(
        talk(`S: 前回までのリストは「1 列に並べる」構造だったけど、今回は<b>つながり</b>を表す構造。まずは<b>グラフ</b>から。
R: 棒グラフとかの「グラフ」じゃないですよね？
S: 違う違う（笑）。<b>節点の集合 V</b> と <b>辺の集合 E</b> をまとめたもの。節点が「もの」、辺が「もの同士のつながり」。辺は節点のペアで <b>e = (u, v)</b> と書く。
R: 具体的には？
S: SNS なら人が節点で友達関係が辺。分子なら原子と結合（C60 フラーレンとか）。路線図なら駅と線路（阪急の路線図とか）。データは節点に入れるよ。`),
        talk(`R: 矢印があるグラフとないグラフがありますよね。
S: 辺の向きを<b>考えない</b>のが<b>無向グラフ</b>、<b>考える</b>のが<b>有向グラフ</b>。辺に重みを付けたものが<b>重み付きグラフ</b>。
S: 注意点がひとつ。<b>無向グラフの辺数は「線分の数 × 2」</b>と数える。(u, v) と (v, u) の両方があると考えるからね。`),
        kindsDiagram(),
        talk(`R: 用語がいっぱい出てきますね…。
S: 4 つだけ押さえよう。`),
        cols(2,
          card('路（パス）と長さ', 'u から v への路。<strong>長さ = 路を構成する辺数</strong>（重み付きなら重みの総和）。同じ節点を通らない路 = <strong>単純路</strong>。', 'PATH'),
          card('閉路', '始点と終点が同じ路。同じ節点を通らない閉路 = <strong>単純閉路</strong>。', 'CYCLE'),
          card('連結', '節点集合 V の任意の 2 点間に路が存在すること。', 'CONNECTED'),
          card('連結成分', '連結している節点集合。グラフの連結成分は<strong>一意に定まる</strong>。', 'COMPONENT')),
        point('グラフ ＝ <b>節点集合 V ＋ 辺集合 E</b>。無向・有向・重み付き。無向グラフの辺数は<b>線分の数 × 2</b>。'),
      ),
    },
    {
      id: 'graph-rep', k: 'IMPLEMENTATION', title: 'グラフの実現方法 3 つ',
      build: (el) => el.append(
        talk(`R: グラフって、コンピュータの中ではどうやって覚えるんですか？
S: 講義では 3 つの方法が出てくる。① <b>隣接行列</b>、② <b>配列リスト改</b>、③ <b>連結リスト</b>。
S: ①は n × n の表で、辺 (i, j) があれば a[i][j] = 1、なければ 0。わかりやすいでしょ。
R: でも節点が多いと表がすごく大きくなりそう。
S: そう、空間計算量は <b>O(n²)</b>。辺が少ない（<b>疎な</b>）グラフだと 0 ばっかりで無駄が多い。そこで②③は「<b>隣にある節点だけ</b>」を覚える。下で切り替えてみて。節点を 2 つクリックすると、その辺があるか調べるのに何回かかるかが出るよ。`),
        graphRepLab(),
        talk(`R: 隣接行列は辺の有無が 1 回でわかるけど、②③はリストを順番に見ないといけないんですね。
S: そう。②③の辺の確認は、最大の隣接節点数 d<sub>max</sub> 回かかる（<b>O(d<sub>max</sub>)</b>）。代わりに空間は <b>O(m + n)</b> で済む。
R: ②の配列に入ってる −1 は何ですか？
S: <b>番兵</b>。<b>隣接リストの終わり</b>を表す印で、ポインタの null と同じ役割。a[i] の位置から −1 まで読めば、節点 i の隣が全部わかる。
R: ③の連結リストの良さは？
S: 隣のリストを連結リストで持ってるから、<b>辺の追加が得意</b>。`),
        h('div.reveal', table(['', '① 隣接行列', '② 配列リスト改', '③ 連結リスト'], [
          ['使うもの', '長さ n の配列リスト × n', '配列 a（長さ n）＋ adj（長さ m+n）', '配列 a ＋ 連結リスト × n'],
          ['節点 i の隣接リスト先頭', 'O(1)', 'O(1)', 'O(1)'],
          ['辺 (i, j) の有無', 'O(1)', 'O(d<sub>max</sub>) ⊆ O(n)', 'O(d<sub>max</sub>) ⊆ O(n)'],
          ['空間計算量', 'O(n²)', 'O(m + n) ⊆ O(n²)', 'O(m + n) ⊆ O(n²)'],
          ['向いている場面', '密なグラフ', '疎なグラフ', '疎なグラフ・辺の追加'],
        ], (c, r, ci) => (ci > 0 && r > 0 && r < 4 ? (c === 'O(1)' ? 'o1' : c.startsWith('O(n²)') ? 'on' : 'mid') : ''))),
        point('<b>隣接行列</b>: 辺の有無 O(1)・空間 O(n²)。<b>配列リスト改 / 連結リスト</b>: 辺の有無 O(d<sub>max</sub>)・空間 O(m+n)。−1 は<b>番兵</b>（リストの終わり）。'),
      ),
    },
    {
      id: 'shortest', k: 'ALGORITHM', title: '単一始点最短路 — 重み無しグラフ',
      build: (el) => el.append(
        talk(`S: グラフを使うアルゴリズムの代表例が<b>最短路</b>。始点 s から、他の各節点への一番短い路を求める。重み無しなら「短い」＝<b>辺の数が少ない</b>。
R: 全部の路を調べるんですか？
S: もっと賢い方法がある。<b>水面に石を落としたときの波紋</b>みたいに、s から距離 1 の節点、距離 2 の節点…と順番に広げていくんだ。順番を守るのに、前回の<b>待ち行列</b>を使う。
R: おお、前回のやつが出てきた。
S: 近い節点から順番に確定するから、<b>最初に見つけた路が最短路</b>になる。教科書 p.163 のダイクストラ法の、重み無し版だと思えばいい。`),
        bfsGraphLab(),
        talk(`R: 隣接行列だけ渡されたら、どうやって手で解けばいいですか？
S: まず行 s の 1 を全部拾って「距離 1」。次に、その節点たちの行の 1 のうち、まだ見つけてないものが「距離 2」…と<b>層ごとに</b>広げる。LAB 4-1 に行列を入力して形を見ながらやると確実だよ。`),
        point('重み無しの最短路は、待ち行列で<b>近い節点から順に</b>広げる（波紋）。最初に見つけた路が最短路。'),
      ),
    },
    {
      id: 'tree', k: 'STRUCTURE', title: '木と根付き木',
      build: (el) => el.append(
        talk(`S: 次は<b>木</b>。グラフの特別な形で、<b>長さ 3 以上の閉路を持たない</b>グラフのこと。
R: ぐるっと一周できない、ってことですね。
S: そう。さらに節点に<b>親子関係</b>があって、親を持たない<b>根</b>がただ 1 つだけあるものを<b>根付き木</b>と呼ぶ。講義や教科書で単に「木」と言ったら根付き木のこと。
R: 家系図みたいですね。
S: まさに。だから用語も家系図っぽいんだ。`),
        cols(3,
          card('葉', '子を持たない節点', 'LEAF'),
          card('先祖 / 子孫', 'v の先祖 = 根から v への路上の節点。v の子孫 = v から葉への路上の節点。<strong>どちらも自分自身を含む</strong>', 'ANCESTOR / DESCENDANT', 'accent'),
          card('兄弟', '同じ親を持つ節点', 'SIBLING'),
          card('深さ', '根から v への路の長さ（辺数）。根の深さは 0', 'DEPTH'),
          card('高さ', '根からの路の長さの最大値', 'HEIGHT'),
          card('順序木', '兄弟の間に順序がある根付き木。一番左を<strong>長男</strong>と呼ぶ', 'ORDERED TREE')),
        talk(`R: 先祖と子孫に「自分自身を含む」…。これ絶対ひっかけで出ますよね。
S: 出る（笑）。下で節点をクリックして、先祖・子孫・兄弟がどれになるか確かめてみて。親の配列 p を書き換えれば、課題の木もそのまま入れられるよ。`),
        treeLab(),
        talk(`R: 木の覚え方にもいくつか種類があるんですか？
S: 3 つ。方法 1 は親だけを覚える配列 p。親はすぐわかるけど、子を探すには配列全体を見ないといけなくて <b>O(n)</b>。子が並んで入ってるとは限らないからね。
S: 方法 2 は p に加えて、<b>長男</b>を入れる l と<b>次の兄弟</b>を入れる r を持つ。これで子リストの先頭も <b>O(1)</b>。上のラボの下に出てる配列がそれ。実はこれ、<b>2 分木を作る方法</b>でもあるんだ。
S: 方法 3 は子のリストを連結リストで持つ。連結リストのセルの数は全部で <b>n − 1</b> 個。根以外はみんな誰かの子だからね。`),
        h('div.reveal', table(['実現方法', '使うもの', '親の取得', '子リスト先頭', '空間'], [
          ['1: 配列リスト', 'p[i] = 親', 'O(1)', 'O(n)', 'O(n)'],
          ['2: 配列リスト改', 'p[i] 親, l[i] 長男, r[i] 次の兄弟', 'O(1)', 'O(1)', 'O(n)'],
          ['3: 連結リスト', 'p[i] 親, S[i] 子リスト先頭, 連結リスト cᵢ', 'O(1)', 'O(1)', 'O(n)'],
        ], (c, r, ci) => (ci >= 2 ? (c === 'O(1)' ? 'o1' : ci === 3 ? 'on' : 'mid') : ''))),
        point('木 ＝ <b>閉路を持たない</b>グラフ。根付き木は根がただ 1 つ。<b>先祖・子孫は自分自身を含む</b>。深さ＝根からの辺数、高さ＝その最大値。'),
      ),
    },
    {
      id: 'bfs', k: 'ALGORITHM', title: '順序木の探索 1 — 幅優先探索',
      build: (el) => el.append(
        talk(`S: 木の全部の節点を順番に訪ねることを<b>探索</b>という。1 つ目は<b>幅優先探索</b>。根から始めて、<b>浅い節点から順番に</b>見ていく。
R: さっきの最短路と似てますね。
S: そう、仕組みは同じで<b>待ち行列</b>を使う。手順はこれだけ。`),
        h('div.code.reveal', { style: { padding: '14px 18px', fontSize: '13px', lineHeight: '1.9', whiteSpace: 'pre' }, html: '<span class="cm">1.</span> 出力リスト out を作成\n<span class="cm">2.</span> <span class="fn">ENQUEUE</span>(根, Q)\n<span class="cm">3.</span> <span class="kw">while</span> Q が空でない:\n<span class="cm">3.1</span>   u ← <span class="fn">DEQUEUE</span>(Q)\n<span class="cm">3.2</span>   u を探索し、out の末尾に追加\n<span class="cm">3.3</span>   u の全ての子 c に対し <span class="fn">ENQUEUE</span>(c, Q)' }),
        treeBfsLab(),
        talk(`R: 子を全部待ち行列の後ろに入れるから、自然と浅い順になるんだ。
S: そういうこと。計算量は <b>O(n)</b>。ただし子リストの先頭がすぐ取れる、方法 2 か 3 で木を作った場合ね。課題では「兄弟は番号の小さい順」っていう条件に気をつけて。`),
        point('幅優先探索 ＝ <b>待ち行列</b>で<b>浅い順</b>に探索。O(n)（方法 2・3 の場合）。'),
      ),
    },
    {
      id: 'dfs', k: 'ALGORITHM', title: '2 分木と深さ優先探索（木のなぞり）',
      build: (el) => el.append(
        talk(`S: 最後は<b>2 分木</b>。各節点の子が<b>2 つ以下</b>の順序木で、<b>左の子と右の子を区別</b>する。
R: 子が 1 つしかないときも、それが左か右かは区別するんですね。
S: そう。で、2 つ目の探索が<b>深さ優先探索</b>。「木のなぞり」とも言う。<b>子を優先して</b>深く潜っていく。
R: 前順・中順・後順っていう 3 種類がありましたけど、何が違うのか毎回混乱するんです…。
S: ここが今日一番のポイント。<b>たどる道筋は 3 つとも全く同じ</b>。木の周りを、外側から一筆書きでぐるっと回る感じ。違うのは<b>何回目に通ったときに「探索（出力）」するか</b>だけなんだ。`),
        cols(3,
          card('前順（行きがけ順）', '<strong>最初</strong>に通ったときに出力。<br><span class="mono">自分 → 左 → 右</span>', 'PREORDER'),
          card('中順（通りがけ順）', '原則 <strong>2 回目</strong>に通ったときに出力（左の子がなければ 1 回目）。<br><span class="mono">左 → 自分 → 右</span>', 'INORDER', 'accent'),
          card('後順（帰りがけ順）', '<strong>最後</strong>に通ったときに出力（葉は 1 回目が最後）。<br><span class="mono">左 → 右 → 自分</span>', 'POSTORDER')),
        talk(`R: 同じ巡回で、出すタイミングだけ違う…？
S: 見たほうが早い。再生して、上の切り替えで前順・中順・後順を変えてみて。各節点の下に「何回目の訪問か」が出るよ。`),
        dfsLab(),
        talk(`R: 本当だ！ 巡回は 0→1→2→1→3→1→0→4→0 で全部同じなのに、どこで出力するかで順番が変わる。
S: プログラムで書くと、再帰関数 <span class="inline-code">preorder(x)</span> は「x を出力 → 左で再帰 → 右で再帰」。中順と後順は<b>出力する行の位置を動かすだけ</b>。で、その再帰の裏では…
R: 前回のスタックが動いてる！
S: 正解。ラボの「スタック」欄がそれ。どれも <b>O(n)</b>。2 分木の作り方も 2 つあるよ。`),
        h('div.reveal', table(['2 分木の実現方法', '親の取得', '子リスト先頭', '空間'], [
          ['1: 配列リスト（p, l = 左の子, r = 右の子）', 'O(1)', 'O(1)', 'O(n)'],
          ['2: 連結リスト（セル = 節点番号 + 子へのポインタ）', 'O(1)', 'O(n)（節点の位置が既知なら O(1)）', 'O(n)'],
        ], (c, r, ci) => (ci >= 1 ? (c === 'O(1)' ? 'o1' : c.startsWith('O(n)（') ? 'mid' : '') : ''))),
        talk(`R: 課題に「前順と中順が与えられたとき、後順を答えよ」っていうのがあって、どう解けばいいか…。
S: コツは 2 つ。<b>前順の先頭は必ず根</b>。そして<b>中順では、根の左に左部分木、右に右部分木</b>が並ぶ。これを部分木ごとに繰り返せば、木の形が 1 つに決まる。
R: 根を見つけて、左右に分けて、また根を見つけて…ですね。
S: 下のツールで手順も表示されるから、自分で解いた答えの検算に使って。`),
        rebuildLab(),
        point('前順・中順・後順は<b>巡回の道筋は同じ</b>で、<b>出力するタイミング（1 回目・2 回目・最後）だけが違う</b>。前順の先頭＝根、中順は根の左右に部分木が並ぶ。'),
      ),
    },
  ],
  quiz: [
    { kind: 'input', tag: 'グラフ', q: '無向グラフの隣接行列が次のとき、節点 0 から節点 3 への最短路の長さは？<br><span class="mono" style="white-space:pre">  0 1 2 3 4\n0 0 1 0 0 1\n1 1 0 1 0 0\n2 0 1 0 1 0\n3 0 0 1 0 1\n4 1 0 0 1 0</span>', answer: '2', explain: '0 の隣は {1, 4}。4 の隣に 3 がある → 0→4→3 で長さ 2。' },
    { kind: 'input', tag: 'グラフ', q: '前問のグラフ（5 節点の閉路 0-1-2-3-4-0）を講義の方法 ②（配列リスト改）で実現したとき、配列 adj の長さは？', answer: '15', explain: '長さ m + n。無向なので m = 線分 5 本 × 2 = 10、n = 5 → 15（番兵 −1 が 5 個）。' },
    { kind: 'choice', tag: 'グラフ', q: '辺数 m ≪ n² の疎なグラフで、空間効率が最も<strong>悪い</strong>実現方法は？', opts: ['隣接行列', '配列リスト改（a と adj）', '連結リスト'], answer: 0, explain: '隣接行列は辺数に関係なく n² の領域が必要。' },
    { kind: 'input', tag: '木', q: '親配列 p = (−1, 0, 0, 1, 1, 2, 4) の根付き木の葉の数は？', answer: '3', explain: '子を持たない節点は 3, 5, 6。LAB 4-3 に入力して確認しよう。' },
    { kind: 'input', tag: '木', q: '前問の木の高さは？', answer: '3', explain: '0 → 1 → 4 → 6 が最も深く、長さ 3。' },
    { kind: 'input', tag: '木', q: '前問の木で、節点 4 の先祖の数は？（自分自身を含む）', answer: '3', explain: '根から 4 への路 0 → 1 → 4 上の節点 {0, 1, 4}。' },
    { kind: 'input', tag: '探索', q: '親配列 p = (−1, 0, 0, 1, 1, 2, 4) の木を幅優先探索したときの出力順を空白区切りで（兄弟は番号の小さい順）。', answer: '0 1 2 3 4 5 6', explain: '深さ 0: 0 / 深さ 1: 1, 2 / 深さ 2: 3, 4, 5 / 深さ 3: 6。' },
    { kind: 'input', tag: 'なぞり', q: '2 分木 l = (1, 3, −1, −1, −1), r = (2, 4, −1, −1, −1)（根は 0）を中順で探索したときの出力順は？', answer: '3 1 4 0 2', explain: '左 → 自分 → 右。0 の左部分木 {1,3,4} の中順が 3 1 4、次に 0、右の 2。' },
    { kind: 'input', tag: 'なぞり', q: '同じ 2 分木を後順で探索したときの出力順は？', answer: '3 4 1 2 0', explain: '左 → 右 → 自分。' },
    { kind: 'input', tag: '復元', q: '前順が 0 1 3 2 4、中順が 3 1 0 4 2 の 2 分木を後順で探索したときの出力順は？', answer: '3 1 4 2 0', explain: '根 0。中順で左 [3 1]・右 [4 2]。左部分木は前順 1 3 → 根 1、左に 3。右部分木は前順 2 4 → 根 2、中順 4 2 なので 4 は左の子。後順は 3 1 4 2 0。LAB 4-6 で確認。' },
  ],
}
