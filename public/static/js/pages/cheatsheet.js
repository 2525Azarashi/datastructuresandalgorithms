import { h, table, callout } from '../lib/ui.js'

// [講義, データ構造, 実現方法, 操作, 計算量]
const ROWS = [
  [3, 'リスト', '配列リスト', 'FIND（i 番目の参照）', 'O(1)'],
  [3, 'リスト', '配列リスト', 'INSERT / DELETE_N / DELETE', 'O(n)'],
  [3, 'リスト', '配列リスト', 'TOP / LAST / NEXT / PREVIOUS', 'O(1)'],
  [3, 'リスト', '配列リスト', 'LOCATE', 'O(n)'],
  [3, 'リスト', '配列リスト', '空間', 'O(K)'],
  [3, 'リスト', '連結リスト', 'FIND', 'O(n)'],
  [3, 'リスト', '連結リスト', 'INSERT / DELETE_N（位置 p が既知）', 'O(1)'],
  [3, 'リスト', '連結リスト', 'INSERT / DELETE_N（探索込み）', 'O(n)'],
  [3, 'リスト', '連結リスト', 'TOP / NEXT', 'O(1)'],
  [3, 'リスト', '連結リスト', 'LAST / PREVIOUS / LOCATE / DELETE', 'O(n)'],
  [3, 'リスト', '双方向リスト', 'LAST / PREVIOUS', 'O(1)'],
  [3, 'リスト', '連結リスト', '空間', 'O(n)'],
  [3, 'スタック', '配列', 'CREATE / EMPTY / TOP / PUSH / POP', 'O(1)'],
  [3, '待ち行列', '配列（循環）', 'CREATE / EMPTY / ENQUEUE / DEQUEUE', 'O(1)'],
  [4, 'グラフ', '隣接行列', '隣接リスト先頭 / 辺の有無', 'O(1)'],
  [4, 'グラフ', '隣接行列', '空間', 'O(n²)'],
  [4, 'グラフ', '配列リスト改', '隣接リスト先頭', 'O(1)'],
  [4, 'グラフ', '配列リスト改 / 連結リスト', '辺の有無', 'O(d_max) ⊆ O(n)'],
  [4, 'グラフ', '配列リスト改 / 連結リスト', '空間', 'O(m + n)'],
  [4, '根付き木', '方法1: p のみ', '親 / 子リスト先頭', 'O(1) / O(n)'],
  [4, '根付き木', '方法2・3', '親 / 子リスト先頭', 'O(1) / O(1)'],
  [4, '根付き木', '全方法', '空間', 'O(n)'],
  [4, '順序木', '方法2・3', '幅優先 / 深さ優先探索', 'O(n)'],
  [4, '2 分木', '配列（p, l, r）', '親 / 子', 'O(1) / O(1)'],
  [4, '2 分木', '連結リスト', '親 / 子（位置不明）', 'O(1) / O(n)'],
]
const ALGOS = [
  [1, '線形探索', '最悪・平均', 'O(n)'],
  [1, '線形探索', '最良', 'O(1)'],
  [1, '二分探索（整列済み）', '最悪・平均', 'O(log n)'],
  [1, '部分和（総当たり）', '最悪・平均', 'O(n · 2ⁿ)'],
  [2, 'フィボナッチ（ループ）', '—', 'O(n)'],
  [2, 'フィボナッチ（単純な再帰）', '—', '指数時間（O(2ⁿ)）'],
]
const cls = (c) => (/^O\(1\)$/.test(c) ? 'o1' : /O\(1\) \/ O\(1\)/.test(c) ? 'o1' : /2ⁿ|n²|O\(K\)/.test(c) ? 'on' : c.startsWith('O(') || c.startsWith('指') ? 'mid' : '')

export function renderCheatsheet(root, LECTURES) {
  const max = Math.max(...LECTURES.map((l) => l.n))
  root.append(
    h('section.page-hero.wrap', h('div.eyebrow', 'Cheatsheet'), h('h1', '計算量表'), h('p', '講義で扱った全ての操作のコスト。緑 = 定数時間、オレンジ = 多項式・対数、ピンク = 重い／大きい。講義が増えると自動で行が増えます。')),
    h('div.wrap', { style: { paddingBottom: '120px' } },
      h('div.eyebrow', { style: { margin: '10px 0' } }, 'Order of growth'),
      h('div.formula', { html: '' , style: { fontFamily: 'var(--f-mono)', fontSize: '15px', textAlign: 'center' } }, '1  <  log n  <  n  <  n log n  <  n²  <  n³  <  2ⁿ  <  10ⁿ'),
      h('div.eyebrow', { style: { margin: '36px 0 10px' } }, 'Data structures'),
      table(['回', 'データ構造', '実現方法', '操作', '計算量'], ROWS.filter((r) => r[0] <= max).map((r) => [`<a class="lec-pill" href="#/lecture/${r[0]}">第${r[0]}回</a>`, r[1], r[2], r[3], r[4]]), (c, ri, ci) => (ci === 4 ? cls(c) : '')),
      h('div.eyebrow', { style: { margin: '36px 0 10px' } }, 'Algorithms'),
      table(['回', 'アルゴリズム', '場合', '時間計算量'], ALGOS.filter((r) => r[0] <= max).map((r) => [`<a class="lec-pill" href="#/lecture/${r[0]}">第${r[0]}回</a>`, r[1], r[2], r[3]]), (c, ri, ci) => (ci === 3 ? cls(c) : '')),
      callout('tip', 'RULES', '<p><strong>性質 A</strong>: 順に並んだ処理の和は一番重いものが支配する（O(max)）。<strong>性質 B</strong>: 入れ子の処理は掛け算（O(f·g)）。</p>')))
  return () => {}
}
