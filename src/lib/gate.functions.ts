import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { gateSchema } from "./gate-schema";
import { gateSession, matchesCredential } from "./gate.server";

export const unlockSite = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => gateSchema.parse(data))
  .handler(async ({ data }) => {
    const username = process.env["SITE_USERNAME"];
    const password = process.env["SITE_PASSWORD"];
    const secret = process.env["SESSION_SECRET"];
    if (!username || !password || !secret) throw new Error("Entry is not configured");
    const validUsername = matchesCredential(data.username, username);
    const validPassword = matchesCredential(data.password, password);
    if (!validUsername || !validPassword) return { ok: false };
    const session = await gateSession(secret);
    await session.update({ unlocked: true });
    return { ok: true };
  });

export const getDashboard = createServerFn({ method: "GET" }).handler(async () => {
  const secret = process.env["SESSION_SECRET"];
  if (!secret) throw new Error("Entry is not configured");
  const session = await gateSession(secret);
  if (!session.data.unlocked) throw redirect({ to: "/login" });
  const { default: html } = await import("./dashboard-template.html?raw");
  return { html };
});

export const lockSite = createServerFn({ method: "POST" }).handler(async () => {
  const secret = process.env["SESSION_SECRET"];
  if (!secret) throw new Error("Entry is not configured");
  const session = await gateSession(secret);
  await session.clear();
  return { ok: true };
});