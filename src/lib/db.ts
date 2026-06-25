import { PrismaClient } from '@prisma/client'

// Bump this version when the Prisma schema changes to force a fresh client
const PRISMA_CACHE_VERSION = 'v2-postgresql-production'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  __prismaCacheVersion?: string
}

if (globalForPrisma.__prismaCacheVersion !== PRISMA_CACHE_VERSION) {
  if (globalForPrisma.prisma) {
    globalForPrisma.prisma.$disconnect().catch(() => {})
  }
  globalForPrisma.prisma = undefined
  globalForPrisma.__prismaCacheVersion = PRISMA_CACHE_VERSION
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db