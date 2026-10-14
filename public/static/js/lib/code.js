import { h, $$ } from './ui.js'

const KW = /\b(int|void|return|while|for|if|else|char|double|float|long|struct|break|continue|Stack|Queue)\b/g
function hl(line) {
  let s = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  // comments
  let cm = ''
  const ci = s.indexOf('//')
  if (ci >= 0) { cm = `<span class="cm">${s.slice(ci)}</span>`; s = s.slice(0, ci) }
  if (/^\s*#/.test(s)) return `<span class="pp">${s}</span>${cm}`
  s = s.replace(/("[^"]*")/g, '<span class="st">$1</span>')
  s = s.replace(/\b(\d+)\b/g, '<span class="nu">$1</span>')
  s = s.replace(KW, (m) => (/^(int|void|char|double|float|long|struct|Stack|Queue)$/.test(m) ? `<span class="ty">${m}</span>` : `<span class="kw">${m}</span>`))
  s = s.replace(/\b([A-Za-z_]\w*)(?=\()/g, (m) => (/^(while|for|if|return)$/.test(m) ? m : `<span class="fn">${m}</span>`))
  return s + cm
}

/** C コードビューア。cur(n) で n 行目をハイライト, counts({n:回数}) で実行回数表示 */
export function codeView(src, { counts = false } = {}) {
  const lines = src.replace(/^\n/, '').replace(/\s+$/, '').split('\n')
  const el = h('div.code', { role: 'region', 'aria-label': 'ソースコード' })
  const rows = lines.map((ln, i) => {
    const r = h('div.ln', h('span.no', i + 1), h('span', { html: hl(ln) || ' ' }), counts ? h('span.cnt', '') : h('span'))
    el.appendChild(r)
    return r
  })
  el.cur = (n) => {
    rows.forEach((r, i) => r.classList.toggle('cur', i + 1 === n))
    const r = rows[n - 1]
    if (r) {
      const top = r.offsetTop, bot = top + r.offsetHeight
      if (top < el.scrollTop || bot > el.scrollTop + el.clientHeight) el.scrollTo({ top: top - el.clientHeight / 2, behavior: 'smooth' })
    }
  }
  el.counts = (map) => {
    if (!counts) return
    rows.forEach((r, i) => {
      const c = map[i + 1]
      $$('.cnt', r)[0].textContent = c ? `×${c}` : ''
      r.classList.toggle('hit', !!c)
    })
  }
  return el
}
