import { useEffect, useState } from "react";
import { apiJson } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const ROLE_LABEL = { owner: "Owner", admin: "Admin", member: "Membro" };

export function MembersPanel() {
  const { user, isAdmin, isOwner } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inviteCode = user?.organization?.invite_code;

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await apiJson("/members/");
      setMembers(data.members || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function changeRole(memberId, role) {
    try {
      await apiJson(`/members/${memberId}`, { method: "PATCH", body: { role } });
      await load();
    } catch (err) {
      alert(err.message);
    }
  }

  async function removeMember(memberId) {
    if (!window.confirm("Remover este membro da organização?")) return;
    try {
      await apiJson(`/members/${memberId}`, { method: "DELETE" });
      await load();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <section
      aria-labelledby="members-heading"
      className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg"
    >
      <div className="flex items-center justify-between gap-3">
        <p id="members-heading" className="text-sm font-semibold text-slate-100">
          Membros da organização
        </p>
        <button
          onClick={load}
          aria-label="Atualizar lista de membros"
          className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-400 hover:text-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          Atualizar
        </button>
      </div>

      {inviteCode && isAdmin && (
        <div className="mt-3 rounded-xl border border-cyan-900/50 bg-cyan-950/20 p-3">
          <p className="text-xs text-slate-400">Código de convite</p>
          <div className="mt-1 flex items-center gap-2">
            <code className="rounded bg-slate-950 px-2 py-1 text-sm font-bold text-cyan-400">
              {inviteCode}
            </code>
            <button
              onClick={() => navigator.clipboard?.writeText(inviteCode)}
              aria-label="Copiar código de convite"
              className="rounded border border-slate-700 px-2 py-1 text-[11px] text-slate-300 hover:border-cyan-400 hover:text-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              Copiar
            </button>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Compartilhe para novos usuários entrarem como membros.
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-xs text-red-300">
          {error}
        </p>
      )}

      <ul className="mt-4 space-y-2" aria-busy={loading}>
        {loading && <li className="text-xs text-slate-400">Carregando...</li>}

        {!loading &&
          members.map((member) => (
            <li
              key={member.id}
              className="rounded-xl border border-slate-800 bg-slate-950 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-100">
                    {member.full_name || member.email || "Usuário"}
                    {member.is_you && (
                      <span className="ml-1 text-[11px] text-cyan-400">(você)</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-slate-500">{member.email}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    member.role === "owner"
                      ? "bg-purple-900/50 text-purple-300"
                      : member.role === "admin"
                      ? "bg-cyan-900/50 text-cyan-300"
                      : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {ROLE_LABEL[member.role]}
                </span>
              </div>

              {isAdmin && !member.is_you && member.role !== "owner" && (
                <div className="mt-2 flex items-center gap-2">
                  <label className="sr-only" htmlFor={`role-${member.id}`}>
                    Papel de {member.email}
                  </label>
                  <select
                    id={`role-${member.id}`}
                    value={member.role}
                    onChange={(e) => changeRole(member.id, e.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                  >
                    <option value="member">Membro</option>
                    <option value="admin">Admin</option>
                    {isOwner && <option value="owner">Owner</option>}
                  </select>
                  <button
                    onClick={() => removeMember(member.id)}
                    aria-label={`Remover ${member.email}`}
                    className="rounded-lg border border-red-900/70 px-2 py-1 text-[11px] text-red-300 transition hover:border-red-400 hover:text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  >
                    Remover
                  </button>
                </div>
              )}
            </li>
          ))}
      </ul>
    </section>
  );
}
