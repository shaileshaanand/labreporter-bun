import type { Elysia } from "elysia";
import { SignJWT } from "jose";
import env from "../env";
import { omitUndefinedValues } from "../helpers";

const fireRequest = async (
  app: Elysia<any, any, any, any, any, any, any, any>,
  path: string,
  params: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: Record<string, any>;
    headers?: Record<string, string>;
    query?: Record<string, string>;
    authUserId?: number;
  } = {},
): Promise<[Response, any]> => {
  let queryString = "";
  if (params.query) {
    queryString = new URLSearchParams(params.query).toString();
  }
  const response = await app.handle(
    new Request(
      `http://localhost${path}${queryString ? `?${queryString}` : ""}`,
      {
        method: params.method ?? "GET",
        body: JSON.stringify(params.body),
        headers: omitUndefinedValues({
          "Content-Type": params.body ? "application/json" : undefined,
          authorization: params.authUserId
            ? `Bearer ${await new SignJWT({ id: params.authUserId })
                .setProtectedHeader({ alg: "HS256" })
                .sign(new TextEncoder().encode(env.JWT_SECRET))}`
            : "s",
          ...params.headers,
        }),
      },
    ),
  );
  try {
    const jsonData = (await response.json()) as any;
    return [response, jsonData];
  } catch {
    return [response, undefined];
  }
};

export default fireRequest;
