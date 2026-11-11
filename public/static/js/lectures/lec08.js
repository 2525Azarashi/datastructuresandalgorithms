import { h, s, svgRoot, lab, Player, stat, callout, card, cols, formula, table, seg, parseNums, range, toast, talk, point } from '../lib/ui.js'
import { codeView } from '../lib/code.js'

/* ---------------------------------------------------------
   第8回  整列のアルゴリズム(1): バブルソート・挿入ソート・選択ソート
   --------------------------------------------------------- */

const CODE_BUBBLE = `void bubble_sort(int n, int a[])
{
  int i, j;
  for (i = 0; i <= n-2; i++) {
    for (j = n-1; j >= i+1; j--) {
      if (a[j-1] > a[j])
        swap(a[j-1], a[j]); // a[j-1] と a[j] を交換
    }
  }
}`

const CODE_INSERTION = `void insertion_sort(int n, int a[])
{
  int i, j;
  int tmp;

  for (i = 1; i < n; i++) {
    tmp = a[i]; // 整列済の数列に挿入する要素を tmp に入れる
    for (j = i - 1; j >= 0 && a[j] > tmp; j--)
      a[j+1] = a[j]; // 挿入する位置より後ろの要素を移動

    a[j+1] = tmp; // 挿入位置に，要素を入れる
  }
}`

const CODE_SELECTION = `void selection_sort(int n, int a[])
{
  int i, j;
  int min;

  for (i = 0; i <= n-2; i++) {
    // 未整列な数列の中から最小要素の探索
    min = i;
    for (j = i + 1; j < n; j++) {
      if (a[min] > a[j])
        min = j;
    }
    swap(a[i], a[min]); // 未整列な数列の先頭と最小を交換
  }
}`

/** 配列の棒グラフ＋セルを SVG で描画する共通ビュー */
function sortBars(a, { cls = () => '', ptrs = {}, tmp = null, gapIdx = [], W = 540, H = 190 } = {}) {
  const n = a.length || 1
  const mx = Math.max(1, ...a.map((v) => Math.abs(v)))
  const padL = 14, padR = tmp != null ? 78 : 14, topY = 24, barMaxH = 98, cellY = topY + barMaxH + 8, cellH = 32
  const slotW = (W - padL - padR) / n
  const bw = Math.max(14, Math.min(42, slotW - 6))
  const svg = svgRoot(W, H, { class: 'sort-svg', role: 'img', 'aria-label': '配列の状態' })

  // 間隔 h のグループ結線（シェルソート用）
  if (gapIdx.length > 1) {
    for (let k = 0; k < gapIdx.length - 1; k++) {
      const x1 = padL + (gapIdx[k] + 0.5) * slotW, x2 = padL + (gapIdx[k + 1] + 0.5) * slotW
      svg.appendChild(s('path', { d: `M${x1},${cellY + cellH + 4} Q${(x1 + x2) / 2},${cellY + cellH + 22} ${x2},${cellY + cellH + 4}`, fill: 'none', stroke: '#ff8a3d', 'stroke-width': 2.5, 'stroke-dasharray': '4 3' }))
    }
  }

  a.forEach((v, i) => {
    const cx = padL + (i + 0.5) * slotW
    const bh = Math.max(8, Math.round((Math.abs(v) / mx) * (barMaxH - 12)))
    const by = topY + barMaxH - bh
    const c = cls(i) || ''
    const fill = c === 'ok' ? '#2fbf71' : c === 'cur' ? '#ffd23f' : c === 'bad' ? '#ff5c8a' : c === 'sel' ? '#ff8a3d' : c === 'vis' ? '#d8eeff' : '#ffffff'
    const txtFill = c === 'ok' || c === 'bad' || c === 'sel' ? '#ffffff' : '#3d2e54'
    // bar
    svg.appendChild(s('rect', { x: cx - bw / 2, y: by, width: bw, height: bh, rx: 6, fill, stroke: '#3d2e54', 'stroke-width': 2 }))
    // cell box
    svg.appendChild(s('rect', { x: cx - bw / 2, y: cellY, width: bw, height: cellH, rx: 8, fill, stroke: '#3d2e54', 'stroke-width': 2 }))
    svg.appendChild(s('text', { x: cx, y: cellY + cellH / 2 + 1, fill: txtFill, 'font-family': 'var(--f-mono)', 'font-size': bw < 26 ? 11 : 13, 'font-weight': 700, 'text-anchor': 'middle', 'dominant-baseline': 'central', text: String(v) }))
    svg.appendChild(s('text', { x: cx, y: cellY + cellH + 13, fill: '#8a7f9e', 'font-family': 'var(--f-mono)', 'font-size': 10, 'text-anchor': 'middle', text: String(i) }))
  })

  // ポインタ表示 (i, j, min など)
  Object.entries(ptrs).forEach(([label, idx]) => {
    if (idx == null || idx < 0 || idx >= n) return
    const cx = padL + (idx + 0.5) * slotW
    const isTop = label.includes('i') && !label.includes('min')
    const col = label.includes('min') ? '#ff5c8a' : label.includes('j') ? '#ff8a3d' : '#1170b8'
    const y = isTop ? 13 : H - 5
    svg.appendChild(s('text', { x: cx, y, fill: col, 'font-family': 'var(--f-mono)', 'font-size': 11, 'font-weight': 700, 'text-anchor': 'middle', text: isTop ? `${label}↓` : `↑${label}` }))
  })

  // tmp ボックス（挿入ソート用）
  if (tmp != null) {
    const tx = W - 58, ty = cellY - 10
    svg.appendChild(s('text', { x: tx + 21, y: ty - 8, fill: '#d4570e', 'font-family': 'var(--f-mono)', 'font-size': 11, 'font-weight': 700, 'text-anchor': 'middle', text: 'tmp' }))
    svg.appendChild(s('rect', { x: tx, y: ty, width: 42, height: 36, rx: 10, fill: '#fff3bf', stroke: '#3d2e54', 'stroke-width': 2 }))
    svg.appendChild(s('text', { x: tx + 21, y: ty + 19, fill: '#3d2e54', 'font-family': 'var(--f-mono)', 'font-size': 14, 'font-weight': 700, 'text-anchor': 'middle', 'dominant-baseline': 'central', text: tmp === '' ? '—' : String(tmp) }))
  }
  return svg
}

