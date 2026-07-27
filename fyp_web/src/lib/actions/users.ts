"use server";

import { revalidatePath } from "next/cache";
import { API_BASE_URL } from "../api-client";
import { User, UserProfileResponse } from "@/models";
import { fetchWithAuth, handleApiResponse } from "../server-utils";
import { cookies } from "next/headers";

export async function getAllUsers() {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/users/admin/all`);
    const result = await handleApiResponse<{ users: User[] }>(response);

    if (result.success) {
      return { success: true, users: result.data.users };
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

export async function adminCreateUser(formData: FormData) {
  try {
    const token = (await cookies()).get("token")?.value;
    if (!token) {
      return { success: false, message: "Authentication required" };
    }

    const response = await fetch(`${API_BASE_URL}/users/admin/create`, {
      method: "POST",
      headers: {
        Cookie: `token=${token}`,
      },
      credentials: "include",
      body: formData,
    });

    const result = await handleApiResponse<{ message: string }>(response);

    if (result.success) {
      revalidatePath("/users");
      return {
        success: true,
        message: result.data.message || "User created successfully",
      };
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

export async function adminUpdateUser(
  userId: string,
  data: {
    name: string;
    email: string;
    phoneNumber: string;
    unitNumber: string;
  }
) {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/users/admin/update/${userId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );

    const result = await handleApiResponse<{ message: string }>(response);

    if (result.success) {
      revalidatePath("/users");
      return { success: true, message: "User updated successfully" };
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

export async function adminDeleteUser(userId: string) {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/users/admin/delete/${userId}`,
      {
        method: "DELETE",
      }
    );

    const result = await handleApiResponse<{ message: string }>(response);

    if (result.success) {
      revalidatePath("/users");
      return { success: true, message: "User deleted successfully" };
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

export async function getUserProfileData(
  userId: string
): Promise<UserProfileResponse> {
  try {
    const token = (await cookies()).get("token")?.value;
    if (!token) {
      throw new Error("Please login to continue.");
    }

    const [userRes, postsRes, productsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/users/${userId}`, {
        headers: { Cookie: `token=${token}` },
        credentials: "include",
        cache: "no-store",
      }),
      fetch(`${API_BASE_URL}/posts/user/${userId}`, {
        headers: { Cookie: `token=${token}` },
        credentials: "include",
        cache: "no-store",
      }),
      fetch(`${API_BASE_URL}/products/user/${userId}`, {
        headers: { Cookie: `token=${token}` },
        credentials: "include",
        cache: "no-store",
      }),
    ]);

    if (!userRes.ok) {
      const errorData = await userRes.json();
      throw new Error(errorData.message || "Failed to fetch user profile");
    }

    const userData = await userRes.json();
    const postsData = postsRes.ok ? await postsRes.json() : [];
    const productsData = productsRes.ok ? await productsRes.json() : [];

    return {
      success: true,
      user: userData.user as User,
      posts: postsData,
      products: productsData,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function getProfile() {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/users/me`);
    const result = await handleApiResponse<{ user: User }>(response);

    if (result.success) {
      return { success: true, user: result.data.user };
    }
    return result;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function uploadProfilePicture(formData: FormData) {
  try {
    const token = (await cookies()).get("token")?.value;

    // Note: We do NOT set Content-Type here. Fetch sets it automatically with the boundary for FormData.
    const response = await fetch(
      `${API_BASE_URL}/users/update-profile-picture`,
      {
        method: "PUT",
        headers: { Cookie: `token=${token}` },
        body: formData,
      }
    );

    const result = await handleApiResponse<{ user: User }>(response);

    if (result.success) {
      revalidatePath("/settings");
      // Also revalidate /users/me context if you use it elsewhere
      return { success: true, user: result.data.user };
    }
    return result;
  } catch (error) {
    console.log(error);
    return { success: false, message: "Failed to upload image" };
  }
}
