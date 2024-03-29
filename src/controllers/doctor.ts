import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { z } from "zod";
import context from "../context";
import db from "../context/db";
import { doctors } from "../db/schema";
import { NotFoundError } from "../errors";

const doctorValidator = z.object({
  name: z.string().min(3).max(255),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/)
    .optional(),
  email: z.string().email().optional(),
});

const doctorsController = new Elysia({ prefix: "/doctor" }).use(context).guard(
  {
    ensureLoggedIn: true,
  },
  (app) =>
    app
      .model({
        doctor: t.Object({
          name: t.String(),
          phone: t.Optional(t.String()),
          email: t.Optional(t.String()),
        }),
      })
      .get("/", async () => {
        const doctorsList = await db.query.doctors.findMany({
          columns: {
            deleted: false,
          },
          where: eq(doctors.deleted, false),
        });
        return doctorsList;
      })
      .post(
        "/",
        async ({ body, set }) => {
          const data = doctorValidator.parse(body);
          const [createdDoctor] = await db
            .insert(doctors)
            .values(data)
            .returning();
          const { deleted: _, ...doctor } = createdDoctor;
          set.status = 201;
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
            where: and(eq(doctors.id, id), eq(doctors.deleted, false)),
            columns: {
              deleted: false,
            },
          });
          if (doctor === undefined) {
            throw new NotFoundError(`Doctor with id: ${id} not found`);
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
          const data = doctorValidator.parse(body);
          const [updatedDoctor] = await db
            .update(doctors)
            .set(data)
            .where(and(eq(doctors.id, id), eq(doctors.deleted, false)))
            .returning();
          if (updatedDoctor === undefined) {
            throw new NotFoundError(`Doctor with id: ${id} not found`);
          }
          const { deleted: _, ...updatedDoctorFiltered } = updatedDoctor;

          return updatedDoctorFiltered;
        },
        {
          body: "doctor",
          params: t.Object({ id: t.Numeric() }),
        },
      )
      .delete(
        "/:id",
        async ({ params: { id }, set }) => {
          const [deletedDoctor] = await db
            .update(doctors)
            .set({ deleted: true })
            .where(and(eq(doctors.id, id), eq(doctors.deleted, false)))
            .returning();
          if (deletedDoctor) {
            set.status = 204;
          } else {
            throw new NotFoundError(`Doctor with id: ${id} not found`);
          }
        },
        {
          params: t.Object({ id: t.Numeric() }),
        },
      ),
);

export default doctorsController;
