export default defineEventHandler(async (event) => {
  const tenantId = await requireTenant(event)
  const id = readPlaylistId(event)
  const body = await readBody(event)
  if (!body || typeof body !== 'object' || Array.isArray(body) || !Array.isArray(body.tracks)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid playlist' })
  }
  const playlist = { ...body, id, updatedAt: new Date().toISOString() }
  if (JSON.stringify(playlist).length > MAX_PLAYLIST_CHARS) {
    throw createError({ statusCode: 413, statusMessage: 'Playlist is too large to save' })
  }
  await useStorage('db').setItem(playlistKey(tenantId, id), playlist)
  return { ok: true }
})
