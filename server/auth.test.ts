import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword, generateAdminToken, verifyAdminToken } from "./auth";

describe("Authentication", () => {
  describe("Password Hashing", () => {
    it("should hash password correctly", async () => {
      const password = "testPassword123";
      const hash = await hashPassword(password);

      expect(hash).toBeTruthy();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it("should verify correct password", async () => {
      const password = "testPassword123";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const password = "testPassword123";
      const wrongPassword = "wrongPassword";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });
  });

  describe("JWT Token", () => {
    it("should generate and verify admin token", async () => {
      const adminId = 1;
      const email = "admin@example.com";

      const token = await generateAdminToken(adminId, email);
      expect(token).toBeTruthy();

      const payload = await verifyAdminToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.adminId).toBe(adminId);
      expect(payload?.email).toBe(email);
    });

    it("should reject invalid token", async () => {
      const invalidToken = "invalid.token.here";
      const payload = await verifyAdminToken(invalidToken);

      expect(payload).toBeNull();
    });
  });
});
