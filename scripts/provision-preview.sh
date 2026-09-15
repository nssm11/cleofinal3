#!/usr/bin/env bash
# One-command preview recovery: deps -> env -> embedded DB -> seed -> build.
# Idempotent: every step skips when its output already exists.
# (The server itself is started separately so it stays attached to the session.)
set -euo pipefail
cd "$(dirname "$0")/.."

echo "--- [1/4] dependencies"
if [ -x node_modules/.bin/next ]; then
  echo "node_modules present, skipping install"
else
  npm install --no-audit --no-fund
fi

echo "--- [2/4] environment"
if grep -q "DATABASE_URL" .env 2>/dev/null; then
  echo ".env present, keeping it"
else
  SECRET=$(openssl rand -hex 32)
  printf 'DATABASE_URL=pglite://./data/pglite\nSESSION_SECRET=%s\nNEXT_PUBLIC_SITE_URL=http://localhost:3000\nTRUST_PROXY=true\nALLOW_FRAMING=true\n' "$SECRET" > .env
  echo ".env written (embedded PGlite database)"
fi

echo "--- [3/4] database"
mkdir -p data

# A hard-killed server (or a second PGlite instance on the same directory)
# can leave the embedded database aborted-on-open. The presence of PG_VERSION
# is not a health check — verify it answers, and re-provision if it does not.
if [ -f data/pglite/PG_VERSION ]; then
  if node --input-type=module -e "
import { PGlite } from '@electric-sql/pglite';
const db = new PGlite('./data/pglite');
await db.query('select 1');
await db.close();
" >/dev/null 2>&1; then
    echo "PGlite data present and healthy, skipping migrate+seed"
  else
    echo "PGlite data present but NOT answering — resetting and re-provisioning"
    rm -rf data/pglite
  fi
fi
if [ ! -f data/pglite/PG_VERSION ]; then
  node --input-type=module -e "
import { readFileSync, readdirSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
const files = readdirSync('drizzle').filter((f) => f.endsWith('.sql')).sort();
const db = new PGlite('./data/pglite');
for (const f of files) {
  await db.exec(readFileSync('drizzle/' + f, 'utf8'));
  console.log('applied', f);
}
await db.close();
"
  npm run db:seed
fi

echo "--- [4/4] production build"
npm run build
echo "DONE — start the server with: npm run start -- --port 3000 --hostname 0.0.0.0"
