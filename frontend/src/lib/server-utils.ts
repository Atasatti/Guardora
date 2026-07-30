import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const authBypassEnabled =
  process.env.NODE_ENV !== "production" &&
  process.env.AUTH_BYPASS === "true";
const developmentToken = "guardora-local-auth-bypass";

/**
 * @desc Server action to handle authentication errors and logout
 */
export async function handleAuthError() {
  if (authBypassEnabled) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.delete("token");
  redirect("/login");
}

/**
 * @desc Get auth token with error handling
 */
export async function getAuthToken() {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    if (authBypassEnabled) {
      return developmentToken;
    }
    await handleAuthError();
  }
  return token;
}

/**
 * @desc Generic API fetch wrapper with auth handling
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = (await cookies()).get("token")?.value;
  if (!token && !authBypassEnabled) {
    throw new Error("Authentication required");
  }

  const requestHeaders = new Headers(options.headers);
  if (
    !(options.body instanceof FormData) &&
    !requestHeaders.has("Content-Type")
  ) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (token) {
    requestHeaders.set("Cookie", `token=${token}`);
  }

  const defaultOptions: RequestInit = {
    headers: requestHeaders,
    credentials: "include" as RequestCredentials,
    cache: "no-store",
    ...options,
  };

  return fetch(url, defaultOptions);
}

/**
 * @desc Handle API response and errors
 */
export async function handleApiResponse<T>(
  response: Response
): Promise<{ success: true; data: T } | { success: false; message: string }> {
  if (response.status === 401) {
    await handleAuthError();
    return { success: false, message: "Authentication expired" };
  }

  const data = await response.json();

  if (!response.ok) {
    return { success: false, message: data.message || "Request failed" };
  }

  return { success: true, data };
}
