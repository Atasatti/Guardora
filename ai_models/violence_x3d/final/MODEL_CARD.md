# Final Models — Post-Ablation

Hai checkpoint là **kết quả cuối** của quy trình ablation 2 bước (xem `ablation_runner.ipynb`). Đây là 2 model nên dùng cho deploy / demo / báo cáo, thay vì baseline.

## Tóm tắt

| File | Backbone | Frames | Threshold | F1 | GPU latency | Strategy |
|------|----------|--------|-----------|----|-------------|----------|
| `final_best.pt` | r2plus1d_18 | 32 | 0.5 | **0.93** | ~21.0 ms | Step 2 ablation, no retrain |
| `final_x3d_realtime.pt` | x3d_m | **16** | **0.4** | **0.93** | **~3.77 ms** | Full retrain (frames 32→16) |

Cả hai model đạt F1 = 0.93 trên RWF-2000 val (400 mẫu, 186/186 TP/TN, 14/14 FP/FN).

## `final_best.pt` — R(2+1)D-18 best

```python
chosen_config = {
    "name": "best",
    "model": "r2plus1d_18",
    "frames": 32,
    "threshold": 0.5,
    "smoothing_k": 1,
    "rationale": "highest F1 in Step 1; full Step 2 ablation applied",
    "source": "ablation_runner.ipynb",
}
final_metrics = {
    "acc": 0.93, "prec": 0.93, "rec": 0.93, "f1": 0.93,
    "tp": 186, "tn": 186, "fp": 14, "fn": 14,
    "gpu_latency_ms": 21.03, "n_val": 400,
}
strategy = "no_retrain (existing checkpoint already optimal at frames=32)"
source_checkpoint = "checkpoints/r2plus1d_best.pt"
```

**Khi nào dùng**: cần accuracy cao nhất, có GPU, latency 21ms vẫn chấp nhận được.

## `final_x3d_realtime.pt` — X3D-M realtime

```python
chosen_config = {
    "name": "x3d_realtime",
    "model": "x3d_m",
    "frames": 16,                       # giảm từ 32 xuống 16
    "threshold": 0.4,                   # recalibrated từ 0.7 → 0.4
    "smoothing_k": 1,
    "threshold_recalibrated": 0.4,
    "threshold_pre_retrain": 0.7,
    "rationale": "X3D — most efficient model, tuned for realtime deployment",
    "source": "ablation_runner.ipynb (deep ablation section)",
}
final_metrics = {
    "acc": 0.93, "prec": 0.93, "rec": 0.93, "f1": 0.93,
    "tp": 186, "tn": 186, "fp": 14, "fn": 14,
    "gpu_latency_ms": 3.77, "n_val": 400,
}
strategy = "full_retrain (frames changed from 32 to 16)"
hyper_params = {
    "epochs": 30, "lr": 1e-4, "weight_decay": 0.01,
    "dropout": 0.3, "label_smoothing": 0.1, "mixup_alpha": 0.2,
    "warmup_epochs": 3, "early_stop_patience": 7,
    "grad_clip": 1.0, "num_frames": 16, "frame_size": 224,
}
best_epoch = 10
```

**Khi nào dùng**: realtime inference, edge / CPU deployment, cùng F1 = 0.93 nhưng nhanh **~5.6× nhanh hơn** R(2+1)D trên GPU.

## ⚠️ Inference notes

- Đừng quên dùng đúng `num_frames` và `threshold` cho từng model:
  - `final_best.pt`: sample **32** frames, ngưỡng phân loại = **0.5**
  - `final_x3d_realtime.pt`: sample **16** frames, ngưỡng phân loại = **0.4**
- Cả hai checkpoint dùng wrapper `ViolenceR2Plus1D` / `ViolenceX3D` (xem `model/` trong repo source). State dict đều có prefix `backbone.*`.

## Loading example

```python
import torch
from huggingface_hub import hf_hub_download
# Giả sử bạn đã có wrapper sv_model trong PYTHONPATH
from sv_model import create_model

# X3D-M realtime
ckpt_path = hf_hub_download(
    repo_id="visionlab-ai/school-violence-detection-models",
    filename="final/final_x3d_realtime.pt",
)
model = create_model(backbone="x3d_m", num_classes=2, pretrained=False, dropout=0.3)
ckpt = torch.load(ckpt_path, map_location="cpu", weights_only=False)
model.load_state_dict(ckpt["model"])
model.eval()

# R(2+1)D-18 best
ckpt_path = hf_hub_download(
    repo_id="visionlab-ai/school-violence-detection-models",
    filename="final/final_best.pt",
)
model = create_model(backbone="r2plus1d_18", num_classes=2, pretrained=False, dropout=0.5)
ckpt = torch.load(ckpt_path, map_location="cpu", weights_only=False)
model.load_state_dict(ckpt["model"])
model.eval()
```
