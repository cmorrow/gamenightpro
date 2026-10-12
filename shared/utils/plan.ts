// The one paid plan as visitors see it on the public pages. What a customer is actually
// charged comes from the Stripe Price the billing API uses, so change both together.
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
