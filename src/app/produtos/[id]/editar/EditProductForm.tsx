"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

type Props = {
  id: string;
};

export default function EditProductForm({ id }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    unit: "UN",
    basePrice: 0,
    category: "BASE",
    steelType: "",
  });

  useEffect(() => {
    async function carregarProduto() {
      const response = await fetch(`/api/produtos/${id}`);
      if (!response.ok) {
        router.push("/produtos");
        return;
      }
      const data = await response.json();
      setFormData({
        code: data.code || "",
        name: data.name || "",
        unit: data.unit || "UN",
        basePrice: data.basePrice || 0,
        category: data.category || "BASE",
        steelType: data.steelType || "",
      });
      setLoadingInitial(false);
    }
    carregarProduto();
  }, [id, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "basePrice" ? parseFloat(value) : value,
    }));
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch(`/api/produtos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      setError("Não foi possível atualizar o produto.");
      setLoading(false);
      return;
    }

    router.push("/produtos");
  }

  if (loadingInitial) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-slate-600">Carregando produto...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-sm border border-slate-200 p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Editar Produto</h1>
            <p className="text-sm text-slate-600">
              Atualize as informações do produto selecionado.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Código
            </label>
            <input
              type="text"
              name="code"
              required
              value={formData.code}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Nome do Produto
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
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
                <option value="KG">Quilo (KG)</option>
                <option value="M">Metro (M)</option>
                <option value="BARRA">Barra 12m</option>
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
                required
                value={formData.basePrice}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
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

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => router.push("/produtos")}
              className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

