"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Local translation of status
const STATUS_MAP: Record<string, string> = {
  DRAFT: "Rascunho",
  CONFIRMED: "Confirmado",
  IN_PRODUCTION: "Em Produção",
  PARTIALLY_DELIVERED: "Entrega Parcial",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

export default function SaleManagement({ sale, products }: { sale: any, products: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [items, setItems] = useState(sale.items);
  const [paymentMethod, setPaymentMethod] = useState(sale.paymentMethod || "PIX");
  const [installments, setInstallments] = useState(sale.installments || 1);
  const [status, setStatus] = useState(sale.status);
  const [deliveryDate, setDeliveryDate] = useState(sale.deliveryDate ? new Date(sale.deliveryDate).toISOString().split('T')[0] : "");
  const [deliveryNotes, setDeliveryNotes] = useState(sale.deliveryNotes || "");

  // New Item State
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({
    productId: "",
    quantity: 1,
    unitPrice: 0,
    description: "",
    observation: ""
  });

  // Calculate totals locally
  const calculateTotal = () => {
    return items.reduce((acc: number, item: any) => acc + item.totalPrice, 0);
  };
  
  const total = calculateTotal();

  // Installment calculation logic (2% monthly interest)
  const calculateInstallmentValue = () => {
    if (paymentMethod !== "CREDITO" || installments <= 1) {
        return total / Math.max(1, installments);
    }
    const rate = 0.02;
    const totalWithInterest = total * Math.pow(1 + rate, installments);
    return totalWithInterest / installments;
  };

  const installmentValue = calculateInstallmentValue();
  const totalWithInterest = installmentValue * installments;

  const handleRemoveItem = async (itemId: string) => {
      if (!confirm("Tem certeza que deseja remover este item?")) return;
      
      const newItems = items.filter((i: any) => i.id !== itemId);
      setItems(newItems);
  };

  const handleAddItem = () => {
      if (!newItem.productId || newItem.quantity <= 0) return;
      
      const product = products.find(p => p.id === newItem.productId);
      const totalItem = newItem.quantity * newItem.unitPrice;
      
      const itemToAdd = {
          id: `temp-${Date.now()}`, // Temporary ID
          productId: newItem.productId,
          description: newItem.description || product?.name || "Item",
          quantity: newItem.quantity,
          unitPrice: newItem.unitPrice,
          totalPrice: totalItem,
          observation: newItem.observation
      };
      
      setItems([...items, itemToAdd]);
      setIsAdding(false);
      setNewItem({ productId: "", quantity: 1, unitPrice: 0, description: "", observation: "" });
  };

  const handleProductSelect = (productId: string) => {
      const product = products.find(p => p.id === productId);
      if (product) {
          setNewItem({
              ...newItem,
              productId: product.id,
              unitPrice: product.basePrice,
              description: product.name
          });
      } else {
          setNewItem({ ...newItem, productId: "" });
      }
  };

  const handleSaveChanges = async () => {
      setLoading(true);
      try {
          // Clean items payload
          const cleanItems = items.map((item: any) => ({
              id: item.id,
              productId: item.productId,
              description: item.description,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
              totalPrice: Number(item.totalPrice),
              observation: item.observation,
              structureType: item.structureType
          }));

          const response = await fetch(`/api/vendas/${sale.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  status,
                  paymentMethod,
                  installments,
                  items: cleanItems, 
                  total: paymentMethod === "CREDITO" ? totalWithInterest : total,
                  deliveryDate: deliveryDate || null,
                  deliveryNotes
              })
          });

          if (!response.ok) {
              const errorData = await response.json();
              console.error("Server Error:", errorData);
              throw new Error(errorData.error || errorData.details || "Erro ao atualizar venda");
          }
          
          router.refresh();
          alert("Venda atualizada com sucesso!");
      } catch (error: any) {
          console.error("Save Error:", error);
          alert(`Erro ao salvar: ${error.message}`);
      } finally {
          setLoading(false);
      }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
      // Assuming phone is stored in document or another field if not explicit, but standard is phone field
      // For now, let's try to use a phone field if it exists, or alert if missing.
      const phone = sale.client.phone || sale.client.celular || ""; // Fallback
      if (!phone) {
          alert("Cliente sem telefone/celular cadastrado.");
          return;
      }
      const cleanPhone = phone.replace(/\D/g, "");
      const message = `Olá ${sale.client.name}, aqui é da WM Ferro. Segue detalhes do pedido #${sale.id.slice(0, 8)}. Total: ${total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`;
      window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleEmail = () => {
       if (!sale.client.email) {
          alert("Cliente sem email cadastrado.");
          return;
      }
      const subject = `Pedido #${sale.id.slice(0, 8)} - WM Ferro`;
      const body = `Olá ${sale.client.name},\n\nSegue detalhes do pedido #${sale.id.slice(0, 8)}.\nTotal: ${total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`;
      window.location.href = `mailto:${sale.client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="space-y-8">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 justify-end print:hidden">
            <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors text-sm font-medium"
            >
                🖨️ Imprimir
            </button>
            <button
                onClick={handleWhatsApp}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm font-medium"
            >
                📱 WhatsApp
            </button>
            <button
                onClick={handleEmail}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium"
            >
                ✉️ Email
            </button>
        </div>

        {/* Items Management */}
        <div>
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-sm font-semibold text-slate-900">
                Itens do Pedido
             </h3>
             <button
                onClick={() => setIsAdding(true)}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1"
             >
                + Adicionar Item
             </button>
          </div>

          {/* Add Item Form */}
          {isAdding && (
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4 animate-in fade-in slide-in-from-top-2">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-slate-500 mb-1">Produto</label>
                          <select
                              value={newItem.productId}
                              onChange={(e) => handleProductSelect(e.target.value)}
                              className="w-full rounded border-slate-300 text-sm p-2"
                          >
                              <option value="">Selecione...</option>
                              {products.map(p => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Qtd</label>
                          <input
                              type="number"
                              min="1"
                              value={newItem.quantity}
                              onChange={(e) => setNewItem({...newItem, quantity: Number(e.target.value)})}
                              className="w-full rounded border-slate-300 text-sm p-2"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Preço Unit.</label>
                          <input
                              type="number"
                              step="0.01"
                              value={newItem.unitPrice}
                              onChange={(e) => setNewItem({...newItem, unitPrice: Number(e.target.value)})}
                              className="w-full rounded border-slate-300 text-sm p-2"
                          />
                      </div>
                  </div>
                  <div className="mt-3">
                       <label className="block text-xs font-medium text-slate-500 mb-1">Descrição (Opcional)</label>
                       <input
                          type="text"
                          value={newItem.description}
                          onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                          className="w-full rounded border-slate-300 text-sm p-2"
                       />
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                      <button
                          onClick={() => setIsAdding(false)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
                      >
                          Cancelar
                      </button>
                      <button
                          onClick={handleAddItem}
                          disabled={!newItem.productId}
                          className="px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded hover:bg-slate-800 disabled:opacity-50"
                      >
                          Adicionar
                      </button>
                  </div>
              </div>
          )}
          
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">
                    Produto / Descrição
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">
                    Qtd
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">
                    Unit.
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">
                    Total
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-slate-500 uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {items.map((item: any) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 text-sm text-slate-900">
                      {item.description}
                    </td>
                    <td className="px-4 py-2 text-sm text-slate-900 text-right">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-2 text-sm text-slate-900 text-right">
                      {item.unitPrice.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </td>
                    <td className="px-4 py-2 text-sm text-slate-900 text-right font-medium">
                      {item.totalPrice.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </td>
                    <td className="px-4 py-2 text-center">
                        <button 
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-600 hover:text-red-800 text-xs font-medium"
                        >
                            Remover
                        </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                    <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">
                            Nenhum item no pedido.
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment & Status & Delivery */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-lg border border-slate-200">
            <div className="space-y-6">
                <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3">Status do Pedido</h3>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                        {Object.entries(STATUS_MAP).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3">Agendamento de Entrega</h3>
                    <div className="space-y-3">
                         <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Data Prevista</label>
                            <input
                                type="date"
                                value={deliveryDate}
                                onChange={(e) => setDeliveryDate(e.target.value)}
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                            />
                         </div>
                         <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Observações de Entrega</label>
                            <textarea
                                value={deliveryNotes}
                                onChange={(e) => setDeliveryNotes(e.target.value)}
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                rows={2}
                                placeholder="Detalhes da entrega..."
                            />
                         </div>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Pagamento</h3>
                <div className="space-y-3">
                    <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                        <option value="PIX">PIX</option>
                        <option value="DINHEIRO">Dinheiro</option>
                        <option value="DEBITO">Cartão de Débito</option>
                        <option value="CREDITO">Cartão de Crédito</option>
                    </select>

                    {paymentMethod === "CREDITO" && (
                        <div className="bg-white p-3 rounded border border-slate-200">
                            <label className="block text-xs font-medium text-slate-700 mb-1">Parcelas (com 2% a.m.)</label>
                            <select
                                value={installments}
                                onChange={(e) => setInstallments(Number(e.target.value))}
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                            >
                                {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
                                    <option key={n} value={n}>{n}x</option>
                                ))}
                            </select>
                            <div className="mt-2 text-right">
                                <p className="text-xs text-slate-500">Valor da Parcela:</p>
                                <p className="text-sm font-bold text-slate-900">
                                    {installmentValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">Total Final:</p>
                                <p className="text-sm font-bold text-slate-900">
                                    {totalWithInterest.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                </p>
                            </div>
                        </div>
                    )}
                    
                    {paymentMethod !== "CREDITO" && (
                        <div className="text-right pt-2">
                             <p className="text-xs text-slate-500">Total a Pagar:</p>
                             <p className="text-xl font-bold text-slate-900">
                                {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                             </p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
                onClick={handleSaveChanges}
                disabled={loading}
                className="bg-slate-900 text-white px-6 py-2 rounded-md font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
                {loading ? "Salvando..." : "Salvar Alterações"}
            </button>
        </div>
    </div>
  );
}