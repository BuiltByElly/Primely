import { useAuthStore, useRememberMeStore } from "../store/AuthStore";

function redirectToLogin() {
  useAuthStore.getState().setAccessToken(null);

  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  const token = useAuthStore.getState().accessToken;
  const rememberMe = useRememberMeStore.getState().rememberMe;

  const headers = new Headers(init.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response = await fetch(input, {
    ...init,
    headers,
  });

  if (response.status !== 401) {
    return response;
  }

  const refreshResponse = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({ remember_me: rememberMe }),
  });

  if (!refreshResponse.ok) {
    redirectToLogin();
    return response;
  }

  const data = (await refreshResponse.json()) as { access_token?: string };

  if (!data.access_token) {
    redirectToLogin();
    return response;
  }

  useAuthStore.getState().setAccessToken(data.access_token);

  const retryHeaders = new Headers(init.headers);
  retryHeaders.set("Authorization", `Bearer ${data.access_token}`);

  response = await fetch(input, {
    ...init,
    headers: retryHeaders,
  });

  if (response.status === 401) {
    redirectToLogin();
  }

  return response;
}

export async function authFetchData<T>(
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  const response = await authFetch(input, init);

  if (!response.ok) {
    throw new Error(
      `Request failed with status ${response.status},${response}`,
    );
  }

  return (await response.json()) as T;
}
