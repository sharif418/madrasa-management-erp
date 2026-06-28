#!/bin/sh
echo "Starting application setup..."
echo "Running Prisma migrations..."
npx prisma db push --accept-data-loss

echo "Listing /app contents for debugging:"
ls -la /app

echo "Starting Next.js server..."
exec node server.js
