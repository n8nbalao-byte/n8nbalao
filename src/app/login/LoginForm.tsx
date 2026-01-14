"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { FormEvent, useState, useEffect } from "react";

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/empresa")
      .then((res) => res.json())
      .then((data) => {
        if (data?.logoUrl) setLogoUrl(data.logoUrl);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: true,
      callbackUrl: "/dashboard",
    });

    if (result?.error) {
      setError("E-mail ou senha inválidos.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md rounded-xl bg-white shadow-sm border border-slate-200 p-8">
        <div className="flex flex-col items-center mb-6">
            {logoUrl && (
                <img 
                    src={logoUrl} 
                    alt="Logo" 
                    className="h-16 w-auto object-contain mb-4"
                />
            )}
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            Entrar no sistema
            </h1>
            <p className="text-sm text-slate-600 text-center">
            Acesse com seu e-mail e senha cadastrados.
            </p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              E-mail
            </label>
            <input
              type="email"
              name="email"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              placeholder="usuario@wmferro.com"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Senha
            </label>
            <input
              type="password"
              name="password"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              required
            />
          </div>
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <div className="mt-4 text-xs text-slate-500 flex justify-between">
          <span>WM Ferro</span>
          <Link href="/" className="underline">
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

