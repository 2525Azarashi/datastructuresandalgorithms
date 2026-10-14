// Hero: 16 個のノードが「配列 → スタック → 循環キュー → 2分木 → グラフ」へと
// 形を変え続ける。ひとつのデータが「規則（組織化）」によって姿を変える＝データ構造。
export function heroCanvas(canvas, onShape) {
  const ctx = canvas.getContext('2d')
  const N = 15
  let W = 0, H = 0, dpr = 1
  const mouse = { x: -9999, y: -9999 }
  let wide = false
  const nodes = Array.from({ length: N }, (_, i) => ({ x: 0, y: 0, tx: 0, ty: 0, v: [3, 8, 43, 15, 6, 12, 5, 9, 21, 2, 17, 11, 30, 7, 1][i] }))
  const SHAPES = ['ARRAY', 'STACK', 'QUEUE', 'TREE', 'GRAPH']
  let shape = 0, edges = [], t0 = performance.now(), raf, scanT = 0

  function layout() {
    wide = W > 1000
    const cx = wide ? W * 0.79 : W * 0.5
    const cy = wide ? H * 0.42 : H * 0.2
    const S = wide ? Math.min(W * 0.14, H * 0.28) : Math.min(W * 0.36, H * 0.14)
    const name = SHAPES[shape]
    edges = []
    if (name === 'ARRAY') {
      const gap = Math.min(wide ? 30 : 26, (W * 0.9) / N)
      nodes.forEach((n, i) => { n.tx = cx + (i - (N - 1) / 2) * gap; n.ty = cy })
      for (let i = 0; i < N - 1; i++) edges.push([i, i + 1, 'line'])
    } else if (name === 'STACK') {
      const gap = Math.min(26, S * 1.6 / N)
      nodes.forEach((n, i) => { n.tx = cx + Math.sin(i * 0.5) * 2; n.ty = cy + (N - 1) * gap / 2 - i * gap })
      for (let i = 0; i < N - 1; i++) edges.push([i, i + 1, 'line'])
    } else if (name === 'QUEUE') {
      nodes.forEach((n, i) => { const a = (i / N) * Math.PI * 2 - Math.PI / 2; n.tx = cx + Math.cos(a) * S * 0.72; n.ty = cy + Math.sin(a) * S * 0.72 })
      for (let i = 0; i < N; i++) edges.push([i, (i + 1) % N, 'arc'])
    } else if (name === 'TREE') {
      nodes.forEach((n, i) => {
        const d = Math.floor(Math.log2(i + 1)), first = 2 ** d - 1, cnt = 2 ** d
        const k = i - first
        n.tx = cx + ((k + 0.5) / cnt - 0.5) * S * 2.1
        n.ty = cy - S * 0.75 + d * S * 0.5
        if (i > 0) edges.push([Math.floor((i - 1) / 2), i, 'line'])
      })
    } else {
      // graph: 5 inner + 10 outer (fullerene-like), with chords
      nodes.forEach((n, i) => {
        if (i < 5) { const a = (i / 5) * Math.PI * 2 - Math.PI / 2; n.tx = cx + Math.cos(a) * S * 0.38; n.ty = cy + Math.sin(a) * S * 0.38 }
        else { const k = i - 5, a = (k / 10) * Math.PI * 2 - Math.PI / 2 - Math.PI / 10; const r = S * (k % 2 ? 0.95 : 0.8); n.tx = cx + Math.cos(a) * r; n.ty = cy + Math.sin(a) * r }
      })
      for (let i = 0; i < 5; i++) { edges.push([i, (i + 1) % 5, 'line']); edges.push([i, 5 + 2 * i + 1, 'line']) }
      for (let k = 0; k < 10; k++) edges.push([5 + k, 5 + ((k + 1) % 10), 'line'])
    }
    onShape?.(name, shape)
  }
  function resize() {
    dpr = Math.min(2, devicePixelRatio || 1)
    W = canvas.clientWidth; H = canvas.clientHeight
    canvas.width = W * dpr; canvas.height = H * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    layout()
  }
  function first() { resize(); nodes.forEach((n) => { n.x = n.tx + (Math.random() - .5) * 40; n.y = n.ty + (Math.random() - .5) * 40 }) }

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  function frame(now) {
    if (!started) { raf = requestAnimationFrame(frame); return }
    if (!reduce && now - t0 > 3600) { shape = (shape + 1) % SHAPES.length; t0 = now; layout(); scanT = 0 }
    scanT += 0.016
    ctx.clearRect(0, 0, W, H)
    for (const n of nodes) {
      let fx = (n.tx - n.x) * 0.075, fy = (n.ty - n.y) * 0.075
      const dx = n.x - mouse.x, dy = n.y - mouse.y, d2 = dx * dx + dy * dy
      if (d2 < 140 * 140) { const f = (1 - Math.sqrt(d2) / 140) * 6; const d = Math.sqrt(d2) || 1; fx += (dx / d) * f; fy += (dy / d) * f }
      n.x += fx; n.y += fy
    }
    // edges
    ctx.lineWidth = 1.2
    edges.forEach(([a, b], k) => {
      const A = nodes[a], B = nodes[b]
      ctx.strokeStyle = 'rgba(233,230,223,0.22)'
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke()
    })
    // a travelling "pointer" pulse along edges (= アルゴリズムがデータ構造を辿る)
    const pi = Math.floor(scanT * 2.2) % Math.max(1, edges.length)
    const pf = (scanT * 2.2) % 1
    if (edges[pi]) {
      const [a, b] = edges[pi], A = nodes[a], B = nodes[b]
      const x = A.x + (B.x - A.x) * pf, y = A.y + (B.y - A.y) * pf
      const g = ctx.createRadialGradient(x, y, 0, x, y, 26)
      g.addColorStop(0, 'rgba(255,181,71,.55)'); g.addColorStop(1, 'rgba(255,181,71,0)')
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = 'rgba(255,181,71,.9)'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(x, y); ctx.stroke()
    }
    // nodes
    const visited = new Set(); for (let k = 0; k <= pi && k < edges.length; k++) { visited.add(edges[k][0]); visited.add(edges[k][1]) }
    const R = wide ? 13 : 10
    nodes.forEach((n, i) => {
      const isCur = edges[pi] && edges[pi][0] === i
      ctx.beginPath(); ctx.arc(n.x, n.y, R, 0, Math.PI * 2)
      ctx.fillStyle = isCur ? '#ffb547' : visited.has(i) ? 'rgba(90,216,255,.14)' : '#151a22'
      ctx.fill()
      ctx.lineWidth = 1.3
      ctx.strokeStyle = isCur ? '#ffb547' : visited.has(i) ? 'rgba(90,216,255,.8)' : 'rgba(233,230,223,.35)'
      ctx.stroke()
      ctx.fillStyle = isCur ? '#111' : '#ece9e2'
      ctx.font = `500 ${wide ? 10.5 : 8.5}px "JetBrains Mono", monospace`
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(n.v, n.x, n.y + .5)
    })
    raf = requestAnimationFrame(frame)
  }
  const mm = (e) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top }
  const ml = () => { mouse.x = mouse.y = -9999 }
  const click = () => { shape = (shape + 1) % SHAPES.length; t0 = performance.now(); layout(); scanT = 0 }
  canvas.addEventListener('pointermove', mm)
  canvas.addEventListener('pointerleave', ml)
  canvas.addEventListener('click', click)
  let started = false
  const ro = new ResizeObserver(() => { if (!canvas.clientWidth) return; if (!started) { started = true; first() } else resize() })
  ro.observe(canvas)
  raf = requestAnimationFrame(frame)
  return {
    set(i) { shape = i; t0 = performance.now(); layout(); scanT = 0 },
    destroy() { cancelAnimationFrame(raf); ro.disconnect() },
  }
}
