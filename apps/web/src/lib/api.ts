export interface ApiEnvelope<T> {
  status: string;
  code: number;
  data: T;
}

export const JSON_HEADERS = {
  "content-type": "application/json",
  accept: "application/json",
};

// Unwrap { status, code, data } — or surface the API's AppErrorResponse.message.
export async function readEnvelope<T>(res: Response): Promise<T> {
  const body = (await res.json()) as ApiEnvelope<T> & { message?: string };
  if (!res.ok) {
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }
  return body.data;
}
