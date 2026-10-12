export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  if (id === admin.id) throw createError({ statusCode: 400, statusMessage: 'You cannot delete your own account' })

  const user = await getUserById(id)
  if (!user) throw createError({ statusCode: 404, statusMessage: 'User not found' })
  await deleteUser(user)
  return { ok: true }
})
