import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

const API_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  "http://localhost:3000";

async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync("token");
  } catch {
    return null;
  }
}

export async function setToken(token: string) {
  await SecureStore.setItemAsync("token", token);
}

export async function clearToken() {
  await SecureStore.deleteItemAsync("token");
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/api/v1${path}`, { ...options, headers });
  const json = await res.json();

  if (!json.success) {
    throw new Error(json.error || "Request failed");
  }

  return json.data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
