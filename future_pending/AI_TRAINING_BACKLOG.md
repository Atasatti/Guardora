# AI model training backlog

## Direct answer

If only one model is trained next, train **RF-DETR Small for weapon/threat
detection first**. It closes the most important production gap: the downloaded
YOLO weapon checkpoint is usable for demos but its Ultralytics runtime is
AGPL-3.0 unless an enterprise licence is obtained.

The current AI service explicitly has three production training jobs left:

| Order | Model | Required action | Suggested labels | Production licence position |
| --- | --- | --- | --- | --- |
| 1 | RF-DETR Small — weapon/threat | Custom train and validate on authorized CCTV data | handgun, rifle, knife, explosive/grenade; include harmless tools and toy weapons as hard negatives | RF-DETR code/model family selected here is Apache-2.0; dataset rights must also permit the intended use |
| 2 | RF-DETR Small — fire/smoke | Custom train and validate on day/night/IR footage | fire, smoke; include cooking smoke, fog, headlights and reflections as hard negatives | Apache-2.0 selection; dataset rights still require review |
| 3 | X3D-M — violence | Retrain/fine-tune using a clearly licensed checkpoint and labelled video clips | violence, non-violence; add play fighting, running, exercise and crowded scenes as hard negatives | PyTorchVideo architecture is Apache-2.0, but the downloaded checkpoint has research/non-commercial wording and must not be the commercial production checkpoint |

Train the two RF-DETR detectors separately first. Separate datasets and
thresholds make errors easier to measure. A combined detector can be evaluated
later only if target-device latency requires it.

## Additional models needed for the full long-term plan

| Capability | Model plan | Training status |
| --- | --- | --- |
| Fall/distress | RTMPose plus a temporal event classifier | New labelled sequences and classifier training are required |
| Vehicle/plate reading | PaddleOCR plus a regional plate detector | PaddleOCR can be reused; the detector needs local plate-layout training |
| Roman Urdu/Urdu moderation | Granite Guardian benchmark, then optional adapter/fine-tune | Not an immediate training requirement, but a labelled local benchmark is required before claiming production accuracy |

## Models that do not need training now

| Model | Current action |
| --- | --- |
| OpenCV YuNet face detector | Use the pretrained MIT model; test it on the actual camera angles |
| OpenCV SFace face recognizer | Use the pretrained Apache-2.0 model; enroll multiple authorized reference photos per person and calibrate the match threshold on a separate validation set |
| Granite Guardian 3.0 2B | Use locally through Ollama for the current English moderation path; benchmark before expanding language claims |

Face threshold calibration and banned-person gallery enrollment are **not**
model training. Never place resident biometric photos in Git.

## Downloaded models retained for testing, not default production

| Downloaded checkpoint | State | Reason |
| --- | --- | --- |
| `weapon_threat_yolov8n/weights/best.pt` | Demo/evaluation only | Ultralytics runtime is AGPL-3.0 unless commercially licensed |
| `fire_smoke_yolov8n/best.pt` | Demo/evaluation only | Model and runtime carry AGPL-3.0 obligations |
| `violence_x3d/final/final_x3d_realtime.pt` | Research testing only | Source wording conflicts between MIT and research/non-commercial use |
| YuNet ONNX | Active production candidate | MIT |
| SFace ONNX | Active production candidate after consent and threshold calibration | Apache-2.0 |

## Dataset and validation gates

- Use authorized footage from the real camera heights, lenses, compression,
  daylight, night/IR, weather, distance, crowding, and occlusion conditions.
- Split by camera and recording day; adjacent frames must not leak across
  training and validation.
- Keep an untouched site-representative test set.
- Report per-class precision, recall, F1 and PR curves.
- Report false alerts per camera-hour, not only image mAP.
- Measure p95 end-to-end latency, dropped frames and reconnect behavior on the
  deployment hardware.
- Freeze thresholds after validation and retain human review for high-severity
  alerts.
- Record dataset provenance, consent, retention policy and every applicable
  licence before release.

## Existing RF-DETR training command

Run on Python 3.10+ with a CUDA GPU:

```bash
cd ai_models/training
python -m pip install -r requirements-rfdetr.txt
python train_rfdetr.py \
  --dataset /path/to/coco-or-yolo-dataset \
  --output /path/to/guardora-rfdetr-output \
  --variant small
```

The existing script accepts COCO or YOLO dataset layouts. Repeat it once for the
weapon/threat dataset and once for the fire/smoke dataset.

