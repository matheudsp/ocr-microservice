#!/bin/sh
set -e

echo "[OCR] Iniciando Entrypoint..."

echo "[OCR] Aguardando Postgres..."
until nc -z -v -w30 $DB_HOST $DB_PORT; do
  echo "[OCR] Aguardando conexão com banco de dados..."
  sleep 5
done

echo "[OCR] Inicializando Banco de Dados (Check/Create)..."
node dist/scripts/init-db.js

echo "[OCR] Executando Migrations do Drizzle..."
node dist/scripts/migrate.js

echo "[OCR] Verificando existência de Admin..."
node dist/scripts/create-admin.js

echo "[OCR] Iniciando a Aplicação..."
exec "$@"