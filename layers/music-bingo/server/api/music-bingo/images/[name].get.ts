const TYPES: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' }

export default defineEventHandler(async (event) => {
  const tenantId = await requireTenant(event)
  const name = getRouterParam(event, 'name') ?? ''
  const ext = /^[a-z0-9_-]+\.([a-z]+)$/i.exec(name)?.[1]?.toLowerCase()
  if (!ext || !TYPES[ext]) throw createError({ statusCode: 404 })
  const bytes = await useStorage('mbfiles').getItemRaw(`${tenantId}:${name}`)
  if (!bytes) throw createError({ statusCode: 404 })
  setHeader(event, 'Content-Type', TYPES[ext])
  setHeader(event, 'Cache-Control', 'private, max-age=31536000, immutable')
  return bytes
})
