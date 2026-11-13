#!/usr/bin/env bash
# Nạp từ điển (~157.600 từ) vào Postgres. Cần V1 đã chạy.
# Mặc định nạp vào container "postgres" của compose.yaml; đặt DATABASE_URL để nạp DB khác.
# Chạy lại an toàn: INSERT ... ON CONFLICT DO NOTHING, không nạp trùng.
set -euo pipefail
cd "$(dirname "$0")"

run_psql() {
  if [ -n "${DATABASE_URL:-}" ]; then
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q
  else
    docker compose -f ../compose.yaml exec -T postgres \
      psql -U lingualoop -d lingualoop -v ON_ERROR_STOP=1 -q
  fi
}

for f in dictionary-words.sql.gz dictionary-pos-pronunciations.sql.gz; do
  echo "Nạp $f ..."
  gzip -dc "$f" | run_psql
done
echo "Xong."
