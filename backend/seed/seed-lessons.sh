#!/usr/bin/env bash
# Nạp dữ liệu mẫu (25 chủ đề, ~1.700 bài, ~45.000 câu) vào Postgres.
# Mặc định nạp vào container "postgres" của compose.yaml; đặt DATABASE_URL để nạp DB khác.
# Chạy lại an toàn: các câu lệnh dùng ON CONFLICT DO UPDATE.
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

for f in 01_topics_lessons.sql.gz 02_sentences.sql.gz; do
  echo "Nạp $f ..."
  gzip -dc "$f" | run_psql
done
echo "Xong."
