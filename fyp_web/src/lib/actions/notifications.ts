"use server";

import { Notification } from "@/models";
import { API_BASE_URL } from "../api-client";
import { fetchWithAuth, handleApiResponse } from "../server-utils";

export async function getNotifications(limit = 10) {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/notifications?limit=${limit}`
    );
    const result = await handleApiResponse<{
      notifications: Notification[];
      unread: number;
    }>(response);
    return result.success
      ? {
          success: true as const,
          notifications: result.data.notifications,
          unread: result.data.unread,
        }
      : result;
  } catch (error) {
    return {
      success: false as const,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function markNotificationRead(notificationId: string) {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/notifications/${notificationId}/read`,
      { method: "PATCH" }
    );
    return handleApiResponse<{ notification: Notification }>(response);
  } catch (error) {
    return {
      success: false as const,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function markAllNotificationsRead() {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/notifications/read-all`,
      { method: "PATCH" }
    );
    return handleApiResponse<{ success: boolean }>(response);
  } catch (error) {
    return {
      success: false as const,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
