"use server";

import { revalidatePath } from "next/cache";
import { API_BASE_URL } from "../api-client";
import { Ad, UpdateAdStatusData } from "@/models";
import { fetchWithAuth, handleApiResponse } from "../server-utils";

export async function getAdminAds() {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/ads/admin/all`);
    const result = await handleApiResponse<{ ads: Ad[] }>(response);

    if (result.success) {
      return { success: true, ads: result.data.ads };
    }
    return result;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updateAdStatus(adId: string, data: UpdateAdStatusData) {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/ads/admin/status/${adId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );

    const result = await handleApiResponse<{ ad: Ad }>(response);

    if (result.success) {
      revalidatePath("/ads");
      return { success: true, message: `Ad marked as ${data.status}` };
    }
    return result;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
