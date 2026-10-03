// Genera íconos PNG simples usando Canvas API en Node
// Correr: node generate-icons.mjs
import { createCanvas } from 'canvas'
import { writeFileSync } from 'fs'

function createIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Fondo
  ctx.fillStyle = '#0A0A0F'
  ctx.beginPath()
  ctx.roundRect(0, 0, size, size, size * 0.18)
  ctx.fill()

  // Letra "M" en indigo
  ctx.fillStyle = '#6366F1'
  ctx.font = `bold ${size * 0.6}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('M', size / 2, size / 2 + size * 0.03)

  return canvas.toBuffer('image/png')
}

for (const size of [16, 48, 128]) {
  writeFileSync(`icon${size}.png`, createIcon(size))
  console.log(`icon${size}.png creado`)
}
