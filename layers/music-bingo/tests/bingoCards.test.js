import { describe, it, expect, afterAll } from 'vitest'
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { useBingoCards } from '../app/composables/useBingoCards.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PLAYLIST_DIR = resolve(__dirname, '../app/data/playlists')
const REPORTS_DIR = resolve(__dirname, 'reports')

const CARDS_PER_PLAYLIST = 10
const GRID_SIZES = [5, 4]

// ── helpers ──────────────────────────────────────────────────────────────────

function loadPlaylists() {
  return readdirSync(PLAYLIST_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(readFileSync(resolve(PLAYLIST_DIR, f), 'utf-8')))
    .filter(p => Array.isArray(p.tracks) && p.tracks.length > 0)
}

function buildItems(playlist) {
  return playlist.tracks.map(t => ({ text: t.name, sub: t.artist }))
}

function freeIndex(gridSize) {
  if (gridSize % 2 === 1) return Math.floor((gridSize * gridSize) / 2)
  const mid = gridSize / 2 - 1
  return mid * gridSize + mid
}

function cardAsGrid(card, gridSize) {
  const rows = []
  for (let r = 0; r < gridSize; r++) {
    rows.push(card.slice(r * gridSize, r * gridSize + gridSize))
  }
  return rows
}

// ── markdown report builder ───────────────────────────────────────────────────

function buildReport(playlist, results) {
  const lines = []
  const safeName = (playlist.id || playlist.title).replace(/[^a-z0-9]+/gi, '-').toLowerCase()

  lines.push(`# ${playlist.title}`)
  lines.push('')
  lines.push(`**Playlist ID:** \`${playlist.id || safeName}\`  `)
  lines.push(`**Total tracks:** ${playlist.tracks.length}  `)
  lines.push(`**Cards generated per grid size:** ${CARDS_PER_PLAYLIST}  `)
  lines.push(`**Generated:** ${new Date().toLocaleString()}`)
  lines.push('')
  lines.push('---')
  lines.push('')

  for (const { gridSize, hasFreeSpace, cards } of results) {
    const label = `${gridSize}×${gridSize}${hasFreeSpace ? ' with FREE' : ''}`
    lines.push(`## ${label}`)
    lines.push('')

    // summary table
    lines.push('| Card | Unique songs | Tiles | FREE at center |')
    lines.push('|------|-------------|-------|----------------|')
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i]
      const nonFree = card.filter(c => c.text !== 'FREE')
      const uniqueCount = new Set(nonFree.map(c => c.text)).size
      const total = card.length
      const expectedFreeIdx = freeIndex(gridSize)
      const freeOk = hasFreeSpace ? card[expectedFreeIdx]?.text === 'FREE' : '—'
      const dupeWarning = uniqueCount < nonFree.length ? ' ⚠️ DUPES' : ''
      lines.push(`| ${i + 1} | ${uniqueCount}${dupeWarning} | ${total} | ${freeOk} |`)
    }
    lines.push('')

    // full card grids
    for (let i = 0; i < cards.length; i++) {
      lines.push(`### Card ${i + 1}`)
      lines.push('')
      const grid = cardAsGrid(cards[i], gridSize)

      // markdown table header
      const header = Array.from({ length: gridSize }, (_, c) =>
        gridSize === 5 ? ['B', 'I', 'N', 'G', 'O'][c] : String(c + 1)
      )
      lines.push(`| ${header.join(' | ')} |`)
      lines.push(`|${header.map(() => '---').join('|')}|`)

      for (const row of grid) {
        const cells = row.map(c => {
          if (c.text === 'FREE') return '**FREE**'
          const sub = c.sub ? ` *(${c.sub})*` : ''
          return `${c.text}${sub}`
        })
        lines.push(`| ${cells.join(' | ')} |`)
      }
      lines.push('')
    }

    lines.push('---')
    lines.push('')
  }

  return lines.join('\n')
}

// ── tests ────────────────────────────────────────────────────────────────────

const playlists = loadPlaylists()
const reportData = [] // collected per playlist for afterAll

