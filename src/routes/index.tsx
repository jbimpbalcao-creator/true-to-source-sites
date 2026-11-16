import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Sabor na Brasa" },
      { name: "description", content: "Painel de gestão do restaurante Sabor na Brasa." },
      { property: "og:title", content: "Dashboard — Sabor na Brasa" },
      { property: "og:description", content: "Painel de gestão do restaurante Sabor na Brasa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  useEffect(() => {
    window.location.replace("/dashboard.html");
  }, []);
  return null;
}