/* ========== LAB 8-1: 安定性チェッカー（クラスと名前の整列） ========== */
function stabilityLab() {
  const INIT = [
    { cls: 2, name: 'Martin', badge: '2-A', color: '#ffe0cc' },
    { cls: 2, name: 'Laura', badge: '2-B', color: '#d8eeff' },
    { cls: 2, name: 'Juan', badge: '2-C', color: '#d3f5e2' },
    { cls: 1, name: 'Andrew', badge: '1-A', color: '#fff3bf' },
    { cls: 3, name: 'Diane', badge: '3-A', color: '#ebe2ff' },
  ]
  let step = 0
  const stage = h('div.stage', { style: { padding: '16px' } })
  const narr = h('div.narr')
  const STATES = [
    {
      label: '0. 初期データ',
      rows: INIT,
      msg: 'クラスと名前の組が 5 件。まずこれを<b>名前（アルファベット順）</b>で整列してみよう。',
    },
    {
      label: '1. 名前（abc順）で整列後',
      rows: [INIT[3], INIT[4], INIT[2], INIT[1], INIT[0]], // Andrew, Diane, Juan(2), Laura(2), Martin(2)
      msg: '名前順に並んだ！ クラス 2 の 3 人は <b>Juan → Laura → Martin</b>（abc順）になっているね。次に<b>クラス番号</b>で整列するよ。',
    },
    {
      label: '2A. 安定なソート（バブル・挿入）でクラス整列',
      rows: [INIT[3], INIT[2], INIT[1], INIT[0], INIT[4]], // Andrew(1), Juan(2), Laura(2), Martin(2), Diane(3)
      ok: true,
      msg: '<b class="l">安定なソート</b>：同じクラス 2 の中で、整列前の順序 <b>Juan → Laura → Martin</b> がそのまま維持されている！',
    },
    {
      label: '2B. 安定でないソート（選択ソートなど）の例',
      rows: [INIT[3], INIT[1], INIT[0], INIT[2], INIT[4]], // Andrew(1), Laura(2), Martin(2), Juan(2), Diane(3)
      ng: true,
      msg: '<b class="r">安定でないソート</b>：同じクラス 2 の中で <b>Laura → Martin → Juan</b> に入れ替わり、せっかくの abc 順が壊れてしまった！',
    },
  ]

  const draw = () => {
    const st = STATES[step]
    stage.innerHTML = ''
    stage.appendChild(h('div.arr-name', { style: { marginTop: 0 } }, st.label))
    const list = h('div', { style: { display: 'grid', gap: '8px', marginTop: '8px' } })
    st.rows.forEach((r, idx) => {
      list.appendChild(h('div', {
        style: {
          display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 14px',
          background: r.color, border: '2px solid #3d2e54', borderRadius: '14px',
          boxShadow: '0 3px 0 #3d2e54', fontWeight: 700,
        },
      },
      h('span.mono', { style: { fontSize: '12px', color: '#5b4c72', minWidth: '24px' } }, `#${idx}`),
      h('span.chip', { style: { background: '#fff' } }, `クラス ${r.cls}`),
      h('span', { style: { fontSize: '16px', flex: 1 } }, r.name),
      r.cls === 2 ? h('span.mono', { style: { fontSize: '12px', padding: '2px 8px', borderRadius: '99px', background: '#fff', border: '1.5px solid #3d2e54' } }, `クラス2内: ${r.name === 'Juan' ? '1番目(J)' : r.name === 'Laura' ? '2番目(L)' : '3番目(M)'}`) : null))
    })
    stage.appendChild(list)
    narr.innerHTML = st.msg
  }

  const sel = seg([['0', '① 初期状態'], ['1', '② 名前で整列'], ['2', '③ 安定ソートでクラス整列'], ['3', '④ 不安定ソートでクラス整列']], '0', (v) => { step = +v; draw() })
  const root = lab({
    title: 'LAB 8-1 — 整列アルゴリズムの安定性（スライド 5）',
    hint: '同じ値（クラス 2）の前後関係に注目',
    body: h('div',
      h('div.ctrl-row', sel),
      h('div.sep'),
      h('div.lab-grid.wide-left', stage, h('div', { style: { display: 'grid', gap: '10px', alignContent: 'start' } },
        callout('def', '安定性とは', '<b>同じ要素</b>に対して、整列前の<b>順序</b>が整列後も維持されている性質。'),
        narr))),
  })
  draw()
  return root
}

/* ========== LAB 8-2: バブルソート ステッパ（スライド 7〜10） ========== */
function bubbleLab() {
  const inp = h('input.txt', { value: '43 80 53 8 45', 'aria-label': '配列 a', style: { width: '240px' } })
  let earlyStop = false
  const stage = h('div.stage', { style: { padding: '10px' } })
  const code = codeView(CODE_BUBBLE, { counts: true })
  const sts = h('div.stats'), narr = h('div.narr'), snapTbl = h('div')
  const root = h('div')

  const render = (f) => {
    stage.innerHTML = ''
    stage.appendChild(sortBars(f.a, {
      cls: (k) => (f.done ? 'ok' : f.swapped && (k === f.j - 1 || k === f.j) ? 'bad' : f.j != null && (k === f.j - 1 || k === f.j) ? 'cur' : k < f.sortedTo ? 'ok' : ''),
      ptrs: f.j != null ? { [`i=${f.i}`]: f.i, [`j-1`]: f.j - 1, [`j=${f.j}`]: f.j } : f.i != null ? { [`i=${f.i}`]: f.i } : {},
    }))
    code.cur(f.line || 0)
    code.counts(f.cnt || {})
    sts.innerHTML = ''
    sts.append(
      stat('外側ループ i', f.i != null ? String(f.i) : '—', 'cy'),
      stat('比較回数 N<sub>b,c</sub>', String(f.comp), 'hl'),
      stat('交換回数 (swap)', String(f.swap), 'li'),
    )
    narr.innerHTML = f.msg
  }
  const player = new Player({ interval: 650, keyTarget: root, render })

  const build = () => {
    const a = parseNums(inp.value).slice(0, 14)
    if (a.length < 2) return toast('2 個以上の数を入力してね', 'warn')
    const n = a.length, F = [], cnt = {}, snaps = []
    const hit = (ln) => { cnt[ln] = (cnt[ln] || 0) + 1 }
    let comp = 0, swap = 0
    F.push({ a: a.slice(), sortedTo: 0, comp, swap, line: 1, cnt: { ...cnt }, msg: `入力（n = ${n}）：<b>${a.join(' ')}</b>。右端 j = n−1 から左へ隣同士を比べ、小さい要素を泡のように左へ浮かび上がらせる。` })

    for (let i = 0; i <= n - 2; i++) {
      hit(4)
      let swappedInPass = 0
      for (let j = n - 1; j >= i + 1; j--) {
        hit(5); hit(6); comp++
        const gt = a[j - 1] > a[j]
        F.push({
          a: a.slice(), i, j, sortedTo: i, comp, swap, line: 6, cnt: { ...cnt },
          msg: `i = ${i}, j = ${j}：a[${j - 1}] = <b>${a[j - 1]}</b> と a[${j}] = <b>${a[j]}</b> を比較 → ${gt ? `<b class="r">${a[j - 1]} &gt; ${a[j]}（Yes）</b> なので交換！` : `<b class="l">${a[j - 1]} ≤ ${a[j]}（No）</b> そのまま`}`,
        })
        if (gt) {
          hit(7)
          ;[a[j - 1], a[j]] = [a[j], a[j - 1]]
          swap++; swappedInPass++
          F.push({
            a: a.slice(), i, j, swapped: true, sortedTo: i, comp, swap, line: 7, cnt: { ...cnt },
            msg: `swap(a[${j - 1}], a[${j}])（交換 <b>${swap}</b> 回目） → [${a.join(' ')}]`,
          })
        }
      }
      snaps.push([`i = ${i} 終了`, a.map((v, k) => (k <= i ? `<b class="lime">${v}</b>` : String(v))).join(' '), `${n - 1 - i} 回`, `${swappedInPass} 回（累計 ${swap}）`])
      F.push({
        a: a.slice(), i, sortedTo: i + 1, comp, swap, line: 9, cnt: { ...cnt },
        msg: `<b>i = ${i} の処理が終了</b> → a[0]〜a[${i}] が整列済：<code>${a.join(' ')}</code>（この周の交換 ${swappedInPass} 回）`,
      })
      if (earlyStop && swappedInPass === 0) {
        F.push({
          a: a.slice(), i, sortedTo: n, done: true, comp, swap, line: 10, cnt: { ...cnt },
          msg: `<b class="l">改良版（スライド 10）</b>：i = ${i} の内側 for で<b>一度も交換が行われなかった</b>ため、既に整列済と判定して終了！ 比較 ${comp} 回・交換 ${swap} 回。`,
        })
        snapTbl.innerHTML = ''
        snapTbl.appendChild(table(['段階', '配列 a（緑は整列済）', '比較回数', '交換回数'], snaps))
        player.load(F)
        return
      }
    }
    F.push({
      a: a.slice(), sortedTo: n, done: true, comp, swap, line: 10, cnt: { ...cnt },
      msg: `<b class="l">整列完了！</b> 出力：<code>${a.join(' ')}</code> — 比較回数 <b>${comp}</b> 回（n(n−1)/2 = ${(n * (n - 1)) / 2}）、交換回数 <b>${swap}</b> 回。`,
    })
    snapTbl.innerHTML = ''
    snapTbl.appendChild(table(['段階', '配列 a（緑は整列済）', '比較回数', '交換回数'], snaps))
    player.load(F)
  }

  const preset = (v) => () => { inp.value = v; build() }
  const chk = h('label.chk', h('input', { type: 'checkbox', onchange: (e) => { earlyStop = e.target.checked; build() } }), '改良版（交換 0 回で早期終了・スライド 10）')
  inp.addEventListener('change', build)
  root.append(lab({
    title: 'LAB 8-2 — バブルソート完全トレーサ',
    hint: '隣同士を比べて小さい要素を左へ浮かせる',
    body: h('div',
      h('div.ctrl-row',
        h('div.field', h('label', '配列 a ='), inp),
        h('button.op', { onclick: build }, '実行'),
        h('button.op.ghost', { onclick: preset('43 80 53 8 45') }, '講義の例 (n=5)'),
        h('button.op.ghost', { onclick: preset('80 1 69 73 10 88 38 63 3 90') }, '課題の問題3〜5 (n=10)'),
        h('button.op.ghost', { onclick: preset('80 53 45 43 8') }, '逆順（最悪）'),
        h('button.op.ghost', { onclick: preset('8 43 45 53 80') }, '昇順（最良）')),
      h('div.ctrl-row', chk),
      h('div.sep'),
      h('div.lab-grid.wide-left', h('div', stage, sts, h('div', { style: { marginTop: '10px' } }, narr)), code),
      h('div.arr-name', '各 i の処理が終了した直後の配列（課題レポート確認用）'),
      snapTbl),
    foot: player.el,
  }))
  build()
  return root
}

