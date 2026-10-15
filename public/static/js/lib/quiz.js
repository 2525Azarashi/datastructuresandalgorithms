import { h, $$, store, typeset, talkLine } from './ui.js'

/**
 * items: [{ kind:'choice'|'multi'|'input', q, opts?, answer, explain, tag? }]
 *   choice: answer = index
 *   multi : answer = [indices]
 *   input : answer = string | string[] (正規化して比較)
 */
const norm = (s) => String(s).trim().replace(/[　\s]+/g, ' ').replace(/，|、/g, ',').toLowerCase()

export function quiz(id, items) {
  const saved = store.get('quiz:' + id, {})
  const scoreEl = h('div.score')
  const results = {}
  const update = () => {
    const ok = Object.values(results).filter(Boolean).length
    scoreEl.innerHTML = `${ok}<small> / ${items.length} 正解</small>`
    store.set('quiz:' + id, Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v])))
    document.dispatchEvent(new CustomEvent('progress'))
  }
  const reset = h('button.btn', { onclick: () => { store.set('quiz:' + id, {}); root.replaceWith(quiz(id, items)) } }, 'リセット')
  const root = h('div',
    h('div.quiz-bar', scoreEl, h('div.ctrl-row', h('span.small', '類題（講義内容から作成した練習問題）'), reset)),
    h('div.quiz', items.map((it, qi) => one(it, qi))))

  function one(it, qi) {
    const box = h('div.q')
    const fb = h('div.q-fb.talky')
    let picked = new Set()
    const mark = (ok, silent) => {
      results[qi] = ok
      box.classList.toggle('correct', ok)
      box.classList.toggle('wrong', !ok)
      fb.classList.add('show')
      const react = ok ? ['お、正解！', 'そのとおり！', 'ばっちり！'][qi % 3] : ['おしい！', 'ここは引っかかりやすいんだ。', 'もう一回見てみよう。'][qi % 3]
      fb.innerHTML = ''
      const ln = talkLine('S', `<span class="res ${ok ? 'lime' : 'rose'}">${ok ? '○ 正解' : '× 不正解'}</span>${react} ${it.explain}`, ok ? 'happy' : 'oops', 0, ok ? '.ok' : '.ng')
      ln.classList.add('in')
      fb.appendChild(ln)
      typeset(fb)
      if (!silent) { update(); if (ok) confetti(box) }
    }
    let body
    if (it.kind === 'input') {
      const inp = h('input.txt', { placeholder: it.placeholder || '答えを入力', onkeydown: (e) => { if (e.key === 'Enter') check() } })
      const check = () => {
        if (!inp.value.trim()) return
        const ans = Array.isArray(it.answer) ? it.answer : [it.answer]
        mark(ans.some((a) => norm(a) === norm(inp.value)))
      }
      body = h('div.q-input', inp, h('button.btn', { onclick: check }, '判定'), h('button.btn', { onclick: () => { inp.value = Array.isArray(it.answer) ? it.answer[0] : it.answer; mark(false) } }, '答えを見る'))
      if (saved[qi] != null) { inp.value = saved[qi] ? (Array.isArray(it.answer) ? it.answer[0] : it.answer) : ''; mark(saved[qi], true) }
    } else {
      const multi = it.kind === 'multi'
      const opts = it.opts.map((o, oi) => {
        const b = h('button.q-opt', { onclick: () => {
          if (multi) { picked.has(oi) ? picked.delete(oi) : picked.add(oi); b.classList.toggle('picked') }
          else { picked = new Set([oi]); finish() }
        } }, h('span.m', String.fromCharCode(65 + oi)), h('span', { html: o }))
        return b
      })
      const finish = (silent) => {
        const ans = new Set(multi ? it.answer : [it.answer])
        opts.forEach((b, oi) => {
          b.disabled = true
          b.classList.remove('picked')
          if (ans.has(oi)) b.classList.add('right')
          else if (picked.has(oi)) b.classList.add('miss')
        })
        const ok = ans.size === picked.size && [...ans].every((x) => picked.has(x))
        mark(silent ? saved[qi] : ok, silent)
        if (chk) chk.remove()
      }
      const chk = multi ? h('div.q-actions', h('button.btn', { onclick: () => finish() }, '判定する'), h('span.small', '当てはまるものをすべて選択')) : null
      body = h('div', h('div.q-opts', opts), chk)
      if (saved[qi] != null) { results[qi] = saved[qi]; finish(true) }
    }
    box.append(
      h('div.q-top', h('span.q-n', `Q${String(qi + 1).padStart(2, '0')}`), it.tag ? h('span.q-kind', it.tag) : null),
      h('div.q-text', { html: it.q }), body, fb)
    return box
  }
  Object.entries(saved).forEach(([k, v]) => (results[k] = v))
  update()
  setTimeout(() => typeset(root), 0)
  return root
}

export function quizProgress(id, total) {
  const s = store.get('quiz:' + id, {})
  return { done: Object.keys(s).length, ok: Object.values(s).filter(Boolean).length, total }
}

function confetti(anchor) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const r = anchor.getBoundingClientRect()
  const cols = ['#ff8a3d', '#3fa9f5', '#2fbf71', '#ff5c8a', '#ffd23f', '#9b7bff']
  for (let i = 0; i < 26; i++) {
    const el = document.createElement('i')
    el.className = 'confetti'
    const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 110
    el.style.cssText = `left:${r.left + r.width * (0.2 + Math.random() * 0.6)}px;top:${r.top + 30}px;background:${cols[i % cols.length]};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 70}px;--rot:${Math.random() * 720 - 360}deg;border-radius:${i % 3 ? '3px' : '50%'}`
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 1100)
  }
}
