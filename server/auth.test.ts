import { describe, expect, it, vi } from "vitest";
import { SignJWT, jwtVerify } from "jose";
import type { Request } from "express";

const { getUserById } = vi.hoisted(() => ({ getUserById: vi.fn() }));
vi.mock("./db", () => ({ getUserById }));

import { createSessionToken, getSessionUser, getSessionUserFromToken } from "./auth";

const request = (cookie?: string) => ({ headers: cookie ? { cookie } : {} } as Request);

describe("session adapter", () => {
  it("returns anonymous for a missing session cookie", async () => {
    await expect(getSessionUser(request())).resolves.toBeNull();
  });

  it("returns anonymous for a malformed session cookie", async () => {
    process.env.JWT_SECRET = "test-secret";
    await expect(getSessionUser(request("almostlegit_session=not-a-jwt"))).resolves.toBeNull();
  });

  it("creates a signed token and hydrates the user from the database", async () => {
    process.env.JWT_SECRET = "test-secret";
    getUserById.mockResolvedValue({ id: 7, role: "admin", streamerProfileId: 3 });
    const token = await createSessionToken(7);
    const verified = await jwtVerify(token, new TextEncoder().encode("test-secret"));
    expect(verified.payload.userId).toBe(7);
    await expect(getSessionUserFromToken(token)).resolves.toEqual({ id: 7, role: "admin", streamerProfileId: 3 });
  });
});
