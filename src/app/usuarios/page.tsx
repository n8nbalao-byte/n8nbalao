"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trash2, UserPlus, Shield, User, Hammer } from "lucide-react";

type UserType = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("SALES"); // ADMIN, SALES, MONTADOR
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/usuarios");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Erro ao buscar usuários", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setMessage("");

    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      if (res.ok) {
        setMessage("Usuário criado com sucesso!");
        setName("");
        setEmail("");
        setPassword("");
        setRole("SALES");
        fetchUsers();
      } else {
        const data = await res.json();
        setMessage(`Erro: ${data.error}`);
      }
    } catch (error) {
      setMessage("Erro ao conectar com o servidor.");
    } finally {
      setCreating(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"><Shield className="w-3 h-3" /> Admin</span>;
      case "MONTADOR":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"><Hammer className="w-3 h-3" /> Montador</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><User className="w-3 h-3" /> Vendedor</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gerenciamento de Usuários</h1>
            <p className="text-slate-600">Adicione e gerencie o acesso ao sistema.</p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Voltar ao Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5" /> Novo Usuário
              </h2>
              
              {message && (
                <div className={`p-3 rounded-md text-sm mb-4 ${message.includes("Erro") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Nome</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="email@wmferro.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Senha</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="******"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Função (Role)</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="SALES">Vendedor</option>
                    <option value="MONTADOR">Montador</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
                
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full bg-slate-900 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  {creating ? "Criando..." : "Criar Usuário"}
                </button>
              </form>
            </div>
          </div>

          {/* List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-900">Usuários Cadastrados</h2>
              </div>
              
              {loading ? (
                <div className="p-8 text-center text-slate-500">Carregando...</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div>
                        <div className="font-medium text-slate-900">{user.name}</div>
                        <div className="text-sm text-slate-500">{user.email}</div>
                        <div className="mt-1">
                          {getRoleBadge(user.role)}
                        </div>
                      </div>
                      <div className="text-xs text-slate-400">
                        Criado em {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && (
                    <div className="p-8 text-center text-slate-500 italic">
                      Nenhum usuário encontrado.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
