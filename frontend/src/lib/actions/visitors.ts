"use server";

import { revalidatePath } from "next/cache";
import { API_BASE_URL } from "../api-client";
import { Visitor, CreateVisitorData, UpdateVisitorData } from "@/models";
import { fetchWithAuth, handleApiResponse } from "../server-utils";

export async function getAllVisitors() {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/visitors`);
    const result = await handleApiResponse<Visitor[]>(response);

    if (result.success) {
      return { success: true, visitors: result.data };
    }
    return result;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function createVisitor(data: CreateVisitorData) {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/visitors`, {
      method: "POST",
      body: JSON.stringify(data),
    });

    const result = await handleApiResponse<Visitor>(response);

    if (result.success) {
      revalidatePath("/visitors");
      return { success: true, visitor: result.data };
    }
    return result;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updateVisitor(id: string, data: UpdateVisitorData) {
  try {
    // Backend uses PUT for updates based on your router
    const response = await fetchWithAuth(`${API_BASE_URL}/visitors/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });

    const result = await handleApiResponse<Visitor>(response);

    if (result.success) {
      revalidatePath("/visitors");
      return { success: true, visitor: result.data };
    }
    return result;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function deleteVisitor(id: string) {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/visitors/${id}`, {
      method: "DELETE",
    });

    const result = await handleApiResponse<{ message: string }>(response);

    if (result.success) {
      revalidatePath("/visitors");
      return { success: true, message: "Visitor pass deleted" };
    }
    return result;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