/* ========== LAB 8-3: 挿入ソート ステッパ（スライド 11〜13） ========== */
function insertionLab() {
  const inp = h('input.txt', { value: '43 80 53 8 45', 'aria-label': '配列 a', style: { width: '240px' } })
  const stage = h('div.stage', { style: { padding: '10px' } })
  const code = codeView(CODE_INSERTION, { counts: true })
  const sts = h('div.stats'), narr = h('div.narr'), snapTbl = h('div')
  const root = h('div')

  const render = (f) => {
    stage.innerHTML = ''
    stage.appendChild(sortBars(f.a, {
      cls: (k) => (f.done ? 'ok' : k === f.insAt ? 'ok' : k === f.shiftFrom || k === f.shiftTo ? 'bad' : k === f.cmpAt ? 'cur' : k < f.sortedLen ? 'vis' : ''),
      ptrs: f.ptrs || {},
      tmp: f.tmp ?? '',
    }))
    code.cur(f.line || 0)
    code.counts(f.cnt || {})
    sts.innerHTML = ''
    sts.append(
      stat('外側ループ i', f.i != null ? String(f.i) : '—', 'cy'),
      stat('比較回数 N<sub>i,c</sub>', String(f.comp), 'hl'),
      stat('移動回数（9行目）', String(f.move), 'li'),
    )
    narr.innerHTML = f.msg
  }
  const player = new Player({ interval: 650, keyTarget: root, render })

  const build = () => {
    const a = parseNums(inp.value).slice(0, 14)
    if (a.length < 2) return toast('2 個以上の数を入力してね', 'warn')
    const n = a.length, F = [], cnt = {}, snaps = []
    const hit = (ln) => { cnt[ln] = (cnt[ln] || 0) + 1 }
    let comp = 0, move = 0
    F.push({ a: a.slice(), sortedLen: 1, comp, move, line: 1, cnt: { ...cnt }, msg: `入力（n = ${n}）：<b>${a.join(' ')}</b>。先頭 a[0] = ${a[0]} を「長さ 1 の整列済数列」とみなし、i = 1 から順に適切な位置へ挿入していく。` })

    for (let i = 1; i < n; i++) {
      hit(6); hit(7)
      const tmp = a[i]
      let mvInPass = 0, cmpInPass = 0
      F.push({
        a: a.slice(), i, sortedLen: i, cmpAt: i, tmp, ptrs: { [`i=${i}`]: i }, comp, move, line: 7, cnt: { ...cnt },
        msg: `i = ${i}：① 挿入する要素 a[${i}] = <b>${tmp}</b> を <code>tmp</code> に入れる。`,
      })
      let j = i - 1
      while (j >= 0) {
        hit(8); comp++; cmpInPass++
        const gt = a[j] > tmp
        F.push({
          a: a.slice(), i, sortedLen: i + 1, cmpAt: j, tmp, ptrs: { [`j=${j}`]: j, [`i=${i}`]: i }, comp, move, line: 8, cnt: { ...cnt },
          msg: `j = ${j}：a[${j}] = <b>${a[j]}</b> &gt; tmp（<b>${tmp}</b>）？ → ${gt ? '<b class="r">Yes</b>（右へ移動！）' : '<b class="l">No</b>（ここでストップ！）'}`,
        })
        if (gt) {
          hit(9)
          a[j + 1] = a[j]
          move++; mvInPass++
          F.push({
            a: a.slice(), i, sortedLen: i + 1, shiftFrom: j, shiftTo: j + 1, tmp, ptrs: { [`j=${j}`]: j, [`j+1`]: j + 1 }, comp, move, line: 9, cnt: { ...cnt },
            msg: `② a[${j + 1}] = a[${j}]（<b>${a[j]}</b> を右へ 1 つ移動、移動累計 <b>${move}</b> 回）`,
          })
          j--
        } else {
          break
        }
      }
      hit(11)
      a[j + 1] = tmp
      snaps.push([`i = ${i} 終了`, a.map((v, k) => (k <= i ? `<b class="lime">${v}</b>` : String(v))).join(' '), `${cmpInPass} 回（累計 ${comp}）`, `${mvInPass} 回（累計 ${move}）`])
      F.push({
        a: a.slice(), i, sortedLen: i + 1, insAt: j + 1, tmp, ptrs: { [`挿入 j+1=${j + 1}`]: j + 1 }, comp, move, line: 11, cnt: { ...cnt },
        msg: `③ a[${j + 1}] = tmp（<b>${tmp}</b>）を代入！ <b>i = ${i} の処理が終了</b> → <code>${a.join(' ')}</code>`,
      })
    }
    F.push({
      a: a.slice(), sortedLen: n, done: true, comp, move, line: 13, cnt: { ...cnt },
      msg: `<b class="l">整列完了！</b> 出力：<code>${a.join(' ')}</code> — 比較回数 <b>${comp}</b> 回、移動回数（9行目）<b>${move}</b> 回。`,
    })
    snapTbl.innerHTML = ''
    snapTbl.appendChild(table(['段階', '配列 a（緑は整列済）', '比較回数', '移動回数（9行目）'], snaps))
    player.load(F)
  }

  const preset = (v) => () => { inp.value = v; build() }
  inp.addEventListener('change', build)
  root.append(lab({
    title: 'LAB 8-3 — 挿入ソート完全トレーサ',
    hint: 'tmp に退避 → 大きい要素を右へ移動 → 空いた場所へ代入',
    body: h('div',
      h('div.ctrl-row',
        h('div.field', h('label', '配列 a ='), inp),
        h('button.op', { onclick: build }, '実行'),
        h('button.op.ghost', { onclick: preset('43 80 53 8 45') }, '講義の例 (n=5)'),
        h('button.op.ghost', { onclick: preset('80 1 69 73 10 88 38 63 3 90') }, '課題の問題6〜8 (n=10)'),
        h('button.op.ghost', { onclick: preset('80 53 45 43 8') }, '逆順（最悪）'),
        h('button.op.ghost', { onclick: preset('8 43 45 53 80') }, '正順（最良 O(n)）')),
      h('div.sep'),
      h('div.lab-grid.wide-left', h('div', stage, sts, h('div', { style: { marginTop: '10px' } }, narr)), code),
      h('div.arr-name', '各 i の処理が終了した直後の配列（課題レポート確認用）'),
      snapTbl),
    foot: player.el,
  }))
  build()
  return root
}

