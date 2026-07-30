"""License-aware local AI WebSocket service for Guardora.

YuNet and SFace are enabled by default. The existing Ultralytics checkpoints
are disabled unless GUARDORA_ALLOW_AGPL_MODELS=true is explicitly set.
"""

from __future__ import annotations

import asyncio
import base64
import binascii
from contextlib import contextmanager
from dataclasses import dataclass
import json
import os
from pathlib import Path
import re
import tempfile
import time
from typing import Any, Iterator
import urllib.error
import urllib.request

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field


AI_MODELS_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = AI_MODELS_DIR.parent
VIDEO_DIR = Path(
    os.getenv("GUARDORA_VIDEO_DIR", str(REPO_ROOT / "fyp_web" / "public" / "videos"))
).resolve()
FACE_GALLERY_DIR = Path(
    os.getenv("GUARDORA_FACE_GALLERY", str(AI_MODELS_DIR / "face_gallery"))
).resolve()
STREAM_FPS = max(float(os.getenv("GUARDORA_STREAM_FPS", "3")), 0.25)
FACE_COSINE_THRESHOLD = float(os.getenv("GUARDORA_FACE_COSINE_THRESHOLD", "0.363"))
ALLOW_AGPL_MODELS = os.getenv("GUARDORA_ALLOW_AGPL_MODELS", "false").lower() in {
    "1",
    "true",
    "yes",
}
ALLOW_RESEARCH_MODELS = os.getenv(
    "GUARDORA_ALLOW_RESEARCH_MODELS", "false"
).lower() in {"1", "true", "yes"}
BACKEND_API_URL = os.getenv(
    "GUARDORA_BACKEND_API_URL", "http://127.0.0.1:4000/api"
).rstrip("/")
AI_SERVICE_API_KEY = os.getenv("GUARDORA_AI_SERVICE_API_KEY", "")

app = FastAPI(
    title="Guardora Local AI Service",
    version="1.0.0",
    description="Local computer-vision inference with explicit model-license controls.",
)


def _decode_data_url(value: str) -> np.ndarray:
    encoded = value.split(",", 1)[-1]
    data = base64.b64decode(encoded, validate=True)
    frame = cv2.imdecode(np.frombuffer(data, dtype=np.uint8), cv2.IMREAD_COLOR)
    if frame is None:
        raise ValueError("The supplied frame is not a valid image")
    return frame


def _encode_jpeg(frame: np.ndarray) -> str:
    ok, encoded = cv2.imencode(
        ".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 82]
    )
    if not ok:
        raise RuntimeError("OpenCV could not encode the processed frame")
    return base64.b64encode(encoded.tobytes()).decode("ascii")


def _safe_identity_id(value: str) -> str:
    identity_id = re.sub(r"[^a-zA-Z0-9_-]", "", value.strip())
    if not identity_id or identity_id != value.strip():
        raise ValueError("identityId may only contain letters, numbers, - and _")
    return identity_id


@dataclass
class GalleryEntry:
    identity_id: str
    name: str
    feature: np.ndarray
    image_path: Path


class GalleryEnrollment(BaseModel):
    identityId: str = Field(min_length=1, max_length=128)
    name: str = Field(min_length=1, max_length=160)
    image: str = Field(min_length=1)


class FaceMatchRequest(BaseModel):
    image: str = Field(min_length=1)


class LabTestRequest(BaseModel):
    modelId: str = Field(min_length=1, max_length=128)
    media: str = Field(min_length=1)
    mimeType: str = Field(min_length=1, max_length=128)
    fileName: str = Field(min_length=1, max_length=255)
    confidence: float = Field(default=0.45, ge=0.05, le=0.95)


