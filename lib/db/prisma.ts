/**
 * Prisma Client Singleton for Next.js
 *
 * This ensures we don't create multiple Prisma Client instances during development
 * with hot reloading, which can exhaust database connections.
 *
 * Usage:
 * import { prisma } from '@/lib/db/prisma'
 *
 * const users = await prisma.user_roles.findMany()
 */

import { PrismaClient } from '@/lib/generated/prisma'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Graceful shutdown
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}
