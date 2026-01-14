"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Edit, MoreHorizontal, CheckCircle, Clock } from "lucide-react";

// Local translation of status
const STATUS_MAP: Record<string, string> = {
  DRAFT: "Rascunho",
  CONFIRMED: "Confirmado",
  IN_PRODUCTION: "Em Produção",
  PARTIALLY_DELIVERED: "Entrega Parcial",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  IN_PRODUCTION: "bg-orange-100 text-orange-700",
  PARTIALLY_DELIVERED: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

type Sale = {
  id: string;
  createdAt: Date | string;
  client: { name: string };
  user: { name: string };
  status: string;
  total: number;
};

export default function SalesList({ sales: initialSales }: { sales: Sale[] }) {
  const router = useRouter();
  const [sales, setSales] = useState(initialSales);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta venda? Todas as ordens de produção e entregas associadas também serão excluídas.")) return;

    setLoadingId(id);
    try {
      const res = await fetch(`/api/vendas/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erro ao excluir venda");
      } else {
        setSales(sales.filter((s) => s.id !== id));
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir venda");
    } finally {
      setLoadingId(null);
    }
  };

  const handleQuickStatusChange = async (id: string, currentStatus: string) => {
    // Logic to advance status quickly or just open details? 
    // User asked to "change status". A dropdown in the list is good.
    // For now, let's provide a select element in the list.
  };

  const updateStatus = async (id: string, newStatus: string) => {
      setLoadingId(id);
      try {
          // We need to fetch the current sale to not overwrite other fields?
          // Or just PATCH. But our API is PUT and expects full object usually? 
          // Let's check api/vendas/[id]/route.ts. It expects { status, paymentMethod, ... }.
          // If we send partial data, it might fail or overwrite with undefined.
          // The current PUT implementation destructures:
          // const { status, paymentMethod, installments, items, total, deliveryDate, deliveryNotes } = data;
          // And then prisma.update({ data: { status, ... } })
          // If we only send status, other fields might be set to undefined/null if not careful, 
          // BUT Prisma update only updates fields provided in `data`. 
          // However, in route.ts:
          // installments: Number(installments) || 1
          // If installments is missing in payload, it becomes 1. 
          // So we CANNOT use the current PUT endpoint for partial updates safely without fetching first.
          
          // Workaround: We will just direct them to the details page for editing, 
          // OR we fetch, then update.
          // But user said "NO GERENCIADOR DEVO PODER... MUDAR STATUS".
          // So I should implement a PATCH or handle partial update in PUT.
          // Let's stick to "Edit" button for now or implement a specific PATCH endpoint?
          // Actually, I can just fetch the sale in the client, then PUT it back with new status.
          
          const saleRes = await fetch(`/api/vendas/${id}`); // We need a GET endpoint for single sale? 
          // The page.tsx fetches list. Details page fetches single. 
          // Let's assume we can't easily do it without a new endpoint or full fetch.
          
          // Alternative: Just use the existing PUT but we need all data.
          // Simplest solution for "List View Status Change":
          // Add a PATCH endpoint? Or modify PUT to handle partials?
          // Modifying PUT to use `undefined` for missing fields so Prisma ignores them is tricky with the `Number()` casts.
          
          // Let's create a specific action or just keep it simple: 
          // "Click status to toggle" might be dangerous.
          // A dropdown that triggers a fetch->update flow is safest.
          
          // Actually, the user requirement is "No gerenciador devo poder... mudar status".
          // A dropdown is best. I will implement a client-side fetch-modify-save flow.
          
          const res = await fetch(`/api/vendas/${id}`); // Need to check if GET /api/vendas/[id] exists. 
          // It does! (Created in previous context? No, wait. 
          // `src/app/vendas/[id]/page.tsx` fetches via Prisma directly.
          // `src/app/api/vendas/[id]/route.ts` has PUT and DELETE. Does it have GET?
          // I didn't see a GET in the file read earlier.
          // I should check `src/app/api/vendas/[id]/route.ts` again.
          
          // If no GET, I can't easily do client-side partial update without adding it.
          // Let's add GET to `src/app/api/vendas/[id]/route.ts` first.
          
      } catch (e) {
          console.error(e);
      }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              ID / Data
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Cliente
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Vendedor
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {sales.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center text-sm text-slate-500">
                Nenhuma venda registrada.
              </td>
            </tr>
          ) : (
            sales.map((sale) => (
              <tr key={sale.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-slate-900">
                    {sale.id.slice(0, 8)}...
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(sale.createdAt).toLocaleDateString("pt-BR")}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                  {sale.client.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {sale.user.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[sale.status] || "bg-gray-100 text-gray-800"}`}>
                    {STATUS_MAP[sale.status] || sale.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-slate-900">
                  {sale.total.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <div className="flex items-center justify-center gap-3">
                     <Link
                      href={`/vendas/${sale.id}`}
                      className="text-slate-600 hover:text-slate-900"
                      title="Editar / Detalhes"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                        onClick={() => handleDelete(sale.id)}
                        disabled={loadingId === sale.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        title="Excluir Venda"
                    >
                        {loadingId === sale.id ? "..." : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}