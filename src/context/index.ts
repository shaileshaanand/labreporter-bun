import jwt from "@elysiajs/jwt";
import Elysia from "elysia";
import env from "../env";
import { UnauthorizedError } from "../errors";

const context = new Elysia({ name: "context" })
  .use(
    jwt({
      secret: env.JWT_SECRET,
    }),
  )
  .macro(({ onBeforeHandle }) => {
    return {
      ensureLoggedIn: () => {
        onBeforeHandle(async ({ headers, jwt }) => {
          if (headers.authorization === undefined) {
            throw new UnauthorizedError("Unauthorized: Missing Headers");
          }
          const [prefix, token] = headers.authorization.split(" ");

          if (prefix !== "Bearer") {
            throw new UnauthorizedError("Unauthorized: Invalid Prefix");
          }

          const payload = await jwt.verify(token);
          if (!payload) {
            throw new UnauthorizedError("Unauthorized: Invalid Token");
          }
        });
      },
    };
  });

export default context;
