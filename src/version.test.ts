import packageJson from "../package.json";
import { describe, expect, it } from "vitest";
import { APP_VERSION } from "./version";

describe("app version", () => {
  it("uses the package version for the visible app version", () => {
    expect(APP_VERSION).toBe(packageJson.version);
    expect(APP_VERSION).toBe("0.1.0");
  });
});
