import { h, $$, store } from '../lib/ui.js'
import { avatar } from '../lib/chars.js'
import { lectureInfo } from './infographics.js'
import { quiz, quizProgress } from '../lib/quiz.js'
import { sheet } from '../lib/patterns.js'

export function renderLecture(root, lec, ALL) {
  const goalsKey = 'goals:' + lec.n
  const g = store.get(goalsKey, {})
  const goals = h('aside.goals', { 'aria-label': '達成目標' },
    h('h4', h('span', '今回の達成目標'), h('span.goal-count', '')),
    lec.goals.map((t, i) => h('label.goal',
      h('input', { type: 'checkbox', checked: !!g[i], onchange: (e) => { const s = store.get(goalsKey, {}); s[i] = e.target.checked; store.set(goalsKey, s); cnt() } }),
      h('span.box'), h('span', { html: t }))))
  const cnt = () => { const s = store.get(goalsKey, {}); goals.querySelector('.goal-count').textContent = `${Object.values(s).filter(Boolean).length}/${lec.goals.length}` }
  cnt()

  const hero = h('section.lec-hero.wrap',
    h('div.lec-hero-grid',
      h('div',
        h('div.big-num', { 'aria-hidden': 'true' }, String(lec.n).padStart(2, '0')),
        h('div.eyebrow', `Lecture ${String(lec.n).padStart(2, '0')} — ${lec.en}`),
        h('h1', lec.title, h('span.sub', lec.sub)),
        h('div.lec-hero-cast', h('span.avs', { html: avatar('S', 'happy') + avatar('R', 'normal') }), h('span', 'サカイ先輩とリョウガくんの対話で進みます'))),
      goals))

  const chapters = [...lec.chapters, { id: 'quiz', k: 'PRACTICE', title: '類題で確かめる', build: (el) => el.append(quiz('lec' + lec.n, lec.quiz)) }]
  const tocLinks = []
  const toc = h('nav.toc', { 'aria-label': '目次' }, h('div.toc-title', 'もくじ'),
    h('ol', chapters.map((c, i) => {
      const a = h('a', { href: `#/lecture/${lec.n}?a=${c.id}`, onclick: (e) => { e.preventDefault(); document.getElementById(c.id)?.scrollIntoView({ behavior: 'smooth' }); history.replaceState(null, '', `#/lecture/${lec.n}?a=${c.id}`) } }, h('span.k', String(i + 1).padStart(2, '0')), c.title)
      tocLinks.push(a)
      return h('li', a)
    })))
  const content = h('div.lec-content')
  chapters.forEach((c, i) => {
    const sec = h('section.chapter', { id: c.id },
      h('div.chapter-head', h('div.k.reveal', h('span.k-n', String(i + 1).padStart(2, '0')), h('span', c.k)), h('h2', c.title)))
    c.build(sec)
    content.appendChild(sec)
  })
  const idx = ALL.indexOf(lec)
  const prev = ALL[idx - 1], next = ALL[idx + 1]
  content.appendChild(h('div.pager',
    prev ? h('a', { href: `#/lecture/${prev.n}` }, h('span.k', '← まえの回'), h('span.t', `第${prev.n}回 ${prev.title}`)) : null,
    next ? h('a.next', { href: `#/lecture/${next.n}` }, h('span.k', 'つぎの回 →'), h('span.t', `第${next.n}回 ${next.title}`)) : h('a.next', { href: '#/' }, h('span.k', 'もくじ →'), h('span.t', '講義一覧へ戻る'))))

  root.classList.add('lec-page'); root.dataset.tone = String(lec.n % 4)
  root.append(hero, h('div.wrap.lec-body', toc, content))
  hero.querySelector('.lec-hero-grid > div').appendChild(lectureInfo(lec, content))
  // chapter-progress rail (右端の章ドット)
  const rail = h('nav.ch-rail', { 'aria-hidden': 'true' }, chapters.map((c, i) => h('a', { href: `#/lecture/${lec.n}?a=${c.id}`, title: c.title, onclick: (e) => { e.preventDefault(); document.getElementById(c.id)?.scrollIntoView({ behavior: 'smooth' }) } }, h('i'), h('span', c.title))))
  document.body.appendChild(rail)
  rail.style.setProperty('--accent', getComputedStyle(root).getPropertyValue('--accent'))
  const railLinks = [...rail.children]

  // Bottom Sheet: モバイル用もくじ（サイドの目次が隠れる幅で表示）
  let curIdx = 0
  const fabLbl = h('span.fab-t', chapters[0].title)
  const fabRing = h('span.fab-ring', { 'aria-hidden': 'true' })
  const fab = h('button.toc-fab', { 'aria-label': 'もくじを開く', 'aria-haspopup': 'dialog', onclick: () => openToc() },
    fabRing, h('span.fab-ic', { 'aria-hidden': 'true', html: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.4" fill="currentColor"/><circle cx="4.5" cy="12" r="1.4" fill="currentColor"/><circle cx="4.5" cy="18" r="1.4" fill="currentColor"/></svg>' }), fabLbl)
  fab.style.setProperty('--accent', getComputedStyle(root).getPropertyValue('--accent'))
  document.body.appendChild(fab)
  const openToc = () => {
    const qp = quizProgress('lec' + lec.n, lec.quiz.length)
    const goalsDone = Object.values(store.get(goalsKey, {})).filter(Boolean).length
    const sh = sheet({
      title: `第${lec.n}回 もくじ`, sub: lec.title, tall: true,
      body: [
        h('div.toc-sheet-stats',
          h('div', h('b', `${curIdx + 1}/${chapters.length}`), h('span', 'いまの章')),
          h('div', h('b', `${goalsDone}/${lec.goals.length}`), h('span', '達成目標')),
          h('div', h('b', `${qp.ok}/${qp.total}`), h('span', '類題正解'))),
        h('ol.toc-sheet', chapters.map((c, i) => h('li', { class: i === curIdx ? 'on' : i < curIdx ? 'done' : '', style: { '--i': i } },
          h('a', { href: `#/lecture/${lec.n}?a=${c.id}`, onclick: (e) => { e.preventDefault(); sh.close(true); document.getElementById(c.id)?.scrollIntoView({ behavior: 'smooth' }); history.replaceState(null, '', `#/lecture/${lec.n}?a=${c.id}`) } },
            h('span.k', i < curIdx ? '✓' : String(i + 1).padStart(2, '0')), h('span.t', h('small', c.k), c.title), i === curIdx ? h('span.here', 'いまここ') : null)))),
      ],
    })
    sh.el.style.setProperty('--accent', getComputedStyle(root).getPropertyValue('--accent'))
    sh.el.querySelector('.toc-sheet li.on')?.scrollIntoView({ block: 'center' })
  }

  // scroll spy
  const secs = chapters.map((c) => document.getElementById(c.id))
  const spy = () => {
    let cur = 0
    secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * 0.35) cur = i })
    tocLinks.forEach((a, i) => a.classList.toggle('active', i === cur))
    railLinks.forEach((a, i) => { a.classList.toggle('active', i === cur); a.classList.toggle('done', i < cur) })
    rail.classList.toggle('show', scrollY > innerHeight * 0.7)
    fab.classList.toggle('show', scrollY > innerHeight * 0.5)
    if (cur !== curIdx) { curIdx = cur; fabLbl.textContent = chapters[cur].title; fab.classList.remove('bump'); void fab.offsetWidth; fab.classList.add('bump') }
    const max = document.documentElement.scrollHeight - innerHeight
    fabRing.style.setProperty('--p', String(max > 0 ? Math.min(1, scrollY / max) : 0))
  }
  addEventListener('scroll', spy, { passive: true })
  spy()
  const cleanups = lec._cleanups || []
  return () => { rail.remove(); fab.remove(); removeEventListener('scroll', spy); cleanups.forEach((f) => f()); lec._cleanups = [] }
}