/* ========== LAB 8-4: シェルソート可視化（スライド 14） ========== */
function shellLab() {
  const inp = h('input.txt', { value: '14 45 77 70 73 43 80 53 8 45', 'aria-label': '配列 a', style: { width: '260px' } })
  const stage = h('div.stage', { style: { padding: '10px' } })
  const sts = h('div.stats'), narr = h('div.narr')
  const root = h('div')

  const render = (f) => {
    stage.innerHTML = ''
    stage.appendChild(sortBars(f.a, {
      cls: (k) => (f.done ? 'ok' : f.group?.includes(k) ? 'cur' : ''),
      gapIdx: f.group || [],
    }))
    sts.innerHTML = ''
    sts.append(
      stat('現在の間隔 h', f.h ? String(f.h) : '完了', 'cy'),
      stat('シェルソート移動回数', String(f.shMoves), 'li'),
      stat('通常の挿入ソートなら', `${f.insMoves}<small>回移動</small>`, 'hl'),
    )
    narr.innerHTML = f.msg
  }
  const player = new Player({ interval: 900, keyTarget: root, render })

  const build = () => {
    const orig = parseNums(inp.value).slice(0, 14)
    if (orig.length < 3) return toast('3 個以上の数を入力してね', 'warn')
    const n = orig.length
    // 通常の挿入ソートの移動回数
    let insMoves = 0
    {
      const b = orig.slice()
      for (let i = 1; i < n; i++) { const t = b[i]; let j = i - 1; while (j >= 0 && b[j] > t) { b[j + 1] = b[j]; insMoves++; j-- } b[j + 1] = t }
    }
    const a = orig.slice(), F = []
    let shMoves = 0
    F.push({ a: a.slice(), h: 4, shMoves, insMoves, msg: `入力：<b>${a.join(' ')}</b>。まず間隔 <b>h = 4</b> ごとの 4 個の集合に分けて、それぞれを挿入ソートで大まかに整列する。` })

    // h = 4
    for (let g = 0; g < 4; g++) {
      const idx = []
      for (let k = g; k < n; k += 4) idx.push(k)
      if (idx.length < 2) continue
      const before = idx.map((k) => a[k]).join(', ')
      for (let p = 1; p < idx.length; p++) {
        const i = idx[p], t = a[i]
        let q = p - 1
        while (q >= 0 && a[idx[q]] > t) { a[idx[q + 1]] = a[idx[q]]; shMoves++; q-- }
        a[idx[q + 1]] = t
      }
      const after = idx.map((k) => a[k]).join(', ')
      F.push({ a: a.slice(), h: 4, group: idx, shMoves, insMoves, msg: `h = 4 の集合 ${g + 1}（添字 ${idx.join(', ')}）：[${before}] → 整列後 <b>[${after}]</b>` })
    }
    F.push({ a: a.slice(), h: 1, shMoves, insMoves, msg: `h = 4 での大まかな整列が完了：<code>${a.join(' ')}</code>。小さい要素がすでに前の方へ来ているので、最後の <b>h = 1（通常の挿入ソート）</b>の移動回数が激減する！` })

    for (let i = 1; i < n; i++) {
      const t = a[i]; let j = i - 1
      while (j >= 0 && a[j] > t) { a[j + 1] = a[j]; shMoves++; j-- }
      a[j + 1] = t
    }
    F.push({ a: a.slice(), done: true, shMoves, insMoves, msg: `<b class="l">h = 1 で整列完了！</b> <code>${a.join(' ')}</code> — 合計移動回数は <b>${shMoves}</b> 回（最初から h = 1 の挿入ソートだと ${insMoves} 回）。` })
    player.load(F)
  }

  inp.addEventListener('change', build)
  root.append(lab({
    title: 'LAB 8-4 — シェルソート（スライド 14：間隔 h ごとの挿入ソート）',
    hint: 'オレンジの点線で結ばれた要素同士を先に整列',
    body: h('div',
      h('div.ctrl-row',
        h('div.field', h('label', '配列 a ='), inp),
        h('button.op', { onclick: build }, '実行'),
        h('button.op.ghost', { onclick: () => { inp.value = '14 45 77 70 73 43 80 53 8 45'; build() } }, 'スライド14の例')),
      h('div.sep'),
      h('div', stage, sts, h('div', { style: { marginTop: '10px' } }, narr))),
    foot: player.el,
  }))
  build()
  return root
}

