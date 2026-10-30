// The one place the frontend talks to the API. Hooks call this; components never call fetch.

/** Matches the API's error shape: { error: { code, message, fields?, requestId? } } */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields?: Record<string, string[]>,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ErrorBody = {
  error?: {
    code?: string;
    message?: string;
    fields?: Record<string, string[]>;
    requestId?: string;
  };
};

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: "include", // send the session cookie
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // the API isn't running, or the network dropped
    throw new ApiError(0, "NETWORK_ERROR", "Can't reach the server");
  }

  if (res.status === 204) return undefined as T;

  const data: unknown = await res.json().catch(() => undefined);
  if (!res.ok) {
    const err = (data as ErrorBody | undefined)?.error;
    // a proxy (Vite in dev, Caddy in prod) answers 502-504 itself when the API is down
    if (!err && res.status >= 502 && res.status <= 504) {
      throw new ApiError(res.status, "NETWORK_ERROR", "Can't reach the server");
    }
    throw new ApiError(
      res.status,
      err?.code ?? "UNKNOWN",
      err?.message ?? res.statusText,
      err?.fields,
      err?.requestId,
    );
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};
