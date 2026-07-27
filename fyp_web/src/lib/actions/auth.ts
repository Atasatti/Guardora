"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { API_BASE_URL } from "../api-client";
import { fetchWithAuth, handleApiResponse } from "../server-utils";
import type { LoginResponse } from "@/models";

export async function login(credentials: { email: string; password: string }) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
      cache: "no-store",
    });

    if (!res.ok) {
      const errorData = await res.json();
      return { success: false, message: errorData.message || "Login failed." };
    }

    const data: LoginResponse = await res.json();

    if (data.success && data.user && data.token) {
      if (data.user.role !== "ADMIN" && data.user.role !== "MODERATOR") {
        return { success: false, message: "Access Denied: Not an admin." };
      }

      const cookieStore = await cookies();
      cookieStore.set("token", data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });

      return { success: true, message: "Login successful" };
    } else {
      return {
        success: false,
        message: data.message || "Invalid response from server.",
      };
    }
  } catch (error) {
    console.error("Login action error:", error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "An unknown error occurred." };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.set("token", "", { expires: new Date(0) });
  redirect("/login");
}

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function changePassword(data: any) {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/users/change-password`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );

    const result = await handleApiResponse<{ message: string }>(response);

    if (result.success) {
      return { success: true, message: result.data.message };
    }
    return result;
  } catch (error) {
    console.log(error);
    return { success: false, message: "Failed to update password" };
  }
}
