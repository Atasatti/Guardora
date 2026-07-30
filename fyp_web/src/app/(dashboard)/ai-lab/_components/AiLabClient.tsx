"use client";

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileImage,
  FileText,
  FileVideo2,
  Flame,
  FlaskConical,
  Gauge,
  Loader2,
  LockKeyhole,
  ScanFace,
  ShieldAlert,
  Sparkles,
  UploadCloud,
  Video,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ModelStatus = "ready" | "disabled" | "error";

interface LabModel {
  id: string;
  name: string;
  description: string;
  input: Array<"text" | "image" | "video">;
  license: string;
  status: ModelStatus;
  error?: string | null;
}

interface Detection {
  label: string;
  confidence: number;
  matched?: boolean;
  threshold?: number;
  box?: number[];
}

interface TimelineEvent {
  startSeconds: number;
  endSeconds: number;
  label: string;
  confidence: number;
}

interface LabResult {
  modelId: string;
  mediaType: "text" | "image" | "video";
  alert: boolean;
  confidence: number;
  latencyMs: number;
  sampledFrames: number;
  durationSeconds?: number;
  detections: Detection[];
  timeline: TimelineEvent[];
  annotatedFrame?: string | null;
  moderation?: {
    isSafe: boolean;
    flaggedCategory: string;
    reason: string;
    confidence: string;
    provider: string;
  };
}

const MODEL_ACCENTS: Record<
  string,
  {
    icon: typeof ShieldAlert;
    color: string;
    surface: string;
  }
> = {
  "granite3-guardian-2b": {
    icon: FileText,
    color: "text-violet-600",
    surface: "bg-violet-500/10",
  },
  "weapon-threat-yolov8n": {
    icon: ShieldAlert,
    color: "text-rose-600",
    surface: "bg-rose-500/10",
  },
  "fire-smoke-yolov8n": {
    icon: Flame,
    color: "text-orange-600",
    surface: "bg-orange-500/10",
  },
  "violence-x3d": {
    icon: Activity,
    color: "text-amber-600",
    surface: "bg-amber-500/10",
  },
  "face-recognition-sface": {
    icon: ScanFace,
    color: "text-cyan-600",
    surface: "bg-cyan-500/10",
  },
};

const formatLatency = (latencyMs: number) =>
  latencyMs >= 1000
    ? `${(latencyMs / 1000).toFixed(2)} s`
    : `${Math.round(latencyMs)} ms`;

const formatTime = (seconds: number) => {
  const wholeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(wholeSeconds / 60);
  return `${minutes}:${String(wholeSeconds % 60).padStart(2, "0")}`;
};

