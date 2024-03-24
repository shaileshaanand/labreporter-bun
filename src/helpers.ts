export const hashPassword = (password: string) => Bun.password.hash(password);

export const verifyPassword = (password: string, hash: string) =>
  Bun.password.verify(password, hash);

export const omitUndefinedValues = <T extends object>(obj: T): Partial<T> => {
  const filteredObj: Partial<T> = {};

  for (const key in obj) {
    if (obj[key] !== undefined) {
      filteredObj[key] = obj[key];
    }
  }

  return filteredObj;
};
