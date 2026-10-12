// The one paid plan. Public pages and the billing API both read from here, so a price
// change is one edit. The Stripe Price id is configured on the server (see
// server/api/billing/start-trial.post.ts); this file only holds what visitors see.
export const PLAN = {
  name: 'GameNight Pro',
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

export function formatPrice(amount: number, currency: string = PLAN.currency) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}
