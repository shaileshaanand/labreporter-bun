import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const doctors = sqliteTable("doctors", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name", { mode: "text" }).notNull(),
  phone: text("phone", { mode: "text" }),
  email: text("email", { mode: "text" }),
  deleted: integer("deleted", { mode: "boolean" }).default(false),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export const users = sqliteTable("users", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  firstName: text("firstName", { mode: "text" }).notNull(),
  lastName: text("lastName", { mode: "text" }),
  username: text("username", { mode: "text" }).notNull().unique(),
  passwordHash: text("passwordHash", { mode: "text" }).notNull(),
  deleted: integer("deleted", { mode: "boolean" }).default(false),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export const patients = sqliteTable("patients", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name", { mode: "text" }).notNull(),
  phone: text("phone", { mode: "text" }),
  email: text("email", { mode: "text" }),
  age: integer("age", { mode: "number" }),
  gender: text("gender", { enum: ["male", "female"] }).notNull(),
  deleted: integer("deleted", { mode: "boolean" }).default(false),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});