export default function AiLabClient() {
  const [models, setModels] = useState<LabModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [text, setText] = useState("");
  const [confidence, setConfidence] = useState(0.45);
  const [result, setResult] = useState<LabResult | null>(null);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedModel = useMemo(
    () => models.find((model) => model.id === selectedModelId) || null,
    [models, selectedModelId]
  );
  const isTextModel = selectedModel?.input.includes("text") ?? false;
  const isVideoOnly =
    selectedModel?.input.length === 1 &&
    selectedModel.input.includes("video");
  const readyModels = models.filter((model) => model.status === "ready").length;
  const accent =
    MODEL_ACCENTS[selectedModelId] || MODEL_ACCENTS["granite3-guardian-2b"];
  const SelectedIcon = accent.icon;

  useEffect(() => {
    let active = true;

    const loadModels = async () => {
      setModelsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/ai-lab/models`, {
          credentials: "include",
          cache: "no-store",
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.message || "Could not load AI models");
        }
        if (!active) return;

        const loadedModels = (payload.models || []) as LabModel[];
        setModels(loadedModels);
        const firstReady =
          loadedModels.find(
            (model) =>
              model.status === "ready" &&
              model.id === "weapon-threat-yolov8n"
          ) || loadedModels.find((model) => model.status === "ready");
        setSelectedModelId(firstReady?.id || loadedModels[0]?.id || "");
      } catch (currentError) {
        if (!active) return;
        setError(
          currentError instanceof Error
            ? currentError.message
            : "Could not load AI models"
        );
      } finally {
        if (active) setModelsLoading(false);
      }
    };

    loadModels();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const clearInput = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl("");
    setText("");
    setResult(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [previewUrl]);

  const chooseFile = useCallback(
    (file: File | null) => {
      if (!file) return;
      const isSupported =
        file.type.startsWith("image/") || file.type.startsWith("video/");
      if (!isSupported) {
        toast.error("Choose an image or video file");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error("Maximum file size is 50 MB");
        return;
      }
      if (isVideoOnly && !file.type.startsWith("video/")) {
        toast.error("This model requires a video");
        return;
      }
      if (
        selectedModelId === "face-recognition-sface" &&
        !file.type.startsWith("image/")
      ) {
        toast.error("Face recognition accepts an image in Model Lab");
        return;
      }

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError("");
    },
    [isVideoOnly, previewUrl, selectedModelId]
  );

  const handleModelChange = (value: string) => {
    clearInput();
    setSelectedModelId(value);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    chooseFile(event.dataTransfer.files?.[0] || null);
  };

  const runTest = async () => {
    if (!selectedModel) return;
    if (selectedModel.status !== "ready") {
      toast.error(selectedModel.error || "This model is not available");
      return;
    }
    if (isTextModel && !text.trim()) {
      toast.error("Enter text to analyze");
      return;
    }
    if (!isTextModel && !selectedFile) {
      toast.error("Choose an image or video");
      return;
    }

    setIsRunning(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("modelId", selectedModel.id);
      formData.append("confidence", String(confidence));
      if (isTextModel) formData.append("text", text.trim());
      if (selectedFile) formData.append("file", selectedFile);

      const response = await fetch(`${API_BASE_URL}/ai-lab/test`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || "AI analysis failed");
      }
      setResult(payload.result as LabResult);
      toast.success("AI analysis completed");
    } catch (currentError) {
      const message =
        currentError instanceof Error
          ? currentError.message
          : "AI analysis failed";
      setError(message);
      toast.error(message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-primary/20 bg-primary/5 text-primary"
            >
              <FlaskConical className="mr-1 size-3.5" />
              Controlled evaluation
            </Badge>
            <Badge variant="secondary">
              <LockKeyhole className="mr-1 size-3.5" />
              Admin only
            </Badge>
          </div>
          <h1 className="page-title">AI Model Lab</h1>
          <p className="page-description max-w-2xl">
            Run approved Guardora models against text, images and video. Review
            confidence, timing and detection evidence before enabling a model
            in operations.
          </p>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="overflow-hidden">
          <CardContent className="flex items-center gap-4 p-5">
            <span className="grid size-11 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold tracking-tight">
                {modelsLoading ? "—" : `${readyModels}/${models.length}`}
              </p>
              <p className="text-sm text-muted-foreground">Models ready</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <span className="grid size-11 place-items-center rounded-2xl bg-blue-500/10 text-blue-600">
              <Gauge className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold tracking-tight">50 MB</p>
              <p className="text-sm text-muted-foreground">Upload limit</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <span className="grid size-11 place-items-center rounded-2xl bg-violet-500/10 text-violet-600">
              <Sparkles className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold tracking-tight">
                Auto-delete
              </p>
              <p className="text-sm text-muted-foreground">
                Test media after inference
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid items-start gap-6 xl:grid-cols-[minmax(340px,0.82fr)_minmax(0,1.55fr)]">
        <Card className="xl:sticky xl:top-24">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <FlaskConical className="size-4 text-primary" />
              Configure test
            </CardTitle>
            <CardDescription>
              Only checksum-verified models are available.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-5">
            <div className="space-y-2">
              <Label htmlFor="model-select">Approved model</Label>
              <Select
                value={selectedModelId}
                onValueChange={handleModelChange}
                disabled={modelsLoading}
              >
                <SelectTrigger id="model-select" className="w-full">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent align="start">
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedModel && (
              <div className="rounded-2xl border bg-muted/35 p-4">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-xl",
                      accent.surface,
                      accent.color
                    )}
                  >
                    <SelectedIcon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{selectedModel.name}</p>
                      <Badge
                        variant={
                          selectedModel.status === "ready"
                            ? "default"
                            : "secondary"
                        }
                        className={cn(
                          "capitalize",
                          selectedModel.status === "ready" &&
                            "bg-emerald-600 hover:bg-emerald-600"
                        )}
                      >
                        {selectedModel.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {selectedModel.description}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedModel.input.map((input) => (
                    <Badge key={input} variant="outline" className="capitalize">
                      {input}
                    </Badge>
                  ))}
                  <Badge variant="outline">{selectedModel.license}</Badge>
                </div>
                {selectedModel.status !== "ready" && selectedModel.error && (
                  <p className="mt-3 rounded-xl bg-amber-500/10 p-2.5 text-xs leading-5 text-amber-700 dark:text-amber-300">
                    {selectedModel.error}
                  </p>
                )}
              </div>
            )}

            {isTextModel ? (
              <div className="space-y-2">
                <Label htmlFor="lab-text">Content sample</Label>
                <Textarea
                  id="lab-text"
                  value={text}
                  onChange={(event) => {
                    setText(event.target.value);
                    setResult(null);
                  }}
                  placeholder="Enter a post, message or marketplace listing to screen…"
                  className="min-h-44 resize-y"
                  maxLength={8000}
                />
                <p className="text-right text-xs text-muted-foreground">
                  {text.length.toLocaleString()} / 8,000
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Test media</Label>
                  <span className="text-xs text-muted-foreground">
                    Max 50 MB
                  </span>
                </div>

                {!selectedFile ? (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={cn(
                      "group grid min-h-52 cursor-pointer place-items-center rounded-2xl border border-dashed p-6 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary",
                      isDragging
                        ? "border-primary bg-primary/8"
                        : "border-border bg-muted/25 hover:border-primary/45 hover:bg-primary/[0.035]"
                    )}
                  >
                    <div>
                      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-card text-primary shadow-sm ring-1 ring-border">
                        <UploadCloud className="size-5" />
                      </span>
                      <p className="mt-4 text-sm font-semibold">
                        Drop a file or browse
                      </p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {isVideoOnly
                          ? "MP4, MOV, AVI or WebM"
                          : "JPG, PNG, WebP, MP4, MOV or WebM"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border bg-black">
                    <div className="relative aspect-video">
                      {selectedFile.type.startsWith("video/") ? (
                        <video
                          src={previewUrl}
                          controls
                          className="size-full object-contain"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={previewUrl}
                          alt="Selected test media"
                          className="size-full object-contain"
                        />
                      )}
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        onClick={clearInput}
                        className="absolute right-2 top-2 size-8 rounded-full"
                        aria-label="Remove selected file"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-3 bg-card px-3 py-2.5">
                      {selectedFile.type.startsWith("video/") ? (
                        <FileVideo2 className="size-4 text-primary" />
                      ) : (
                        <FileImage className="size-4 text-primary" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">
                          {selectedFile.name}
                        </p>
                        <p className="text-[0.7rem] text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept={
                    isVideoOnly
                      ? "video/*"
                      : selectedModelId === "face-recognition-sface"
                        ? "image/*"
                        : "image/*,video/*"
                  }
                  onChange={(event) =>
                    chooseFile(event.target.files?.[0] || null)
                  }
                />
              </div>
            )}

            {!isTextModel &&
              selectedModelId !== "face-recognition-sface" &&
              selectedModelId !== "violence-x3d" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="confidence">Confidence threshold</Label>
                    <span className="rounded-lg bg-muted px-2 py-1 text-xs font-semibold">
                      {Math.round(confidence * 100)}%
                    </span>
                  </div>
                  <input
                    id="confidence"
                    type="range"
                    min="0.2"
                    max="0.9"
                    step="0.05"
                    value={confidence}
                    onChange={(event) =>
                      setConfidence(Number(event.target.value))
                    }
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-[0.68rem] text-muted-foreground">
                    <span>More recall</span>
                    <span>Fewer false alerts</span>
                  </div>
                </div>
              )}

            {error && (
              <div className="flex gap-2 rounded-xl border border-destructive/20 bg-destructive/8 p-3 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <Button
              onClick={runTest}
              disabled={
                isRunning ||
                modelsLoading ||
                !selectedModel ||
                selectedModel.status !== "ready"
              }
              className="h-11 w-full"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Running inference…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 size-4" />
                  Run analysis
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="min-h-[680px] overflow-hidden">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Analysis output</CardTitle>
                <CardDescription>
                  Evidence, detections and runtime measurements.
                </CardDescription>
              </div>
              {result && (
                <Badge
                  className={cn(
                    result.alert
                      ? "bg-rose-600 hover:bg-rose-600"
                      : "bg-emerald-600 hover:bg-emerald-600"
                  )}
                >
                  {result.alert ? "Alert detected" : "No alert"}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-5 sm:p-6">
            {isRunning ? (
              <div className="grid min-h-[530px] place-items-center">
                <div className="max-w-sm text-center">
                  <span className="relative mx-auto grid size-16 place-items-center rounded-3xl bg-primary/10 text-primary">
                    <Loader2 className="size-7 animate-spin" />
                    <span className="absolute inset-0 animate-ping rounded-3xl border border-primary/20" />
                  </span>
                  <h3 className="mt-5 font-semibold">Analyzing evidence</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Video models sample multiple temporal windows. Longer clips
                    can take a little more time.
                  </p>
                </div>
              </div>
            ) : !result ? (
              <div className="grid min-h-[530px] place-items-center rounded-2xl border border-dashed bg-muted/15">
                <div className="max-w-sm px-6 text-center">
                  <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-card text-muted-foreground shadow-sm ring-1 ring-border">
                    <Video className="size-6" />
                  </span>
                  <h3 className="mt-4 font-semibold">No analysis yet</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Choose an approved model, provide a valid sample and run
                    inference to see verified output here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {result.annotatedFrame ? (
                  <div className="overflow-hidden rounded-2xl border bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`data:image/jpeg;base64,${result.annotatedFrame}`}
                      alt="AI annotated result"
                      className="max-h-[440px] w-full object-contain"
                    />
                  </div>
                ) : result.mediaType === "video" && previewUrl ? (
                  <div className="overflow-hidden rounded-2xl border bg-black">
                    <video
                      src={previewUrl}
                      controls
                      className="max-h-[440px] w-full object-contain"
                    />
                  </div>
                ) : result.moderation ? (
                  <div
                    className={cn(
                      "rounded-2xl border p-5",
                      result.alert
                        ? "border-rose-500/20 bg-rose-500/5"
                        : "border-emerald-500/20 bg-emerald-500/5"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {result.alert ? (
                        <ShieldAlert className="mt-0.5 size-5 text-rose-600" />
                      ) : (
                        <CheckCircle2 className="mt-0.5 size-5 text-emerald-600" />
                      )}
                      <div>
                        <p className="font-semibold">
                          {result.moderation.flaggedCategory}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {result.moderation.reason}
                        </p>
                        <p className="mt-3 text-xs text-muted-foreground">
                          Provider: {result.moderation.provider}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border bg-muted/20 p-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Gauge className="size-3.5" />
                      Peak confidence
                    </div>
                    <p className="mt-2 text-2xl font-semibold tracking-tight">
                      {Math.round(result.confidence * 100)}%
                    </p>
                  </div>
                  <div className="rounded-2xl border bg-muted/20 p-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Clock3 className="size-3.5" />
                      Inference time
                    </div>
                    <p className="mt-2 text-2xl font-semibold tracking-tight">
                      {formatLatency(result.latencyMs)}
                    </p>
                  </div>
                  <div className="rounded-2xl border bg-muted/20 p-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <FileVideo2 className="size-3.5" />
                      Frames sampled
                    </div>
                    <p className="mt-2 text-2xl font-semibold tracking-tight">
                      {result.sampledFrames || "—"}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border">
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <h3 className="text-sm font-semibold">Detections</h3>
                    <Badge variant="secondary">
                      {result.detections.length}
                    </Badge>
                  </div>
                  {result.detections.length ? (
                    <div className="divide-y">
                      {result.detections.map((detection, index) => (
                        <div
                          key={`${detection.label}-${index}`}
                          className="flex items-center gap-3 px-4 py-3"
                        >
                          <span
                            className={cn(
                              "grid size-8 place-items-center rounded-xl",
                              result.alert
                                ? "bg-rose-500/10 text-rose-600"
                                : "bg-emerald-500/10 text-emerald-600"
                            )}
                          >
                            {result.alert ? (
                              <AlertTriangle className="size-4" />
                            ) : (
                              <CheckCircle2 className="size-4" />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium capitalize">
                              {detection.label}
                            </p>
                            {detection.box && (
                              <p className="text-[0.68rem] text-muted-foreground">
                                Box {detection.box.map(Math.round).join(", ")}
                              </p>
                            )}
                          </div>
                          <span className="text-sm font-semibold">
                            {Math.round(detection.confidence * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No target class crossed the configured threshold.
                    </p>
                  )}
                </div>

                {result.timeline.length > 0 && (
                  <div className="rounded-2xl border">
                    <div className="border-b px-4 py-3">
                      <h3 className="text-sm font-semibold">
                        Detection timeline
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Highest-confidence events across sampled video windows.
                      </p>
                    </div>
                    <div className="max-h-72 space-y-3 overflow-y-auto p-4">
                      {result.timeline.slice(0, 24).map((event, index) => (
                        <div
                          key={`${event.startSeconds}-${event.label}-${index}`}
                          className="grid grid-cols-[72px_minmax(0,1fr)_42px] items-center gap-3"
                        >
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {formatTime(event.startSeconds)}
                          </span>
                          <div>
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <span className="truncate text-xs font-medium capitalize">
                                {event.label}
                              </span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  event.confidence >= 0.4
                                    ? "bg-rose-500"
                                    : "bg-emerald-500"
                                )}
                                style={{
                                  width: `${Math.max(
                                    2,
                                    event.confidence * 100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                          <span className="text-right text-xs font-semibold tabular-nums">
                            {Math.round(event.confidence * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="border-amber-500/20 bg-amber-500/[0.035]">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <p className="text-xs leading-5 text-muted-foreground">
            AI Lab results are evaluation evidence, not autonomous security
            decisions. YOLO demo checkpoints have AGPL restrictions and X3D is
            retained for research evaluation. Human review remains mandatory.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

