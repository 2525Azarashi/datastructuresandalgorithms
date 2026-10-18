import { h, html, $$, talk } from '../lib/ui.js'
import { avatar } from '../lib/chars.js'
import { heroCanvas } from './hero.js'
import { quizProgress } from '../lib/quiz.js'
import { splitText, reactiveType, rotateWord, marquee } from '../lib/motion.js'
import { growthRace, siteStats } from './infographics.js'

const SHAPE_JP = { ARRAY: '配列', STACK: 'スタック', QUEUE: '循環キュー', TREE: '2分木', GRAPH: 'グラフ' }

export function renderHome(root, LECTURES, UPCOMING) {
  const canvas = h('canvas#hero-canvas', { 'aria-label': 'データ構造が変形するアニメーション。クリックで次の形へ' })
  const labels = h('div.hero-morph-label', Object.entries(SHAPE_JP).map(([k, v], i) => h('span', { 'data-k': k }, `0${i + 1} ${v}`)))
  const deco = [
    ['<svg viewBox="0 0 40 40"><path d="M20 3l4.6 10.6L36 15l-8.6 7.6L30 34l-10-6-10 6 2.6-11.4L4 15l11.4-1.4z" fill="#ffd23f" stroke="#3d2e54" stroke-width="2.5" stroke-linejoin="round"/></svg>', 'left:6%;top:16%;width:44px;--rot:-12deg'],
    ['<svg viewBox="0 0 60 24"><path d="M3 12 Q10 2 17 12 T31 12 T45 12 T59 12" fill="none" stroke="#ff5c8a" stroke-width="5" stroke-linecap="round"/></svg>', 'left:48%;top:12%;width:70px;animation-delay:-2s'],
    ['<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="15" fill="#d3f5e2" stroke="#3d2e54" stroke-width="2.5"/><circle cx="20" cy="20" r="6" fill="#2fbf71" stroke="#3d2e54" stroke-width="2.5"/></svg>', 'right:5%;top:18%;width:40px;animation-delay:-4s'],
    ['<svg viewBox="0 0 40 40"><path d="M20 6v28M6 20h28" stroke="#3fa9f5" stroke-width="6" stroke-linecap="round"/></svg>', 'right:4%;bottom:34%;width:34px;--rot:20deg;animation-delay:-1s'],
    ['<svg viewBox="0 0 44 40"><path d="M4 34 L22 5 L40 34 Z" fill="#ebe2ff" stroke="#3d2e54" stroke-width="2.5" stroke-linejoin="round"/></svg>', 'left:40%;bottom:8%;width:40px;--rot:-8deg;animation-delay:-3s'],
  ].map(([svg, st]) => h('div.deco', { 'aria-hidden': 'true', html: svg, style: st }))
  const hero = h('section.hero#hero-section',
    canvas, ...deco,
    h('div.wrap.hero-inner',
      h('div.eyebrow', h('span.hide-sm-i', 'Data Structures & Algorithms — '), '関西学院大学 講義対応'),
      h('h1.hero-title',
        h('span.line', h('span', 'Same data,')),
        h('span.line', h('span', h('em', 'different'), ' rules,')),
        h('span.line', h('span', h('span.thin', 'new'), ' ', h('span.speed-word', 'speed!')))),
      h('div.hero-rot', { 'aria-live': 'off' }, h('span.hero-rot-k', '規則を変えると →'), h('span.hero-rot-w', h('span.rot-word', 'スタック'))),
      h('div.hero-sub',
        h('div',
          h('p', { html: '同じ 15 個の数でも、<b>並べ方の規則</b>が変わると、できることも速さも変わる。<br><b class="amber">サカイ</b>先輩と<b class="cyan">リョウガ</b>くんのおしゃべりを聞きながら、<b>さわって</b>わかる「データ構造とアルゴリズム」の遊び場です。' }),
          h('div.hero-cta',
            h('a.btn.primary', { href: `#/lecture/${LECTURES[0].n}` }, '第1回からはじめる', h('span.arr', '→')),
            h('a.btn', { href: '#lectures' , onclick: (e) => { e.preventDefault(); document.getElementById('lectures').scrollIntoView({ behavior: 'smooth' }) } }, '講義一覧'))),
        h('div', labels, h('div.hero-hint', '↑ 押すと形が変わるよ')))))
  const title = hero.querySelector('.hero-title')
  title.querySelectorAll('.line > span').forEach((sp) => splitText(sp))
  const offReact = reactiveType(title)
  const rw = hero.querySelector('.rot-word')
  const offRot = rotateWord(rw, ['スタック', '待ち行列', '2分木', 'グラフ', '連結リスト', '配列'])
  const hc = heroCanvas(canvas, (name) => $$('span', labels).forEach((s) => s.classList.toggle('on', s.dataset.k === name)))
  $$('span', labels).forEach((s, i) => { s.style.cursor = 'pointer'; s.addEventListener('click', () => hc.set(i)) })

  const principles = h('section.wrap.reveal', { style: { paddingTop: '40px' } },
    h('div.principles',
      h('div.principle', h('div', {html: '<svg class="ic" viewBox="0 0 54 54"><circle cx="27" cy="29" r="22" fill="#fff" stroke="#3d2e54" stroke-width="2.5"/><circle cx="27" cy="29" r="9" fill="#3d2e54"/><circle cx="30" cy="26" r="3" fill="#fff"/></svg>'}), h('div.n', 'STEP 01 — SEE'), h('h3', 'まず、見る'), h('p', '定義より先に動きを見る。ぜんぶの図はステップ再生できて、← → キーで 1 手ずつ追えます。')),
      h('div.principle', h('div', {html: '<svg class="ic" viewBox="0 0 54 54"><path d="M20 30V14a4 4 0 0 1 8 0v12l10 2a5 5 0 0 1 4 6l-2 10a4 4 0 0 1-4 3H25a5 5 0 0 1-4-2l-7-9a4 4 0 0 1 6-5z" fill="#fff" stroke="#3d2e54" stroke-width="2.5" stroke-linejoin="round"/></svg>'}), h('div.n', 'STEP 02 — TOUCH'), h('h3', '次に、さわる'), h('p', '入力を自分で変えて、計算量がどう増えるか・ポインタがどう動くかを確かめる。')),
      h('div.principle', h('div', {html: '<svg class="ic" viewBox="0 0 54 54"><circle cx="27" cy="27" r="22" fill="#2fbf71" stroke="#3d2e54" stroke-width="2.5"/><path d="M17 28l7 7 13-14" stroke="#fff" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'}), h('div.n', 'STEP 03 — PROVE'), h('h3', '最後に、たしかめる'), h('p', '各回の終わりに類題。答えはすぐ判定され、サカイ先輩が「なぜ」まで解説します。'))))


  const cast = h('section.section.wrap#cast-section', { style: { paddingBottom: 0 } },
    h('div.sec-head.reveal',
      h('div', h('div.eyebrow', 'Cast'), h('h2', 'Meet the ', h('span.squig', 'duo'))),
      h('p', 'ぜんぶの章は 2 人の対話で進みます。リョウガくんが疑問を投げ、サカイ先輩が図と手を動かして答える。')),
    h('div.cast.reveal',
      h('div.cast-card.s', h('div.av', { html: avatar('S', 'happy') }), h('div', h('h3', 'サカイ', h('small', '先輩・解説役')), h('p', '授業をひと足先に通った先輩。定義より先に「なぜそうするのか」を話して、ラボで実際に動かして見せてくれる。'), h('div.likes', h('span', '好き: 互除法'), h('span', '口ぐせ「見たほうが早い」')))),
      h('div.cast-card.r', h('div.av', { html: avatar('R', 'think') }), h('div', h('h3', 'リョウガ', h('small', '受講生・質問役')), h('p', 'いままさに受講中。ひっかかったところは遠慮なく聞く。リョウガくんの疑問は、たぶんあなたの疑問でもある。'), h('div.likes', h('span', '好き: スタック'), h('span', '口ぐせ「待ってください」'))))),
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

  const mq = (words, dir, cls) => {
    const inner = h('div.mq-inner', [...words, ...words].map((w, i) => h(`span.mq-w${i % 3 === 1 ? '.alt' : i % 3 === 2 ? '.out' : ''}`, w)))
    return { el: h(`div.mq-row.${cls}`, inner), inner, dir }
  }
  const m1 = mq(['ARRAY', '✦', 'STACK', '✦', 'QUEUE', '✦', 'TREE', '✦', 'GRAPH', '✦', 'LIST', '✦'], 1, 'a')
  const m2 = mq(['O(1)', '●', 'O(log n)', '●', 'O(n)', '●', 'O(n log n)', '●', 'O(n²)', '●', 'O(2ⁿ)', '●'], -1, 'b')
  const marqueeSec = h('section.mq', { 'aria-hidden': 'true' }, m1.el, m2.el)
  const offMq = marquee([m1, m2].map((m) => ({ el: m.inner, dir: m.dir })))

  const race = growthRace()
  const stats = h('section.section.wrap', { style: { paddingBottom: 0 } },
    h('div.sec-head.reveal', h('div', h('div.eyebrow', 'By the numbers'), h('h2', 'いま、ここまで')), h('p', '講義が届くたびに、この数字は増えていきます。')),
    siteStats([
      [LECTURES.length, '講義', '<svg viewBox="0 0 40 40"><rect x="7" y="6" width="26" height="30" rx="5" fill="#fff" stroke="#3d2e54" stroke-width="2.5"/><path d="M13 15h14M13 21h14M13 27h8" stroke="#3d2e54" stroke-width="2.5" stroke-linecap="round"/></svg>', 'c1'],
      [LECTURES.reduce((a, l) => a + l.chapters.length, 0), '章', '<svg viewBox="0 0 40 40"><path d="M6 10h11l3 4h14v18H6z" fill="#fff" stroke="#3d2e54" stroke-width="2.5" stroke-linejoin="round"/></svg>', 'c2'],
      [24, '可視化ラボ', '<svg viewBox="0 0 40 40"><circle cx="11" cy="28" r="5" fill="#ff8a3d" stroke="#3d2e54" stroke-width="2.5"/><circle cx="29" cy="28" r="5" fill="#fff" stroke="#3d2e54" stroke-width="2.5"/><circle cx="20" cy="11" r="5" fill="#3fa9f5" stroke="#3d2e54" stroke-width="2.5"/><path d="M14 24l4-8M26 24l-4-8M16 28h8" stroke="#3d2e54" stroke-width="2.5"/></svg>', 'c3'],
      [LECTURES.reduce((a, l) => a + l.quiz.length, 0), '類題', '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="14" fill="#fff" stroke="#3d2e54" stroke-width="2.5"/><path d="M16 16a4 4 0 1 1 5 4c-1 .5-1 1.5-1 3" stroke="#3d2e54" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="20" cy="28" r="1.8" fill="#3d2e54"/></svg>', 'c4'],
    ]))

  const lectures = h('section.section.wrap#lectures',
    h('div.sec-head.reveal',
      h('div', h('div.eyebrow', 'Index'), h('h2', h('span.squig', 'Lectures'))),
      h('p', '講義資料が追加されるたびにここが伸びていきます。各回は「対話 → 可視化 → POINT → 類題」の順で構成。')),
    h('div.reveal', list))

  const tools = h('section.section.wrap', { style: { paddingTop: 0 } },
    h('div.sec-head.reveal', h('div', h('div.eyebrow', 'Tools'), h('h2', 'Handy ', h('span.squig', 'tools')))),
    h('div.tools-grid.reveal',
      h('a.tool-card', { href: '#/cheatsheet' }, h('div.glyph', 'O(1)  O(log n)  O(n)'), h('div', h('h3', '計算量表'), h('p', '全データ構造の操作コストを一枚に。回が進むごとに自動で増えます。'))),
      h('a.tool-card', { href: '#/glossary' }, h('div.glyph', 'A → Z'), h('div', h('h3', '用語集'), h('p', '講義に出てきた用語を検索。定義の載っている章へ一発で飛べます。'))),
      h('button.tool-card', { style: { textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit' }, onclick: () => import('./palette.js').then((m) => m.openPalette()) }, h('div.glyph', '⌘K  /'), h('div', h('h3', 'クイック検索'), h('p', '章・用語・可視化にキーボードだけで移動。どのページからでも使えます。')))))

  root.append(hero, marqueeSec, principles, cast, race.el, stats, lectures, tools)
  return () => { hc.destroy(); offReact(); offRot(); offMq(); race.destroy() }
}
