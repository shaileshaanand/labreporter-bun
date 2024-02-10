import { mock } from "bun:test";
mock.module("../context/db", () => {
  return { default: "LOL" };
});
