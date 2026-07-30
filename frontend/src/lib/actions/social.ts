"use server";

import { revalidatePath } from "next/cache";
import { API_BASE_URL } from "../api-client";
import { Post, Product, ProductStatus } from "@/models";
import { fetchWithAuth, handleApiResponse } from "../server-utils";

// --- POSTS ACTIONS ---

export async function getAllPosts() {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/posts`);
    // Backend returns array directly: res.json(posts)
    const result = await handleApiResponse<Post[]>(response);

    if (result.success) {
      return { success: true, posts: result.data };
    }
    return result;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function deletePost(id: string) {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/posts/${id}`, {
      method: "DELETE",
    });
    const result = await handleApiResponse<{ message: string }>(response);
    if (result.success) {
      revalidatePath("/social");
      return { success: true, message: "Post deleted" };
    }
    return result;
  } catch (error) {
    console.log("ERROR: ", error);
    return { success: false, message: "Error deleting post" };
  }
}

// --- PRODUCTS ACTIONS ---

export async function getAllProducts() {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/products`);
    // Backend returns array directly
    const result = await handleApiResponse<Product[]>(response);

    if (result.success) {
      return { success: true, products: result.data };
    }
    return result;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updateProductStatus(id: string, status: ProductStatus) {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/products/${id}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }
    );
    const result = await handleApiResponse<Product>(response);
    if (result.success) {
      revalidatePath("/social");
      return { success: true, product: result.data };
    }
    return result;
  } catch (error) {
    console.log("ERROR: ", error);

    return { success: false, message: "Error updating status" };
  }
}

export async function deleteProduct(id: string) {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/products/${id}`, {
      method: "DELETE",
    });
    const result = await handleApiResponse<{ message: string }>(response);
    if (result.success) {
      revalidatePath("/social");
      return { success: true, message: "Product deleted" };
    }
    return result;
  } catch (error) {
    console.log("ERROR: ", error);
    return { success: false, message: "Error deleting product" };
  }
}
