#!/bin/sh
set -e

bun /app/packages/api/scripts/migrate.ts
cd /app
exec bun packages/api/dist/index.js
