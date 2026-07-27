---
license: mit
language:
- en
base_model:
- Ultralytics/YOLOv8
pipeline_tag: object-detection
tags:
- surveillance
- Threat_detection
- ultralytics
- yolov8
---

# YOLOv8n based Threat Detection Model

<a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License">
</a>
<a href="https://github.com/ultralytics/ultralytics">
    <img src="https://img.shields.io/badge/YOLOv8-Nano-blue?logo=ultralytics&logoColor=white" alt="Model">
</a>
<a href="#performance-metrics">
    <img src="https://img.shields.io/badge/mAP%4050-81.1%25-darkgreen?style=flat" alt="mAP">
</a>
<a href="https://github.com/subh-775/Threat_Detection_YOLO-vs-RF-DETR">
    <img src="https://img.shields.io/badge/-Code-black?logo=github" alt="Code">
</a>

## CNNs for Object Detection 

**YOLOv8**, developed by Ultralytics, continues the legacy of the highly popular YOLO (You Only Look Once) series. This version brings significant improvements in both speed and accuracy, making it a top choice for real-time object detection tasks. Its efficient CNN-based architecture is optimized for performance on both CPUs and GPUs.

This repository features a **fine-tuned YOLOv8 Nano model** specifically trained for **Threat Detection**, designed to identify four critical threat categories with high precision and speed.

## Model Overview

**YOLOv8n Threat Detection** is a specialized computer vision model for security and surveillance. Leveraging the speed and efficiency of the YOLOv8 Nano architecture, this model accurately detects potential threats in real-time scenarios.

The threat categories are:

| Class ID | Threat Type | Description |
|----------|-------------|-------------|
| 1 | **Gun** | Any type of firearm weapon including pistols, rifles, and other firearms |
| 2 | **Explosive** | Fire, explosion scenarios, and explosive devices |
| 3 | **Grenade** | Hand grenades and similar explosive devices |
| 4 | **Knife** | Bladed weapons including knives, daggers, and sharp objects |

## Training Dataset 

The model was trained on a custom threat detection dataset, meticulously curated and annotated for robust performance across various scenarios.

