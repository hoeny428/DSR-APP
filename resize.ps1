Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile("C:\Users\User\.gemini\antigravity-ide\brain\6fb28adf-abe8-473f-84c2-b13bf12ec0ab\dsr_app_icon_1782158150544.png")

$bmp512 = New-Object System.Drawing.Bitmap 512, 512
$g512 = [System.Drawing.Graphics]::FromImage($bmp512)
$g512.DrawImage($src, 0, 0, 512, 512)
$bmp512.Save("d:\DSR-APP\icon-512.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g512.Dispose()
$bmp512.Dispose()

$bmp192 = New-Object System.Drawing.Bitmap 192, 192
$g192 = [System.Drawing.Graphics]::FromImage($bmp192)
$g192.DrawImage($src, 0, 0, 192, 192)
$bmp192.Save("d:\DSR-APP\icon-192.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g192.Dispose()
$bmp192.Dispose()

$src.Dispose()
