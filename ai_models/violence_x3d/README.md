---
language:
  - en
  - vi
license: mit
library_name: pytorch
tags:
  - video-classification
  - violence-detection
  - 3d-cnn
  - x3d
  - i3d
  - slowfast
  - r2plus1d
  - action-recognition
  - school-safety
datasets:
  - RWF-2000
metrics:
  - accuracy
  - f1
pipeline_tag: video-classification
---

# School Violence Detection - 3D CNN Model Zoo

Bộ mô hình 3D CNN được fine-tune để phát hiện hành vi bạo lực trong video, phục vụ đồ án tốt nghiệp "Hệ thống phát hiện bạo lực học đường" tại UIT.

Tất cả mô hình được train trên tập dữ liệu **RWF-2000** (Real World Fighting) — 2000 video bạo lực/không bạo lực ngoài đời thực.

Repo gồm **2 nhóm checkpoint**:

1. **Final (optimized)** — 2 model sau khi chạy quy trình ablation (Step 1 + Step 2). Đây là 2 model nên dùng cho deploy/demo.
2. **Baselines** — 4 model gốc dùng để so sánh kiến trúc trong phần thực nghiệm của luận văn.

## ⭐ Final Models (after ablation)

| Model | Backbone | Frames | Threshold | F1 | GPU Latency | Strategy |
|-------|----------|--------|-----------|----|-------------|----------|
| **`final_best`** (R(2+1)D-18 optimized) | r2plus1d_18 | 32 | 0.5 | **0.93** | ~21 ms | Step 2 ablation, no retrain |
| **`final_x3d_realtime`** (X3D-M realtime) | x3d_m | **16** | **0.4** | **0.93** | **~3.77 ms** | Full retrain @16 frames |

Cả hai đều đạt F1 = 0.93 trên RWF-2000 val (400 mẫu), nhưng `final_x3d_realtime` nhanh hơn **~5.6×** trên GPU và phù hợp deploy realtime.

> ⚠️ **Lưu ý quan trọng** khi inference:
> - `final_x3d_realtime` dùng **16 frames** (không phải 32) và **threshold = 0.4** (không phải 0.5).
> - `final_best` (R(2+1)D-18) dùng 32 frames, threshold 0.5 như mặc định.

## Baseline Models (for comparison)

| Model | Backbone | Accuracy | Params | Size | Note |
|-------|----------|----------|--------|------|------|
| **X3D-M** | x3d_m | ~92.0% | 3.0M | ~35 MB | Baseline trước ablation |
| **I3D-R50** | i3d_r50 | ~90.75% | 27.2M | ~312 MB | Baseline |
| **SlowFast-R50** | slowfast_r50 | ~92.5% | 33.6M | ~386 MB | Baseline |
| **R(2+1)D-18** | r2plus1d_18 | ~93.0% | 31.3M | ~358 MB | Baseline cho `final_best` |

> Số liệu accuracy là kết quả trên tập validation của RWF-2000 (split 80/10/10).

## Repository Layout

```
school-violence-detection-models/
├── README.md                       # Model card này
├── .gitattributes                  # Git LFS config cho file .pt
├── config.yaml                     # Config dùng để train/infer
├── final/                          # ⭐ 2 model optimized sau ablation
│   ├── final_best.pt              # R(2+1)D-18, 32 frames, thr=0.5
│   ├── final_x3d_realtime.pt      # X3D-M,   16 frames, thr=0.4
│   └── MODEL_CARD.md
├── x3d_m/                          # Baseline
│   ├── x3d_m_best.pt
│   ├── x3d_summary.json
│   ├── x3d_confusion_matrix.png
│   ├── x3d_training_history.png
│   └── MODEL_CARD.md
├── i3d_r50/
│   ├── i3d_r50_best.pt
│   ├── i3d_summary.json
│   ├── i3d_confusion_matrix.png
│   ├── i3d_training_history.png
│   └── MODEL_CARD.md
├── slowfast_r50/
│   ├── slowfast_best.pt
│   ├── slowfast_summary.json
│   ├── slowfast_confusion_matrix.png
│   ├── slowfast_training_history.png
│   └── MODEL_CARD.md
└── r2plus1d_18/
    ├── r2plus1d_best.pt
    ├── r2plus1d_confusion_matrix.png
    ├── r2plus1d_training_history.png
    └── MODEL_CARD.md
```

