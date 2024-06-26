import { cors } from "@elysiajs/cors";
import swagger from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { ZodError } from "zod";
import USGReportsController from "./controllers/USGReport";
import authController from "./controllers/auth";
import doctorsController from "./controllers/doctor";
import patientsController from "./controllers/patient";
import templatesController from "./controllers/template";
import usersContoller from "./controllers/user";
import { APIError } from "./errors";

const app = new Elysia()
  .use(swagger())
  .use(cors())
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
  .use(authController)
  .use(doctorsController)
  .use(usersContoller)
  .use(patientsController)
  .use(templatesController)
  .use(USGReportsController);

export default app;
