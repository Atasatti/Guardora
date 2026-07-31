"use client";

import { BannedPerson } from "@/models";
import { banPerson } from "@/lib/actions/banned";
import {
  useState,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";
import { toast } from "sonner";

export default function BannedPersonsTab({
  bannedPersons,
  setBannedPersons,
}: {
  bannedPersons: BannedPerson[];
  setBannedPersons: Dispatch<SetStateAction<BannedPerson[]>>;
}) {
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [timelineName, setTimelineName] = useState("");
  const [timeline, setTimeline] = useState<
    Array<{ cameraName: string; confidence?: number; seenAt: string }>
  >([]);

  const loadTimeline = async (personId: string) => {
    const response = await fetch(
      `/api/resident/banned-persons/${personId}/timeline`,
      { cache: "no-store" }
    );
    if (!response.ok) {
      toast.error("Movement timeline could not be loaded");
      return;
    }
    const body = (await response.json()) as {
      person: { name: string };
      timeline: Array<{
        cameraName: string;
        confidence?: number;
        seenAt: string;
      }>;
    };
    setTimelineName(body.person.name);
    setTimeline(body.timeline);
  };

  /** ======================
   *  FILE UPLOAD HANDLER
   =======================*/
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      setCameraEnabled(false);
    }
  };

  /** ======================
   *  CAMERA HANDLERS
   =======================*/
  const enableCamera = async () => {
    setImagePreview(null);
    setSelectedFile(null);

    setCameraEnabled(true);

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

    const dataURL = canvas.toDataURL("image/png");
    setImagePreview(dataURL);
    setCameraEnabled(false);

    // Stop the camera
    const stream = video.srcObject as MediaStream;
    stream?.getTracks().forEach((track) => track.stop());
  };

  /** ======================
   *  ADD BANNED PERSON (FORM SUBMIT)
   =======================*/
  const handleAdd = async () => {
    if (!name.trim() || !reason.trim()) {
      toast.error("Name and reason are required");
      return;
    }

    if (!selectedFile && !imagePreview) {
      toast.error("Add one clear, front-facing face photo");
      return;
    }

    setIsAdding(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("reason", reason);

    // CASE 1: Normal File Upload
    if (selectedFile) {
      formData.append("image", selectedFile);
    }

    // CASE 2: Camera Image (dataURL → File)
    if (imagePreview && !selectedFile) {
      const blob = await (await fetch(imagePreview)).blob();
      const cameraFile = new File([blob], "camera.png", { type: "image/png" });
      formData.append("image", cameraFile);
    }

    try {
      const result = await banPerson(formData);

      if (!result.success) {
        toast.error(result.message || "Face enrollment failed");
      } else {
        setBannedPersons((prev) => [...prev, result.person]);
        toast.success("Person enrolled in live face recognition");

        // Reset Form
        setName("");
        setReason("");
        setSelectedFile(null);
        setImagePreview(null);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error submitting data");
    }

    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      {/* -----------------------------
           FORM
      -------------------------------- */}
      <div className="p-4 border rounded-md">
        <h2 className="text-xl font-semibold mb-4">Add Banned Person</h2>

        <input
          className="border p-2 rounded w-full mb-3"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="border p-2 rounded w-full mb-3"
          placeholder="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        {/* File Upload */}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mb-3"
        />

        {/* Camera */}
        <button
          onClick={enableCamera}
          className="px-4 py-2 bg-blue-600 text-white rounded mb-3"
        >
          Open Camera
        </button>

        {cameraEnabled && (
          <div className="mb-3">
            <video ref={videoRef} autoPlay className="w-64 border mb-2" />
            <br />
            <button
              onClick={capturePhoto}
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              Capture
            </button>
          </div>
        )}

        {imagePreview && (
          //eslint-disable-next-line
          <img
            src={imagePreview}
            alt="Preview"
            className="w-40 h-auto rounded mb-3"
          />
        )}

        <button
          onClick={handleAdd}
          disabled={isAdding}
          className="px-4 py-2 bg-black text-white rounded"
        >
          {isAdding ? "Adding..." : "Add Person"}
        </button>
      </div>

      {/* Hidden canvas (for camera capture) */}
      <canvas ref={canvasRef} className="hidden" />

      {/* -----------------------------
           LIST OF BANNED PEOPLE
      -------------------------------- */}
      <div className="p-4 border rounded-md">
        <h2 className="text-xl font-semibold mb-4">Banned List</h2>

        <ul className="space-y-3">
          {bannedPersons.map((person) => (
            <li
              key={person._id}
              className="flex items-center gap-4 border p-3 rounded"
            >
              {/* Enrolment photos are biometric data held in the database and
                  served through the authenticated proxy, so this cannot be a
                  direct link to the API. Records enrolled before the move have
                  no stored image; the placeholder background shows through. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/resident/banned-persons/${person._id}/image`}
                className="w-16 h-16 rounded object-cover bg-gray-300"
                alt=""
                onError={(event) => {
                  event.currentTarget.style.visibility = "hidden";
                }}
              />

              <div className="min-w-0 flex-1">
                <p className="font-semibold">{person.name}</p>
                <p className="text-sm text-gray-600">{person.reason}</p>
              </div>
              <button
                type="button"
                onClick={() => loadTimeline(person._id)}
                className="rounded border px-3 py-2 text-xs font-semibold hover:bg-muted"
              >
                Movement timeline
              </button>
            </li>
          ))}
        </ul>
      </div>
      {timelineName && (
        <div className="rounded-md border p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{timelineName}</h2>
              <p className="text-sm text-muted-foreground">
                Cross-camera face-recognition sightings
              </p>
            </div>
            <button
              type="button"
              className="text-sm text-muted-foreground"
              onClick={() => {
                setTimelineName("");
                setTimeline([]);
              }}
            >
              Close
            </button>
          </div>
          <div className="space-y-2">
            {timeline.map((sighting, index) => (
              <div
                key={`${sighting.cameraName}-${sighting.seenAt}-${index}`}
                className="flex items-center justify-between rounded border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{sighting.cameraName}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(sighting.seenAt).toLocaleString()}
                  </p>
                </div>
                <span className="font-mono text-xs">
                  {sighting.confidence == null
                    ? "—"
                    : `${Math.round(sighting.confidence * 100)}%`}
                </span>
              </div>
            ))}
            {!timeline.length && (
              <p className="rounded border border-dashed p-5 text-center text-sm text-muted-foreground">
                No sightings recorded yet.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
