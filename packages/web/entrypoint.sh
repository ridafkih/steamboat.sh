#!/bin/sh
set -e

if [ -z "$API_URL" ]; then
  echo "Error: API_URL environment variable is required"
  exit 1
fi

find /app/packages/web/dist/assets -name '*.js' -exec sed -i "s|__API_URL__|${API_URL}|g" {} \;

exec bun /app/packages/web/server.ts
