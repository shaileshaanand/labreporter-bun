import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, it, mock } from "bun:test";
import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { type BunSQLiteDatabase, drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import app from "../app";
import * as schema from "../db/schema";
import fireRequest from "./fireRequest";
import { generatePhoneNumber } from "./helpers";
import { doctorFactory } from "./factories";

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
          phone: generatePhoneNumber(),
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
      phone: generatePhoneNumber(),
    };
    const [response, data] = await fireRequest(app, "/doctor", {
      method: "POST",
      body,
    });

    expect(response.status).toBe(201);
    expect(data.id).toBeDefined();
    const doctorsInDB = await db.query.doctors.findMany({
      where: eq(schema.doctors.id, data.id),
    });

    expect(doctorsInDB.length).toBe(1);
    expect(doctorsInDB[0]).toBeDefined();
    const doctor = doctorsInDB[0] as Exclude<
      (typeof doctorsInDB)[0],
      undefined
    >;
    expect(doctor.id).toBe(data.id);
    expect(doctor.name).toBe(data.name);
    expect(doctor.email).toBe(data.email);
    expect(doctor.phone).toBe(data.phone);
    expect(doctor.deleted).toBe(false);
    expect(data.deleted).toBe(undefined);
  });

  it("Should create a new doctor without email", async () => {
    const body = {
      name: faker.person.fullName(),
      phone: generatePhoneNumber(),
    };
    const [response, data] = await fireRequest(app, "/doctor", {
      method: "POST",
      body,
    });

    expect(response.status).toBe(201);
    expect(data.id).toBeDefined();
    const doctorsInDB = await db.query.doctors.findMany({
      where: eq(schema.doctors.id, data.id),
    });

    expect(doctorsInDB.length).toBe(1);
    expect(doctorsInDB[0]).toBeDefined();
    const doctor = doctorsInDB[0] as Exclude<
      (typeof doctorsInDB)[0],
      undefined
    >;
    expect(doctor.id).toBe(data.id);
    expect(doctor.name).toBe(data.name);
    expect(doctor.email).toBe(data.email);
    expect(doctor.email).toBe(null);
    expect(doctor.phone).toBe(data.phone);
    expect(doctor.deleted).toBe(false);
    expect(data.deleted).toBe(undefined);
  });

  it("Should create a new doctor without phone", async () => {
    const body = {
      name: faker.person.fullName(),
      email: faker.internet.email(),
    };
    const [response, data] = await fireRequest(app, "/doctor", {
      method: "POST",
      body,
    });

    expect(response.status).toBe(201);
    expect(data.id).toBeDefined();
    const doctorsInDB = await db.query.doctors.findMany({
      where: eq(schema.doctors.id, data.id),
    });

    expect(doctorsInDB.length).toBe(1);
    expect(doctorsInDB[0]).toBeDefined();
    const doctor = doctorsInDB[0] as Exclude<
      (typeof doctorsInDB)[0],
      undefined
    >;
    expect(doctor.id).toBe(data.id);
    expect(doctor.name).toBe(data.name);
    expect(doctor.email).toBe(data.email);
    expect(doctor.phone).toBe(data.phone);
    expect(doctor.phone).toBe(null);
    expect(doctor.deleted).toBe(false);
    expect(data.deleted).toBe(undefined);
  });

  it("Should not create a new doctor without name", async () => {
    const body = {
      email: faker.internet.email(),
      phone: generatePhoneNumber(),
    };
    const [response, data] = await fireRequest(app, "/doctor", {
      method: "POST",
      body,
    });

    expect(response.status).toBe(400);
    expect(data.id).toBeUndefined();
    const doctorsInDB = await db.query.doctors.findMany({
      where: eq(schema.doctors.id, data.id),
    });
    expect(doctorsInDB.length).toBe(0);
  });

  it("Should not create a new doctor if name is less than 3 char long", async () => {
    const body = {
      name: "MD",
      email: faker.internet.email(),
      phone: generatePhoneNumber(),
    };
    const [response, data] = await fireRequest(app, "/doctor", {
      method: "POST",
      body,
    });

    expect(response.status).toBe(400);
    expect(data.id).toBeUndefined();
    const doctorsInDB = await db.query.doctors.findMany({
      where: eq(schema.doctors.id, data.id),
    });
    expect(doctorsInDB.length).toBe(0);
  });

  it("Should not create a new doctor if name is more than 255 char long", async () => {
    const body = {
      name: faker.string.alpha(256),
      email: faker.internet.email(),
      phone: generatePhoneNumber(),
    };
    const [response, data] = await fireRequest(app, "/doctor", {
      method: "POST",
      body,
    });

    expect(response.status).toBe(400);
    expect(data.id).toBeUndefined();
    const doctorsInDB = await db.query.doctors.findMany({
      where: eq(schema.doctors.id, data.id),
    });
    expect(doctorsInDB.length).toBe(0);
  });

  it("Should not create a new doctor if email is invalid", async () => {
    const body = {
      name: faker.person.fullName(),
      email: faker.string.alpha(20),
      phone: generatePhoneNumber(),
    };
    const [response, data] = await fireRequest(app, "/doctor", {
      method: "POST",
      body,
    });

    expect(response.status).toBe(400);
    expect(data.id).toBeUndefined();
    const doctorsInDB = await db.query.doctors.findMany({
      where: eq(schema.doctors.id, data.id),
    });
    expect(doctorsInDB.length).toBe(0);
  });

  it("Should not create a new doctor if phone does not start with 6,7,8,9", async () => {
    const body = {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: `${faker.number.int({
        min: 1,
        max: 5,
      })}${faker.string.numeric(9)}`,
    };
    const [response, data] = await fireRequest(app, "/doctor", {
      method: "POST",
      body,
    });

    expect(response.status).toBe(400);
    expect(data.id).toBeUndefined();
    const doctorsInDB = await db.query.doctors.findMany({
      where: eq(schema.doctors.id, data.id),
    });
    expect(doctorsInDB.length).toBe(0);
  });

  it("Should not create a new doctor if phone is not 10 chars long", async () => {
    const body = {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: generatePhoneNumber().slice(0, 9),
    };
    const [response, data] = await fireRequest(app, "/doctor", {
      method: "POST",
      body,
    });

    expect(response.status).toBe(400);
    expect(data.id).toBeUndefined();
    const doctorsInDB = await db.query.doctors.findMany({
      where: eq(schema.doctors.id, data.id),
    });
    expect(doctorsInDB.length).toBe(0);
  });

  it("Should not create a new doctor if phone has non numeric chars", async () => {
    const body = {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.string.sample(10),
    };
    const [response, data] = await fireRequest(app, "/doctor", {
      method: "POST",
      body,
    });

    expect(response.status).toBe(400);
    expect(data.id).toBeUndefined();
    const doctorsInDB = await db.query.doctors.findMany({
      where: eq(schema.doctors.id, data.id),
    });
    expect(doctorsInDB.length).toBe(0);
  });

  it("Should get a doctor", async () => {
    const doctor = await doctorFactory(db);

    const [response, data] = await fireRequest(app, `/doctor/${doctor.id}`);

    expect(response.status).toBe(200);
    expect(data.id).toBe(doctor.id);
    expect(data.name).toBe(doctor.name);
    expect(data.phone).toBe(doctor.phone);
    expect(data.email).toBe(doctor.email);
    expect(data.deleted).toBe(undefined);
  });

  it("Should not get a doctor if id is invalid", async () => {
    const doctor = await doctorFactory(db);

    const [response] = await fireRequest(app, `/doctor/${doctor.id + 1}`);

    expect(response.status).toBe(404);
  });

  it("Should update a doctor", async () => {
    const doctor1 = await doctorFactory(db);
    const doctor2 = await doctorFactory(db);
    const updatedDoctorPayload = {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: generatePhoneNumber(),
    };

    const [response, data] = await fireRequest(app, `/doctor/${doctor2.id}`, {
      method: "PUT",
      body: updatedDoctorPayload,
    });

    expect(response.status).toBe(200);
    const [updatedDoctor2] = await db.query.doctors.findMany({
      where: eq(schema.doctors.id, doctor2.id),
    });
    expect(updatedDoctor2.id).toBe(doctor2.id);
    expect(updatedDoctor2.name).toBe(updatedDoctorPayload.name);
    expect(updatedDoctor2.email).toBe(updatedDoctorPayload.email);
    expect(updatedDoctor2.phone).toBe(updatedDoctorPayload.phone);
    expect(updatedDoctor2.deleted).toBe(false);
    expect(data.id).toBe(doctor2.id);
    expect(data.name).toBe(updatedDoctorPayload.name);
    expect(data.email).toBe(updatedDoctorPayload.email);
    expect(data.phone).toBe(updatedDoctorPayload.phone);
    expect(data.deleted).toBe(undefined);
    const [updatedDoctor1] = await db.query.doctors.findMany({
      where: eq(schema.doctors.id, doctor1.id),
    });
    expect(updatedDoctor1.id).toBe(doctor1.id);
    expect(updatedDoctor1.name).toBe(doctor1.name);
    expect(updatedDoctor1.email).toBe(doctor1.email);
    expect(updatedDoctor1.phone).toBe(doctor1.phone);
    expect(updatedDoctor1.deleted).toBe(false);
  });

  it("Should not update a doctor if id is invalid", async () => {
    const doctor = await doctorFactory(db);
    const updatedDoctorPayload = {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: generatePhoneNumber(),
    };

    const [response] = await fireRequest(app, `/doctor/${doctor.id + 1}`, {
      method: "PUT",
      body: updatedDoctorPayload,
    });

    expect(response.status).toBe(404);
    const [updatedDoctor] = await db.query.doctors.findMany({
      where: eq(schema.doctors.id, doctor.id),
    });

    expect(updatedDoctor.id).toBe(doctor.id);
    expect(updatedDoctor.name).toBe(doctor.name);
    expect(updatedDoctor.email).toBe(doctor.email);
    expect(updatedDoctor.phone).toBe(doctor.phone);
    expect(updatedDoctor.deleted).toBe(false);
  });

  it("Should delete a doctor", async () => {
    const doctor = await doctorFactory(db);

    const [response] = await fireRequest(app, `/doctor/${doctor.id}`, {
      method: "DELETE",
    });

    expect(response.status).toBe(204);
    const [deletedDoctor] = await db.query.doctors.findMany({
      where: eq(schema.doctors.id, doctor.id),
    });

    expect(deletedDoctor.id).toBe(doctor.id);
    expect(deletedDoctor.name).toBe(doctor.name);
    expect(deletedDoctor.email).toBe(doctor.email);
    expect(deletedDoctor.phone).toBe(doctor.phone);
    expect(deletedDoctor.deleted).toBe(true);
  });

  it("Should not delete a doctor if id is invalid", async () => {
    const doctor = await doctorFactory(db);

    const [response] = await fireRequest(app, `/doctor/${doctor.id + 1}`, {
      method: "DELETE",
    });

    expect(response.status).toBe(404);
    const [deletedDoctor] = await db.query.doctors.findMany({
      where: eq(schema.doctors.id, doctor.id),
    });

    expect(deletedDoctor.id).toBe(doctor.id);
    expect(deletedDoctor.name).toBe(doctor.name);
    expect(deletedDoctor.email).toBe(doctor.email);
    expect(deletedDoctor.phone).toBe(doctor.phone);
    expect(deletedDoctor.deleted).toBe(false);
  });
});
