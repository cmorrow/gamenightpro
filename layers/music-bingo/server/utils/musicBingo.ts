import type { H3Event } from 'h3'

// Azure Table Storage caps a string property at 64 KB (32K UTF-16 chars).
export const MAX_PLAYLIST_CHARS = 30_000
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024

export const playlistIdPattern = /^[a-z0-9_-]{1,80}$/i
export const playlistPrefix = (tenantId: string) => `mb:playlist:${tenantId}`
export const playlistKey = (tenantId: string, id: string) => `${playlistPrefix(tenantId)}:${id}`

/** Signed-in host's tenant. Every music bingo read and write is scoped by it. */
export async function requireTenant(event: H3Event) {
  const { user } = await requireUserSession(event)
  if (!user.tenantId) throw createError({ statusCode: 403, statusMessage: 'No tenant for this account' })
  return user.tenantId
}

export function readPlaylistId(event: H3Event) {
  const id = getRouterParam(event, 'id') ?? ''
  if (!playlistIdPattern.test(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid playlist id' })
  return id
}
