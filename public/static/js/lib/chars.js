// サカイ（先輩）とリョウガ（受講生）のアバター。SVG で描くので軽く、表情を差し替えられる。
// mood: 'normal' | 'happy' | 'think' | 'oops' | 'wow'
const INK = '#3d2e54'
let uid = 0

const MOUTH = {
  normal: `<path d="M28.5 46.5 Q32 49.5 35.5 46.5" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  happy: `<path d="M27.5 45.2 Q32 52 36.5 45.2 Z" fill="#ff6f91" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>`,
  think: `<path d="M29.5 47.5 Q32 46 34.5 47.2" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  oops: `<ellipse cx="32" cy="47.4" rx="2.2" ry="2.6" fill="#ff6f91" stroke="${INK}" stroke-width="1.8"/>`,
  wow: `<ellipse cx="32" cy="47.6" rx="3" ry="3.4" fill="#ff6f91" stroke="${INK}" stroke-width="1.8"/>`,
}
const BROWS = {
  think: (l, r) => `<path d="M${l - 4} 31.5 L${l + 3} 30" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/><path d="M${r - 3} 29.5 L${r + 4} 31" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`,
  oops: (l, r) => `<path d="M${l - 4} 30 L${l + 3} 31.5" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/><path d="M${r - 3} 31.5 L${r + 4} 30" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`,
}
const eyes = (l, r, y, rad, mood) => mood === 'happy'
  ? `<g class="eyes"><path d="M${l - 3} ${y + 1} Q${l} ${y - 3} ${l + 3} ${y + 1}" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M${r - 3} ${y + 1} Q${r} ${y - 3} ${r + 3} ${y + 1}" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/></g>`
  : `<g class="eyes"><circle cx="${l}" cy="${y}" r="${rad}" fill="${INK}"/><circle cx="${r}" cy="${y}" r="${rad}" fill="${INK}"/><circle cx="${l + .9}" cy="${y - .9}" r="${rad * .38}" fill="#fff"/><circle cx="${r + .9}" cy="${y - .9}" r="${rad * .38}" fill="#fff"/></g>`

export function avatar(who, mood = 'normal') {
  const id = 'avc' + (++uid)
  const S = who === 'S'
  const bg = S ? '#ffe0cc' : '#d8eeff'
  const shirt = S ? '#ff8a3d' : '#3fa9f5'
  const hair = S ? '#6b4433' : '#34407a'
  const L = 25.5, R = 38.5, Y = 38.5
  const hairPath = S
    // サカイ: ふんわりボブ + アホ毛
    ? `<path d="M14.5 40 C12 22 22 14 32.5 14 C44 14 52 22 49.5 40 C48 33 46 28 41 25.5 C36 29 25 30 19 27.5 C16.5 31 15.5 35 14.5 40Z" fill="${hair}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
       <path d="M32 14.5 C31 8 37 6 39.5 9.5" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`
    // リョウガ: つんつん頭
    : `<path d="M14 38 L12.5 25 L18.5 26.5 L18.5 16.5 L25.5 20.5 L30 11 L35.5 19.5 L42.5 14 L44 23.5 L51 22.5 L50 38 C47 30 42 26.5 32 26.5 C22 26.5 17 30 14 38Z" fill="${hair}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>`
  const glasses = S
    ? `<g fill="rgba(255,255,255,.35)" stroke="${INK}" stroke-width="1.8"><circle cx="${L}" cy="${Y}" r="5.4"/><circle cx="${R}" cy="${Y}" r="5.4"/></g><path d="M${L + 5.4} ${Y} Q32 ${Y - 1.6} ${R - 5.4} ${Y}" stroke="${INK}" stroke-width="1.8" fill="none"/>`
    : ''
  const extra = S
    ? '' // 先輩らしく落ち着き
    : `<path d="M44.5 47 l2.4 -1.2" stroke="${INK}" stroke-width="1.4" stroke-linecap="round" opacity=".5"/>`
  const brow = BROWS[mood] ? BROWS[mood](L, R) : ''
  const sweat = mood === 'oops' ? `<path d="M50 27 C52 30 52.5 32 50.5 33.2 C48.5 32.6 48.6 30 50 27Z" fill="#8fd3ff" stroke="${INK}" stroke-width="1.4"/>` : ''
  const sparkle = mood === 'happy' || mood === 'wow' ? `<path d="M53 15 l1.2 3 3 1.2 -3 1.2 -1.2 3 -1.2 -3 -3 -1.2 3 -1.2z" fill="#ffd23f" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>` : ''
  return `<svg viewBox="0 0 64 64" role="img" aria-label="${S ? 'サカイ' : 'リョウガ'}">
    <defs><clipPath id="${id}"><circle cx="32" cy="32" r="29"/></clipPath></defs>
    <circle cx="32" cy="34" r="29" fill="${INK}"/>
    <circle cx="32" cy="32" r="29" fill="${bg}" stroke="${INK}" stroke-width="2.5"/>
    <g clip-path="url(#${id})">
      <path d="M9 66 C10 55 20 51.5 32 51.5 C44 51.5 54 55 55 66Z" fill="${shirt}" stroke="${INK}" stroke-width="2.2"/>
      <path d="M27 52 L32 57 L37 52" fill="none" stroke="${INK}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    </g>
    <ellipse cx="32" cy="37" rx="17" ry="15.5" fill="#ffe6d5" stroke="${INK}" stroke-width="2.2"/>
    ${hairPath}
    <ellipse cx="20.5" cy="44.5" rx="3.2" ry="2.1" fill="#ff9db5" opacity=".75"/>
    <ellipse cx="43.5" cy="44.5" rx="3.2" ry="2.1" fill="#ff9db5" opacity=".75"/>
    ${brow}
    ${eyes(L, R, Y, S ? 2.1 : 2.6, mood)}
    ${glasses}
    ${MOUTH[mood] || MOUTH.normal}
    ${extra}${sweat}${sparkle}
  </svg>`
}

/** 台詞の中身から表情を推定 */
export function moodOf(who, text) {
  const t = text.replace(/<[^>]+>/g, '')
  if (/えっ|え、|[!！][?？]|[?？][!！]|マジ/.test(t)) return 'wow'
  if (/[？?]$|って[？?]|ですか|かな|んですか|でしょうか/.test(t) && who === 'R') return 'think'
  if (/(！|!)$|なるほど|すごい|やった|お、|そう！|正解/.test(t)) return 'happy'
  if (/落とし穴|ダメ|注意|間違/.test(t)) return 'oops'
  return 'normal'
}