class FaceRuntime:
    def __init__(self) -> None:
        detector_path = AI_MODELS_DIR / "face_yunet" / "face_detection_yunet_2023mar.onnx"
        recognizer_path = (
            AI_MODELS_DIR
            / "face_sface"
            / "face_recognition_sface_2021dec.onnx"
        )
        self.detector = cv2.FaceDetectorYN.create(
            str(detector_path), "", (320, 320), 0.9, 0.3, 5000
        )
        self.recognizer = cv2.FaceRecognizerSF.create(str(recognizer_path), "")
        self.gallery: dict[str, GalleryEntry] = {}
        self.gallery_warnings: list[str] = []
        self._load_gallery()

    def _faces(self, frame: np.ndarray) -> np.ndarray:
        height, width = frame.shape[:2]
        self.detector.setInputSize((width, height))
        _, faces = self.detector.detect(frame)
        return faces if faces is not None else np.empty((0, 15), dtype=np.float32)

    def _feature(self, frame: np.ndarray, face: np.ndarray) -> np.ndarray:
        aligned = self.recognizer.alignCrop(frame, face)
        return self.recognizer.feature(aligned)

    def _load_gallery(self) -> None:
        FACE_GALLERY_DIR.mkdir(parents=True, exist_ok=True)
        supported = {".jpg", ".jpeg", ".png", ".webp"}
        metadata_by_image: dict[str, dict[str, str]] = {}

        for metadata_path in sorted(FACE_GALLERY_DIR.glob("*.json")):
            try:
                metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
                image_file = Path(str(metadata["imageFile"])).name
                metadata_by_image[image_file] = {
                    "identityId": _safe_identity_id(str(metadata["identityId"])),
                    "name": str(metadata["name"]).strip(),
                }
            except (KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
                self.gallery_warnings.append(
                    f"{metadata_path.name}: invalid metadata ({exc})"
                )

        for image_path in sorted(FACE_GALLERY_DIR.iterdir()):
            if image_path.suffix.lower() not in supported:
                continue
            metadata = metadata_by_image.get(image_path.name)
            try:
                identity_id = (
                    metadata["identityId"]
                    if metadata
                    else _safe_identity_id(image_path.stem)
                )
            except ValueError as exc:
                self.gallery_warnings.append(f"{image_path.name}: {exc}")
                continue
            name = metadata["name"] if metadata else image_path.stem
            image = cv2.imread(str(image_path))
            if image is None:
                self.gallery_warnings.append(f"{image_path.name}: unreadable image")
                continue
            faces = self._faces(image)
            if len(faces) != 1:
                self.gallery_warnings.append(
                    f"{image_path.name}: expected one face, found {len(faces)}"
                )
                continue
            self.gallery[identity_id] = GalleryEntry(
                identity_id=identity_id,
                name=name,
                feature=self._feature(image, faces[0]),
                image_path=image_path,
            )

    def enroll(
        self, identity_id: str, name: str, frame: np.ndarray
    ) -> GalleryEntry:
        identity_id = _safe_identity_id(identity_id)
        name = name.strip()
        if not name:
            raise ValueError("Name is required")

        faces = self._faces(frame)
        if len(faces) != 1:
            raise ValueError(
                f"Enrollment image must contain exactly one clear face; found {len(faces)}"
            )

        ok, encoded = cv2.imencode(
            ".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 95]
        )
        if not ok:
            raise ValueError("Could not encode the enrollment image")

        FACE_GALLERY_DIR.mkdir(parents=True, exist_ok=True)
        image_path = FACE_GALLERY_DIR / f"{identity_id}.jpg"
        metadata_path = FACE_GALLERY_DIR / f"{identity_id}.json"
        image_temp = FACE_GALLERY_DIR / f".{identity_id}.jpg.tmp"
        metadata_temp = FACE_GALLERY_DIR / f".{identity_id}.json.tmp"

        image_temp.write_bytes(encoded.tobytes())
        metadata_temp.write_text(
            json.dumps(
                {
                    "identityId": identity_id,
                    "name": name,
                    "imageFile": image_path.name,
                },
                ensure_ascii=True,
                indent=2,
            ),
            encoding="utf-8",
        )
        image_temp.replace(image_path)
        metadata_temp.replace(metadata_path)

        entry = GalleryEntry(
            identity_id=identity_id,
            name=name,
            feature=self._feature(frame, faces[0]),
            image_path=image_path,
        )
        self.gallery[identity_id] = entry
        return entry

    def remove(self, identity_id: str) -> bool:
        identity_id = _safe_identity_id(identity_id)
        entry = self.gallery.pop(identity_id, None)
        paths = {
            FACE_GALLERY_DIR / f"{identity_id}.json",
            FACE_GALLERY_DIR / f"{identity_id}.jpg",
        }
        if entry:
            paths.add(entry.image_path)

        removed = entry is not None
        for current_path in paths:
            try:
                current_path.unlink()
                removed = True
            except FileNotFoundError:
                pass
        return removed

    def analyze(self, frame: np.ndarray) -> tuple[np.ndarray, list[dict[str, Any]]]:
        detections: list[dict[str, Any]] = []
        for face in self._faces(frame):
            x, y, width, height = [int(value) for value in face[:4]]
            best_name = ""
            best_score = -1.0

            if self.gallery:
                feature = self._feature(frame, face)
                for entry in self.gallery.values():
                    score = float(
                        self.recognizer.match(
                            feature,
                            entry.feature,
                            cv2.FaceRecognizerSF_FR_COSINE,
                        )
                    )
                    if score > best_score:
                        best_name, best_score = entry.name, score

            is_match = best_score >= FACE_COSINE_THRESHOLD
            color = (40, 40, 230) if is_match else (45, 180, 80)
            label = (
                f"BANNED: {best_name} ({best_score:.2f})"
                if is_match
                else "Face detected"
            )
            cv2.rectangle(frame, (x, y), (x + width, y + height), color, 2)
            cv2.putText(
                frame,
                label,
                (x, max(22, y - 8)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                color,
                2,
                cv2.LINE_AA,
            )
            detections.append(
                {
                    "label": best_name if is_match else "Unknown face",
                    "confidence": round(
                        best_score if best_name else float(face[-1]), 4
                    ),
                    "matched": is_match,
                    "box": [x, y, x + width, y + height],
                }
            )

        return frame, detections

    def process(self, frame: np.ndarray) -> tuple[np.ndarray, bool, str]:
        frame, detections = self.analyze(frame)
        match = next(
            (detection for detection in detections if detection["matched"]), None
        )
        alert_name = str(match["label"]) if match else ""
        return frame, bool(alert_name), alert_name


class DetectionRuntime:
    def __init__(self) -> None:
        self.models: dict[str, tuple[str, Any]] = {}
        self.error = ""

        if not ALLOW_AGPL_MODELS:
            self.error = (
                "Disabled: existing Ultralytics models require explicit "
                "GUARDORA_ALLOW_AGPL_MODELS=true opt-in"
            )
            return

        try:
            from ultralytics import YOLO

            self.models = {
                "weapon-threat-yolov8n": (
                    "DANGEROUS_OBJECT",
                    YOLO(
                        str(
                            AI_MODELS_DIR
                            / "weapon_threat_yolov8n"
                            / "weights"
                            / "best.pt"
                        )
                    ),
                ),
                "fire-smoke-yolov8n": (
                    "FIRE_SMOKE",
                    YOLO(str(AI_MODELS_DIR / "fire_smoke_yolov8n" / "best.pt")),
                ),
            }
        except Exception as exc:  # runtime diagnostics must remain available
            self.error = f"Could not load opt-in detection models: {exc}"
            self.models = {}

    def process_selected(
        self,
        frame: np.ndarray,
        model_id: str,
        *,
        confidence: float = 0.45,
    ) -> tuple[np.ndarray, list[dict[str, Any]], str]:
        current = self.models.get(model_id)
        if current is None:
            raise ValueError(
                self.error or f"Model {model_id} is not enabled in this service"
            )

        alert_type, model = current
        result = model.predict(frame, verbose=False, conf=confidence)[0]
        detections: list[dict[str, Any]] = []
        names = result.names
        for box in result.boxes:
            class_id = int(box.cls[0].item())
            label = (
                str(names.get(class_id, class_id))
                if isinstance(names, dict)
                else str(names[class_id])
            )
            coordinates = [round(float(value), 1) for value in box.xyxy[0].tolist()]
            detections.append(
                {
                    "label": label,
                    "confidence": round(float(box.conf[0].item()), 4),
                    "box": coordinates,
                }
            )
        return result.plot(), detections, alert_type

    def process(self, frame: np.ndarray) -> tuple[np.ndarray, str]:
        alert_type = ""
        annotated = frame
        for model_id in self.models:
            annotated, detections, current_type = self.process_selected(
                annotated, model_id
            )
            if detections and not alert_type:
                alert_type = current_type
        return annotated, alert_type


face_runtime: FaceRuntime | None = None
face_runtime_error = ""
try:
    face_runtime = FaceRuntime()
except Exception as exc:
    face_runtime_error = str(exc)

detection_runtime = DetectionRuntime()

violence_runtime: Any | None = None
violence_runtime_error = ""
if ALLOW_RESEARCH_MODELS:
    try:
        from .violence import ViolenceRuntime

        violence_runtime = ViolenceRuntime(
            AI_MODELS_DIR
            / "violence_x3d"
            / "final"
            / "final_x3d_realtime.pt"
        )
    except Exception as exc:
        violence_runtime_error = f"Could not load research X3D model: {exc}"
else:
    violence_runtime_error = (
        "Disabled: research checkpoint requires explicit "
        "GUARDORA_ALLOW_RESEARCH_MODELS=true opt-in"
    )


def _decode_media(value: str) -> bytes:
    try:
        media = base64.b64decode(value, validate=True)
    except (ValueError, binascii.Error) as exc:
        raise ValueError("The supplied media is not valid base64") from exc
    if not media:
        raise ValueError("The supplied media is empty")
    if len(media) > 50 * 1024 * 1024:
        raise ValueError("Media exceeds the 50 MB AI Lab limit")
    return media


@contextmanager
def _temporary_media(media: bytes, file_name: str) -> Iterator[Path]:
    suffix = Path(file_name).suffix.lower()
    supported = {".mp4", ".mov", ".avi", ".mkv", ".webm"}
    if suffix not in supported:
        suffix = ".mp4"
    temporary = tempfile.NamedTemporaryFile(
        prefix="guardora-lab-",
        suffix=suffix,
        delete=False,
    )
    path = Path(temporary.name)
    try:
        temporary.write(media)
        temporary.close()
        yield path
    finally:
        temporary.close()
        try:
            path.unlink()
        except FileNotFoundError:
            pass


def _sample_detection_video(
    video_path: Path,
    model_id: str,
    confidence: float,
    *,
    max_samples: int = 18,
) -> dict[str, Any]:
    capture = cv2.VideoCapture(str(video_path))
    if not capture.isOpened():
        raise ValueError("The supplied video could not be opened")

    fps = float(capture.get(cv2.CAP_PROP_FPS) or 0)
    frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    if frame_count <= 0:
        capture.release()
        raise ValueError("The supplied video has no readable frames")

    duration_seconds = frame_count / fps if fps > 0 else 0
    sample_count = min(max_samples, frame_count)
    positions = np.linspace(0, frame_count - 1, sample_count, dtype=int)
    best_frame: np.ndarray | None = None
    best_confidence = -1.0
    timeline: list[dict[str, Any]] = []
    summary: dict[str, dict[str, Any]] = {}

    started = time.perf_counter()
    try:
        for position in positions:
            capture.set(cv2.CAP_PROP_POS_FRAMES, int(position))
            ok, frame = capture.read()
            if not ok:
                continue

            annotated, detections, _ = detection_runtime.process_selected(
                frame,
                model_id,
                confidence=confidence,
            )
            frame_confidence = max(
                (float(detection["confidence"]) for detection in detections),
                default=0.0,
            )
            if best_frame is None or frame_confidence > best_confidence:
                best_frame = annotated
                best_confidence = frame_confidence

            timestamp = float(position) / fps if fps > 0 else 0
            for detection in detections:
                label = str(detection["label"])
                existing = summary.get(label)
                if (
                    existing is None
                    or detection["confidence"] > existing["confidence"]
                ):
                    summary[label] = detection
                timeline.append(
                    {
                        "startSeconds": round(timestamp, 2),
                        "endSeconds": round(timestamp, 2),
                        "label": label,
                        "confidence": detection["confidence"],
                    }
                )
    finally:
        capture.release()

    if best_frame is None:
        raise ValueError("No frames could be decoded from the supplied video")

    latency_ms = (time.perf_counter() - started) * 1000
    return {
        "alert": bool(timeline),
        "confidence": max(best_confidence, 0.0),
        "latencyMs": round(latency_ms, 1),
        "durationSeconds": round(duration_seconds, 2),
        "sampledFrames": sample_count,
        "detections": sorted(
            summary.values(),
            key=lambda item: float(item["confidence"]),
            reverse=True,
        ),
        "timeline": timeline[:80],
        "annotatedFrame": _encode_jpeg(best_frame),
    }


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "face": {
            "ready": face_runtime is not None,
            "detector": "OpenCV YuNet (MIT)",
            "recognizer": "OpenCV SFace (Apache-2.0)",
            "gallerySize": len(face_runtime.gallery) if face_runtime else 0,
            "warnings": face_runtime.gallery_warnings if face_runtime else [],
            "error": face_runtime_error or None,
        },
        "detection": {
            "ready": bool(detection_runtime.models),
            "mode": "AGPL opt-in demo" if ALLOW_AGPL_MODELS else "disabled",
            "error": detection_runtime.error or None,
        },
        "violence": {
            "ready": violence_runtime is not None,
            "mode": (
                "research opt-in demo" if ALLOW_RESEARCH_MODELS else "disabled"
            ),
            "error": violence_runtime_error or None,
        },
        "videoDirectory": str(VIDEO_DIR),
    }


@app.get("/models")
def models() -> dict[str, Any]:
    return {
        "active": [
            {
                "id": "face-detection-yunet",
                "license": "MIT",
                "status": "ready" if face_runtime else "error",
            },
            {
                "id": "face-recognition-sface",
                "license": "Apache-2.0",
                "status": "ready" if face_runtime else "error",
            },
        ],
        "restricted": [
            {
                "id": "weapon-threat-yolov8n",
                "license": "Ultralytics runtime: AGPL-3.0 or enterprise",
                "status": "demo opt-in" if ALLOW_AGPL_MODELS else "disabled",
            },
            {
                "id": "fire-smoke-yolov8n",
                "license": "AGPL-3.0",
                "status": "demo opt-in" if ALLOW_AGPL_MODELS else "disabled",
            },
            {
                "id": "violence-x3d",
                "license": "Research checkpoint; deployment terms need review",
                "status": (
                    "research opt-in" if violence_runtime is not None else "disabled"
                ),
            },
        ],
        "trainingRequired": ["RF-DETR fire/smoke", "RF-DETR weapon/threat", "X3D violence"],
    }


@app.get("/lab/models")
def lab_models() -> dict[str, Any]:
    return {
        "models": [
            {
                "id": "weapon-threat-yolov8n",
                "name": "Weapon & threat detection",
                "description": "Detects guns, knives, grenades and explosives.",
                "input": ["image", "video"],
                "license": "AGPL runtime / enterprise license required",
                "status": (
                    "ready"
                    if "weapon-threat-yolov8n" in detection_runtime.models
                    else "disabled"
                ),
                "error": (
                    None
                    if "weapon-threat-yolov8n" in detection_runtime.models
                    else detection_runtime.error
                ),
            },
            {
                "id": "fire-smoke-yolov8n",
                "name": "Fire & smoke detection",
                "description": "Detects visible fire and smoke in CCTV frames.",
                "input": ["image", "video"],
                "license": "AGPL-3.0 demo only",
                "status": (
                    "ready"
                    if "fire-smoke-yolov8n" in detection_runtime.models
                    else "disabled"
                ),
                "error": (
                    None
                    if "fire-smoke-yolov8n" in detection_runtime.models
                    else detection_runtime.error
                ),
            },
            {
                "id": "violence-x3d",
                "name": "Violence activity classification",
                "description": "Analyzes temporal 4-second windows with X3D-M.",
                "input": ["video"],
                "license": "Research evaluation only",
                "status": "ready" if violence_runtime is not None else "disabled",
                "error": None if violence_runtime is not None else violence_runtime_error,
            },
            {
                "id": "face-recognition-sface",
                "name": "Banned-person recognition",
                "description": "YuNet face detection with SFace gallery matching.",
                "input": ["image"],
                "license": "MIT + Apache-2.0",
                "status": "ready" if face_runtime is not None else "error",
                "error": face_runtime_error or None,
            },
        ]
    }


@app.post("/lab/test")
def run_lab_test(payload: LabTestRequest) -> dict[str, Any]:
    media = _decode_media(payload.media)
    is_video = payload.mimeType.lower().startswith("video/")

    if payload.modelId == "face-recognition-sface":
        if is_video:
            raise HTTPException(
                status_code=422,
                detail="Face recognition uses image input in AI Lab; use Surveillance for live video",
            )
        if face_runtime is None:
            raise HTTPException(
                status_code=503,
                detail=face_runtime_error or "Face runtime unavailable",
            )
        frame = cv2.imdecode(
            np.frombuffer(media, dtype=np.uint8), cv2.IMREAD_COLOR
        )
        if frame is None:
            raise HTTPException(status_code=422, detail="Image could not be decoded")
        started = time.perf_counter()
        annotated, detections = face_runtime.analyze(frame)
        latency_ms = (time.perf_counter() - started) * 1000
        confidence = max(
            (float(detection["confidence"]) for detection in detections),
            default=0.0,
        )
        return {
            "modelId": payload.modelId,
            "mediaType": "image",
            "alert": any(detection["matched"] for detection in detections),
            "confidence": confidence,
            "latencyMs": round(latency_ms, 1),
            "sampledFrames": 1,
            "detections": detections,
            "timeline": [],
            "annotatedFrame": _encode_jpeg(annotated),
        }

    if payload.modelId in {
        "weapon-threat-yolov8n",
        "fire-smoke-yolov8n",
    }:
        if payload.modelId not in detection_runtime.models:
            raise HTTPException(
                status_code=503,
                detail=detection_runtime.error or "Detection model unavailable",
            )

        if is_video:
            try:
                with _temporary_media(media, payload.fileName) as media_path:
                    result = _sample_detection_video(
                        media_path,
                        payload.modelId,
                        payload.confidence,
                    )
            except ValueError as exc:
                raise HTTPException(status_code=422, detail=str(exc)) from exc
            return {
                "modelId": payload.modelId,
                "mediaType": "video",
                **result,
            }

        frame = cv2.imdecode(
            np.frombuffer(media, dtype=np.uint8), cv2.IMREAD_COLOR
        )
        if frame is None:
            raise HTTPException(status_code=422, detail="Image could not be decoded")
        started = time.perf_counter()
        try:
            annotated, detections, _ = detection_runtime.process_selected(
                frame,
                payload.modelId,
                confidence=payload.confidence,
            )
        except ValueError as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        latency_ms = (time.perf_counter() - started) * 1000
        confidence = max(
            (float(detection["confidence"]) for detection in detections),
            default=0.0,
        )
        return {
            "modelId": payload.modelId,
            "mediaType": "image",
            "alert": bool(detections),
            "confidence": confidence,
            "latencyMs": round(latency_ms, 1),
            "sampledFrames": 1,
            "detections": detections,
            "timeline": [],
            "annotatedFrame": _encode_jpeg(annotated),
        }

    if payload.modelId == "violence-x3d":
        if not is_video:
            raise HTTPException(
                status_code=422, detail="X3D violence analysis requires a video"
            )
        if violence_runtime is None:
            raise HTTPException(
                status_code=503,
                detail=violence_runtime_error or "Violence runtime unavailable",
            )
        try:
            with _temporary_media(media, payload.fileName) as media_path:
                result = violence_runtime.analyze(media_path)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        return {
            "modelId": payload.modelId,
            "mediaType": "video",
            "annotatedFrame": None,
            **result,
        }

    raise HTTPException(status_code=404, detail="Unknown or unapproved AI Lab model")


@app.get("/gallery")
def gallery() -> dict[str, Any]:
    if face_runtime is None:
        raise HTTPException(
            status_code=503, detail=face_runtime_error or "Face runtime unavailable"
        )
    return {
        "count": len(face_runtime.gallery),
        "persons": [
            {"identityId": entry.identity_id, "name": entry.name}
            for entry in face_runtime.gallery.values()
        ],
    }


@app.post("/gallery/enroll")
def enroll_gallery(payload: GalleryEnrollment) -> dict[str, Any]:
    if face_runtime is None:
        raise HTTPException(
            status_code=503, detail=face_runtime_error or "Face runtime unavailable"
        )
    try:
        frame = _decode_data_url(payload.image)
        entry = face_runtime.enroll(payload.identityId, payload.name, frame)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return {
        "success": True,
        "identityId": entry.identity_id,
        "name": entry.name,
        "gallerySize": len(face_runtime.gallery),
    }


@app.delete("/gallery/{identity_id}")
def delete_gallery_identity(identity_id: str) -> dict[str, Any]:
    if face_runtime is None:
        raise HTTPException(
            status_code=503, detail=face_runtime_error or "Face runtime unavailable"
        )
    try:
        removed = face_runtime.remove(identity_id)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {
        "success": True,
        "removed": removed,
        "gallerySize": len(face_runtime.gallery),
    }


@app.post("/face/match")
def match_face(payload: FaceMatchRequest) -> dict[str, Any]:
    if face_runtime is None:
        raise HTTPException(
            status_code=503, detail=face_runtime_error or "Face runtime unavailable"
        )
    try:
        frame = _decode_data_url(payload.image)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    _, has_alert, name = face_runtime.process(frame)
    return {"hasAlert": has_alert, "name": name}


def _video_path(video_name: str) -> Path | None:
    safe_name = Path(video_name).name
    if safe_name != video_name or safe_name in {"", ".", ".."}:
        return None
    candidate = (VIDEO_DIR / safe_name).with_suffix(".mp4").resolve()
    if candidate.parent != VIDEO_DIR or not candidate.is_file():
        return None
    return candidate


def _camera_source(camera_id: str) -> str:
    if not re.fullmatch(r"[a-fA-F0-9]{24}", camera_id):
        raise ValueError("Invalid camera identifier")
    request = urllib.request.Request(
        f"{BACKEND_API_URL}/cameras/{camera_id}/source",
        headers={"x-ai-service-key": AI_SERVICE_API_KEY},
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, json.JSONDecodeError) as exc:
        raise ValueError("Camera configuration could not be loaded") from exc
    source_url = str(payload.get("sourceUrl", "")).strip()
    if not source_url.startswith(("rtsp://", "rtsps://", "http://", "https://")):
        raise ValueError("Camera source is unsupported")
    return source_url


@app.websocket("/ws/{video_name}")
async def video_stream(websocket: WebSocket, video_name: str) -> None:
    await websocket.accept()
    video_path = _video_path(video_name)
    if video_path is None:
        await websocket.send_json({"error": "Video not found", "video": video_name})
        await websocket.close(code=1008)
        return

    capture = cv2.VideoCapture(str(video_path))
    if not capture.isOpened():
        await websocket.send_json(
            {"error": "Video could not be opened", "video": video_name}
        )
        await websocket.close(code=1011)
        capture.release()
        return

    try:
        while True:
            ok, frame = capture.read()
            if not ok:
                capture.set(cv2.CAP_PROP_POS_FRAMES, 0)
                await asyncio.sleep(1 / STREAM_FPS)
                continue

            frame, face_alert, name = (
                face_runtime.process(frame)
                if face_runtime is not None
                else (frame, False, "")
            )
            frame, detection_alert = detection_runtime.process(frame)
            alert_type = "BANNED_PERSON" if face_alert else detection_alert
            await websocket.send_json(
                {
                    "frame": _encode_jpeg(frame),
                    "hasAlert": bool(alert_type),
                    "alertType": alert_type,
                    "name": name,
                }
            )
            await asyncio.sleep(1 / STREAM_FPS)
    except (WebSocketDisconnect, RuntimeError):
        pass
    finally:
        capture.release()


@app.websocket("/ws_camera/{camera_id}")
async def camera_stream(websocket: WebSocket, camera_id: str) -> None:
    await websocket.accept()
    try:
        source_url = await asyncio.to_thread(_camera_source, camera_id)
    except ValueError as exc:
        await websocket.send_json({"error": str(exc), "cameraId": camera_id})
        await websocket.close(code=1008)
        return

    capture = cv2.VideoCapture(source_url)
    if not capture.isOpened():
        await websocket.send_json(
            {"error": "Camera stream could not be opened", "cameraId": camera_id}
        )
        await websocket.close(code=1011)
        capture.release()
        return

    try:
        while True:
            ok, frame = await asyncio.to_thread(capture.read)
            if not ok:
                await websocket.send_json(
                    {"error": "Camera stopped returning frames", "cameraId": camera_id}
                )
                await asyncio.sleep(1)
                continue
            frame, face_alert, name = (
                face_runtime.process(frame)
                if face_runtime is not None
                else (frame, False, "")
            )
            frame, detection_alert = detection_runtime.process(frame)
            alert_type = "BANNED_PERSON" if face_alert else detection_alert
            await websocket.send_json(
                {
                    "frame": _encode_jpeg(frame),
                    "hasAlert": bool(alert_type),
                    "alertType": alert_type,
                    "name": name,
                    "cameraId": camera_id,
                }
            )
            await asyncio.sleep(1 / STREAM_FPS)
    except (WebSocketDisconnect, RuntimeError):
        pass
    finally:
        capture.release()


@app.websocket("/ws_face")
async def face_stream(websocket: WebSocket) -> None:
    await websocket.accept()
    if face_runtime is None:
        await websocket.send_json({"error": face_runtime_error or "Face runtime unavailable"})
        await websocket.close(code=1011)
        return

    try:
        while True:
            payload = json.loads(await websocket.receive_text())
            frame = _decode_data_url(str(payload.get("frame", "")))
            frame, has_alert, name = face_runtime.process(frame)
            await websocket.send_json(
                {
                    "frame": _encode_jpeg(frame),
                    "hasAlert": has_alert,
                    "alertType": "BANNED_PERSON" if has_alert else "",
                    "name": name,
                }
            )
    except (WebSocketDisconnect, RuntimeError):
        pass
    except (ValueError, json.JSONDecodeError) as exc:
        await websocket.send_json({"error": str(exc)})
        await websocket.close(code=1003)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app:app",
        host=os.getenv("GUARDORA_AI_HOST", "127.0.0.1"),
        port=int(os.getenv("GUARDORA_AI_PORT", "8001")),
        reload=False,
    )
