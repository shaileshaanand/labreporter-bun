import swagger from "@elysiajs/swagger";
import { Elysia } from "elysia";
import doctorsController from "./controllers/doctor";

const app = new Elysia()
  .use(swagger())
  .get("/", () => {
    return { hello: "world" };
  })
  .use(doctorsController);

export default app;
