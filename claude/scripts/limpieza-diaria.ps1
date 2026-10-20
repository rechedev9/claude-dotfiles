# Limpieza diaria del PC: solo cachés regenerables y temporales antiguos.
$gb = 1073741824
$before = (Get-PSDrive C).Free
foreach ($cmd in @('npm cache clean --force', 'pnpm store prune', 'uv cache prune', 'go clean -cache', 'bun pm cache rm')) {
  $exe = $cmd.Split(' ')[0]
  if (Get-Command $exe -ErrorAction SilentlyContinue) {
    $out = Invoke-Expression "$cmd 2>&1" | Select-Object -Last 1
    "${exe}: $out"
  }
}

$lim = (Get-Date).AddDays(-7)
$n = 0
foreach ($dir in @($env:TEMP, 'C:\Windows\Temp')) {
  Get-ChildItem $dir -Recurse -File -Force -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -lt $lim } | ForEach-Object {
    try { Remove-Item -LiteralPath $_.FullName -Force -ErrorAction Stop; $n++ } catch {}
  }
}
"Temp: $n archivos de más de 7 días borrados"

# TextInputHost a veces se cuelga gastando un núcleo entero; Windows lo vuelve a abrir solo.
Get-Process TextInputHost -ErrorAction SilentlyContinue | ForEach-Object {
  $a = $_.CPU; Start-Sleep 3
  $used = (Get-Process -Id $_.Id -ErrorAction SilentlyContinue).CPU - $a
  if ($used -gt 1.5) { Stop-Process -Id $_.Id -Force; "TextInputHost colgado: reiniciado" }
}

$free = (Get-PSDrive C).Free
"Liberado: {0:N1} GB | Libre en C: {1:N1} GB" -f (($free - $before) / $gb), ($free / $gb)
if ($free / $gb -lt 50) { "AVISO: quedan menos de 50 GB libres en C:" }
