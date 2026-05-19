#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${1:-novel_agent}"
OUT_DIR="${2:-./backups}"
TS="$(date +%Y%m%d_%H%M%S)"
OUT_FILE="${OUT_DIR}/${DB_NAME}_${TS}.sql"

mkdir -p "${OUT_DIR}"

echo "[backup] dumping ${DB_NAME} -> ${OUT_FILE}"
docker compose exec -T mysql mysqldump -uroot -proot --single-transaction --routines --triggers "${DB_NAME}" > "${OUT_FILE}"

echo "[backup] done: ${OUT_FILE}"
