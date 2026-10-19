import { h, store, toast } from '../lib/ui.js'
import { GLOSSARY } from '../data/glossary.js'
import { autocomplete, swipeable, sheet, markMatch } from '../lib/patterns.js'
import { talk } from '../lib/ui.js'

// 用語ごとの暗記ステータス: 'ok'（おぼえた） / 'ng'（にがて） / なし
const MKEY = 'gloss:mem'
const memAll = () => store.get(MKEY, {})
const setMem = (t, v) => { const m = memAll(); if (v) m[t] = v; else delete m[t]; store.set(MKEY, m) }

const ICON_OK = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>'
const ICON_NG = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 7v6"/><circle cx="12" cy="17" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="9"/></svg>'

export function renderGlossary(root, LECTURES) {
  const avail = new Set(LECTURES.map((l) => l.n))
  const items = GLOSSARY.filter((g) => avail.has(g[3]))
  let lec = 0, mode = 'all'
  const input = h('input.txt.gloss-search', { placeholder: '用語・英語・説明で検索…（Tab で補完）', 'aria-label': '用語を検索', type: 'search' })
  const grid = h('div.gloss-grid')
  const count = h('span.small')
  const meter = h('div.mem-meter', { 'aria-hidden': 'true' }, h('i.ok'), h('i.ng'))
  const meterTxt = h('span.mem-txt')

  const segBtns = (opts, get, set) => {
    const el = h('div.seg')
    opts.forEach(([v, t]) => el.appendChild(h('button', { class: get() === v ? 'on' : '', 'data-v': v, onclick: (e) => { set(v); [...el.children].forEach((b) => b.classList.toggle('on', b === e.currentTarget)); draw() } }, t)))
    return el
  }
  const lecSeg = segBtns([[0, 'すべての回'], ...LECTURES.map((l) => [l.n, `第${l.n}回`])], () => lec, (v) => (lec = v))
  const modeSeg = segBtns([['all', 'ぜんぶ'], ['todo', '未チェック'], ['ng', 'にがて'], ['ok', 'おぼえた']], () => mode, (v) => (mode = v))
  modeSeg.classList.add('mem-seg')

  const updMeter = () => {
    const m = memAll()
    const scope = items.filter((g) => !lec || g[3] === lec)
    const ok = scope.filter((g) => m[g[0]] === 'ok').length, ng = scope.filter((g) => m[g[0]] === 'ng').length
    meter.style.setProperty('--ok', `${(ok / Math.max(1, scope.length)) * 100}%`)
    meter.style.setProperty('--ng', `${(ng / Math.max(1, scope.length)) * 100}%`)
    meterTxt.innerHTML = `<b class="lime">${ok}</b> おぼえた · <b class="rose">${ng}</b> にがて · ${scope.length - ok - ng} 未チェック`
  }

  // スワイプの結果を記録（元に戻す付きトースト）
  const mark = (term, v) => {
    const prev = memAll()[term]
    setMem(term, prev === v ? null : v)
    const now = memAll()[term]
    toast(now === 'ok' ? `「${term}」をおぼえた！` : now === 'ng' ? `「${term}」をにがてリストへ` : `「${term}」のチェックを外したよ`, {
      type: now === 'ok' ? 'ok' : now === 'ng' ? 'warn' : 'info',
      action: { label: '元に戻す', fn: () => { setMem(term, prev); draw(); updMeter() } },
    })
    draw(); updMeter()
  }

  const openDetail = (g) => {
    const [t, en, d, n, id] = g
    const L = LECTURES.find((l) => l.n === n)
    const related = items.filter((x) => x !== g && x[3] === n && x[4] === id).slice(0, 6)
    const st = memAll()[t]
    const sh = sheet({
      title: t, sub: en, label: `用語 ${t}`,
      body: [
        h('div.gd-badges', h('span.tag', `第${n}回`), h('span.tag', L?.chapters.find((c) => c.id === id)?.title || id), st ? h(`span.tag.mem-${st}`, st === 'ok' ? 'おぼえた' : 'にがて') : null),
        talk(`R: 先輩、「${t}」ってなんでしたっけ？\nS: ${d}`),
        related.length ? h('div.gd-rel', h('div.menu-k', '同じ章の用語'), h('div.gd-rel-list', related.map((r) => h('button.chip', { onclick: () => { sh.close(true); openDetail(r) } }, r[0])))) : null,
      ],
      foot: [
        h('button.btn.gd-ng', { onclick: () => { sh.close(); mark(t, 'ng') } }, h('span', { html: ICON_NG }), st === 'ng' ? 'にがてを外す' : 'にがて'),
        h('button.btn.gd-ok', { onclick: () => { sh.close(); mark(t, 'ok') } }, h('span', { html: ICON_OK }), st === 'ok' ? 'おぼえたを外す' : 'おぼえた'),
        h('a.btn.primary.gd-go', { href: `#/lecture/${n}?a=${id}` }, '章へ', h('span.arr', '→')),
      ],
    })
  }

  const draw = () => {
    const q = input.value.trim()
    const ql = q.toLowerCase()
    const m = memAll()
    const list = items.filter((g) => (!lec || g[3] === lec)
      && (mode === 'all' || (mode === 'todo' ? !m[g[0]] : m[g[0]] === mode))
      && (!q || g.slice(0, 3).some((x) => x.toLowerCase().includes(ql))))
    grid.innerHTML = ''
    list.forEach((g, i) => {
      const [t, en, d, n, id] = g
      const st = m[t]
      const card = h('article.gloss', { class: st ? `mem-${st}` : '', style: { '--i': Math.min(i, 12) } },
        h('h4', h('span', st ? h('i.mem-dot', { title: st === 'ok' ? 'おぼえた' : 'にがて' }) : null, h('span', { html: markMatch(t, q) })), h('span.en', { html: markMatch(en, q) })),
        h('p', { html: markMatch(d, q) }),
        h('div.gloss-foot', h('a.src', { href: `#/lecture/${n}?a=${id}` }, `→ 第${n}回で確認`), h('span.gloss-more', 'タップで詳しく')))
      grid.appendChild(swipeable(card, {
        right: { label: st === 'ok' ? '外す' : 'おぼえた', icon: ICON_OK, cls: 'mint', fn: () => mark(t, 'ok') },
        left: { label: st === 'ng' ? '外す' : 'にがて', icon: ICON_NG, cls: 'pink', fn: () => mark(t, 'ng') },
        onTap: () => openDetail(g),
      }))
    })
    if (!list.length) grid.appendChild(h('div.gloss-empty', h('p', mode === 'ng' ? 'にがてな用語はありません。すごい！' : mode === 'ok' ? 'まだ「おぼえた」はありません。カードを右へスワイプしてみよう。' : '該当する用語がありません')))
    count.textContent = `${list.length} 語`
  }

  input.addEventListener('input', draw)
  root.append(
    h('section.page-hero.wrap', h('div.eyebrow', 'Glossary'), h('h1', '用語集'),
      h('p', { html: '講義に出てきた用語の定義です。カードを<b class="lime">右へスワイプ</b>で「おぼえた」、<b class="rose">左へ</b>で「にがて」。タップすると詳しく表示し、そこから章へ移動できます。' }),
      input,
      h('div.mem-bar', meter, meterTxt),
      h('div.ctrl-row.gloss-filters', lecSeg, modeSeg, count),
      h('p.small.swipe-hint', { 'aria-hidden': 'true' }, h('span.sh-hand', '👆'), 'マウスでもドラッグでスワイプできます')),
    h('div.wrap', grid))

  // Auto Complete: 用語名・英語名を候補に。決定すると詳細シートを開く
  autocomplete(input, {
    historyKey: 'gloss:hist',
    source: (q) => {
      const ql = q.toLowerCase()
      const score = (g) => {
        const t = g[0].toLowerCase(), e = g[1].toLowerCase()
        if (t.startsWith(ql) || e.startsWith(ql)) return 0
        if (t.includes(ql) || e.includes(ql)) return 1
        if (g[2].toLowerCase().includes(ql)) return 2
        return 9
      }
      return items.map((g) => [score(g), g]).filter(([s]) => s < 9).sort((a, b) => a[0] - b[0] || a[1][3] - b[1][3])
        .map(([s, g]) => ({ label: g[0], sub: g[1], group: s < 2 ? '用語' : '説明に含む', data: g }))
    },
    onPick: (it) => { draw(); openDetail(it.data) },
    emptyHint: '該当する用語がありません',
  })

  draw(); updMeter()
  const onLec = () => updMeter()
  lecSeg.addEventListener('click', onLec)
  return () => {}
}
