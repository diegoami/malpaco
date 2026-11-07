param(
  [Parameter(Mandatory=$true)][ValidateSet('Install','Reinstall','Uninstall','Launch','Close','CloseDocument','Stop','WaitStopped','ExternalBrowserReady','ExternalBrowser','Inspect')][string]$Phase,
  [Parameter(Mandatory=$true)][string]$Output,
  [string]$Executable,
  [int]$AppProcessId,
  [string]$Url
)
$ErrorActionPreference = 'Stop'
$build = Get-Content -Raw (Join-Path $Output 'BUILD-WINDOWS.json') | ConvertFrom-Json
$install = Join-Path $env:LOCALAPPDATA ('Programs\Malpaco-smoke-' + $build.sourceCommit.Substring(0,12))
$installedExe = Join-Path $install 'malpaco.exe'
$shortcut = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\Malpaco\Malpaco.lnk'
$installer = Join-Path $Output ('malpaco-' + $build.version + '-windows-x64-setup.exe')
if ($Phase -in @('Install','Reinstall')) {
  if ($Phase -eq 'Install' -and ((Test-Path $install) -or (Test-Path $shortcut))) { throw 'Test install destination is not clean' }
  $process = Start-Process -FilePath $installer -ArgumentList @('/S', ('/D=' + $install)) -Wait -PassThru
  if ($process.ExitCode -ne 0) { throw "Installer exited $($process.ExitCode)" }
  if (!(Test-Path $installedExe) -or !(Test-Path $shortcut)) { throw 'Missing installed app or Start menu shortcut' }
  $shell = New-Object -ComObject WScript.Shell
  $target = $shell.CreateShortcut($shortcut).TargetPath
  if ($target -ne $installedExe) { throw "Shortcut target differs: $target" }
  $entry = Get-ChildItem 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall' | Get-ItemProperty | Where-Object { $_.DisplayName -eq 'Malpaco' }
  if (!$entry -or $entry.DisplayVersion -ne $build.version) { throw 'Missing/misversioned uninstall registration' }
  @{phase=$Phase;installedExe=$installedExe;shortcut=$shortcut;version=$entry.DisplayVersion;uninstall=$entry.UninstallString} | ConvertTo-Json -Compress
} elseif ($Phase -eq 'Uninstall') {
  $uninstaller = Join-Path $install 'uninstall.exe'
  if (!(Test-Path $uninstaller)) { throw 'Missing uninstaller' }
  $process = Start-Process -FilePath $uninstaller -ArgumentList '/S' -Wait -PassThru
  if ($process.ExitCode -ne 0) { throw "Uninstaller exited $($process.ExitCode)" }
  $deadline = (Get-Date).AddSeconds(20)
  while ((Test-Path $installedExe) -and ((Get-Date) -lt $deadline)) { Start-Sleep -Milliseconds 200 }
  if ((Test-Path $installedExe) -or (Test-Path $shortcut)) { throw 'Uninstall left app/shortcut installed' }
  $entry = Get-ChildItem 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall' | Get-ItemProperty | Where-Object { $_.DisplayName -eq 'Malpaco' }
  if ($entry) { throw 'Uninstall registration remains' }
  @{phase=$Phase;appRemoved=$true;shortcutRemoved=$true;registrationRemoved=$true} | ConvertTo-Json -Compress
} elseif ($Phase -eq 'Launch') {
  $process = Start-Process -FilePath $Executable -PassThru
  if (!$process) { throw 'Launch returned no process' }
  @{phase=$Phase;pid=$process.Id;path=$Executable} | ConvertTo-Json -Compress
} elseif ($Phase -eq 'ExternalBrowserReady') {
  # This is a dedicated hosted VM; never terminate a browser that predates this test.
  if (Get-Process -Name msedge -ErrorAction SilentlyContinue) { throw 'An Edge browser already runs; external-link process proof is not isolated' }
  @{phase=$Phase;isolated=$true} | ConvertTo-Json -Compress
} elseif ($Phase -eq 'ExternalBrowser') {
  $deadline = (Get-Date).AddSeconds(15)
  $found = $null
  while (!$found -and ((Get-Date) -lt $deadline)) {
    $found = Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -and $_.CommandLine.Contains($Url) } | Select-Object -First 1
    if (!$found) { Start-Sleep -Milliseconds 100 }
  }
  if (!$found) { throw "No default Edge browser process received the requested URL: $Url" }
  $browserProcessId = $found.ProcessId
  # Only close the browser just created by this test, including its renderer children.
  & taskkill.exe /PID $browserProcessId /T /F | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'Could not close the test browser process' }
  @{phase=$Phase;url=$Url;pid=$browserProcessId;urlReceivedByBrowser=$true} | ConvertTo-Json -Compress
} elseif ($Phase -in @('Close','CloseDocument')) {
  # Process.CloseMainWindow may choose another top-level window after a manual was
  # opened. Select the exact owned native window, not a debugger page or heuristic.
  Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class MalpacoSmokeWindow {
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern IntPtr FindWindow(string className, string title);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr window, out uint process);
  [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr window, uint message, IntPtr wParam, IntPtr lParam);
}
'@
  $title = if ($Phase -eq 'CloseDocument') { 'Malpaco documentation' } else { 'Malpaco' }
  $window = [MalpacoSmokeWindow]::FindWindow($null,$title)
  if ($window -eq [IntPtr]::Zero) { throw "No native window titled $title" }
  [uint32]$ownerProcessId = 0
  [MalpacoSmokeWindow]::GetWindowThreadProcessId($window,[ref]$ownerProcessId) | Out-Null
  if ($ownerProcessId -ne $AppProcessId) { throw 'Refusing to close an unrelated window' }
  if (![MalpacoSmokeWindow]::PostMessage($window,0x0010,[IntPtr]::Zero,[IntPtr]::Zero)) { throw 'Could not request normal window close' }
  @{phase=$Phase;pid=$AppProcessId;title=$title;normalWindowCloseRequested=$true} | ConvertTo-Json -Compress
} elseif ($Phase -eq 'WaitStopped') {
  $deadline = (Get-Date).AddSeconds(10)
  while ((Get-Process -Id $AppProcessId -ErrorAction SilentlyContinue) -and ((Get-Date) -lt $deadline)) { Start-Sleep -Milliseconds 100 }
  if (Get-Process -Id $AppProcessId -ErrorAction SilentlyContinue) { throw 'Closing the app window did not exit the process' }
  @{phase=$Phase;pid=$AppProcessId;exitedNormally=$true} | ConvertTo-Json -Compress
} elseif ($Phase -eq 'Stop') {
  $process = Get-Process -Id $AppProcessId -ErrorAction SilentlyContinue
  if ($process) { Stop-Process -Id $AppProcessId; $process.WaitForExit(10000) | Out-Null }
  @{phase=$Phase;pid=$AppProcessId;stopped=$true} | ConvertTo-Json -Compress
} else {
  $signature = Get-AuthenticodeSignature -FilePath $Executable
  $info = (Get-Item $Executable).VersionInfo
  @{phase=$Phase;windows=[Environment]::OSVersion.VersionString;powershell=$PSVersionTable.PSVersion.ToString();signature=$signature.Status.ToString();fileVersion=$info.FileVersion;productVersion=$info.ProductVersion} | ConvertTo-Json -Compress
}
