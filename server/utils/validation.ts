import { z } from 'zod'

export const passwordSchema = z.string()
  .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
  .max(200)

export const emailSchema = z.string().trim().email('Enter a valid email').max(254)
