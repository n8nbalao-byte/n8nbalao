"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function NovoProdutoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    unit: "UN",
    basePrice: 0,
    category: "BASE", // Default to BASE
    steelType: "",
  });

  const baseId = searchParams.get("baseId");

  useEffect(() => {
    async function carregarBase() {
      if (!baseId) return;
      try {
        const response = await fetch(`/api/produtos/${baseId}`);
        if (!response.ok) return;
        const data = await response.json();
        setFormData({
          code: "",
          name: data.name ? `${data.name} - variação` : "",
          unit: data.unit || "UN",
          basePrice: data.basePrice || 0,
          category: "FINAL",
          steelType: data.steelType || "",
        });
      } catch (e) {
      }
    }
    carregarBase();
  }, [baseId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "basePrice" ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/produtos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Erro ao criar produto");
      }

      router.push("/produtos");
    } catch (err) {
      setError("Falha ao cadastrar produto. Verifique os dados.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-sm border border-slate-200 p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Novo Produto</h1>
          <Link
            href="/produtos"
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            Voltar
          </Link>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Nome do produto
            </label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ex: Vergalhão CA-60 4.2mm"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Unidade
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="UN">Unidade (UN)</option>
                <option value="KG">Quilograma (KG)</option>
                <option value="M">Metro (M)</option>
                <option value="BARRA">Barra (12m)</option>
                <option value="ROLO">Rolo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Preço Base (R$)
              </label>
              <input
                type="number"
                step="0.01"
                name="basePrice"
                value={formData.basePrice}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-slate-700">
                Categoria
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="BASE">Produto Base (Matéria-prima)</option>
                <option value="FINAL">Produto Final (Processado)</option>
                <option value="SERVICO">Serviço / Outros</option>
              </select>
            </div>
             <div>
              <label className="block text-sm font-medium text-slate-700">
                Tipo de Aço (Opcional)
              </label>
              <select
                name="steelType"
                value={formData.steelType}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="">Nenhum</option>
                <option value="CA-50">CA-50</option>
                <option value="CA-60">CA-60</option>
                <option value="CA-25">CA-25</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Cadastrar Produto"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function NovoProdutoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando...</div>}>
      <NovoProdutoContent />
    </Suspense>
  );
}
