"use server";

import { API_BASE_URL } from "../api-client";
import { fetchWithAuth, handleApiResponse } from "../server-utils";

/**
 * @desc Load the evaluation models available to the AI Lab.
 *
 * These run server side rather than from the browser: the session cookie is
 * set on this application's own domain, so a cross-origin browser request to
 * the API sends no credentials and is rejected.
 */
export async function getAiLabModels() {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/ai-lab/models`, {
      cache: "no-store",
    });
    const result = await handleApiResponse<{ models: unknown[] }>(response);

    if (result.success) {
      return { success: true as const, models: result.data.models || [] };
    }
    return { success: false as const, message: result.message };
  } catch (error) {
    return {
      success: false as const,
      message:
        error instanceof Error ? error.message : "Could not load AI models",
    };
  }
}

/**
 * @desc Run a single evaluation against the selected model.
 *
 * Accepts the FormData built by the client (modelId, confidence, and either
 * text or an uploaded file) and forwards it with the caller's session.
 */
export async function runAiLabTest(formData: FormData) {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/ai-lab/test`, {
      method: "POST",
      body: formData,
    });
    const result = await handleApiResponse<{ result: unknown }>(response);

    if (result.success) {
      return { success: true as const, result: result.data.result };
    }
    return { success: false as const, message: result.message };
  } catch (error) {
    return {
      success: false as const,
      message: error instanceof Error ? error.message : "AI analysis failed",
    };
  }
}
