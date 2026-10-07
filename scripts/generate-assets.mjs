// Gera imagens SVG determinísticas (locais) para os NFTs e avatares dos criadores.
import { mkdirSync, writeFileSync } from 'node:fs'

const rand = (seed) => () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296)
const hsl = (h, s, l) => `hsl(${Math.round(h)} ${s}% ${l}%)`

function art(i, variant) {
  const r = rand(i * 977 + variant * 131 + 7)
  const h = r() * 360
  const shapes = Array.from({ length: 6 }, () => {
    const c = hsl(h + r() * 90, 80, 45 + r() * 25)
    const t = r()
    const x = r() * 800, y = r() * 800, s = 80 + r() * 260
    return t < 0.5
      ? `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${s.toFixed(0)}" fill="${c}" opacity=".75"/>`
      : `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${s.toFixed(0)}" height="${(s * 0.7).toFixed(0)}" rx="40" fill="${c}" opacity=".7" transform="rotate(${(r() * 90).toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})"/>`
  }).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${hsl(h, 70, 18)}"/><stop offset="1" stop-color="${hsl(h + 60, 70, 32)}"/></linearGradient></defs><rect width="800" height="800" fill="url(#g)"/>${shapes}</svg>`
}

mkdirSync('public/nfts', { recursive: true })
mkdirSync('public/avatars', { recursive: true })
for (let i = 1; i <= 40; i++) for (let v = 1; v <= 3; v++) writeFileSync(`public/nfts/nft-${String(i).padStart(2, '0')}-${v}.svg`, art(i, v))
for (let i = 1; i <= 6; i++) {
  const h = (i * 57) % 360
  writeFileSync(`public/avatars/creator-${i}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${hsl(h, 65, 40)}"/><circle cx="32" cy="26" r="11" fill="${hsl(h, 60, 80)}"/><path d="M10 64c2-16 14-20 22-20s20 4 22 20z" fill="${hsl(h, 60, 80)}"/></svg>`)
}
console.log('assets gerados')
