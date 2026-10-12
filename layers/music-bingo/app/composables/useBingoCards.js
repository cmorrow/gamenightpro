import { ref } from 'vue'

export const CELL_TEXT_LIMIT = {
  4: { title: 45, sub: 45 },
  5: { title: 45, sub: 45 },
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function useBingoCards() {
  const cards = ref([])
  const error = ref('')

  function getFreeIndex(gridSize) {
    if (gridSize % 2 === 1) return Math.floor((gridSize * gridSize) / 2)
    const mid = gridSize / 2 - 1
    return mid * gridSize + mid
  }

  function generateCards(items, { count = 1, hasFreeSpace = true, gridSize = 5 } = {}) {
    error.value = ''
    const seen = new Set()
    const pool = items.reduce((acc, item) => {
      const text = String(item?.text ?? '')
      const sub = String(item?.sub ?? '')
      const key = `${text}\0${sub}`
      if (text && !seen.has(key)) {
        seen.add(key)
        acc.push({ text, sub })
      }
      return acc
    }, [])

    const total = gridSize * gridSize
    const includeFree = gridSize === 5 && hasFreeSpace
    const required = includeFree ? total - 1 : total

    if (pool.length < required) {
      error.value = `Need at least ${required} unique items. You provided ${pool.length}.`
      return
    }

    cards.value = Array.from({ length: count }, () => {
      const selected = shuffle(pool).slice(0, required)
      if (includeFree) {
        selected.splice(getFreeIndex(gridSize), 0, { text: 'FREE', sub: '' })
      }
      return selected
    })
  }

  function clearCards() {
    cards.value = []
    error.value = ''
  }

  return { cards, error, generateCards, clearCards }
}
