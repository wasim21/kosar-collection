const API_URL = import.meta.env.VITE_API_URL;

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("kosar_token");

  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (
    options.body &&
    !(options.body instanceof FormData)
  ) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  if (response.status === 401) {
    localStorage.removeItem("kosar_token");
    localStorage.removeItem("kosar_user");

    window.location.hash = "#/login";

    throw new Error(
      "Your session has expired. Please login again."
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "API request failed."
    );
  }

  return data;
}
