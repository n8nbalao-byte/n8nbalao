"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function NovoClientePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("PF");
  const [document, setDocument] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      name,
      document,
      type,
      email: email || null,
      phone: phone || null,
      zipCode: zipCode || null,
      address: address || null,
      city: city || null,
      state: state || null,
    };

    setLoading(true);
    setError("");

    const response = await fetch("/api/clientes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setError("Não foi possível salvar o cliente.");
      setLoading(false);
      return;
    }

    router.push("/clientes");
  }

  async function buscarCep(valor: string) {
    const cepLimpo = valor.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;

    const response = await fetch(`/api/cep?cep=${cepLimpo}`);
    if (!response.ok) return;
    const data = await response.json();

    setZipCode(data.zipCode);
    if (data.address) setAddress(data.address);
    if (data.city) setCity(data.city);
    if (data.state) setState(data.state);
  }

  async function buscarCnpj(valor: string) {
    const cnpjLimpo = valor.replace(/\D/g, "");
    if (cnpjLimpo.length !== 14) return;

    const response = await fetch(`/api/cnpj?cnpj=${cnpjLimpo}`);
    if (!response.ok) return;
    const data = await response.json();

    setType("PJ");
    if (data.name) setName(data.name);
    if (data.zipCode) {
      setZipCode(data.zipCode);
      await buscarCep(data.zipCode);
    } else {
      if (data.address) setAddress(data.address);
      if (data.city) setCity(data.city);
      if (data.state) setState(data.state);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-xl rounded-xl bg-white shadow-sm border border-slate-200 p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Novo cliente
          </h1>
          <p className="text-sm text-slate-600">
            Preencha os dados básicos do cliente.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                Tipo
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                name="type"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="PF">Pessoa Física</option>
                <option value="PJ">Pessoa Jurídica</option>
              </select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">
                CPF/CNPJ
              </label>
              <input
                value={document}
                onChange={(e) => setDocument(e.target.value)}
                onBlur={(e) => {
                  if (type === "PJ") buscarCnpj(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && type === "PJ") {
                    e.preventDefault();
                    buscarCnpj((e.target as HTMLInputElement).value);
                  }
                }}
                name="document"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Nome/Razão social
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              name="name"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Telefone
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              name="phone"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              E-mail
            </label>
            <input
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                CEP
              </label>
              <input
                name="zipCode"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                onBlur={(e) => buscarCep(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    buscarCep((e.target as HTMLInputElement).value);
                  }
                }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">
                Endereço
              </label>
              <input
                name="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                Cidade
              </label>
              <input
                name="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                Estado
              </label>
              <input
                name="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => router.push("/clientes")}
              className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Salvando..." : "Salvar cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
