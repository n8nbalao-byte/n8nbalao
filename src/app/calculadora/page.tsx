"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Square, 
  RectangleHorizontal, 
  RectangleVertical, 
  Home, 
  ShoppingCart, 
  Trash2,
  Check,
  Package,
  ArrowRight,
  Printer,
  Triangle,
  Layers
} from "lucide-react";

// =====================
// TYPES
// =====================

type Product = {
  id: string;
  code: string;
  name: string;
  basePrice: number;
  unit: string;
  category?: string | null;
};

type Client = {
  id: string;
  name: string;
  document: string;
};

type CartItem = {
  id: string;
  productId: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
  observation?: string;
  structureType?: string;
};

type ResultadoCalculo = {
  tipo: string;
  ferroPrincipal: string; // e.g., "CA-50 8.0mm"
  bitolaMm: number;
  metrosLineares: number;
  barras12m: number;
  peso: number;
  qtdEstribos?: number;
  observacao: string;
  meshArea?: number; // For Laje
};

// =====================
// CONSTANTS
// =====================
const STEEL_WEIGHT: Record<number, number> = {
  4.2: 0.109,
  5.0: 0.154,
  6.3: 0.245,
  8.0: 0.395,
  10.0: 0.617,
  12.5: 0.963,
  16.0: 1.578,
  20.0: 2.466,
  25.0: 3.853,
};

const TABS = [
  { id: "laje", label: "Laje", icon: Square },
  { id: "viga", label: "Viga", icon: RectangleHorizontal },
  { id: "coluna", label: "Coluna / Pilar", icon: RectangleVertical },
  { id: "fundacao", label: "Fundação", icon: Home },
  { id: "trelica", label: "Treliça", icon: Triangle },
  { id: "sapata", label: "Sapata", icon: Layers },
];

import StructureVisualizer from "./StructureVisualizer";

