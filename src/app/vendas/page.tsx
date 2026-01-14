import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import SalesList from "./SalesList";

export default async function VendasPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const sales = await prisma.sale.findMany({
    include: {
      client: true,
      user: true,
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendas</h1>
          <p className="text-slate-600">Gerencie os pedidos de venda.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Dashboard
          </Link>
          <Link
            href="/vendas/nova"
            className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Nova Venda
          </Link>
        </div>
      </div>

      <SalesList sales={sales} />
    </div>
  );
}
