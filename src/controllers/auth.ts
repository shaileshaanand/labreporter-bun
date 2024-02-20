import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { z } from "zod";
import context from "../context";
import db from "../context/db";
import { users } from "../db/schema";
import { NotFoundError, UnauthorizedError } from "../errors";
import { verifyPassword } from "../helpers";

const authController = new Elysia({ prefix: "/auth" })
  .use(context)
  .model({
    login: t.Object({
      username: t.String(),
      password: t.String(),
    }),
  })
  .post(
    "/login",
    async ({ body: { username, password }, jwt }) => {
      const validator = z.object({
        username: z.string().min(1),
        password: z.string().min(1),
      });
      validator.parse({
        username,
        password,
      });

      const [user] = await db.query.users.findMany({
        where: and(eq(users.username, username), eq(users.deleted, false)),
      });

      if (user === undefined) {
        throw new NotFoundError(`User with username: ${username} not found`);
      }

      if (!(await verifyPassword(password, user.passwordHash))) {
        throw new UnauthorizedError("Invalid password");
      }

      return {
        token: await jwt.sign({ id: user.id }),
        user: {
          ...user,
          passwordHash: undefined,
          deleted: undefined,
        },
      };
    },
    {
      body: "login",
    },
  );

export default authController;
