"use server";

import { revalidatePath } from "next/cache";
import { API_BASE_URL } from "../api-client";
import { ModerationCase } from "@/models";
import { fetchWithAuth, handleApiResponse } from "../server-utils";

export async function getModerationCases() {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/moderation`);
    const result = await handleApiResponse<{ cases: ModerationCase[] }>(
      response
    );

    if (result.success) {
      return { success: true, cases: result.data.cases };
    }
    return result;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function resolveModerationCase(
  id: string,
  action: "BAN" | "DISMISS"
) {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/moderation/${id}/resolve`,
      {
        method: "PATCH",
        body: JSON.stringify({ action }),
      }
    );

    const result = await handleApiResponse<{ message: string }>(response);

    if (result.success) {
      revalidatePath("/moderation");
      // Also revalidate social since content might be deleted
      revalidatePath("/social");
      return { success: true, message: result.data.message };
    }
    return result;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
