import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, it, mock } from "bun:test";
import { faker } from "@faker-js/faker";
import { type InferSelectModel, eq } from "drizzle-orm";
import { type BunSQLiteDatabase, drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import app from "../app";
import * as schema from "../db/schema";
import {
  USGReportFactory,
  doctorFactory,
  patientFactory,
  userFactory,
} from "./factories";
import fireRequest from "./fireRequest";

let db: BunSQLiteDatabase<typeof schema>;
let user: InferSelectModel<typeof schema.users>;
let userPassword: string;

describe("USGReport tests", () => {
  beforeEach(async () => {
    const sqliteDb = new Database(":memory:");
    sqliteDb.exec("PRAGMA foreign_keys = ON;");
    db = drizzle(sqliteDb, { schema });

    migrate(db, { migrationsFolder: "src/db/migrations" });
    mock.module("../context/db", () => {
      return { default: db };
    });
    userPassword = faker.internet.password();
    user = await userFactory(db, {
      password: userPassword,
    });
  });

  it("Should create a new USGReport", async () => {
    const [patient, referrer] = await Promise.all([
      patientFactory(db),
      doctorFactory(db),
    ]);

    const USGReport = {
      patient: patient.id,
      referrer: referrer.id,
      partOfScan: faker.lorem.sentence(),
      findings: faker.lorem.paragraph(),
      date: faker.date.recent({ days: 14 }),
    };

    const [response, data] = await fireRequest(app, "/USGReport", {
      method: "POST",
      body: USGReport,
      authUserId: user.id,
    });

    expect(response.status).toBe(201);
    expect(data.id).toBeDefined();
    const createdUSGReport = await db.query.USGReports.findFirst({
      where: eq(schema.USGReports.id, data.id),
    });
    if (!createdUSGReport) {
      throw new Error("USGReport not found");
    }

    expect(data.id).toBe(createdUSGReport.id);

    expect(data.patientId).toBeUndefined();
    expect(data.patient.id).toBe(patient.id);
    expect(data.patient.name).toBe(patient.name);
    expect(data.patient.phone).toBe(patient.phone);
    expect(data.patient.email).toBe(patient.email);
    expect(data.patient.age).toBe(patient.age);
    expect(data.patient.gender).toBe(patient.gender);
    expect(data.patient.deleted).toBeUndefined();

    expect(data.refferrerId).toBeUndefined();
    expect(data.referrer.id).toBe(referrer.id);
    expect(data.referrer.name).toBe(referrer.name);
    expect(data.referrer.phone).toBe(referrer.phone);
    expect(data.referrer.email).toBe(referrer.email);
    expect(data.referrer.deleted).toBeUndefined();

    expect(data.partOfScan).toBe(USGReport.partOfScan);
    expect(data.findings).toBe(USGReport.findings);
    expect(data.date).toEqual(USGReport.date.toISOString());
    expect(data.deleted).toBeUndefined();

    expect(createdUSGReport.patientId).toBe(USGReport.patient);
    expect(createdUSGReport.referrerId).toBe(USGReport.referrer);
    expect(createdUSGReport.partOfScan).toBe(USGReport.partOfScan);
    expect(createdUSGReport.findings).toBe(USGReport.findings);
    expect(createdUSGReport.date).toEqual(USGReport.date);
    expect(createdUSGReport.deleted).toBe(false);
  });

  it("Should not create a new USGReport if unauthorized", async () => {
    const [patient, referrer] = await Promise.all([
      patientFactory(db),
      doctorFactory(db),
    ]);

    const USGReport = {
      patient: patient.id,
      referrer: referrer.id,
      partOfScan: faker.lorem.sentence(),
      findings: faker.lorem.paragraph(),
      date: faker.date.recent({ days: 14 }),
    };

    const [response, data] = await fireRequest(app, "/USGReport", {
      method: "POST",
      body: USGReport,
    });

    expect(response.status).toBe(401);
    expect(data.id).toBeUndefined();
    expect(data.errors).toBeDefined();
  });

  it.each([
    ["patient", 10],
    ["patient", null],
    ["patient", undefined],
    ["patient", "abc"],
    ["referrer", 10],
    ["referrer", null],
    ["referrer", undefined],
    ["referrer", "abc"],
    ["partOfScan", 10],
    ["partOfScan", null],
    ["partOfScan", undefined],
    ["partOfScan", "ab"],
    ["findings", 10],
    ["findings", null],
    ["findings", undefined],
    ["findings", "ab"],
    ["date", "abc"],
    ["date", undefined],
    ["date", null],
    ["date", 10],
  ])("Should not create a new USGReport if %p is %p", async (field, value) => {
    const [patient, referrer] = await Promise.all([
      patientFactory(db),
      doctorFactory(db),
    ]);

    const USGReport: any = {
      patient: patient.id,
      referrer: referrer.id,
      partOfScan: faker.lorem.sentence(),
      findings: faker.lorem.paragraph(),
      date: faker.date.recent({ days: 14 }),
    };

    USGReport[field] = value;

    const [response, data] = await fireRequest(app, "/USGReport", {
      method: "POST",
      body: USGReport,
      authUserId: user.id,
    });

    expect(response.status).toBe(400);
    expect(data.id).toBeUndefined();
    expect(data.errors).toBeDefined();
  });

  it("Should get a USGReport", async () => {
    const USGReport = await USGReportFactory(db);

    const [response, data] = await fireRequest(
      app,
      `/USGReport/${USGReport.id}`,
      {
        method: "GET",
        authUserId: user.id,
      },
    );

    const relatedPatient = await db.query.patients.findFirst({
      where: eq(schema.patients.id, USGReport.patientId),
    });
    if (!relatedPatient) {
      throw new Error("Patient not found");
    }

    const relatedReferrer = await db.query.doctors.findFirst({
      where: eq(schema.doctors.id, USGReport.referrerId),
    });
    if (!relatedReferrer) {
      throw new Error("Referrer not found");
    }

    expect(response.status).toBe(200);

    expect(data.id).toBe(USGReport.id);

    expect(data.patientId).toBeUndefined();
    expect(data.patient.id).toBe(relatedPatient.id);
    expect(data.patient.name).toBe(relatedPatient.name);
    expect(data.patient.phone).toBe(relatedPatient.phone);
    expect(data.patient.email).toBe(relatedPatient.email);
    expect(data.patient.age).toBe(relatedPatient.age);
    expect(data.patient.gender).toBe(relatedPatient.gender);
    expect(data.patient.deleted).toBeUndefined();

    expect(data.referrerId).toBeUndefined();
    expect(data.referrer.id).toBe(relatedReferrer.id);
    expect(data.referrer.name).toBe(relatedReferrer.name);
    expect(data.referrer.phone).toBe(relatedReferrer.phone);
    expect(data.referrer.email).toBe(relatedReferrer.email);
    expect(data.referrer.deleted).toBeUndefined();

    expect(data.refferrerId).toBeUndefined();
    expect(data.partOfScan).toBe(USGReport.partOfScan);
    expect(data.findings).toBe(USGReport.findings);
    expect(data.date).toEqual(USGReport.date.toISOString());
    expect(data.deleted).toBeUndefined();
  });

  it("Should get not a USGReport if unauthorized", async () => {
    const USGReport = await USGReportFactory(db);

    const [response, data] = await fireRequest(
      app,
      `/USGReport/${USGReport.id}`,
    );

    expect(response.status).toBe(401);
    expect(data.id).toBeUndefined();
    expect(data.errors).toBeDefined();
  });

  it("Should get not a USGReport id is invalid", async () => {
    const USGReport = await USGReportFactory(db);

    const [response, data] = await fireRequest(
      app,
      `/USGReport/${USGReport.id + 1}`,
      {
        method: "GET",
        authUserId: user.id,
      },
    );

    expect(response.status).toBe(404);
    expect(data.id).toBeUndefined();
    expect(data.errors).toBeDefined();
  });

  it("Should not get a deleted USGReport", async () => {
    const USGReport = await USGReportFactory(db, { deleted: true });

    const [response, data] = await fireRequest(
      app,
      `/USGReport/${USGReport.id}`,
      {
        method: "GET",
        authUserId: user.id,
      },
    );

    expect(response.status).toBe(404);
    expect(data.id).toBeUndefined();
    expect(data.errors).toBeDefined();
  });

  it("Should update a USGReport", async () => {
    const USGReport = await USGReportFactory(db);
    const referrer = await doctorFactory(db);
    const patient = await patientFactory(db);
    const USGReportUpdate = {
      patient: patient.id,
      referrer: referrer.id,
      partOfScan: faker.lorem.sentence(),
      findings: faker.lorem.paragraph(),
      date: faker.date.recent({ days: 14 }),
    };
    const [response, data] = await fireRequest(
      app,
      `/USGReport/${USGReport.id}`,
      {
        method: "PUT",
        body: USGReportUpdate,
        authUserId: user.id,
      },
    );

    const updatedUSGReport = await db.query.USGReports.findFirst({
      where: eq(schema.USGReports.id, USGReport.id),
    });
    if (!updatedUSGReport) {
      throw new Error("USGReport not found");
    }

    expect(response.status).toBe(200);
    expect(data.id).toBe(USGReport.id);

    expect(data.patientId).toBeUndefined();
    expect(data.patient.id).toBe(patient.id);
    expect(data.patient.name).toBe(patient.name);
    expect(data.patient.phone).toBe(patient.phone);
    expect(data.patient.email).toBe(patient.email);
    expect(data.patient.age).toBe(patient.age);
    expect(data.patient.gender).toBe(patient.gender);
    expect(data.patient.deleted).toBeUndefined();

    expect(data.referrerId).toBeUndefined();
    expect(data.referrer.id).toBe(referrer.id);
    expect(data.referrer.name).toBe(referrer.name);
    expect(data.referrer.phone).toBe(referrer.phone);
    expect(data.referrer.email).toBe(referrer.email);
    expect(data.referrer.deleted).toBeUndefined();

    expect(data.refferrerId).toBeUndefined();
    expect(data.partOfScan).toBe(USGReportUpdate.partOfScan);
    expect(data.findings).toBe(USGReportUpdate.findings);
    expect(data.date).toEqual(USGReportUpdate.date.toISOString());
    expect(data.deleted).toBeUndefined();
    expect(updatedUSGReport.patientId).toBe(patient.id);
    expect(updatedUSGReport.referrerId).toBe(referrer.id);
    expect(updatedUSGReport.partOfScan).toBe(USGReportUpdate.partOfScan);
  });

  it("Should not update a USGReport if id is invalid", async () => {
    const USGReport = await USGReportFactory(db);
    const referrer = await doctorFactory(db);
    const patient = await patientFactory(db);
    const USGReportUpdate = {
      patient: patient.id,
      referrer: referrer.id,
      partOfScan: faker.lorem.sentence(),
      findings: faker.lorem.paragraph(),
      date: faker.date.recent({ days: 14 }),
    };
    const [response, data] = await fireRequest(
      app,
      `/USGReport/${USGReport.id + 1}`,
      {
        method: "PUT",
        body: USGReportUpdate,
        authUserId: user.id,
      },
    );
    expect(response.status).toBe(404);
    expect(data.id).toBeUndefined();
    expect(data.errors).toBeDefined();
  });

  it("Should not update a patient if unauthorized", async () => {
    const USGReport = await USGReportFactory(db);
    const referrer = await doctorFactory(db);
    const patient = await patientFactory(db);
    const USGReportUpdate = {
      patient: patient.id,
      referrer: referrer.id,
      partOfScan: faker.lorem.sentence(),
      findings: faker.lorem.paragraph(),
      date: faker.date.recent({ days: 14 }),
    };

    const [response, data] = await fireRequest(
      app,
      `/USGReport/${USGReport.id}`,
      {
        method: "PUT",
        body: USGReportUpdate,
      },
    );

    expect(response.status).toBe(401);
    expect(data.id).toBeUndefined();
    expect(data.errors).toBeDefined();
  });

  it("Should delete a USGReport", async () => {
    const USGReport = await USGReportFactory(db);

    const [response] = await fireRequest(app, `/USGReport/${USGReport.id}`, {
      method: "DELETE",
      authUserId: user.id,
    });

    const deletedUSGReport = await db.query.USGReports.findFirst({
      where: eq(schema.USGReports.id, USGReport.id),
    });

    if (!deletedUSGReport) {
      throw new Error("USGReport not found");
    }

    expect(response.status).toBe(204);
    expect(deletedUSGReport.id).toBe(USGReport.id);
    expect(deletedUSGReport.patientId).toBe(USGReport.patientId);
    expect(deletedUSGReport.referrerId).toBe(USGReport.referrerId);
    expect(deletedUSGReport.partOfScan).toBe(USGReport.partOfScan);
    expect(deletedUSGReport.findings).toBe(USGReport.findings);
    expect(deletedUSGReport.date).toEqual(USGReport.date);
    expect(deletedUSGReport.deleted).toBe(true);
  });

  it("Should not delete a USGReport if unauthorized", async () => {
    const USGReport = await USGReportFactory(db);

    const [response, data] = await fireRequest(
      app,
      `/USGReport/${USGReport.id}`,
      {
        method: "DELETE",
      },
    );

    expect(response.status).toBe(401);
    expect(data.id).toBeUndefined();
    expect(data.errors).toBeDefined();

    const deletedUSGReport = await db.query.USGReports.findFirst({
      where: eq(schema.USGReports.id, USGReport.id),
    });

    if (!deletedUSGReport) {
      throw new Error("USGReport not found");
    }
    expect(deletedUSGReport.id).toBe(USGReport.id);
    expect(deletedUSGReport.patientId).toBe(USGReport.patientId);
    expect(deletedUSGReport.referrerId).toBe(USGReport.referrerId);
    expect(deletedUSGReport.partOfScan).toBe(USGReport.partOfScan);
    expect(deletedUSGReport.findings).toBe(USGReport.findings);
    expect(deletedUSGReport.date).toEqual(USGReport.date);
    expect(deletedUSGReport.deleted).toBe(false);
  });

  it("Should not delete a USGReport if id is invalid", async () => {
    const USGReport = await USGReportFactory(db);

    const [response, data] = await fireRequest(
      app,
      `/USGReport/${USGReport.id + 1}`,
      {
        method: "DELETE",
        authUserId: user.id,
      },
    );

    expect(response.status).toBe(404);
    expect(data.id).toBeUndefined();
    expect(data.errors).toBeDefined();

    const deletedUSGReport = await db.query.USGReports.findFirst({
      where: eq(schema.USGReports.id, USGReport.id),
    });

    if (!deletedUSGReport) {
      throw new Error("USGReport not found");
    }
    expect(deletedUSGReport.id).toBe(USGReport.id);
    expect(deletedUSGReport.patientId).toBe(USGReport.patientId);
    expect(deletedUSGReport.referrerId).toBe(USGReport.referrerId);
    expect(deletedUSGReport.partOfScan).toBe(USGReport.partOfScan);
    expect(deletedUSGReport.findings).toBe(USGReport.findings);
    expect(deletedUSGReport.date).toEqual(USGReport.date);
    expect(deletedUSGReport.deleted).toBe(false);
  });

  it("Should not delete a deleted USGReport", async () => {
    const USGReport = await USGReportFactory(db, { deleted: true });

    const [response, data] = await fireRequest(
      app,
      `/USGReport/${USGReport.id}`,
      {
        method: "DELETE",
        authUserId: user.id,
      },
    );

    expect(response.status).toBe(404);
    expect(data.id).toBeUndefined();
    expect(data.errors).toBeDefined();

    const deletedUSGReport = await db.query.USGReports.findFirst({
      where: eq(schema.USGReports.id, USGReport.id),
    });

    if (!deletedUSGReport) {
      throw new Error("USGReport not found");
    }
    expect(deletedUSGReport.id).toBe(USGReport.id);
    expect(deletedUSGReport.patientId).toBe(USGReport.patientId);
    expect(deletedUSGReport.referrerId).toBe(USGReport.referrerId);
    expect(deletedUSGReport.partOfScan).toBe(USGReport.partOfScan);
    expect(deletedUSGReport.findings).toBe(USGReport.findings);
    expect(deletedUSGReport.date).toEqual(USGReport.date);
    expect(deletedUSGReport.deleted).toBe(true);
  });

  it("Should list all non deleted USGReports", async () => {
    const USGReports = await Promise.all(
      Array.from({ length: 10 }).map(() =>
        USGReportFactory(db, {
          deleted: faker.datatype.boolean({ probability: 0.75 }),
        }),
      ),
    );

    const notDeletedUSGReports = USGReports.filter(
      (USGReport) => !USGReport.deleted,
    );

    const notDeletedUSGReportsCount = notDeletedUSGReports.length;

    const [response, responseData] = await fireRequest(app, "/USGReport", {
      method: "GET",
      authUserId: user.id,
    });

    const { data } = responseData;

    expect(response.status).toBe(200);
    expect(data.length).toBe(notDeletedUSGReportsCount);
    notDeletedUSGReports.map((USGReport) => {
      const USGReportInResponse = data.find((p: any) => p.id === USGReport.id);

      expect(USGReportInResponse).toBeDefined();
      expect(USGReportInResponse.patient.id).toBe(USGReport.patientId);
      expect(USGReportInResponse.referrer.id).toBe(USGReport.referrerId);
      expect(USGReportInResponse.partOfScan).toBe(USGReport.partOfScan);
      expect(USGReportInResponse.findings).toBe(USGReport.findings);
      expect(USGReportInResponse.date).toEqual(USGReport.date.toISOString());
      expect(USGReportInResponse.deleted).toBeUndefined();
    });
  });

  it("Should not list all USGReports if unauthorized", async () => {
    await Promise.all(
      Array.from({ length: 10 }).map(() => USGReportFactory(db)),
    );

    const [response, data] = await fireRequest(app, "/USGReport", {
      method: "GET",
    });

    expect(response.status).toBe(401);
    expect(data.id).toBeUndefined();
    expect(data.errors).toBeDefined();
  });
});
