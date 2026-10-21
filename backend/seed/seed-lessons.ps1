# Nạp dữ liệu mẫu (25 chủ đề, ~1.700 bài, ~45.000 câu) vào Postgres.
# Mặc định nạp vào container "postgres" của compose.yaml; đặt $env:DATABASE_URL để nạp DB khác.
# Chạy lại an toàn: các câu lệnh dùng ON CONFLICT DO UPDATE.
$ErrorActionPreference = "Stop"
$here = $PSScriptRoot
# Windows PowerShell 5.1 gửi dữ liệu qua pipe bằng ASCII, làm chữ có dấu và IPA thành "?" trong DB.
$OutputEncoding = New-Object System.Text.UTF8Encoding($false)
$env:PGCLIENTENCODING = "UTF8"

foreach ($name in "01_topics_lessons.sql.gz", "02_sentences.sql.gz") {
    Write-Host "Nạp $name ..."
    $tmp = Join-Path ([IO.Path]::GetTempPath()) ([IO.Path]::GetFileNameWithoutExtension($name))
    $in = [IO.File]::OpenRead((Join-Path $here $name))
    $gz = New-Object IO.Compression.GZipStream($in, [IO.Compression.CompressionMode]::Decompress)
    $out = [IO.File]::Create($tmp)
    $gz.CopyTo($out); $out.Close(); $gz.Close(); $in.Close()
    try {
        if ($env:DATABASE_URL) {
            psql $env:DATABASE_URL -v ON_ERROR_STOP=1 -q -f $tmp
        } else {
            $compose = Join-Path $here "..\compose.yaml"
            Get-Content $tmp -Raw -Encoding UTF8 |
                docker compose -f $compose exec -T -e PGCLIENTENCODING=UTF8 postgres psql -U lingualoop -d lingualoop -v ON_ERROR_STOP=1 -q
        }
        if ($LASTEXITCODE -ne 0) { throw "psql thất bại ($name)" }
    } finally { Remove-Item $tmp -ErrorAction SilentlyContinue }
}
Write-Host "Xong."
