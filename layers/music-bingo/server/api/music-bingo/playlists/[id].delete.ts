// Stores a marker rather than removing the key, so deleting a library playlist hides it for this host.
export default defineEventHandler(async (event) => {
  const tenantId = await requireTenant(event)
  const id = readPlaylistId(event)
  await useStorage('db').setItem(playlistKey(tenantId, id), { id, deleted: true, updatedAt: new Date().toISOString() })
  return { ok: true }
})
