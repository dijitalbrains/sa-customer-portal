import "server-only";

export function saApiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const baseUrl = (process.env.API_URL ?? "").replace(/\/$/, "");
  return fetch(`${baseUrl}/${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      "X-API-Key": process.env.SA_API_KEY ?? "",
      ...init.headers,
    },
    cache: "no-store",
  });
}
