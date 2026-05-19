#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <backup.sql> [db_name]"
  exit 1
fi

SQL_FILE="$1"
DB_NAME="${2:-novel_agent}"

if [[ ! -f "${SQL_FILE}" ]]; then
  echo "[restore] file not found: ${SQL_FILE}"
  exit 1
fi

echo "[restore] this will overwrite database: ${DB_NAME}"
read -r -p "Type YES to continue: " CONFIRM
if [[ "${CONFIRM}" != "YES" ]]; then
  echo "[restore] canceled"
  exit 1
fi

echo "[restore] recreating database: ${DB_NAME}"
docker compose exec -T mysql mysql -uroot -proot -e "DROP DATABASE IF EXISTS ${DB_NAME}; CREATE DATABASE ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"

echo "[restore] importing ${SQL_FILE} -> ${DB_NAME}"
docker compose exec -T mysql mysql -uroot -proot "${DB_NAME}" < "${SQL_FILE}"

echo "[restore] done"
