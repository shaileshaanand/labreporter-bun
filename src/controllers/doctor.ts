import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import context from "../context";
import { doctors } from "../db/schema";
import db from "../context/db";

const doctorsController = new Elysia({ prefix: "/doctor" })
  .use(context)
  .model({
    doctor: t.Object({
      name: t.String(),
      phone: t.String(),
      email: t.String(),
    }),
  })
  .get("/", async () => {
    const doctorsList = await db.query.doctors.findMany({
      columns: {
        deleted: false,
      },
      with: {
        deleted: false,
      },
    });
    return doctorsList;
  })
  .post(
    "/",
    async ({ body }) => {
      const createdDoctor = (
        await db.insert(doctors).values(body).returning()
      )[0];
      const { deleted: _, ...doctor } = createdDoctor;
      return doctor;
    },
    {
      body: "doctor",
    },
  )
  .get(
    "/:id",
    async ({ params: { id } }) => {
      const doctor = await db.query.doctors.findFirst({
        with: {
          id,
          deleted: false,
        },
        columns: {
          deleted: false,
        },
      });
      if (doctor === undefined) {
        throw new Error(`Doctor with id: ${id} not found`);
      }
      return doctor;
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
    },
  )
  .put(
    "/:id",
    async ({ body, params: { id } }) => {
      const updatedDoctor = await db
        .update(doctors)
        .set(body)
        .where(eq(doctors.id, id))
        .returning();
      return updatedDoctor;
    },
    {
      body: "doctor",
      params: t.Object({ id: t.Numeric() }),
    },
  )
  .delete(
    "/:id",
    async ({ params: { id }, set }) => {
      const deletedDoctor = await db
        .update(doctors)
        .set({ deleted: true })
        .where(eq(doctors.id, id))
        .returning();
      if (deletedDoctor) {
        set.status = 204;
      } else {
        throw new Error(`Doctor with id: ${id} not found`);
      }
    },
    {
      params: t.Object({ id: t.Numeric() }),
    },
  );

export default doctorsController;
