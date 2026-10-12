/** Turns a $fetch error into a message a person can read. */
export function apiErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.') {
  const e = err as { data?: { statusMessage?: string, message?: string, data?: { issues?: { message: string }[] } } }
  return e?.data?.data?.issues?.[0]?.message ?? e?.data?.statusMessage ?? e?.data?.message ?? fallback
}
