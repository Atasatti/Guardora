#!/usr/bin/env python3
"""Download Guardora's model pack from immutable Hugging Face revisions."""

from __future__ import annotations

import json
from pathlib import Path

from huggingface_hub import snapshot_download


ROOT = Path(__file__).resolve().parent
MANIFEST = ROOT / "models.json"


def main() -> None:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))

    for model in manifest["models"]:
        source = model["source"]
        print(f"Downloading {model['id']} from pinned revision...")
        snapshot_download(
            repo_id=source["repository"],
            revision=source["revision"],
            local_dir=ROOT / model["local_dir"],
            allow_patterns=model["download_patterns"],
        )

    print("Downloads complete. Run verify_models.py before using the weights.")


if __name__ == "__main__":
    main()

