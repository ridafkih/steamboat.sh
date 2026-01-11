#!/bin/sh
set -e

cd /app/packages/database
bun drizzle-kit migrate
cd /app
exec bun packages/api/dist/index.js
