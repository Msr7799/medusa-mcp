import crypto from "crypto";
import { env } from "./env.js";

export type ConfirmPayload = {
  v: 1;
  iat: number; // issued-at (unix seconds)
  exp: number; // expiry (unix seconds)
  req: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
  };
};

function b64url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64urlDecode(input: string) {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const s = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(s, "base64");
}

export function signConfirmToken(payload: ConfirmPayload): string {
  const json = JSON.stringify(payload);
  const data = b64url(json);
  const sig = crypto.createHmac("sha256", env.confirmSecret).update(data).digest();
  return `${data}.${b64url(sig)}`;
}

export function verifyConfirmToken(token: string): ConfirmPayload {
  const parts = token.split(".");
  if (parts.length !== 2) throw new Error("Invalid confirm token format");
  const [data, sig] = parts;
  const expected = crypto.createHmac("sha256", env.confirmSecret).update(data).digest();
  const got = b64urlDecode(sig);
  if (got.length !== expected.length || !crypto.timingSafeEqual(got, expected)) {
    throw new Error("Invalid confirm token signature");
  }
  const payload = JSON.parse(b64urlDecode(data).toString("utf8")) as ConfirmPayload;
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) throw new Error("Confirm token expired");
  if (payload.iat > now + 30) throw new Error("Confirm token from the future");
  return payload;
}

export function mintConfirmToken(req: ConfirmPayload["req"]) {
  const now = Math.floor(Date.now() / 1000);
  const payload: ConfirmPayload = {
    v: 1,
    iat: now,
    exp: now + env.confirmTtlSeconds,
    req,
  };
  return signConfirmToken(payload);
}
