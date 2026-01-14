import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  const user = session.user;

  const dbUser = user?.email
    ? await prisma.user.findUnique({
        where: { email: user.email },
      })
    : null;

  const role = dbUser?.role ?? "Não definido";

  const [totalVendas, totalReceita, ordensPendentes, entregasPendentes, companyInfo] =
    await Promise.all([
      prisma.sale.count(),
      prisma.sale.aggregate({
        _sum: {
          total: true,
        },
      }),
      prisma.productionOrder.count({
        where: { status: "PENDING" },
      }),
      prisma.delivery.count({
        where: { status: "PENDING" },
      }),
      prisma.companyInfo.findUnique({ where: { id: "singleton" } }),
    ]);

  const receita = totalReceita._sum.total ?? 0;

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-4xl rounded-xl bg-white shadow-sm border border-slate-200 p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">
              Dashboard
            </h1>
            <p className="text-sm text-slate-600">
              Bem-vindo, {user?.name}. Papel: {role ?? "Não definido"}.
            </p>
          </div>
          {companyInfo?.logoUrl && (
            <img 
              src={companyInfo.logoUrl} 
              alt={companyInfo.tradeName || "Logo"} 
              className="h-16 w-auto object-contain"
            />
          )}
        </div>

        {role !== "MONTADOR" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500">Total de vendas</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {totalVendas}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500">Receita total</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {receita.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500">
                Ordens de produção pendentes
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {ordensPendentes}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500">
                Entregas pendentes
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {entregasPendentes}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          {role !== "MONTADOR" && (
            <>
              <Link
                href="/clientes"
                className="flex items-center justify-center p-4 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 font-medium transition-colors"
              >
                Gerenciar Clientes
              </Link>
              <Link
                href="/produtos"
                className="flex items-center justify-center p-4 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 font-medium transition-colors"
              >
                Gerenciar Produtos
              </Link>
              <Link
                href="/vendas"
                className="flex items-center justify-center p-4 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 font-medium transition-colors"
              >
                Gerenciar Vendas
              </Link>
              <Link
                href="/calculadora"
                className="flex items-center justify-center p-4 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-900 text-white font-medium transition-colors"
              >
                Calculadora de Aço
              </Link>
              <Link
                href="/dashboard/analise"
                className="flex items-center justify-center p-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 border border-indigo-600 text-white font-medium transition-colors"
              >
                Análise de Projetos (IA)
              </Link>
              <Link
                href="/empresa"
                className="flex items-center justify-center p-4 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 font-medium transition-colors"
              >
                Dados da Empresa
              </Link>
              <Link
                href="/usuarios"
                className="flex items-center justify-center p-4 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 font-medium transition-colors"
              >
                Gerenciar Usuários
              </Link>
            </>
          )}
          
          <Link
            href="/producao"
            className="flex items-center justify-center p-4 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 font-medium transition-colors"
          >
            Ordens de Produção
          </Link>
        </div>

        <p className="text-sm text-slate-600">
          Estes números são calculados diretamente das vendas, ordens de
          produção e entregas registradas no sistema.
        </p>
      </div>
    </div>
  );
}
