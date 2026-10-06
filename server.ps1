# ===================================================================
# UniPass UTC2 - Local & LAN Web Server (PowerShell)
# Hỗ trợ trình bày Online trong phòng học qua mạng Wi-Fi (LAN) và máy tính này
# Không yêu cầu quyền Administrator!
# ===================================================================

$Port = 8080
$Root = Split-Path -Parent $MyInvocation.MyCommand.Definition
if (-not $Root) { $Root = (Get-Location).Path }

# Tự động tìm địa chỉ IP mạng Wi-Fi / LAN của máy tính
$LanIp = "127.0.0.1"
try {
    $ipObj = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
        $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" 
    } | Select-Object -First 1
    if ($ipObj) { $LanIp = $ipObj.IPAddress }
} catch {}

$LocalUrl = "http://localhost:" + $Port + "/"
$LanUrl   = "http://" + $LanIp + ":" + $Port + "/"

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "   UNIPASS UTC2 - MÁY CHỦ TRÌNH BÀY ONLINE & MẠNG NỘI BỘ (LAN)   " -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "   [1] TRÊN MÁY TÍNH NÀY:          $LocalUrl" -ForegroundColor Yellow
Write-Host "   [2] TRÊN ĐIỆN THOẠI CÙNG WI-FI:    $LanUrl" -ForegroundColor Cyan
Write-Host "       (Mọi người kết nối cùng Wi-Fi phòng học mở link trên để dùng chung)" -ForegroundColor Gray
Write-Host "   [3] Thư mục dự án:              $Root" -ForegroundColor Gray
Write-Host "   >> Nhấn Ctrl + C để dừng máy chủ bất kỳ lúc nào." -ForegroundColor DarkGray
Write-Host "==================================================================" -ForegroundColor Cyan

# Mở trình duyệt mặc định trên máy
try { Start-Process $LocalUrl } catch {}

# Khởi tạo TcpListener lắng nghe trên 0.0.0.0 (tất cả IP card mạng)
$Listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
$Listener.Start()

try {
    while ($true) {
        $client = $Listener.AcceptTcpClient()
        $stream = $client.GetStream()
        $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::UTF8)

        $requestLine = $reader.ReadLine()
        if (-not $requestLine) {
            $client.Close()
            continue
        }

        # Đọc hết HTTP headers
        while ($true) {
            $hLine = $reader.ReadLine()
            if ([string]::IsNullOrEmpty($hLine)) { break }
        }

        $parts = $requestLine.Split(' ')
        $urlPath = if ($parts.Length -ge 2) { $parts[1] } else { "/" }
        $urlPath = $urlPath.Split('?')[0].TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($urlPath)) { $urlPath = "index.html" }
        $urlPath = [System.Uri]::UnescapeDataString($urlPath)

        $filePath = Join-Path $Root $urlPath

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = "application/octet-stream"
            switch ($ext) {
                ".html" { $contentType = "text/html; charset=utf-8" }
                ".css"  { $contentType = "text/css; charset=utf-8" }
                ".js"   { $contentType = "application/javascript; charset=utf-8" }
                ".json" { $contentType = "application/json; charset=utf-8" }
                ".png"  { $contentType = "image/png" }
                ".jpg"  { $contentType = "image/jpeg" }
                ".jpeg" { $contentType = "image/jpeg" }
                ".webp" { $contentType = "image/webp" }
                ".svg"  { $contentType = "image/svg+xml" }
                ".ico"  { $contentType = "image/x-icon" }
                ".sql"  { $contentType = "text/plain; charset=utf-8" }
            }

            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $headerText = "HTTP/1.1 200 OK`r`nContent-Type: $contentType`r`nContent-Length: $($bytes.Length)`r`nAccess-Control-Allow-Origin: *`r`nConnection: close`r`n`r`n"
            $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headerText)

            $stream.Write($headerBytes, 0, $headerBytes.Length)
            $stream.Write($bytes, 0, $bytes.Length)
        } else {
            $msg = [System.Text.Encoding]::UTF8.GetBytes("404 - Not Found")
            $headerText = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain; charset=utf-8`r`nContent-Length: $($msg.Length)`r`nConnection: close`r`n`r`n"
            $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headerText)
            $stream.Write($headerBytes, 0, $headerBytes.Length)
            $stream.Write($msg, 0, $msg.Length)
        }

        $stream.Flush()
        $client.Close()
    }
}
catch {
    Write-Host "Dừng hoặc có lỗi server: $_" -ForegroundColor Yellow
}
finally {
    $Listener.Stop()
}