/* ========== LAB 8-5: 選択ソート ステッパ（スライド 15〜18） ========== */
function selectionLab() {
  const inp = h('input.txt', { value: '43 80 53 8 45', 'aria-label': '配列 a', style: { width: '240px' } })
  const stage = h('div.stage', { style: { padding: '10px' } })
  const code = codeView(CODE_SELECTION, { counts: true })
  const sts = h('div.stats'), narr = h('div.narr'), snapTbl = h('div')
  const root = h('div')

  const render = (f) => {
    stage.innerHTML = ''
    stage.appendChild(sortBars(f.a, {
      cls: (k) => (f.done ? 'ok' : f.swapped && (k === f.i || k === f.min) ? 'bad' : k === f.min ? 'sel' : k === f.j ? 'cur' : k < f.sortedTo ? 'ok' : ''),
      ptrs: f.ptrs || {},
    }))
    code.cur(f.line || 0)
    code.counts(f.cnt || {})
    sts.innerHTML = ''
    sts.append(
      stat('外側ループ i', f.i != null ? String(f.i) : '—', 'cy'),
      stat('比較回数 N<sub>s,c</sub>', String(f.comp), 'hl'),
      stat('交換回数（13行目）', String(f.swap), 'li'),
    )
    narr.innerHTML = f.msg
  }
  const player = new Player({ interval: 650, keyTarget: root, render })

  const build = () => {
    const a = parseNums(inp.value).slice(0, 14)
    if (a.length < 2) return toast('2 個以上の数を入力してね', 'warn')
    const n = a.length, F = [], cnt = {}, snaps = []
    const hit = (ln) => { cnt[ln] = (cnt[ln] || 0) + 1 }
    let comp = 0, swap = 0
    F.push({ a: a.slice(), sortedTo: 0, comp, swap, line: 1, cnt: { ...cnt }, msg: `入力（n = ${n}）：<b>${a.join(' ')}</b>。未整列部分 a[i..n−1] から最小要素の位置 <code>min</code> を探し、先頭 a[i] と交換する。` })

    for (let i = 0; i <= n - 2; i++) {
      hit(6); hit(8)
      let min = i
      F.push({
        a: a.slice(), i, min, sortedTo: i, ptrs: { [`i=${i}`]: i, [`min=${min}`]: min }, comp, swap, line: 8, cnt: { ...cnt },
        msg: `i = ${i}：まず仮の最小位置を <code>min = ${i}</code>（値 <b>${a[min]}</b>）とする。`,
      })
      for (let j = i + 1; j < n; j++) {
        hit(9); hit(10); comp++
        const gt = a[min] > a[j]
        F.push({
          a: a.slice(), i, j, min, sortedTo: i, ptrs: { [`i=${i}`]: i, [`min=${min}`]: min, [`j=${j}`]: j }, comp, swap, line: 10, cnt: { ...cnt },
          msg: `j = ${j}：a[min]（a[${min}] = <b>${a[min]}</b>）&gt; a[${j}]（<b>${a[j]}</b>）？ → ${gt ? `<b class="r">Yes</b>（min を ${j} に更新！）` : '<b class="l">No</b>'}`,
        })
        if (gt) {
          hit(11)
          min = j
        }
      }
      hit(13)
      const same = i === min
      ;[a[i], a[min]] = [a[min], a[i]]
      swap++
      snaps.push([`i = ${i} 終了`, a.map((v, k) => (k <= i ? `<b class="lime">${v}</b>` : String(v))).join(' '), `min = ${min}${same ? '（同じ要素の交換）' : ''}`, `累計 ${swap} 回`])
      F.push({
        a: a.slice(), i, min, swapped: true, sortedTo: i + 1, ptrs: { [`i=${i}`]: i, [`min=${min}`]: min }, comp, swap, line: 13, cnt: { ...cnt },
        msg: `<code>swap(a[${i}], a[${min}])</code>${same ? '（<b>注：同じ要素同士の交換も 1 回と数える！</b>）' : ''} → <b>i = ${i} の処理が終了</b>：<code>${a.join(' ')}</code>`,
      })
    }
    F.push({
      a: a.slice(), sortedTo: n, done: true, comp, swap, line: 15, cnt: { ...cnt },
      msg: `<b class="l">整列完了！</b> 出力：<code>${a.join(' ')}</code> — 比較回数 <b>${comp}</b> 回（n(n−1)/2 = ${(n * (n - 1)) / 2}）、交換回数（swap 実行回数）<b>${swap}</b> 回（常に n − 1 = ${n - 1} 回）。`,
    })
    snapTbl.innerHTML = ''
    snapTbl.appendChild(table(['段階', '配列 a（緑は整列済）', '最小位置 min', 'swap 実行回数'], snaps))
    player.load(F)
  }

  const preset = (v) => () => { inp.value = v; build() }
  inp.addEventListener('change', build)
  root.append(lab({
    title: 'LAB 8-5 — 選択ソート完全トレーサ',
    hint: '未整列から最小要素を探して先頭 a[i] と交換',
    body: h('div',
      h('div.ctrl-row',
        h('div.field', h('label', '配列 a ='), inp),
        h('button.op', { onclick: build }, '実行'),
        h('button.op.ghost', { onclick: preset('43 80 53 8 45') }, '講義の例 (n=5)'),
        h('button.op.ghost', { onclick: preset('80 1 69 73 10 88 38 63 3 90') }, '課題の問題11〜13 (n=10)'),
        h('button.op.ghost', { onclick: preset('80 53 45 43 8') }, '逆順'),
        h('button.op.ghost', { onclick: preset('8 43 45 53 80') }, '正順')),
      h('div.sep'),
      h('div.lab-grid.wide-left', h('div', stage, sts, h('div', { style: { marginTop: '10px' } }, narr)), code),
      h('div.arr-name', '各 i の処理が終了した直後の配列（課題レポート確認用）'),
      snapTbl),
    foot: player.el,
  }))
  build()
  return root
}

/* ========== LAB 8-6: 3つの整列アルゴリズム同時比較シミュレータ ========== */
function compareLab() {
  const inp = h('input.txt', { value: '80 1 69 73 10 88 38 63 3 90', 'aria-label': '配列 a', style: { width: '280px' } })
  const box = h('div'), narr = h('div.narr')

  const run = () => {
    const a0 = parseNums(inp.value).slice(0, 20)
    if (a0.length < 2) return toast('2 個以上の数を入力してね', 'warn')
    const n = a0.length

    // 1. Bubble
    let bComp = 0, bSwap = 0
    {
      const a = a0.slice()
      for (let i = 0; i <= n - 2; i++) {
        for (let j = n - 1; j >= i + 1; j--) {
          bComp++
          if (a[j - 1] > a[j]) { [a[j - 1], a[j]] = [a[j], a[j - 1]]; bSwap++ }
        }
      }
    }
    // 2. Insertion
    let iComp = 0, iMove = 0
    {
      const a = a0.slice()
      for (let i = 1; i < n; i++) {
        const tmp = a[i]; let j = i - 1
        while (j >= 0) {
          iComp++
          if (a[j] > tmp) { a[j + 1] = a[j]; iMove++; j-- } else break
        }
        a[j + 1] = tmp
      }
    }
    // 3. Selection
    let sComp = 0, sSwap = 0
    {
      const a = a0.slice()
      for (let i = 0; i <= n - 2; i++) {
        let min = i
        for (let j = i + 1; j < n; j++) { sComp++; if (a[min] > a[j]) min = j }
        ;[a[i], a[min]] = [a[min], a[i]]; sSwap++
      }
    }

    box.innerHTML = ''
    box.appendChild(table(
      ['アルゴリズム', '安定性', '比較回数（今回）', '交換 / 移動回数（今回）', '最悪', '平均', '最良'],
      [
        ['<b>バブルソート</b>', '<b class="lime">有</b>', `<b>${bComp}</b> 回 = n(n−1)/2`, `交換 <b>${bSwap}</b> 回`, 'O(n²)', 'O(n²)', 'O(n²)（改良版は O(n)）'],
        ['<b>挿入ソート</b>', '<b class="lime">有</b>', `<b>${iComp}</b> 回（≤ n(n−1)/2）`, `移動 <b>${iMove}</b> 回`, 'O(n²)', 'O(n²)', '<b class="lime">O(n)</b>'],
        ['<b>選択ソート</b>', '<b class="rose">無</b>', `<b>${sComp}</b> 回 = n(n−1)/2`, `交換 <b>${sSwap}</b> 回 = n−1`, 'O(n²)', 'O(n²)', 'O(n²)'],
      ],
    ))
    narr.innerHTML = `どんな入力でも成り立つ<b>2 つの恒等式</b>に注目！<br>` +
      `① <b>バブルソートの比較回数 (${bComp}) ＝ 選択ソートの比較回数 (${sComp}) ＝ n(n−1)/2</b>（入力によらず常に一定）<br>` +
      `② <b>バブルソートの交換回数 (${bSwap}) ＝ 挿入ソートの移動回数 (${iMove})</b>（どちらも配列の「反転数（i &lt; j かつ a[i] &gt; a[j] の組の数）」に等しい！）`
  }

  const preset = (v) => () => { inp.value = v; run() }
  const rand = () => { inp.value = range(10).map(() => 1 + Math.floor(Math.random() * 99)).join(' '); run() }
  inp.addEventListener('change', run)
  const root = lab({
    title: 'LAB 8-6 — 3 つのソートの比較・交換・移動回数くらべ',
    hint: 'どんな配列を入れても一致する 2 か所を探そう',
    body: h('div',
      h('div.ctrl-row',
        h('div.field', h('label', '配列 a ='), inp),
        h('button.op', { onclick: run }, '計算'),
        h('button.op.ghost', { onclick: preset('80 1 69 73 10 88 38 63 3 90') }, '課題の配列 (n=10)'),
        h('button.op.ghost', { onclick: preset('43 80 53 8 45') }, '講義の例 (n=5)'),
        h('button.op.ghost', { onclick: preset('90 80 70 60 50 40') }, '逆順'),
        h('button.op.ghost', { onclick: preset('10 20 30 40 50 60') }, '正順'),
        h('button.op', { onclick: rand }, 'ランダム')),
      h('div.sep'),
      box,
      narr),
  })
  run()
  return root
}

