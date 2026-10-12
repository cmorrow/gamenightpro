import { z } from 'zod'

const bodySchema = z.object({ password: passwordSchema })

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { password } = await readValidatedBody(event, bodySchema.parse)
  const user = await getUserById(getRouterParam(event, 'id')!)
  if (!user) throw createError({ statusCode: 404, statusMessage: 'User not found' })

  user.passwordHash = await hashPassword(password)
  user.mustChangePassword = true
  user.failedLogins = 0
  user.lockedUntil = null
  await saveUser(user)
  return { ok: true }
})
