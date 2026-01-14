"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type CompanyForm = {
  name: string;
  tradeName: string;
  cnpj: string;
  logoUrl: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  instagram: string;
  facebook: string;
  website: string;
  openaiApiKey: string;
  geminiApiKey: string;
  groqApiKey: string;
};

export default function EmpresaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [showKeys, setShowKeys] = useState(false);

  const [formData, setFormData] = useState<CompanyForm>({
    name: "",
    tradeName: "",
    cnpj: "",
    logoUrl: "",
    email: "",
    phone: "",
    whatsapp: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    instagram: "",
    facebook: "",
    website: "",
    openaiApiKey: "",
    geminiApiKey: "",
    groqApiKey: "",
  });

  useEffect(() => {
    async function carregarEmpresa() {
      const response = await fetch("/api/empresa");
      if (!response.ok) {
        setLoadingInitial(false);
        return;
      }
      const data = await response.json();
      if (data) {
        setFormData({
          name: data.name || "",
          tradeName: data.tradeName || "",
          cnpj: data.cnpj || "",
          logoUrl: data.logoUrl || "",
          email: data.email || "",
          phone: data.phone || "",
          whatsapp: data.whatsapp || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          zipCode: data.zipCode || "",
          instagram: data.instagram || "",
          facebook: data.facebook || "",
          website: data.website || "",
          openaiApiKey: data.openaiApiKey || "",
          geminiApiKey: data.geminiApiKey || "",
          groqApiKey: data.groqApiKey || "",
        });
      }
      setLoadingInitial(false);
    }
    carregarEmpresa();
  }, []);

  async function buscarCnpj(valor: string) {
    const cnpjLimpo = valor.replace(/\D/g, "");
    if (cnpjLimpo.length !== 14) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/cnpj?cnpj=${cnpjLimpo}`);
      if (!response.ok) throw new Error("Erro ao buscar CNPJ");
      const data = await response.json();

      setFormData(prev => ({
        ...prev,
        name: data.name || prev.name,
        tradeName: data.tradeName || data.name || prev.tradeName,
        zipCode: data.zipCode || prev.zipCode,
        address: data.address || prev.address,
        city: data.city || prev.city,
        state: data.state || prev.state,
        phone: data.phone || prev.phone,
        email: data.email || prev.email,
      }));
    } catch (e) {
      console.error(e);
      // Optional: setError("CNPJ não encontrado");
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    
    // Auto-search CNPJ when 14 digits are entered
    if (name === "cnpj") {
      const nums = value.replace(/\D/g, "");
      if (nums.length === 14) {
        buscarCnpj(nums);
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setSaved(false);
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSaved(false);

    const response = await fetch("/api/empresa", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      setError("Não foi possível salvar os dados da empresa.");
      setLoading(false);
      return;
    }

    setSaved(true);
    setLoading(false);
  }

  if (loadingInitial) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-slate-600">Carregando dados da empresa...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-sm border border-slate-200 p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Dados da empresa
            </h1>
            <p className="text-sm text-slate-600">
              Configure nome, CNPJ, endereço, contato e redes sociais.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Voltar ao Dashboard
          </Link>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}
        {saved && (
          <div className="p-3 rounded-md bg-emerald-50 text-emerald-700 text-sm">
            Dados salvos com sucesso.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Razão social
              </label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Nome fantasia
              </label>
              <input
                name="tradeName"
                value={formData.tradeName}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                CNPJ
              </label>
              <input
                name="cnpj"
                value={formData.cnpj}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Telefone
              </label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                WhatsApp
              </label>
              <input
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700">
                Endereço
              </label>
              <input
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                CEP
              </label>
              <input
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Cidade
              </label>
              <input
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Estado
              </label>
              <input
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                E-mail
              </label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Logo (URL)
              </label>
              <input
                name="logoUrl"
                value={formData.logoUrl}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Instagram
              </label>
              <input
                name="instagram"
                value={formData.instagram}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Facebook
              </label>
              <input
                name="facebook"
                value={formData.facebook}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Site
            </label>
            <input
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="border-t pt-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-slate-900">Integrações de IA</h2>
              <button
                type="button"
                onClick={() => setShowKeys(!showKeys)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showKeys ? "Ocultar chaves" : "Mostrar chaves"}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  OpenAI API Key (GPT-4)
                </label>
                <input
                  name="openaiApiKey"
                  type={showKeys ? "text" : "password"}
                  value={formData.openaiApiKey}
                  onChange={handleChange}
                  placeholder="sk-..."
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                />
                <a 
                  href="https://platform.openai.com/api-keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-flex items-center gap-1"
                >
                  Obter chave na OpenAI ↗
                </a>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Google Gemini API Key
                </label>
                <input
                  name="geminiApiKey"
                  type={showKeys ? "text" : "password"}
                  value={formData.geminiApiKey}
                  onChange={handleChange}
                  placeholder="AIza..."
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                />
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-flex items-center gap-1"
                >
                  Obter chave no Google AI Studio ↗
                </a>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Groq API Key (Free)
                </label>
                <input
                  name="groqApiKey"
                  type={showKeys ? "text" : "password"}
                  value={formData.groqApiKey}
                  onChange={handleChange}
                  placeholder="gsk_..."
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                />
                <a 
                  href="https://console.groq.com/keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-flex items-center gap-1"
                >
                  Obter chave na Groq ↗
                </a>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Essas chaves serão usadas prioritariamente para as funcionalidades de IA. Se não preenchidas, o sistema tentará usar as variáveis de ambiente (.env).
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Salvando..." : "Salvar dados"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

