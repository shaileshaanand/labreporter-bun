import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, it, mock } from "bun:test";
import { faker } from "@faker-js/faker";
import { type InferSelectModel, eq } from "drizzle-orm";
import { type BunSQLiteDatabase, drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import app from "../app";
import * as schema from "../db/schema";
import { templateFactory, userFactory } from "./factories";
import fireRequest from "./fireRequest";

let db: BunSQLiteDatabase<typeof schema>;
let user: InferSelectModel<typeof schema.users>;
let userPassword: string;

describe("Template Tests", () => {
  beforeEach(async () => {
    db = drizzle(new Database(":memory:"), { schema });
    migrate(db, { migrationsFolder: "src/db/migrations" });
    mock.module("../context/db", () => {
      return { default: db };
    });
    userPassword = faker.internet.password();
    user = await userFactory(db, {
      password: userPassword,
    });
  });

  it("Should create a new Template", async () => {
    const template = {
      name: faker.lorem.sentence(),
      content: faker.lorem.paragraph(),
    };

    const [response, data] = await fireRequest(app, "/template", {
      method: "POST",
      body: template,
      authUserId: user.id,
    });

    expect(response.status).toBe(201);
    expect(data.id).toBeDefined();

    const createdTemplate = await db.query.templates.findFirst({
      where: eq(schema.templates.id, data.id),
    });

    if (!createdTemplate) {
      throw new Error("Template not found");
    }

    expect(createdTemplate.name).toBe(template.name);
    expect(createdTemplate.content).toBe(template.content);
    expect(createdTemplate.deleted).toBe(false);
  });

  it("Should not create a new Template if unauthorized", async () => {
    const template = {
      name: faker.lorem.sentence(),
      content: faker.lorem.paragraph(),
    };

    const [response, data] = await fireRequest(app, "/template", {
      method: "POST",
      body: template,
    });

    expect(response.status).toBe(401);
    expect(data.id).toBeUndefined();

    const templatesInDB = await db.query.templates.findMany();

    expect(templatesInDB.length).toBe(0);
  });

  it.each([[null], [undefined], ["ab"]])(
    "Should not create a new Template with invalid name: %s",
    async (name) => {
      const template = {
        name,
        content: faker.lorem.paragraph(),
      };

      const [response, data] = await fireRequest(app, "/template", {
        method: "POST",
        body: template,
        authUserId: user.id,
      });

      expect(response.status).toBe(400);
      expect(data.id).toBeUndefined();
      const templatesInDB = await db.query.templates.findMany();
      expect(templatesInDB.length).toBe(0);
    },
  );

  it.each([[null], [undefined], ["ab"]])(
    "Should not create a new Template with invalid content: %s",
    async (content) => {
      const template = {
        name: faker.lorem.sentence(),
        content,
      };

      const [response, data] = await fireRequest(app, "/template", {
        method: "POST",
        body: template,
        authUserId: user.id,
      });

      expect(response.status).toBe(400);
      expect(data.id).toBeUndefined();
      const templatesInDB = await db.query.templates.findMany();
      expect(templatesInDB.length).toBe(0);
    },
  );

  it("Should get a template", async () => {
    const template = await templateFactory(db);

    const [response, data] = await fireRequest(
      app,
      `/template/${template.id}`,
      {
        authUserId: user.id,
      },
    );

    expect(response.status).toBe(200);
    expect(data.id).toBeDefined();
    expect(data.name).toBe(template.name);
    expect(data.content).toBe(template.content);
    expect(data.deleted).toBeUndefined();
  });

  it("Should not get a template if unauthorized", async () => {
    const template = await templateFactory(db);

    const [response, data] = await fireRequest(app, `/template/${template.id}`);

    expect(response.status).toBe(401);
    expect(data.id).toBeUndefined();
    expect(data.name).toBeUndefined();
    expect(data.content).toBeUndefined();
    expect(data.deleted).toBeUndefined();
    expect(data.errors).toBeDefined();
  });

  it("Should get not a template id is invalid", async () => {
    const template = await templateFactory(db);

    const [response, data] = await fireRequest(
      app,
      `/template/${template.id + 1}`,
      {
        authUserId: user.id,
      },
    );

    expect(response.status).toBe(404);
    expect(data.id).toBeUndefined();
    expect(data.name).toBeUndefined();
    expect(data.content).toBeUndefined();
    expect(data.deleted).toBeUndefined();
    expect(data.errors).toBeDefined();
  });

  it("Should not get a deleted template", async () => {
    const template = await templateFactory(db, {
      deleted: true,
    });

    const [response, data] = await fireRequest(
      app,
      `/template/${template.id}`,
      {
        authUserId: user.id,
      },
    );

    expect(response.status).toBe(404);
    expect(data.id).toBeUndefined();
    expect(data.name).toBeUndefined();
    expect(data.content).toBeUndefined();
    expect(data.deleted).toBeUndefined();
    expect(data.errors).toBeDefined();
  });

  it("Should update a template", async () => {
    const template = await templateFactory(db);

    const newTemplate = {
      name: faker.lorem.sentence(),
      content: faker.lorem.paragraph(),
    };

    const [response, data] = await fireRequest(
      app,
      `/template/${template.id}`,
      {
        method: "PUT",
        body: newTemplate,
        authUserId: user.id,
      },
    );

    expect(response.status).toBe(200);
    expect(data.id).toBeDefined();
    expect(data.name).toBe(newTemplate.name);
    expect(data.content).toBe(newTemplate.content);
    expect(data.deleted).toBeUndefined();

    const updatedTemplate = await db.query.templates.findFirst({
      where: eq(schema.templates.id, template.id),
    });
    if (!updatedTemplate) {
      throw new Error("Template not found");
    }
    expect(updatedTemplate.id).toBe(template.id);
    expect(updatedTemplate.name).toBe(newTemplate.name);
    expect(updatedTemplate.content).toBe(newTemplate.content);
    expect(updatedTemplate.deleted).toBe(false);
  });

  it("Should update a template", async () => {
    const template = await templateFactory(db);

    const newTemplate = {
      name: faker.lorem.sentence(),
      content: faker.lorem.paragraph(),
    };

    const [response, data] = await fireRequest(
      app,
      `/template/${template.id}`,
      {
        method: "PUT",
        body: newTemplate,
        authUserId: user.id,
      },
    );

    expect(response.status).toBe(200);
    expect(data.id).toBeDefined();
    expect(data.name).toBe(newTemplate.name);
    expect(data.content).toBe(newTemplate.content);
    expect(data.deleted).toBeUndefined();

    const updatedTemplate = await db.query.templates.findFirst({
      where: eq(schema.templates.id, template.id),
    });

    if (!updatedTemplate) {
      throw new Error("Template not found");
    }

    expect(updatedTemplate.id).toBe(template.id);
    expect(updatedTemplate.name).toBe(newTemplate.name);
    expect(updatedTemplate.content).toBe(newTemplate.content);
    expect(updatedTemplate.deleted).toBe(false);
  });

  it("Should not update a template if id is invalid", async () => {
    const template = await templateFactory(db);

    const newTemplate = {
      name: faker.lorem.sentence(),
      content: faker.lorem.paragraph(),
    };

    const [response, data] = await fireRequest(
      app,
      `/template/${template.id + 1}`,
      {
        method: "PUT",
        body: newTemplate,
        authUserId: user.id,
      },
    );

    expect(response.status).toBe(404);
    expect(data.id).toBeUndefined();
    expect(data.name).toBeUndefined();
    expect(data.content).toBeUndefined();
    expect(data.deleted).toBeUndefined();
    expect(data.errors).toBeDefined();

    const updatedTemplate = await db.query.templates.findFirst({
      where: eq(schema.templates.id, template.id),
    });

    if (!updatedTemplate) {
      throw new Error("Template not found");
    }

    expect(updatedTemplate.id).toBe(template.id);
    expect(updatedTemplate.name).toBe(template.name);
    expect(updatedTemplate.content).toBe(template.content);
    expect(updatedTemplate.deleted).toBe(false);
  });

  it("Should not update a template if unauthorized", async () => {
    const template = await templateFactory(db);
    const newTemplate = {
      name: faker.lorem.sentence(),
      content: faker.lorem.paragraph(),
    };

    const [response, data] = await fireRequest(
      app,
      `/template/${template.id}`,
      {
        method: "PUT",
        body: newTemplate,
      },
    );

    expect(response.status).toBe(401);
    expect(data.id).toBeUndefined();
    expect(data.name).toBeUndefined();
    expect(data.content).toBeUndefined();
    expect(data.deleted).toBeUndefined();
    expect(data.errors).toBeDefined();
    const updatedTemplate = await db.query.templates.findFirst({
      where: eq(schema.templates.id, template.id),
    });

    if (!updatedTemplate) {
      throw new Error("Template not found");
    }

    expect(updatedTemplate.id).toBe(template.id);
    expect(updatedTemplate.name).toBe(template.name);
    expect(updatedTemplate.content).toBe(template.content);
    expect(updatedTemplate.deleted).toBe(false);
  });

  it("Should delete a template", async () => {
    const template = await templateFactory(db);

    const [response] = await fireRequest(app, `/template/${template.id}`, {
      method: "DELETE",
      authUserId: user.id,
    });

    expect(response.status).toBe(204);
    const deletedTemplate = await db.query.templates.findFirst();

    if (!deletedTemplate) {
      throw new Error("Template not found");
    }

    expect(deletedTemplate.id).toBe(template.id);
    expect(deletedTemplate.name).toBe(template.name);
    expect(deletedTemplate.content).toBe(template.content);
    expect(deletedTemplate.deleted).toBe(true);
  });

  it("Should not delete a template if unauthorized", async () => {
    const template = await templateFactory(db);

    const [response, data] = await fireRequest(
      app,
      `/template/${template.id}`,
      {
        method: "DELETE",
      },
    );

    expect(response.status).toBe(401);
    expect(data.id).toBeUndefined();
    expect(data.name).toBeUndefined();
    expect(data.content).toBeUndefined();
    expect(data.deleted).toBeUndefined();
    expect(data.errors).toBeDefined();

    const deletedTemplate = await db.query.templates.findFirst();

    if (!deletedTemplate) {
      throw new Error("Template not found");
    }

    expect(deletedTemplate.id).toBe(template.id);
    expect(deletedTemplate.name).toBe(template.name);
    expect(deletedTemplate.content).toBe(template.content);
    expect(deletedTemplate.deleted).toBe(false);
  });

  it("Should not delete a template if id is invalid", async () => {
    const template = await templateFactory(db);

    const [response, data] = await fireRequest(
      app,
      `/template/${template.id + 1}`,
      {
        method: "DELETE",
        authUserId: user.id,
      },
    );

    expect(response.status).toBe(404);
    expect(data.id).toBeUndefined();
    expect(data.name).toBeUndefined();
    expect(data.content).toBeUndefined();
    expect(data.deleted).toBeUndefined();
    expect(data.errors).toBeDefined();

    const deletedTemplate = await db.query.templates.findFirst();

    if (!deletedTemplate) {
      throw new Error("Template not found");
    }

    expect(deletedTemplate.id).toBe(template.id);
    expect(deletedTemplate.name).toBe(template.name);
    expect(deletedTemplate.content).toBe(template.content);
    expect(deletedTemplate.deleted).toBe(false);
  });

  it("Should not delete a deleted template", async () => {
    const template = await templateFactory(db, { deleted: true });

    const [response, data] = await fireRequest(
      app,
      `/template/${template.id}`,
      {
        method: "DELETE",
        authUserId: user.id,
      },
    );

    expect(response.status).toBe(404);
    expect(data.id).toBeUndefined();
    expect(data.name).toBeUndefined();
    expect(data.content).toBeUndefined();
    expect(data.deleted).toBeUndefined();
    expect(data.errors).toBeDefined();

    const deletedTemplate = await db.query.templates.findFirst();

    if (!deletedTemplate) {
      throw new Error("Template not found");
    }

    expect(deletedTemplate.id).toBe(template.id);
    expect(deletedTemplate.name).toBe(template.name);
    expect(deletedTemplate.content).toBe(template.content);
    expect(deletedTemplate.deleted).toBe(true);
  });

  it("Should list all non deleted templates", async () => {
    const templates = await Promise.all(
      Array.from({ length: 10 }).map(() =>
        templateFactory(db, {
          deleted: faker.datatype.boolean({ probability: 0.75 }),
        }),
      ),
    );

    const notDeletedTemplates = templates.filter(
      (template) => !template.deleted,
    );
    const notDeletedTemplatesCount = notDeletedTemplates.length;
    const [response, data] = await fireRequest(app, "/template", {
      method: "GET",
      authUserId: user.id,
    });

    expect(response.status).toBe(200);
    expect(data.length).toBe(notDeletedTemplatesCount);
    notDeletedTemplates.map((template) => {
      const templateInResponse = data.find((t: any) => t.id === template.id);
      expect(templateInResponse).toBeDefined();
      expect(templateInResponse.name).toBe(template.name);
      expect(templateInResponse.content).toBe(template.content);
      expect(templateInResponse.deleted).toBeUndefined();
    });
  });

  it("Should not list all templates if unauthorized", async () => {
    await Promise.all(
      Array.from({ length: 10 }).map(() => templateFactory(db)),
    );

    const [response, data] = await fireRequest(app, "/template", {
      method: "GET",
    });

    expect(response.status).toBe(401);
    expect(data.errors).toBeDefined();
  });
});
