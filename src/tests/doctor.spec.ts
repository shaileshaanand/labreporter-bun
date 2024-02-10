import { describe, expect, it, mock } from "bun:test";
import { Database } from "bun:sqlite";
import { faker } from "@faker-js/faker";
import fireRequest from "./fireRequest";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "../db/schema";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

const db = drizzle(new Database(":memory:"), { schema });
migrate(db, { migrationsFolder: "src/db/migrations" });

// mock.module("../context/db", () => {
//   return { default: db };
// });

const app = (await import("../app")).default;

describe("Doctor Tests", () => {
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
  // it("Should create a new doctor", async () => {
  //   const response1 = await app.handle(new Request("http://localhost/doctor"));
  //   console.log({ response1 });

  //   const body = {
  //     name: faker.person.fullName(),
  //     email: faker.internet.email(),
  //     phone: faker.string.numeric(10),
  //   };
  //   const [response, data] = await fireRequest(app, "/doctor/", {
  //     method: "POST",
  //     body,
  //   });

  //   console.log({ response });

  //   expect(response.status).toBe(201);
  //   expect(data.id).toBeDefined();
  //   const createdDoctor = await db.query.doctors.findFirst({
  //     with: { id: data.id },
  //   });
  //   // expect(createdDoctor).toBeDefined();
  //   // const doctor = createdDoctor as Exclude<typeof createdDoctor, undefined>;
  //   // expect(doctor.id).toBe(data.id);
  //   console.log(createdDoctor);
  // });
});
