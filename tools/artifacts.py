#!/usr/bin/env python3
"""[designed: owner, 2026-10-20] Artifacts (screenshots, logs, proof runs, builds) never go into Git
(CLAUDE.md rule 6, docs/process.md §6). Same interface as goal2's tools/artifacts.py.

    python3 tools/artifacts.py where                     the folder's link and the rclone remote
    python3 tools/artifacts.py pull [NAME...]            copy the folder (or NAMEs in it) into artifacts/
    python3 tools/artifacts.py push [--to DIR] PATH...   upload files or directories to the folder
    python3 tools/artifacts.py release TAG FILE...       attach files to a GitHub release instead

The location is artifacts.json; transfers use rclone (https://rclone.org), with a remote the
owner configured once (`rclone config create malpacodrive drive scope=drive root_folder_id=<id>`).
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def settings() -> dict:
    block = json.loads((ROOT / "artifacts.json").read_text())
    return {"folderUrl": block.get("drive", {}).get("folderUrl", ""),
            "remote": block.get("drive", {}).get("rcloneRemote", ""),
            "localDir": ROOT / block.get("localDir", "artifacts")}


def join(remote: str, name: str) -> str:
    return f"{remote}{name}" if remote.endswith(":") else f"{remote}/{name}"


def rclone(cfg: dict) -> str:
    exe = shutil.which("rclone")
    if not exe or not cfg["remote"]:
        sys.exit("rclone and artifacts.json drive.rcloneRemote are needed for transfers; "
                 f"use {cfg['folderUrl'] or '(no folderUrl set yet)'} by hand, with {cfg['localDir']}")
    return exe


def main(argv: list[str]) -> int:
    cfg = settings()
    if not argv or argv[0] not in {"where", "pull", "push", "release"}:
        print(__doc__)
        return 2
    command, names = argv[0], argv[1:]
    if command == "where":
        print(f"folder: {cfg['folderUrl'] or '(not set: artifacts.json drive.folderUrl)'}")
        print(f"rclone remote: {cfg['remote'] or '(not set)'}\nlocal: {cfg['localDir']}")
        return 0
    if command == "release":
        if len(names) < 2:
            sys.exit("release needs a tag and at least one file")
        subprocess.run(["gh", "release", "upload", names[0], *names[1:], "--clobber"], check=True)
        return 0
    exe = rclone(cfg)
    if command == "pull":
        cfg["localDir"].mkdir(parents=True, exist_ok=True)
        if not names:
            subprocess.run([exe, "copy", cfg["remote"], str(cfg["localDir"]), "--progress"], check=True)
        for name in names:
            dest = cfg["localDir"] / Path(name).name
            subprocess.run([exe, "copyto", join(cfg["remote"], name), str(dest), "--progress"], check=True)
        return 0
    subdir = ""
    if names[:1] == ["--to"]:
        if len(names) < 2:
            sys.exit("--to needs a folder name")
        subdir, names = names[1].strip("/") + "/", names[2:]
    if not names:
        sys.exit("push needs at least one file or directory")
    for name in names:
        target = join(cfg["remote"], subdir + Path(name).name)
        subprocess.run([exe, "copy" if Path(name).is_dir() else "copyto", name, target, "--progress"], check=True)
    print(f"uploaded to {subdir or '/'} in {cfg['folderUrl']}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
