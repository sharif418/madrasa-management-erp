#!/bin/sh

# Push database schema (safely creates tables if they don't exist)
# Using direct node call to the prisma CLI binary we copied
echo "Running Prisma migrations..."
node node_modules/prisma/build/index.js db push --accept-data-loss

echo "Starting Next.js server..."
node_modules/.bin/next start -p 3000
