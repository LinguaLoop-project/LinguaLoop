#!/usr/bin/env bash
# Nạp bộ từ vựng (9 bộ, ~270 phần, ~6.800 thẻ kèm phát âm) vào Postgres.
# Mặc định nạp vào container "postgres" của compose.yaml; đặt DATABASE_URL để nạp DB khác.
# Chạy lại an toàn: các câu lệnh dùng ON CONFLICT DO UPDATE. Không đụng tới tiến độ học của người dùng.
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

echo "Nạp 03_vocabulary.sql.gz ..."
gzip -dc 03_vocabulary.sql.gz | run_psql
echo "Xong."
