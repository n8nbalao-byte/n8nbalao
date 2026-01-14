"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Hammer, Printer, CheckCircle, Clock, AlertCircle } from "lucide-react";

type SaleItem = {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    observation?: string;
    structureType?: string;
};

type Sale = {
    id: string;
    client: { name: string };
    items: SaleItem[];
    deliveryDate?: string;
    deliveryNotes?: string;
};

type ProductionOrder = {
    id: string;
    status: string; // PENDING, IN_PROGRESS, COMPLETED
    createdAt: string;
    sale: Sale;
};

export default function ProducaoPage() {
    const [orders, setOrders] = useState<ProductionOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await fetch("/api/producao");
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (error) {
            console.error("Erro ao buscar ordens", error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const res = await fetch("/api/producao", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status: newStatus }),
            });

            if (res.ok) {
                fetchOrders();
            }
        } catch (error) {
            console.error("Erro ao atualizar status", error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PENDING": return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "IN_PROGRESS": return "bg-blue-100 text-blue-800 border-blue-200";
            case "COMPLETED": return "bg-green-100 text-green-800 border-green-200";
            default: return "bg-slate-100 text-slate-800";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "PENDING": return "Pendente";
            case "IN_PROGRESS": return "Em Produção";
            case "COMPLETED": return "Concluído";
            default: return status;
        }
    };

    const handlePrint = (order: ProductionOrder) => {
        // Simple print implementation
        window.print();
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8 print:bg-white print:p-0">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex items-center justify-between print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Hammer className="w-6 h-6" /> Ordens de Produção
                        </h1>
                        <p className="text-slate-600">Gerenciamento de montagem e produção.</p>
                    </div>
                    <Link
                        href="/dashboard"
                        className="text-sm font-medium text-slate-600 hover:text-slate-900"
                    >
                        Voltar ao Dashboard
                    </Link>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-slate-500">Carregando ordens...</div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden break-inside-avoid">
                                {/* Header */}
                                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="font-mono text-xs text-slate-500">#{order.id.slice(0, 8)}</span>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                                                {getStatusLabel(order.status)}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900">
                                            Cliente: {order.sale.client.name}
                                        </h3>
                                        <p className="text-sm text-slate-500">
                                            Criado em: {new Date(order.createdAt).toLocaleDateString()}
                                            {order.sale.deliveryDate && ` • Entrega: ${new Date(order.sale.deliveryDate).toLocaleDateString()}`}
                                        </p>
                                        {order.sale.deliveryNotes && (
                                            <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" />
                                                Obs: {order.sale.deliveryNotes}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 print:hidden">
                                        {order.status === "PENDING" && (
                                            <button
                                                onClick={() => updateStatus(order.id, "IN_PROGRESS")}
                                                className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 flex items-center gap-2"
                                            >
                                                <Clock className="w-4 h-4" /> Iniciar
                                            </button>
                                        )}
                                        {order.status === "IN_PROGRESS" && (
                                            <button
                                                onClick={() => updateStatus(order.id, "COMPLETED")}
                                                className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 flex items-center gap-2"
                                            >
                                                <CheckCircle className="w-4 h-4" /> Concluir
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handlePrint(order)}
                                            className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-200 flex items-center gap-2"
                                        >
                                            <Printer className="w-4 h-4" /> Imprimir
                                        </button>
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="p-6">
                                    <h4 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Itens para Montagem</h4>
                                    <div className="space-y-4">
                                        {order.sale.items.map((item) => (
                                            <div key={item.id} className="flex items-start justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <div>
                                                    <div className="font-medium text-slate-900">
                                                        {item.description}
                                                    </div>
                                                    {item.structureType && (
                                                        <span className="inline-block mt-1 px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] rounded uppercase font-bold tracking-wider">
                                                            {item.structureType}
                                                        </span>
                                                    )}
                                                    {item.observation && (
                                                        <p className="text-sm text-slate-600 mt-1 italic">
                                                            "{item.observation}"
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-lg font-bold text-slate-900 bg-white px-3 py-1 rounded border border-slate-200">
                                                    {item.quantity}x
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {orders.length === 0 && (
                            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center">
                                <Hammer className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-slate-900">Nenhuma ordem de produção</h3>
                                <p className="text-slate-500">As vendas finalizadas aparecerão aqui.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
