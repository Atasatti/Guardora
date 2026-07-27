"use server";

import { revalidatePath } from "next/cache";
import { API_BASE_URL } from "../api-client";
import { Facility, UpdateFacilityData, CreateFacilityData } from "@/models";
import { fetchWithAuth, handleApiResponse } from "../server-utils";

export async function getFacilities() {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/facilities`);
    const result = await handleApiResponse<Facility[]>(response);

    if (result.success) {
      return { success: true, facilities: result.data };
    }
    return result;
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function createFacility(formData: CreateFacilityData) {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/facilities`, {
      method: "POST",
      body: JSON.stringify(formData),
    });

    const result = await handleApiResponse<Facility>(response);

    if (result.success) {
      revalidatePath("/facilities");
      return { success: true, facility: result.data };
    }
    return result;
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function updateFacility(
  facilityId: string,
  formData: UpdateFacilityData
) {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/facilities/${facilityId}`,
      {
        method: "PATCH",
        body: JSON.stringify(formData),
      }
    );

    const result = await handleApiResponse<Facility>(response);

    if (result.success) {
      revalidatePath("/facilities");
      return { success: true, facility: result.data };
    }
    return result;
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function deleteFacility(facilityId: string) {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/facilities/${facilityId}`,
      {
        method: "DELETE",
      }
    );

    const result = await handleApiResponse<{ message: string }>(response);

    if (result.success) {
      revalidatePath("/facilities");
      return { success: true, message: "Facility deleted" };
    }
    return result;
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}
