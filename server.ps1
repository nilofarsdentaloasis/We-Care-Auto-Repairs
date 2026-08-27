$port = 8080
$path = $PSScriptRoot

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Prefixes.Add("http://127.0.0.1:$port/")

try {
    $listener.Start()
    Write-Output "SERVER_STARTED: http://localhost:$port"
} catch {
    # If 8080 is taken, fallback to 8081
    $port = 8081
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$port/")
    $listener.Prefixes.Add("http://127.0.0.1:$port/")
    $listener.Start()
    Write-Output "SERVER_STARTED: http://localhost:$port"
}

$mimeMap = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".png"  = "image/png"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".json" = "application/json"
    ".ico"  = "image/x-icon"
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrEmpty($urlPath) -or $urlPath -eq '/') {
            $urlPath = "index.html"
        }
        $urlPath = [System.Uri]::UnescapeDataString($urlPath)
        $localFilePath = Join-Path $path $urlPath

        if (Test-Path $localFilePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($localFilePath).ToLower()
            $mime = $mimeMap[$ext]
            if (-not $mime) { $mime = "application/octet-stream" }
            $response.ContentType = $mime

            # Enable CORS and caching headers
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $response.AddHeader("Cache-Control", "no-cache")

            if ($request.HttpMethod -ne "HEAD") {
                $bytes = [System.IO.File]::ReadAllBytes($localFilePath)
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $bytes = [System.IO.File]::ReadAllBytes($localFilePath)
                $response.ContentLength64 = $bytes.Length
            }
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.OutputStream.Close()
    } catch {
        # Continue server loop on connection reset
    }
} finally {
    $listener.Stop()
}