### Class Distribution
![class distribution chart](https://cdn-uploads.huggingface.co/production/uploads/66c6048d0bf40704e4159a23/5t7k-SJfuZWXJTek_RPWh.png)

### Sample Annotations
![sample annotation image](https://cdn-uploads.huggingface.co/production/uploads/66c6048d0bf40704e4159a23/Mf65kxTEwfq9HPMlzwO5y.png)

## Performance Metrics

## Training performance
![results](results.png)

## Confusion matrix
![confusion_matrix](confusion_matrix.png)

## Validation Results

| **Metric**      | **Gun** | **Explosive** | **Grenade** | **Knife** | **Overall** |
|------------------|:-------:|:-------------:|:------------:|:----------:|:------------:|
| **mAP@50:95**    | 47.8%  | 48.5%  | 76.6%  | 48.2%  | **55.3%** |
| **mAP@50**       | 78.3%  | 74.1%  | 92.1%  | 80.9%  | **81.3%** |
| **Precision**    | 83.3%  | 77.8%  | 96.5%  | 79.7%  | **84.3%** |
| **Recall**       | 69.0%  | 68.2%  | 89.9%  | 78.1%  | **76.3%** |


## Test Results

| **Metric**      | **Gun** | **Explosive** | **Grenade** | **Knife** | **Overall** |
|------------------|:-------:|:-------------:|:------------:|:----------:|:------------:|
| **mAP@50:95**    | 65.3%  | 35.7%  | 83.2%  | 49.8%  | **58.5%** |
| **mAP@50**       | 93.1%  | 60.5%  | 91.1%  | 79.7%  | **81.1%** |
| **Precision**    | 96.7%  | 49.7%  | 93.1%  | 86.5%  | **81.5%** |
| **Recall**       | 83.0%  | 83.0%  | 83.0%  | 83.0%  | **83.0%** |


### Key Performance Highlights
- High Overall Accuracy: Achieved a strong 81.3% mAP@50 on the validation set, showing the model is highly effective.
- Exceptional 'Grenade' Detection: The model excels at identifying grenades, with an outstanding 92.1% mAP@50 and an extremely high 96.5% precision. This indicates a very low rate of false positives for this class.
- Strong Generalization: Reached a peak mAP@50-95 of 55.3%, demonstrating a good ability to predict bounding boxes with high precision (IoU > 0.95).
- Balanced Learning: The steady decrease in box_loss, cls_loss, and dfl_loss over 50 epochs indicates stable and balanced learning across localization, classification, and distribution focal loss tasks.

### Model Architecture
- **Base Architecture**: YOLOv8 Nano (yolov8n.pt)
- **Parameters**: ~3 Million (3,006,428 fused)
- **Computational Cost**: ~8.1 GFLOPs
- **Layers**: The final architecture consists of 129 layers, with the final detection head (Detect layer #22) customized for 4 output classes.

### Training Details

### Training Configuration
- Epochs: 50
- Image Size: 640x640 pixels
- Optimizer: AdamW
- Learning Rate: 0.00125 (automatically determined by the Ultralytics framework)
- Momentum: 0.9 (automatically determined)

### Training Strategy
- Transfer Learning: The model was initialized with pre-trained weights from the COCO dataset, transferring knowledge from 319 of the 355 original layers. This significantly accelerated learning.
- Automatic Hyperparameter Optimization: The framework automatically selected the best optimizer (AdamW) and its corresponding learning rate and momentum, removing the need for manual tuning.
- Dynamic Augmentation Strategy: For the first 40 epochs, a mosaic augmentation was used to expose the model to a wide variety of object contexts. This was strategically turned off for the final 10 epochs to allow the model to refine its performance on whole, un-altered images, leading to a final performance boost.

### Key Performance Highlights

- **81.1% mAP@50** on the test set.
- **Fast inference** thanks to the optimized YOLOv8n architecture.
- **Excellent precision** for Gun (96.7%) and Grenade (93.1%) detection on the test set.

## Model Architecture

- **Base Architecture**: YOLOv8 Nano (YOLOv8n)
- **Input Resolution**: 640×640 pixels
- **Backbone**: Optimized CNN
- **Detection Head**: Custom 4-class threat detection

## Model Files

- `best.pt` - Main model weights 

### Inference Instructions

```python
!pip install ultralytics
```

```python
# process video in batches
import cv2
from ultralytics import YOLO
from huggingface_hub import hf_hub_download
import torch
from tqdm import tqdm

# Configuration
MODEL_REPO = "Subh775/Threat-Detection-YOLOv8n"
INPUT_VIDEO = "input_video.mp4"
OUTPUT_VIDEO = "output_video.mp4"
CONFIDENCE_THRESHOLD = 0.4
BATCH_SIZE = 32  # Adjust based on GPU memory

# Setup device
device = 0 if torch.cuda.is_available() else "cpu"
print(f"Using device: {'GPU' if device == 0 else 'CPU'}")

# Load model
model_path = hf_hub_download(repo_id=MODEL_REPO, filename="weights/best.pt")
model = YOLO(model_path)

# Process video
cap = cv2.VideoCapture(INPUT_VIDEO)
frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps = int(cap.get(cv2.CAP_PROP_FPS))
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out = cv2.VideoWriter(OUTPUT_VIDEO, fourcc, fps, (frame_width, frame_height))

frames_batch = []
with tqdm(total=total_frames, desc="Processing video") as pbar:
    while cap.isOpened():
        success, frame = cap.read()
        if success:
            frames_batch.append(frame)
            
            if len(frames_batch) == BATCH_SIZE:
                # Batch inference
                results = model(frames_batch, conf=CONFIDENCE_THRESHOLD, 
                              device=device, verbose=False)
                
                # Write annotated frames
                for result in results:
                    annotated_frame = result.plot()
                    out.write(annotated_frame)
                
                pbar.update(len(frames_batch))
                frames_batch = []
        else:
            break

# Process remaining frames
if frames_batch:
    results = model(frames_batch, conf=CONFIDENCE_THRESHOLD, 
                   device=device, verbose=False)
    for result in results:
        annotated_frame = result.plot()
        out.write(annotated_frame)
    pbar.update(len(frames_batch))

cap.release()
out.release()
print(f"Processed video saved to: {OUTPUT_VIDEO}")

```

### Acknowledgments
- **Ultralytics** for the YOLOv8 architecture and framework.
- **Hugging Face** for model hosting and community support.
- **Roboflow** for the dataset.

**Disclaimer:** This model is for research and educational purposes. It should not be used for deployment in real-world security applications without further extensive validation.