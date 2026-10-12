import type { Role } from '#shared/types/auth'

export interface UserRecord {
  id: string
  tenantId: string
  email: string
  name: string
  role: Role
  passwordHash: string
  mustChangePassword: boolean
  failedLogins: number
  lockedUntil: number | null
  createdAt: string
  updatedAt: string
}

export const MAX_FAILED_LOGINS = 5
export const LOCKOUT_MS = 15 * 60 * 1000
export const MIN_PASSWORD_LENGTH = 10

const db = () => useStorage('db')
const userKey = (id: string) => `user:${id}`
const emailKey = (email: string) => `email:${normalizeEmail(email)}`

export const normalizeEmail = (email: string) => email.trim().toLowerCase()

export async function getUserById(id: string) {
  return db().getItem<UserRecord>(userKey(id))
}

export async function getUserByEmail(email: string) {
  const id = await db().getItem<string>(emailKey(email))
  return id ? getUserById(id) : null
}

export async function listUsers() {
  const keys = await db().getKeys('user')
  const users = await Promise.all(keys.map(k => db().getItem<UserRecord>(k)))
  return users.filter((u): u is UserRecord => !!u).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function saveUser(user: UserRecord) {
  user.updatedAt = new Date().toISOString()
  await db().setItem(userKey(user.id), user)
}

export async function createUser(input: { email: string, name: string, role: Role, password: string, mustChangePassword: boolean, tenantId?: string }) {
  const email = normalizeEmail(input.email)
  if (await db().hasItem(emailKey(email))) {
    throw createError({ statusCode: 409, statusMessage: 'An account with that email already exists' })
  }
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const user: UserRecord = {
    id,
    // Each host gets their own tenant; all game data will be scoped by tenantId.
    tenantId: input.tenantId ?? id,
    email,
    name: input.name.trim(),
    role: input.role,
    passwordHash: await hashPassword(input.password),
    mustChangePassword: input.mustChangePassword,
    failedLogins: 0,
    lockedUntil: null,
    createdAt: now,
    updatedAt: now,
  }
  await db().setItem(userKey(id), user)
  await db().setItem(emailKey(email), id)
  return user
}

export async function deleteUser(user: UserRecord) {
  await db().removeItem(emailKey(user.email))
  await db().removeItem(userKey(user.id))
}

export function toSessionUser(user: UserRecord) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId,
    mustChangePassword: user.mustChangePassword,
  }
}

export function toPublicUser(user: UserRecord) {
  const { passwordHash: _, ...rest } = user
  return rest
}

/** Creates the first admin when the store is empty. Safe to call on every login. */
export async function ensureSeedAdmin() {
  if ((await db().getKeys('user')).length > 0) return
  const config = useRuntimeConfig()
  const password = config.seedAdminPassword || (import.meta.dev ? 'GameNight-Admin-2026' : '')
  if (!password) {
    console.warn('[auth] No users exist and NUXT_SEED_ADMIN_PASSWORD is not set; admin not seeded.')
    return
  }
  await createUser({
    email: config.seedAdminEmail,
    name: 'Admin',
    role: 'admin',
    password,
    mustChangePassword: true,
  })
}

export async function requireAdmin(event: Parameters<typeof requireUserSession>[0]) {
  const { user } = await requireUserSession(event)
  if (user.role !== 'admin') throw createError({ statusCode: 403, statusMessage: 'Admins only' })
  return user
}
