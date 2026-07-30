"use server";

import { API_BASE_URL } from "../api-client";
import { fetchWithAuth, handleApiResponse } from "../server-utils";
import { ChatMessage, Conversation } from "@/models";

export async function getInbox() {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/chat/inbox`);
    // Backend returns { success: true, conversations: [] }
    const result = await handleApiResponse<{ conversations: Conversation[] }>(
      response
    );

    if (result.success) {
      return { success: true, conversations: result.data.conversations };
    }
    return result;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getChatHistory(otherUserId: string) {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/chat/history/${otherUserId}`
    );
    const result = await handleApiResponse<{ messages: ChatMessage[] }>(
      response
    );

    if (result.success) {
      return { success: true, messages: result.data.messages };
    }
    return result;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Note: We will use Socket.io for sending, but this is a fallback API if needed
export async function sendRestMessage(receiverId: string, text: string) {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/chat/send`, {
      method: "POST",
      body: JSON.stringify({ receiverId, text }),
    });
    return await handleApiResponse<{ message: ChatMessage }>(response);
  } catch (error) {
    console.log("Error sending message via REST:", error);
    return { success: false, message: "Failed to send" };
  }
}

export async function deleteConversation(conversationId: string) {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/chat/conversations/${conversationId}`,
      { method: "DELETE" }
    );
    return await handleApiResponse<{ message: string }>(response);
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete conversation",
    };
  }
}
