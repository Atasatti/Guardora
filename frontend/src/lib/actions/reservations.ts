"use server";

import { revalidatePath } from "next/cache";
import { API_BASE_URL } from "../api-client";
import { Reservation, CreateReservationData } from "@/models";
import { fetchWithAuth, handleApiResponse } from "../server-utils";

export async function getReservations() {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/reservations`);
    const result = await handleApiResponse<Reservation[]>(response);

    if (result.success) {
      return { success: true, reservations: result.data };
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

export async function getReservationsByFacility(facilityId: string) {
  try {
    const allReservations = await getReservations();

    if (!allReservations.success) {
      return allReservations;
    }

    const facilityReservations = allReservations.reservations
      ? allReservations.reservations.filter(
          (reservation) => reservation.facilityId === facilityId
        )
      : [];

    return { success: true, reservations: facilityReservations };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function createReservation(formData: CreateReservationData) {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/reservations`, {
      method: "POST",
      body: JSON.stringify(formData),
    });

    const result = await handleApiResponse<Reservation>(response);

    if (result.success) {
      revalidatePath("/facilities");
      return { success: true, reservation: result.data };
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

export async function deleteReservation(reservationId: string) {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/reservations/${reservationId}`,
      {
        method: "DELETE",
      }
    );

    const result = await handleApiResponse<{ message: string }>(response);

    if (result.success) {
      revalidatePath("/facilities");
      return { success: true, message: "Reservation deleted" };
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
