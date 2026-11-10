#!/usr/bin/env bash
# Nạp bài học mẫu (25 chủ đề, 1.068 bài YouTube, ~29.700 câu) vào Postgres. Cần V1+V2 đã chạy (giáo viên hệ thống là chủ bài).
# Mặc định nạp vào container "postgres" của compose.yaml; đặt DATABASE_URL để nạp DB khác.
# Chạy lại an toàn: các câu lệnh dùng ON CONFLICT (id) DO NOTHING.
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

for f in lessons-1-topics-and-lessons.sql.gz lessons-2-sentences.sql.gz; do
  echo "Nạp $f ..."
  gzip -dc "$f" | run_psql
done
echo "Xong."
