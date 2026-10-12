import { z } from 'zod'

const EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

const bodySchema = z.object({
  id: z.string().regex(playlistIdPattern),
  dataUrl: z.string().max(Math.ceil(MAX_IMAGE_BYTES * 1.4)),
})

// Playlist cover upload. Returns the URL to store in the playlist's `image` field.
export default defineEventHandler(async (event) => {
  const tenantId = await requireTenant(event)
  const { id, dataUrl } = await readValidatedBody(event, bodySchema.parse)
  const match = /^data:(image\/[a-z]+);base64,(.+)$/.exec(dataUrl)
  const [, mime = '', base64 = ''] = match ?? []
  const ext = EXTENSIONS[mime]
  if (!ext || !base64) throw createError({ statusCode: 400, statusMessage: 'Use a PNG, JPEG, WebP or GIF image' })
  const bytes = Buffer.from(base64, 'base64')
  if (bytes.length > MAX_IMAGE_BYTES) throw createError({ statusCode: 413, statusMessage: 'Image must be 2 MB or smaller' })

  // A new name per upload, so browsers can cache each image forever.
  const name = `${id}-${Date.now().toString(36)}.${ext}`
  await useStorage('mbfiles').setItemRaw(`${tenantId}:${name}`, bytes)
  return { ok: true, image: `/api/music-bingo/images/${name}` }
})
