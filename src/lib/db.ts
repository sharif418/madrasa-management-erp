import { PrismaClient } from '@prisma/client'

// Bump this version when the Prisma schema changes to force a fresh client
// in the dev server's cached global. Without this, the running dev server
// would keep using the old PrismaClient (pre-schema-change) that lacks the
// new models, causing `db.<newModel>` to be `undefined`.
const PRISMA_CACHE_VERSION = 'task47-seatplan-2025-01'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  __prismaCacheVersion?: string
}

// If the schema version changed, drop the cached client so a fresh one is
// created with the latest generated Prisma Client.
if (globalForPrisma.__prismaCacheVersion !== PRISMA_CACHE_VERSION) {
  globalForPrisma.prisma = undefined
  globalForPrisma.__prismaCacheVersion = PRISMA_CACHE_VERSION
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db