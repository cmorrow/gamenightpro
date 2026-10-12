import { z } from 'zod'

const bodySchema = z.object({
  email: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(200),
})

// One generic message so the response never reveals whether an email exists.
const INVALID = 'Incorrect email or password'

export default defineEventHandler(async (event) => {
  const { email, password } = await readValidatedBody(event, bodySchema.parse)
  await ensureSeedAdmin()

  const user = await getUserByEmail(email)
  if (!user) {
    await hashPassword(password) // keep timing similar to a real check
    throw createError({ statusCode: 401, statusMessage: INVALID })
  }

  if (user.lockedUntil && user.lockedUntil > Date.now()) {
    throw createError({ statusCode: 423, statusMessage: 'Too many attempts. Try again in a few minutes.' })
  }

  if (!(await verifyPassword(user.passwordHash, password))) {
    user.failedLogins += 1
    if (user.failedLogins >= MAX_FAILED_LOGINS) {
      user.lockedUntil = Date.now() + LOCKOUT_MS
      user.failedLogins = 0
    }
    await saveUser(user)
    throw createError({ statusCode: 401, statusMessage: INVALID })
  }

  if (user.failedLogins || user.lockedUntil) {
    user.failedLogins = 0
    user.lockedUntil = null
    await saveUser(user)
  }

  await replaceUserSession(event, { user: toSessionUser(user), loggedInAt: Date.now() })
  return { user: toSessionUser(user) }
})
