import logo from "@/assets/espeto-prime-logo-clean.png.asset.json";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { unlockSite } from "@/lib/gate.functions";
import { gateSchema } from "@/lib/gate-schema";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [
    { title: "Entrar — Espeto Prime" },
    { name: "description", content: "Acesso ao painel Espeto Prime." },
    { property: "og:title", content: "Entrar — Espeto Prime" },
    { property: "og:description", content: "Acesso ao painel Espeto Prime." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Login,
});

function Login() {
  const unlock = useServerFn(unlockSite);
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = gateSchema.safeParse({ username: form.get("username"), password: form.get("password") });
    if (!parsed.success) { setError("Preencha o usuário e a senha."); return; }
    setBusy(true);
    setError("");
    try {
      const result = await unlock({ data: parsed.data });
      if (!result.ok) { setError("Usuário ou senha incorretos."); return; }
      await router.invalidate();
      await router.navigate({ to: "/", replace: true });
    } catch { setError("Não foi possível entrar. Tente novamente."); }
    finally { setBusy(false); }
  }
  return <main className="brasa-login">
    <form className="brasa-entry" onSubmit={submit}>
      <img className="entry-logo" src={logo.url} alt="Espeto Prime"/><h1>Espeto Prime</h1>
      <p>Painel de Gestão</p>
      <label htmlFor="username">Usuário</label>
      <input id="username" name="username" autoComplete="username" maxLength={100} required />
      <label htmlFor="password">Senha</label>
      <input id="password" name="password" type="password" autoComplete="current-password" maxLength={256} required />
      {error && <p className="entry-error" role="alert">{error}</p>}
      <Button type="submit" disabled={busy} className="w-full">{busy ? "Entrando…" : "Entrar"}</Button>
    </form>
  </main>;
}