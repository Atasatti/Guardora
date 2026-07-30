"""Fine-tune an Apache-2.0 RF-DETR detector for Guardora.

Run this on a Python 3.10+ machine with a CUDA GPU. The dataset can use COCO or
YOLO layout; RF-DETR detects the format automatically.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument(
        "--variant",
        choices=("nano", "small", "medium"),
        default="small",
        help="Small is the recommended accuracy/latency starting point.",
    )
    parser.add_argument("--epochs", type=int, default=100)
    parser.add_argument("--batch-size", type=int, default=4)
    parser.add_argument("--grad-accum-steps", type=int, default=4)
    parser.add_argument("--learning-rate", type=float, default=1e-4)
    return parser.parse_args()


def validate_dataset(dataset: Path) -> None:
    coco = dataset / "train" / "_annotations.coco.json"
    yolo = (dataset / "data.yaml", dataset / "train" / "images")
    if not coco.is_file() and not (yolo[0].is_file() and yolo[1].is_dir()):
        raise SystemExit(
            "Dataset layout not recognized. Supply either COCO "
            "(train/_annotations.coco.json) or YOLO "
            "(data.yaml plus train/images)."
        )


def main() -> None:
    if sys.version_info < (3, 10):
        raise SystemExit("RF-DETR requires Python 3.10 or newer.")

    args = parse_args()
    dataset = args.dataset.expanduser().resolve()
    output = args.output.expanduser().resolve()
    validate_dataset(dataset)
    output.mkdir(parents=True, exist_ok=True)

    try:
        from rfdetr import RFDETRMedium, RFDETRNano, RFDETRSmall
    except ImportError as exc:
        raise SystemExit(
            "Install the training dependencies first: "
            "python -m pip install -r requirements-rfdetr.txt"
        ) from exc

    model_class = {
        "nano": RFDETRNano,
        "small": RFDETRSmall,
        "medium": RFDETRMedium,
    }[args.variant]
    model = model_class()
    model.train(
        dataset_dir=str(dataset),
        output_dir=str(output),
        epochs=args.epochs,
        batch_size=args.batch_size,
        grad_accum_steps=args.grad_accum_steps,
        lr=args.learning_rate,
        early_stopping=True,
    )


if __name__ == "__main__":
    main()
