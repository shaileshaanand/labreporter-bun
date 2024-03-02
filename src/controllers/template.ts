import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { z } from "zod";
import context from "../context";
import db from "../context/db";
import { templates } from "../db/schema";
import { NotFoundError } from "../errors";

const templatesController = new Elysia({ prefix: "/template" })
  .use(context)
  .guard(
    {
      ensureLoggedIn: true,
    },
    (app) =>
      app
        .model({
          template: t.Object({
            name: t.String(),
            content: t.String(),
          }),
        })
        .get("/", async () => {
          const templatesList = await db.query.templates.findMany({
            columns: {
              deleted: false,
            },
            where: eq(templates.deleted, false),
          });
          return templatesList;
        })
        .post(
          "/",
          async ({ body, set }) => {
            const validator = z.object({
              name: z.string().min(3),
              content: z.string().min(3),
            });
            const data = validator.parse(body);
            const [createdTemplate] = await db
              .insert(templates)
              .values(data)
              .returning();
            const { deleted: _, ...template } = createdTemplate;
            set.status = 201;
            return template;
          },
          {
            body: "template",
          },
        )
        .get(
          "/:id",
          async ({ params: { id } }) => {
            const [template] = await db.query.templates.findMany({
              where: and(eq(templates.id, id), eq(templates.deleted, false)),
              columns: {
                deleted: false,
              },
            });
            if (!template) {
              throw new NotFoundError(`Template with id: ${id} not found`);
            }
            return template;
          },
          {
            params: t.Object({ id: t.Numeric() }),
          },
        )
        .put(
          "/:id",
          async ({ params: { id }, body }) => {
            const validator = z.object({
              name: z.string().min(3),
              content: z.string().min(3),
            });
            const data = validator.parse(body);
            const [updatedTemplate] = await db
              .update(templates)
              .set(data)
              .where(eq(templates.id, id))
              .returning();

            if (!updatedTemplate) {
              throw new NotFoundError(`Template with id: ${id} not found`);
            }

            const { deleted: _, ...template } = updatedTemplate;
            return template;
          },
          {
            body: "template",
            params: t.Object({ id: t.Numeric() }),
          },
        )
        .delete(
          "/:id",
          async ({ params: { id }, set }) => {
            const [deletedTemplate] = await db
              .update(templates)
              .set({ deleted: true })
              .where(and(eq(templates.id, id), eq(templates.deleted, false)))
              .returning();
            if (deletedTemplate) {
              set.status = 204;
            } else {
              throw new NotFoundError(`Template with id: ${id} not found`);
            }
          },
          {
            params: t.Object({ id: t.Numeric() }),
          },
        ),
  );

export default templatesController;
