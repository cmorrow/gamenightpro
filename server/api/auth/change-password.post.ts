import { z } from 'zod'

const bodySchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: passwordSchema,
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const { currentPassword, newPassword } = await readValidatedBody(event, bodySchema.parse)

  const user = await getUserById(session.user.id)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Account not found' })

  if (!(await verifyPassword(user.passwordHash, currentPassword))) {
    throw createError({ statusCode: 400, statusMessage: 'Current password is incorrect' })
  }
  if (currentPassword === newPassword) {
    throw createError({ statusCode: 400, statusMessage: 'Choose a password different from the current one' })
  }

  user.passwordHash = await hashPassword(newPassword)
  user.mustChangePassword = false
  await saveUser(user)

  await replaceUserSession(event, { user: toSessionUser(user), loggedInAt: Date.now() })
  return { ok: true }
})
