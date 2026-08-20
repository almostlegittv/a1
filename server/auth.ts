import type { Request } from "express";
import { jwtVerify, SignJWT } from "jose";
import { COOKIE_NAME } from "../shared/const";
import type { AppUser } from "./routers";
import { getUserById } from "./db";

export function readCookie(header: string | undefined, name: string) {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    const key = part.slice(0, separator).trim();
    if (key === name) return decodeURIComponent(part.slice(separator + 1).trim());
  }
  return undefined;
}

function claimUserId(payload: Record<string, unknown>) {
  const candidate = payload.userId ?? payload.user_id ?? payload.sub;
  const id = typeof candidate === "number" ? candidate : typeof candidate === "string" ? Number(candidate) : NaN;
  return Number.isInteger(id) && id > 0 ? id : undefined;
}

export async function createSessionToken(userId: number) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Session signing is not configured");
  return new SignJWT({ userId }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("1y").sign(new TextEncoder().encode(secret));
}

export async function getSessionUserFromToken(token: string | undefined): Promise<AppUser> {
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const userId = claimUserId(payload);
    if (!userId) return null;
    const user = await getUserById(userId);
    return user ?? null;
  } catch {
    return null;
  }
}

export async function getSessionUser(request: Request): Promise<AppUser> {
  return getSessionUserFromToken(readCookie(request.headers.cookie, COOKIE_NAME));
}
