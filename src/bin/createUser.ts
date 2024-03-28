import db from "../context/db";

import { parseArgs } from "node:util";
import { users } from "../db/schema";
import { hashPassword } from "../helpers";

const {
  values: { firstName, lastName, username, password },
} = parseArgs({
  options: {
    firstName: {
      type: "string",
      short: "f",
    },
    lastName: {
      type: "string",
      short: "l",
    },
    username: {
      type: "string",
      short: "u",
    },
    password: {
      type: "string",
      short: "p",
    },
  },
});

if (!firstName || !lastName || !username || !password) {
  // biome-ignore lint/suspicious/noConsoleLog: needs logging
  console.log(
    "Usage: createUser -f <firstName> -l <lastName> -u <username> -p <password>",
  );
  process.exit(1);
}

// biome-ignore lint/suspicious/noConsoleLog: needs logging
console.log(
  await db
    .insert(users)
    .values({
      firstName,
      lastName,
      username,
      passwordHash: await hashPassword(password),
    })
    .returning(),
);
