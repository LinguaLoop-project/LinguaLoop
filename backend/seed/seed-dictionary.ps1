# Nạp từ điển (~157.600 từ) vào Postgres. Cần V1 đã chạy.
# Mặc định nạp vào container "postgres" của compose.yaml; đặt $env:DATABASE_URL để nạp DB khác.
# Chạy lại an toàn: INSERT ... ON CONFLICT DO NOTHING, không nạp trùng.
# Lưu UTF-8 có BOM: Windows PowerShell 5.1 đọc tệp .ps1 không BOM bằng bảng mã ANSI nên chữ có dấu bị vỡ.
$ErrorActionPreference = "Stop"
$here = $PSScriptRoot
$env:PGCLIENTENCODING = "UTF8"

function Invoke-Sql([string[]]$psqlArgs) {
    if ($env:DATABASE_URL) {
        psql $env:DATABASE_URL @psqlArgs
    } else {
        docker compose -f (Join-Path $here "..\compose.yaml") exec -T -e PGCLIENTENCODING=UTF8 postgres psql -U lingualoop -d lingualoop @psqlArgs
    }
}

foreach ($name in "dictionary-words.sql.gz", "dictionary-pos-pronunciations.sql.gz") {
    Write-Host "Nạp $name ..."
    $tmp = Join-Path ([IO.Path]::GetTempPath()) ([IO.Path]::GetFileNameWithoutExtension($name))
    $in = [IO.File]::OpenRead((Join-Path $here $name))
    $gz = New-Object IO.Compression.GZipStream($in, [IO.Compression.CompressionMode]::Decompress)
    $out = [IO.File]::Create($tmp)
    $gz.CopyTo($out); $out.Close(); $gz.Close(); $in.Close()
    $remote = "/tmp/" + [IO.Path]::GetFileName($tmp)
    try {
        if ($env:DATABASE_URL) {
            psql $env:DATABASE_URL -v ON_ERROR_STOP=1 -q -f $tmp
        } else {
            # Không đưa dữ liệu qua pipe của PowerShell: 5.1 mã hoá pipe bằng ASCII khi chưa chỉnh $OutputEncoding, làm mọi
            # chữ có dấu và IPA thành "?" mà không báo lỗi gì. Chép tệp vào container rồi psql -f ngay trong đó.
            $compose = Join-Path $here "..\compose.yaml"
            docker compose -f $compose cp $tmp "postgres:$remote"
            if ($LASTEXITCODE -ne 0) { throw "Không chép được $name vào container" }
            docker compose -f $compose exec -T -e PGCLIENTENCODING=UTF8 postgres psql -U lingualoop -d lingualoop -v ON_ERROR_STOP=1 -q -f $remote
        }
        if ($LASTEXITCODE -ne 0) { throw "psql thất bại ($name)" }
    } finally {
        Remove-Item $tmp -ErrorAction SilentlyContinue
        if (-not $env:DATABASE_URL) {
            docker compose -f (Join-Path $here "..\compose.yaml") exec -T postgres rm -f $remote 2>$null | Out-Null
        }
    }
}

# Kiểm tra: nghĩa tiếng Việt có dấu còn nguyên (mã hoá hỏng thì thành "?" mà seed vẫn "thành công").
$ok = Invoke-Sql @("-At", "-c", "SELECT count(*) FROM dictionary_words WHERE meanings::text ~ '[^-]'")
if ([int]($ok | Select-Object -First 1) -le 0) {
    throw "Seed đã nạp nhưng mất hết ký tự ngoài ASCII (tiếng Việt, IPA): bị hỏng mã hoá. Kiểm tra lại cách chạy script."
}
Write-Host "Xong."
