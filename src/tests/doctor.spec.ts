import { it, describe, expect } from "bun:test";
import app from "../app";

describe("Doctor Tests", () => {
  it("Should create a new doctor", async () => {
    const response = await app.handle();
  });
});
