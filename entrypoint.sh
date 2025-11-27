#!/bin/sh
set -e

echo "[OCR] Iniciando Entrypoint..."

node dist/scripts/init-db.js

node dist/scripts/migrate.js

node dist/scripts/create-admin.js

exec "$@"