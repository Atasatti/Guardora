"use server";

import { revalidatePath } from "next/cache";
import { API_BASE_URL } from "../api-client";
import { BannedPerson } from "@/models";
import { fetchWithAuth, handleApiResponse } from "../server-utils";

export async function getBannedPersons() {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/banned-persons`);
    const result = await handleApiResponse<{ persons: BannedPerson[] }>(
      response
    );
    if (result.success) {
      return { success: true, persons: result.data.persons };
    }
    return result;
  } catch (error) {
    console.log(error);
    return { success: false, message: "Failed to fetch banned persons" };
  }
}

export async function banPerson(formData: FormData) {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/banned-persons`, {
      method: "POST",
      body: formData,
    });
    const result = await handleApiResponse<{ person: BannedPerson }>(response);
    if (result.success) {
      revalidatePath("/alerts");
      return { success: true as const, person: result.data.person };
    }
    return result;
  } catch (error) {
    console.log(error);
    return { success: false as const, message: "Failed to ban person" };
  }
}

export async function unbanPerson(id: string) {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/banned-persons/${id}`,
      {
        method: "DELETE",
      }
    );
    const result = await handleApiResponse<{ message: string }>(response);
    if (result.success) {
      revalidatePath("/alerts");
      return { success: true, message: "Person unbanned" };
    }
    return result;
  } catch (error) {
    console.log(error);
    return { success: false, message: "Failed to unban person" };
  }
}
