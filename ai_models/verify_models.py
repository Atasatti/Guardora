#!/usr/bin/env python3
"""Verify the size and SHA-256 digest of every primary model weight."""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
MANIFEST = ROOT / "models.json"
CHUNK_SIZE = 1024 * 1024


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as model_file:
        for chunk in iter(lambda: model_file.read(CHUNK_SIZE), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> int:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    failures: list[str] = []

    for model in manifest["models"]:
        for weight in model["weights"]:
            path = ROOT / weight["path"]
            label = f"{model['id']}: {weight['path']}"

            if not path.is_file():
                failures.append(f"{label} is missing")
                continue

            actual_size = path.stat().st_size
            if actual_size != weight["bytes"]:
                failures.append(
                    f"{label} has {actual_size} bytes; expected {weight['bytes']}"
                )
                continue

            actual_digest = sha256(path)
            if actual_digest != weight["sha256"]:
                failures.append(f"{label} failed its SHA-256 check")
                continue

            print(f"OK  {label}")

    if failures:
        for failure in failures:
            print(f"FAIL  {failure}", file=sys.stderr)
        return 1

    print("All primary model files passed integrity verification.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

