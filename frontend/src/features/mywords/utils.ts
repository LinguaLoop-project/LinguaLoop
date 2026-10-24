import { NETWORK_ERROR, toApiError } from "@/features/auth";

export const isNetworkError = (error: unknown): boolean => toApiError(error).code === NETWORK_ERROR;

export const dateFormatter = (language: string) => new Intl.DateTimeFormat(language, { dateStyle: "short" });
