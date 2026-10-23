#!/usr/bin/env python3
"""Install the pinned prototype toolchain under artifacts/android-toolchain (Linux x64)."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import platform
import shutil
import subprocess
import tarfile
from urllib.request import urlopen
import zipfile

args = argparse.ArgumentParser(description=__doc__)
args.add_argument('--emulator', action='store_true', help='also install an Android 16 x86-64 emulator image')
options = args.parse_args()
if platform.system() != 'Linux' or platform.machine() != 'x86_64':
    raise SystemExit('This bootstrap supports Linux x86-64. Other hosts: set JAVA_HOME, ANDROID_HOME and NDK_HOME as docs/android.md describes.')
root = Path(__file__).resolve().parents[2]
base = root / 'artifacts/android-toolchain'
base.mkdir(parents=True, exist_ok=True)
lock = json.loads(Path(__file__).with_name('downloads.json').read_text())


def download(name, record):
    path = base / name
    if not path.exists():
        temporary = path.with_suffix(path.suffix + '.partial')
        with urlopen(record['url']) as source, temporary.open('wb') as target:
            shutil.copyfileobj(source, target)
        temporary.rename(path)
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    if digest != record['sha256']:
        raise SystemExit(f'Checksum mismatch: {path}; preserve it for diagnosis before retrying')
    return path


jdk_archive = download('jdk.tar.gz', lock['jdk'])
jdk = base / 'jdk/jdk-21.0.13+9'
if not (jdk / 'bin/java').exists():
    with tarfile.open(jdk_archive) as archive:
        archive.extractall(base / 'jdk', filter='data')
sdk_archive = download('commandline-tools.zip', lock['commandlineTools'])
sdk = base / 'sdk'
tools = sdk / 'cmdline-tools/23.0/cmdline-tools'
if not (tools / 'bin/sdkmanager').exists():
    with zipfile.ZipFile(sdk_archive) as archive:
        archive.extractall(tools.parent)
for path in (tools / 'bin').iterdir():
    path.chmod(0o755)
env = dict(os.environ, JAVA_HOME=str(jdk), ANDROID_HOME=str(sdk))
manager = [str(tools / 'bin/sdkmanager'), '--sdk_root=' + str(sdk)]
# sdkmanager 23 accepts the current SDK licensing flow during installation.
# See Google's SDK license terms before running this installer.
subprocess.run(manager + ['--licenses'], input=b'y\n' * 100, env=env, check=True)
packages = ['platform-tools', 'platforms;android-37', 'build-tools;37.0.0', 'ndk;29.0.14206865']
if options.emulator:
    packages += ['emulator', 'system-images;android-36;google_apis;x86_64']
subprocess.run(manager + packages, env=env, check=True)
subprocess.run(['rustup', 'target', 'add', 'aarch64-linux-android', 'x86_64-linux-android'], check=True)
print('Toolchain ready. npm run android:build:debug discovers this local installation.')
