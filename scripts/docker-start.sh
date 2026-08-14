#!/bin/sh
set -e

echo "Running database migrations..."
tsx src/lib/db/migrate.ts

# If database is fresh (no users), run initial data import
USER_COUNT=$(node -e "
const Database = require('better-sqlite3');
const db = new Database(process.env.DATABASE_PATH || '/app/data/health.db');
const row = db.prepare('SELECT count(*) as c FROM users').get();
console.log(row.c);
db.close();
")

if [ "$USER_COUNT" = "0" ] && [ -f "/app/data/directus-dump.json" ]; then
  echo "Empty database detected — importing seed data..."
  tsx scripts/import-data.ts
  echo "Seed data imported."
fi

echo "Starting server..."
exec node server.js
