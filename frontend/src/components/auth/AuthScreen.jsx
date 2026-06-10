import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login"); // login | register
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // register
  const [fullName, setFullName] = useState("");
  const [orgMode, setOrgMode] = useState("create"); // create | join
  const [orgName, setOrgName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        const payload = {
          full_name: fullName,
          email,
          password,
          ...(orgMode === "create"
            ? { organization_name: orgName }
            : { invite_code: inviteCode }),
        };
        const { needsLogin } = await register(payload);
        if (needsLogin) {
          setInfo(
            "Cadastro criado! Confirme seu e-mail (se exigido) e faça login."
          );
          setMode("login");
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-400";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="text-sm text-cyan-400">ScribeMind AI</p>
          <h1 className="mt-1 text-2xl font-bold">
            {mode === "login" ? "Entrar na sua conta" : "Criar conta"}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Knowledge Engine corporativo com IA e RAG.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg"
          aria-label={mode === "login" ? "Formulário de login" : "Formulário de cadastro"}
        >
          {mode === "register" && (
            <div>
              <label htmlFor="full_name" className="mb-1 block text-xs text-slate-400">
                Nome completo
              </label>
              <input
                id="full_name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1 block text-xs text-slate-400">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-xs text-slate-400">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className={inputClass}
            />
          </div>

          {mode === "register" && (
            <fieldset className="rounded-xl border border-slate-800 p-3">
              <legend className="px-1 text-xs text-slate-400">Organização</legend>

              <div className="mb-3 flex gap-2" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={orgMode === "create"}
                  onClick={() => setOrgMode("create")}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs transition ${
                    orgMode === "create"
                      ? "border-cyan-400 text-cyan-400"
                      : "border-slate-700 text-slate-300"
                  }`}
                >
                  Criar nova
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={orgMode === "join"}
                  onClick={() => setOrgMode("join")}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs transition ${
                    orgMode === "join"
                      ? "border-cyan-400 text-cyan-400"
                      : "border-slate-700 text-slate-300"
                  }`}
                >
                  Entrar com código
                </button>
              </div>

              {orgMode === "create" ? (
                <input
                  aria-label="Nome da organização"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Nome da empresa / organização"
                  required
                  className={inputClass}
                />
              ) : (
                <input
                  aria-label="Código de convite"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Código de convite (8 caracteres)"
                  required
                  className={inputClass}
                />
              )}
            </fieldset>
          )}

          {error && (
            <p role="alert" className="rounded-xl border border-red-900 bg-red-950/40 p-3 text-xs text-red-300">
              {error}
            </p>
          )}
          {info && (
            <p role="status" className="rounded-xl border border-emerald-900 bg-emerald-950/40 p-3 text-xs text-emerald-300">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="w-full rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            {loading
              ? "Aguarde..."
              : mode === "login"
              ? "Entrar"
              : "Criar conta"}
          </button>

          <p className="pt-1 text-center text-xs text-slate-400">
            {mode === "login" ? "Não tem conta?" : "Já tem conta?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
                setInfo("");
              }}
              className="text-cyan-400 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              {mode === "login" ? "Cadastre-se" : "Entrar"}
            </button>
          </p>
        </form>
      </div>
    </main>
  );
}
