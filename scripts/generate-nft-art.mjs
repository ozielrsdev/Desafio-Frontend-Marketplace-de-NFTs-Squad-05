/**
 * Gera artes SVG determinísticas para as fixtures (public/nfts e public/creators).
 * Imagens servidas localmente (AGENTS.md §5). Rode com: node scripts/generate-nft-art.mjs
 * Substituir pelos assets do Figma quando disponíveis (registrar em ARCHITECTURE.md).
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
const NFT_COUNT = 48
const CREATOR_COUNT = 8

function mulberry32(seed) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const palettes = [
  ['#7c3aed', '#a78bfa', '#fbbf24', '#0f0f23'],
  ['#0ea5e9', '#22d3ee', '#f472b6', '#0b1026'],
  ['#f97316', '#fbbf24', '#ef4444', '#1a0f1f'],
  ['#10b981', '#34d399', '#a3e635', '#071a14'],
  ['#ec4899', '#8b5cf6', '#60a5fa', '#120b24'],
  ['#eab308', '#f59e0b', '#7c3aed', '#14110a'],
]

function nftSvg(index) {
  const rand = mulberry32(index * 7919 + 17)
  const [a, b, c, bg] = palettes[index % palettes.length]
  const shapes = []
  const count = 5 + Math.floor(rand() * 5)
  for (let i = 0; i < count; i++) {
    const color = [a, b, c][Math.floor(rand() * 3)]
    const x = Math.round(rand() * 400)
    const y = Math.round(rand() * 400)
    const r = Math.round(40 + rand() * 120)
    const opacity = (0.35 + rand() * 0.5).toFixed(2)
    if (rand() > 0.5) {
      shapes.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="${opacity}"/>`)
    } else {
      const rot = Math.round(rand() * 90)
      shapes.push(
        `<rect x="${x - r / 2}" y="${y - r / 2}" width="${r}" height="${r}" rx="${Math.round(r / 6)}" fill="${color}" opacity="${opacity}" transform="rotate(${rot} ${x} ${y})"/>`,
      )
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400"><defs><radialGradient id="g" cx="30%" cy="25%" r="90%"><stop offset="0" stop-color="${a}" stop-opacity=".55"/><stop offset="1" stop-color="${bg}"/></radialGradient><filter id="b"><feGaussianBlur stdDeviation="18"/></filter></defs><rect width="400" height="400" fill="url(#g)"/><g filter="url(#b)">${shapes.join('')}</g><g>${shapes.slice(0, 2).join('')}</g></svg>`
}

function creatorSvg(index) {
  const [a, b, , bg] = palettes[index % palettes.length]
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96"><rect width="96" height="96" fill="${bg}"/><circle cx="48" cy="38" r="18" fill="${a}"/><path d="M14 92c4-20 18-30 34-30s30 10 34 30z" fill="${b}"/></svg>`
}

function write(path, content) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
}

for (let i = 1; i <= NFT_COUNT; i++) write(join(root, 'nfts', `nft-${String(i).padStart(2, '0')}.svg`), nftSvg(i))
for (let i = 1; i <= CREATOR_COUNT; i++) write(join(root, 'creators', `creator-${i}.svg`), creatorSvg(i))
console.log(`Gerados ${NFT_COUNT} NFTs e ${CREATOR_COUNT} avatares em public/`)
