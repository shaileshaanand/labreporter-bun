import { Elysia } from "elysia";

const app = new Elysia().get("/", () => {
  return "Hello Elysia!";
});

export default app;
