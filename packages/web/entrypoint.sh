#!/bin/sh
set -e

# Replace placeholders in built JS files with actual environment variables
find /app/packages/web/dist/assets -name '*.js' -exec sed -i "s|__API_URL__|${API_URL:-http://localhost:3001}|g" {} \;

# Start the server
exec bun /app/packages/web/server.ts
