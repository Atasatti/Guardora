"use server";

import { revalidatePath } from "next/cache";
import { API_BASE_URL } from "../api-client";
import {
  Bill,
  BillingStats,
  BillType,
  CreateBillData,
  CreateBulkBillData,
  UpdateBillData,
} from "@/models";
import { fetchWithAuth, handleApiResponse } from "../server-utils";

export async function getAllBills(params?: {
  page?: number;
  limit?: number;
  isCleared?: boolean;
  billType?: BillType;
}) {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.isCleared !== undefined)
      queryParams.append("isCleared", params.isCleared.toString());
    if (params?.billType) queryParams.append("billType", params.billType);

    const response = await fetchWithAuth(
      `${API_BASE_URL}/bills?${queryParams}`
    );
    const result = await handleApiResponse<{
      bills: Bill[];
      totalPages: number;
      currentPage: number;
      total: number;
    }>(response);

    if (result.success) {
      return {
        success: true,
        bills: result.data.bills,
        totalPages: result.data.totalPages,
        currentPage: result.data.currentPage,
        total: result.data.total,
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

export async function getBillingStats() {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/bills/admin/stats`);
    const result = await handleApiResponse<BillingStats>(response);

    if (result.success) {
      return { success: true, stats: result.data };
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

export async function createBill(formData: CreateBillData) {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/bills`, {
      method: "POST",
      body: JSON.stringify(formData),
    });

    const result = await handleApiResponse<Bill>(response);

    if (result.success) {
      revalidatePath("/billing");
      return { success: true, bill: result.data };
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

export async function createBulkBills(formData: CreateBulkBillData) {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/bills/bulk`, {
      method: "POST",
      body: JSON.stringify(formData),
    });

    const result = await handleApiResponse<{ message: string; bills: Bill[] }>(
      response
    );

    if (result.success) {
      revalidatePath("/billing");
      return {
        success: true,
        message: result.data.message,
        bills: result.data.bills,
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

export async function updateBill(billId: string, formData: UpdateBillData) {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/bills/${billId}`, {
      method: "PATCH",
      body: JSON.stringify(formData),
    });

    const result = await handleApiResponse<Bill>(response);

    if (result.success) {
      revalidatePath("/billing");
      return { success: true, bill: result.data };
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

export async function deleteBill(billId: string) {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/bills/${billId}`, {
      method: "DELETE",
    });

    const result = await handleApiResponse<{ message: string }>(response);

    if (result.success) {
      revalidatePath("/billing");
      return { success: true, message: "Bill deleted" };
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
