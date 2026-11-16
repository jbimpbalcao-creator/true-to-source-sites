import { createFileRoute, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { getDashboard, lockSite } from "@/lib/gate.functions";
import { Button } from "@/components/ui/button";

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
  loader: () => getDashboard(),
  component: Index,
  errorComponent: DashboardError,
  notFoundComponent: () => <p>Painel não encontrado.</p>,
});

function DashboardError({ reset }: ErrorComponentProps) {
  const router = useRouter();
  return <main className="brasa-login"><div className="brasa-entry"><h1>Não foi possível abrir o painel</h1><Button onClick={() => { router.invalidate(); reset(); }}>Tentar novamente</Button></div></main>;
}

function Index() {
  const { html } = Route.useLoaderData();
  const frame = useRef<HTMLIFrameElement>(null);
  const router = useRouter();
  const lock = useServerFn(lockSite);
  const [error, setError] = useState(false);
  useEffect(() => {
    let busy = false;
    const receive = async (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.data !== "brasa:logout" || busy) return;
      busy = true;
      try {
        await lock();
        router.options.context.queryClient.clear();
        await router.navigate({ to: "/login", replace: true });
        await router.invalidate();
      } catch { setError(true); busy = false; }
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [lock, router]);
  return <>{error && <p role="alert">Não foi possível sair. Tente novamente.</p>}<iframe ref={frame} title="Dashboard — Sabor na Brasa" srcDoc={html} sandbox="allow-scripts allow-top-navigation-by-user-activation" className="brasa-dashboard" /></>;
}
