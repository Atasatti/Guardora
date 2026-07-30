# Guardora AI model pack

Guardora uses local, open-source AI wherever a suitable model exists. The
production decision and licensing notes are recorded in `models.json` and the
full replacement/training roadmap is in `PRODUCTION_MODEL_PLAN.md`.

| Capability | Current model | Status |
| --- | --- | --- |
| Text moderation | Granite Guardian 3.0 2B via Ollama | Active, Apache-2.0 |
| Face detection | OpenCV YuNet | Active production candidate, MIT |
| Face recognition | OpenCV SFace | Active production candidate, Apache-2.0 |
| Weapons and dangerous objects | Threat Detection YOLOv8n | Demo-only; RF-DETR replacement needs training |
| Fire and smoke | Fire-Smoke YOLOv8n | Demo-only; RF-DETR replacement needs training |
| Violence in video | Real-time X3D checkpoint | Research-only; retraining required |

Every source repository is pinned to an immutable commit in `models.json`.
Primary weight files also have their byte size and SHA-256 digest recorded
there. This makes the checked-in binaries reproducible and detects incomplete
downloads.

## Local text moderation

Install the practical 2B Granite Guardian model and keep Ollama running:

```bash
ollama pull granite3-guardian:2b
```

The backend defaults to `MODERATION_PROVIDER=ollama`,
`OLLAMA_URL=http://127.0.0.1:11434`, and
`OLLAMA_MODERATION_MODEL=granite3-guardian:2b`. A Gemini API key is optional
and is used only as a fallback.

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

## Local WebSocket service

The service supplies the exact endpoints expected by the surveillance UI:

```bash
python3 -m venv .venv-service
.venv-service/bin/python -m pip install -r service/requirements.txt
.venv-service/bin/python -m uvicorn service.app:app \
  --host 127.0.0.1 --port 8001
```

Check status at `http://127.0.0.1:8001/health`. Add authorized reference images
to `face_gallery/` to enable banned-person matching. With an empty gallery the
service detects and annotates faces but never raises an identity alert.

The existing YOLO checkpoints are disabled by default. They can be enabled for
an AGPL-compliant demo or an enterprise-licensed deployment:

```bash
GUARDORA_ALLOW_AGPL_MODELS=true \
  .venv-service/bin/python -m uvicorn service.app:app \
  --host 127.0.0.1 --port 8001
```

Review each upstream model card and license before deployment. Detection and
recognition outputs require calibrated thresholds, human review, audit logging,
and representative local evaluation.

## AI Model Lab evaluation mode

The Guardora dashboard exposes an admin-only `/ai-lab` route for controlled
text, image, and video testing. The full evaluation runtime includes Torch,
Ultralytics, PyTorchVideo, OpenCV, and the FastAPI service:

```bash
python3 -m venv .venv-eval
.venv-eval/bin/python -m pip install \
  -r requirements.txt \
  -r service/requirements.txt \
  pytorchvideo torchvision pyyaml

GUARDORA_ALLOW_AGPL_MODELS=true \
GUARDORA_ALLOW_RESEARCH_MODELS=true \
  .venv-eval/bin/python -m uvicorn service.app:app \
  --host 127.0.0.1 --port 8001
```

The two opt-ins are intended for evaluation only. Uploaded Model Lab media is
limited to 50 MB and removed by the backend after inference.

## Primary upstream references

- [IBM Granite Guardian](https://github.com/ibm-granite/granite-guardian)
- [RF-DETR](https://github.com/roboflow/rf-detr)
- [OpenCV YuNet](https://github.com/opencv/opencv_zoo/tree/main/models/face_detection_yunet)
- [OpenCV SFace](https://github.com/opencv/opencv_zoo/tree/main/models/face_recognition_sface)
- [PyTorchVideo](https://github.com/facebookresearch/pytorchvideo)
- [MMPose](https://github.com/open-mmlab/mmpose)
- [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR)