## Quick Start

### Install dependencies

```bash
pip install torch torchvision pytorchvideo opencv-python-headless pyyaml
```

### Download a checkpoint

```python
from huggingface_hub import hf_hub_download

# Recommended: final optimized models
ckpt_path = hf_hub_download(
    repo_id="visionlab-ai/school-violence-detection-models",
    filename="final/final_x3d_realtime.pt",   # or "final/final_best.pt"
)

# Or one of the baselines
ckpt_path = hf_hub_download(
    repo_id="visionlab-ai/school-violence-detection-models",
    filename="x3d_m/x3d_m_best.pt",
)
```

### Run inference

```python
import torch
import torch.nn.functional as F
from pytorchvideo.models.hub import x3d_m

# Build architecture (must match training config)
model = x3d_m(pretrained=False)
model.blocks[5].proj = torch.nn.Linear(2048, 2)  # 2 classes: non-violent / violent

# Load checkpoint
checkpoint = torch.load(ckpt_path, map_location="cpu")
state_dict = checkpoint.get("model", checkpoint.get("model_state_dict", checkpoint))
model.load_state_dict(state_dict)
model.eval()

# Input: (B, C=3, T=32, H=224, W=224), normalized to mean=0.45, std=0.225
# video_tensor = preprocess_video("video.mp4")
# with torch.no_grad():
#     logits = model(video_tensor)
#     probs = F.softmax(logits, dim=1)
#     # probs[0][0] = non-violent, probs[0][1] = violent
```

> ⚠️ Bốn mô hình có wrapper class riêng (xem `model/` trong repo source). Để load đúng kiến trúc, khuyến nghị dùng `model_registry.py` từ repo source code, hoặc xem chi tiết trong từng `MODEL_CARD.md`.

## Training Details

- **Dataset**: RWF-2000 (Real World Fighting), 2000 video, 5s/video, 30fps
- **Split**: 80% train / 10% val / 10% test
- **Input**: 32 frames per clip, 224x224, RGB normalized (mean=0.45, std=0.225)
- **Optimizer**: Adam, lr=1e-3, weight_decay=1e-4
- **Scheduler**: StepLR (step=10, gamma=0.1)
- **Epochs**: 30 (early stopping patience=10)
- **Batch size**: 8 (Colab T4) / 12-16 (RTX 3060)
- **Mixed precision**: FP16 enabled
- **Transfer learning**: Backbone pretrained trên Kinetics-400, freeze 5 epoch đầu

## Intended Use

- Nghiên cứu học thuật, đồ án tốt nghiệp về phát hiện hành vi bạo lực.
- Tích hợp vào hệ thống giám sát trường học (proof-of-concept).
- So sánh kiến trúc 3D CNN cho bài toán video classification.

### Out-of-scope

- Sử dụng trong giám sát công cộng / cá nhân khi chưa có sự đồng thuận.
- Quyết định trừng phạt / pháp lý dựa thuần túy vào output mô hình.
- Triển khai sản xuất mà không có vòng review của con người.

## Limitations & Biases

- Dataset RWF-2000 chủ yếu thu thập từ YouTube, có thể không phản ánh đúng phân phối camera giám sát trường học (góc nhìn cao, chất lượng thấp, ánh sáng đêm).
- Mô hình không phân biệt được các loại bạo lực (đánh nhau, xô đẩy, va chạm thể thao).
- Có khả năng false positive với hoạt động thể thao mạnh (võ thuật, bóng đá tranh chấp).

## Citation

```bibtex
@misc{school_violence_detection_2026,
  title  = {School Violence Detection: A Comparative Study of 3D CNN Architectures},
  author = {Nguyen, Nauthui7},
  year   = {2026},
  school = {University of Information Technology (UIT), VNU-HCM},
  note   = {Graduation thesis}
}
```

## License

MIT License - tự do sử dụng cho mục đích nghiên cứu và phi thương mại.

## Contact

- Author: visionlab-ai
- Demo Space: [visionlab-ai/school-violence-detection-app](https://huggingface.co/spaces/visionlab-ai/school-violence-detection-app)
- Source code: GitHub repository (ask author for link)