describe('Bingo card generation — all playlists', () => {
  for (const playlist of playlists) {
    const items = buildItems(playlist)

    describe(playlist.title, () => {
      const playlistResults = []

      for (const gridSize of GRID_SIZES) {
        const hasFreeSpace = gridSize === 5  // only 5×5 gets FREE tile
        const totalCells = gridSize * gridSize
        const required = hasFreeSpace ? totalCells - 1 : totalCells

        if (items.length < required) {
          it.skip(`${gridSize}×${gridSize} — skipped (only ${items.length} tracks, need ${required})`, () => {})
          continue
        }

        describe(`${gridSize}×${gridSize}${hasFreeSpace ? ' with FREE tile' : ''}`, () => {
          const { cards, error, generateCards } = useBingoCards()
          generateCards(items, { count: CARDS_PER_PLAYLIST, hasFreeSpace, gridSize })

          it('generates without error', () => {
            expect(error.value).toBe('')
          })

          it(`produces exactly ${CARDS_PER_PLAYLIST} cards`, () => {
            expect(cards.value).toHaveLength(CARDS_PER_PLAYLIST)
          })

          it(`each card has ${totalCells} tiles`, () => {
            for (const card of cards.value) {
              expect(card).toHaveLength(totalCells)
            }
          })

          it('no card contains a duplicate song', () => {
            for (let i = 0; i < cards.value.length; i++) {
              const nonFree = cards.value[i].filter(c => c.text !== 'FREE')
              const titles = nonFree.map(c => c.text)
              const unique = new Set(titles)
              expect(unique.size, `Card ${i + 1} has duplicate songs: ${[...titles].filter((t, idx) => titles.indexOf(t) !== idx).join(', ')}`).toBe(titles.length)
            }
          })

          if (hasFreeSpace) {
            it('FREE tile is at the center position', () => {
              const expected = freeIndex(gridSize)
              for (let i = 0; i < cards.value.length; i++) {
                expect(cards.value[i][expected]?.text, `Card ${i + 1}: FREE not at index ${expected}`).toBe('FREE')
              }
            })

            it('exactly one FREE tile per card', () => {
              for (let i = 0; i < cards.value.length; i++) {
                const freeCount = cards.value[i].filter(c => c.text === 'FREE').length
                expect(freeCount, `Card ${i + 1} has ${freeCount} FREE tiles`).toBe(1)
              }
            })
          }

          it('all 10 cards have different song orderings', () => {
            const fingerprints = cards.value.map(card =>
              card.filter(c => c.text !== 'FREE').map(c => c.text).join('|')
            )
            const uniqueFingerprints = new Set(fingerprints)
            // With 10 shuffles from a deck of 38+ songs, all should be unique
            expect(uniqueFingerprints.size).toBe(CARDS_PER_PLAYLIST)
          })

          it('all songs on each card come from the playlist', () => {
            const validTitles = new Set(items.map(i => i.text))
            for (let i = 0; i < cards.value.length; i++) {
              for (const cell of cards.value[i]) {
                if (cell.text === 'FREE') continue
                expect(validTitles.has(cell.text), `Card ${i + 1}: "${cell.text}" not in playlist`).toBe(true)
              }
            }
          })

          // stash for report
          afterAll(() => {
            playlistResults.push({ gridSize, hasFreeSpace, cards: cards.value })
          })
        })
      }

      afterAll(() => {
        reportData.push({ playlist, results: playlistResults })
      })
    })
  }
})

// ── write markdown reports after all tests ────────────────────────────────────

afterAll(() => {
  mkdirSync(REPORTS_DIR, { recursive: true })

  for (const { playlist, results } of reportData) {
    if (!results.length) continue
    const safeName = (playlist.id || playlist.title).replace(/[^a-z0-9]+/gi, '-').toLowerCase()
    const md = buildReport(playlist, results)
    const outPath = resolve(REPORTS_DIR, `${safeName}.md`)
    writeFileSync(outPath, md, 'utf-8')
  }

  // index file linking all reports
  const index = [
    '# Bingo Card Generation Reports',
    '',
    `Generated: ${new Date().toLocaleString()}`,
    '',
    '| Playlist | Tracks | Report |',
    '|---------|--------|--------|',
    ...reportData.map(({ playlist }) => {
      const safeName = (playlist.id || playlist.title).replace(/[^a-z0-9]+/gi, '-').toLowerCase()
      return `| ${playlist.title} | ${playlist.tracks.length} | [${safeName}.md](./${safeName}.md) |`
    }),
  ].join('\n')
  writeFileSync(resolve(REPORTS_DIR, 'index.md'), index, 'utf-8')
})
