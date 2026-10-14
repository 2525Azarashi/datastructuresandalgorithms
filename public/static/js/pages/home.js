import { h, html, $$, talk } from '../lib/ui.js'
import { heroCanvas } from './hero.js'
import { quizProgress } from '../lib/quiz.js'

const SHAPE_JP = { ARRAY: '配列', STACK: 'スタック', QUEUE: '循環キュー', TREE: '2分木', GRAPH: 'グラフ' }

export function renderHome(root, LECTURES, UPCOMING) {
  const canvas = h('canvas#hero-canvas', { 'aria-label': 'データ構造が変形するアニメーション。クリックで次の形へ' })
  const labels = h('div.hero-morph-label', Object.entries(SHAPE_JP).map(([k, v], i) => h('span', { 'data-k': k }, `0${i + 1} ${v}`)))
  const hero = h('section.hero#hero-section',
    canvas,
    h('div.wrap.hero-inner',
      h('div.eyebrow', 'Data Structures & Algorithms — 関西学院大学 講義対応'),
      h('h1.hero-title',
        h('span.line', h('span', 'Same data,')),
        h('span.line', h('span', h('em', 'different'), ' rules,')),
        h('span.line', h('span', h('span.thin', 'new'), ' speed.'))),
      h('div.hero-sub',
        h('div',
          h('p', { html: '同じ 15 個の数でも、<b class="amber">並べ方の規則</b>が変わればできる操作と速さが変わる。<br>講義の内容を、<b class="amber">サカイ</b>先輩と<b class="cyan">リョウガ</b>くんの対話で追いかけながら、<b class="cyan">動かして</b>理解する実験室です。' }),
          h('div.hero-cta',
            h('a.btn.primary', { href: `#/lecture/${LECTURES[0].n}` }, '第1回から始める', h('span.arr', '→')),
            h('a.btn', { href: '#lectures' , onclick: (e) => { e.preventDefault(); document.getElementById('lectures').scrollIntoView({ behavior: 'smooth' }) } }, '講義一覧'))),
        labels)))
  const hc = heroCanvas(canvas, (name) => $$('span', labels).forEach((s) => s.classList.toggle('on', s.dataset.k === name)))
  $$('span', labels).forEach((s, i) => { s.style.cursor = 'pointer'; s.addEventListener('click', () => hc.set(i)) })

  const principles = h('section.wrap.reveal', { style: { paddingTop: '40px' } },
    h('div.principles',
      h('div.principle', h('div.n', '01 — SEE'), h('h3', 'まず、見る'), h('p', '定義より先に動きを見る。全ての図はステップ再生でき、← → キーで 1 手ずつ追えます。')),
      h('div.principle', h('div.n', '02 — TOUCH'), h('h3', '次に、触る'), h('p', '入力を自分で変えて、計算量がどう増えるか・ポインタがどう動くかを確かめる。')),
      h('div.principle', h('div.n', '03 — PROVE'), h('h3', '最後に、確かめる'), h('p', '各回の終わりに類題。答えはすぐ判定され、サカイ先輩が「なぜ」まで解説します。'))))


  const cast = h('section.section.wrap#cast-section', { style: { paddingBottom: 0 } },
    h('div.sec-head.reveal',
      h('div', h('div.eyebrow', 'Cast'), h('h2', 'Two voices')),
      h('p', '全ての章は 2 人の対話で進みます。リョウガくんが疑問を投げ、サカイ先輩が図と手を動かして答える。')),
    h('div.cast.reveal',
      h('div.cast-card.s', h('div.av', 'サ'), h('div', h('h3', 'サカイ', h('small', 'SENPAI / 解説役')), h('p', '授業を一度通った先輩。定義より先に「なぜそうするのか」を話し、ラボで実際に動かして見せる。'))),
      h('div.cast-card.r', h('div.av', 'リ'), h('div', h('h3', 'リョウガ', h('small', 'STUDENT / 質問役')), h('p', '今まさに受講中。ひっかかった所は遠慮なく聞く。リョウガくんの疑問は、たぶんあなたの疑問でもある。')))),
    h('div.reveal', { style: { marginTop: '28px', maxWidth: '760px' } }, talk(`R: 先輩、データ構造とアルゴリズムって結局何を勉強する授業なんですか？
S: ひと言でいうと「データの置き方」と「処理の手順」をセットで考える授業。置き方を変えるだけで、同じ処理が何千倍も速くなったりするんだ。
R: 何千倍！？
S: 口で言うより見たほうが早い。第1回から一緒に動かしていこう。`)))

  const list = h('div.lec-list')
  LECTURES.forEach((l) => {
    const p = quizProgress('lec' + l.n, l.quiz.length)
    list.appendChild(h('a.lec-row', { href: `#/lecture/${l.n}` },
      h('div.lec-num', String(l.n).padStart(2, '0')),
      h('div',
        h('div.lec-title', h('small', `LECTURE ${String(l.n).padStart(2, '0')}`), l.title),
        h('div.lec-progress', { title: `類題 ${p.ok}/${p.total} 正解` }, h('i', { style: { width: `${(p.ok / p.total) * 100}%` } }))),
      h('div.lec-tags', l.tags.map((t) => h('span.tag', t))),
      h('div.lec-go', { html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 8h10M9 4l4 4-4 4"/></svg>' }),
      l.mini ? h('div.lec-mini', { html: l.mini }) : null))
  })
  UPCOMING.forEach((u) => list.appendChild(h('div.lec-row.soon', h('div.lec-num', String(u.n).padStart(2, '0')), h('div', h('div.lec-title', h('small', `LECTURE ${String(u.n).padStart(2, '0')} — 講義資料の追加待ち`), u.title)), h('div.lec-tags', h('span.tag', 'coming soon')), h('div'))))

  const lectures = h('section.section.wrap#lectures',
    h('div.sec-head.reveal',
      h('div', h('div.eyebrow', 'Index'), h('h2', 'Lectures')),
      h('p', '講義資料が追加されるたびにここが伸びていきます。各回は「対話 → 可視化 → POINT → 類題」の順で構成。')),
    h('div.reveal', list))

  const tools = h('section.section.wrap', { style: { paddingTop: 0 } },
    h('div.sec-head.reveal', h('div', h('div.eyebrow', 'Tools'), h('h2', 'Across lectures'))),
    h('div.tools-grid.reveal',
      h('a.tool-card', { href: '#/cheatsheet' }, h('div.glyph', 'O(1)  O(log n)  O(n)'), h('div', h('h3', '計算量表'), h('p', '全データ構造の操作コストを一枚に。回が進むごとに自動で増えます。'))),
      h('a.tool-card', { href: '#/glossary' }, h('div.glyph', 'A → Z'), h('div', h('h3', '用語集'), h('p', '講義に出てきた用語を検索。定義の載っている章へ一発で飛べます。'))),
      h('button.tool-card', { style: { textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit' }, onclick: () => import('./palette.js').then((m) => m.openPalette()) }, h('div.glyph', '⌘K  /'), h('div', h('h3', 'クイック検索'), h('p', '章・用語・可視化にキーボードだけで移動。どのページからでも使えます。')))))

  root.append(hero, principles, cast, lectures, tools)
  return () => hc.destroy()
}
