param(
  [Parameter(Mandatory=$true)][ValidateSet('Install','Reinstall','Uninstall','Launch','Stop','WaitStopped','Inspect')][string]$Phase,
  [Parameter(Mandatory=$true)][string]$Output,
  [string]$Executable,
  [int]$AppProcessId
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
  @{phase=$Phase;windows=[Environment]::OSVersion.VersionString;signature=$signature.Status.ToString();fileVersion=$info.FileVersion;productVersion=$info.ProductVersion} | ConvertTo-Json -Compress
}
