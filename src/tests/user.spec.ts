import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, it, mock } from "bun:test";
import { faker } from "@faker-js/faker";
import { type BunSQLiteDatabase, drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import app from "../app";
import * as schema from "../db/schema";
import { userFactory } from "./factories";
import fireRequest from "./fireRequest";

let db: BunSQLiteDatabase<typeof schema>;

describe("User Tests", () => {
  beforeEach(() => {
    db = drizzle(new Database(":memory:"), { schema });
    migrate(db, { migrationsFolder: "src/db/migrations" });
    mock.module("../context/db", () => {
      return { default: db };
    });
  });

  it("Should get a user", async () => {
    const user = await userFactory(db, { password: faker.internet.password() });

    const [response, data] = await fireRequest(app, `/user/${user.id}`);

    expect(response.status).toBe(200);
    expect(data.firstName).toBe(user.firstName);
    expect(data.lastName).toBe(user.lastName);
    expect(data.username).toBe(user.username);
    expect(data.passwordHash).toBeUndefined();
    expect(data.deleted).toBeUndefined();
  });

  it("Should get not a user if id is invalid", async () => {
    const user = await userFactory(db, { password: faker.internet.password() });

    const [response] = await fireRequest(app, `/user/${user.id + 1}`);

    expect(response.status).toBe(404);
  });

  it("Should not get a deleted user", async () => {
    const user = await userFactory(db, {
      deleted: true,
      password: faker.internet.password(),
    });

    const [response] = await fireRequest(app, `/user/${user.id}`);

    expect(response.status).toBe(404);
  });
});
