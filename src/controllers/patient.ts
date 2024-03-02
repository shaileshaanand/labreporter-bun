import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { z } from "zod";
import context from "../context";
import db from "../context/db";
import { patients } from "../db/schema";
import { NotFoundError } from "../errors";

enum Gender {
  male = "male",
  female = "female",
}

const patientsController = new Elysia({ prefix: "/patient" })
  .use(context)
  .guard(
    {
      ensureLoggedIn: true,
    },
    (app) =>
      app
        .model({
          patient: t.Object({
            name: t.String(),
            phone: t.Optional(t.String()),
            email: t.Optional(t.String()),
            age: t.Optional(t.Number()),
            gender: t.Enum(Gender),
          }),
        })
        .get("/", async () => {
          const patientsList = await db.query.patients.findMany({
            columns: {
              deleted: false,
            },
            where: eq(patients.deleted, false),
          });
          return patientsList;
        })
        .post(
          "/",
          async ({ body, set }) => {
            const validator = z.object({
              name: z.string().min(3).max(255),
              phone: z
                .string()
                .regex(/^[6-9]\d{9}$/)
                .optional(),
              email: z.string().email().optional(),
              age: z.number().min(0).max(120).optional(),
              gender: z.enum(["male", "female"]),
            });
            const data = validator.parse(body);
            const [createdPatient] = await db
              .insert(patients)
              .values(data)
              .returning();
            const { deleted: _, ...patient } = createdPatient;
            set.status = 201;
            return patient;
          },
          {
            body: "patient",
          },
        )
        .get(
          "/:id",
          async ({ params: { id } }) => {
            const [patient] = await db.query.patients.findMany({
              where: and(eq(patients.id, id), eq(patients.deleted, false)),
              columns: {
                deleted: false,
              },
            });

            if (!patient) {
              throw new NotFoundError(`Patient with id: ${id} not found`);
            }

            return patient;
          },
          {
            params: t.Object({
              id: t.Numeric(),
            }),
          },
        )
        .put(
          "/:id",
          async ({ params: { id }, body }) => {
            const validator = z.object({
              name: z.string().min(3).max(255),
              phone: z
                .string()
                .regex(/^[6-9]\d{9}$/)
                .optional(),
              email: z.string().email().optional(),
              age: z.number().optional(),
              gender: z.enum(["male", "female"]).optional(),
            });
            const data = validator.parse(body);
            const [updatedPatient] = await db
              .update(patients)
              .set(data)
              .where(and(eq(patients.id, id), eq(patients.deleted, false)))
              .returning();
            if (updatedPatient === undefined) {
              throw new NotFoundError(`Patient with id: ${id} not found`);
            }
            const { deleted: _, ...updatedPatientFiltered } = updatedPatient;
            return updatedPatientFiltered;
          },
          {
            body: "patient",
            params: t.Object({
              id: t.Numeric(),
            }),
          },
        )
        .delete(
          "/:id",
          async ({ params: { id }, set }) => {
            const [deletedPatient] = await db
              .update(patients)
              .set({ deleted: true })
              .where(and(eq(patients.id, id), eq(patients.deleted, false)))
              .returning();
            if (deletedPatient) {
              set.status = 204;
            } else {
              throw new NotFoundError(`Patient with id: ${id} not found`);
            }
          },
          {
            params: t.Object({ id: t.Numeric() }),
          },
        ),
  );

export default patientsController;
