# Guardora AI model pack

These models cover the main computer-vision requirements in the SecureNest
document while the project focuses on web and model development.

| Capability | Primary model | Format |
| --- | --- | --- |
| Weapons and dangerous objects | Threat Detection YOLOv8n | PyTorch |
| Fire and smoke | Fire-Smoke YOLOv8n | PyTorch |
| Violence in video | Real-time X3D checkpoint | PyTorch |
| Face detection | OpenCV YuNet | ONNX |
| Face recognition | OpenCV SFace | ONNX |

Every source repository is pinned to an immutable commit in `models.json`.
Primary weight files also have their byte size and SHA-256 digest recorded
there. This makes the checked-in binaries reproducible and detects incomplete
downloads.

## Verify

```bash
python3 verify_models.py
```

## Re-download

```bash
python3 -m pip install -r requirements.txt
python3 download_models.py
python3 verify_models.py
```

## Runtime smoke test

```bash
python3 runtime_check.py
```

Review each upstream model card and license before production or commercial
deployment. Detection and recognition outputs require application-level
thresholds, human review, audit logging, and representative local evaluation.

