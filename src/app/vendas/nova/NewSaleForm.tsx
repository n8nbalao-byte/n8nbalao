"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Square, 
  RectangleHorizontal, 
  RectangleVertical, 
  Home, 
  Triangle, 
  RefreshCw, 
  ShoppingCart
} from "lucide-react";

type Client = {
  id: string;
  name: string;
  document: string;
};

type Product = {
  id: string;
  code: string;
  name: string;
  basePrice: number;
  unit: string;
  steelType?: string;
  category?: string;
};

type SaleItem = {
  productId: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
  structureType?: string; // Optional: track which structure type was used
  observation?: string;
};

const STRUCTURE_TYPES = [
  {
    id: "laje",
    label: "Laje",
    description: "Maciças, nervuradas ou pré-moldadas",
    usage: ["Barras retas CA-50 ou CA-60", "Malha pop (soldada)", "Vergalhão distribuição"],
    Icon: Square
  },
  {
    id: "viga",
    label: "Viga",
    description: "Responsável por sustentar a laje e distribuir cargas",
    usage: ["Vergalhão CA-50 (bitolas médias/grossas)", "Estribos (dobrados)", "Aço para armação longitudinal"],
    Icon: RectangleHorizontal
  },
  {
    id: "coluna",
    label: "Coluna / Pilar",
    description: "Estrutura vertical (pilar = coluna)",
    usage: ["Vergalhão CA-50 (bitolas médias a grossas)", "Estribos CA-60", "Barras retas longas"],
    Icon: RectangleVertical
  },
  {
    id: "fundacao",
    label: "Fundação",
    description: "Base da construção (sapata / baldrame / radier)",
    usage: ["Vergalhão CA-50", "Estribos", "Barras retas mais grossas", "Malha pop (radier)"],
    Icon: Home
  },
  {
    id: "trelica",
    label: "Treliça",
    description: "Muito usada em laje treliçada e muros",
    usage: ["Treliça pronta (H8, H12, etc.)", "Vergalhão complementar"],
    Icon: Triangle
  },
  {
    id: "estribo",
    label: "Estribo",
    description: "Peça dobrada sob medida",
    usage: ["CA-60", "Sob medida (largura, altura e espaçamento)"],
    Icon: RefreshCw
  },
  {
    id: "livre",
    label: "Compra Livre",
    description: "Modo avançado para profissionais",
    usage: ["Escolher qualquer ferro", "Sem restrições"],
    Icon: ShoppingCart
  }
];

