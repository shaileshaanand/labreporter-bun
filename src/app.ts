import swagger from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { ZodError } from "zod";
import doctorsController from "./controllers/doctor";
import { APIError } from "./errors";

const app = new Elysia()
  .use(swagger())
  .onError(({ error, code, set }) => {
    if (error instanceof ZodError) {
      set.status = 400;
      return {
        errors: error.errors.map((e) => ({ message: e.message })),
      };
    }
    if (code === "VALIDATION") {
      set.status = 400;
      return { errors: [{ message: "Validation Error" }] };
    }
    if (error instanceof APIError) {
      set.status = error.status;
      return { errors: [{ message: error.message }] };
    }
    // biome-ignore lint/suspicious/noConsoleLog: needs logging
    console.log(error);
  })
  .use(doctorsController);

export default app;
