import { relations } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const doctors = sqliteTable("doctors", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name", { mode: "text" }).notNull(),
  phone: text("phone", { mode: "text" }),
  email: text("email", { mode: "text" }),
  deleted: integer("deleted", { mode: "boolean" }).default(false),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const users = sqliteTable("users", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  firstName: text("firstName", { mode: "text" }).notNull(),
  lastName: text("lastName", { mode: "text" }),
  username: text("username", { mode: "text" }).notNull().unique(),
  passwordHash: text("passwordHash", { mode: "text" }).notNull(),
  deleted: integer("deleted", { mode: "boolean" }).default(false),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const patients = sqliteTable(
  "patients",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    name: text("name", { mode: "text" }).notNull(),
    phone: text("phone", { mode: "text" }),
    email: text("email", { mode: "text" }),
    age: integer("age", { mode: "number" }),
    gender: text("gender", { enum: ["male", "female"] }).notNull(),
    deleted: integer("deleted", { mode: "boolean" }).default(false),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).$defaultFn(
      () => new Date(),
    ),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    idx_patients_deleted_createdat_id: index(
      "idx_patients_deleted_createdat_id",
    ).on(table.deleted, table.createdAt, table.id),
  }),
);

export const templates = sqliteTable("templates", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name", { mode: "text" }).notNull(),
  content: text("content", { mode: "text" }).notNull(),
  deleted: integer("deleted", { mode: "boolean" }).default(false),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const USGReports = sqliteTable(
  "USGReports",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    patientId: integer("patientId", { mode: "number" })
      .references(() => patients.id)
      .notNull(),
    referrerId: integer("referrerId", { mode: "number" })
      .references(() => doctors.id)
      .notNull(),
    partOfScan: text("partOfScan", { mode: "text" }).notNull(),
    findings: text("findings", { mode: "text" }).notNull(),
    date: integer("date", { mode: "timestamp_ms" }).notNull(),
    deleted: integer("deleted", { mode: "boolean" }).default(false),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).$defaultFn(
      () => new Date(),
    ),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    idx_usgreports_deleted_createdat_id: index(
      "idx_usgreports_deleted_createdat_id",
    ).on(table.deleted, table.createdAt, table.id),
  }),
);

export const patientsRelations = relations(patients, ({ many }) => ({
  USGReports: many(USGReports),
}));

export const doctorsRelations = relations(doctors, ({ many }) => ({
  USGReports: many(USGReports),
}));

export const USGReportsRelations = relations(USGReports, ({ one }) => ({
  patient: one(patients, {
    fields: [USGReports.patientId],
    references: [patients.id],
  }),
  referrer: one(doctors, {
    fields: [USGReports.referrerId],
    references: [doctors.id],
  }),
}));
