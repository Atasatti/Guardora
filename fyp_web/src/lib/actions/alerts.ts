"use server";

import { revalidatePath } from "next/cache";
import { API_BASE_URL } from "../api-client";
import { SecurityAlert } from "@/models";
import { fetchWithAuth, handleApiResponse } from "../server-utils";

export async function getAlerts() {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/alerts`);
    const result = await handleApiResponse<{ alerts: SecurityAlert[] }>(
      response
    );

    if (result.success) {
      return { success: true, alerts: result.data.alerts };
    }
    return result;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updateAlertStatus(
  alertId: string,
  status: "REVIEWED" | "DISMISSED"
) {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/alerts/${alertId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }
    );

    const result = await handleApiResponse<{ alert: SecurityAlert }>(response);

    if (result.success) {
      revalidatePath("/alerts"); // Update the Alerts List page
      revalidatePath("/surveillance"); // Update the Dashboard feed
      return { success: true, alert: result.data.alert };
    }
    return result;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
