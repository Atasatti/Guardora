import { FileWarning } from "lucide-react";
import AuthErrorFallback from "@/app/(dashboard)/users/_components/AuthErrorFallback";
import type { FailedViewModel } from "@/view-models/view-state";

export default function ViewModelError({
  viewModel,
  title = "Failed to load data",
}: {
  viewModel: FailedViewModel;
  title?: string;
}) {
  if (viewModel.status === "auth-error") {
    return <AuthErrorFallback message={viewModel.message} />;
  }

  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <FileWarning className="h-12 w-12 text-destructive" />
      <h1 className="mt-4 text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground">{viewModel.message}</p>
    </div>
  );
}
