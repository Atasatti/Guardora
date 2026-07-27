"use server";

import { revalidatePath } from "next/cache";
import { API_BASE_URL } from "../api-client";
import { MaintenanceTicket, UpdateTicketData } from "@/models";
import { fetchWithAuth, handleApiResponse } from "../server-utils";

export async function getMaintenanceTickets() {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/maintenance_tickets`);
    const result = await handleApiResponse<MaintenanceTicket[]>(response);

    if (result.success) {
      return { success: true, tickets: result.data };
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

export async function updateMaintenanceTicket(
  ticketId: string,
  formData: UpdateTicketData
) {
  try {
    const payload = { ...formData };

    if (formData.status === "COMPLETED" && !payload.closedAt) {
      payload.closedAt = new Date().toISOString();
    }

    const response = await fetchWithAuth(
      `${API_BASE_URL}/maintenance_tickets/${ticketId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );

    const result = await handleApiResponse<MaintenanceTicket>(response);

    if (result.success) {
      revalidatePath("/maintenance");
      return { success: true, ticket: result.data };
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

export async function deleteMaintenanceTicket(ticketId: string) {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/maintenance_tickets/${ticketId}`,
      {
        method: "DELETE",
      }
    );

    const result = await handleApiResponse<{ message: string }>(response);

    if (result.success) {
      revalidatePath("/maintenance");
      return { success: true, message: "Ticket deleted" };
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
