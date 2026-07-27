export type ReadyViewModel<T> = {
  status: "ready";
  data: T;
};

export type FailedViewModel = {
  status: "auth-error" | "error";
  message: string;
};

export type ViewModel<T> = ReadyViewModel<T> | FailedViewModel;

const AUTH_ERROR_MESSAGES = [
  "Your url is invalid",
  "Your url is expired",
  "Please login to continue",
  "Authentication required",
  "Authentication expired",
];

export function ready<T>(data: T): ReadyViewModel<T> {
  return { status: "ready", data };
}

export function failed(message?: string): FailedViewModel {
  const resolvedMessage = message || "An unknown error occurred";
  const isAuthenticationError = AUTH_ERROR_MESSAGES.some((candidate) =>
    resolvedMessage.includes(candidate)
  );

  return {
    status: isAuthenticationError ? "auth-error" : "error",
    message: resolvedMessage,
  };
}

export function resultMessage(result: unknown): string | undefined {
  if (
    typeof result === "object" &&
    result !== null &&
    "message" in result &&
    typeof result.message === "string"
  ) {
    return result.message;
  }

  return undefined;
}

