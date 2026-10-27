import { h, store, toast, talk, typeset } from '../lib/ui.js'
import { ANSWERS } from '../data/answers.js'
import { avatar } from '../lib/chars.js'

// #/answers  または  #/answers?a=r5（第5回へ）
const SEEN = 'ans:seen'

export function renderAnswers(root, LECTURES, anchor) {
  const avail = new Set(LECTURES.map((l) => l.n))
  const rounds = ANSWERS.filter((r) => avail.has(r.n))
  let cur = +(anchor || '').replace(/^r/, '') || rounds[rounds.length - 1].n
  if (!rounds.some((r) => r.n === cur)) cur = rounds[rounds.length - 1].n
  let hide = store.get('ans:hide', false)

  const tabs = h('div.ans-tabs', { role: 'tablist', 'aria-label': '回を選ぶ' })
  const body = h('div.ans-body')
  const hideBtn = h('button.btn.ans-hide', { 'aria-pressed': String(hide), onclick: () => { hide = !hide; store.set('ans:hide', hide); hideBtn.setAttribute('aria-pressed', String(hide)); hideBtn.lastChild.textContent = hide ? '答えを表示する' : '答えをかくす（自分で解く）'; draw() } },
    h('span', { 'aria-hidden': 'true' }, '🙈'), hide ? '答えを表示する' : '答えをかくす（自分で解く）')

  const drawTabs = () => {
    tabs.innerHTML = ''
    rounds.forEach((r) => tabs.appendChild(h('button.ans-tab', { role: 'tab', 'aria-selected': String(r.n === cur), class: r.n === cur ? 'on' : '', onclick: () => { cur = r.n; history.replaceState(null, '', `#/answers?a=r${r.n}`); drawTabs(); draw(); body.scrollIntoView({ behavior: 'smooth', block: 'start' }) } },
      h('b', `第${r.n}回`), h('small', `${r.items.length}問`))))
  }

  const draw = () => {
    const R = rounds.find((r) => r.n === cur)
    const seen = store.get(SEEN, {})
    body.innerHTML = ''
    // 一覧（MS Forms 入力用）
    const sheet = h('div.ans-sheet.reveal.in',
      h('div.ans-sheet-head',
        h('div', h('div.eyebrow', `Report ${String(R.n).padStart(2, '0')}`), h('h2', `第${R.n}回 課題レポート — ${R.title}`)),
        h('button.btn.primary.ans-copy', { onclick: () => { const t = R.items.map((it, i) => `問題${i + 1}: ${it.a}`).join('\n'); navigator.clipboard?.writeText(t).then(() => toast('答えの一覧をコピーしたよ！', 'ok'), () => toast('コピーできませんでした', 'ng')) } }, '一覧をコピー')),
      h('div.ans-grid', R.items.map((it, i) => h('button.ans-cell', { class: hide ? 'hidden' : '', onclick: () => { document.getElementById(`r${R.n}q${i + 1}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => open(R, i), 350) } },
        h('span.ans-qn', `問題 ${i + 1}`), h('span.ans-a', it.a), it.note ? h('span.ans-warn', { title: '注意あり' }, '!') : null))),
      h('p.small.ans-legend', { html: '<span class="ans-warn">!</span> は前提や解釈に注意がある問題。タップで詳しい解説へ。' }))
    body.appendChild(sheet)

    // 各問
    const list = h('div.ans-list')
    R.items.forEach((it, i) => {
      const id = `r${R.n}q${i + 1}`
      const card = h('article.ans-q', { id, class: seen[id] ? 'seen' : '' },
        h('header.ans-q-head', { onclick: () => toggle(card, R, i) },
          h('span.ans-q-n', String(i + 1).padStart(2, '0')),
          h('div.ans-q-t', h('span.tag', it.tag), h('p', { html: it.q })),
          h('div.ans-q-a', { class: hide ? 'hidden' : '' }, h('small', '答え'), h('b', it.a)),
          h('span.ans-q-chev', { 'aria-hidden': 'true' }, '▾')),
        h('div.ans-q-body'))
      list.appendChild(card)
    })
    body.appendChild(list)
    typeset(body)
  }

  const fill = (card, R, i) => {
    const it = R.items[i]
    const b = card.querySelector('.ans-q-body')
    if (b.childElementCount) return
    b.append(...[
      h('div.ans-final', h('span', '答え'), h('b', it.a)),
      talk(it.why),
      it.steps ? h('div.ans-steps', { html: it.steps }) : null,
      it.note ? h('div.callout.warn', h('span.ic', '注意'), h('div', { html: it.note })) : null,
      it.lab ? h('a.btn.ans-lab', { href: `#/lecture/${it.lab[0]}?a=${it.lab[1]}` }, h('span', { html: avatar('R', 'happy') }), `${it.lab[2]} で確かめる`, h('span.arr', '→')) : null].filter(Boolean))
    b.querySelectorAll('.reveal').forEach((e, k) => setTimeout(() => e.classList.add('in'), 60 + k * 60))
    typeset(b)
  }
  const open = (R, i) => { const card = document.getElementById(`r${R.n}q${i + 1}`); if (card && !card.classList.contains('open')) toggle(card, R, i) }
  const toggle = (card, R, i) => {
    fill(card, R, i)
    const on = card.classList.toggle('open')
    card.querySelector('.ans-q-a')?.classList.remove('hidden')
    if (on) { const s = store.get(SEEN, {}); s[card.id] = 1; store.set(SEEN, s); card.classList.add('seen') }
  }

  root.append(
    h('section.page-hero.wrap',
      h('div.eyebrow', 'Report answers'),
      h('h1', '課題の解説'),
      h('p', { html: '各回の課題レポートの<b>答え</b>と、<b class="amber">サカイ</b>先輩と<b class="cyan">リョウガ</b>くんの<b>解き方の解説</b>。答えはすべてスクリプトで検算し、講義のラボでも同じ結果になることを確認しています。' }),
      h('div.ans-cast', { html: avatar('S', 'happy') + avatar('R', 'think') }),
      h('div.ctrl-row.ans-ctrl', tabs, hideBtn),
      h('div.callout.tip.ans-honest', h('span.ic', 'おねがい'), h('div', { html: 'まず自分で解いてから答え合わせに使ってね。「答えをかくす」にすると、問題ごとにタップするまで答えが見えません。' }))),
    h('div.wrap', { style: { paddingBottom: '120px' } }, body))
  drawTabs(); draw()
  return () => {}
}
