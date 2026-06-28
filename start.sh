#!/bin/sh
node node_modules/prisma/build/index.js db push --accept-data-loss
node_modules/.bin/next start -p 3000
