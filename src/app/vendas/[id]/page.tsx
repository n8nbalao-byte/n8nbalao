import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import SaleManagement from "./SaleManagement"; // Client Component

export default async function SaleDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      client: true,
      user: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
  });

  if (!sale) {
    notFound();
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-10">
      <div className="w-full max-w-4xl rounded-xl bg-white shadow-sm border border-slate-200 p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Venda #{sale.id.slice(0, 8)}
            </h1>
            <p className="text-sm text-slate-500">
              Realizada em {new Date(sale.createdAt).toLocaleDateString("pt-BR")} às{" "}
              {new Date(sale.createdAt).toLocaleTimeString("pt-BR")}
            </p>
          </div>
          <div className="flex gap-2">
             <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Dashboard
            </Link>
            <Link
              href="/vendas"
              className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Voltar
            </Link>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Cliente
            </h3>
            <p className="text-base font-medium text-slate-900">
              {sale.client.name}
            </p>
            <p className="text-sm text-slate-600">
              {sale.client.document}
            </p>
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Vendedor
            </h3>
            <p className="text-base font-medium text-slate-900">
              {sale.user.name}
            </p>
            <p className="text-sm text-slate-600">
              {sale.user.email}
            </p>
          </div>
        </div>

        {/* Client Management Component */}
        <SaleManagement sale={sale} products={products} />
        
      </div>
    </div>
  );
}
