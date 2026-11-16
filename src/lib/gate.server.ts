import { createHash, timingSafeEqual } from "node:crypto";
import { useSession, setResponseHeader } from "@tanstack/react-start/server";

export function matchesCredential(input: string, expected: string) {
  return timingSafeEqual(
    createHash("sha256").update(input).digest(),
    createHash("sha256").update(expected).digest(),
  );
}

export async function gateSession(secret: string) {
  setResponseHeader("Cache-Control", "no-store");
  return useSession<{ unlocked?: boolean }>({
    password: secret,
    name: "brasa-gate",
    maxAge: 60 * 60 * 24 * 7,
    cookie: { httpOnly: true, secure: true, sameSite: "lax", path: "/" },
  });
}