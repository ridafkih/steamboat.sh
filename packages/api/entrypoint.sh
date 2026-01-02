#!/bin/sh
set -e

cd /app/packages/database
drizzle-kit migrate
cd /app
exec bun packages/api/dist/index.js
