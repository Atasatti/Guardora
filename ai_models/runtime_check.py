#!/usr/bin/env python3
"""Load each primary Guardora model in an isolated runtime process."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

from verify_models import main as verify_models


ROOT = Path(__file__).resolve().parent


def check(label: str, code: str) -> bool:
    result = subprocess.run(
        [sys.executable, "-c", code],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode == 0:
        print(f"OK  {label}")
        return True

    detail = result.stderr.strip().splitlines()
    message = detail[-1] if detail else f"process exited with {result.returncode}"
    print(f"FAIL  {label}: {message}", file=sys.stderr)
    return False


def main() -> int:
    if verify_models() != 0:
        return 1

    checks = [
        (
            "weapon-threat-yolov8n",
            "from ultralytics import YOLO; "
            "m=YOLO('weapon_threat_yolov8n/weights/best.pt'); assert m.names",
        ),
        (
            "fire-smoke-yolov8n",
            "from ultralytics import YOLO; "
            "m=YOLO('fire_smoke_yolov8n/best.pt'); assert m.names",
        ),
        (
            "face-detection-yunet",
            "import cv2; "
            "m=cv2.FaceDetectorYN.create("
            "'face_yunet/face_detection_yunet_2023mar.onnx','',(320,320)); "
            "assert m is not None",
        ),
        (
            "face-recognition-sface",
            "import cv2; "
            "m=cv2.FaceRecognizerSF.create("
            "'face_sface/face_recognition_sface_2021dec.onnx',''); "
            "assert m is not None",
        ),
        (
            "violence-x3d",
            "import torch; "
            "m=torch.load('violence_x3d/final/final_x3d_realtime.pt',"
            "map_location='cpu',weights_only=True); assert m",
        ),
    ]

    passed = [check(label, code) for label, code in checks]
    if not all(passed):
        return 1

    print("All primary models loaded successfully.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
