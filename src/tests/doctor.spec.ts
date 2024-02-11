import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, it, mock } from "bun:test";
import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { type BunSQLiteDatabase, drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import app from "../app";
import * as schema from "../db/schema";
import fireRequest from "./fireRequest";

let db: BunSQLiteDatabase<typeof schema>;

describe("Doctor Tests", () => {
  beforeEach(() => {
    db = drizzle(new Database(":memory:"), { schema });
    migrate(db, { migrationsFolder: "src/db/migrations" });
    mock.module("../context/db", () => {
      return { default: db };
    });
  });
  it("Should list all doctors", async () => {
    const doctors = await db
      .insert(schema.doctors)
      .values(
        [...Array(3)].map(() => ({
          name: faker.person.fullName(),
          phone: faker.string.numeric(10),
          email: faker.internet.email(),
        })),
      )
      .returning();

    const [response, data] = await fireRequest(app, "/doctor");

    expect(response.status).toBe(200);
    expect(data.length).toBe(3);

    doctors.map((doctor) => {
      const createdDoctor = data.filter((d: any) => d.id === doctor.id)[0];
      expect(createdDoctor.name).toBe(doctor.name);
      expect(createdDoctor.phone).toBe(doctor.phone);
      expect(createdDoctor.email).toBe(doctor.email);
      expect(createdDoctor.deleted).toBe(undefined);
    });
  });
  it("Should create a new doctor", async () => {
    const body = {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.string.numeric(10),
    };
    const [response, data] = await fireRequest(app, "/doctor", {
      method: "POST",
      body,
    });

    expect(response.status).toBe(201);
    expect(data.id).toBeDefined();
    const [createdDoctor] = await db
      .select()
      .from(schema.doctors)
      .where(eq(schema.doctors.id, data.id));
    expect(createdDoctor).toBeDefined();
    const doctor = createdDoctor as Exclude<typeof createdDoctor, undefined>;
    expect(doctor.id).toBe(data.id);
    expect(doctor.name).toBe(data.name);
    expect(doctor.email).toBe(data.email);
    expect(doctor.phone).toBe(data.phone);
    expect(doctor.deleted).toBe(false);
    expect(data.deleted).toBe(undefined);
  });
});
