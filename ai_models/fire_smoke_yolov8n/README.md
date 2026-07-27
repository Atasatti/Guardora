---
license: agpl-3.0
tags:
  - ultralytics
  - yolov8
  - object-detection
  - fire-detection
  - smoke-detection
  - pytorch
library_name: ultralytics
pipeline_tag: object-detection
---

# YOLOv8n — Fire & Smoke Detector (D-Fire fine-tune)

YOLOv8n fine-tuned on the **D-Fire** dataset for detecting **smoke** and **fire** in images.

## Classes
- `0` — smoke
- `1` — fire

## Files
- `best.pt` — fine-tuned weights (use this)
- `last.pt` — final-epoch weights

## Results (test split, 4,306 images)

| Metric | All | Smoke | Fire |
|---|---|---|---|
| mAP50 | 0.754 | — | — |
| mAP50-95 | 0.430 | 0.499 | 0.362 |
| Precision | 0.766 | — | — |
| Recall | 0.688 | — | — |

## Training config
- Base: `yolov8n.pt` (COCO pretrained)
- Epochs: 50, image size: 640, batch: 16
- Optimizer: MuSGD (auto), lr0=0.01
- Device: Apple MPS

## Usage

```python
from huggingface_hub import hf_hub_download
from ultralytics import YOLO

ckpt = hf_hub_download(repo_id="rabahdev/fire-smoke-yolov8n", filename="best.pt")
model = YOLO(ckpt)
results = model("image.jpg")
results[0].show()
```

## Dataset
- D-Fire (smoke + fire detection), YOLO format
- Train: 14,122 — Val: 3,099 — Test: 4,306

## License
AGPL-3.0 (inherited from Ultralytics YOLOv8).
