// Keep displayed prices in sync with the Stripe Prices configured for each plan.
export const GAME_OPTIONS = [
  { id: 'music-bingo', name: 'Music Bingo', available: true },
  { id: 'bingo', name: 'Bingo', available: false },
  { id: 'trivia', name: 'Trivia', available: false },
] as const

export type GameId = typeof GAME_OPTIONS[number]['id']
export type PlanId = 'single-game' | 'all-games'

export const PLAN = {
  id: 'all-games',
  name: 'All games',
  priceMonthly: 24.99,
  currency: 'USD',
  trialDays: 7,
  includes: [
    'Music Bingo, Bingo and Trivia',
    'Unlimited games, players and printed cards',
    'Audience screen for any TV or projector',
    'Works offline once your event is prepared',
    'Import playlists from Spotify and YouTube',
    'Cancel anytime from your account',
  ],
} as const

export const SINGLE_GAME_PLAN = {
  id: 'single-game',
  name: 'Music Bingo Monthly',
  priceMonthly: 14.99,
  currency: 'USD',
  trialDays: PLAN.trialDays,
  includes: [
    'Unlimited Music Bingo events',
    'Unlimited players at every event',
    'Unlimited printable cards for every game',
    'No caps, per-event fees or overages',
    'Audience screen for any TV or projector',
    'Prepare at home and host offline',
    'Import playlists from Spotify and YouTube',
    'Cancel anytime from your account',
  ],
} as const

export const PLANS = [SINGLE_GAME_PLAN, PLAN] as const

export function isPlanId(value: unknown): value is PlanId {
  return value === 'single-game' || value === 'all-games'
}

export function isGameId(value: unknown): value is GameId {
  return GAME_OPTIONS.some(game => game.id === value)
}

export function getPlan(planId?: PlanId) {
  return planId === 'single-game' ? SINGLE_GAME_PLAN : PLAN
}

export function hasGameAccess(planId: PlanId | undefined, gameId: GameId | undefined, path: string) {
  const requiredGame = GAME_OPTIONS.find(game => path === `/${game.id}` || path.startsWith(`/${game.id}/`))
  return !requiredGame || !planId || planId === 'all-games' || gameId === requiredGame.id
}

export function formatPrice(amount: number, currency: string = PLAN.currency) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}