import { Suspense } from "react";
import PageLoader from "../users/_components/PageLoader";
import SurveillanceClient from "./_components/SurveillanceClient";
import { loadSurveillanceViewModel } from "@/view-models/admin";

export default async function SurveillancePage() {
  const viewModel = await loadSurveillanceViewModel();

  return (
    <Suspense fallback={<PageLoader />}>
      <SurveillanceClient
        initialAlerts={viewModel.data.alerts}
        initialAreas={viewModel.data.areas}
      />
    </Suspense>
  );
}
