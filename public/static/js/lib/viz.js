import { s, svgRoot } from './ui.js'

/** general ordered tree layout. children: (i)=>[...]  returns {pos:{i:{x,y}}, depth, W, H} */
export function layoutTree(root, children, { dx = 64, dy = 70, pad = 34 } = {}) {
  const pos = {}
  let leaf = 0, maxD = 0
  const walk = (u, d) => {
    maxD = Math.max(maxD, d)
    const cs = children(u)
    if (!cs.length) { pos[u] = { x: leaf++ * dx, y: d * dy, d }; return }
    cs.forEach((c) => walk(c, d + 1))
    pos[u] = { x: (pos[cs[0]].x + pos[cs[cs.length - 1]].x) / 2, y: d * dy, d }
  }
  walk(root, 0)
  Object.values(pos).forEach((p) => { p.x += pad; p.y += pad })
  return { pos, W: Math.max(1, leaf - 1) * dx + pad * 2, H: maxD * dy + pad * 2, height: maxD }
}

/** binary tree layout using inorder index for x (keeps left/right meaning visible) */
export function layoutBinary(root, L, R, { dx = 50, dy = 66, pad = 30 } = {}) {
  const pos = {}
  let k = 0, maxD = 0
  const seen = new Set()
  const walk = (u, d) => {
    if (u == null || u < 0 || seen.has(u)) return
    seen.add(u)
    maxD = Math.max(maxD, d)
    walk(L[u], d + 1)
    pos[u] = { x: k++ * dx + pad, y: d * dy + pad, d }
    walk(R[u], d + 1)
  }
  walk(root, 0)
  return { pos, W: Math.max(1, k - 1) * dx + pad * 2, H: maxD * dy + pad * 2 }
}

/** draw graph/tree. edges: [[u,v,cls?]] ; directed: arrows. returns {svg, nodeEl, edgeEl} */
export function drawGraph({ pos, edges, W, H, r = 16, directed = false, labels, onNode, edgeLabel }) {
  const svg = svgRoot(W, H, { role: 'img', style: `max-width:${Math.round(W * 1.25)}px;margin:0 auto` })
  const defs = s('defs', {}, s('marker', { id: 'arr' + (drawGraph.k = (drawGraph.k || 0) + 1), viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, s('path', { d: 'M0 0 10 5 0 10z', fill: 'rgba(61,46,84,.45)' })))
  const mid = 'arr' + drawGraph.k
  svg.appendChild(defs)
  const gE = s('g'), gN = s('g')
  svg.append(gE, gN)
  const edgeEl = {}, nodeEl = {}
  edges.forEach(([u, v, cls]) => {
    const A = pos[u], B = pos[v]
    if (!A || !B) return
    const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1
    const x1 = A.x + (dx / d) * r, y1 = A.y + (dy / d) * r, x2 = B.x - (dx / d) * (r + (directed ? 3 : 0)), y2 = B.y - (dy / d) * (r + (directed ? 3 : 0))
    const ln = s('line', { x1, y1, x2, y2, class: 'edge ' + (cls || ''), 'marker-end': directed ? `url(#${mid})` : null })
    gE.appendChild(ln)
    if (edgeLabel) { const t = edgeLabel(u, v); if (t != null) gE.appendChild(s('text', { x: (A.x + B.x) / 2 + 6, y: (A.y + B.y) / 2 - 6, class: 'lbl', text: t })) }
    edgeEl[`${u}-${v}`] = ln; edgeEl[`${v}-${u}`] = edgeEl[`${v}-${u}`] || ln
  })
  Object.entries(pos).forEach(([i, p]) => {
    const g = s('g', { class: 'node' + (onNode ? ' clickable' : ''), transform: `translate(${p.x},${p.y})`, tabindex: onNode ? 0 : null, role: onNode ? 'button' : null, 'aria-label': onNode ? `節点 ${i}` : null })
    g.append(s('circle', { r }), s('text', { text: labels ? labels(+i) : i }))
    if (onNode) {
      g.addEventListener('click', () => onNode(+i))
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNode(+i) } })
    }
    gN.appendChild(g)
    nodeEl[i] = g
  })
  return { svg, nodeEl, edgeEl, gE, gN }
}

export function setNodeClass(nodeEl, fn) {
  Object.entries(nodeEl).forEach(([i, g]) => { g.setAttribute('class', 'node ' + (fn(+i) || '') + (g.classList.contains('clickable') ? ' clickable' : '')) })
}
