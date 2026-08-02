export const CELL = 40

function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function generateLevel(seed, gridW, gridH) {
  const rng = mulberry32(seed)
  const grid = Array.from({ length: gridH }, () => Array(gridW).fill(0))
  const cx = Math.floor(gridW / 2)
  const cy = Math.floor(gridH / 2)

  for (let x = 0; x < gridW; x++) {
    grid[0][x] = 1
    grid[gridH - 1][x] = 1
  }
  for (let y = 0; y < gridH; y++) {
    grid[y][0] = 1
    grid[y][gridW - 1] = 1
  }

  for (let i = 0; i < 14; i++) {
    const w = 2 + Math.floor(rng() * 6)
    const h = 2 + Math.floor(rng() * 4)
    const x = 1 + Math.floor(rng() * (gridW - w - 2))
    const y = 1 + Math.floor(rng() * (gridH - h - 2))
    if (Math.abs(x + w / 2 - cx) < 4 && Math.abs(y + h / 2 - cy) < 4) continue
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        grid[y + dy][x + dx] = 1
      }
    }
  }

  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      grid[cy + dy][cx + dx] = 0
    }
  }

  const seen = new Set()
  const queue = [[cx, cy]]
  seen.add(`${cx},${cy}`)
  while (queue.length) {
    const [x, y] = queue.shift()
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      if (nx < 0 || ny < 0 || nx >= gridW || ny >= gridH) continue
      if (grid[ny][nx] !== 0) continue
      const key = `${nx},${ny}`
      if (seen.has(key)) continue
      seen.add(key)
      queue.push([nx, ny])
    }
  }

  const enemySpawns = []
  for (let y = 0; y < gridH; y++) {
    for (let x = 0; x < gridW; x++) {
      if (grid[y][x] !== 0) continue
      if (!seen.has(`${x},${y}`)) {
        grid[y][x] = 1
        continue
      }
      if (Math.hypot(x - cx, y - cy) >= 9) enemySpawns.push([x, y])
    }
  }

  return { grid, gridW, gridH, cell: CELL, spawn: [cx, cy], enemySpawns }
}
