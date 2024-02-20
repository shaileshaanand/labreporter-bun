import jwt from "@elysiajs/jwt";
import Elysia from "elysia";
import env from "../env";

const context = new Elysia().use(
  jwt({
    secret: env.JWT_SECRET,
  }),
);

export default context;
