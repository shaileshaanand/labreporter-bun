import type { Elysia } from "elysia";

const fireRequest = async (
  app: Elysia,
  path: string,
  params: {
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: object;
    headers?: Headers;
  } = { method: "GET" },
): Promise<[Response, any]> => {
  const response = await app.handle(
    new Request(`http://localhost${path}`, {
      ...params,
      body: JSON.stringify(params.body),
      headers: params.body
        ? {
            "Content-Type": "application/json",
          }
        : undefined,
    }),
  );
  try {
    const jsonData = (await response.json()) as any;
    return [response, jsonData];
  } catch {
    return [response, undefined];
  }
};

export default fireRequest;
