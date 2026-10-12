// The host's saved playlists (edited library playlists, new ones, and deletions) keyed by id.
export default defineEventHandler(async (event) => {
  const tenantId = await requireTenant(event)
  const db = useStorage('db')
  const prefix = playlistPrefix(tenantId)
  const keys = await db.getKeys(prefix)
  const entries = await Promise.all(keys.map(async key => [key.slice(prefix.length + 1), await db.getItem(key)] as const))
  return { playlists: Object.fromEntries(entries.filter(([, value]) => value)) }
})
