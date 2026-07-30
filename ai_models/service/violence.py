"""Safe X3D violence-model loading and video-window inference."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import time
from typing import Any

import cv2
import numpy as np


@dataclass
class ViolenceWindow:
    start_seconds: float
    end_seconds: float
    probability: float


class ViolenceRuntime:
    threshold = 0.4
    clip_seconds = 4.0
    frames_per_clip = 16

    def __init__(self, checkpoint_path: Path) -> None:
        import torch
        from numpy._core.multiarray import scalar
        from pytorchvideo.models.hub import x3d_m

        class ViolenceX3D(torch.nn.Module):
            def __init__(self) -> None:
                super().__init__()
                self.backbone = x3d_m(pretrained=False)
                self.backbone.blocks[5].proj = torch.nn.Sequential(
                    torch.nn.Dropout(0.3),
                    torch.nn.Linear(2048, 2),
                )

            def forward(self, frames: Any) -> Any:
                return self.backbone(frames)

        safe_types = [scalar, np.dtype, np.dtypes.Float64DType]
        with torch.serialization.safe_globals(safe_types):
            checkpoint = torch.load(
                checkpoint_path,
                map_location="cpu",
                weights_only=True,
            )

        self.torch = torch
        self.model = ViolenceX3D()
        self.model.load_state_dict(checkpoint["model"], strict=True)
        self.model.eval()
        self.reported_metrics = checkpoint.get("final_metrics", {})

    @staticmethod
    def _prepare_frame(frame: np.ndarray) -> np.ndarray:
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        height, width = rgb.shape[:2]
        scale = 224 / min(height, width)
        resized = cv2.resize(
            rgb,
            (max(224, round(width * scale)), max(224, round(height * scale))),
            interpolation=cv2.INTER_AREA,
        )
        resized_height, resized_width = resized.shape[:2]
        top = (resized_height - 224) // 2
        left = (resized_width - 224) // 2
        return resized[top : top + 224, left : left + 224]

    def _read_clip(
        self,
        capture: cv2.VideoCapture,
        start_seconds: float,
        duration_seconds: float,
    ) -> list[np.ndarray]:
        fps = float(capture.get(cv2.CAP_PROP_FPS) or 0)
        final_readable_time = max(
            0.0,
            duration_seconds - (1 / fps if fps > 0 else 1 / 30),
        )
        end_seconds = min(
            start_seconds + self.clip_seconds,
            final_readable_time,
        )
        timestamps = np.linspace(
            start_seconds,
            max(start_seconds, end_seconds),
            self.frames_per_clip,
        )
        frames: list[np.ndarray] = []
        for timestamp in timestamps:
            capture.set(cv2.CAP_PROP_POS_MSEC, float(timestamp) * 1000)
            ok, frame = capture.read()
            if ok:
                frames.append(self._prepare_frame(frame))
        if len(frames) >= self.frames_per_clip // 2:
            frames.extend(
                [frames[-1].copy()]
                * (self.frames_per_clip - len(frames))
            )
        return frames

    def _predict(self, frames: list[np.ndarray]) -> float:
        if len(frames) != self.frames_per_clip:
            raise ValueError(
                f"Expected {self.frames_per_clip} readable frames, found {len(frames)}"
            )

        array = np.stack(frames).astype(np.float32) / 255.0
        array = (array - 0.45) / 0.225
        tensor = (
            self.torch.from_numpy(array)
            .permute(3, 0, 1, 2)
            .unsqueeze(0)
            .contiguous()
        )

        with self.torch.inference_mode():
            probabilities = self.model(tensor)
        return float(probabilities[0, 1].item())

    def analyze(
        self,
        video_path: Path,
        *,
        max_windows: int = 12,
    ) -> dict[str, Any]:
        capture = cv2.VideoCapture(str(video_path))
        if not capture.isOpened():
            raise ValueError("The supplied video could not be opened")

        fps = float(capture.get(cv2.CAP_PROP_FPS) or 0)
        frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        duration_seconds = frame_count / fps if fps > 0 else 0
        if duration_seconds <= 0:
            capture.release()
            raise ValueError("The supplied video has no readable duration")

        available_windows = max(
            1, int(np.ceil(duration_seconds / self.clip_seconds))
        )
        window_count = min(max_windows, available_windows)
        last_start = max(0.0, duration_seconds - self.clip_seconds)
        starts = np.linspace(0.0, last_start, window_count)

        started = time.perf_counter()
        windows: list[ViolenceWindow] = []
        try:
            for start in starts:
                frames = self._read_clip(capture, float(start), duration_seconds)
                probability = self._predict(frames)
                windows.append(
                    ViolenceWindow(
                        start_seconds=float(start),
                        end_seconds=min(
                            float(start) + self.clip_seconds, duration_seconds
                        ),
                        probability=probability,
                    )
                )
        finally:
            capture.release()

        latency_ms = (time.perf_counter() - started) * 1000
        best = max(windows, key=lambda item: item.probability)
        return {
            "alert": best.probability >= self.threshold,
            "confidence": best.probability,
            "latencyMs": round(latency_ms, 1),
            "durationSeconds": round(duration_seconds, 2),
            "sampledFrames": len(windows) * self.frames_per_clip,
            "timeline": [
                {
                    "startSeconds": round(window.start_seconds, 2),
                    "endSeconds": round(window.end_seconds, 2),
                    "confidence": round(window.probability, 4),
                    "label": (
                        "Violence"
                        if window.probability >= self.threshold
                        else "Normal activity"
                    ),
                }
                for window in windows
            ],
            "detections": [
                {
                    "label": "Violence",
                    "confidence": round(best.probability, 4),
                    "threshold": self.threshold,
                }
            ],
        }
