import { faker } from "@faker-js/faker";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import * as schema from "../db/schema";
import { generatePhoneNumber } from "./helpers";

export const doctorFactory = async (
  db: BunSQLiteDatabase<typeof schema>,
  {
    name = null,
    email = null,
    phone = null,
    deleted = false,
  }: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    deleted?: boolean;
  } = {
    name: null,
    email: null,
    phone: null,
    deleted: false,
  },
) => {
  const [doctor] = await db
    .insert(schema.doctors)
    .values({
      name: name ?? faker.person.fullName(),
      phone: phone ?? generatePhoneNumber(),
      email: email ?? faker.internet.email(),
      deleted,
    })
    .returning();
  //   console.log({ doctor });
  //   const [updatedDoctors3] = await db.query.doctors.findMany();
  //   console.log({ updatedDoctors3 });

  return doctor as Exclude<typeof doctor, undefined>;
};

export const userFactory = async (
  db: BunSQLiteDatabase<typeof schema>,
  {
    firstName = null,
    lastName = null,
    username = null,
    password,
    deleted = false,
  }: {
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
    password: string;
    deleted?: boolean;
  },
) => {
  const [user] = await db
    .insert(schema.users)
    .values({
      firstName: firstName ?? faker.person.firstName(),
      lastName: lastName ?? faker.person.lastName(),
      username: username ?? faker.internet.userName(),
      passwordHash: password,
      deleted,
    })
    .returning();

  return user as Exclude<typeof user, undefined>;
};
