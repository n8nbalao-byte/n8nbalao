import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ProductList from "./ProductList";

export default async function ProdutosPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  const produtos = await prisma.product.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen flex items-center justify-center py-10">
      <div className="w-full max-w-5xl rounded-xl bg-white shadow-sm border border-slate-200 p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Produtos
            </h1>
            <p className="text-sm text-slate-600">
              Cadastre, edite e organize produtos base e finais.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Voltar ao Dashboard
            </Link>
            <Link
              href="/produtos/novo"
              className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
            >
              Novo produto
            </Link>
          </div>
        </div>

        <ProductList products={produtos} />

      </div>
    </div>
  );
}
