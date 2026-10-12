import { z } from 'zod'

const bodySchema = z.object({
  email: emailSchema,
  name: z.string().trim().min(1, 'Enter a name').max(100),
  role: z.enum(['admin', 'host']).default('host'),
  password: passwordSchema,
})

// Admin creates an account with a temporary password; the user must change it on first sign-in.
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const user = await createUser({ ...body, mustChangePassword: true })
  return toPublicUser(user)
})