export default function NewSaleForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [clientId, setClientId] = useState("");
  const [items, setItems] = useState<SaleItem[]>([]);

  // Structure Type Selection
  const [selectedStructureType, setSelectedStructureType] = useState<string | null>(null);

  // Temporary state for adding a new item
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [observation, setObservation] = useState("");

  // Delivery fields
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [clientsRes, productsRes] = await Promise.all([
          fetch("/api/clientes"),
          fetch("/api/produtos"),
        ]);
        
        const clientsData = await clientsRes.json();
        const productsData = await productsRes.json();
        
        setClients(clientsData);
        setProducts(productsData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoadingData(false);
      }
    }
    fetchData();
  }, []);

  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setPrice(prod.basePrice);
    }
  };

  const addItem = () => {
    if (!selectedProductId) return;
    
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    const newItem: SaleItem = {
      productId: prod.id,
      description: prod.name,
      quantity: Number(quantity),
      price: Number(price),
      total: Number(quantity) * Number(price),
      structureType: selectedStructureType || undefined,
      observation: observation || undefined
    };

    setItems([...items, newItem]);
    
    // Reset inputs but keep structure type? Or reset it?
    // Let's reset product inputs but keep structure type for convenience, or ask user?
    // User flow: Pick type -> Add items -> Maybe add more of same type -> Change type.
    // So keep type.
    setSelectedProductId("");
    setQuantity(1);
    setPrice(0);
    setObservation("");
  };

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const totalSale = items.reduce((acc, item) => acc + item.total, 0);

  const handleSubmit = async () => {
    if (!clientId) {
      alert("Selecione um cliente");
      return;
    }
    if (items.length === 0) {
      alert("Adicione pelo menos um item");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/vendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          items,
          deliveryDate,
          deliveryNotes
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao salvar venda");
      }

      router.push("/vendas");
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erro ao salvar venda");
    } finally {
      setLoading(false);
    }
  };

  // Filter products based on structure type
  const filteredProducts = products.filter(p => {
    if (!selectedStructureType || selectedStructureType === "livre") return true;
    
    const cat = (p.category || "").toUpperCase();
    const name = p.name.toUpperCase();
    const code = p.code.toUpperCase();

    switch (selectedStructureType) {
      case "laje":
        return cat === "VERGALHAO" || cat === "TELA" || cat === "ARAME" || name.includes("LAJE");
      case "viga":
      case "coluna":
        return cat === "VERGALHAO" || cat === "ESTRIBO" || cat === "COLUNA" || cat === "ARAME" || name.includes("VIGA") || name.includes("COLUNA");
      case "fundacao":
        return cat === "VERGALHAO" || cat === "SAPATA" || cat === "TELA" || cat === "ARAME" || name.includes("SAPATA");
      case "trelica":
        return cat === "TRELICA" || cat === "VERGALHAO" || cat === "ARAME";
      case "estribo":
        return cat === "ESTRIBO" || cat === "VERGALHAO" || name.includes("ESTRIBO");
      default:
        return true;
    }
  });

  if (loadingData) {
    return <div className="p-8 text-center text-slate-500">Carregando...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nova Venda</h1>
          <p className="text-slate-600">Preencha os dados para criar um novo pedido de venda.</p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Voltar ao Dashboard
        </Link>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        {/* Cliente */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
          <select
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="">Selecione um cliente...</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} ({client.document})
              </option>
            ))}
          </select>
        </div>

        {/* Adicionar Item */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">
             Adicionar Produto {selectedStructureType ? `- ${STRUCTURE_TYPES.find(t => t.id === selectedStructureType)?.label}` : ""}
          </h3>
          
          {!selectedStructureType ? (
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {STRUCTURE_TYPES.map(type => {
                    const Icon = type.Icon;
                    return (
                        <button
                            key={type.id}
                            onClick={() => setSelectedStructureType(type.id)}
                            className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-sm hover:border-slate-800 hover:bg-slate-50 transition-all text-center h-32 group"
                        >
                            {Icon && <Icon className="w-8 h-8 mb-3 text-slate-400 group-hover:text-slate-900 transition-colors" />}
                            <span className="font-semibold text-slate-900 text-xs uppercase tracking-wider">{type.label}</span>
                        </button>
                    );
                })}
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex items-center justify-between bg-slate-100 p-3 rounded-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        {(() => {
                            const Type = STRUCTURE_TYPES.find(t => t.id === selectedStructureType);
                            const Icon = Type?.Icon;
                            return Type && Icon ? (
                                <>
                                    <div className="p-2 bg-white rounded-sm border border-slate-200">
                                        <Icon className="w-5 h-5 text-slate-900" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm uppercase">{Type.label}</h4>
                                        <p className="text-xs text-slate-500">Filtrando produtos relacionados</p>
                                    </div>
                                </>
                            ) : null;
                        })()}
                    </div>
                    <button 
                        onClick={() => setSelectedStructureType(null)}
                        className="text-xs text-slate-600 hover:text-slate-900 font-medium underline decoration-slate-300 underline-offset-4"
                    >
                        Trocar Categoria
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Produto</label>
                    <select
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        value={selectedProductId}
                        onChange={(e) => handleProductChange(e.target.value)}
                    >
                        <option value="">Selecione...</option>
                        {filteredProducts.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                            {prod.name}
                        </option>
                        ))}
                    </select>
                    </div>
                    <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Qtd</label>
                    <input
                        type="number"
                        min="1"
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                    />
                    </div>
                    <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Preço Unit. (R$)</label>
                    <input
                        type="number"
                        step="0.01"
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                    />
                    </div>
                </div>
                <div className="flex justify-end">
                    <button
                    type="button"
                    onClick={addItem}
                    disabled={!selectedProductId}
                    className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 disabled:opacity-50"
                    >
                    Adicionar Item
                    </button>
                </div>
            </div>
          )}
        </div>

        {/* Lista de Itens */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-2">Itens do Pedido</h3>
          {items.length === 0 ? (
            <p className="text-sm text-slate-500 italic">Nenhum item adicionado.</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Produto</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Qtd</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Unit.</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Total</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-slate-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 text-sm text-slate-900">
                        {item.description}
                        {item.structureType && (
                            <span className="block text-[10px] text-slate-400">
                                {STRUCTURE_TYPES.find(t => t.id === item.structureType)?.label}
                            </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-slate-900 text-right">{item.quantity}</td>
                      <td className="px-4 py-2 text-sm text-slate-900 text-right">
                        {item.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </td>
                      <td className="px-4 py-2 text-sm text-slate-900 text-right font-medium">
                        {item.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => removeItem(idx)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium"
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right text-sm font-bold text-slate-900">Total Geral:</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                      {totalSale.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Entrega e Agendamento */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Agendamento e Entrega</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Data de Entrega Prevista</label>
                    <input
                        type="date"
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Observações de Entrega (Parcial, etc)</label>
                    <textarea
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        rows={2}
                        placeholder="Ex: Entregar parte amanhã, restante na próxima semana..."
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                    />
                </div>
            </div>
        </div>

        {/* Ações Finais */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => router.push("/vendas")}
            className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || items.length === 0 || !clientId}
            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Finalizando..." : "Finalizar Venda"}
          </button>
        </div>
      </div>
    </div>
  );
}
