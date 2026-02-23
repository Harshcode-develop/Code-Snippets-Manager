const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const apiFetch = async <T = unknown>(
  endpoint: string,
  method: string = "GET",
  body: Record<string, unknown> | null = null,
  token: string | null = null,
): Promise<T> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options: RequestInit = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, options);

  if (response.status === 204) return null as unknown as T;

  let data: T;
  try {
    data = await response.json();
  } catch {
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    return null as unknown as T;
  }

  if (!response.ok) {
    const errorData = data as unknown as { message?: string };
    throw new Error(
      errorData?.message || `HTTP error! status: ${response.status}`,
    );
  }

  return data;
};
