#!/bin/sh
echo "Starting application setup..."
echo "Running Prisma migrations..."
npx prisma db push --accept-data-loss --skip-generate

echo "Starting Next.js server..."
exec node server.js
