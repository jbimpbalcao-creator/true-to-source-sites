import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/desktop/pages/login.html")({
  beforeLoad: () => { throw redirect({ to: "/login", replace: true }); },
});