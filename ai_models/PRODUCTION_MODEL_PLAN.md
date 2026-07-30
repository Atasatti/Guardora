# Guardora production model plan

This plan distinguishes models that can run safely now from models that need
Guardora-specific training. A generic benchmark score is not enough for a
security alerting system.

## Recommended stack

| Capability | Selected model | License | Decision |
| --- | --- | --- | --- |
| Community text moderation | Granite Guardian 3.0 2B through Ollama | Apache-2.0 | Active locally; use 4.1 8B when deployment hardware/storage permits |
| Face detection | OpenCV YuNet | MIT | Active production candidate |
| Face recognition | OpenCV SFace | Apache-2.0 | Active production candidate after consent, gallery controls, and local threshold calibration |
| Weapon/threat detection | RF-DETR Small | Apache-2.0 | Train on licensed CCTV data; no trustworthy permissive drop-in Guardora checkpoint was found |
| Fire/smoke detection | RF-DETR Small | Apache-2.0 | Train on licensed day/night CCTV data; no trustworthy permissive drop-in Guardora checkpoint was found |
| Violence detection | X3D-M architecture (PyTorchVideo) | Apache-2.0 architecture | Retrain/fine-tune; the checked-in checkpoint has conflicting research/non-commercial wording |
| Fall/distress detection | RTMPose + a temporal event classifier | Apache-2.0 toolkit | New labelled sequence data and training are required |
| Vehicle/plate OCR | PaddleOCR + regional plate detector | Apache-2.0 toolkit | OCR can be reused; the plate detector must be trained for local plate layouts |

## What is active now

- The backend uses local Granite Guardian moderation first and an optional
  Gemini fallback only when configured.
- Granite Guardian's published training/evaluation scope is English. Roman
  Urdu and Urdu moderation therefore need a dedicated labelled benchmark and
  likely adapter/fine-tune before they can be treated as production-safe; no
  reliable small permissive drop-in model was identified for that gap.
- The AI WebSocket service uses YuNet and SFace without a cloud dependency.
- Existing YOLO weapon and fire checkpoints remain available only behind
  `GUARDORA_ALLOW_AGPL_MODELS=true`. They are demo/evaluation models, not the
  default production stack.
- The current X3D checkpoint is retained for reproducibility but is not exposed
  as a production detector until its data rights and deployment license are
  resolved.

## Data to build

For fire/smoke and threat detection, collect authorized footage from the actual
camera heights and lenses. Include daylight, night/IR, rain, haze, occlusion,
empty scenes, harmless tools, toys, cooking smoke, headlights, reflections,
and compression artifacts. Split by camera and recording day so adjacent
frames cannot leak between train and validation.

For violence and falls, label short temporal clips rather than isolated frames.
Include normal activities that look similar: play fighting, running, carrying,
sitting quickly, prayer, exercise, maintenance work, and crowded entrances.

Do not put residents' biometric reference images in Git. Use the ignored
`face_gallery` directory only with explicit authorization and a written
retention/deletion policy.

## Release gates

A model is not production-ready until it meets all of these on an untouched,
site-representative test set:

1. Per-class precision, recall, F1, and PR curves are reported.
2. Performance is broken down by day/night, camera, weather, distance, and
   occlusion.
3. False alerts are measured per camera-hour, not only per image.
4. End-to-end latency and dropped-frame rate are measured on target hardware.
5. Thresholds are calibrated from validation data and then frozen.
6. Every high-severity alert has human review, audit logging, and an escalation
   playbook.
7. Dataset provenance, consent, model license, and retention rules pass review.

## RF-DETR training

Use Python 3.10+ and a CUDA GPU:

```bash
cd ai_models/training
python -m pip install -r requirements-rfdetr.txt
python train_rfdetr.py \
  --dataset /path/to/coco-or-yolo-dataset \
  --output /path/to/guardora-rfdetr-output \
  --variant small
```

Train separate fire/smoke and weapon/threat checkpoints first. Combining them
is possible later, but separate datasets and error budgets make the initial
models easier to validate.
