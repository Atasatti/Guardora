"use server";

import { revalidatePath } from "next/cache";
import { API_BASE_URL } from "../api-client";
import { SocietyArea } from "@/models";
import { fetchWithAuth, handleApiResponse } from "../server-utils";

export async function getAllAreas() {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/areas`);
    const result = await handleApiResponse<{ areas: SocietyArea[] }>(response);

    if (result.success) {
      return { success: true, areas: result.data.areas };
    }
    return result;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updateAreaStatus(id: string, isSafe: boolean) {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/areas/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isSafe }),
    });

    const result = await handleApiResponse<{ area: SocietyArea }>(response);

    if (result.success) {
      revalidatePath("/safety-map");
      return { success: true, area: result.data.area };
    }
    return result;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
