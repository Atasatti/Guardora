"use server";

import { revalidatePath } from "next/cache";
import { API_BASE_URL } from "../api-client"; // Assuming this exists based on users.ts
import {
  Announcement,
  CreateAnnouncementData,
  UpdateAnnouncementData,
} from "@/models";
import { fetchWithAuth, handleApiResponse } from "../server-utils";

/**
 * @desc Fetch all announcements
 */
export async function getAllAnnouncements() {
  try {
    // Backend: router.get("/", getAllAnnouncements);
    const response = await fetchWithAuth(`${API_BASE_URL}/announcements`);

    // Backend returns an array directly: res.status(200).json(announcements);
    const result = await handleApiResponse<Announcement[]>(response);

    if (result.success) {
      return { success: true, announcements: result.data };
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

/**
 * @desc Create a new announcement
 */
export async function createAnnouncement(data: CreateAnnouncementData) {
  try {
    // Backend: router.post("/", createAnnouncement);
    const response = await fetchWithAuth(`${API_BASE_URL}/announcements`, {
      method: "POST",
      body: JSON.stringify(data),
    });

    const result = await handleApiResponse<Announcement>(response);

    if (result.success) {
      revalidatePath("/announcements");
      return { success: true, message: "Announcement created successfully" };
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

/**
 * @desc Update an announcement
 */
export async function updateAnnouncement(
  id: string,
  data: UpdateAnnouncementData
) {
  try {
    // Backend: router.patch("/:id", getAnnouncement, updateAnnouncement);
    const response = await fetchWithAuth(
      `${API_BASE_URL}/announcements/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    );

    const result = await handleApiResponse<Announcement>(response);

    if (result.success) {
      revalidatePath("/announcements");
      return { success: true, message: "Announcement updated successfully" };
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

/**
 * @desc Delete an announcement
 */
export async function deleteAnnouncement(id: string) {
  try {
    // Backend: router.delete("/:id", getAnnouncement, deleteAnnouncement);
    const response = await fetchWithAuth(
      `${API_BASE_URL}/announcements/${id}`,
      {
        method: "DELETE",
      }
    );

    const result = await handleApiResponse<{ message: string }>(response);

    if (result.success) {
      revalidatePath("/announcements");
      return { success: true, message: "Announcement deleted successfully" };
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
