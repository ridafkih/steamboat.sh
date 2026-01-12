#!/bin/sh
set -e

cd /app/packages/database
bun scripts/migrate.ts
cd /app
exec bun packages/api/dist/index.js
