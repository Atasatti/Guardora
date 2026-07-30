"use server";

import { API_BASE_URL } from "../api-client";
import { fetchWithAuth, handleApiResponse } from "../server-utils";

interface StreamTokenResponse {
  token: string;
  expiresInSeconds: number;
}

/**
 * @desc Request a short-lived token authorising one AI stream connection.
 *
 * The browser cannot hold the AI service key, so the API authorises the request
 * (including camera ownership) and signs a token scoped to this stream. Tokens
 * are short lived, so callers fetch a fresh one per connection attempt rather
 * than caching.
 */
export async function getAiStreamToken(cameraId?: string) {
  try {
    const path = cameraId
      ? `${API_BASE_URL}/cameras/${encodeURIComponent(cameraId)}/stream-token`
      : `${API_BASE_URL}/cameras/stream-token`;

    const response = await fetchWithAuth(path, { method: "POST" });
    const result = await handleApiResponse<StreamTokenResponse>(response);

    if (result.success) {
      return { success: true as const, token: result.data.token };
    }
    return { success: false as const, message: result.message };
  } catch (error) {
    return {
      success: false as const,
      message:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}