// =====================
// MAIN COMPONENT
// =====================
export default function CalculadoraPage() {
  const router = useRouter();
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // UI State
  const [activeTab, setActiveTab] = useState("laje");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [creatingSale, setCreatingSale] = useState(false);

  // Load Data
  useEffect(() => {
    async function loadData() {
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
    loadData();
  }, []);

  // Helpers
  const addToCart = (items: CartItem | CartItem[]) => {
    setCart(prev => {
      const newItems = Array.isArray(items) ? items : [items];
      return [...prev, ...newItems];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const handleCreateSale = async () => {
    if (!selectedClientId || cart.length === 0) {
      alert("Selecione um cliente e adicione itens ao orçamento.");
      return;
    }
    
    setCreatingSale(true);
    try {
      const response = await fetch("/api/vendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClientId,
          items: cart.map(item => ({
             productId: item.productId,
             description: item.description,
             quantity: item.quantity,
             price: item.price,
             observation: item.observation,
             structureType: item.structureType
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(errorData.error || `Erro ao criar venda: ${response.statusText}`);
      }

      const sale = await response.json();
      router.push(`/vendas/${sale.id}`);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erro ao criar venda. Tente novamente.");
    } finally {
      setCreatingSale(false);
    }
  };

  const totalCart = cart.reduce((acc, item) => acc + item.total, 0);

  if (loadingData) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Carregando sistema...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: CALCULATOR */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-6 h-6" /> Calculadora Estrutural
            </h1>
            <Link href="/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-900">
              Voltar ao Dashboard
            </Link>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                    isActive 
                      ? "bg-slate-900 text-white border-slate-900 shadow-md" 
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Calculator Form */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === "laje" && <CalculadoraLaje products={products} onAdd={addToCart} />}
            {activeTab === "viga" && <TelaViga products={products} onAdd={addToCart} />}
            {activeTab === "coluna" && <TelaColuna products={products} onAdd={addToCart} />}
            {activeTab === "fundacao" && <TelaFundacao products={products} onAdd={addToCart} />}
            {activeTab === "trelica" && <TelaTrelica products={products} onAdd={addToCart} />}
            {activeTab === "sapata" && <TelaSapata products={products} onAdd={addToCart} />}
          </div>
        </div>

        {/* RIGHT COLUMN: CART */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-4rem)] sticky top-8">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" /> Orçamento
              </h2>
            </div>

            {/* Client Selection */}
            <div className="p-4 border-b border-slate-100">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cliente</label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full rounded-md border-slate-300 text-sm focus:ring-slate-900 focus:border-slate-900"
              >
                <option value="">Selecione um cliente...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <p className="text-sm">Seu carrinho está vazio.</p>
                  <p className="text-xs mt-1">Use a calculadora para adicionar itens.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="group relative bg-slate-50 p-3 rounded-lg border border-slate-100 hover:border-slate-300 transition-colors">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="pr-6">
                      <p className="text-sm font-medium text-slate-900">{item.description}</p>
                      <div className="flex justify-between items-end mt-1">
                        <p className="text-xs text-slate-500">
                          {item.quantity} un x {item.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </p>
                        <p className="text-sm font-bold text-slate-900">
                          {item.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-xl space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Total Estimado</span>
                <span className="text-xl font-bold text-slate-900">
                  {totalCart.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
              <button
                onClick={handleCreateSale}
                disabled={creatingSale || cart.length === 0 || !selectedClientId}
                className="w-full py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
              >
                {creatingSale ? "Processando..." : (
                  <>
                    Finalizar Venda <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================
// SUB-COMPONENTS (CALCULATORS)
// =====================

// Helper to find product
const findProduct = (products: Product[], term: string) => {
  const termClean = term.toLowerCase().replace(/\s/g, "");
  return products.find(p => {
    const nameClean = p.name.toLowerCase().replace(/\s/g, "");
    return nameClean.includes(termClean);
  });
};

const findProductByDiameter = (products: Product[], mm: number, type: "CA-50" | "CA-60" | "ESTRIBO" = "CA-50") => {
  // Try to find exact match
  const diameterStr = mm.toString().replace(".", ","); // "8,0" or "4,2"
  const diameterStrDot = mm.toString(); // "8.0" or "4.2"
  
  return products.find(p => {
     const name = p.name.toUpperCase();
     // Prioritize category if exists
     if (type === "ESTRIBO" && p.category !== "ESTRIBO" && !name.includes("ESTRIBO")) return false;
     
     // Match diameter
     return name.includes(diameterStr) || name.includes(diameterStrDot) || name.includes(`${mm}MM`);
  });
};

function CalculadoraLaje({ products, onAdd }: { products: Product[], onAdd: (items: CartItem[]) => void }) {
  const [comprimento, setComprimento] = useState(6);
  const [largura, setLargura] = useState(5);
  const [espacamento, setEspacamento] = useState(20);
  const [bitola, setBitola] = useState(8.0);
  const [useMesh, setUseMesh] = useState(false);

  const resultado = useMemo(() => {
    const esp = espacamento / 100;
    const barras1 = Math.floor(largura / esp) + 1;
    const barras2 = Math.floor(comprimento / esp) + 1;
    const metros = barras1 * comprimento + barras2 * largura;
    const barras12m = Math.ceil(metros / 12);
    const peso = metros * (STEEL_WEIGHT[bitola] ?? 0);
    const meshArea = useMesh ? comprimento * largura : 0;

    return {
      tipo: "Laje",
      ferroPrincipal: `CA-50 ${bitola}mm`,
      bitolaMm: bitola,
      metrosLineares: Number(metros.toFixed(2)),
      barras12m,
      peso: Number(peso.toFixed(2)),
      meshArea,
      observacao: useMesh ? "Com malha pop" : "Malha convencional (Vergalhão)",
    };
  }, [comprimento, largura, espacamento, bitola, useMesh]);

  const handleAdd = () => {
    const itemsToAdd: CartItem[] = [];

    // 1. Add Main Bars
    if (resultado.barras12m > 0) {
       const product = findProductByDiameter(products, bitola, "CA-50") || products[0]; // Fallback to first
       if (product) {
          itemsToAdd.push({
             id: Math.random().toString(36).substr(2, 9),
             productId: product.id,
             description: `Laje ${comprimento}x${largura}m - ${product.name} (${resultado.barras12m} barras)`,
             quantity: resultado.barras12m,
             price: product.basePrice,
             total: resultado.barras12m * product.basePrice,
             observation: resultado.observacao,
             structureType: "laje"
          });
       } else {
          alert(`Produto não encontrado para bitola ${bitola}mm`);
       }
    }
    
    // 2. Add Mesh if selected
    if (resultado.meshArea && resultado.meshArea > 0) {
        // Try to find "Tela" or "Malha"
        const meshProduct = products.find(p => p.name.toUpperCase().includes("TELA") || p.name.toUpperCase().includes("MALHA"));
        if (meshProduct) {
             const qtd = Math.ceil(resultado.meshArea); // Approximation (m2)
             itemsToAdd.push({
                id: Math.random().toString(36).substr(2, 9),
                productId: meshProduct.id,
                description: `Laje ${comprimento}x${largura}m - ${meshProduct.name} (${qtd}m²)`,
                quantity: qtd,
                price: meshProduct.basePrice,
                total: qtd * meshProduct.basePrice,
                structureType: "laje"
             });
        }
    }

    if (itemsToAdd.length > 0) {
      onAdd(itemsToAdd);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Parâmetros da Laje</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Comprimento (m)" value={comprimento} setValue={setComprimento} step={0.1} />
        <Input label="Largura (m)" value={largura} setValue={setLargura} step={0.1} />
        <Select label="Espaçamento (cm)" value={espacamento} setValue={setEspacamento} options={[15, 20, 25]} />
        <Select label="Bitola (mm)" value={bitola} setValue={setBitola} options={[6.3, 8.0, 10.0, 12.5]} />
      </div>
      
      <div className="flex items-center gap-2 pt-2">
         <input type="checkbox" checked={useMesh} onChange={e => setUseMesh(e.target.checked)} className="w-4 h-4 rounded border-slate-300" />
         <span className="text-sm text-slate-700">Usar Malha Pop (Tela Soldada)</span>
      </div>

      <ResultCard resultado={resultado} onAdd={handleAdd} />
      
      <div className="mt-6 border-t pt-4">
        <h4 className="text-sm font-semibold text-slate-500 mb-4 uppercase">Visualização</h4>
        <StructureVisualizer 
          type="laje"
          width={comprimento}
          depth={largura}
          mainGauge={bitola}
          stirrupSpacing={espacamento}
          useMesh={useMesh}
        />
      </div>
    </div>
  );
}

function TelaViga({ products, onAdd }: { products: Product[], onAdd: (items: CartItem[]) => void }) {
  const [comprimento, setComprimento] = useState(5);
  const [qtd, setQtd] = useState(1);
  const [bitola, setBitola] = useState(10.0);
  const [estriboBitola, setEstriboBitola] = useState(4.2);

  const resultado = useMemo(() => {
    const ferros = 4; // 4 barras longitudinais padrão
    const espacamentoEstribo = 0.2; // 20cm

    const metros = ferros * comprimento * qtd;
    const qtdEstribos = Math.ceil(comprimento / espacamentoEstribo) * qtd;
    
    // Peso total (aprox)
    const peso = (metros * (STEEL_WEIGHT[bitola] ?? 0)) + (qtdEstribos * 0.8 * (STEEL_WEIGHT[estriboBitola] ?? 0)); // 0.8m per estribo est

    return {
      tipo: "Viga",
      ferroPrincipal: `CA-50 ${bitola}mm`,
      bitolaMm: bitola,
      metrosLineares: Number(metros.toFixed(2)),
      barras12m: Math.ceil(metros / 12),
      peso: Number(peso.toFixed(2)),
      qtdEstribos,
      observacao: `${qtd} vigas de ${comprimento}m (4 ferros + estribos a cada 20cm)`,
    };
  }, [comprimento, qtd, bitola, estriboBitola]);

  const handleAdd = () => {
     const itemsToAdd: CartItem[] = [];

     // Main Bars
     const mainProduct = findProductByDiameter(products, bitola, "CA-50");
     if (mainProduct) {
        itemsToAdd.push({
             id: Math.random().toString(36).substr(2, 9),
             productId: mainProduct.id,
             description: `Viga ${comprimento}m (${qtd} un) - ${mainProduct.name} (${resultado.barras12m} barras)`,
             quantity: resultado.barras12m,
             price: mainProduct.basePrice,
             total: resultado.barras12m * mainProduct.basePrice,
             structureType: "viga"
        });
     }

     // Estribos
     if (resultado.qtdEstribos && resultado.qtdEstribos > 0) {
         // Find estribo product (often sold by KG or Unit depending on store, assuming Unit/KG mapped to product)
         // If "Estribo 7x17" exists, perfect. If not, use generic "Estribo" or "CA-60".
         // Let's try to find a generic Estribo product or CA-60.
         const estriboProduct = findProductByDiameter(products, estriboBitola, "ESTRIBO") || findProductByDiameter(products, estriboBitola, "CA-60");
         
         if (estriboProduct) {
             // If product unit is KG, we need weight. If Unit, we need qty.
             // Assuming KG for now as default for CA-60 unless it says "ESTRIBO" (Unit).
             let quantity = resultado.qtdEstribos;
             let desc = `Estribos para Viga (${resultado.qtdEstribos} un)`;
             
             if (estriboProduct.unit === "KG") {
                 // Calculate weight: ~0.8m per stirrup * weight/m
                 const weightPerStirrup = 0.8 * (STEEL_WEIGHT[estriboBitola] || 0);
                 quantity = Math.ceil(resultado.qtdEstribos * weightPerStirrup);
                 desc = `Aço para Estribos (${quantity}kg)`;
             }

             itemsToAdd.push({
                 id: Math.random().toString(36).substr(2, 9),
                 productId: estriboProduct.id,
                 description: desc,
                 quantity: quantity,
                 price: estriboProduct.basePrice,
                 total: quantity * estriboProduct.basePrice,
                 structureType: "viga"
             });
         }
     }

     if (itemsToAdd.length > 0) {
       onAdd(itemsToAdd);
     }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Parâmetros da Viga</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Comprimento (m)" value={comprimento} setValue={setComprimento} step={0.1} />
        <Input label="Quantidade (un)" value={qtd} setValue={setQtd} step={1} />
        <Select label="Bitola Principal (mm)" value={bitola} setValue={setBitola} options={[8.0, 10.0, 12.5, 16.0]} />
        <Select label="Bitola Estribo (mm)" value={estriboBitola} setValue={setEstriboBitola} options={[4.2, 5.0, 6.3]} />
      </div>
      <ResultCard resultado={resultado} onAdd={handleAdd} />

      <div className="mt-6 border-t pt-4">
        <h4 className="text-sm font-semibold text-slate-500 mb-4 uppercase">Visualização</h4>
        <StructureVisualizer 
          type="viga"
          width={comprimento}
          depth={0.3} 
          height={0.4}
          mainGauge={bitola}
          stirrupSpacing={20}
        />
      </div>
    </div>
  );
}

function TelaColuna({ products, onAdd }: { products: Product[], onAdd: (items: CartItem[]) => void }) {
  const [altura, setAltura] = useState(3);
  const [qtd, setQtd] = useState(1);
  const [bitola, setBitola] = useState(10.0);

  const resultado = useMemo(() => {
    const ferros = 4;
    const espacamentoEstribo = 0.2;
    const metros = ferros * altura * qtd;
    const qtdEstribos = Math.ceil(altura / espacamentoEstribo) * qtd;
    const peso = metros * (STEEL_WEIGHT[bitola] ?? 0);

    return {
      tipo: "Coluna / Pilar",
      ferroPrincipal: `CA-50 ${bitola}mm`,
      bitolaMm: bitola,
      metrosLineares: Number(metros.toFixed(2)),
      barras12m: Math.ceil(metros / 12),
      peso: Number(peso.toFixed(2)),
      qtdEstribos,
      observacao: `${qtd} colunas de ${altura}m (4 ferros + estribos)`,
    };
  }, [altura, qtd, bitola]);

  const handleAdd = () => {
      const itemsToAdd: CartItem[] = [];
      const mainProduct = findProductByDiameter(products, bitola, "CA-50");
      if (mainProduct) {
        itemsToAdd.push({
             id: Math.random().toString(36).substr(2, 9),
             productId: mainProduct.id,
             description: `Coluna ${altura}m (${qtd} un) - ${mainProduct.name} (${resultado.barras12m} barras)`,
             quantity: resultado.barras12m,
             price: mainProduct.basePrice,
             total: resultado.barras12m * mainProduct.basePrice,
             structureType: "coluna"
        });
      }
      
      // Estribos (Simples logic: add estribo product if found)
      const estriboProduct = findProductByDiameter(products, 4.2, "ESTRIBO") || findProductByDiameter(products, 5.0, "CA-60");
      if (estriboProduct && resultado.qtdEstribos) {
             let quantity = resultado.qtdEstribos;
             if (estriboProduct.unit === "KG") {
                 const weightPerStirrup = 0.8 * 0.154; // approx for 5.0mm
                 quantity = Math.ceil(resultado.qtdEstribos * weightPerStirrup);
             }
             itemsToAdd.push({
                 id: Math.random().toString(36).substr(2, 9),
                 productId: estriboProduct.id,
                 description: `Estribos para Coluna (${quantity} ${estriboProduct.unit})`,
                 quantity: quantity,
                 price: estriboProduct.basePrice,
                 total: quantity * estriboProduct.basePrice,
                 structureType: "coluna"
             });
      }

      if (itemsToAdd.length > 0) {
        onAdd(itemsToAdd);
      }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Parâmetros da Coluna</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Altura (m)" value={altura} setValue={setAltura} step={0.1} />
        <Input label="Quantidade (un)" value={qtd} setValue={setQtd} step={1} />
        <Select label="Bitola Principal (mm)" value={bitola} setValue={setBitola} options={[8.0, 10.0, 12.5, 16.0]} />
      </div>
      <ResultCard resultado={resultado} onAdd={handleAdd} />
      
      <div className="mt-6 border-t pt-4">
        <h4 className="text-sm font-semibold text-slate-500 mb-4 uppercase">Visualização</h4>
        <StructureVisualizer 
          type="coluna"
          height={altura}
          width={0.3}
          depth={0.3}
          mainGauge={bitola}
          stirrupSpacing={20}
        />
      </div>
    </div>
  );
}

function TelaFundacao({ products, onAdd }: { products: Product[], onAdd: (items: CartItem[]) => void }) {
  const [comprimento, setComprimento] = useState(10);
  const [bitola, setBitola] = useState(10.0);

  const resultado = useMemo(() => {
    const ferros = 4;
    const espacamentoEstribo = 0.25;
    const metros = ferros * comprimento;
    const qtdEstribos = Math.ceil(comprimento / espacamentoEstribo);
    const peso = metros * (STEEL_WEIGHT[bitola] ?? 0);

    return {
      tipo: "Fundação / Baldrame",
      ferroPrincipal: `CA-50 ${bitola}mm`,
      bitolaMm: bitola,
      metrosLineares: Number(metros.toFixed(2)),
      barras12m: Math.ceil(metros / 12),
      peso: Number(peso.toFixed(2)),
      qtdEstribos,
      observacao: "Baldrame padrão residencial",
    };
  }, [comprimento, bitola]);

  const handleAdd = () => {
      const itemsToAdd: CartItem[] = [];
      const mainProduct = findProductByDiameter(products, bitola, "CA-50");
      if (mainProduct) {
        itemsToAdd.push({
             id: Math.random().toString(36).substr(2, 9),
             productId: mainProduct.id,
             description: `Baldrame ${comprimento}m - ${mainProduct.name} (${resultado.barras12m} barras)`,
             quantity: resultado.barras12m,
             price: mainProduct.basePrice,
             total: resultado.barras12m * mainProduct.basePrice,
             structureType: "fundacao"
        });
      }
      
      // Estribos (Logic similar to others)
      const estriboProduct = findProductByDiameter(products, 4.2, "ESTRIBO") || findProductByDiameter(products, 5.0, "CA-60");
      if (estriboProduct && resultado.qtdEstribos) {
             let quantity = resultado.qtdEstribos;
             let desc = `Estribos para Baldrame (${resultado.qtdEstribos} un)`;
             
             if (estriboProduct.unit === "KG") {
                 const weightPerStirrup = 0.8 * 0.154; // Assuming 0.8m length for consistency
                 quantity = Math.ceil(resultado.qtdEstribos * weightPerStirrup);
                 desc = `Aço para Estribos (${quantity}kg)`;
             }

             itemsToAdd.push({
                 id: Math.random().toString(36).substr(2, 9),
                 productId: estriboProduct.id,
                 description: desc,
                 quantity: quantity,
                 price: estriboProduct.basePrice,
                 total: quantity * estriboProduct.basePrice,
                 structureType: "fundacao"
             });
      }

      if (itemsToAdd.length > 0) {
        onAdd(itemsToAdd);
      }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Parâmetros da Fundação</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Comprimento Total (m)" value={comprimento} setValue={setComprimento} step={0.5} />
        <Select label="Bitola (mm)" value={bitola} setValue={setBitola} options={[8.0, 10.0, 12.5]} />
      </div>
      <ResultCard resultado={resultado} onAdd={handleAdd} />
      
      <div className="mt-6 border-t pt-4">
        <h4 className="text-sm font-semibold text-slate-500 mb-4 uppercase">Visualização</h4>
        <StructureVisualizer 
          type="fundacao"
          width={comprimento}
          depth={0.3}
          height={0.4}
          mainGauge={bitola}
          stirrupSpacing={25}
        />
      </div>
    </div>
  );
}

function TelaTrelica({ products, onAdd }: { products: Product[], onAdd: (items: CartItem[]) => void }) {
  const [comprimento, setComprimento] = useState(6);
  const [qtd, setQtd] = useState(10);
  const [modelo, setModelo] = useState("H8");

  const resultado = useMemo(() => {
    const metros = comprimento * qtd;
    return {
      tipo: "Treliça",
      ferroPrincipal: `Treliça ${modelo}`,
      bitolaMm: 0, 
      metrosLineares: Number(metros.toFixed(2)),
      barras12m: Math.ceil(metros / 12),
      peso: 0, 
      observacao: `${qtd} treliças ${modelo} de ${comprimento}m`,
    };
  }, [comprimento, qtd, modelo]);

  const handleAdd = () => {
      const term = `TRELIÇA ${modelo}`;
      // Search for specific model or fallback to generic
      const product = products.find(p => p.name.toUpperCase().includes(term) || p.name.toUpperCase().includes(modelo));
      
      const itemsToAdd: CartItem[] = [];
      if (product) {
         // Usually sold by meters or bars. If unit is "M", use meters. If "UN", use bars.
         // Assuming sold by meters for treliça often, but let's check unit.
         // For safety, let's assume we add "X bars of Y meters".
         // But if the product is "Treliça H8", price is usually per meter.
         // Let's assume price per meter.
         
         const totalMeters = resultado.metrosLineares;
         
         itemsToAdd.push({
             id: Math.random().toString(36).substr(2, 9),
             productId: product.id,
             description: `Treliça ${modelo} - ${qtd} un de ${comprimento}m`,
             quantity: totalMeters,
             price: product.basePrice,
             total: totalMeters * product.basePrice,
             structureType: "trelica"
         });
      } else {
          alert(`Produto ${term} não encontrado.`);
          return;
      }
      onAdd(itemsToAdd);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Parâmetros da Treliça</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Comprimento (m)" value={comprimento} setValue={setComprimento} step={0.1} />
        <Input label="Quantidade (un)" value={qtd} setValue={setQtd} step={1} />
        <SelectString label="Modelo" value={modelo} setValue={setModelo} options={["H8", "H12", "H16", "H20", "H25"]} />
      </div>
      <ResultCard resultado={resultado} onAdd={handleAdd} />

      <div className="mt-6 border-t pt-4">
        <h4 className="text-sm font-semibold text-slate-500 mb-4 uppercase">Visualização</h4>
        <StructureVisualizer 
          type="trelica"
          width={comprimento}
          mainGauge={0}
        />
      </div>
    </div>
  );
}

function TelaSapata({ products, onAdd }: { products: Product[], onAdd: (items: CartItem[]) => void }) {
  const [largura, setLargura] = useState(60); // cm
  const [comprimento, setComprimento] = useState(60); // cm
  const [altura, setAltura] = useState(30); // cm
  const [qtd, setQtd] = useState(1);
  const [bitola, setBitola] = useState(8.0);
  
  const resultado = useMemo(() => {
    const cover = 5; 
    const spacing = 15; 
    const L = largura - 2*cover;
    const C = comprimento - 2*cover;
    
    // Grid bars
    const barsA = Math.floor(C / spacing) + 1; 
    const barsB = Math.floor(L / spacing) + 1; 
    const lengthA = largura; 
    const lengthB = comprimento; 
    const totalMeshMeters = (barsA * lengthA + barsB * lengthB) / 100; 
    
    // Starters (Arranques) - 4 bars of 1m approx (or height * 3)
    // Let's assume starter is 4 x (Height + 60cm anchorage)
    const starterLen = (altura + 60); 
    const totalStarterMeters = (4 * starterLen) / 100;
    
    const totalMetersPerSapata = totalMeshMeters + totalStarterMeters;
    const totalMeters = totalMetersPerSapata * qtd;
    
    const peso = totalMeters * (STEEL_WEIGHT[bitola] ?? 0);
    
    return {
      tipo: "Sapata",
      ferroPrincipal: `CA-50 ${bitola}mm`,
      bitolaMm: bitola,
      metrosLineares: Number(totalMeters.toFixed(2)),
      barras12m: Math.ceil(totalMeters / 12),
      peso: Number(peso.toFixed(2)),
      observacao: `${qtd} sapatas ${largura}x${comprimento}x${altura}cm (Malha + Arranques)`,
    };
  }, [largura, comprimento, altura, qtd, bitola]);

  const handleAdd = () => {
      const itemsToAdd: CartItem[] = [];
      const mainProduct = findProductByDiameter(products, bitola, "CA-50");
      
      if (mainProduct) {
        itemsToAdd.push({
             id: Math.random().toString(36).substr(2, 9),
             productId: mainProduct.id,
             description: `Sapata ${largura}x${comprimento}cm (${qtd} un) - Aço CA-50`,
             quantity: resultado.barras12m, 
             price: mainProduct.basePrice,
             total: resultado.barras12m * mainProduct.basePrice,
             structureType: "sapata"
        });
      }
      
      if (itemsToAdd.length > 0) {
        onAdd(itemsToAdd);
      }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Parâmetros da Sapata</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Largura (cm)" value={largura} setValue={setLargura} step={5} />
        <Input label="Comprimento (cm)" value={comprimento} setValue={setComprimento} step={5} />
        <Input label="Altura (cm)" value={altura} setValue={setAltura} step={5} />
        <Input label="Quantidade (un)" value={qtd} setValue={setQtd} step={1} />
        <Select label="Bitola Aço (mm)" value={bitola} setValue={setBitola} options={[6.3, 8.0, 10.0, 12.5, 16.0]} />
      </div>
      <ResultCard resultado={resultado} onAdd={handleAdd} />
      
      <div className="mt-6 border-t pt-4">
        <h4 className="text-sm font-semibold text-slate-500 mb-4 uppercase">Visualização</h4>
        <StructureVisualizer 
          type="sapata"
          width={largura / 100}
          depth={comprimento / 100}
          height={altura / 100}
          mainGauge={bitola}
        />
      </div>
    </div>
  );
}

function SelectString({ label, value, setValue, options }: { label: string; value: string; setValue: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{label}</label>
      <select 
        value={value} 
        onChange={(e) => setValue(e.target.value)} 
        className="w-full rounded-md border-slate-300 focus:border-slate-900 focus:ring-slate-900"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

// =====================
// UI COMPONENTS
// =====================

function ResultCard({ resultado, onAdd }: { resultado: ResultadoCalculo, onAdd: () => void }) {
  return (
    <div className="mt-6 bg-slate-50 rounded-lg p-5 border border-slate-200">
      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">Resultado Estimado</h4>
      <div className="grid grid-cols-2 gap-4 text-sm mb-6">
        <div>
          <p className="text-slate-500 text-xs uppercase">Ferro Principal</p>
          <p className="font-semibold text-slate-900">{resultado.ferroPrincipal}</p>
        </div>
        <div>
          <p className="text-slate-500 text-xs uppercase">Barras (12m)</p>
          <p className="font-semibold text-slate-900">{resultado.barras12m} un</p>
        </div>
        <div>
          <p className="text-slate-500 text-xs uppercase">Peso Total Aprox.</p>
          <p className="font-semibold text-slate-900">{resultado.peso} kg</p>
        </div>
        {resultado.qtdEstribos && (
          <div>
            <p className="text-slate-500 text-xs uppercase">Estribos Estimados</p>
            <p className="font-semibold text-slate-900">{resultado.qtdEstribos} un</p>
          </div>
        )}
      </div>
      <p className="text-xs text-slate-500 italic mb-4 border-t border-slate-200 pt-2">{resultado.observacao}</p>
      
      <button 
        onClick={onAdd}
        className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
      >
        <Check className="w-4 h-4" />
        Adicionar ao Orçamento
      </button>
    </div>
  );
}

function Input({ label, value, setValue, step = 1 }: { label: string; value: number; setValue: (v: number) => void; step?: number }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{label}</label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full rounded-md border-slate-300 focus:border-slate-900 focus:ring-slate-900"
      />
    </div>
  );
}

function Select({ label, value, setValue, options }: { label: string; value: number; setValue: (v: number) => void; options: number[] }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{label}</label>
      <select 
        value={value} 
        onChange={(e) => setValue(Number(e.target.value))} 
        className="w-full rounded-md border-slate-300 focus:border-slate-900 focus:ring-slate-900"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}
