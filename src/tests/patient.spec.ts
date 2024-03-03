import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, it, mock } from "bun:test";
import { faker } from "@faker-js/faker";
import { type InferSelectModel, eq } from "drizzle-orm";
import { type BunSQLiteDatabase, drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import app from "../app";
import * as schema from "../db/schema";
import { patientFactory, userFactory } from "./factories";
import fireRequest from "./fireRequest";
import { generatePhoneNumber } from "./helpers";

let db: BunSQLiteDatabase<typeof schema>;
let user: InferSelectModel<typeof schema.users>;
let userPassword: string;

describe("Patient tests", () => {
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

  it("Should create a new patient", async () => {
    const patient = {
      name: faker.person.firstName(),
      phone: generatePhoneNumber(),
      email: faker.internet.email(),
      age: faker.number.int({ min: 0, max: 120 }),
      gender: faker.helpers.arrayElement(["male", "female"]) as
        | "male"
        | "female",
    };

    const [response, data] = await fireRequest(app, "/patient", {
      method: "POST",
      body: patient,
      authUserId: user.id,
    });

    expect(response.status).toBe(201);
    expect(data.id).toBeDefined();
    const [createdPatient] = await db.query.patients.findMany({
      where: eq(schema.patients.id, data.id),
    });
    expect(createdPatient.name).toBe(patient.name);
    expect(createdPatient.phone).toBe(patient.phone);
    expect(createdPatient.email).toBe(patient.email);
    expect(createdPatient.age).toBe(patient.age);
    expect(createdPatient.gender).toBe(patient.gender);
    expect(createdPatient.deleted).toBe(false);
  });

  it("Should not create a new patient if unauthorized", async () => {
    const patient = {
      name: faker.person.firstName(),
      phone: generatePhoneNumber(),
      email: faker.internet.email(),
      age: faker.number.int({ min: 0, max: 120 }),
      gender: faker.helpers.arrayElement(["male", "female"]) as
        | "male"
        | "female",
    };

    const [response, data] = await fireRequest(app, "/patient", {
      method: "POST",
      body: patient,
    });

    const patientsInDB = await db.query.patients.findMany({});
    expect(response.status).toBe(401);
    expect(data.errors).toBeDefined();
    expect(patientsInDB.length).toBe(0);
  });

  it.each([
    [
      `${faker.number.int({
        min: 1,
        max: 5,
      })}${faker.string.numeric(9)}`,
    ],
    [faker.string.numeric(9)],
    [faker.string.numeric(11)],
    [faker.string.sample(10)],
    [null],
  ])(
    "Should not create patient with invalid phone number: %s",
    async (phone) => {
      const patient = {
        name: faker.person.firstName(),
        phone,
        email: faker.internet.email(),
        age: faker.number.int({ min: 0, max: 120 }),
        gender: faker.helpers.arrayElement(["male", "female"]) as
          | "male"
          | "female",
      };

      const [response, data] = await fireRequest(app, "/patient", {
        method: "POST",
        body: patient,
        authUserId: user.id,
      });

      expect(response.status).toBe(400);
      expect(data.id).toBeUndefined();
      const patientsInDB = await db.query.patients.findMany({
        where: eq(schema.patients.id, data.id),
      });
      expect(patientsInDB.length).toBe(0);
    },
  );

  it.each([[faker.string.alpha(2)], [null], [undefined]])(
    "Should not create patient with invalid name: %s",
    async (name) => {
      const patient = {
        name,
        phone: generatePhoneNumber(),
        email: faker.internet.email(),
        age: faker.number.int({ min: 0, max: 120 }),
        gender: faker.helpers.arrayElement(["male", "female"]) as
          | "male"
          | "female",
      };

      const [response, data] = await fireRequest(app, "/patient", {
        method: "POST",
        body: patient,
        authUserId: user.id,
      });

      expect(response.status).toBe(400);
      expect(data.id).toBeUndefined();
      const patientsInDB = await db.query.patients.findMany({
        where: eq(schema.patients.id, data.id),
      });
      expect(patientsInDB.length).toBe(0);
    },
  );

  it.each([
    [
      faker.number.int({
        min: -100,
        max: 0,
      }),
    ],
    [
      faker.number.int({
        min: 121,
      }),
    ],
    [null],
  ])("Should not create patient with invalid age: %s", async (age) => {
    const patient = {
      name: faker.person.firstName(),
      phone: generatePhoneNumber(),
      email: faker.internet.email(),
      age,
      gender: faker.helpers.arrayElement(["male", "female"]) as
        | "male"
        | "female",
    };

    const [response, data] = await fireRequest(app, "/patient", {
      method: "POST",
      body: patient,
      authUserId: user.id,
    });

    expect(response.status).toBe(400);
    expect(data.id).toBeUndefined();
    const patientsInDB = await db.query.patients.findMany({
      where: eq(schema.patients.id, data.id),
    });
    expect(patientsInDB.length).toBe(0);
  });

  it.each([[faker.lorem.word()], [null], [undefined]])(
    "Should not create patient with invalid gender: %s",
    async (gender) => {
      const patient = {
        name: faker.person.firstName(),
        phone: generatePhoneNumber(),
        email: faker.internet.email(),
        age: faker.number.int({ min: 0, max: 120 }),
        gender,
      };

      const [response, data] = await fireRequest(app, "/patient", {
        method: "POST",
        body: patient,
        authUserId: user.id,
      });

      expect(response.status).toBe(400);
      expect(data.id).toBeUndefined();
      const patientsInDB = await db.query.patients.findMany({
        where: eq(schema.patients.id, data.id),
      });
      expect(patientsInDB.length).toBe(0);
    },
  );

  it.each([[faker.lorem.word()], [null]])(
    "Should not create patient with invalid gender: %s",
    async (email) => {
      const patient = {
        name: faker.person.firstName(),
        phone: generatePhoneNumber(),
        email,
        age: faker.number.int({ min: 0, max: 120 }),
        gender: faker.helpers.arrayElement(["male", "female"]) as
          | "male"
          | "female",
      };

      const [response, data] = await fireRequest(app, "/patient", {
        method: "POST",
        body: patient,
        authUserId: user.id,
      });

      expect(response.status).toBe(400);
      expect(data.id).toBeUndefined();
      const patientsInDB = await db.query.patients.findMany({
        where: eq(schema.patients.id, data.id),
      });
      expect(patientsInDB.length).toBe(0);
    },
  );

  it("Should get a patient", async () => {
    const patient = await patientFactory(db);

    const [response, data] = await fireRequest(app, `/patient/${patient.id}`, {
      method: "GET",
      authUserId: user.id,
    });

    expect(response.status).toBe(200);
    expect(data.id).toBe(patient.id);
    expect(data.name).toBe(patient.name);
    expect(data.phone).toBe(patient.phone);
    expect(data.email).toBe(patient.email);
    expect(data.age).toBe(patient.age);
    expect(data.gender).toBe(patient.gender);
    expect(data.deleted).toBeUndefined();
  });

  it("Should get not a patient if unauthorized", async () => {
    const patient = await patientFactory(db);

    const [response, data] = await fireRequest(app, `/patient/${patient.id}`);

    expect(response.status).toBe(401);
    expect(data.id).toBeUndefined();
    expect(data.name).toBeUndefined();
    expect(data.phone).toBeUndefined();
    expect(data.email).toBeUndefined();
    expect(data.age).toBeUndefined();
    expect(data.gender).toBeUndefined();
    expect(data.deleted).toBeUndefined();
    expect(data.errors).toBeDefined();
  });

  it("Should get not a patient id is invalid", async () => {
    const patient = await patientFactory(db);

    const [response, data] = await fireRequest(
      app,
      `/patient/${patient.id + 1}`,
      {
        method: "GET",
        authUserId: user.id,
      },
    );

    expect(response.status).toBe(404);
    expect(data.id).toBeUndefined();
    expect(data.name).toBeUndefined();
    expect(data.phone).toBeUndefined();
    expect(data.email).toBeUndefined();
    expect(data.age).toBeUndefined();
    expect(data.gender).toBeUndefined();
    expect(data.deleted).toBeUndefined();
    expect(data.errors).toBeDefined();
  });

  it("Should not get a deleted patient", async () => {
    const patient = await patientFactory(db, { deleted: true });

    const [response, data] = await fireRequest(app, `/patient/${patient.id}`, {
      method: "GET",
      authUserId: user.id,
    });

    expect(response.status).toBe(404);
    expect(data.id).toBeUndefined();
    expect(data.name).toBeUndefined();
    expect(data.phone).toBeUndefined();
    expect(data.email).toBeUndefined();
    expect(data.age).toBeUndefined();
    expect(data.gender).toBeUndefined();
    expect(data.deleted).toBeUndefined();
    expect(data.errors).toBeDefined();
  });

  it("Should update a patient", async () => {
    const patient = await patientFactory(db);
    const newPatient = {
      name: faker.person.firstName(),
      phone: generatePhoneNumber(),
      email: faker.internet.email(),
      age: faker.number.int({ min: 0, max: 120 }),
      gender: faker.helpers.arrayElement(["male", "female"]) as
        | "male"
        | "female",
    };

    const [response, data] = await fireRequest(app, `/patient/${patient.id}`, {
      method: "PUT",
      body: newPatient,
      authUserId: user.id,
    });

    expect(response.status).toBe(200);
    expect(data.id).toBe(patient.id);
    expect(data.name).toBe(newPatient.name);
    expect(data.phone).toBe(newPatient.phone);
    expect(data.email).toBe(newPatient.email);
    expect(data.age).toBe(newPatient.age);
    expect(data.gender).toBe(newPatient.gender);
    expect(data.deleted).toBeUndefined();
    const [updatedPatientInDB] = await db.query.patients.findMany();
    expect(updatedPatientInDB.id).toBe(patient.id);
    expect(updatedPatientInDB.name).toBe(newPatient.name);
    expect(updatedPatientInDB.phone).toBe(newPatient.phone);
    expect(updatedPatientInDB.email).toBe(newPatient.email);
    expect(updatedPatientInDB.age).toBe(newPatient.age);
    expect(updatedPatientInDB.gender).toBe(newPatient.gender);
    expect(updatedPatientInDB.deleted).toBe(false);
  });

  it("Should not update a patient if id is invalid", async () => {
    const patient = await patientFactory(db);
    const newPatient = {
      name: faker.person.firstName(),
      phone: generatePhoneNumber(),
      email: faker.internet.email(),
      age: faker.number.int({ min: 0, max: 120 }),
      gender: faker.helpers.arrayElement(["male", "female"]) as
        | "male"
        | "female",
    };

    const [response, data] = await fireRequest(
      app,
      `/patient/${patient.id + 1}`,
      {
        method: "PUT",
        body: newPatient,
        authUserId: user.id,
      },
    );

    const [updatedPatient] = await db.query.patients.findMany();
    expect(response.status).toBe(404);
    expect(data.id).toBeUndefined();
    expect(data.name).toBeUndefined();
    expect(data.phone).toBeUndefined();
    expect(data.email).toBeUndefined();
    expect(data.age).toBeUndefined();
    expect(data.gender).toBeUndefined();
    expect(data.deleted).toBeUndefined();
    expect(data.errors).toBeDefined();
    expect(updatedPatient.id).toBe(patient.id);
    expect(updatedPatient.name).toBe(patient.name);
    expect(updatedPatient.phone).toBe(patient.phone);
    expect(updatedPatient.email).toBe(patient.email);
    expect(updatedPatient.age).toBe(patient.age);
    expect(updatedPatient.gender).toBe(patient.gender);
    expect(updatedPatient.deleted).toBe(false);
  });

  it("Should not update a patient if unauthorized", async () => {
    const patient = await patientFactory(db);
    const newPatient = {
      name: faker.person.firstName(),
      phone: generatePhoneNumber(),
      email: faker.internet.email(),
      age: faker.number.int({ min: 0, max: 120 }),
      gender: faker.helpers.arrayElement(["male", "female"]) as
        | "male"
        | "female",
    };

    const [response, data] = await fireRequest(app, `/patient/${patient.id}`, {
      method: "PUT",
      body: newPatient,
    });

    const [updatedPatient] = await db.query.patients.findMany();
    expect(response.status).toBe(401);
    expect(data.id).toBeUndefined();
    expect(data.name).toBeUndefined();
    expect(data.phone).toBeUndefined();
    expect(data.email).toBeUndefined();
    expect(data.age).toBeUndefined();
    expect(data.gender).toBeUndefined();
    expect(data.deleted).toBeUndefined();
    expect(data.errors).toBeDefined();
    expect(updatedPatient.id).toBe(patient.id);
    expect(updatedPatient.name).toBe(patient.name);
    expect(updatedPatient.phone).toBe(patient.phone);
    expect(updatedPatient.email).toBe(patient.email);
    expect(updatedPatient.age).toBe(patient.age);
    expect(updatedPatient.gender).toBe(patient.gender);
    expect(updatedPatient.deleted).toBe(false);
  });

  it("Should delete a patient", async () => {
    const patient = await patientFactory(db);

    const [response] = await fireRequest(app, `/patient/${patient.id}`, {
      method: "DELETE",
      authUserId: user.id,
    });

    expect(response.status).toBe(204);

    const [deletedPatient] = await db.query.patients.findMany();

    expect(deletedPatient.id).toBe(patient.id);
    expect(deletedPatient.name).toBe(patient.name);
    expect(deletedPatient.phone).toBe(patient.phone);
    expect(deletedPatient.email).toBe(patient.email);
    expect(deletedPatient.age).toBe(patient.age);
    expect(deletedPatient.gender).toBe(patient.gender);
    expect(deletedPatient.deleted).toBe(true);
  });

  it("Should not delete a patient if unauthorized", async () => {
    const patient = await patientFactory(db);

    const [response, data] = await fireRequest(app, `/patient/${patient.id}`, {
      method: "DELETE",
    });

    expect(response.status).toBe(401);

    const [deletedPatient] = await db.query.patients.findMany();
    expect(deletedPatient.id).toBe(patient.id);
    expect(deletedPatient.name).toBe(patient.name);
    expect(deletedPatient.phone).toBe(patient.phone);
    expect(deletedPatient.email).toBe(patient.email);
    expect(deletedPatient.age).toBe(patient.age);
    expect(deletedPatient.gender).toBe(patient.gender);
    expect(deletedPatient.deleted).toBe(false);
    expect(data.errors).toBeDefined();
  });

  it("Should not delete a patient if id is invalid", async () => {
    const patient = await patientFactory(db);

    const [response, data] = await fireRequest(
      app,
      `/patient/${patient.id + 1}`,
      {
        method: "DELETE",
        authUserId: user.id,
      },
    );

    expect(response.status).toBe(404);

    const [deletedPatient] = await db.query.patients.findMany();
    expect(deletedPatient.id).toBe(patient.id);
    expect(deletedPatient.name).toBe(patient.name);
    expect(deletedPatient.phone).toBe(patient.phone);
    expect(deletedPatient.email).toBe(patient.email);
    expect(deletedPatient.age).toBe(patient.age);
    expect(deletedPatient.gender).toBe(patient.gender);
    expect(deletedPatient.deleted).toBe(false);
    expect(data.errors).toBeDefined();
  });

  it("Should not delete a deleted patient", async () => {
    const patient = await patientFactory(db, { deleted: true });

    const [response, data] = await fireRequest(app, `/patient/${patient.id}`, {
      method: "DELETE",
      authUserId: user.id,
    });

    expect(response.status).toBe(404);
    expect(data.errors).toBeDefined();

    const [deletedPatient] = await db.query.patients.findMany();
    expect(deletedPatient.id).toBe(patient.id);
    expect(deletedPatient.name).toBe(patient.name);
    expect(deletedPatient.phone).toBe(patient.phone);
    expect(deletedPatient.email).toBe(patient.email);
    expect(deletedPatient.age).toBe(patient.age);
    expect(deletedPatient.gender).toBe(patient.gender);
    expect(deletedPatient.deleted).toBe(true);
  });

  it("Should list all non deleted patients", async () => {
    const patients = await Promise.all(
      Array.from({ length: 10 }).map(() =>
        patientFactory(db, {
          deleted: faker.datatype.boolean({ probability: 0.75 }),
        }),
      ),
    );

    const notDeletedPatients = patients.filter((patient) => !patient.deleted);

    const notDeletedPatientsCount = notDeletedPatients.length;

    const [response, responseData] = await fireRequest(app, "/patient", {
      authUserId: user.id,
    });

    const { data } = responseData;

    expect(response.status).toBe(200);
    expect(data.length).toBe(notDeletedPatientsCount);
    notDeletedPatients.map((patient) => {
      const patientInResponse = data.find((p: any) => p.id === patient.id);

      expect(patientInResponse).toBeDefined();
      expect(patientInResponse.name).toBe(patient.name);
      expect(patientInResponse.phone).toBe(patient.phone);
      expect(patientInResponse.email).toBe(patient.email);
      expect(patientInResponse.age).toBe(patient.age);
      expect(patientInResponse.gender).toBe(patient.gender);
      expect(patientInResponse.deleted).toBeUndefined();
    });
  });

  it("Should filter patients by name", async () => {
    const [patient1, _, patient3] = await Promise.all([
      patientFactory(db, { name: "patient1x" }),
      patientFactory(db, { name: "patient2x" }),
      patientFactory(db, { name: "ent1x" }),
    ]);

    const [response, responseData] = await fireRequest(app, "/patient", {
      query: { name: "ent1" },
      authUserId: user.id,
    });

    const { data } = responseData;

    expect(response.status).toBe(200);
    expect(data.length).toBe(2);

    const expectedPatients = [patient1, patient3];
    expectedPatients.map((patient) => {
      const patientInResponse = data.find((p: any) => p.id === patient.id);
      expect(patientInResponse).toBeDefined();
      expect(patientInResponse.name).toBe(patient.name);
      expect(patientInResponse.phone).toBe(patient.phone);
      expect(patientInResponse.email).toBe(patient.email);
      expect(patientInResponse.age).toBe(patient.age);
      expect(patientInResponse.gender).toBe(patient.gender);
      expect(patientInResponse.deleted).toBeUndefined();
    });
  });

  it("Should filter patients by phone number", async () => {
    const [patient1, _, patient3] = await Promise.all([
      patientFactory(db, { phone: "7234567890" }),
      patientFactory(db, { phone: "7234567891" }),
      patientFactory(db, { phone: "7234567890" }),
    ]);

    const [response, responseData] = await fireRequest(app, "/patient", {
      query: { phone: "7234567890" },
      authUserId: user.id,
    });

    const { data } = responseData;

    expect(response.status).toBe(200);
    expect(data.length).toBe(2);

    const expectedPatients = [patient1, patient3];
    expectedPatients.map((patient) => {
      const patientInResponse = data.find((p: any) => p.id === patient.id);
      expect(patientInResponse).toBeDefined();
      expect(patientInResponse.name).toBe(patient.name);
      expect(patientInResponse.phone).toBe(patient.phone);
      expect(patientInResponse.email).toBe(patient.email);
      expect(patientInResponse.age).toBe(patient.age);
      expect(patientInResponse.gender).toBe(patient.gender);
      expect(patientInResponse.deleted).toBeUndefined();
    });
  });

  it("Should filter patients by email", async () => {
    const [patient1, _, patient3] = await Promise.all([
      patientFactory(db, { email: "patient1x@example.com" }),
      patientFactory(db, { email: "patient2x@example.com" }),
      patientFactory(db, { email: "patient1x@example.com" }),
    ]);

    const [response, responseData] = await fireRequest(app, "/patient", {
      query: { email: "patient1x@example.com" },
      authUserId: user.id,
    });

    const { data } = responseData;

    expect(response.status).toBe(200);
    expect(data.length).toBe(2);

    const expectedPatients = [patient1, patient3];
    expectedPatients.map((patient) => {
      const patientInResponse = data.find((p: any) => p.id === patient.id);
      expect(patientInResponse).toBeDefined();
      expect(patientInResponse.name).toBe(patient.name);
      expect(patientInResponse.phone).toBe(patient.phone);
      expect(patientInResponse.email).toBe(patient.email);
      expect(patientInResponse.age).toBe(patient.age);
      expect(patientInResponse.gender).toBe(patient.gender);
      expect(patientInResponse.deleted).toBeUndefined();
    });
  });

  it("Should filter patients by query", async () => {
    const [patient1, patient2, patient3, _] = await Promise.all([
      patientFactory(db, {
        name: "patient123x",
        email: "patient5x@example.com",
        phone: "7234567890",
      }),
      patientFactory(db, {
        name: "patient2x",
        email: "patient123x@example.com",
        phone: "7555567890",
      }),
      patientFactory(db, {
        name: "patient3x",
        email: "patient1x@example.com",
        phone: "7123567890",
      }),
      patientFactory(db, {
        name: "patient4x",
        email: "patient5x@example.com",
        phone: "7234567890",
      }),
    ]);

    const [response, responseData] = await fireRequest(app, "/patient", {
      query: { query: "123" },
      authUserId: user.id,
    });

    const { data } = responseData;

    expect(response.status).toBe(200);
    expect(data.length).toBe(3);

    const expectedPatients = [patient1, patient2, patient3];
    expectedPatients.map((patient) => {
      const patientInResponse = data.find((p: any) => p.id === patient.id);
      expect(patientInResponse).toBeDefined();
      expect(patientInResponse.name).toBe(patient.name);
      expect(patientInResponse.phone).toBe(patient.phone);
      expect(patientInResponse.email).toBe(patient.email);
      expect(patientInResponse.age).toBe(patient.age);
      expect(patientInResponse.gender).toBe(patient.gender);
      expect(patientInResponse.deleted).toBeUndefined();
    });
  });

  it("Should not list all patients if unauthorized", async () => {
    await Promise.all(Array.from({ length: 10 }).map(() => patientFactory(db)));

    const [response, data] = await fireRequest(app, "/patient");

    expect(response.status).toBe(401);
    expect(data.errors).toBeDefined();
  });
});
