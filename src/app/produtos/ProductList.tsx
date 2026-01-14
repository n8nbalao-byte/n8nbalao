"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Filter, ArrowUpDown } from "lucide-react";
import DeleteProductButton from "./DeleteProductButton";

type Product = {
  id: string;
  code: string;
  name: string;
  category: string | null;
  unit: string;
  basePrice: number;
};

export default function ProductList({ products }: { products: Product[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category).filter(Boolean));
    return Array.from(cats) as string[];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by Search Term
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerTerm) ||
          p.code.toLowerCase().includes(lowerTerm)
      );
    }

    // Filter by Category
    if (categoryFilter !== "ALL") {
      result = result.filter((p) => p.category === categoryFilter);
    }

    // Sort by Price
    result.sort((a, b) => {
      if (sortOrder === "ASC") {
        return a.basePrice - b.basePrice;
      } else {
        return b.basePrice - a.basePrice;
      }
    });

    return result;
  }, [products, searchTerm, categoryFilter, sortOrder]);

  return (
    <div className="space-y-6">
      {/* Filters & Controls */}
      <div className="flex flex-col md:flex-row gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        
        <div className="flex gap-4">
          <div className="relative min-w-[150px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 appearance-none bg-white"
            >
              <option value="ALL">Todas Categorias</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="relative min-w-[180px]">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "ASC" | "DESC")}
              className="w-full pl-10 pr-4 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 appearance-none bg-white"
            >
              <option value="ASC">Preço: Menor para Maior</option>
              <option value="DESC">Preço: Maior para Menor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-3 text-slate-600 font-medium border-b border-slate-200">
                Código
              </th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium border-b border-slate-200">
                Produto
              </th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium border-b border-slate-200">
                Categoria
              </th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium border-b border-slate-200">
                Unidade
              </th>
              <th className="text-right px-4 py-3 text-slate-600 font-medium border-b border-slate-200">
                Preço Base
              </th>
              <th className="text-center px-4 py-3 text-slate-600 font-medium border-b border-slate-200">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Nenhum produto encontrado.
                </td>
              </tr>
            ) : (
              filteredProducts.map((produto) => (
                <tr key={produto.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-900">{produto.code}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {produto.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                      {produto.category || "Geral"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{produto.unit}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">
                    {produto.basePrice.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <Link
                        href={`/produtos/${produto.id}/editar`}
                        className="text-slate-600 hover:text-slate-900 font-medium"
                      >
                        Editar
                      </Link>
                      {produto.category === "BASE" && (
                        <Link
                          href={`/produtos/novo?baseId=${produto.id}`}
                          className="text-emerald-600 hover:text-emerald-800 font-medium"
                          title="Criar variação baseada neste produto"
                        >
                          Clonar
                        </Link>
                      )}
                      <div className="h-4 w-px bg-slate-300"></div>
                      <DeleteProductButton id={produto.id} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="flex justify-between items-center text-xs text-slate-500 px-1">
        <div>
           Mostrando {filteredProducts.length} de {products.length} produtos
        </div>
        <div>
           * Produtos BASE podem ser usados para criar variações
        </div>
      </div>
    </div>
  );
}