export type Role = 'admin' | 'host'

declare module '#auth-utils' {
  interface User {
    id: string
    email: string
    name: string
    role: Role
    tenantId: string
    mustChangePassword: boolean
  }
}

export {}
