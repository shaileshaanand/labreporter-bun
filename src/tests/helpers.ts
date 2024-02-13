import { faker } from "@faker-js/faker";

export const generatePhoneNumber = () =>
  `${faker.number.int({
    min: 6,
    max: 9,
  })}${faker.string.numeric(9)}`;
