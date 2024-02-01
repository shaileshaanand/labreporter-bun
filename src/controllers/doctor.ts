import { Elysia, t } from "elysia";
import context from "../context";
import { doctors } from "../db/schema";

const doctorsController = new Elysia({ prefix: "/doctor" })
  .use(context)
  .get("/", async ({ db }) => {
    const doctorsList = await db.select().from(doctors).all();
    return doctorsList;
  })
  .post(
    "/",
    async ({ db, body }) => {
      const createdDoctor = (
        await db.insert(doctors).values(body).returning()
      )[0];
      return createdDoctor;
    },
    {
      body: t.Object({
        name: t.String(),
        phone: t.String(),
        email: t.String(),
      }),
    },
  );

export default doctorsController;
