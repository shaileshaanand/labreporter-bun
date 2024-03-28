import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const env = createEnv({
  server: {
    DB_URL: z.string().url(),
    DB_AUTH_TOKEN: z.string(),
    JWT_SECRET: z.string(),
    DB_TLS: z.enum(["true", "false"]).transform((value) => value === "true"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export default env;
