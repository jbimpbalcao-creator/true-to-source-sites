import { createFileRoute, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { getDashboard, lockSite } from "@/lib/gate.functions";
import { Button } from "@/components/ui/button";
import { listRecords } from "@/lib/restaurant.functions";
import { sections, dateKey } from "@/lib/restaurant";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Espeto Prime" },
      { name: "description", content: "Painel de gestão do restaurante Espeto Prime." },
      { property: "og:title", content: "Dashboard — Espeto Prime" },
      { property: "og:description", content: "Painel de gestão do restaurante Espeto Prime." },
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
  const load = useServerFn(listRecords);
  const [error, setError] = useState(false);
  useEffect(() => {
    let busy = false;
    const receive = async (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow) return;
      if (event.data && typeof event.data === 'object' && event.data.type === 'brasa:navigate') {
        const section = sections.find(s => s.slug === event.data.section);
        if (section) await router.navigate({ to: '/$section', params: { section: section.slug } });
        return;
      }
      if (event.data !== "brasa:logout" || busy) return;
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
  async function updateDashboard() {
    try {
      const rows = await load();
      const today = rows.filter(r => r.kind === 'order' && r.data.date === dateKey());
      frame.current?.contentWindow?.postMessage({ type: 'brasa:stats', revenue: today.filter(r => r.data.status === 'Concluído').reduce((s,r) => s + r.data.price, 0), orders: today.length, tables: rows.filter(r => r.kind === 'table' && (r.data.status === 'Ocupada' || rows.some(o => o.kind === 'order' && o.data.tableId === r.id && !['Concluído','Cancelado'].includes(o.data.status)))).length, active: rows.filter(r => r.kind === 'order' && !['Concluído','Cancelado'].includes(r.data.status)).length, recent: today.slice(0,8).map(r => ({ name: r.data.name, price: r.data.price, status: r.data.status })), pending: rows.filter(r => r.kind === 'order' && r.data.channel === 'Delivery' && r.data.status === 'Aguardando').length }, '*');
    } catch { setError(true); }
  }
  useEffect(() => { const timer = setInterval(updateDashboard, 15000); return () => clearInterval(timer); }, [load]);
  return <>{error && <p role="alert">Não foi possível atualizar o painel. Tente novamente.</p>}<iframe ref={frame} onLoad={updateDashboard} title="Dashboard — Espeto Prime" srcDoc={html} sandbox="allow-scripts allow-top-navigation-by-user-activation" className="brasa-dashboard" /></>;
}
