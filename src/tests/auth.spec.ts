import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, it, mock } from "bun:test";
import { faker } from "@faker-js/faker";
import { type BunSQLiteDatabase, drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { jwtVerify } from "jose";
import app from "../app";
import * as schema from "../db/schema";
import env from "../env";
import { userFactory } from "./factories";
import fireRequest from "./fireRequest";

let db: BunSQLiteDatabase<typeof schema>;

describe("Auth Tests", () => {
  beforeEach(() => {
    db = drizzle(new Database(":memory:"), { schema });
    migrate(db, { migrationsFolder: "src/db/migrations" });
    mock.module("../context/db", () => {
      return { default: db };
    });
  });

  it("Should login a user", async () => {
    const password = faker.internet.password();
    const user = await userFactory(db, { password });
    const [response, data] = await fireRequest(app, "/auth/login", {
      method: "POST",
      body: {
        username: user.username,
        password,
      },
    });
    expect(response.status).toBe(200);
    expect(data.token).toBeDefined();
    expect(
      (async () =>
        await jwtVerify(
          data.token,
          new TextEncoder().encode(env.JWT_SECRET),
        ))(),
    ).resolves.toBeDefined();
    expect(data.user.id).toBeDefined();
    expect(data.user.firstName).toBe(user.firstName);
    expect(data.user.lastName).toBe(user.lastName);
    expect(data.user.username).toBe(user.username);
    expect(data.user.passwordHash).toBeUndefined();
    expect(data.user.password).toBeUndefined();
    expect(data.user.deleted).toBeUndefined();
  });

  it("Should not login a deleted user", async () => {
    const password = faker.internet.password();
    const user = await userFactory(db, { deleted: true, password });
    const [response, data] = await fireRequest(app, "/auth/login", {
      method: "POST",
      body: {
        username: user.username,
        password: faker.internet.password(),
      },
    });
    expect(response.status).toBe(404);
    expect(data.token).toBeUndefined();
  });

  it.each([
    [faker.internet.userName(), undefined],
    [faker.internet.userName(), faker.internet.password()],
  ])(
    "Should not login a user if username:password :: %s:%s",
    async (username, password) => {
      const correctPassword = faker.internet.password();
      const user = await userFactory(db, {
        password: correctPassword,
      });

      const [response] = await fireRequest(app, "/auth/login", {
        method: "POST",
        body: {
          username: username ?? user.username,
          password: password ?? correctPassword,
        },
      });
      expect(response.status).toBe(404);
    },
  );

  it.each([
    ["", undefined],
    [undefined, ""],
    ["", ""],
  ])(
    "Should not login a user if username:password :: %s:%s (empty)",
    async (username, password) => {
      const correctPassword = faker.internet.password();
      const user = await userFactory(db, { password: correctPassword });
      const [response] = await fireRequest(app, "/auth/login", {
        method: "POST",
        body: {
          username: username ?? user.username,
          password: password ?? correctPassword,
        },
      });
      expect(response.status).toBe(400);
    },
  );
});
