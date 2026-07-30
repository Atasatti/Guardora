"use server";

import { revalidatePath } from "next/cache";
import { API_BASE_URL } from "../api-client";
import { Report, UpdateReportData } from "@/models";
import { fetchWithAuth, handleApiResponse } from "../server-utils";

export async function getAllReports() {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/reports`);
    const result = await handleApiResponse<{ reports: Report[] }>(response);

    if (result.success) {
      return { success: true, reports: result.data.reports };
    }
    return result;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updateReport(id: string, data: UpdateReportData) {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/reports/${id}`, {
      method: "PUT", // Using PUT/PATCH based on your backend controller logic
      body: JSON.stringify(data),
    });

    const result = await handleApiResponse<{ report: Report }>(response);

    if (result.success) {
      revalidatePath("/reports");
      return { success: true, report: result.data.report };
    }
    return result;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function deleteReport(id: string) {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/reports/${id}`, {
      method: "DELETE",
    });

    const result = await handleApiResponse<{ message: string }>(response);

    if (result.success) {
      revalidatePath("/reports");
      return { success: true, message: "Report deleted" };
    }
    return result;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