export default {
  n: 8,
  title: '整列のアルゴリズム (1)',
  sub: 'バブルソート・挿入ソート・選択ソート — O(n²) の初等ソートと改良',
  en: 'Elementary Sorting Algorithms',
  tags: ['バブルソート', '挿入ソート', '選択ソート', '安定性', 'シェルソート', 'O(n²)'],
  mini: '<svg viewBox="0 0 120 60"><g stroke="#3d2e54" stroke-width="1.8" stroke-linejoin="round"><rect x="14" y="38" width="14" height="14" rx="3" fill="#2fbf71"/><rect x="34" y="28" width="14" height="24" rx="3" fill="#2fbf71"/><rect x="54" y="18" width="14" height="34" rx="3" fill="#ffd23f"/><rect x="74" y="24" width="14" height="28" rx="3" fill="#ff8a3d"/><rect x="94" y="10" width="14" height="42" rx="3" fill="#fff"/></g></svg>',
  goals: [
    '整列アルゴリズムの役割（昇順・降順）と「安定性」の意味を具体例で説明できる',
    'バブルソートの動作・疑似コード・計算量と改良（早期終了）を説明できる',
    '挿入ソートの動作・疑似コード・計算量（最良 O(n)）とシェルソートへの改良を説明できる',
    '選択ソートの動作・疑似コード・計算量とヒープソートへの改良を説明できる',
    '3 つの整列アルゴリズムの比較回数・交換（移動）回数・安定性の違いを説明できる',
  ],
  chapters: [
    {
      id: 'intro', k: 'CONCEPT', title: '整列アルゴリズムと安定性',
      build: (el) => el.append(
        talk(`S: 第8回からは<b>整列（ソート / ソーティング）</b>のアルゴリズムに入るよ！
R: 整列って、数を小さい順や大きい順に並べ替えることですよね？
S: そう。入力として $n$ 個の要素から成る順序付き集合（配列リスト $a[0], \\dots, a[n-1]$）を受け取り、<b>昇順</b>（小さい順）または<b>降順</b>（大きい順）に並べ替えた数列を出力する。
R: なぜわざわざ整列するんですか？
S: 整列された数列を前提にすると、第1回でやった<b>二分探索 $O(\\log n)$</b> みたいに、後の様々な処理（検索など）が圧倒的に簡単・高速になるからなんだ。`),
        cols(2,
          card('O(n²) の初等的な整列（今回）', '直感的でわかりやすいが最悪・平均 <strong>O(n²)</strong>。<br>・<strong>バブルソート</strong><br>・<strong>挿入ソート</strong><br>・<strong>選択ソート</strong>', 'ELEMENTARY'),
          card('O(n log n) の高速な整列', '工夫により <strong>O(n log n)</strong> で動く。<br>・<strong>ヒープソート</strong>（第6回・選択ソートの改良）<br>・<strong>クイックソート</strong> / <strong>マージソート</strong>（次回）', 'FAST')),
        talk(`S: 個別のアルゴリズムを見る前に、超重要な性質である<b>「安定性（stability）」</b>を押さえよう。
R: 安定性ってなんですか？
S: <b>同じ値を持つ要素に対して、整列前の順序が整列後も維持されていること</b>。
R[think]: 同じ値ならどっちが先でも同じじゃないですか？
S: 単なる数値ならね。でも実際のデータは「<b>クラスと名前の組</b>」みたいに複数の情報を持っている。たとえば「<b>名前（abc順）で整列したあと、クラス番号で整列する</b>」とき、安定でないソートを使うとクラス内の abc 順が崩れてしまうんだ。下のラボで見てみよう！`),
        stabilityLab(),
        talk(`R[wow]: ほんとだ！ 安定なソートならクラス 2 の中で Juan → Laura → Martin の順が守られるのに、不安定なソートだとバラバラになっちゃうんですね。
S: それと、整列アルゴリズムの時間計算量では<b>最悪・平均・最良</b>の 3 つを議論することが多い。時間計算量のオーダは、最も多く実行される操作である<b>「2 要素の比較回数」のオーダ</b>で決まるよ。`),
        point('整列の<b>安定性</b> ＝ 同じ要素の整列前の前後関係が整列後も保たれること。時間計算量のオーダは<b>2 要素の比較回数</b>で決まる。'),
      ),
    },
    {
      id: 'bubble', k: 'ALGORITHM 1', title: 'バブルソートとその改良',
      build: (el) => el.append(
        talk(`S: 1 つ目は<b>バブルソート（bubble sort）</b>。アイデアはシンプルで、「<b>整列されていない隣り合う要素のペア $a[j-1] > a[j]$ を発見したら、それらを交換（swap）する</b>」。
R: なぜバブル（泡）って言うんですか？
S: 講義の疑似コードでは、内側のループで $j = n-1$（右端）から $i+1$（左）へ向かって隣同士を比べる。すると、小さい要素が<b>泡が浮かび上がるように左へ移動</b>して、1 周目（$i = 0$）が終わると $a[0]$ に<b>最小要素</b>が確定するんだ。
R: $i = k$ の処理が終わると、どこまで確定するんですか？
S: <b>$a[0] \\sim a[k]$ が整列済</b>になる。そして $i = n-2$ が終われば配列全体が整列完了！ 安定性は<b>「有」</b>（<code>a[j-1] &gt; a[j]</code> のときだけ交換し、同じ値 <code>==</code> では追い越さないから）。`),
        bubbleLab(),
        talk(`R: バブルソートの比較回数 $N_{b,c}$ は何回になりますか？
S: 疑似コード 6 行目の <code>if (a[j-1] &gt; a[j])</code> は、入力の中身に関係なく毎回きっちり回る。$i = 0$ で $n-1$ 回、$i = 1$ で $n-2$ 回、…、$i = n-2$ で $1$ 回だから：`),
        formula('N_{b,c} = (n-1) + (n-2) + \\cdots + 1 = \\sum_{i=0}^{n-2}(n-1-i) = \\frac{n(n-1)}{2}'),
        talk(`S: したがって、基本のバブルソートの時間計算量は<b>最悪・平均・最良すべて $O(n^2)$</b>。
R: 交換回数（swap の回数）はどうですか？
S: 交換回数は入力によって変わる。<b>逆順（降順）</b>の入力が与えられたとき（最悪の場合）に最大となり、このとき<b>交換回数 ＝ 比較回数 $= n(n-1)/2$</b> になるよ。
R: 最初から昇順に並んでいる入力でも $O(n^2)$ 回比較しちゃうのはもったいないですね…。
S: そこで<b>スライド 10 の改良例</b>！ 内側の for ループ（5〜8行目）で<b>一度も交換が行われなかったら「既に整列済」とみなして即終了</b>する。これで<b>最良時間計算量が $O(n)$</b>（比較 $n-1$ 回・交換 0 回）になる。他の改良として<b>シェーカーソート</b>や<b>コムソート</b>も知られているよ。`),
        point('バブルソート：<b>安定性「有」</b>。$i = k$ 終了で $a[0..k]$ が整列済。比較回数は入力によらず常に $N_{b,c} = n(n-1)/2$ で最悪・平均・最良とも <b>$O(n^2)$</b>（無交換で終了する改良版は最良 $O(n)$）。'),
      ),
    },
    {
      id: 'insertion', k: 'ALGORITHM 2', title: '挿入ソートとシェルソート',
      build: (el) => el.append(
        talk(`S: 2 つ目は<b>挿入ソート（insertion sort）</b>。トランプを手札に 1 枚ずつ正しい位置へ差し込んでいくイメージで、「<b>整列済みの数列の中に、要素を適切に一つずつ挿入していく</b>」。
R: 疑似コード（スライド 11）はどう動きますか？
S: 外側のループは $i = 1$ から $n-1$ まで。各 $i$ で：
① 挿入したい要素 $a[i]$ を <code>tmp = a[i]</code> に退避する（7行目）
② 整列済の部分を右端 $j = i-1$ から左へ見て、<code>a[j] &gt; tmp</code> である限り <code>a[j+1] = a[j]</code> で<b>1 つ右へ移動</b>する（8〜9行目）
③ 条件を満たさなくなったところでループを抜け、空いた <code>a[j+1] = tmp</code> に代入する（11行目）
R: <code>a[j] &gt; tmp</code> が False になった瞬間に内側の for ループが止まるんですね！`),
        insertionLab(),
        talk(`R[happy]: 正順（既に昇順）の配列を入れると、毎回 1 回比較してすぐ No になるから、移動が 0 回で一瞬で終わりますね！
S: その通り！ だから挿入ソートの<b>最良時間計算量は $O(n)$</b>（正順の場合、比較 $n-1$ 回・移動 0 回）。もちろん <code>a[j] &gt; tmp</code> で等しい要素は飛び越えないから<b>安定性も「有」</b>。
R: 逆に最悪なのはどんな場合ですか？
S: <b>逆順（降順）</b>の入力のとき。8〜9行目の for ループが毎回先頭 $j = 0$ まで全部走るから、比較回数も移動回数も最大になる：`),
        formula('N_{i,c} \\le 1 + 2 + \\cdots + (n-1) = \\sum_{i=1}^{n-1} i = \\frac{n(n-1)}{2} = N_{b,c}'),
        talk(`S: つまり挿入ソートの比較回数の<b>最大値</b>はバブルソートの比較回数と同じ $n(n-1)/2$。最悪・平均は <b>$O(n^2)$</b>、最良は <b>$O(n)$</b> になる。
R: ちなみに課題レポートの問題 9 で「<b>スライド 11 の挿入ソート（昇順）を 1 行書き換えて降順にするには何行目か？</b>」って聞かれています！
S: 8 行目の <code>for (j = i - 1; j &gt;= 0 &amp;&amp; a[j] &gt; tmp; j--)</code> に注目！ 昇順では「<code>a[j] &gt; tmp</code>（左の要素の方が大きいなら右へずらす）」だったよね。降順（大きい順）にしたいなら、「左の要素の方が小さい（<code>a[j] &lt; tmp</code>）なら右へずらす」に変えればいい。つまり書き換えるのは <b>8 行目</b>！`),
        callout('tip', '挿入ソートの改良：シェルソート（スライド 14）', '挿入ソートは「正順なら $O(n)$、逆順だと先頭まで毎回運ぶので $O(n^2)$」という性質がある。そこで<b>間隔 $h$ ごとの集合</b>に分けて別々に挿入ソートで大まかに整列し、徐々に $h$ を縮めて最後に $h=1$ で仕上げるのが<b>シェルソート</b>（間隔決定例：$h_{i+1} = 3h_i + 1$）。時間計算量は最悪 $O(n\\log^2 n)$、平均 $O(n^{1.25})$、最良 $O(n)$。'),
        shellLab(),
        point('挿入ソート：<b>安定性「有」</b>。最悪・平均 <b>$O(n^2)$</b>、<b>最良 $O(n)$（正順のとき）</b>。降順にするには <b>8 行目</b>の <code>a[j] &gt; tmp</code> を <code>a[j] &lt; tmp</code> に変更。改良版は<b>シェルソート</b>。'),
      ),
    },
    {
      id: 'selection', k: 'ALGORITHM 3', title: '選択ソートとヒープソート',
      build: (el) => el.append(
        talk(`S: 3 つ目は<b>選択ソート（selection sort）</b>。トランプから一番小さいカードを探して左端から並べていく方法で、「<b>未整列な数列の先頭要素 $a[i]$ と最小要素 $a[\\text{min}]$ を交換する</b>」。
R: 疑似コード（スライド 15）ではどう書かれていますか？
S: 外側のループは $i = 0$ から $n-2$ まで。
① 仮の最小位置を <code>min = i</code> とする（8行目）
② $j = i+1$ から $n-1$ まで走査し、<code>a[min] &gt; a[j]</code> なら <code>min = j</code> に更新する（9〜12行目）
③ ループが終わったら 13行目の <code>swap(a[i], a[min])</code> で未整列の先頭 $a[i]$ と最小要素 $a[\\text{min}]$ を交換する！`),
        selectionLab(),
        talk(`R[think]: あれっ、スライド 16 の実行例を見ると、<code>i = min</code>（先頭がもともと最小）のときも <code>swap(a[i], a[min])</code> を実行して交換回数 1 回に数えていますね！
S: そこが超重要！ 13 行目の <code>swap(a[i], a[min])</code> には <code>if (i != min)</code> が付いていないから、<b>同じ要素同士の交換も含めて、各 $i$（$i = 0, \\dots, n-2$）で必ず 1 回ずつ、合計 $n-1$ 回実行される</b>んだ。
R: 比較回数 $N_{s,c}$ はどうなりますか？
S: 10 行目の <code>if (a[min] &gt; a[j])</code> も入力に関係なく毎回走るから、バブルソートと全く同じ：`),
        formula('N_{s,c} = (n-1) + (n-2) + \\cdots + 1 = \\sum_{i=0}^{n-2}(n-1-i) = \\frac{n(n-1)}{2} = N_{b,c}'),
        talk(`S: だから時間計算量は<b>最悪・平均・最良すべて $O(n^2)$</b>。ただし交換回数は $n-1$ 回で済むから、バブルソートより交換は少ない。
R: 選択ソートの安定性はどうして<b>「無」</b>なんですか？
S: 離れた場所にある要素同士を <code>swap(a[i], a[min])</code> で一気に飛び越えて交換するから。たとえば <code>[2(A), 2(B), 1]</code> を整列すると、$i=0$ で先頭の <code>2(A)</code> と末尾の最小 <code>1</code> が交換されて <code>[1, 2(B), 2(A)]</code> になり、同じ 2 の順序が逆転しちゃうでしょ？
R: なるほど！ そしてスライド 18 の「選択ソートの改良例」が、第6回で習った<b>ヒープソート</b>なんですね！
S: そう！ 選択ソートでは最小要素の探索（8〜12行目）に毎回 $O(n)$ かかっていたけど、<b>ヒープ</b>を使えば最小要素の探索・取り出しが <b>$O(\\log_2 n)$</b> に減る。これを $n-1$ 回繰り返すから全体で <b>$O(n \\log_2 n)$</b> になるんだ。`),
        point('選択ソート：<b>安定性「無」</b>。比較回数は常に $N_{s,c} = n(n-1)/2$ で最悪・平均・最良とも <b>$O(n^2)$</b>。swap（13行目）の実行回数は<b>常に $n-1$ 回</b>。ヒープで最小探索を高速化した改良版が<b>ヒープソート $O(n\\log_2 n)$</b>。'),
      ),
    },
    {
      id: 'summary', k: 'COMPARISON', title: '3 つの整列アルゴリズムの徹底比較',
      build: (el) => el.append(
        talk(`S: 最後に、今回学んだ 3 つの初等整列アルゴリズムの特徴と、課題レポート問題 2 で問われる「<b>任意の入力に対して常に等しいもの</b>」を整理しよう！
R: 比較回数や交換・移動回数が「どんな入力でも常に等しい」ペアがあるんですか？
S: 下のシミュレータでいろんな配列を試してみて！`),
        compareLab(),
        talk(`R[wow]: どの配列を入れても、
・<b>バブルソートの比較回数 ＝ 選択ソートの比較回数</b>（常に $n(n-1)/2$）
・<b>バブルソートの交換回数 ＝ 挿入ソートの移動回数</b>
の 2 つはピタッと一致しています！
S: なぜ「バブルの交換回数 ＝ 挿入の移動回数」が常に成り立つかというと、バブルソートで隣同士を 1 回交換するのも、挿入ソートで <code>a[j] &gt; tmp</code> の要素を 1 つ右へ移動するのも、「<b>順序が逆転している 2 要素のペア（$p &lt; q$ なのに $a[p] &gt; a[q]$ となっている組）を 1 組ずつ解消する操作</b>」だからなんだ。
R: 逆に、挿入ソートの比較回数は途中で break するからバブルの比較回数とは常に等しいわけではなくて、選択ソートの交換回数は常に $n-1$ 回だからバブルの交換回数とも等しくないんですね！`),
        h('div.reveal', table(
          ['アルゴリズム', 'アイデア', '最悪', '平均', '最良', '安定性', '改良例'],
          [
            ['<b>バブルソート</b>', '整列されてない隣接ペアを発見 ⇒ 交換', 'O(n²)', 'O(n²)', 'O(n²)<br><small>※無交換終了で O(n)</small>', '<b class="lime">有</b>', '終了条件変更 / シェーカー / コム'],
            ['<b>挿入ソート</b>', '整列済の数列に要素を 1 つずつ適切な位置へ挿入', 'O(n²)', 'O(n²)', '<b class="lime">O(n)</b>', '<b class="lime">有</b>', 'シェルソート'],
            ['<b>選択ソート</b>', '未整列な数列の先頭要素と最小要素を交換', 'O(n²)', 'O(n²)', 'O(n²)', '<b class="rose">無</b>', 'ヒープソート O(n log n)'],
          ],
        )),
        point('任意の入力で常に成立するのは <b>① バブルの比較回数 ＝ 選択の比較回数 $= n(n-1)/2$</b> と <b>② バブルの交換回数 ＝ 挿入の移動回数</b> の 2 つ！'),
      ),
    },
  ],
  quiz: [
    {
      kind: 'multi', tag: '安定性',
      q: '次の整列アルゴリズムの中で、安定性を有するものをすべて選べ。',
      opts: ['バブルソート', '挿入ソート', '選択ソート'],
      answer: [0, 1],
      explain: 'バブルソートと挿入ソートは隣接要素の比較・移動のみで等しい要素を追い越さないため安定（有）。選択ソートは離れた要素を swap するため安定性「無」。',
    },
    {
      kind: 'multi', tag: '回数比較',
      q: '任意の入力に対して「常に等しい」関係として【間違っているもの】をすべて選べ。',
      opts: [
        'バブルソートの比較回数と挿入ソートの比較回数は常に等しい',
        'バブルソートの比較回数と選択ソートの比較回数は常に等しい',
        'バブルソートの交換回数と挿入ソートの移動回数は常に等しい',
        'バブルソートの交換回数と選択ソートの交換回数は常に等しい',
      ],
      answer: [0, 3],
      explain: 'バブルと選択の比較回数は常に n(n−1)/2 で等しい（2 は正しい）。バブルの交換回数と挿入の移動回数も両方「反転数」に一致し常に等しい（3 は正しい）。1 と 4 が間違い。',
    },
    {
      kind: 'choice', tag: '計算量',
      q: 'スライドの疑似コード（改良前）において、最良時間計算量が O(n) になるものはどれか？',
      opts: ['挿入ソート', 'バブルソート（改良前）', '選択ソート', '該当なし'],
      answer: 0,
      explain: '挿入ソートは入力が正順（昇順）のとき内側ループが毎回 1 回の比較で抜けるため最良 O(n)。バブル（改良前）と選択は最良でも O(n²)。',
    },
    {
      kind: 'input', tag: 'バブルソート',
      q: '配列 a = (43, 80, 53, 8, 45) に対してバブルソートを実行したとき、i = 1 の処理が終了した直後の配列を空白区切りで答えよ。',
      answer: '8 43 45 80 53',
      explain: 'i = 0 終了で 8 43 80 53 45、i = 1 終了で 8 43 45 80 53（スライド 8 / LAB 8-2）。',
    },
    {
      kind: 'input', tag: '挿入ソート',
      q: '配列 a = (43, 80, 53, 8, 45) に対して挿入ソートを実行したとき、整列完了までの要素の移動回数（9行目の実行回数）の合計は？',
      answer: '6',
      explain: 'i=1 で 0 回、i=2 で 1 回、i=3 で 3 回、i=4 で 2 回の合計 0+1+3+2 = 6 回（スライド 12 / LAB 8-3）。',
    },
    {
      kind: 'input', tag: '挿入ソート',
      q: 'スライド 11 の挿入ソート（昇順）の疑似コードを 1 行書き換えて降順にするには、何行目を書き換えればよいか？（数字のみ）',
      answer: '8',
      explain: '8 行目の for 条件にある a[j] > tmp を a[j] < tmp に書き換えれば降順になる。',
    },
    {
      kind: 'input', tag: '選択ソート',
      q: '要素数 n = 10 の配列に対してスライド 15 の選択ソートを実行したとき、13 行目の swap(a[i], a[min]) が実行される回数は？',
      answer: '9',
      explain: '外側ループ i = 0 〜 n−2（0 〜 8）の各回で 1 回ずつ、計 n − 1 = 9 回実行される（同じ要素同士の交換も含む）。',
    },
    {
      kind: 'choice', tag: '改良',
      q: '挿入ソートの性質に着目して「間隔 h ごとの集合に分けて整列する」改良アルゴリズムと、選択ソートの「最小要素の探索にヒープを使う」改良アルゴリズムの正しい組み合わせは？',
      opts: ['挿入ソートの改良＝シェルソート ／ 選択ソートの改良＝ヒープソート', '挿入ソートの改良＝ヒープソート ／ 選択ソートの改良＝シェルソート', '挿入ソートの改良＝コムソート ／ 選択ソートの改良＝シェーカーソート', 'どちらもクイックソート'],
      answer: 0,
      explain: 'スライド 14・18 の通り、挿入ソートの改良がシェルソート、選択ソートの改良がヒープソート。シェーカーソート・コムソートはバブルソートの改良。',
    },
  ],
}
