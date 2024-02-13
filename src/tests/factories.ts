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
